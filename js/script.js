
// Global variables
let lenis;

// Initialization Functions
function initLenis() {
  if (lenis) lenis.destroy();

  lenis = new Lenis({
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

}

function initScrollEffects() {
  const nav = document.getElementById('navbar');
  if (!nav) return;


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
      const href = link.getAttribute('href');
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target);
      }
    });
  });
}

function initObservers() {
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
}

function initTypewriter() {
  const textElement = document.getElementById('typewriter');
  if (textElement) {
    const phrases = ["digital world", "iQor", "mind & soul", "local NGOs"];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;
    let timeoutId;

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

      timeoutId = setTimeout(type, typeSpeed);
    }

    type();

  }
}

// Preloader Animation
function runPreloader() {
  const tl = gsap.timeline();

  tl.to('.preloader', {
    autoAlpha: 1,
    duration: 0
  })
    .to('.text-wrap span', {
      y: '0%',
      duration: 1,
      ease: 'power4.out',
      stagger: 0.2
    })
    .to('.text-wrap span', {
      y: '-100%',
      duration: 0.8,
      ease: 'power4.in',
      delay: 0.5
    })
    .to('.preloader-overlay', {
      height: 0,
      duration: 0.8,
      ease: 'power4.inOut'
    }, '-=0.4')
    .to('.preloader', {
      autoAlpha: 0,
      duration: 0
    });
}

barba.init({
  sync: true,
  debug: true,
  transitions: [
    {
      name: 'to-cv',
      to: {
        namespace: ['cv']
      },
      leave(data) {
        return gsap.timeline()
          .to(data.current.container, {
            opacity: 0,
            duration: 0.5
          })
          .to('.preloader', {
            autoAlpha: 1,
            duration: 0.1
          }, "<")
          .fromTo('.preloader-overlay',
            { height: '0%' },
            { height: '100%', duration: 0.6, ease: 'power2.inOut' }
          )
          .fromTo('.text-wrap span',
            { y: '100%' },
            { y: '0%', duration: 0.6, ease: 'power2.out' }
          );
      },
      enter(data) {
        window.scrollTo(0, 0);
        return gsap.timeline()
          .to('.text-wrap span', {
            y: '-100%',
            duration: 0.6,
            ease: 'power2.in',
            delay: 0.2
          })
          .to('.preloader-overlay', {
            height: '0%',
            duration: 0.6,
            ease: 'power2.inOut'
          }, "-=0.3")
          .to('.preloader', {
            autoAlpha: 0,
            duration: 0.1
          })
          .from(data.next.container, {
            opacity: 0,
            y: 50,
            duration: 0.8,
            ease: "power2.out"
          }, "-=0.4");
      }
    },
    {
      name: 'default',
      leave(data) {
        return gsap.to(data.current.container, {
          opacity: 0,
          duration: 0.5
        });
      },
      enter(data) {
        window.scrollTo(0, 0);
        return gsap.from(data.next.container, {
          opacity: 0,
          duration: 0.5
        });
      }
    }
  ],
  views: [
    {
      namespace: 'home',
      afterEnter(data) {
        initLenis();
        initScrollEffects();
        initObservers();
        initTypewriter();
      }
    },
    {
      namespace: 'cv',
      afterEnter(data) {
        initLenis();
        initScrollEffects();
        initObservers();
      }
    }
  ]
});

document.addEventListener('DOMContentLoaded', () => {
  runPreloader();

  initLenis();
  initScrollEffects();
  initObservers();
  initTypewriter();
});