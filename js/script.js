
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior:'smooth', block:'start' });
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