(() => {
  'use strict';

  if (window.Babel && typeof window.Babel.registerPreset === 'function') {
    window.Babel.registerPreset('my-react', {
      presets: [[window.Babel.availablePresets['react'], { runtime: 'classic' }]]
    });
  }

  const { useState, useEffect, useRef, useMemo, useReducer, useCallback } = React;
  const MotionLib = window.Motion || {};
  const useFramerReducedMotion = MotionLib.useReducedMotion;

  function useReducedMotionSafe() {
    const framerPref = typeof useFramerReducedMotion === 'function' ? useFramerReducedMotion() : null;
    const [mediaPref, setMediaPref] = useState(() =>
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );

    useEffect(() => {
      if (!window.matchMedia) return;
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      const onChange = (e) => setMediaPref(e.matches);
      if (mql.addEventListener) mql.addEventListener('change', onChange);
      return () => {
        if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      };
    }, []);

    return Boolean(framerPref ?? mediaPref);
  }

  // --- GLOBAL SOUND & HAPTICS ENGINE ---
  let SHARED_AUDIO_CTX = null;
  function getSharedAudioContext() {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!SHARED_AUDIO_CTX) {
      try {
        SHARED_AUDIO_CTX = new AudioCtx();
      } catch (e) {
        return null;
      }
    }
    if (SHARED_AUDIO_CTX.state === 'suspended') {
      SHARED_AUDIO_CTX.resume().catch(() => {});
    }
    return SHARED_AUDIO_CTX;
  }

  function isHapticsMuted() {
    try {
      return localStorage.getItem('haptics-muted') === 'true';
    } catch (e) {
      return false;
    }
  }

  function playSoundPreset(preset) {
    if (isHapticsMuted()) return;
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      if (preset === 'tick') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1180, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.011);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1600, now);
        filter.Q.setValueAtTime(1.4, now);
        gain.gain.setValueAtTime(0.032, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.014);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.02);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, now);
        gain.gain.setValueAtTime(0.055, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.024);
      }
    } catch (e) {}
  }

  function playHapticClick() {
    playSoundPreset('toggle');
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(8);
      } catch (e) {}
    }
  }

  function playTick() {
    playSoundPreset('tick');
  }

  function useGlobalHaptics() {
    useEffect(() => {
      function handleClick() {
        if (!isHapticsMuted()) {
          playHapticClick();
        }
      }
      document.addEventListener('click', handleClick, true);
      return () => {
        document.removeEventListener('click', handleClick, true);
      };
    }, []);
  }

  const GlobalHaptics = () => {
    useGlobalHaptics();
    return null;
  };

  // --- THEME SWITCH WITH TRANSITION SUPPRESSION ---
  function applyThemeWithoutSmear(nextTheme) {
    const style = document.createElement('style');
    style.append(document.createTextNode('*,*::before,*::after{transition:none !important}'));
    document.head.appendChild(style);

    if (nextTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    try {
      localStorage.setItem('jp-theme', nextTheme);
    } catch (e) {}

    void document.body.offsetHeight;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => style.remove());
    });
  }

  // --- EXPLICIT FINITE STATE MACHINE ENGINE & TELEMETRY REGISTRY ---
  const MACHINE_REGISTRY = window.__APP_MACHINES__ || {};
  const GLOBAL_HISTORY = [];
  const GLOBAL_SUBSCRIBERS = new Set();
  let GLOBAL_SEQ = 0;

  function notifyGlobalSubscribers(record) {
    GLOBAL_SUBSCRIBERS.forEach((fn) => {
      try {
        fn(record);
      } catch (err) {
        console.error('[FSM Registry] Subscriber error:', err);
      }
    });
  }

  Object.defineProperties(MACHINE_REGISTRY, {
    __history__: { value: GLOBAL_HISTORY, enumerable: false, configurable: true },
    getAllSnapshots: {
      value: () => {
        const out = {};
        Object.keys(MACHINE_REGISTRY).forEach((k) => {
          if (MACHINE_REGISTRY[k] && typeof MACHINE_REGISTRY[k].getSnapshot === 'function') {
            out[k] = MACHINE_REGISTRY[k].getSnapshot();
          }
        });
        return out;
      },
      enumerable: false,
      configurable: true
    },
    getHistory: {
      value: (limit = 30) => GLOBAL_HISTORY.slice(-limit),
      enumerable: false,
      configurable: true
    },
    send: {
      value: (machineId, event) => {
        const target = MACHINE_REGISTRY[machineId];
        if (!target || typeof target.send !== 'function') return false;
        target.send(event);
        return true;
      },
      enumerable: false,
      configurable: true
    },
    resetAll: {
      value: () => {
        Object.keys(MACHINE_REGISTRY).forEach((k) => {
          if (MACHINE_REGISTRY[k] && typeof MACHINE_REGISTRY[k].reset === 'function') {
            MACHINE_REGISTRY[k].reset();
          }
        });
      },
      enumerable: false,
      configurable: true
    },
    subscribe: {
      value: (listener) => {
        if (typeof listener !== 'function') return () => {};
        GLOBAL_SUBSCRIBERS.add(listener);
        return () => GLOBAL_SUBSCRIBERS.delete(listener);
      },
      enumerable: false,
      configurable: true
    }
  });

  window.__APP_MACHINES__ = MACHINE_REGISTRY;

  function getAvailableEvents(config, stateValue) {
    const stateNode = config.states && config.states[stateValue];
    const stateEvents = stateNode && stateNode.on ? Object.keys(stateNode.on) : [];
    const rootEvents = config.on ? Object.keys(config.on) : [];
    return Array.from(new Set([...stateEvents, ...rootEvents]));
  }

  function evaluateMachineTransition(config, current, event) {
    const eventObj = typeof event === 'string' ? { type: event } : (event || { type: 'NOOP' });

    if (eventObj.type === '@@RESET') {
      const initialValue = typeof config.initial === 'function' ? config.initial() : config.initial;
      const initialContext = typeof config.context === 'function' ? config.context() : (config.context || {});
      return { value: initialValue, context: initialContext, changed: true, event: eventObj };
    }

    const stateNode = config.states && config.states[current.value];
    const handler =
      (stateNode && stateNode.on && stateNode.on[eventObj.type]) ||
      (config.on && config.on[eventObj.type]);

    if (!handler) {
      return { value: current.value, context: current.context, changed: false, event: eventObj };
    }

    let nextValue = current.value;
    let nextContext = current.context;

    if (typeof handler === 'string') {
      nextValue = handler;
    } else if (typeof handler === 'function') {
      const next = handler(current.context, eventObj, current.value);
      if (!next) {
        return { value: current.value, context: current.context, changed: false, event: eventObj };
      }
      nextValue = next.target || current.value;
      nextContext = next.context !== undefined ? next.context : current.context;
    } else if (typeof handler === 'object') {
      nextValue = handler.target || current.value;
      nextContext = handler.reduce ? handler.reduce(current.context, eventObj, current.value) : current.context;
    }

    const changed = nextValue !== current.value || nextContext !== current.context;
    return { value: nextValue, context: nextContext, changed, event: eventObj };
  }

  function useMachine(config) {
    const initialRef = useRef(null);
    if (!initialRef.current) {
      initialRef.current = {
        value: typeof config.initial === 'function' ? config.initial() : config.initial,
        context: typeof config.context === 'function' ? config.context() : (config.context || {})
      };
    }

    const stateRef = useRef(initialRef.current);
    const historyRef = useRef([]);
    const listenersRef = useRef(new Set());
    const [, forceRender] = useReducer((x) => x + 1, 0);

    const send = useCallback((event) => {
      const prev = stateRef.current;
      const result = evaluateMachineTransition(config, prev, event);
      if (!result.changed) return stateRef.current;

      const nextState = { value: result.value, context: result.context };
      stateRef.current = nextState;

      const record = {
        seq: ++GLOBAL_SEQ,
        id: config.id || 'anonymous',
        timestamp: new Date().toISOString(),
        event: result.event.type,
        from: prev.value,
        to: nextState.value
      };

      historyRef.current = [...historyRef.current.slice(-24), record];
      if (
        result.event.type !== 'SCROLL_UPDATE' &&
        result.event.type !== 'SCRUB_PROGRESS' &&
        result.event.type !== 'TICK'
      ) {
        GLOBAL_HISTORY.push(record);
        if (GLOBAL_HISTORY.length > 60) GLOBAL_HISTORY.shift();
      }

      forceRender();

      listenersRef.current.forEach((fn) => {
        try {
          fn(nextState, record);
        } catch (e) {
          console.error(e);
        }
      });
      notifyGlobalSubscribers(record);

      return nextState;
    }, [config]);

    const actor = useMemo(() => {
      const controller = {
        id: config.id,
        states: Object.keys(config.states || {}),
        send,
        reset: () => send({ type: '@@RESET' }),
        can: (eventType) => getAvailableEvents(config, stateRef.current.value).includes(eventType),
        getSnapshot: () => ({
          id: config.id,
          state: stateRef.current.value,
          context: stateRef.current.context,
          states: Object.keys(config.states || {}),
          availableEvents: getAvailableEvents(config, stateRef.current.value)
        }),
        subscribe: (fn) => {
          if (typeof fn !== 'function') return () => {};
          listenersRef.current.add(fn);
          return () => listenersRef.current.delete(fn);
        }
      };

      Object.defineProperties(controller, {
        state: { get: () => stateRef.current.value, enumerable: true },
        context: { get: () => stateRef.current.context, enumerable: true },
        availableEvents: { get: () => getAvailableEvents(config, stateRef.current.value), enumerable: true },
        history: { get: () => historyRef.current.slice(), enumerable: true }
      });

      return controller;
    }, [config, send]);

    if (config.id && !MACHINE_REGISTRY[config.id]) {
      MACHINE_REGISTRY[config.id] = actor;
    }

    useEffect(() => {
      if (!config.id) return;
      MACHINE_REGISTRY[config.id] = actor;
      return () => {
        if (MACHINE_REGISTRY[config.id] === actor) {
          delete MACHINE_REGISTRY[config.id];
        }
      };
    }, [config.id, actor]);

    return [stateRef.current, send, actor];
  }

  // --- SHARED SHELL STATE MACHINES ---
  const SCROLL_ENGINE_MACHINE = {
    id: 'scrollEngine',
    initial: () =>
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'reducedMotion'
        : 'idle',
    context: () => ({ direction: 'down' }),
    on: {
      VISIBILITY_HIDDEN: 'suspended',
      VISIBILITY_VISIBLE: 'idle'
    },
    states: {
      idle: {
        on: {
          SCROLL_ACTIVE: (ctx, event) => ({
            target: 'scrolling',
            context: { ...ctx, direction: event.direction || ctx.direction }
          })
        }
      },
      scrolling: {
        on: {
          SCROLL_ACTIVE: (ctx, event) => {
            if (event.direction === ctx.direction) return null;
            return { target: 'scrolling', context: { ...ctx, direction: event.direction } };
          },
          SCROLL_IDLE: 'idle'
        }
      },
      suspended: {},
      reducedMotion: {}
    }
  };

  const FOOTER_CURTAIN_MACHINE = {
    id: 'footerCurtain',
    initial: 'hidden',
    context: () => ({ progress: 0, activeChannel: null }),
    on: {
      SCRUB_PROGRESS: (ctx, event, currentState) => {
        const p = Math.max(0, Math.min(1, Number(event.progress) || 0));
        const nextState = p <= 0.02 ? 'hidden' : p >= 0.95 ? 'revealed' : 'revealing';
        if (nextState === currentState && Math.abs(ctx.progress - p) < 0.02) return null;
        return { target: nextState, context: { ...ctx, progress: Number(p.toFixed(3)) } };
      },
      REVEAL: (ctx) => ({ target: 'revealed', context: { ...ctx, progress: 1 } }),
      FOCUS_CHANNEL: (ctx, event) => ({ context: { ...ctx, activeChannel: event.channel || null } }),
      BLUR_CHANNEL: (ctx) => ({ context: { ...ctx, activeChannel: null } })
    },
    states: { hidden: {}, revealing: {}, revealed: {} }
  };

  window.PortfolioCore = {
    useReducedMotionSafe,
    isHapticsMuted,
    playHapticClick,
    playTick,
    GlobalHaptics,
    applyThemeWithoutSmear,
    useMachine,
    SCROLL_ENGINE_MACHINE,
    FOOTER_CURTAIN_MACHINE
  };
})();
