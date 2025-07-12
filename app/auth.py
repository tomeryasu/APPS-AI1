import os
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
print("DATABASE_URL:", os.getenv("DATABASE_URL"))
import sqlite3
from passlib.context import CryptContext

DB_URL = os.getenv("DATABASE_URL")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Determine backend: SQLite if DB_URL is not set or starts with 'sqlite', else PostgreSQL
USE_SQLITE = not DB_URL or DB_URL.startswith('sqlite')

if not DB_URL:
    DB_URL = "app/users.db"  # Default SQLite path

if not USE_SQLITE:
    import psycopg
    try:
        import psycopg2
    except ImportError:
        psycopg2 = None

def get_conn():
    if USE_SQLITE:
        return sqlite3.connect(DB_URL.replace('sqlite:///',''))
    else:
        return psycopg.connect(DB_URL)

def init_db():
    conn = get_conn()
    c = conn.cursor()
    if USE_SQLITE:
        c.execute('''CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )''')
    else:
        c.execute('''CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )''')
    conn.commit()
    c.close()
    conn.close()

def create_user(name: str, email: str, password: str) -> bool:
    hashed = pwd_context.hash(password)
    try:
        conn = get_conn()
        c = conn.cursor()
        if USE_SQLITE:
            c.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', (name, email, hashed))
        else:
            c.execute('INSERT INTO users (name, email, password) VALUES (%s, %s, %s)', (name, email, hashed))
        conn.commit()
        c.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error in create_user: {e}")
        return False

def verify_user(email: str, password: str) -> bool:
    conn = get_conn()
    c = conn.cursor()
    if USE_SQLITE:
        c.execute('SELECT password FROM users WHERE email = ?', (email,))
    else:
        c.execute('SELECT password FROM users WHERE email = %s', (email,))
    row = c.fetchone()
    c.close()
    conn.close()
    if row and pwd_context.verify(password, row[0]):
        return True
    return False
