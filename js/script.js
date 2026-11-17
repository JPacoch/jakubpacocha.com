// --- EXPLICIT FINITE STATE MACHINE ENGINE FOR VANILLA JS MODULES (UX + DX + AX) ---
window.__APP_MACHINES__ = window.__APP_MACHINES__ || {};

function createMachine(config) {
  const history = [];
  const subscribers = new Set();

  let state = {
    value: typeof config.initial === 'function' ? config.initial() : config.initial,
    context: typeof config.context === 'function' ? config.context() : (config.context || {})
  };

  function getAvailableEvents(stateValue) {
    const stateNode = config.states && config.states[stateValue];
    const localEvents = stateNode && stateNode.on ? Object.keys(stateNode.on) : [];
    const globalEvents = config.on ? Object.keys(config.on) : [];
    return Array.from(new Set([...localEvents, ...globalEvents]));
  }

  function send(event) {
    const eventObj = typeof event === 'string' ? { type: event } : (event || { type: 'NOOP' });
    const prev = state;

    if (eventObj.type === '@@RESET') {
      state = {
        value: typeof config.initial === 'function' ? config.initial() : config.initial,
        context: typeof config.context === 'function' ? config.context() : (config.context || {})
      };
    } else {
      const stateNode = config.states && config.states[prev.value];
      const handler =
        (stateNode && stateNode.on && stateNode.on[eventObj.type]) ||
        (config.on && config.on[eventObj.type]);

      if (!handler) return state;

      let nextValue = prev.value;
      let nextContext = prev.context;

      if (typeof handler === 'string') {
        nextValue = handler;
      } else if (typeof handler === 'function') {
        const next = handler(prev.context, eventObj, prev.value);
        if (!next) return state;
        nextValue = next.target || prev.value;
        nextContext = next.context !== undefined ? next.context : prev.context;
      } else if (typeof handler === 'object') {
        nextValue = handler.target || prev.value;
        nextContext = handler.reduce ? handler.reduce(prev.context, eventObj, prev.value) : prev.context;
      }

      if (nextValue === prev.value && nextContext === prev.context) {
        return state;
      }

      state = { value: nextValue, context: nextContext };
    }

    const record = {
      id: config.id,
      timestamp: new Date().toISOString(),
      event: eventObj.type,
      from: prev.value,
      to: state.value
    };
    history.push(record);
    if (history.length > 25) history.shift();

    subscribers.forEach((fn) => {
      try {
        fn(state, record);
      } catch (err) {
        console.error(err);
      }
    });

    return state;
  }

  const service = {
    id: config.id,
    states: Object.keys(config.states || {}),
    send,
    reset: () => send({ type: '@@RESET' }),
    can: (eventType) => getAvailableEvents(state.value).includes(eventType),
    getSnapshot: () => ({
      id: config.id,
      state: state.value,
      context: state.context,
      states: Object.keys(config.states || {}),
      availableEvents: getAvailableEvents(state.value)
    }),
    subscribe: (fn) => {
      if (typeof fn !== 'function') return () => {};
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    }
  };

  Object.defineProperties(service, {
    state: { get: () => state.value, enumerable: true },
    context: { get: () => state.context, enumerable: true },
    availableEvents: { get: () => getAvailableEvents(state.value), enumerable: true },
    history: { get: () => history.slice(), enumerable: true }
  });

  if (config.id) {
    window.__APP_MACHINES__[config.id] = service;
  }

  return service;
}

// --- 1. LENIS SMOOTH SCROLL & NAVBAR ELEVATION STATE MACHINE ---
let lenis = null;
let lenisRafId = null;

