(() => {
  'use strict';

  const {
    useState,
    useEffect,
    useLayoutEffect,
    useRef,
    useMemo,
    useCallback
  } = React;

  const MotionLib = window.Motion || {};
  const motion = MotionLib.motion;
  const AnimatePresence = MotionLib.AnimatePresence;

  const {
    useReducedMotionSafe,
    isHapticsMuted,
    playTick,
    useMachine
  } = window.PortfolioCore;

  const {
    ArrowUpRightIcon,
    CopyIcon,
    CheckIcon,
    SunIcon,
    MoonIcon,
    SpeakerIcon,
    SpeakerMutedIcon,
    IconSwap,
    PortfolioShell
  } = window.PortfolioUI;

  // --- PORTFOLIO-SPECIFIC ICONS & GRAPHICS ---
  const FileTextIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path vectorEffect="non-scaling-stroke" d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path vectorEffect="non-scaling-stroke" d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path vectorEffect="non-scaling-stroke" d="M10 9H8" />
      <path vectorEffect="non-scaling-stroke" d="M16 13H8" />
      <path vectorEffect="non-scaling-stroke" d="M16 17H8" />
    </svg>
  );

  // Minimal Monochrome Project Marks (19px glyphs inside 44px tiles)
  const ProjectIcon = ({ type }) => {
    const common = {
      className: "w-[19px] h-[19px] text-ink",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.6",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true"
    };
    switch (type) {
      case "cabinet":
        return (
          <svg {...common}>
            <path vectorEffect="non-scaling-stroke" d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
          </svg>
        );
      case "wideawake":
        return (
          <svg {...common}>
            <circle vectorEffect="non-scaling-stroke" cx="12" cy="12" r="3.5" />
            <path vectorEffect="non-scaling-stroke" d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
          </svg>
        );
      case "ostrzolka":
        return (
          <svg {...common}>
            <ellipse vectorEffect="non-scaling-stroke" cx="12" cy="5" rx="8" ry="3" />
            <path vectorEffect="non-scaling-stroke" d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
            <path vectorEffect="non-scaling-stroke" d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
          </svg>
        );
      case "owewho":
        return (
          <svg {...common}>
            <path vectorEffect="non-scaling-stroke" d="m16 3 4 4-4 4" />
            <path vectorEffect="non-scaling-stroke" d="M20 7H4" />
            <path vectorEffect="non-scaling-stroke" d="m8 21-4-4 4-4" />
            <path vectorEffect="non-scaling-stroke" d="M4 17h16" />
          </svg>
        );
      case "quotes":
        return (
          <svg {...common}>
            <path vectorEffect="non-scaling-stroke" d="M10 11H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6a5 5 0 0 1-5 5" />
            <path vectorEffect="non-scaling-stroke" d="M20 11h-4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6a5 5 0 0 1-5 5" />
          </svg>
        );
      default:
        return (
          <svg {...common}>
            <rect vectorEffect="non-scaling-stroke" width="18" height="18" x="3" y="3" rx="2.5" />
            <circle vectorEffect="non-scaling-stroke" cx="9" cy="9" r="1.5" />
            <path vectorEffect="non-scaling-stroke" d="m21 15-4.5-4.5a2 2 0 0 0-2.83 0L6 18" />
          </svg>
        );
    }
  };

  // Minimal Paper Thumbnail Glyph
  const PaperThumbnail = ({ variant = 0 }) => {
    const patterns = [
      [75, 55, 85, 40],
      [60, 85, 50, 70],
      [80, 65, 45, 75],
      [55, 75, 80, 35],
      [70, 50, 85, 60]
    ];
    const widths = patterns[variant % patterns.length];
    return (
      <span
        aria-hidden="true"
        className="paper-thumb shrink-0 w-10 h-11 rounded-[7px] p-2 flex flex-col justify-center gap-[4px]"
      >
        {widths.map((w, i) => (
          <span
            key={i}
            className="block h-[2px] rounded-full"
            style={{
              width: `${w}%`,
              backgroundColor: i === 0 ? "var(--color-ink-muted)" : "var(--color-hairline)",
              opacity: i === 0 ? 0.55 : 1
            }}
          />
        ))}
      </span>
    );
  };

  // --- LIVE CLOCK CHANGING-DIGIT BLUR-FADE ---
  const AnimatedClockDigits = ({ value }) => {
    const prevRef = useRef(value);
    const prev = prevRef.current;

    useEffect(() => {
      prevRef.current = value;
    }, [value]);

    return (
      <span className="inline-flex items-baseline tabular-nums">
        {String(value).split("").map((ch, idx) => {
          const changed = prev !== value && prev[idx] !== ch;
          const isDigit = ch >= "0" && ch <= "9";
          const isColon = ch === ":";
          const slotClass = isDigit
            ? "w-[0.64em] text-center"
            : isColon
            ? "w-[0.28em] text-center"
            : "";
          return (
            <span key={idx} className={`inline-block ${slotClass}`}>
              <span
                key={`${idx}-${ch}`}
                className={`inline-block${changed ? " digit-tick-in" : ""}`}
              >
                {ch}
              </span>
            </span>
          );
        })}
      </span>
    );
  };

  const computeBydgoszczTimeSnapshot = () => {
    try {
      const now = new Date();
      const timeFmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Warsaw',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const tzParts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Warsaw',
        timeZoneName: 'short'
      }).formatToParts(now);
      const tzName = tzParts.find((p) => p.type === 'timeZoneName')?.value || 'CET';
      return { formatted: timeFmt.format(now), timezone: tzName, ok: true };
    } catch (e) {
      return { formatted: "Bydgoszcz", timezone: "CET", ok: false };
    }
  };

  const TELEMETRY_CLOCK_MACHINE = {
    id: "telemetryClock",
    initial: () => {
      const snap = computeBydgoszczTimeSnapshot();
      if (!snap.ok) return "fallback";
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return "suspended";
      return "ticking";
    },
    context: () => {
      const snap = computeBydgoszczTimeSnapshot();
      return { formatted: snap.formatted, timezone: snap.timezone };
    },
    on: {
      FREEZE: (ctx, event) => ({ target: "frozen", context: { ...ctx, formatted: event.formatted || ctx.formatted } }),
      UNFREEZE: (ctx) => {
        const snap = computeBydgoszczTimeSnapshot();
        return { target: snap.ok ? "ticking" : "fallback", context: { ...ctx, formatted: snap.formatted, timezone: snap.timezone } };
      }
    },
    states: {
      ticking: {
        on: {
          TICK: (ctx) => {
            const snap = computeBydgoszczTimeSnapshot();
            if (!snap.ok) return { target: "fallback", context: { ...ctx, formatted: snap.formatted } };
            if (snap.formatted === ctx.formatted) return null;
            return { target: "ticking", context: { ...ctx, formatted: snap.formatted, timezone: snap.timezone } };
          },
          VISIBILITY_HIDDEN: "suspended"
        }
      },
      suspended: {
        on: {
          VISIBILITY_VISIBLE: (ctx) => {
            const snap = computeBydgoszczTimeSnapshot();
            return { target: snap.ok ? "ticking" : "fallback", context: { ...ctx, formatted: snap.formatted, timezone: snap.timezone } };
          }
        }
      },
      frozen: {},
      fallback: {}
    }
  };

  const useBydgoszczTime = () => {
    const [clockState, send] = useMachine(TELEMETRY_CLOCK_MACHINE);

    useEffect(() => {
      if (clockState.value !== "ticking") return;
      const id = setInterval(() => send("TICK"), 1000);
      return () => clearInterval(id);
    }, [clockState.value, send]);

    useEffect(() => {
      const onVisChange = () => {
        send(document.visibilityState === "visible" ? "VISIBILITY_VISIBLE" : "VISIBILITY_HIDDEN");
      };
      document.addEventListener("visibilitychange", onVisChange);
      return () => document.removeEventListener("visibilitychange", onVisChange);
    }, [send]);

    return clockState;
  };

  const IdentityAndBio = ({ theme, onToggleTheme, hapticsMuted, onToggleHaptics, enterItem }) => {
    const clockState = useBydgoszczTime();
    const [copied, setCopied] = useState(false);

    const handleCopyEmail = () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText("pacochp@gmail.com").catch(() => {});
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    };

    return (
      <section id="hero" aria-labelledby="identity-name">
        {/* Intentional Mobile Top-Bar + Identity Composition; 2-Column Header on Desktop */}
        <motion.header
          variants={enterItem}
          className="flex flex-col-reverse sm:flex-row sm:items-start sm:justify-between gap-7 sm:gap-4 mb-9 sm:mb-12"
        >
          <div className="min-w-0">
            <h1
              id="identity-name"
              className="text-[1.625rem] sm:text-[1.5rem] font-semibold text-ink tracking-[-0.025em] sm:tracking-[-0.02em] leading-[1.2] sm:leading-[1.3]"
            >
              Jakub Pacocha
            </h1>
            <p className="mt-1 sm:mt-0.5 text-[1.0625rem] sm:text-[1.125rem] font-medium text-ink-subtitle leading-[1.4]">
              AI &amp; Software Engineer
            </p>
            <p
              data-machine="telemetryClock"
              data-state={clockState.value}
              data-timezone={clockState.context.timezone}
              className="mt-3 sm:mt-2 inline-flex items-center gap-1.5 text-[0.875rem] sm:text-[0.9375rem] text-ink-muted tabular-nums"
            >
              <span>Bydgoszcz</span>
              <span aria-hidden="true" className="opacity-50">/</span>
              <span>
                <AnimatedClockDigits value={clockState.context.formatted} /> {clockState.context.timezone}
              </span>
            </p>
          </div>

          {/* Utility Bar: Full-width split chrome on mobile; compact right cluster on desktop */}
          <nav
            aria-label="Site utilities"
            className="flex items-center justify-between sm:justify-end gap-2 sm:gap-1 pb-3.5 sm:pb-0 border-b border-hairline sm:border-0 shrink-0 sm:-me-1.5"
          >
            <div className="flex items-center gap-1 -ms-2.5 sm:ms-0">
              <a
                href="/cv"
                className="tap-press hover-surface px-2.5 min-h-[40px] rounded-lg inline-flex items-center gap-1 text-[0.9375rem] font-medium text-ink sm:text-ink-muted"
              >
                <span>CV</span>
                <ArrowUpRightIcon className="w-3.5 h-3.5" />
              </a>

              <a
                href="assets/resume.pdf"
                download
                aria-label="Download CV as PDF"
                title="Download CV (PDF)"
                className="tap-press hover-surface px-2.5 sm:px-0 sm:w-[40px] min-h-[40px] rounded-lg inline-flex items-center justify-center gap-1.5 text-[0.9375rem] font-medium text-ink-muted"
              >
                <FileTextIcon className="w-4 h-4" />
                <span className="sm:hidden">PDF</span>
              </a>
            </div>

            <span aria-hidden="true" className="hidden sm:inline-block w-px h-4 bg-hairline mx-0.5" />

            <div className="flex items-center gap-0.5 sm:gap-1 -me-1.5 sm:me-0">
              <button
                type="button"
                onClick={onToggleHaptics}
                aria-label={hapticsMuted ? "Unmute click feedback" : "Mute click feedback"}
                aria-pressed={hapticsMuted}
                title={hapticsMuted ? "Unmute feedback" : "Mute feedback"}
                className={`tap-press hover-surface w-[40px] h-[40px] rounded-lg inline-flex items-center justify-center ${
                  hapticsMuted ? "text-ink-muted opacity-55" : "text-ink-muted"
                }`}
              >
                <IconSwap activeKey={hapticsMuted ? "muted" : "on"}>
                  {hapticsMuted ? <SpeakerMutedIcon /> : <SpeakerIcon />}
                </IconSwap>
              </button>

              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                aria-pressed={theme === "dark"}
                title={theme === "dark" ? "Light mode" : "Dark mode"}
                className="tap-press hover-surface w-[40px] h-[40px] rounded-lg inline-flex items-center justify-center text-ink-muted"
              >
                <IconSwap activeKey={theme}>
                  {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                </IconSwap>
              </button>
            </div>
          </nav>
        </motion.header>

        {/* Bio Prose */}
        <motion.div
          variants={enterItem}
          className="space-y-4 text-[1.0625rem] sm:text-[1.125rem] text-ink-secondary leading-[1.7] text-pretty max-w-[60ch]"
        >
          <p>
            Currently an AI &amp; Software Engineer at{" "}
            <strong className="text-ink font-semibold">HERE Technologies</strong>.<br/> Previously at{" "}
            <strong className="text-ink font-semibold">iQor</strong> and{" "}
            <strong className="text-ink font-semibold">O-I</strong>.
          </p>

          <p>
            Building production{" "}
            <strong className="text-ink font-semibold">RAG architectures</strong>,{" "}
            <strong className="text-ink font-semibold">containerized ML infrastructure</strong> and{" "}
            <strong className="text-ink font-semibold">spatial intelligence</strong> systems - from vector search pipelines to cloud services on AWS and Azure.
          </p>

          <p>
            Outside the terminal, I collaborate with local NGOs in Bydgoszcz and write philosophical essays on phenomenology, theology and society at{" "}<br/>
            <a
              href="https://fromthecabinet.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="reveal-link"
            >
              <span className="inline-link">From the Cabinet</span>
              <span className="reveal-slot" aria-hidden="true">
                <ArrowUpRightIcon tight className="reveal-glyph w-[0.5em] h-[0.5em]" strokeWidth={1.9} />
              </span>
            </a>
            .
          </p>

          <p className="pt-1">
            Reach me at{" "}
            <button
              type="button"
              onClick={handleCopyEmail}
              data-revealed={copied ? "true" : undefined}
              aria-label={copied ? "Email copied to clipboard" : "Copy pacochp@gmail.com to clipboard"}
              className="reveal-link tap-press inline-block p-0 m-0 bg-transparent border-0 text-inherit cursor-pointer align-baseline"
            >
              <span className="inline-link">pacochp@gmail.com</span>
              <span className="reveal-slot reveal-slot-copy" aria-hidden="true">
                <IconSwap activeKey={copied ? "check" : "copy"}>
                  {copied ? (
                    <CheckIcon className="reveal-glyph reveal-glyph-copy w-[0.68em] h-[0.68em] text-ink" />
                  ) : (
                    <CopyIcon className="reveal-glyph reveal-glyph-copy w-[0.68em] h-[0.68em]" />
                  )}
                </IconSwap>
              </span>
            </button>{" "}
            or on{" "}
            <a
              href="https://www.linkedin.com/in/jakubpacocha/"
              target="_blank"
              rel="noopener noreferrer"
              className="reveal-link"
            >
              <span className="inline-link">LinkedIn</span>
              <span className="reveal-slot" aria-hidden="true">
                <ArrowUpRightIcon tight className="reveal-glyph w-[0.5em] h-[0.5em]" strokeWidth={1.9} />
              </span>
            </a>
            ,{" "}
            <a
              href="https://x.com/JakubPacocha"
              target="_blank"
              rel="noopener noreferrer"
              className="reveal-link"
            >
              <span className="inline-link">X</span>
              <span className="reveal-slot" aria-hidden="true">
                <ArrowUpRightIcon tight className="reveal-glyph w-[0.5em] h-[0.5em]" strokeWidth={1.9} />
              </span>
            </a>{" "}
            and{" "}
            <a
              href="https://github.com/JPacoch"
              target="_blank"
              rel="noopener noreferrer"
              className="reveal-link"
            >
              <span className="inline-link">GitHub</span>
              <span className="reveal-slot" aria-hidden="true">
                <ArrowUpRightIcon tight className="reveal-glyph w-[0.5em] h-[0.5em]" strokeWidth={1.9} />
              </span>
            </a>
            .
            <span className="sr-only" role="status" aria-live="polite">
              {copied ? "Email address pacochp@gmail.com copied." : ""}
            </span>
          </p>
        </motion.div>
      </section>
    );
  };

  // --- GITHUB CONTRIBUTION ACTIVITY WIDGET ---
  const GITHUB_USERNAME =
    (typeof window !== "undefined" &&
      (window.__GITHUB_USERNAME__ ||
        new URLSearchParams(window.location.search).get("github") ||
        "").trim()) ||
    "JPacoch";
  const GITHUB_CACHE_TTL_MS = 30 * 60 * 1000;

  const GITHUB_TELEMETRY_MACHINE = {
    id: "githubTelemetry",
    initial: "loading",
    context: () => ({
      username: GITHUB_USERNAME,
      data: null,
      hoveredIndex: null,
      error: null
    }),
    states: {
      loading: {
        on: {
          FETCH_SUCCESS: (ctx, event) => ({ target: "ready", context: { ...ctx, data: event.data, error: null } }),
          FETCH_ERROR: (ctx, event) => ({ target: "error", context: { ...ctx, error: event.error || "Unavailable" } })
        }
      },
      ready: {
        on: {
          HOVER_DAY: (ctx, event) => ({ target: "inspecting", context: { ...ctx, hoveredIndex: event.index } })
        }
      },
      inspecting: {
        on: {
          HOVER_DAY: (ctx, event) => ({ target: "inspecting", context: { ...ctx, hoveredIndex: event.index } }),
          CLEAR_HOVER: (ctx) => ({ target: "ready", context: { ...ctx, hoveredIndex: null } }),
          ESCAPE: (ctx) => ({ target: "ready", context: { ...ctx, hoveredIndex: null } })
        }
      },
      error: {
        on: {
          RETRY: (ctx) => ({ target: "loading", context: { ...ctx, error: null } })
        }
      }
    }
  };

  function commitLevelColor(count, max) {
    if (count === 0) return "var(--contrib-0)";
    const ratio = count / max;
    if (ratio <= 0.25) return "var(--contrib-1)";
    if (ratio <= 0.5) return "var(--contrib-2)";
    if (ratio <= 0.75) return "var(--contrib-3)";
    return "var(--contrib-4)";
  }

  function formatCommitDate(dateStr) {
    try {
      const d = new Date(dateStr + "T12:00:00");
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch (e) {
      return dateStr;
    }
  }

  const CommitGraph = ({ days, hovered, onEnter, onLeave, onSelect, isLoading, isError }) => {
    const reduce = useReducedMotionSafe();
    const [mounted, setMounted] = useState(false);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const containerRef = useRef(null);
    const barRefs = useRef([]);
    const tooltipRefs = useRef([]);
    const [offsets, setOffsets] = useState([]);
    const [rovingIdx, setRovingIdx] = useState(29);
    const gestureRef = useRef(null);
    const holdTimerRef = useRef(null);
    const lastTouchTimeRef = useRef(0);

    const max = useMemo(() => Math.max(...days.map((d) => d.count), 1), [days]);

    useEffect(() => {
      if (isLoading || isError) {
        setMounted(false);
        return;
      }
      const id = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(id);
    }, [isLoading, isError, days]);

    // Clamp edge tooltips inside the container
    useLayoutEffect(() => {
      if (!mounted) return;
      const compute = () => {
        const container = containerRef.current;
        if (!container) return;
        const cw = container.getBoundingClientRect().width;
        const next = days.map((_, i) => {
          const tip = tooltipRefs.current[i];
          const slot = container.children[i];
          if (!tip || !slot) return 0;
          const tipW = tip.offsetWidth;
          const barCenter = slot.offsetLeft + slot.offsetWidth / 2;
          const left = barCenter - tipW / 2;
          const right = barCenter + tipW / 2;
          if (left < 0) return -left;
          if (right > cw) return cw - right;
          return 0;
        });
        setOffsets(next);
      };
      compute();
      window.addEventListener("resize", compute);
      return () => window.removeEventListener("resize", compute);
    }, [mounted, days]);

    // Dismiss pinned tooltip when tapping outside the graph on touch devices
    useEffect(() => {
      if (hovered === null) return;
      const onDocPointerDown = (e) => {
        if (e.pointerType === "mouse") return;
        if (containerRef.current && !containerRef.current.contains(e.target)) {
          onLeave(true);
        }
      };
      document.addEventListener("pointerdown", onDocPointerDown, true);
      return () => document.removeEventListener("pointerdown", onDocPointerDown, true);
    }, [hovered, onLeave]);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const onTouchMove = (e) => {
        if (gestureRef.current && gestureRef.current.scrubbing && e.cancelable) {
          e.preventDefault();
        }
      };
      el.addEventListener("touchmove", onTouchMove, { passive: false });
      return () => {
        el.removeEventListener("touchmove", onTouchMove);
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      };
    }, []);

    const getBarIndexFromClientX = useCallback(
      (clientX) => {
        const container = containerRef.current;
        if (!container || !days.length) return 0;
        const rect = container.getBoundingClientRect();
        if (rect.width <= 0) return 0;
        const ratio = (clientX - rect.left) / rect.width;
        return Math.max(0, Math.min(days.length - 1, Math.floor(ratio * days.length)));
      },
      [days.length]
    );

    const triggerSubtleScrubHaptic = useCallback(() => {
      if (!isHapticsMuted() && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        try {
          navigator.vibrate(4);
        } catch (e) {}
      }
    }, []);

    const enterScrubMode = useCallback(
      (idx, pointerId) => {
        const g = gestureRef.current;
        if (!g || g.scrubbing) return;
        g.scrubbing = true;
        g.lastIdx = idx;
        setIsScrubbing(true);
        if (containerRef.current && typeof containerRef.current.setPointerCapture === "function") {
          try {
            containerRef.current.setPointerCapture(pointerId);
          } catch (e) {}
        }
        setRovingIdx(idx);
        onEnter(idx, true);
        triggerSubtleScrubHaptic();
      },
      [onEnter, triggerSubtleScrubHaptic]
    );

    const handleContainerPointerDown = (e) => {
      if (isLoading || isError || e.pointerType === "mouse") return;
      const idx = getBarIndexFromClientX(e.clientX);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      gestureRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startIdx: idx,
        lastIdx: idx,
        wasSameDay: hovered === idx,
        scrubbing: false,
        scrolled: false
      };
      holdTimerRef.current = setTimeout(() => {
        if (gestureRef.current && !gestureRef.current.scrolled) {
          enterScrubMode(gestureRef.current.startIdx, gestureRef.current.pointerId);
        }
      }, 130);
    };

    const handleContainerPointerMove = (e) => {
      const g = gestureRef.current;
      if (!g || g.pointerId !== e.pointerId || e.pointerType === "mouse") return;
      const dx = Math.abs(e.clientX - g.startX);
      const dy = Math.abs(e.clientY - g.startY);

      if (!g.scrubbing) {
        if (dy > 8 && dy > dx) {
          g.scrolled = true;
          if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
          return;
        }
        if (dx > 6 && dx >= dy) {
          if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
          const nextIdx = getBarIndexFromClientX(e.clientX);
          enterScrubMode(nextIdx, e.pointerId);
          return;
        }
        return;
      }

      if (e.cancelable) e.preventDefault();
      const nextIdx = getBarIndexFromClientX(e.clientX);
      if (nextIdx !== g.lastIdx) {
        g.lastIdx = nextIdx;
        setRovingIdx(nextIdx);
        onEnter(nextIdx, true);
        triggerSubtleScrubHaptic();
      }
    };

    const finishTouchGesture = (e, cancelled = false) => {
      const g = gestureRef.current;
      if (!g || g.pointerId !== e.pointerId || e.pointerType === "mouse") return;
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (g.scrubbing && containerRef.current && typeof containerRef.current.releasePointerCapture === "function") {
        try {
          containerRef.current.releasePointerCapture(e.pointerId);
        } catch (err) {}
      }
      lastTouchTimeRef.current = performance.now();
      setIsScrubbing(false);

      if (!cancelled && !g.scrolled && !g.scrubbing) {
        if (g.wasSameDay) {
          onLeave(true);
        } else {
          setRovingIdx(g.startIdx);
          onEnter(g.startIdx, true);
          triggerSubtleScrubHaptic();
        }
      }
      gestureRef.current = null;
    };

    const handleKeyDown = (e, i) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const next = Math.min(days.length - 1, i + 1);
        setRovingIdx(next);
        if (barRefs.current[next]) barRefs.current[next].focus();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = Math.max(0, i - 1);
        setRovingIdx(prev);
        if (barRefs.current[prev]) barRefs.current[prev].focus();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onLeave(true);
      }
    };

    return (
      <div
        ref={containerRef}
        role="group"
        aria-label="Last 30 days of GitHub contributions"
        data-scrubbing={isScrubbing ? "true" : undefined}
        onPointerDown={handleContainerPointerDown}
        onPointerMove={handleContainerPointerMove}
        onPointerUp={(e) => finishTouchGesture(e, false)}
        onPointerCancel={(e) => finishTouchGesture(e, true)}
        onContextMenu={(e) => {
          if (isScrubbing) e.preventDefault();
        }}
        style={{ touchAction: isScrubbing ? "none" : "pan-y" }}
        className="commit-scrub-zone relative flex gap-[3px] min-[500px]:gap-[6px] sm:gap-[9px] py-3 -my-3"
      >
        {days.map((day, i) => {
          if (isLoading || isError) {
            return (
              <div key={day.date} className="relative flex-1 h-[22px] min-[500px]:h-[28px] sm:h-[34px] flex items-center">
                <div
                  aria-hidden="true"
                  className={`w-full h-full rounded-[3.5px] min-[500px]:rounded-[4px] sm:rounded-[5px] ${isLoading ? "motion-safe:animate-pulse" : "opacity-50"}`}
                  style={{ backgroundColor: "var(--contrib-0)" }}
                />
              </div>
            );
          }

          const isHovered = hovered === i;
          const isNeighbor = hovered !== null && (hovered === i - 1 || hovered === i + 1);
          const offset = offsets[i] ?? 0;
          const barHeight = reduce ? "100%" : isHovered ? "60%" : isNeighbor ? "80%" : "100%";

          return (
            <div
              key={day.date}
              className="relative flex-1 h-[22px] min-[500px]:h-[28px] sm:h-[34px] flex items-center"
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") onEnter(i, true);
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === "mouse") onLeave(false);
              }}
            >
              <button
                ref={(el) => { barRefs.current[i] = el; }}
                type="button"
                tabIndex={rovingIdx === i ? 0 : -1}
                aria-label={`${formatCommitDate(day.date)}: ${day.count > 0 ? `${day.count} contribution${day.count !== 1 ? "s" : ""}` : "No contributions"}`}
                onFocus={() => {
                  if (performance.now() - lastTouchTimeRef.current < 450) return;
                  setRovingIdx(i);
                  onEnter(i, false);
                }}
                onBlur={() => {
                  if (performance.now() - lastTouchTimeRef.current < 450) return;
                  onLeave(true);
                }}
                onClick={() => {
                  if (performance.now() - lastTouchTimeRef.current < 450) return;
                  setRovingIdx(i);
                  onSelect(i);
                }}
                onKeyDown={(e) => handleKeyDown(e, i)}
                className="w-full p-0 border-0 rounded-[3.5px] min-[500px]:rounded-[4px] sm:rounded-[5px] cursor-pointer block"
                style={{
                  backgroundColor: commitLevelColor(day.count, max),
                  height: barHeight,
                  transform: mounted || reduce ? "scaleY(1)" : "scaleY(0)",
                  opacity: mounted || reduce ? 1 : 0,
                  transition:
                    mounted && !reduce
                      ? `transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 20}ms, opacity 300ms ease ${i * 20}ms, height ${
                          isHovered || isNeighbor ? "150ms cubic-bezier(0.215, 0.61, 0.355, 1)" : "100ms ease"
                        }`
                      : "opacity 150ms ease",
                  transformOrigin: "bottom"
                }}
              />

              {/* Always-mounted tooltip animated via opacity + translateY */}
              <div
                ref={(el) => { tooltipRefs.current[i] = el; }}
                role="tooltip"
                aria-hidden={!isHovered}
                className="absolute bottom-full left-1/2 mb-3 sm:mb-2 z-50 pointer-events-none"
                style={{
                  transform: `translateX(calc(-50% + ${offset}px)) translateY(${isHovered || reduce ? "0px" : "4px"})`,
                  opacity: isHovered ? 1 : 0,
                  transition: reduce
                    ? "opacity 100ms ease"
                    : isHovered
                    ? "opacity 150ms cubic-bezier(0.215, 0.61, 0.355, 1), transform 150ms cubic-bezier(0.215, 0.61, 0.355, 1)"
                    : "opacity 100ms ease, transform 100ms ease"
                }}
              >
                <div className="bg-[#26262a] text-white text-[13px] rounded-md px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                  <p className="font-medium leading-tight">{formatCommitDate(day.date)}</p>
                  {day.count > 0 ? (
                    <p className="text-[#d4d4d8] text-xs tabular-nums leading-tight mt-0.5">
                      {day.count} contribution{day.count !== 1 ? "s" : ""}
                    </p>
                  ) : (
                    <p className="text-[#a1a1aa] text-xs leading-tight mt-0.5">
                      No contributions
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const ActivityStrip = ({ enterItem }) => {
    const [telemetry, send] = useMachine(GITHUB_TELEMETRY_MACHINE);
    const { username, data, hoveredIndex } = telemetry.context;
    const isLoading = telemetry.value === "loading";
    const isError = telemetry.value === "error";
    const leaveTimeoutRef = useRef(null);

    useEffect(() => {
      if (telemetry.value !== "loading") return;
      let cancelled = false;
      const cacheKey = `jp-gh-contrib-v1:${username}`;

      try {
        const cachedRaw = sessionStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (cached && cached.ts && Date.now() - cached.ts < GITHUB_CACHE_TTL_MS && cached.payload) {
            send({ type: "FETCH_SUCCESS", data: cached.payload });
            return;
          }
        }
      } catch (e) {}

      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timeoutId = setTimeout(() => {
        if (controller) controller.abort();
      }, 8000);

      fetch(
        `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`,
        controller ? { signal: controller.signal } : undefined
      )
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((json) => {
          if (cancelled) return;
          const rawList = Array.isArray(json.contributions) ? json.contributions : [];
          if (!rawList.length) throw new Error("Empty dataset");

          const now = new Date();
          const today = now.toISOString().slice(0, 10);
          const firstDay = new Date(`${today}T00:00:00.000Z`);
          firstDay.setUTCDate(firstDay.getUTCDate() - 29);
          const yearStart = `${now.getUTCFullYear()}-01-01`;

          const contributionsByDay = new Map();
          for (let i = 0; i < 30; i++) {
            const d = new Date(firstDay);
            d.setUTCDate(firstDay.getUTCDate() + i);
            contributionsByDay.set(d.toISOString().slice(0, 10), 0);
          }

          let yearToDateContributions = 0;
          for (const item of rawList) {
            if (!item || !item.date) continue;
            const count = Number(item.count) || 0;
            if (item.date >= yearStart && item.date <= today) {
              yearToDateContributions += count;
            }
            if (contributionsByDay.has(item.date)) {
              contributionsByDay.set(item.date, count);
            }
          }

          const days = Array.from(contributionsByDay, ([date, count]) => ({ date, count }));
          const totalCommits = days.reduce((sum, d) => sum + d.count, 0);
          const payload = { days, totalCommits, yearToDateContributions };

          try {
            sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), payload }));
          } catch (e) {}

          send({ type: "FETCH_SUCCESS", data: payload });
        })
        .catch((err) => {
          if (cancelled) return;
          send({ type: "FETCH_ERROR", error: err.message });
        })
        .finally(() => clearTimeout(timeoutId));

      return () => {
        cancelled = true;
        clearTimeout(timeoutId);
        if (controller) controller.abort();
      };
    }, [telemetry.value, username, send]);

    useEffect(() => {
      return () => {
        if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
      };
    }, []);

    const handleEnter = useCallback(
      (i, withSound = true) => {
        if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
        send({ type: "HOVER_DAY", index: i });
        if (withSound) playTick();
      },
      [send]
    );

    const handleLeave = useCallback(
      (immediate = false) => {
        if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
        if (immediate) {
          send("CLEAR_HOVER");
          return;
        }
        leaveTimeoutRef.current = setTimeout(() => {
          send("CLEAR_HOVER");
        }, 80);
      },
      [send]
    );

    const handleSelect = useCallback(
      (i) => {
        if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
        if (hoveredIndex === i) {
          send("CLEAR_HOVER");
        } else {
          send({ type: "HOVER_DAY", index: i });
        }
      },
      [hoveredIndex, send]
    );

    const placeholderDays = useMemo(
      () => Array.from({ length: 30 }, (_, i) => ({ date: `placeholder-${i}`, count: 0 })),
      []
    );
    const displayDays = data && data.days ? data.days : placeholderDays;
    const activeDay = hoveredIndex !== null && displayDays[hoveredIndex] ? displayDays[hoveredIndex] : null;

    return (
      <motion.section
        id="github"
        variants={enterItem}
        data-machine="githubTelemetry"
        data-state={telemetry.value}
        data-github-username={username}
        data-total-commits={data ? data.yearToDateContributions : undefined}
        data-inspected-date={activeDay ? activeDay.date : undefined}
        aria-label="GitHub contribution activity"
        className="flex flex-col gap-3 w-full"
      >
        <CommitGraph
          days={displayDays}
          hovered={hoveredIndex}
          onEnter={handleEnter}
          onLeave={handleLeave}
          onSelect={handleSelect}
          isLoading={isLoading}
          isError={isError}
        />

        <div className="flex items-center justify-between gap-4 text-[0.9375rem]">
          <span className="text-ink-muted">Last 30 days</span>
          {isError ? (
            <button
              type="button"
              onClick={() => send("RETRY")}
              className="inline-link text-[0.9375rem] bg-transparent border-0 p-0 cursor-pointer"
            >
              Retry
            </button>
          ) : (
            <span className="text-[0.9375rem] text-ink-secondary tabular-nums">
              {isLoading ? "Syncing…" : `${data.totalCommits} contributions`}
            </span>
          )}
        </div>

        <div className="border-t border-dotted border-hairline" />

        <div className="flex items-center justify-between gap-4 text-[0.9375rem]">
          <span className="text-ink-muted">Year to date</span>
          <a
            href={`https://github.com/${encodeURIComponent(username)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.9375rem] text-ink-secondary hover-ink tabular-nums inline-flex items-center gap-1 transition-colors duration-150 ease-out"
          >
            <span>
              {isLoading ? "-" : isError ? `github.com/${username}` : `${data.yearToDateContributions} contributions`}
            </span>
            <ArrowUpRightIcon className="w-3.5 h-3.5 text-ink-muted" />
          </a>
        </div>

        <span className="sr-only" role="status" aria-live="polite">
          {activeDay
            ? `${formatCommitDate(activeDay.date)}: ${activeDay.count} ${activeDay.count === 1 ? "contribution" : "contributions"}`
            : ""}
        </span>
      </motion.section>
    );
  };

  // --- PROJECTS SECTION ---
  const PROJECTS_DATA = [
    {
      id: "01",
      icon: "cabinet",
      title: "From the Cabinet",
      desc: "Philosophical & theological essay archive",
      type: "Publication",
      url: "https://fromthecabinet.com/",
      category: "Publishing"
    },
    {
      id: "02",
      icon: "wideawake",
      title: "WideAwake",
      desc: "Zero-dependency Windows keep-awake utility",
      type: "C# / .NET",
      url: "https://wideawake.jakubpacocha.com/",
      category: "Engineering"
    },
    {
      id: "03",
      icon: "ostrzolka",
      title: "Ostrzółka",
      desc: "Municipal heritage database for NGOs",
      type: "Civic data",
      url: "https://ostrzolka.vercel.app/",
      category: "Civic"
    },
    {
      id: "04",
      icon: "owewho",
      title: "OweWho",
      desc: "Group expense & travel debt settlement",
      type: "Web app",
      url: "https://owewho.jakubpacocha.com/",
      category: "Engineering"
    },
    {
      id: "05",
      icon: "quotes",
      title: "Cabinet Quotes",
      desc: "Distraction-free literary commonplace book",
      type: "Reader",
      url: "https://quotes.fromthecabinet.com/",
      category: "Publishing"
    },
    {
      id: "06",
      icon: "gallery",
      title: "Gallery",
      desc: "Gallery of private photographs ",
      type: "Photography",
      url: "https://gallery.jakubpacocha.com/",
      category: "Civic"
    }
  ];

  const PROJECT_CATEGORIES = ["All", "Engineering", "Publishing", "Civic"];

  const PROJECT_FILTER_MACHINE = {
    id: "projectFilter",
    initial: "idle",
    context: () => ({ category: "All", hoveredProjectId: null }),
    on: {
      SELECT_CATEGORY: (ctx, event) => {
        const nextCat = PROJECT_CATEGORIES.includes(event.category) ? event.category : "All";
        if (nextCat === ctx.category) return null;
        return { target: "transitioning", context: { ...ctx, category: nextCat } };
      },
      RESET_FILTER: (ctx) => {
        if (ctx.category === "All") return null;
        return { target: "transitioning", context: { ...ctx, category: "All" } };
      },
      INSPECT_PROJECT: (ctx, event) => ({ context: { ...ctx, hoveredProjectId: event.id || null } }),
      LEAVE_PROJECT: (ctx) => ({ context: { ...ctx, hoveredProjectId: null } })
    },
    states: {
      idle: {},
      transitioning: { on: { TRANSITION_COMPLETE: "idle" } }
    }
  };

  const Projects = ({ enterItem }) => {
    const [filterState, send] = useMachine(PROJECT_FILTER_MACHINE);
    const reduce = useReducedMotionSafe();
    const { category: activeCategory, hoveredProjectId } = filterState.context;
    const tabRefs = useRef([]);

    const filteredProjects = useMemo(() => {
      if (activeCategory === "All") return PROJECTS_DATA;
      return PROJECTS_DATA.filter((p) => p.category === activeCategory);
    }, [activeCategory]);

    const completeTransition = useCallback(() => {
      send("TRANSITION_COMPLETE");
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }, [send]);

    useEffect(() => {
      if (filterState.value !== "transitioning") return;
      const timer = setTimeout(completeTransition, 240);
      return () => clearTimeout(timer);
    }, [filterState.value, activeCategory, completeTransition]);

    const handleTabKeyDown = (e, idx) => {
      let nextIdx = null;
      if (e.key === "ArrowRight") nextIdx = (idx + 1) % PROJECT_CATEGORIES.length;
      else if (e.key === "ArrowLeft") nextIdx = (idx - 1 + PROJECT_CATEGORIES.length) % PROJECT_CATEGORIES.length;
      else if (e.key === "Home") nextIdx = 0;
      else if (e.key === "End") nextIdx = PROJECT_CATEGORIES.length - 1;
      if (nextIdx === null) return;
      e.preventDefault();
      send({ type: "SELECT_CATEGORY", category: PROJECT_CATEGORIES[nextIdx] });
      if (tabRefs.current[nextIdx]) tabRefs.current[nextIdx].focus();
    };

    return (
      <motion.section
        id="projects"
        variants={enterItem}
        data-machine="projectFilter"
        data-state={filterState.value}
        data-category={activeCategory}
        data-visible-count={filteredProjects.length}
        data-hovered-project={hoveredProjectId || undefined}
        aria-labelledby="projects-heading"
        className="tracking-normal"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3 pb-4 mb-4 border-b border-hairline">
          <h2
            id="projects-heading"
            className="text-base sm:text-[1.0625rem] font-semibold text-ink tracking-normal"
          >
            Projects
          </h2>

          <div
            role="tablist"
            aria-label="Filter projects by category"
            className="flex flex-wrap items-center gap-5"
          >
            {PROJECT_CATEGORIES.map((cat, idx) => {
              const isSelected = activeCategory === cat;
              return (
                <button
                  key={cat}
                  ref={(el) => { tabRefs.current[idx] = el; }}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls="projects-tabpanel"
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => send({ type: "SELECT_CATEGORY", category: cat })}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  className={`relative pt-1 pb-1.5 text-[0.9375rem] font-medium tracking-[0.005em] transition-colors duration-150 ease-out ${
                    isSelected ? "text-ink" : "text-ink-muted hover-ink"
                  }`}
                >
                  {cat}
                  {isSelected && (
                    <motion.span
                      layoutId="projectFilterLine"
                      transition={reduce ? { duration: 0.1 } : { type: "spring", duration: 0.3, bounce: 0 }}
                      className="absolute inset-x-0 bottom-0 h-[1.5px] bg-ink rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div
          id="projects-tabpanel"
          role="tabpanel"
          aria-label={`${activeCategory} projects`}
          className="-mx-3.5 sm:-mx-4"
        >
          <AnimatePresence initial={false} mode="wait" onExitComplete={completeTransition}>
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.12, ease: "easeOut" } }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="focus-list flex flex-col gap-1.5 sm:gap-2"
            >
              {filteredProjects.map((proj, idx) => (
                <motion.div
                  key={proj.id}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.22,
                    delay: reduce ? 0 : idx * 0.03,
                    ease: [0.2, 0, 0, 1]
                  }}
                >
                  <a
                    href={proj.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => send({ type: "INSPECT_PROJECT", id: proj.id })}
                    onMouseLeave={() => send("LEAVE_PROJECT")}
                    onFocus={() => send({ type: "INSPECT_PROJECT", id: proj.id })}
                    onBlur={() => send("LEAVE_PROJECT")}
                    className="focus-list-item tap-press flex items-center justify-between gap-4 sm:gap-6 px-3.5 sm:px-4 py-4 sm:py-[1.125rem] rounded-xl transition-[opacity,background-color,transform] duration-150 ease-out min-w-0"
                  >
                    <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                      <span className="icon-tile shrink-0 w-11 h-11 rounded-[11px] inline-flex items-center justify-center">
                        <ProjectIcon type={proj.icon} />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[1.0625rem] sm:text-[1.125rem] font-semibold text-ink leading-[1.35] tracking-normal truncate">
                          {proj.title}
                        </div>
                        <div className="mt-1 text-base text-ink-muted leading-[1.45] truncate">
                          {proj.desc}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="hidden sm:inline text-[0.9375rem] text-ink-muted">
                        {proj.type}
                      </span>
                      <ArrowUpRightIcon className="row-arrow w-4 h-4 text-ink-muted opacity-60 sm:opacity-0 transition-[opacity,transform] duration-150 ease-out" />
                    </div>
                  </a>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.section>
    );
  };

  // --- WRITING / NOTES SECTION ---
  const ESSAYS_DATA = [
    {
      id: "01",
      title: "Timon, on authenticity",
      category: "Dialogue",
      date: "Sep 2026",
      isNew: true,
      link: "https://fromthecabinet.com/text.html?slug=dialogue1-on-socmed"
    },
    {
      id: "02",
      title: "The Phenomenology and Certainty",
      category: "Epistemology",
      date: "Apr 2026",
      link: "https://fromthecabinet.com/texts/phenomenology-certainty.html"
    },
    {
      id: "03",
      title: "The Wall and Nausea",
      category: "Existentialism",
      date: "Apr 2026",
      link: "https://fromthecabinet.com/text.html?slug=the-wall-and-nausea"
    },
    {
      id: "04",
      title: "The Sartrean Trap",
      category: "Metaphysics",
      date: "Feb 2026",
      link: "https://fromthecabinet.com/text.html?slug=sartrean-trap"
    },
    {
      id: "05",
      title: "Christocentric Determinism",
      category: "Theology",
      date: "Jan 2026",
      link: "https://fromthecabinet.com/text.html?slug=christocentric-determinism"
    }
  ];

  const WRITING_CATALOG_MACHINE = {
    id: "writingCatalog",
    initial: "defaultSpotlight",
    context: () => ({ spotlightId: "01", hoveredEssayId: null }),
    on: {
      HOVER_ESSAY: (ctx, event) => ({ context: { ...ctx, hoveredEssayId: event.id || null } }),
      LEAVE_ESSAY: (ctx) => ({ context: { ...ctx, hoveredEssayId: null } })
    },
    states: { defaultSpotlight: {} }
  };

  const Writing = ({ enterItem }) => {
    const [writingState, sendWriting] = useMachine(WRITING_CATALOG_MACHINE);
    const { hoveredEssayId } = writingState.context;

    return (
      <motion.section
        id="writing"
        variants={enterItem}
        data-machine="writingCatalog"
        data-state={writingState.value}
        data-hovered-essay={hoveredEssayId || undefined}
        aria-labelledby="writing-heading"
        className="tracking-normal"
      >
        <div className="flex items-baseline justify-between gap-4 pb-4 mb-4 border-b border-hairline">
          <h2
            id="writing-heading"
            className="text-base sm:text-[1.0625rem] font-semibold text-ink tracking-normal"
          >
            Writing
          </h2>
          <a
            href="https://fromthecabinet.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="muted-link text-[0.9375rem] font-medium tracking-normal"
          >
            View all
          </a>
        </div>

        <div className="focus-list -mx-3.5 sm:-mx-4 flex flex-col gap-1.5 sm:gap-2">
          {ESSAYS_DATA.map((essay, idx) => (
            <a
              key={essay.id}
              href={essay.link}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => sendWriting({ type: "HOVER_ESSAY", id: essay.id })}
              onMouseLeave={() => sendWriting("LEAVE_ESSAY")}
              onFocus={() => sendWriting({ type: "HOVER_ESSAY", id: essay.id })}
              onBlur={() => sendWriting("LEAVE_ESSAY")}
              className="focus-list-item tap-press flex items-center justify-between gap-5 sm:gap-6 px-3.5 sm:px-4 py-4 sm:py-[1.125rem] rounded-xl transition-[opacity,background-color,transform] duration-150 ease-out min-w-0"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                  <span className="text-[1.0625rem] sm:text-[1.125rem] font-semibold text-ink leading-[1.35] tracking-normal">
                    {essay.title}
                  </span>
                  {essay.isNew && (
                    <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-full bg-badge-bg text-badge-text text-[0.6875rem] leading-none font-semibold tracking-[0.06em] uppercase">
                      New
                    </span>
                  )}
                </div>
                <div className="mt-1.5 text-[0.9375rem] text-ink-muted leading-[1.45]">
                  {essay.category}
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-5 shrink-0">
                <span className="text-[0.9375rem] text-ink-muted tabular-nums">
                  {essay.date}
                </span>
                <PaperThumbnail variant={idx} />
              </div>
            </a>
          ))}
        </div>
      </motion.section>
    );
  };

  const FOCUS_ITEMS = [
    { id: "01", area: "Generative AI & RAG", stack: "RAG / LLMOps / Vector Stores / Agents" },
    { id: "02", area: "Full-Stack AI Infra", stack: "Docker / K8s / FastAPI / React" },
    { id: "03", area: "Programming", stack: "Python / SQL / TS / R" },
    { id: "04", area: "Cloud & DevOps", stack: "AWS / Azure / CI/CD" },
    { id: "05", area: "Spatial & Civic Data", stack: "GIS / Computer Vision" }
  ];

  const FocusIndex = ({ enterItem }) => (
    <motion.section id="about" variants={enterItem} aria-labelledby="focus-heading" className="tracking-normal">
      <div className="flex items-baseline justify-between gap-4 pb-4 mb-2 border-b border-hairline">
        <h2 id="focus-heading" className="text-base sm:text-[1.0625rem] font-semibold text-ink tracking-normal">
          Focus
        </h2>
        <a href="/cv" className="muted-link text-[0.9375rem] font-medium tracking-normal">
          Full CV
        </a>
      </div>

      <dl className="divide-y divide-hairline">
        {FOCUS_ITEMS.map((item) => (
          <div
            key={item.id}
            className="py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 sm:gap-4"
          >
            <dt className="text-[1.0625rem] sm:text-[1.125rem] font-semibold text-ink tracking-normal">
              {item.area}
            </dt>
            <dd className="text-[0.9375rem] text-ink-muted">
              {item.stack}
            </dd>
          </div>
        ))}
      </dl>
    </motion.section>
  );

  // --- PORTFOLIO APP ---
  const App = () => (
    <PortfolioShell
      footerHeadingLead="Let’s build something"
      footerHeadingAccent="together."
      footerSubtitle="Open to conversations about AI systems, spatial engineering, civic tech and philosophy."
      renderContent={({ theme, onToggleTheme, hapticsMuted, onToggleHaptics, enterItem, reduce }) => (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: reduce ? 0 : 0.08 } } }}
          className="max-w-[768px] mx-auto px-5 sm:px-8 safe-top pb-24 sm:pb-28 space-y-16 sm:space-y-20"
        >
          <IdentityAndBio
            theme={theme}
            onToggleTheme={onToggleTheme}
            hapticsMuted={hapticsMuted}
            onToggleHaptics={onToggleHaptics}
            enterItem={enterItem}
          />
          <ActivityStrip enterItem={enterItem} />
          <Projects enterItem={enterItem} />
          <Writing enterItem={enterItem} />
          <FocusIndex enterItem={enterItem} />
        </motion.div>
      )}
    />
  );

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
})();
