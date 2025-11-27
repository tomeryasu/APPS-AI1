console.log('Script loaded');
// Looping horizontal scroll for testimonials
function startTestimonialMarquee(rowSelector, speed = 1) {
  const row = document.querySelector(rowSelector);
  if (!row) return;
  let scrollAmount = 0;
  let paused = false;
  function step() {
    if (!paused) {
      scrollAmount += speed;
      if (scrollAmount >= row.scrollWidth / 2) {
        scrollAmount = 0;
      }
      row.scrollLeft = scrollAmount;
    }
    requestAnimationFrame(step);
  }
  row.addEventListener('mouseenter', () => { paused = true; // AJAX builder functionality
  const builderForm = document.getElementById('promptForm');
  const outputContainer = document.querySelector('.output-container') || document.createElement('div');
  if (builderForm) {
    builderForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const input = builderForm.querySelector('input[name="prompt"]');
      const prompt = input.value.trim();
      if (!prompt) return;
      // Show loading
      let outputElem = document.getElementById('output');
      if (!outputElem) {
        outputContainer.className = 'output-container';
        outputElem = document.createElement('pre');
        outputElem.id = 'output';
        outputContainer.appendChild(outputElem);
        builderForm.parentNode.appendChild(outputContainer);
      }
      outputElem.textContent = 'Loading...';
      // Fetch result
      try {
        const res = await fetch('/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        const data = await res.json();
        outputElem.textContent = data.output || 'No output.';
      } catch (err) {
        outputElem.textContent = 'Error: ' + err;
      }
    });
  }
});
  row.addEventListener('mouseleave', () => { paused = false; });
  step();
}

document.addEventListener('DOMContentLoaded', function () {
  console.log('DOMContentLoaded event fired');
  startTestimonialMarquee('.testimonial-marquee-row1', 1);
  startTestimonialMarquee('.testimonial-marquee-row2', 0.7);

  // Make suggestion pills functional (event delegation, always works)
  document.body.addEventListener('click', function (e) {
    if (e.target.classList.contains('suggestion-pill')) {
      console.log('suggestion-pill clicked:', e.target.textContent.trim());
      const builderForm = document.getElementById('promptForm');
      const input = builderForm && builderForm.querySelector('input[name="prompt"]');
      if (input) {
        input.value = e.target.textContent.trim();
        input.focus();
        console.log('Suggestion clicked (delegated):', e.target.textContent.trim());
      } else {
        console.log('Builder input not found');
      }
    }
  });

  // Limitless section animation
  const limitlessBlocks = document.querySelectorAll('.limitless-block');
  if (limitlessBlocks.length === 0) {
    console.log('No .limitless-block elements found');
  }
  const observer = new window.IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  limitlessBlocks.forEach(block => observer.observe(block));

  // Pricing card animation
  const pricingCards = document.querySelectorAll('.pricing-card-animate');
  const pricingObserver = new window.IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        console.log('Pricing card animated:', entry.target);
        pricingObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  pricingCards.forEach(card => pricingObserver.observe(card));
  // DEBUG: Uncomment the next line to force the effect for testing
  // pricingCards.forEach(card => card.classList.add('visible'));

  // Fallback: add .visible on scroll if not already set
  window.addEventListener('scroll', function () {
    limitlessBlocks.forEach(block => {
      if (!block.classList.contains('visible')) {
        const rect = block.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          block.classList.add('visible');
        }
      }
    });
  });
});