const lenisMachine = createMachine({
  id: 'lenisScroll',
  initial: 'uninitialized',
  context: () => ({
    scroll: 0,
    elevation: 'top'
  }),
  on: {
    DESTROY: (ctx) => ({
      target: 'destroyed',
      context: { ...ctx, scroll: 0, elevation: 'top' }
    })
  },
  states: {
    uninitialized: {
      on: {
        INIT: 'running'
      }
    },
    running: {
      on: {
        SCROLL: (ctx, event) => {
          const nextElevation = event.scroll > 40 ? 'scrolled' : 'top';
          return {
            target: 'running',
            context: {
              ...ctx,
              scroll: event.scroll,
              elevation: nextElevation
            }
          };
        },
        PAUSE: 'paused'
      }
    },
    paused: {
      on: {
        RESUME: 'running'
      }
    },
    destroyed: {
      on: {
        INIT: 'running'
      }
    }
  }
});

function initLenis() {
  if (lenisRafId !== null) {
    cancelAnimationFrame(lenisRafId);
    lenisRafId = null;
  }
  if (lenis) {
    lenis.destroy();
    lenis = null;
    lenisMachine.send('DESTROY');
  }

  if (typeof Lenis === 'undefined') return;

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

  lenisMachine.send('INIT');

  function raf(time) {
    if (!lenis) return;
    lenis.raf(time);
    lenisRafId = requestAnimationFrame(raf);
  }

  lenisRafId = requestAnimationFrame(raf);
}

function initScrollEffects() {
  const nav = document.getElementById('navbar');
  if (!nav || !lenis) return;

  lenis.on('scroll', ({ scroll }) => {
    const prevElevation = lenisMachine.context.elevation;
    lenisMachine.send({ type: 'SCROLL', scroll });
    const nextElevation = lenisMachine.context.elevation;

    if (prevElevation !== nextElevation) {
      nav.classList.toggle('scrolled', nextElevation === 'scrolled');
      nav.setAttribute('data-elevation', nextElevation);
    }

    const heroContent = document.querySelector('.hero-content');
    const heroGrid = document.querySelector('.hero-grid');
    const orbs = document.querySelectorAll('.orb');

    if (heroContent) {
      heroContent.style.transform = `translateY(${scroll * 0.3}px)`;
      heroContent.style.opacity = Math.max(0, 1 - (scroll / 700));
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
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target && lenis) {
        e.preventDefault();
        lenis.scrollTo(target);
      }
    });
  });
}

// --- 2. INTERSECTION REVEAL OBSERVER STATE MACHINE ---
let activeObservers = [];

const revealMachine = createMachine({
  id: 'revealObserver',
  initial: 'idle',
  context: () => ({
    totalTargets: 0,
    revealedCount: 0
  }),
  states: {
    idle: {
      on: {
        OBSERVE: (_ctx, event) => ({
          target: 'observing',
          context: { totalTargets: event.total || 0, revealedCount: 0 }
        })
      }
    },
    observing: {
      on: {
        OBSERVE: (_ctx, event) => ({
          target: 'observing',
          context: { totalTargets: event.total || 0, revealedCount: 0 }
        }),
        ELEMENT_REVEALED: (ctx) => {
          const nextCount = ctx.revealedCount + 1;
          return {
            target: nextCount >= ctx.totalTargets && ctx.totalTargets > 0 ? 'completed' : 'observing',
            context: { ...ctx, revealedCount: nextCount }
          };
        }
      }
    },
    completed: {
      on: {
        OBSERVE: (_ctx, event) => ({
          target: 'observing',
          context: { totalTargets: event.total || 0, revealedCount: 0 }
        })
      }
    }
  }
});

