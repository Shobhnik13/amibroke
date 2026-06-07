import type { Metadata } from "next";

const GITHUB_AUTH_URL = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/auth/github`;

export const metadata: Metadata = {
  title: "amibroke.dev — Track your AI coding spend",
  description:
    "See how much you're spending on Claude Code, Codex, and OpenCode. Compare with devs worldwide on the global leaderboard.",
};

// ── design tokens ──────────────────────────────────────────
const ink    = "#f0ece0";
const bg     = "#0f0d0b";
const term   = "#090806";
const surface = "#1a1714";
const muted  = "#8c8278";
const yellow = "#fff261";
const cyan   = "#59e8ff";
const coral  = "#ff6464";
const green  = "#5dff9c";
const pink   = "#ff7bd4";

// ── mock data ───────────────────────────────────────────────
const MOCK_LB = [
  { rank: 1, user: "shobhnik13",    tokens: "2.4M",  cost: "$284", color: yellow },
  { rank: 2, user: "ai_power_user", tokens: "1.8M",  cost: "$201", color: cyan   },
  { rank: 3, user: "buildinpublic", tokens: "1.2M",  cost: "$156", color: green  },
  { rank: 4, user: "cursor_devotee",tokens: "891k",  cost: "$98",  color: coral  },
  { rank: 5, user: "claude_enjoyer",tokens: "654k",  cost: "$67",  color: pink   },
];

const RANK_COLORS = [yellow, cyan, green, coral, pink];


const STEPS = [
  {
    num: "01",
    color: yellow,
    title: "Install in 30 seconds",
    body: "Run one command. Paste your key. The CLI detects Claude Code, Codex, and OpenCode automatically.",
    snippet: "$ bunx amibroke init <key>",
    snippetColor: yellow,
  },
  {
    num: "02",
    color: cyan,
    title: "Tracks silently",
    body: "A daemon syncs every 3 hours in the background. Zero config, zero interruptions, zero overhead.",
    snippet: "● Daemon active · next sync in 2h 41m",
    snippetColor: cyan,
  },
  {
    num: "03",
    color: coral,
    title: "See your rank",
    body: "Your spend lands on the public leaderboard. Token counts, costs, weekly and all-time views.",
    snippet: "You are ranked #4 globally ↑2",
    snippetColor: green,
  },
];

// ── page ────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      {/* ── NAV ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: `${bg}e0`,
          backdropFilter: "blur(14px)",
          borderBottom: `1px solid rgba(240,236,224,0.07)`,
        }}
      >
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "min(1180px, calc(100% - 40px))",
            margin: "0 auto",
            padding: "18px 0",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontWeight: 900,
              fontSize: "0.95rem",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: ink,
            }}
          >
            <div
              style={{
                display: "grid",
                placeItems: "center",
                width: 38,
                height: 38,
                border: `3px solid ${ink}`,
                borderRadius: 11,
                background: yellow,
                color: bg,
                fontWeight: 900,
                fontSize: "0.78rem",
                boxShadow: `4px 4px 0 ${ink}`,
                letterSpacing: 0,
              }}
            >
              A$
            </div>
            amibroke
          </div>

          {/* Nav CTA */}
          <a
            href={GITHUB_AUTH_URL}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              minHeight: 40,
              padding: "0 16px",
              border: `3px solid ${ink}`,
              borderRadius: 999,
              background: coral,
              color: bg,
              fontWeight: 900,
              fontSize: "0.78rem",
              textTransform: "uppercase",
              textDecoration: "none",
              boxShadow: `4px 4px 0 ${ink}`,
              letterSpacing: "0.04em",
            }}
          >
            Get your key →
          </a>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section
        style={{
          width: "min(1180px, calc(100% - 40px))",
          margin: "0 auto",
          padding: "64px 0 80px",
        }}
      >
        <div
          className="hero-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 440px",
            gap: 54,
            alignItems: "center",
          }}
        >
          {/* Left — copy */}
          <div>
            {/* Eyebrow */}
            <div
              className="hero-enter hero-enter-1"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                border: `2px solid ${ink}`,
                borderRadius: 999,
                background: cyan,
                padding: "8px 14px",
                fontSize: "0.76rem",
                fontWeight: 900,
                textTransform: "uppercase",
                color: bg,
                marginBottom: 28,
                letterSpacing: "0.07em",
              }}
            >
              <span>●</span> Free forever · Open source
            </div>

            <h1
              className="hero-enter hero-enter-2"
              style={{
                fontSize: "clamp(3rem, 6vw, 5.4rem)",
                fontWeight: 900,
                lineHeight: 0.92,
                textTransform: "uppercase",
                color: ink,
                marginBottom: 28,
                maxWidth: "11ch",
                letterSpacing: "-0.01em",
              }}
            >
              Your AI Coding Bill, Exposed.
            </h1>

            <p
              className="hero-enter hero-enter-3"
              style={{
                fontSize: "1.12rem",
                fontWeight: 600,
                lineHeight: 1.58,
                color: muted,
                maxWidth: 490,
                marginBottom: 40,
              }}
            >
              Track every token you burn in Claude Code, Codex, and OpenCode.
              See your real spend. Compete on the global leaderboard.
            </p>

            <div
              className="hero-enter hero-enter-4 hero-cta-row"
              style={{ display: "flex", flexWrap: "wrap", gap: 14 }}
            >
              <a
                href={GITHUB_AUTH_URL}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 54,
                  padding: "0 24px",
                  border: `3px solid ${ink}`,
                  borderRadius: 18,
                  background: coral,
                  color: bg,
                  fontWeight: 900,
                  fontSize: "0.95rem",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  boxShadow: `8px 8px 0 ${yellow}`,
                  letterSpacing: "0.03em",
                }}
              >
                Install in 30 sec →
              </a>
              <a
                href="#leaderboard"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 54,
                  padding: "0 24px",
                  border: `3px solid ${ink}`,
                  borderRadius: 18,
                  background: "transparent",
                  color: ink,
                  fontWeight: 900,
                  fontSize: "0.95rem",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  boxShadow: `8px 8px 0 rgba(240,236,224,0.1)`,
                  letterSpacing: "0.03em",
                }}
              >
                See leaderboard
              </a>
            </div>
          </div>

          {/* Right — terminal mockup */}
          <div className="hero-visual" style={{ position: "relative" }}>
            {/* Floating badge — FREE */}
            <div
              style={{
                position: "absolute",
                top: -18,
                right: -10,
                zIndex: 2,
                display: "grid",
                placeItems: "center",
                minWidth: 100,
                minHeight: 42,
                border: `3px solid ${ink}`,
                borderRadius: 13,
                background: green,
                padding: "0 14px",
                fontSize: "0.76rem",
                fontWeight: 900,
                textTransform: "uppercase",
                color: bg,
                boxShadow: `5px 5px 0 ${ink}`,
                letterSpacing: "0.06em",
                transform: "rotate(3deg)",
              }}
            >
              FREE
            </div>

            {/* Floating badge — OPEN SOURCE */}
            <div
              style={{
                position: "absolute",
                bottom: -14,
                left: -22,
                zIndex: 2,
                display: "grid",
                placeItems: "center",
                minWidth: 130,
                minHeight: 42,
                border: `3px solid ${ink}`,
                borderRadius: 13,
                background: pink,
                padding: "0 14px",
                fontSize: "0.76rem",
                fontWeight: 900,
                textTransform: "uppercase",
                color: ink,
                boxShadow: `5px 5px 0 ${ink}`,
                letterSpacing: "0.06em",
                transform: "rotate(-2deg)",
              }}
            >
              OPEN SOURCE
            </div>

            {/* Terminal window */}
            <div
              style={{
                border: `3px solid ${ink}`,
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: `10px 10px 0 ${yellow}`,
              }}
            >
              {/* Title bar */}
              <div
                style={{
                  background: surface,
                  borderBottom: `2px solid rgba(240,236,224,0.1)`,
                  padding: "11px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: coral }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: yellow }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: green }} />
                <span
                  style={{
                    marginLeft: 10,
                    fontFamily: "ui-monospace, 'Cascadia Code', monospace",
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    color: muted,
                  }}
                >
                  ~/amibroke
                </span>
              </div>

              {/* Terminal body */}
              <div
                style={{
                  background: term,
                  padding: "20px 20px 22px",
                  fontFamily:
                    "ui-monospace, 'Cascadia Code', 'Fira Code', monospace",
                  fontSize: "0.8rem",
                  lineHeight: 1.7,
                }}
              >
                {/* Command line */}
                <div style={{ display: "flex", gap: 8, marginBottom: 3 }}>
                  <span style={{ color: green, fontWeight: 700 }}>$</span>
                  <span style={{ color: ink }}>bunx amibroke sync</span>
                </div>
                <div style={{ color: green, fontWeight: 700, marginBottom: 20 }}>
                  ✓ Synced 247 records · 2.3M tokens
                </div>

                {/* Leaderboard label */}
                <div
                  style={{
                    color: yellow,
                    fontWeight: 800,
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 6,
                  }}
                >
                  LEADERBOARD · THIS WEEK
                </div>
                <div
                  style={{
                    borderTop: `1px solid rgba(240,236,224,0.1)`,
                    marginBottom: 12,
                  }}
                />

                {/* Rows */}
                {MOCK_LB.map((entry) => (
                  <div
                    key={entry.rank}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "5px 0",
                      borderBottom: `1px solid rgba(240,236,224,0.05)`,
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          color: muted,
                          fontWeight: 600,
                          width: 22,
                          textAlign: "right",
                          fontSize: "0.72rem",
                          flexShrink: 0,
                        }}
                      >
                        #{entry.rank}
                      </span>
                      <span
                        style={{
                          color: ink,
                          fontWeight: 700,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {entry.user}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ color: muted, fontSize: "0.72rem" }}>
                        {entry.tokens}
                      </span>
                      <span
                        style={{
                          color: entry.color,
                          fontWeight: 800,
                          fontSize: "0.82rem",
                        }}
                      >
                        {entry.cost}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Prompt with blinking cursor */}
                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ color: green, fontWeight: 700 }}>$</span>
                  <span
                    className="terminal-cursor"
                    style={{
                      display: "inline-block",
                      width: 7,
                      height: 14,
                      background: green,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SUPPORTED PLATFORMS ── */}
      <section
        style={{
          width: "min(1180px, calc(100% - 40px))",
          margin: "0 auto",
          padding: "72px 0 60px",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: `2px solid ${ink}`,
              borderRadius: 999,
              background: yellow,
              padding: "8px 14px",
              fontSize: "0.76rem",
              fontWeight: 900,
              textTransform: "uppercase",
              color: bg,
              marginBottom: 18,
              letterSpacing: "0.07em",
            }}
          >
            ⚡ Supported platforms
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
                fontWeight: 900,
                color: ink,
                textTransform: "uppercase",
                lineHeight: 1,
                letterSpacing: "-0.01em",
              }}
            >
              Works with your tools
            </h2>
            {/* Mac/Linux only funky note */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                border: `2px solid rgba(240,236,224,0.2)`,
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: "0.76rem",
                fontWeight: 700,
                color: muted,
                letterSpacing: "0.02em",
              }}
            >
              <span>🍎</span> macOS &amp; Linux only — sorry Windows, maybe fix your terminal first
            </div>
          </div>
        </div>

        {/* Platform cards grid */}
        <div
          className="platforms-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 16,
          }}
        >
          {/* ── Claude Code ── */}
          <div
            style={{
              border: `3px solid ${ink}`,
              borderRadius: 22,
              background: surface,
              padding: "26px 22px",
              boxShadow: `6px 6px 0 ${coral}`,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* Logo box */}
            <div
              style={{
                display: "grid",
                placeItems: "center",
                width: 54,
                height: 54,
                borderRadius: 15,
                background: "#CC785C",
                border: `3px solid ${ink}`,
                boxShadow: `4px 4px 0 ${ink}`,
                flexShrink: 0,
              }}
            >
              {/* Anthropic "A" mark */}
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 4L25 23H3L14 4Z" fill="white" opacity="0.95" />
                <path d="M9.5 17.5H18.5" stroke="#CC785C" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>

            <div>
              <div style={{ fontWeight: 900, fontSize: "1.05rem", color: ink, lineHeight: 1.2 }}>
                Claude Code
              </div>
              <div style={{ fontSize: "0.78rem", color: muted, fontWeight: 600, marginTop: 3 }}>
                by Anthropic
              </div>
            </div>

            <p style={{ fontSize: "0.86rem", color: muted, fontWeight: 600, lineHeight: 1.55, flexGrow: 1 }}>
              Reads JSONL session files from <code style={{ color: ink, background: "rgba(240,236,224,0.08)", padding: "1px 5px", borderRadius: 5 }}>~/.claude/projects</code>
            </p>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                alignSelf: "flex-start",
                gap: 6,
                border: `2px solid ${ink}`,
                borderRadius: 999,
                background: coral,
                padding: "5px 11px",
                fontSize: "0.7rem",
                fontWeight: 900,
                textTransform: "uppercase",
                color: bg,
                letterSpacing: "0.05em",
              }}
            >
              JSONL
            </div>
          </div>

          {/* ── Codex ── */}
          <div
            style={{
              border: `3px solid ${ink}`,
              borderRadius: 22,
              background: surface,
              padding: "26px 22px",
              boxShadow: `6px 6px 0 ${green}`,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* Logo box */}
            <div
              style={{
                display: "grid",
                placeItems: "center",
                width: 54,
                height: 54,
                borderRadius: 15,
                background: "#f7f7f5",
                border: `3px solid ${ink}`,
                boxShadow: `4px 4px 0 ${ink}`,
                flexShrink: 0,
              }}
            >
              {/* OpenAI mark — stylized polygon/spiral */}
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path
                  d="M14 3.5C14 3.5 22.5 7.5 22.5 14C22.5 18.5 19 22 14 22C9 22 5.5 18.5 5.5 14C5.5 9.5 9 6 14 6"
                  stroke="#0f0d0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M14 8C14 8 19 10.5 19 14C19 16.8 16.8 19 14 19C11.2 19 9 16.8 9 14C9 11.2 11.2 9 14 9"
                  stroke="#0f0d0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="14" cy="14" r="2" fill="#0f0d0b" />
              </svg>
            </div>

            <div>
              <div style={{ fontWeight: 900, fontSize: "1.05rem", color: ink, lineHeight: 1.2 }}>
                Codex
              </div>
              <div style={{ fontSize: "0.78rem", color: muted, fontWeight: 600, marginTop: 3 }}>
                by OpenAI
              </div>
            </div>

            <p style={{ fontSize: "0.86rem", color: muted, fontWeight: 600, lineHeight: 1.55, flexGrow: 1 }}>
              Reads JSONL session files from <code style={{ color: ink, background: "rgba(240,236,224,0.08)", padding: "1px 5px", borderRadius: 5 }}>~/.codex/sessions</code>
            </p>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                alignSelf: "flex-start",
                gap: 6,
                border: `2px solid ${ink}`,
                borderRadius: 999,
                background: green,
                padding: "5px 11px",
                fontSize: "0.7rem",
                fontWeight: 900,
                textTransform: "uppercase",
                color: bg,
                letterSpacing: "0.05em",
              }}
            >
              JSONL
            </div>
          </div>

          {/* ── OpenCode ── */}
          <div
            style={{
              border: `3px solid ${ink}`,
              borderRadius: 22,
              background: surface,
              padding: "26px 22px",
              boxShadow: `6px 6px 0 ${cyan}`,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* Logo box */}
            <div
              style={{
                display: "grid",
                placeItems: "center",
                width: 54,
                height: 54,
                borderRadius: 15,
                background: "#7c3aed",
                border: `3px solid ${ink}`,
                boxShadow: `4px 4px 0 ${ink}`,
                flexShrink: 0,
              }}
            >
              {/* Terminal ">" icon */}
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <polyline points="5,8 12,13 5,18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="14" y1="18" x2="21" y2="18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>

            <div>
              <div style={{ fontWeight: 900, fontSize: "1.05rem", color: ink, lineHeight: 1.2 }}>
                OpenCode
              </div>
              <div style={{ fontSize: "0.78rem", color: muted, fontWeight: 600, marginTop: 3 }}>
                open source
              </div>
            </div>

            <p style={{ fontSize: "0.86rem", color: muted, fontWeight: 600, lineHeight: 1.55, flexGrow: 1 }}>
              Reads SQLite database from <code style={{ color: ink, background: "rgba(240,236,224,0.08)", padding: "1px 5px", borderRadius: 5 }}>~/.local/share/opencode</code>
            </p>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                alignSelf: "flex-start",
                gap: 6,
                border: `2px solid ${ink}`,
                borderRadius: 999,
                background: cyan,
                padding: "5px 11px",
                fontSize: "0.7rem",
                fontWeight: 900,
                textTransform: "uppercase",
                color: bg,
                letterSpacing: "0.05em",
              }}
            >
              SQLite
            </div>
          </div>

          {/* ── Add more / GitHub card ── */}
          <div
            style={{
              border: `3px dashed rgba(240,236,224,0.25)`,
              borderRadius: 22,
              background: "transparent",
              padding: "26px 22px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              textAlign: "center",
              minHeight: 260,
            }}
          >
            {/* GitHub icon */}
            <div
              style={{
                display: "grid",
                placeItems: "center",
                width: 54,
                height: 54,
                borderRadius: 15,
                background: surface,
                border: `3px solid rgba(240,236,224,0.2)`,
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill={muted}>
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </div>

            <div>
              <div style={{ fontWeight: 900, fontSize: "0.95rem", color: ink, lineHeight: 1.3 }}>
                Missing your tool?
              </div>
              <div style={{ fontSize: "0.8rem", color: muted, fontWeight: 600, marginTop: 6, lineHeight: 1.5 }}>
                Open an issue and we&apos;ll add support
              </div>
            </div>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                minHeight: 40,
                padding: "0 16px",
                border: `3px solid rgba(240,236,224,0.35)`,
                borderRadius: 999,
                background: "transparent",
                color: ink,
                fontWeight: 900,
                fontSize: "0.78rem",
                textTransform: "uppercase",
                textDecoration: "none",
                letterSpacing: "0.04em",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Request on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        style={{
          width: "min(1180px, calc(100% - 40px))",
          margin: "0 auto",
          padding: "80px 0 60px",
        }}
      >
        {/* Kicker */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            border: `2px solid ${ink}`,
            borderRadius: 999,
            background: green,
            padding: "8px 14px",
            fontSize: "0.76rem",
            fontWeight: 900,
            textTransform: "uppercase",
            color: bg,
            marginBottom: 36,
            letterSpacing: "0.07em",
          }}
        >
          ↓ HOW IT WORKS
        </div>

        <div
          className="steps-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 20,
          }}
        >
          {STEPS.map((step) => (
            <div
              key={step.num}
              style={{
                border: `3px solid ${ink}`,
                borderRadius: 22,
                background: surface,
                padding: "28px 24px",
                boxShadow: `6px 6px 0 rgba(240,236,224,0.07)`,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* Number badge */}
              <div
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 48,
                  height: 48,
                  border: `3px solid ${ink}`,
                  borderRadius: 13,
                  background: step.color,
                  color: bg,
                  fontWeight: 900,
                  fontSize: "1rem",
                  boxShadow: `4px 4px 0 ${ink}`,
                }}
              >
                {step.num}
              </div>

              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 900,
                  color: ink,
                  textTransform: "uppercase",
                  lineHeight: 1.1,
                  letterSpacing: "0.01em",
                }}
              >
                {step.title}
              </h3>

              <p
                style={{
                  fontSize: "0.92rem",
                  fontWeight: 600,
                  color: muted,
                  lineHeight: 1.58,
                }}
              >
                {step.body}
              </p>

              {/* Code snippet */}
              <div
                style={{
                  marginTop: "auto",
                  background: term,
                  border: `2px solid rgba(240,236,224,0.1)`,
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontFamily:
                    "ui-monospace, 'Cascadia Code', monospace",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: step.snippetColor,
                  lineHeight: 1.5,
                  wordBreak: "break-all",
                }}
              >
                {step.snippet}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LEADERBOARD PREVIEW ── */}
      <section
        id="leaderboard"
        style={{
          width: "min(1180px, calc(100% - 40px))",
          margin: "0 auto",
          padding: "20px 0 80px",
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 28,
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                border: `2px solid ${ink}`,
                borderRadius: 999,
                background: coral,
                padding: "8px 14px",
                fontSize: "0.76rem",
                fontWeight: 900,
                textTransform: "uppercase",
                color: bg,
                marginBottom: 18,
                letterSpacing: "0.07em",
              }}
            >
              ★ LEADERBOARD
            </div>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
                fontWeight: 900,
                color: ink,
                textTransform: "uppercase",
                lineHeight: 1,
                letterSpacing: "-0.01em",
              }}
            >
              WHO&apos;S MOST BROKE?
            </h2>
          </div>
          <a
            href={GITHUB_AUTH_URL}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              minHeight: 44,
              padding: "0 18px",
              border: `3px solid ${ink}`,
              borderRadius: 999,
              background: "transparent",
              color: ink,
              fontWeight: 900,
              fontSize: "0.8rem",
              textTransform: "uppercase",
              textDecoration: "none",
              boxShadow: `4px 4px 0 rgba(240,236,224,0.1)`,
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
            }}
          >
            See full leaderboard →
          </a>
        </div>

        {/* Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {MOCK_LB.map((entry, i) => (
            <div
              key={entry.rank}
              className="lb-row-cols"
              style={{
                display: "grid",
                gridTemplateColumns: "64px minmax(0, 1fr) auto",
                gap: 18,
                alignItems: "center",
                padding: "16px 20px",
                border: `3px solid ${ink}`,
                borderRadius: 20,
                background:
                  i === 0
                    ? `radial-gradient(circle at 15% 50%, rgba(255,242,97,0.13), transparent 55%), ${surface}`
                    : surface,
                boxShadow:
                  i === 0
                    ? `6px 6px 0 ${yellow}`
                    : `5px 5px 0 rgba(240,236,224,0.06)`,
              }}
            >
              {/* Rank badge */}
              <div
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 48,
                  height: 48,
                  border: `3px solid ${ink}`,
                  borderRadius: 13,
                  background: RANK_COLORS[i],
                  color: bg,
                  fontWeight: 900,
                  fontSize: "1rem",
                  boxShadow: `4px 4px 0 ${ink}`,
                  flexShrink: 0,
                }}
              >
                #{entry.rank}
              </div>

              {/* User info */}
              <div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "1rem",
                    color: ink,
                    lineHeight: 1.2,
                  }}
                >
                  @{entry.user}
                </div>
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: muted,
                    fontWeight: 600,
                    marginTop: 3,
                  }}
                >
                  {entry.tokens} tokens
                </div>
              </div>

              {/* Cost */}
              <div
                className="lb-cost"
                style={{
                  fontWeight: 900,
                  fontSize: "1.35rem",
                  color: entry.color,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {entry.cost}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        id="get-started"
        style={{
          width: "min(1180px, calc(100% - 40px))",
          margin: "0 auto 80px",
        }}
      >
        <div
          className="cta-block"
          style={{
            border: `4px solid ${ink}`,
            borderRadius: 28,
            background: `radial-gradient(circle at 18% 50%, rgba(255,242,97,0.1), transparent 48%), ${surface}`,
            padding: "54px 48px",
            boxShadow: `10px 10px 0 ${yellow}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 26,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: `2px solid ${ink}`,
              borderRadius: 999,
              background: yellow,
              padding: "8px 14px",
              fontSize: "0.76rem",
              fontWeight: 900,
              textTransform: "uppercase",
              color: bg,
              letterSpacing: "0.07em",
            }}
          >
            → GET STARTED FREE
          </div>

          <h2
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.6rem)",
              fontWeight: 900,
              color: ink,
              textTransform: "uppercase",
              lineHeight: 0.94,
              maxWidth: "14ch",
              letterSpacing: "-0.01em",
            }}
          >
            Ready to see the damage?
          </h2>

          <p
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: muted,
              maxWidth: 460,
              lineHeight: 1.58,
            }}
          >
            Get your free API key, run one command, and start tracking. No
            account, no credit card, no setup. Just brutal honesty about your
            AI spend.
          </p>

          {/* Install snippet + button */}
          <div
            style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: term,
                border: `3px solid ${ink}`,
                borderRadius: 14,
                padding: "13px 18px",
                boxShadow: `5px 5px 0 ${ink}`,
                fontFamily:
                  "ui-monospace, 'Cascadia Code', monospace",
                fontSize: "0.85rem",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ color: green }}>$</span>
              <span style={{ color: ink }}>bunx amibroke init </span>
              <span style={{ color: yellow }}>{"<your-key>"}</span>
            </div>

            <a
              href={GITHUB_AUTH_URL}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                minHeight: 52,
                padding: "0 22px",
                border: `3px solid ${ink}`,
                borderRadius: 16,
                background: coral,
                color: bg,
                fontWeight: 900,
                fontSize: "0.9rem",
                textTransform: "uppercase",
                textDecoration: "none",
                boxShadow: `6px 6px 0 ${ink}`,
                letterSpacing: "0.04em",
              }}
            >
              Get your key →
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          width: "min(1180px, calc(100% - 40px))",
          margin: "0 auto",
          padding: "28px 0 48px",
          borderTop: `2px solid rgba(240,236,224,0.08)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontWeight: 800,
            fontSize: "0.88rem",
            textTransform: "uppercase",
            color: ink,
            letterSpacing: "0.04em",
          }}
        >
          <div
            style={{
              display: "grid",
              placeItems: "center",
              width: 30,
              height: 30,
              border: `2px solid ${ink}`,
              borderRadius: 9,
              background: yellow,
              color: bg,
              fontWeight: 900,
              fontSize: "0.68rem",
              boxShadow: `3px 3px 0 ${ink}`,
            }}
          >
            A$
          </div>
          amibroke.dev
        </div>
        <div
          style={{
            fontSize: "0.8rem",
            color: muted,
            fontWeight: 600,
          }}
        >
          Free · Open source · Built with too many tokens
        </div>
      </footer>
    </>
  );
}