// Smooth scrolling and navigation
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 NEXUS DIGITAL - JavaScript loaded successfully!");
  
  // Mobile menu toggle
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobile-menu");
  const closeMenu = document.getElementById("close-menu");

  console.log("Mobile menu elements:", { hamburger: !!hamburger, mobileMenu: !!mobileMenu, closeMenu: !!closeMenu });

  if (hamburger && mobileMenu) {
  hamburger.addEventListener("click", function () {
      mobileMenu.classList.add("open");
      document.body.style.overflow = "hidden";
    });
  }

  if (closeMenu && mobileMenu) {
    closeMenu.addEventListener("click", function () {
      mobileMenu.classList.remove("open");
      document.body.style.overflow = "";
    });
  }

  // Close mobile menu when clicking outside
  document.addEventListener("click", function(event) {
    if (mobileMenu && hamburger && !mobileMenu.contains(event.target) && !hamburger.contains(event.target)) {
      mobileMenu.classList.remove("open");
      document.body.style.overflow = "";
    }
  });

  // Header scroll effect
  const mainHeader = document.querySelector(".main-header");
  window.addEventListener("scroll", function () {
    if (window.scrollY > 50) {
      mainHeader.classList.add("header-minimal");
    } else {
      mainHeader.classList.remove("header-minimal");
    }
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href").substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        const headerHeight = mainHeader ? mainHeader.offsetHeight : 0;
        const targetPosition = targetElement.offsetTop - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });

        // Close mobile menu after clicking link
        if (mobileMenu) {
          mobileMenu.classList.remove("open");
          document.body.style.overflow = "";
        }
      }
    });
  });
// Animated counter for stats
function animateStats() {
  const counters = document.querySelectorAll(".stat-number");

  counters.forEach((counter) => {
    const target = parseInt(counter.getAttribute("data-target"));
    const isMoney = target === 15000000; // רק זה מקבל ₪

    if (!target || isNaN(target)) return;

    let current = 0;
    const increment = target / 50;

    const updateCounter = () => {
      if (current < target) {
        current += increment;
        const value = Math.floor(current).toLocaleString();
        counter.textContent = isMoney ? value + "₪" : value;
        requestAnimationFrame(updateCounter);
      } else {
        const finalValue = target.toLocaleString();
        counter.textContent = isMoney ? finalValue + "₪" : finalValue;
      }
    };

    setTimeout(updateCounter, 500);
  });
}

// Run stats animation on load
animateStats();

// Also run when stats section becomes visible
const statsSection = document.getElementById("stat");
if (statsSection) {
  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateStats();
          statsObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  statsObserver.observe(statsSection);
}

 // Intersection Observer for scroll animations
  const animationObserverOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (entry.target.hasAttribute("data-aos")) {
          entry.target.classList.add("aos-animate");
        }

        // Special animations for specific elements
        if (entry.target.classList.contains("service-card")) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }

        if (entry.target.classList.contains("advanced-item")) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateX(0)";
        }

        if (entry.target.classList.contains("category-item")) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }

        if (entry.target.classList.contains("client-card")) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      }
    });
  }, animationObserverOptions);

  // Observe all animated elements
  document.querySelectorAll("[data-aos]").forEach((el) => observer.observe(el));
  document.querySelectorAll(".service-card").forEach((el) => observer.observe(el));
  document.querySelectorAll(".advanced-item").forEach((el) => observer.observe(el));
  document.querySelectorAll(".category-item").forEach((el) => observer.observe(el));
  document.querySelectorAll(".client-card").forEach((el) => observer.observe(el));

  // Contact form handling
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function(e) {
      e.preventDefault();

      // Get form data
      const formData = new FormData(this);
      const data = Object.fromEntries(formData);

      // Here you would typically send the data to your server
      console.log("Form submitted:", data);
      
      // Show success message (you can customize this)
      alert("תודה! נציג יצור איתך קשר בהקדם.");
      
      // Reset form
      this.reset();
    });
  }

  // Sticky contact button
  const stickyContactBtn = document.getElementById("stickyContactBtn");
  if (stickyContactBtn) {
    window.addEventListener("scroll", function() {
      if (window.scrollY > 300) {
        stickyContactBtn.classList.add("show");
      } else {
        stickyContactBtn.classList.remove("show");
      }
    });

    stickyContactBtn.addEventListener("click", function() {
      const contactSection = document.getElementById("contact");
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // Contact button functionality
  document.querySelectorAll('.contact-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const contactSection = document.getElementById('contact');
    if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Add simple fade-in animations for elements when they come into view
  const fadeElements = document.querySelectorAll('.service-card, .advanced-item, .category-item, .client-card');
  const fadeObserver = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, { threshold: 0.1 });

  fadeElements.forEach(el => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = "all 0.6s ease";
    fadeObserver.observe(el);
  });
});

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Handle window resize
window.addEventListener("resize", debounce(function() {
  // Reinitialize any responsive elements if needed
}, 250));