function initObservers() {
  activeObservers.forEach(obs => obs.disconnect());
  activeObservers = [];

  const reveals = document.querySelectorAll('.reveal');
  revealMachine.send({ type: 'OBSERVE', total: reveals.length });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        entry.target.setAttribute('data-reveal-state', 'staggering');
        setTimeout(() => {
          entry.target.classList.add('visible');
          entry.target.setAttribute('data-reveal-state', 'visible');
          revealMachine.send('ELEMENT_REVEALED');
        }, i * 100);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(el => {
    el.setAttribute('data-reveal-state', 'hidden');
    observer.observe(el);
  });
  activeObservers.push(observer);

  const cardGroups = ['.skills-grid', '.writing-grid'];
  cardGroups.forEach(selector => {
    const container = document.querySelector(selector);
    if (!container) return;
    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const cards = entry.target.querySelectorAll('.reveal');
          cards.forEach((card, i) => {
            setTimeout(() => {
              card.classList.add('visible');
              card.setAttribute('data-reveal-state', 'visible');
            }, i * 120);
          });
          cardObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    cardObserver.observe(container);
    activeObservers.push(cardObserver);
  });
}

// --- 3. TYPEWRITER FINITE STATE MACHINE ---
const TYPEWRITER_PHRASES = ['digital world', 'iQor', 'mind & soul', 'local NGOs'];
const TYPEWRITER_DELAYS = {
  typing: 150,
  holdingPhrase: 2000,
  deleting: 50,
  holdingEmpty: 500
};

let typewriterTimeoutId = null;

const typewriterMachine = createMachine({
  id: 'typewriter',
  initial: 'idle',
  context: () => ({
    phrases: TYPEWRITER_PHRASES,
    phraseIndex: 0,
    charIndex: 0,
    text: ''
  }),
  on: {
    STOP: 'idle'
  },
  states: {
    idle: {
      on: {
        START: () => ({
          target: 'typing',
          context: {
            phrases: TYPEWRITER_PHRASES,
            phraseIndex: 0,
            charIndex: 0,
            text: ''
          }
        })
      }
    },
    typing: {
      on: {
        STEP: (ctx) => {
          const currentPhrase = ctx.phrases[ctx.phraseIndex];
          const nextCharIndex = ctx.charIndex + 1;
          const nextText = currentPhrase.substring(0, nextCharIndex);
          const reachedEnd = nextCharIndex >= currentPhrase.length;
          return {
            target: reachedEnd ? 'holdingPhrase' : 'typing',
            context: {
              ...ctx,
              charIndex: nextCharIndex,
              text: nextText
            }
          };
        }
      }
    },
    holdingPhrase: {
      on: {
        STEP: 'deleting'
      }
    },
    deleting: {
      on: {
        STEP: (ctx) => {
          const currentPhrase = ctx.phrases[ctx.phraseIndex];
          const nextCharIndex = Math.max(0, ctx.charIndex - 1);
          const nextText = currentPhrase.substring(0, nextCharIndex);
          const reachedStart = nextCharIndex === 0;
          return {
            target: reachedStart ? 'holdingEmpty' : 'deleting',
            context: {
              ...ctx,
              charIndex: nextCharIndex,
              text: nextText
            }
          };
        }
      }
    },
    holdingEmpty: {
      on: {
        STEP: (ctx) => ({
          target: 'typing',
          context: {
            ...ctx,
            phraseIndex: (ctx.phraseIndex + 1) % ctx.phrases.length,
            charIndex: 0,
            text: ''
          }
        })
      }
    }
  }
});

function initTypewriter() {
  if (typewriterTimeoutId !== null) {
    clearTimeout(typewriterTimeoutId);
    typewriterTimeoutId = null;
  }

  const textElement = document.getElementById('typewriter');
  if (!textElement) {
    typewriterMachine.send('STOP');
    return;
  }

  typewriterMachine.send('START');

  function scheduleNextStep() {
    const currentState = typewriterMachine.state;
    if (currentState === 'idle') return;

    const delay = TYPEWRITER_DELAYS[currentState] || 150;
    typewriterTimeoutId = setTimeout(() => {
      const next = typewriterMachine.send('STEP');
      textElement.textContent = next.context.text;
      textElement.setAttribute('data-state', next.value);
      scheduleNextStep();
    }, delay);
  }

  scheduleNextStep();
}

