// Initialize Lenis
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

const nav = document.getElementById('navbar');
lenis.on('scroll', ({ scroll, limit, velocity }) => {
  nav.classList.toggle('scrolled', scroll > 40);

  const heroContent = document.querySelector('.hero-content');
  const heroGrid = document.querySelector('.hero-grid');
  const orbs = document.querySelectorAll('.orb');

  if (heroContent) {
    heroContent.style.transform = `translateY(${scroll * 0.3}px)`;
    heroContent.style.opacity = 1 - (scroll / 700);
  }
  if (heroGrid) {
    heroGrid.style.transform = `translateY(${scroll * 0.5}px)`;
  }

  if (orbs.length) {
    orbs.forEach((orb, i) => {
      if (orb.closest('.hero')) {
        orb.style.marginTop = `${scroll * (0.1 + i * 0.05)}px`;
      }
    });
  }
});


document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      lenis.scrollTo(target);
    }
  });
});

const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 100);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

reveals.forEach(el => observer.observe(el));

const cardGroups = ['.skills-grid', '.writing-grid'];
cardGroups.forEach(selector => {
  const container = document.querySelector(selector);
  if (!container) return;
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const cards = entry.target.querySelectorAll('.reveal');
        cards.forEach((card, i) => {
          setTimeout(() => card.classList.add('visible'), i * 120);
        });
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  cardObserver.observe(container);
});

const textElement = document.getElementById('typewriter');
if (textElement) {
  const phrases = ["digital world", "iQor", "mind & soul", "local NGOs"];
  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typeSpeed = 100;

  function type() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      textElement.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
      typeSpeed = 50;
    } else {
      textElement.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
      typeSpeed = 150;
    }

    if (!isDeleting && charIndex === currentPhrase.length) {
      isDeleting = true;
      typeSpeed = 2000;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      typeSpeed = 500;
    }

    setTimeout(type, typeSpeed);
  }

  document.addEventListener('DOMContentLoaded', type);
}