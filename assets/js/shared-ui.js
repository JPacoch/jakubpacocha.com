(() => {
  'use strict';

  const { useState, useEffect, useLayoutEffect, useRef, useCallback } = React;
  const MotionLib = window.Motion || {};
  const MotionConfig = MotionLib.MotionConfig || (({ children }) => children);

  const {
    useReducedMotionSafe,
    isHapticsMuted,
    GlobalHaptics,
    applyThemeWithoutSmear,
    useMachine,
    SCROLL_ENGINE_MACHINE,
    FOOTER_CURTAIN_MACHINE
  } = window.PortfolioCore;

  // --- GLOBAL CLICK SPARK CANVAS OVERLAY ---
  const ClickSpark = ({
    sparkColor = "currentColor",
    sparkOpacity = 0.3,
    sparkSize = 6,
    sparkRadius = 12,
    sparkCount = 6,
    duration = 300,
    easing = "ease-out",
    extraScale = 1.0,
    className = undefined
  }) => {
    const canvasRef = useRef(null);
    const sparksRef = useRef([]);
    const mutedRef = useRef(false);
    const reduce = useReducedMotionSafe();

    useEffect(() => {
      mutedRef.current = isHapticsMuted();
      const onMutedChange = () => {
        mutedRef.current = isHapticsMuted();
      };
      window.addEventListener("storage", onMutedChange);
      window.addEventListener("haptics-muted-change", onMutedChange);
      return () => {
        window.removeEventListener("storage", onMutedChange);
        window.removeEventListener("haptics-muted-change", onMutedChange);
      };
    }, []);

    const easeFunc = useCallback(
      (t) => {
        switch (easing) {
          case "linear":
            return t;
          case "ease-in":
            return t * t;
          case "ease-in-out":
            return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          default:
            return t * (2 - t);
        }
      },
      [easing]
    );

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const resize = () => {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      window.addEventListener("resize", resize);

      let animationId = null;

      const draw = (timestamp) => {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.globalAlpha = sparkOpacity;
        const resolvedColor =
          sparkColor === "currentColor" ? getComputedStyle(canvas).color : sparkColor;

        sparksRef.current = sparksRef.current.filter((spark) => {
          const elapsed = timestamp - spark.startTime;
          if (elapsed >= duration) return false;
          const progress = elapsed / duration;
          const eased = easeFunc(progress);
          const distance = eased * sparkRadius * extraScale;
          const lineLength = sparkSize * (1 - eased);
          const x1 = spark.x + distance * Math.cos(spark.angle);
          const y1 = spark.y + distance * Math.sin(spark.angle);
          const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
          const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);
          ctx.strokeStyle = resolvedColor;
          ctx.lineWidth = 1.5;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          return true;
        });

        if (sparksRef.current.length > 0) {
          animationId = requestAnimationFrame(draw);
        } else {
          animationId = null;
        }
      };

      const handleClick = (e) => {
        if (mutedRef.current || reduce) return;
        if (e.clientX === 0 && e.clientY === 0 && e.detail === 0) return;
        const now = performance.now();
        const newSparks = Array.from({ length: sparkCount }, (_, i) => ({
          x: e.clientX,
          y: e.clientY,
          angle: (2 * Math.PI * i) / sparkCount,
          startTime: now
        }));
        sparksRef.current.push(...newSparks);
        if (animationId === null) {
          animationId = requestAnimationFrame(draw);
        }
      };

      window.addEventListener("click", handleClick);

      return () => {
        window.removeEventListener("resize", resize);
        window.removeEventListener("click", handleClick);
        if (animationId !== null) cancelAnimationFrame(animationId);
      };
    }, [sparkColor, sparkSize, sparkRadius, sparkCount, duration, extraScale, easeFunc, sparkOpacity, reduce]);

    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={className}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 9999
        }}
      />
    );
  };

  // --- SHARED ICONS (Unified 24px grid, currentColor, non-scaling stroke) ---
  const ArrowUpRightIcon = ({ className = "w-3.5 h-3.5", strokeWidth = 1.75, tight = false }) => (
    <svg className={className} viewBox={tight ? "5.5 5.5 13 13" : "0 0 24 24"} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path vectorEffect="non-scaling-stroke" d="M7 17 17 7" />
      <path vectorEffect="non-scaling-stroke" d="M7 7h10v10" />
    </svg>
  );

  const CopyIcon = ({ className = "w-3.5 h-3.5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect vectorEffect="non-scaling-stroke" width="13" height="13" x="9" y="9" rx="2" />
      <path vectorEffect="non-scaling-stroke" d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );

  const CheckIcon = ({ className = "w-3.5 h-3.5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline vectorEffect="non-scaling-stroke" points="20 6 9 17 4 12" />
    </svg>
  );

  const SunIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle vectorEffect="non-scaling-stroke" cx="12" cy="12" r="4" />
      <path vectorEffect="non-scaling-stroke" d="M12 2v2" />
      <path vectorEffect="non-scaling-stroke" d="M12 20v2" />
      <path vectorEffect="non-scaling-stroke" d="m4.93 4.93 1.41 1.41" />
      <path vectorEffect="non-scaling-stroke" d="m17.66 17.66 1.41 1.41" />
      <path vectorEffect="non-scaling-stroke" d="M2 12h2" />
      <path vectorEffect="non-scaling-stroke" d="M20 12h2" />
      <path vectorEffect="non-scaling-stroke" d="m6.34 17.66-1.41 1.41" />
      <path vectorEffect="non-scaling-stroke" d="m19.07 4.93-1.41 1.41" />
    </svg>
  );

  const MoonIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path vectorEffect="non-scaling-stroke" d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );

  const SpeakerIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon vectorEffect="non-scaling-stroke" points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path vectorEffect="non-scaling-stroke" d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path vectorEffect="non-scaling-stroke" d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );

  const SpeakerMutedIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon vectorEffect="non-scaling-stroke" points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line vectorEffect="non-scaling-stroke" x1="22" x2="16" y1="9" y2="15" />
      <line vectorEffect="non-scaling-stroke" x1="16" x2="22" y1="9" y2="15" />
    </svg>
  );

  const MailIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect vectorEffect="non-scaling-stroke" width="20" height="16" x="2" y="4" rx="2" />
      <path vectorEffect="non-scaling-stroke" d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );

  const LinkedinIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path vectorEffect="non-scaling-stroke" d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect vectorEffect="non-scaling-stroke" width="4" height="12" x="2" y="9" />
      <circle vectorEffect="non-scaling-stroke" cx="4" cy="4" r="2" />
    </svg>
  );

  const TwitterIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path vectorEffect="non-scaling-stroke" d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5 5.96 15.6 7 12c-1.2.3-2.4.2-3.6-.1C2.5 10.6 4 9 4 9c-1.1-.3-2-.9-2.5-1.9 1-.3 2.1-.3 3.1-.1C2.3 5 4 2 4 2c1.6 2 4 4 7.4 4.5 0-1.1.5-2.2 1.5-2.9 1.4-1.1 3.5-.8 4.6.5 1.1-.2 2.1-.7 3-1.2-.4 1.1-1.1 2-2 2.7 1-.1 1.9-.4 2.8-.8Z" />
    </svg>
  );

  const GithubIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path vectorEffect="non-scaling-stroke" d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path vectorEffect="non-scaling-stroke" d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );

  // --- CONTEXTUAL ICON SWAP (Single-node CSS animation: immune to AnimatePresence overlap) ---
  const IconSwap = ({ activeKey, children }) => (
    <span key={activeKey} className="icon-swap-in inline-flex items-center justify-center">
      {children}
    </span>
  );

  // --- FULL-BLEED EMERGING CURTAIN FOOTER ---
  const EmergingFooter = ({
    curtainState,
    sendCurtain,
    reduce,
    headingLead,
    headingAccent,
    subtitle
  }) => {
    const handleFooterLinkFocus = (channel) => {
      sendCurtain({ type: "FOCUS_CHANNEL", channel });
      if (!reduce && curtainState.value !== "revealed") {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "smooth"
        });
      }
    };

    const channels = [
      { id: "email", label: "Email", href: "mailto:pacochp@gmail.com", icon: <MailIcon />, external: false },
      { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/jakubpacocha/", icon: <LinkedinIcon />, external: true },
      { id: "twitter", label: "X / Twitter", href: "https://x.com/JakubPacocha", icon: <TwitterIcon />, external: true },
      { id: "github", label: "GitHub", href: "https://github.com/JPacoch", icon: <GithubIcon />, external: true }
    ];

    return (
      <footer
        id="footer-container"
        data-machine="footerCurtain"
        data-state={curtainState.value}
        data-progress={curtainState.context.progress}
        data-active-channel={curtainState.context.activeChannel || undefined}
        className={`${
          reduce
            ? "relative z-10 w-full bg-footer-bg text-footer-ink"
            : "fixed bottom-0 inset-x-0 z-0 h-[76dvh] min-h-[500px] sm:h-[64dvh] sm:min-h-[500px] w-full bg-footer-bg text-footer-ink overflow-hidden"
        } font-sans flex flex-col justify-between`}
      >
        <div
          id="footer-container-inner"
          className="w-full h-full max-w-[768px] mx-auto px-5 sm:px-8 pt-10 sm:pt-20 safe-bottom flex flex-col justify-between text-start"
        >
          <div className="my-auto">
            <h2 className="text-4xl sm:text-7xl font-semibold leading-[1.08] tracking-[-0.03em] text-footer-ink text-balance mb-3.5 sm:mb-4">
              {headingLead}{" "}
              <span className="text-footer-muted font-medium italic">{headingAccent}</span>
            </h2>

            <p className="text-base sm:text-[1.0625rem] text-footer-secondary leading-[1.6] text-pretty max-w-[42ch] mb-6 sm:mb-8">
              {subtitle}
            </p>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5">
              {channels.map((ch) => (
                <a
                  key={ch.id}
                  href={ch.href}
                  target={ch.external ? "_blank" : undefined}
                  rel={ch.external ? "noopener noreferrer" : undefined}
                  onFocus={() => handleFooterLinkFocus(ch.id)}
                  onBlur={() => sendCurtain("BLUR_CHANNEL")}
                  onMouseEnter={() => sendCurtain({ type: "FOCUS_CHANNEL", channel: ch.id })}
                  onMouseLeave={() => sendCurtain("BLUR_CHANNEL")}
                  className="focus-ring-light tap-press hover-light-pill w-full sm:w-auto justify-center sm:justify-start min-h-[46px] sm:min-h-[42px] px-4 sm:ps-3.5 sm:pe-4 py-2.5 sm:py-2 rounded-full bg-white/10 border border-white/15 text-footer-ink text-[0.9375rem] font-medium inline-flex items-center gap-2"
                >
                  {ch.icon}
                  <span>{ch.label}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="pt-5 sm:pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 text-[0.875rem] sm:text-base text-footer-muted leading-snug">
            <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 m-0">
              <span className="whitespace-nowrap">© 2026 <span className="font-semibold text-footer-ink">Jakub Pacocha</span>.</span>
              <span className="whitespace-nowrap">All rights reserved.</span>
            </p>
            <span className="text-[0.8125rem] sm:text-base text-footer-muted/80 sm:text-footer-muted">Bydgoszcz, Poland</span>
          </div>
        </div>
      </footer>
    );
  };

  // --- SHARED PORTFOLIO SHELL (Scroll engine, Curtain Reveal, Theme/Haptics toggles) ---
  const PortfolioShell = ({
    footerHeadingLead,
    footerHeadingAccent,
    footerSubtitle,
    skipLinkClassName = "",
    sparkClassName = undefined,
    renderContent
  }) => {
    const [scrollEngine, sendScrollEngine] = useMachine(SCROLL_ENGINE_MACHINE);
    const [curtainState, sendCurtain] = useMachine(FOOTER_CURTAIN_MACHINE);
    const reduce = useReducedMotionSafe();
    const mainRef = useRef(null);

    const [theme, setTheme] = useState(() =>
      typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light"
    );

    const [hapticsMuted, setHapticsMuted] = useState(() => isHapticsMuted());

    const handleToggleHaptics = useCallback(() => {
      setHapticsMuted((prev) => {
        const next = !prev;
        try {
          localStorage.setItem("haptics-muted", String(next));
        } catch (e) {}
        window.dispatchEvent(new Event("haptics-muted-change"));
        return next;
      });
    }, []);

    const handleToggleTheme = useCallback(() => {
      setTheme((prev) => {
        const next = prev === "dark" ? "light" : "dark";
        applyThemeWithoutSmear(next);
        return next;
      });
    }, []);

    useEffect(() => {
      let lastY = window.scrollY;
      let idleTimer = null;

      const onScroll = () => {
        const currentY = window.scrollY;
        const direction = currentY >= lastY ? "down" : "up";
        lastY = currentY;
        sendScrollEngine({ type: "SCROLL_ACTIVE", direction });
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => sendScrollEngine("SCROLL_IDLE"), 160);
      };

      const onVisChange = () => {
        sendScrollEngine(document.visibilityState === "visible" ? "VISIBILITY_VISIBLE" : "VISIBILITY_HIDDEN");
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("visibilitychange", onVisChange);
      return () => {
        clearTimeout(idleTimer);
        window.removeEventListener("scroll", onScroll);
        document.removeEventListener("visibilitychange", onVisChange);
      };
    }, [sendScrollEngine]);

    useLayoutEffect(() => {
      if (reduce || !window.gsap || !window.ScrollTrigger) {
        sendCurtain("REVEAL");
        return;
      }

      const { gsap, ScrollTrigger } = window;
      gsap.registerPlugin(ScrollTrigger);

      let st = null;
      let tl = null;
      let resizeObserver = null;

      const initCurtain = () => {
        const spacer = document.getElementById("footer-spacer");
        const mainEl = document.getElementById("main-content");
        const footerBackdrop = document.getElementById("footer-backdrop");
        const footerInner = document.getElementById("footer-container-inner");
        if (!spacer || !mainEl || !footerInner) return;

        const getCornerRadius = () => (window.innerWidth < 640 ? "26px" : "36px");

        tl = gsap.timeline()
          .to(footerBackdrop, { opacity: 1, duration: 0.06, ease: "none" }, 0)
          .to(
            mainEl,
            {
              scale: 0.96,
              borderBottomLeftRadius: getCornerRadius,
              borderBottomRightRadius: getCornerRadius,
              ease: "none"
            },
            0
          )
          .fromTo(
            footerInner,
            { y: "14%", opacity: 0.25 },
            { y: "0%", opacity: 1, ease: "none" },
            0
          );

        st = ScrollTrigger.create({
          trigger: spacer,
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            sendCurtain({ type: "SCRUB_PROGRESS", progress: self.progress });
          },
          animation: tl
        });

        ScrollTrigger.refresh();
      };

      const initTimer = window.setTimeout(initCurtain, 60);

      if (typeof ResizeObserver !== "undefined" && mainRef.current) {
        resizeObserver = new ResizeObserver(() => ScrollTrigger.refresh());
        resizeObserver.observe(mainRef.current);
      }

      return () => {
        window.clearTimeout(initTimer);
        if (resizeObserver) resizeObserver.disconnect();
        if (st) st.kill();
        if (tl) tl.kill();
        gsap.set(["#main-content", "#footer-backdrop", "#footer-container-inner"], { clearProps: "all" });
      };
    }, [reduce, sendCurtain]);

    const enterItem = {
      hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 10, filter: "blur(4px)" },
      visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.3, ease: "easeOut" }
      }
    };

    const skipBase =
      "sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-ink focus:text-canvas focus:text-sm focus:font-medium";

    return (
      <MotionConfig reducedMotion="user">
        <div
          id="app-shell"
          data-machine="scrollEngine"
          data-state={scrollEngine.value}
          data-scroll-direction={scrollEngine.context.direction}
          className="bg-canvas min-h-[100dvh] font-sans text-ink"
        >
          <GlobalHaptics />
          <ClickSpark className={sparkClassName} />

          <a
            href="#main-content"
            className={skipLinkClassName ? `${skipLinkClassName} ${skipBase}` : skipBase}
          >
            Skip to content
          </a>

          {!reduce && (
            <div
              id="footer-backdrop"
              aria-hidden="true"
              className="fixed inset-0 z-0 bg-footer-bg opacity-0 pointer-events-none"
            />
          )}

          <main
            id="main-content"
            ref={mainRef}
            className="relative z-10 main-curtain-surface w-full origin-[50%_100%]"
          >
            {renderContent({
              theme,
              onToggleTheme: handleToggleTheme,
              hapticsMuted,
              onToggleHaptics: handleToggleHaptics,
              enterItem,
              reduce
            })}
          </main>

          {!reduce && (
            <div
              id="footer-spacer"
              aria-hidden="true"
              className="h-[76dvh] min-h-[500px] sm:h-[64dvh] sm:min-h-[500px] w-full pointer-events-none"
            />
          )}

          <EmergingFooter
            curtainState={curtainState}
            sendCurtain={sendCurtain}
            reduce={reduce}
            headingLead={footerHeadingLead}
            headingAccent={footerHeadingAccent}
            subtitle={footerSubtitle}
          />
        </div>
      </MotionConfig>
    );
  };

  window.PortfolioUI = {
    ArrowUpRightIcon,
    CopyIcon,
    CheckIcon,
    SunIcon,
    MoonIcon,
    SpeakerIcon,
    SpeakerMutedIcon,
    IconSwap,
    PortfolioShell
  };
})();