// --- 4. THEME TOGGLE RADIAL TRANSITION STATE MACHINE ---
let themeToggleBound = false;

const themeToggleMachine = createMachine({
  id: 'themeToggle',
  initial: 'idle',
  context: () => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null;
    const isLightDom = document.documentElement.getAttribute('data-theme') === 'light';
    const initialTheme = saved === 'light' || saved === 'dark' ? saved : (isLightDom ? 'light' : 'dark');
    return {
      theme: initialTheme,
      targetTheme: null,
      originX: 0,
      originY: 0,
      progress: 0
    };
  },
  states: {
    idle: {
      on: {
        START_TRANSITION: (ctx, event) => {
          const nextTheme = ctx.theme === 'light' ? 'dark' : 'light';
          return {
            target: 'expanding',
            context: {
              ...ctx,
              targetTheme: nextTheme,
              originX: event.originX || 0,
              originY: event.originY || 0,
              progress: 0
            }
          };
        }
      }
    },
    expanding: {
      on: {
        COMMIT_THEME: (ctx) => ({
          target: 'themeSwapped',
          context: {
            ...ctx,
            theme: ctx.targetTheme || ctx.theme,
            progress: 0.55
          }
        })
      }
    },
    themeSwapped: {
      on: {
        START_FADE: (ctx) => ({
          target: 'fadingOut',
          context: { ...ctx, progress: 1 }
        })
      }
    },
    fadingOut: {
      on: {
        COMPLETE: (ctx) => ({
          target: 'idle',
          context: {
            ...ctx,
            targetTheme: null,
            progress: 0
          }
        })
      }
    }
  }
});

function applyDomTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    root.removeAttribute('data-theme');
  }
  root.setAttribute('data-theme-state', themeToggleMachine.state);
  try {
    localStorage.setItem('theme', theme);
  } catch (_e) {
    // Ignore storage errors in restricted environments
  }
}

