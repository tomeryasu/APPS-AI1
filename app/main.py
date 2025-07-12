from fastapi import FastAPI, Form, Request, Body
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os
import requests
from dotenv import load_dotenv
import uuid
from app.codegen.util import generate_flask_app_structure, zip_app_directory
import traceback
from app.auth import init_db, create_user, verify_user
from fastapi import status
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
import os

# Explicitly load .env from the project root
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

OPENROUTER_API_KEY = "sk-PASTE-YOUR-KEY-HERE"  # <-- Replace with your actual OpenRouter API key
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "meta-llama/llama-3-70b-instruct"

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")
templates = Jinja2Templates(directory="app/templates")

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/login", response_class=HTMLResponse)
async def login_get(request: Request):
    return templates.TemplateResponse("login.html", {"request": request, "error": None})

@app.post("/login", response_class=HTMLResponse)
async def login_post(request: Request):
    form = await request.form()
    email = form.get("email")
    password = form.get("password")
    print(f"LOGIN ATTEMPT: email={email}, password={password}")
    result = verify_user(email, password)
    print(f"verify_user result: {result}")
    if result:
        response = RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)
        response.set_cookie(key="user", value=email, httponly=True)
        print("Login successful, setting cookie and redirecting.")
        return response
    else:
        print("Login failed: Invalid credentials.")
        return templates.TemplateResponse("login.html", {"request": request, "error": "Invalid credentials"})

@app.get("/signup", response_class=HTMLResponse)
async def signup_get(request: Request):
    return templates.TemplateResponse("signup.html", {"request": request, "error": None})

@app.post("/signup", response_class=HTMLResponse)
async def signup_post(request: Request):
    form = await request.form()
    name = form.get("name")
    email = form.get("email")
    password = form.get("password")
    confirm_password = form.get("confirm_password")
    if password != confirm_password:
        return templates.TemplateResponse("signup.html", {"request": request, "error": "Passwords do not match"})
    if create_user(name, email, password):
        return RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)
    else:
        return templates.TemplateResponse("signup.html", {"request": request, "error": "Email already registered"})

# Removed duplicate login and signup routes

@app.get("/logout")
async def logout(request: Request):
    response = RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)
    response.delete_cookie(key="user")
    return response

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    user = request.cookies.get("user")
    if not user:
        return RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)
    return templates.TemplateResponse("dashboard.html", {"request": request, "user": user})

import sqlite3

@app.get("/", response_class=HTMLResponse)
async def read_form(request: Request):
    user_email = request.cookies.get("user")
    user_name = None
    if user_email:
        try:
            conn = sqlite3.connect("app/users.db")
            c = conn.cursor()
            c.execute("SELECT name FROM users WHERE email = ?", (user_email,))
            row = c.fetchone()
            if row:
                user_name = row[0]
            conn.close()
        except Exception as e:
            print(f"Error fetching user name: {e}")
    return templates.TemplateResponse("index.html", {"request": request, "output": "", "user": user_email, "user_name": user_name})

@app.post("/", response_class=HTMLResponse)
async def generate_app(request: Request, prompt: str = Form(...)):
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [{"role": "user", "content": f"Build this app: {prompt}"}]
    }
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    res = requests.post(OPENROUTER_API_URL, json=payload, headers=headers)
    data = res.json()
    output = data["choices"][0]["message"]["content"] if "choices" in data and data["choices"] else ""
    return templates.TemplateResponse("index.html", {"request": request, "output": output})

@app.post("/generate")
async def generate_app_json(data: dict = Body(...)):
    prompt = data.get("prompt", "")
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [{"role": "user", "content": f"Build this app: {prompt}"}]
    }
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    res = requests.post(OPENROUTER_API_URL, json=payload, headers=headers)
    data = res.json()
    output = data["choices"][0]["message"]["content"] if "choices" in data and data["choices"] else ""
    return JSONResponse({"output": output})

