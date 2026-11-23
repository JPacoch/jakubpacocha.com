(() => {
  'use strict';

  const {
    useState,
    useEffect,
    useCallback
  } = React;

  const MotionLib = window.Motion || {};
  const motion = MotionLib.motion;
  const AnimatePresence = MotionLib.AnimatePresence;

  const {
    useReducedMotionSafe,
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

  // --- CV-SPECIFIC ICONS ---
  const ArrowLeftIcon = ({ className = "w-3.5 h-3.5" }) => (
    <svg className={`rtl:-scale-x-100 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path vectorEffect="non-scaling-stroke" d="M19 12H5" />
      <path vectorEffect="non-scaling-stroke" d="m12 19-7-7 7-7" />
    </svg>
  );

  const DownloadIcon = ({ className = "w-3.5 h-3.5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path vectorEffect="non-scaling-stroke" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline vectorEffect="non-scaling-stroke" points="7 10 12 15 17 10" />
      <line vectorEffect="non-scaling-stroke" x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );

  const ChevronDownIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path vectorEffect="non-scaling-stroke" d="m6 9 6 6 6-6" />
    </svg>
  );

  // --- SMOOTH COLLAPSIBLE PANEL PRIMITIVE ---
  const CollapsiblePanel = ({ id, isOpen, children }) => {
    const reduce = useReducedMotionSafe();
    const refreshCurtain = useCallback(() => {
      if (window.ScrollTrigger) {
        window.ScrollTrigger.refresh();
      }
    }, []);

    return (
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={id}
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0.12 : 0.24, ease: [0.2, 0, 0, 1] }}
            onAnimationComplete={refreshCurtain}
            style={{ overflow: "hidden" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  // --- CV CREDENTIAL, COLLAPSE & TAG EXPLORER MACHINE ---
  const DEFAULT_COLLAPSED_IDS = {
    "exp-iqor": true,
    "exp-oi": true,
    "exp-heksagon": true,
    "edu-beng": true,
    "edu-elte": true
  };

  const CV_EXPLORER_MACHINE = {
    id: "cvExplorer",
    initial: "overview",
    context: () => ({
      selectedTag: null,
      hoveredRole: null,
      collapsedIds: { ...DEFAULT_COLLAPSED_IDS }
    }),
    on: {
      TOGGLE_TAG: (ctx, event) => {
        const nextTag = ctx.selectedTag === event.tag ? null : event.tag;
        return {
          target: nextTag ? "filteringByTag" : "overview",
          context: { ...ctx, selectedTag: nextTag }
        };
      },
      CLEAR_TAG: (ctx) => ({
        target: "overview",
        context: { ...ctx, selectedTag: null }
      }),
      TOGGLE_ITEM: (ctx, event) => {
        const next = { ...ctx.collapsedIds };
        if (next[event.id]) delete next[event.id];
        else next[event.id] = true;
        return { context: { ...ctx, collapsedIds: next } };
      },
      SET_GROUP_COLLAPSED: (ctx, event) => {
        const next = { ...ctx.collapsedIds };
        (event.ids || []).forEach((id) => {
          if (event.collapsed) next[id] = true;
          else delete next[id];
        });
        return { context: { ...ctx, collapsedIds: next } };
      },
      EXPAND_ALL: (ctx) => ({
        context: { ...ctx, collapsedIds: {} }
      }),
      HOVER_ROLE: (ctx, event) => ({
        context: { ...ctx, hoveredRole: event.company || null }
      }),
      LEAVE_ROLE: (ctx) => ({
        context: { ...ctx, hoveredRole: null }
      })
    },
    states: {
      overview: {},
      filteringByTag: {
        on: {
          ESCAPE: (ctx) => ({
            target: "overview",
            context: { ...ctx, selectedTag: null }
          })
        }
      }
    }
  };

  const EXPERIENCE_DATA = [
    {
      id: "exp-here",
      period: "Nov 2026 – Present",
      role: "Lead AI Engineer",
      company: "HERE Technologies",
      domain: "AI Systems",
      bullets: [
        "Architecting scalable AI data services for analytical and intelligence workflows.",
        "Building resilient production pipelines and containerized microservices with modern cloud infrastructure."
      ],
      tags: ["Python", "AI Engineering", "AWS", "SQL", "LLMOps", "RAG"],
      current: true
    },
    {
      id: "exp-iqor",
      period: "Mar 2023 – Oct 2026",
      role: "AI Engineer / Data Scientist",
      company: "iQor",
      domain: "AI Systems",
      bullets: [
        "Architected production-grade Retrieval-Augmented Generation (RAG) systems and optimized high-throughput vector search performance.",
        "Led the architectural transition toward agentic LLM workflows, containerized APIs (FastAPI) and AWS cloud deployment.",
        "Built and maintained custom Model Context Protocol (MCP) servers, MCP-powered applications and autonomous agent workflows to standardize enterprise tool integrations.",
        "Executed end-to-end data enrichment, analysis and executive dashboarding pipelines to drive data-informed operational decisions.",
        "Conducted market research on emerging AI tooling and shaped the strategic vision and internal policies for AI adoption."
      ],
      tags: ["Python", "AWS", "LLMOps", "RAG", "Vector Databases", "FastAPI"]
    },
    {
      id: "exp-oi",
      period: "Jul 2021 – Feb 2023",
      role: "Data Scientist",
      company: "O-I",
      domain: "Predictive Analytics & MLOps",
      bullets: [
        "Developed, deployed and maintained automated machine learning pipelines for internal global stakeholders on large-scale tabular sales and cost datasets.",
        "Streamlined feature engineering and model lifecycle monitoring on Microsoft Azure."
      ],
      tags: ["Python", "Azure", "MLOps", "SQL"]
    },
    {
      id: "exp-heksagon",
      period: "Apr 2021 – Jan 2022",
      role: "Spatial Data Analyst",
      company: "Heksagon Research",
      domain: "Civic & Municipal Geoinformatics",
      bullets: [
        "Analyzed complex spatial and demographic datasets, producing high-precision visualizations and analytical reports for private, civic and municipal clients."
      ],
      tags: ["Python", "GIS", "SQL", "Spatial Statistics"]
    }
  ];

  const SKILL_MATRIX = [
    {
      id: "skill-ai",
      category: "AI & Machine Learning",
      items: ["LLM Orchestration & RAG", "Vector Stores & Embeddings", "Agentic Workflows", "Prompt Engineering", "Computer Vision (CNNs)", "Classical ML"]
    },
    {
      id: "skill-backend",
      category: "Backend & Infrastructure",
      items: ["Python (FastAPI, Flask)", "Docker & Containerization", "REST API", "SQL & relational databases", "C# / .NET utilities", "React & modern web"]
    },
    {
      id: "skill-cloud",
      category: "Cloud & DevOps",
      items: ["Amazon Web Services (AWS)", "Microsoft Azure", "Linux administration", "MLOps & telemetry"]
    },
    {
      id: "skill-spatial",
      category: "Spatial & Civic Systems",
      items: ["GIS & Geocomputation", "Network Analysis", "Municipal Data Systems", "Geomorphological Vision Models"]
    }
  ];

  const EDUCATION_DATA = [
    {
      id: "edu-msc",
      year: "2022 – 2023",
      degree: "Master of Science in Geoinformatics",
      institution: "Adam Mickiewicz University in Poznań",
      thesis: "Master’s thesis focused on Deep Learning and Computer Vision (CNNs) applied to geomorphology and Earth sciences; awarded funding under the ID-UB Study@research program.",
      tags: ["Computer Vision", "CNN", "Python", "GIS"]
    },
    {
      id: "edu-beng",
      year: "2018 – 2022",
      degree: "Bachelor of Engineering in Geoinformation",
      institution: "Adam Mickiewicz University in Poznań",
      thesis: "Engineering thesis focused on creating a Python-based spatial network analysis tool for public transport.",
      tags: ["Python", "GIS", "Network Analysis"]
    },
    {
      id: "edu-elte",
      year: "2019 – 2020",
      degree: "Engineering in Geoinformation (Erasmus+ Exchange)",
      institution: "Eötvös Loránd University (ELTE), Budapest",
      thesis: "International coursework in spatial data modeling, cartography and geocomputation.",
      tags: ["Python", "GIS", "International Exchange"]
    }
  ];

  // --- CV DOCUMENT ---
  const CVDocument = ({ theme, onToggleTheme, hapticsMuted, onToggleHaptics, enterItem }) => {
    const [explorerState, sendExplorer] = useMachine(CV_EXPLORER_MACHINE);
    const reduce = useReducedMotionSafe();
    const { selectedTag, hoveredRole, collapsedIds } = explorerState.context;
    const [copied, setCopied] = useState(false);

    useEffect(() => {
      const onBeforePrint = () => sendExplorer("EXPAND_ALL");
      window.addEventListener("beforeprint", onBeforePrint);
      return () => window.removeEventListener("beforeprint", onBeforePrint);
    }, [sendExplorer]);

    useEffect(() => {
      if (!selectedTag) return;
      const onKeyDown = (e) => {
        if (e.key === "Escape") sendExplorer("ESCAPE");
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [selectedTag, sendExplorer]);

    const handleCopyEmail = () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText("pacochp@gmail.com").catch(() => {});
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    };

    const isOpen = (id) => !collapsedIds[id];
    const allExpOpen = EXPERIENCE_DATA.every((e) => !collapsedIds[e.id]);
    const allSkillsOpen = SKILL_MATRIX.every((s) => !collapsedIds[s.id]);
    const allEduOpen = EDUCATION_DATA.every((ed) => !collapsedIds[ed.id]);

    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: reduce ? 0 : 0.08 } } }}
        data-machine="cvExplorer"
        data-state={explorerState.value}
        data-selected-tag={selectedTag || undefined}
        data-hovered-role={hoveredRole || undefined}
        className="max-w-[768px] mx-auto px-5 sm:px-8 safe-top pb-24 sm:pb-28 space-y-16 sm:space-y-20"
      >
        {/* CV Header */}
        <motion.div variants={enterItem}>
          {/* Top Utility Row (Hidden in PDF print) */}
          <nav
            aria-label="CV Navigation"
            className="no-print flex items-center justify-between gap-3 pb-3.5 sm:pb-0 border-b border-hairline sm:border-0 mb-7 sm:mb-12"
          >
            <a
              href="/"
              className="back-link tap-press hover-surface -ms-2.5 px-2.5 min-h-[40px] rounded-lg inline-flex items-center gap-1.5 text-[0.9375rem] font-medium text-ink-muted"
            >
              <ArrowLeftIcon className="back-arrow w-3.5 h-3.5 transition-transform duration-150 ease-out" />
              <span>Portfolio</span>
            </a>

            <div className="flex items-center gap-1 -me-1.5">
              <a
                href="#experience"
                className="hidden sm:inline-flex tap-press hover-surface px-2.5 min-h-[38px] rounded-lg items-center text-[0.9375rem] text-ink-muted"
              >
                Experience
              </a>
              <a
                href="#skills"
                className="hidden sm:inline-flex tap-press hover-surface px-2.5 min-h-[38px] rounded-lg items-center text-[0.9375rem] text-ink-muted"
              >
                Stack
              </a>
              <a
                href="#education"
                className="hidden sm:inline-flex tap-press hover-surface px-2.5 min-h-[38px] rounded-lg items-center text-[0.9375rem] text-ink-muted"
              >
                Education
              </a>

              <span aria-hidden="true" className="hidden sm:inline-block w-px h-4 bg-hairline mx-1" />

              <a
                href="assets/resume.pdf"
                download
                className="tap-press hover-surface px-2.5 min-h-[40px] rounded-lg inline-flex items-center gap-1.5 text-[0.9375rem] font-medium text-ink"
              >
                <DownloadIcon className="w-3.5 h-3.5" />
                <span>PDF</span>
              </a>

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

          {/* Identity & Summary */}
          <header className="space-y-4">
            <div>
              <h1 className="text-[1.625rem] sm:text-[1.5rem] font-semibold text-ink tracking-[-0.025em] sm:tracking-[-0.02em] leading-[1.2] sm:leading-[1.3]">
                Jakub Pacocha
              </h1>
              <p className="mt-1 sm:mt-0.5 text-[1.0625rem] sm:text-[1.125rem] font-medium text-ink-subtitle leading-[1.45]">
                Curriculum Vitae / Bydgoszcz, Poland
              </p>
            </div>

            <p className="text-[1.0625rem] sm:text-[1.125rem] text-ink-secondary leading-[1.7] text-pretty max-w-[60ch]">
              Full-stack AI engineer with 6+ years of experience building production data systems, RAG architectures and containerized ML infrastructure. Author of philosophical blog at{" "} <br/>
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

            {/* Contact & Profile Links: cleanly split into two spacious rows on mobile, single inline row on sm+ and print */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center print:flex-row print:items-center gap-y-0.5 sm:gap-y-1 sm:gap-x-2.5 print:gap-x-2.5 text-[1.0625rem] sm:text-[1.125rem] text-ink-secondary">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  data-revealed={copied ? "true" : undefined}
                  aria-label={copied ? "Email copied to clipboard" : "Copy pacochp@gmail.com to clipboard"}
                  className="reveal-link tap-press inline-flex items-center min-h-[40px] sm:inline-block sm:min-h-0 p-0 m-0 bg-transparent border-0 text-inherit cursor-pointer align-baseline"
                >
                  <span className="inline-link">pacochp@gmail.com</span>
                  <span className="no-print reveal-slot reveal-slot-copy" aria-hidden="true">
                    <IconSwap activeKey={copied ? "check" : "copy"}>
                      {copied ? (
                        <CheckIcon className="reveal-glyph reveal-glyph-copy w-[0.68em] h-[0.68em] text-ink" />
                      ) : (
                        <CopyIcon className="reveal-glyph reveal-glyph-copy w-[0.68em] h-[0.68em]" />
                      )}
                    </IconSwap>
                  </span>
                </button>
              </div>

              <span aria-hidden="true" className="hidden sm:inline print:inline text-ink-muted">/</span>

              <div className="flex flex-wrap items-center gap-x-3.5 sm:gap-x-2.5 print:gap-x-2.5 gap-y-0.5">
                <a
                  href="https://github.com/JPacoch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reveal-link inline-flex items-center min-h-[40px] sm:inline-block sm:min-h-0"
                >
                  <span className="inline-link">
                    <span className="sm:hidden print:hidden">GitHub</span>
                    <span className="hidden sm:inline print:inline">github.com/JPacoch</span>
                  </span>
                  <span className="no-print reveal-slot" aria-hidden="true">
                    <ArrowUpRightIcon tight className="reveal-glyph w-[0.5em] h-[0.5em]" strokeWidth={1.9} />
                  </span>
                </a>
                <span aria-hidden="true" className="text-ink-muted/60 sm:text-ink-muted">/</span>
                <a
                  href="https://www.linkedin.com/in/jakubpacocha/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reveal-link inline-flex items-center min-h-[40px] sm:inline-block sm:min-h-0"
                >
                  <span className="inline-link">LinkedIn</span>
                  <span className="no-print reveal-slot" aria-hidden="true">
                    <ArrowUpRightIcon tight className="reveal-glyph w-[0.5em] h-[0.5em]" strokeWidth={1.9} />
                  </span>
                </a>
                <span aria-hidden="true" className="text-ink-muted/60 sm:text-ink-muted">/</span>
                <a
                  href="https://x.com/JakubPacocha"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reveal-link inline-flex items-center min-h-[40px] sm:inline-block sm:min-h-0"
                >
                  <span className="inline-link">X</span>
                  <span className="no-print reveal-slot" aria-hidden="true">
                    <ArrowUpRightIcon tight className="reveal-glyph w-[0.5em] h-[0.5em]" strokeWidth={1.9} />
                  </span>
                </a>
              </div>

              <span className="sr-only" role="status" aria-live="polite">
                {copied ? "Email address pacochp@gmail.com copied." : ""}
              </span>
            </div>
          </header>
        </motion.div>

        {/* Experience Section */}
        <motion.section id="experience" variants={enterItem} aria-labelledby="experience-heading" className="tracking-normal">
          <span className="sr-only" role="status" aria-live="polite">
            {selectedTag ? `Filtered by tag ${selectedTag}.` : "Tag filter cleared."}
          </span>

          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-3 border-b border-hairline">
            <h2 id="experience-heading" className="text-base sm:text-[1.0625rem] font-semibold text-ink tracking-normal">
              Experience
            </h2>

            <div className="flex items-center gap-3 h-7">
              {selectedTag && (
                <button
                  key={selectedTag}
                  type="button"
                  onClick={() => sendExplorer("CLEAR_TAG")}
                  aria-label={`Clear ${selectedTag} filter`}
                  className="tag-pill-in no-print inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-ink text-canvas text-[0.875rem] leading-none font-medium cursor-pointer border-0 active:scale-[0.96] transition-transform duration-150 ease-out"
                >
                  <span>{selectedTag}</span>
                  <span aria-hidden="true">×</span>
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  sendExplorer({
                    type: "SET_GROUP_COLLAPSED",
                    ids: EXPERIENCE_DATA.map((e) => e.id),
                    collapsed: allExpOpen
                  })
                }
                className="no-print inline-flex items-center h-7 text-[0.9375rem] leading-none text-ink-muted hover-ink transition-colors duration-150 ease-out"
              >
                {allExpOpen ? "Collapse all" : "Expand all"}
              </button>
            </div>
          </div>

          <div className="divide-y divide-hairline">
            {EXPERIENCE_DATA.map((exp) => {
              const matchesTag = !selectedTag || exp.tags.includes(selectedTag);
              const open = isOpen(exp.id);
              const panelId = `${exp.id}-panel`;
              return (
                <article
                  key={exp.id}
                  onMouseEnter={() => sendExplorer({ type: "HOVER_ROLE", company: exp.company })}
                  onMouseLeave={() => sendExplorer("LEAVE_ROLE")}
                  className={`py-4 sm:py-5 transition-opacity duration-150 ease-out ${
                    selectedTag && !matchesTag ? "opacity-35" : ""
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => sendExplorer({ type: "TOGGLE_ITEM", id: exp.id })}
                    className="tap-press hover-surface w-[calc(100%+1.75rem)] sm:w-[calc(100%+2rem)] text-start -mx-3.5 sm:-mx-4 px-3.5 sm:px-4 py-3 rounded-xl flex items-start justify-between gap-4 cursor-pointer bg-transparent border-0"
                  >
                    <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1.5 sm:gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                          <h3 className="text-[1.0625rem] sm:text-[1.125rem] font-semibold text-ink tracking-normal leading-[1.35]">
                            {exp.role}
                          </h3>
                          {exp.current && (
                            <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-full bg-badge-bg text-badge-text text-[0.6875rem] leading-none font-semibold tracking-[0.06em] uppercase">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-base text-ink-muted">
                          <span className="text-ink font-semibold">{exp.company}</span>
                          {" / "}
                          <span>{exp.domain}</span>
                        </p>
                      </div>

                      <span className="text-[0.9375rem] text-ink-muted tabular-nums shrink-0">
                        {exp.period}
                      </span>
                    </div>

                    <ChevronDownIcon
                      className={`no-print w-4 h-4 text-ink-muted shrink-0 mt-1 transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)] ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <CollapsiblePanel id={panelId} isOpen={open}>
                    <div className="pt-3.5 pb-2">
                      <ul className="space-y-3 mb-5 text-base text-ink-secondary leading-[1.65] text-pretty list-none p-0 max-w-[60ch]">
                        {exp.bullets.map((b, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span aria-hidden="true" className="text-ink-muted select-none mt-px">–</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex flex-wrap gap-2">
                        {exp.tags.map((tag) => {
                          const isTagSelected = selectedTag === tag;
                          return (
                            <button
                              key={tag}
                              type="button"
                              aria-pressed={isTagSelected}
                              onClick={() => sendExplorer({ type: "TOGGLE_TAG", tag })}
                              className={`tap-press px-2.5 py-1 min-h-[30px] rounded-md text-[0.875rem] font-medium transition-colors duration-150 ease-out ${
                                isTagSelected
                                  ? "bg-ink text-canvas"
                                  : "bg-surface text-ink-secondary hover-ink"
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </CollapsiblePanel>
                </article>
              );
            })}
          </div>
        </motion.section>

        {/* Technical Capabilities Section */}
        <motion.section id="skills" variants={enterItem} aria-labelledby="skills-heading" className="tracking-normal">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-3 border-b border-hairline">
            <h2 id="skills-heading" className="text-base sm:text-[1.0625rem] font-semibold text-ink tracking-normal">
              Technical Capabilities
            </h2>
            <button
              type="button"
              onClick={() =>
                sendExplorer({
                  type: "SET_GROUP_COLLAPSED",
                  ids: SKILL_MATRIX.map((s) => s.id),
                  collapsed: allSkillsOpen
                })
              }
              className="no-print inline-flex items-center h-7 text-[0.9375rem] leading-none text-ink-muted hover-ink transition-colors duration-150 ease-out"
            >
              {allSkillsOpen ? "Collapse all" : "Expand all"}
            </button>
          </div>

          <div className="divide-y divide-hairline">
            {SKILL_MATRIX.map((group) => {
              const open = isOpen(group.id);
              const panelId = `${group.id}-panel`;
              return (
                <div key={group.id} className="py-4 sm:py-[1.125rem]">
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => sendExplorer({ type: "TOGGLE_ITEM", id: group.id })}
                    className="tap-press hover-surface w-[calc(100%+1.75rem)] sm:w-[calc(100%+2rem)] text-start -mx-3.5 sm:-mx-4 px-3.5 sm:px-4 py-2.5 rounded-xl flex items-baseline justify-between gap-4 cursor-pointer bg-transparent border-0"
                  >
                    <h3 className="text-[1.0625rem] sm:text-[1.125rem] font-semibold text-ink tracking-normal">
                      {group.category}
                    </h3>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-[0.9375rem] text-ink-muted tabular-nums">
                        {group.items.length}
                      </span>
                      <ChevronDownIcon
                        className={`no-print w-4 h-4 text-ink-muted transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)] ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  <CollapsiblePanel id={panelId} isOpen={open}>
                    <ul className="pt-3 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 list-none m-0">
                      {group.items.map((item) => {
                        const isMatched = Boolean(
                          selectedTag && item.toLowerCase().includes(selectedTag.toLowerCase())
                        );
                        return (
                          <li
                            key={item}
                            className={`flex items-baseline gap-2.5 text-base leading-[1.55] transition-colors duration-150 ease-out ${
                              isMatched
                                ? "text-ink font-semibold underline decoration-dotted underline-offset-[3px]"
                                : "text-ink-secondary"
                            }`}
                          >
                            <span aria-hidden="true" className="text-ink-muted select-none">–</span>
                            <span>{item}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </CollapsiblePanel>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Education Section */}
        <motion.section id="education" variants={enterItem} aria-labelledby="education-heading" className="tracking-normal">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-3 border-b border-hairline">
            <h2 id="education-heading" className="text-base sm:text-[1.0625rem] font-semibold text-ink tracking-normal">
              Education
            </h2>
            <button
              type="button"
              onClick={() =>
                sendExplorer({
                  type: "SET_GROUP_COLLAPSED",
                  ids: EDUCATION_DATA.map((ed) => ed.id),
                  collapsed: allEduOpen
                })
              }
              className="no-print inline-flex items-center h-7 text-[0.9375rem] leading-none text-ink-muted hover-ink transition-colors duration-150 ease-out"
            >
              {allEduOpen ? "Collapse all" : "Expand all"}
            </button>
          </div>

          <div className="divide-y divide-hairline">
            {EDUCATION_DATA.map((edu) => {
              const matchesTag = !selectedTag || edu.tags.includes(selectedTag);
              const open = isOpen(edu.id);
              const panelId = `${edu.id}-panel`;
              return (
                <article
                  key={edu.id}
                  className={`py-4 sm:py-5 transition-opacity duration-150 ease-out ${
                    selectedTag && !matchesTag ? "opacity-35" : ""
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => sendExplorer({ type: "TOGGLE_ITEM", id: edu.id })}
                    className="tap-press hover-surface w-[calc(100%+1.75rem)] sm:w-[calc(100%+2rem)] text-start -mx-3.5 sm:-mx-4 px-3.5 sm:px-4 py-3 rounded-xl flex items-start justify-between gap-4 cursor-pointer bg-transparent border-0"
                  >
                    <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1.5 sm:gap-4">
                      <div className="min-w-0">
                        <h3 className="text-[1.0625rem] sm:text-[1.125rem] font-semibold text-ink tracking-normal leading-[1.35]">
                          {edu.degree}
                        </h3>
                        <p className="mt-1.5 text-base text-ink-muted">
                          {edu.institution}
                        </p>
                      </div>

                      <span className="text-[0.9375rem] text-ink-muted tabular-nums shrink-0">
                        {edu.year}
                      </span>
                    </div>

                    <ChevronDownIcon
                      className={`no-print w-4 h-4 text-ink-muted shrink-0 mt-1 transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)] ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <CollapsiblePanel id={panelId} isOpen={open}>
                    <div className="pt-3 pb-2">
                      <p className="text-base text-ink-secondary leading-[1.65] text-pretty mb-5 max-w-[60ch]">
                        {edu.thesis}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {edu.tags.map((tag) => {
                          const isTagSelected = selectedTag === tag;
                          return (
                            <button
                              key={tag}
                              type="button"
                              aria-pressed={isTagSelected}
                              onClick={() => sendExplorer({ type: "TOGGLE_TAG", tag })}
                              className={`tap-press px-2.5 py-1 min-h-[30px] rounded-md text-[0.875rem] font-medium transition-colors duration-150 ease-out ${
                                isTagSelected
                                  ? "bg-ink text-canvas"
                                  : "bg-surface text-ink-secondary hover-ink"
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </CollapsiblePanel>
                </article>
              );
            })}
          </div>
        </motion.section>
      </motion.div>
    );
  };

  // --- CV APP ---
  const App = () => (
    <PortfolioShell
      skipLinkClassName="no-print"
      sparkClassName="no-print"
      footerHeadingLead="Open for"
      footerHeadingAccent="collaboration."
      footerSubtitle="Want to discuss AI engineering, data systems or a potential role?"
      renderContent={({ theme, onToggleTheme, hapticsMuted, onToggleHaptics, enterItem }) => (
        <CVDocument
          theme={theme}
          onToggleTheme={onToggleTheme}
          hapticsMuted={hapticsMuted}
          onToggleHaptics={onToggleHaptics}
          enterItem={enterItem}
        />
      )}
    />
  );

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
})();
