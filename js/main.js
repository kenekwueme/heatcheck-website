/**
 * HEAT CHECK - CORE JAVASCRIPT
 */

document.addEventListener("DOMContentLoaded", () => {
  initScrollReveals();
  initCounterAnimations();
  initParallax();
  initInteractiveHero();
});

/**
 * Initializes IntersectionObserver to reveal elements on scroll.
 */
function initScrollReveals() {
  const reveals = document.querySelectorAll(".reveal");

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          observer.unobserve(entry.target); // Only animate once
        }
      });
    },
    {
      root: null,
      threshold: 0.15,
      rootMargin: "0px 0px -50px 0px",
    }
  );

  reveals.forEach((element) => {
    revealObserver.observe(element);
  });
}

/**
 * Animates numerical counters when they scroll into view.
 */
function initCounterAnimations() {
  const counters = document.querySelectorAll(".stat-counter");
  let hasAnimated = false;

  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.classList.contains("counted")) {
          animateValue(entry.target);
          entry.target.classList.add("counted");
        }
      });
    },
    { root: null, threshold: 0.5 }
  );

  counters.forEach((counter) => counterObserver.observe(counter));
}

/**
 * Core counter animation logic
 */
function animateValue(obj) {
  const target = parseInt(obj.getAttribute("data-target"), 10);
  const duration = 2000; // 2 seconds
  let startTimestamp = null;

  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    
    // Ease-out cubic formula
    const easeOutCubic = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.floor(easeOutCubic * target);
    
    obj.innerHTML = currentValue.toLocaleString();
    
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      obj.innerHTML = target.toLocaleString();
    }
  };
  window.requestAnimationFrame(step);
}

/**
 * Subtly animate parallax elements on scroll
 */
function initParallax() {
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    
    // Simple vertical parallax on hero
    const heroImage = document.querySelector('.hero-parallax-img');
    if (heroImage) {
      // Move slower than scroll speed
      heroImage.style.transform = `translateY(${scrollY * 0.4}px)`;
    }
  });
}

/**
 * Interactive HEAT Hero Logic
 */
function initInteractiveHero() {
  const container = document.querySelector('.heat-container');
  const letters = document.querySelectorAll('.heat-letter');
  const heroSection = document.querySelector('.interactive-hero');
  
  if (!container || !letters.length) return;

  letters.forEach(letter => {
    // Mouse interaction
    letter.addEventListener('mouseenter', () => {
      letters.forEach(l => l.classList.remove('active'));
      letter.classList.add('active');
      container.classList.add('has-hover');
      heroSection.classList.add('has-active');
    });

    // Touch interaction for mobile
    letter.addEventListener('touchstart', (e) => {
      if (!letter.classList.contains('active')) {
        // Prevent default link behavior on first tap to show the hover state
        e.preventDefault(); 
        letters.forEach(l => l.classList.remove('active'));
        letter.classList.add('active');
        container.classList.add('has-hover');
        heroSection.classList.add('has-active');
      }
    });
  });

  // Reset when leaving the container (desktop)
  container.addEventListener('mouseleave', () => {
    letters.forEach(l => l.classList.remove('active'));
    container.classList.remove('has-hover');
    heroSection.classList.remove('has-active');
  });
}
