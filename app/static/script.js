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