@app.get("/editor", response_class=HTMLResponse)
async def editor(request: Request):
    return templates.TemplateResponse("editor.html", {"request": request})

@app.post("/ai-chat")
async def ai_chat(data: dict = Body(...)):
    user_message = data.get("message", "")
    # Instruct the model to generate a minimal HTML+CSS+JS web app for the prompt
    ai_prompt = f"Generate a minimal HTML+CSS+JS web app for: {user_message}. Only return the HTML code."
    payload = {
        "model": "phi",  # switched to phi for faster, free local inference
        "prompt": ai_prompt,
        "stream": False
    }
    try:
        res = requests.post("http://localhost:11434/api/generate", json=payload, timeout=120)
        if res.status_code != 200:
            error_msg = f"[Ollama error] Status {res.status_code}: {res.text}"
            return JSONResponse({"reply": error_msg, "preview_html": ""}, status_code=500)
        data = res.json()
        print("/ai-chat Ollama response:", data)
        reply = data.get("response", "[No reply from Ollama]")
        preview_html = reply
        if preview_html.strip().startswith("<"):
            pass
        elif "<html" in preview_html:
            preview_html = preview_html[preview_html.find("<html") : ]
        elif "<body" in preview_html:
            preview_html = preview_html[preview_html.find("<body") : ]
        elif "```" in preview_html:
            preview_html = preview_html.replace("```html", "").replace("```", "").strip()
    except requests.exceptions.Timeout:
        return JSONResponse({"reply": "[Ollama error] Request timed out. Try a shorter or simpler prompt.", "preview_html": ""}, status_code=504)
    except Exception as e:
        return JSONResponse({"reply": f"[Ollama error] {str(e)}", "preview_html": ""}, status_code=500)
    return {"reply": reply, "preview_html": preview_html}

@app.post("/build")
async def build_app(data: dict = Body(...)):
    try:
        print("/build called with data:", data)
        prompt = data.get("prompt", "")
        print("Prompt:", prompt)
        # Generate Flask app.py
        print("Calling OpenAI for app.py...")
        # Generate Flask app.py
        payload_app = {
            "model": OPENROUTER_MODEL,
            "messages": [{"role": "user", "content": f"Generate a minimal Flask app.py for: {prompt}. Use render_template for index.html."}]
        }
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        app_py_res = requests.post(OPENROUTER_API_URL, json=payload_app, headers=headers)
        app_py_data = app_py_res.json()
        app_py = app_py_data["choices"][0]["message"]["content"] if "choices" in app_py_data and app_py_data["choices"] else ""
        print("app.py generated.")
        # Generate index.html
        print("Calling OpenRouter for index.html...")
        payload_html = {
            "model": OPENROUTER_MODEL,
            "messages": [{"role": "user", "content": f"Generate a minimal HTML for the main page of this Flask app: {prompt}. Only the HTML body, no Flask code."}]
        }
        html_res = requests.post(OPENROUTER_API_URL, json=payload_html, headers=headers)
        html_data = html_res.json()
        html = html_data["choices"][0]["message"]["content"] if "choices" in html_data and html_data["choices"] else ""
        print("index.html generated.")
        # Save files
        app_id = str(uuid.uuid4())
        print("Saving files to:", app_id)
        app_path = generate_flask_app_structure(app_id, app_py, html)
        print("Files saved.")
        zip_path = zip_app_directory(app_path)
        print("App zipped at:", zip_path)
        zip_filename = os.path.basename(zip_path)
        download_url = f"/download/{zip_filename}"
        print("Returning download URL:", download_url)
        return JSONResponse({"download_url": download_url})
    except Exception as e:
        print("/build error:", e)
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/download/{zip_filename}")
async def download_zip(zip_filename: str):
    from fastapi.responses import FileResponse
    zip_path = f"app/codegen/{zip_filename.replace('.zip','')}.zip"
    return FileResponse(zip_path, filename=zip_filename, media_type='application/zip')