function initThemeToggle() {
  applyDomTheme(themeToggleMachine.context.theme);

  if (themeToggleBound) return;
  themeToggleBound = true;

  document.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('.theme-toggle');
    if (!toggleBtn || themeToggleMachine.state !== 'idle') return;

    const rect = toggleBtn.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    const isLight = themeToggleMachine.context.theme === 'light';
    const nextBg = isLight ? [10, 10, 12] : [245, 245, 247];

    themeToggleMachine.send({
      type: 'START_TRANSITION',
      originX,
      originY
    });

    const maxR = Math.hypot(
      Math.max(originX, window.innerWidth - originX),
      Math.max(originY, window.innerHeight - originY)
    );

    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.cssText = `
      position: fixed; top: 0; left: 0;
      width: 100%; height: 100%;
      z-index: 99998; pointer-events: none;
    `;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const DURATION = 700;
    const FEATHER = 0.18;
    let start = null;

    function ease(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function tick(ts) {
      if (!start) start = ts;
      const raw = Math.min((ts - start) / DURATION, 1);
      const t = ease(raw);
      const r = t * maxR;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const featherPx = FEATHER * maxR;
      const inner = Math.max(0, r - featherPx);
      const grad = ctx.createRadialGradient(originX, originY, inner, originX, originY, r);
      const [R, G, B] = nextBg;
      grad.addColorStop(0, `rgba(${R},${G},${B},1)`);
      grad.addColorStop(1, `rgba(${R},${G},${B},0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(originX, originY, r, 0, Math.PI * 2);
      ctx.fill();

      if (themeToggleMachine.state === 'expanding' && raw >= 0.55) {
        const swapped = themeToggleMachine.send('COMMIT_THEME');
        applyDomTheme(swapped.context.theme);
      }

      if (raw < 1) {
        requestAnimationFrame(tick);
      } else {
        themeToggleMachine.send('START_FADE');
        const FADE = 300;
        let fadeStart = null;

        function fadeTick(ts2) {
          if (!fadeStart) fadeStart = ts2;
          const opacity = 1 - Math.min((ts2 - fadeStart) / FADE, 1);
          canvas.style.opacity = opacity;
          if (opacity > 0) {
            requestAnimationFrame(fadeTick);
          } else {
            canvas.remove();
            themeToggleMachine.send('COMPLETE');
            document.documentElement.setAttribute('data-theme-state', themeToggleMachine.state);
          }
        }
        requestAnimationFrame(fadeTick);
      }
    }

    requestAnimationFrame(tick);
  });
}

// --- 5. PRELOADER & BARBA PAGE TRANSITION STATE MACHINE ---
const pageTransitionMachine = createMachine({
  id: 'pageTransition',
  initial: 'preloading',
  context: () => ({
    namespace: 'home',
    transitionName: 'initial'
  }),
  states: {
    preloading: {
      on: {
        PRELOAD_COMPLETE: 'idle'
      }
    },
    idle: {
      on: {
        LEAVE_START: (ctx, event) => ({
          target: 'leaving',
          context: { ...ctx, transitionName: event.name || 'default' }
        })
      }
    },
    leaving: {
      on: {
        ENTER_START: (ctx, event) => ({
          target: 'entering',
          context: { ...ctx, namespace: event.namespace || ctx.namespace }
        })
      }
    },
    entering: {
      on: {
        TRANSITION_COMPLETE: (ctx, event) => ({
          target: 'idle',
          context: { ...ctx, namespace: event.namespace || ctx.namespace }
        })
      }
    }
  }
});

function runPreloader() {
  if (typeof gsap === 'undefined') {
    pageTransitionMachine.send('PRELOAD_COMPLETE');
    return;
  }

  const tl = gsap.timeline({
    onComplete: () => {
      pageTransitionMachine.send('PRELOAD_COMPLETE');
    }
  });

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

if (typeof barba !== 'undefined') {
  barba.init({
    sync: true,
    debug: false,
    transitions: [
      {
        name: 'to-cv',
        to: {
          namespace: ['cv']
        },
        leave(data) {
          pageTransitionMachine.send({ type: 'LEAVE_START', name: 'to-cv' });
          return gsap.timeline()
            .to(data.current.container, {
              opacity: 0,
              duration: 0.5
            })
            .to('.preloader', {
              autoAlpha: 1,
              duration: 0.1
            }, '<')
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
          pageTransitionMachine.send({
            type: 'ENTER_START',
            namespace: data.next && data.next.namespace
          });
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
            }, '-=0.3')
            .to('.preloader', {
              autoAlpha: 0,
              duration: 0.1
            })
            .from(data.next.container, {
              opacity: 0,
              y: 50,
              duration: 0.8,
              ease: 'power2.out'
            }, '-=0.4');
        }
      },
      {
        name: 'default',
        leave(data) {
          pageTransitionMachine.send({ type: 'LEAVE_START', name: 'default' });
          return gsap.to(data.current.container, {
            opacity: 0,
            duration: 0.5
          });
        },
        enter(data) {
          pageTransitionMachine.send({
            type: 'ENTER_START',
            namespace: data.next && data.next.namespace
          });
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
        afterEnter() {
          pageTransitionMachine.send({ type: 'TRANSITION_COMPLETE', namespace: 'home' });
          initLenis();
          initScrollEffects();
          initObservers();
          initTypewriter();
          if (window.initHeroParticles) window.initHeroParticles();
        }
      },
      {
        namespace: 'cv',
        afterEnter() {
          pageTransitionMachine.send({ type: 'TRANSITION_COMPLETE', namespace: 'cv' });
          initLenis();
          initScrollEffects();
          initObservers();
        }
      }
    ]
  });
}

document.addEventListener('DOMContentLoaded', () => {
  runPreloader();
  initLenis();
  initScrollEffects();
  initObservers();
  initTypewriter();
  initThemeToggle();
});
