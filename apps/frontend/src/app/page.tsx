import type { Metadata } from "next";

const GITHUB_AUTH_URL = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/auth/github`;

export const metadata: Metadata = {
  title: "amigmi.xyz — Track your AI coding spend",
  description:
    "Track your AI coding tool spend and compete on the global leaderboard.",
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
  { rank: 1, user: "theprimeagen",   tokens: "2.4M",  cost: "$284", color: yellow },
  { rank: 2, user: "t3dotgg",        tokens: "1.8M",  cost: "$201", color: cyan   },
  { rank: 3, user: "rauchg",         tokens: "1.2M",  cost: "$156", color: green  },
  { rank: 4, user: "karpathy",       tokens: "891k",  cost: "$98",  color: coral  },
  { rank: 5, user: "levelsio",       tokens: "654k",  cost: "$67",  color: pink   },
];

const RANK_COLORS = [yellow, cyan, green, coral, pink];


const STEPS = [
  {
    num: "01",
    color: yellow,
    title: "Install in 30 seconds",
    body: "Run one command. Paste your key. The CLI auto-detects your AI coding tools.",
    snippet: "$ bunx amigmi init <key>",
    snippetColor: yellow,
  },
  {
    num: "02",
    color: cyan,
    title: "Sync on demand",
    body: "Run one command whenever you want to push your latest usage. No background process, no overhead.",
    snippet: "$ bunx amigmi sync",
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
          className="nav-inner"
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
            <span className="nav-wordmark">amigmi</span>
          </div>

          {/* Nav CTAs */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a
              href="https://github.com/Shobhnik13/amigmi"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                minHeight: 38,
                padding: "0 12px",
                border: `2px solid rgba(240,236,224,0.22)`,
                borderRadius: 999,
                background: "transparent",
                color: ink,
                fontWeight: 800,
                fontSize: "0.76rem",
                textTransform: "uppercase",
                textDecoration: "none",
                letterSpacing: "0.04em",
                flexShrink: 0,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
              <span className="nav-star-label">Star</span>
            </a>
            <a
              href={GITHUB_AUTH_URL}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                minHeight: 38,
                padding: "0 14px",
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
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              Get your key →
            </a>
          </div>
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
              Track AI spend. Compete globally.
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
              Track every token you burn across your AI coding tools.
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
                href="/leaderboard"
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
                  ~/amigmi
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
                  <span style={{ color: ink }}>bunx amigmi sync</span>
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

      {/* ── HOW IT WORKS ── */}
      <section
        style={{
          width: "min(1180px, calc(100% - 40px))",
          margin: "0 auto",
          padding: "80px 0 60px",
        }}
      >
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: `2px solid rgba(240,236,224,0.15)`,
              borderRadius: 999,
              padding: "5px 14px",
              marginBottom: 16,
              fontSize: "0.72rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: cyan,
            }}
          >
            ⟳ How it works
          </div>
          <h2
            style={{
              fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
              fontWeight: 900,
              color: ink,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            Three commands. That&apos;s it.
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {/* Step 1 */}
          <div
            style={{
              border: `3px solid ${ink}`,
              borderRadius: 22,
              background: surface,
              padding: "24px 22px",
              boxShadow: `6px 6px 0 ${yellow}`,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: `3px solid ${ink}`,
                  borderRadius: 10,
                  background: yellow,
                  color: bg,
                  fontWeight: 900,
                  fontSize: "0.9rem",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  boxShadow: `3px 3px 0 ${ink}`,
                }}
              >
                1
              </div>
              <span
                style={{
                  fontWeight: 900,
                  fontSize: "0.88rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: ink,
                }}
              >
                Sign in with GitHub
              </span>
            </div>
            <p style={{ fontSize: "0.82rem", color: muted, fontWeight: 600, margin: 0, lineHeight: 1.6 }}>
              Log in with your GitHub account — we pull your username and avatar, nothing else.
            </p>
          </div>

          {/* Step 2 */}
          <div
            style={{
              border: `3px solid ${ink}`,
              borderRadius: 22,
              background: surface,
              padding: "24px 22px",
              boxShadow: `6px 6px 0 ${cyan}`,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: `3px solid ${ink}`,
                  borderRadius: 10,
                  background: cyan,
                  color: bg,
                  fontWeight: 900,
                  fontSize: "0.9rem",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  boxShadow: `3px 3px 0 ${ink}`,
                }}
              >
                2
              </div>
              <span
                style={{
                  fontWeight: 900,
                  fontSize: "0.88rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: ink,
                }}
              >
                Run init once
              </span>
            </div>
            <div
              style={{
                background: term,
                border: `2px solid rgba(240,236,224,0.08)`,
                borderRadius: 12,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ color: green, fontFamily: "ui-monospace, monospace", fontSize: "0.72rem", fontWeight: 700 }}>$</span>
              <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.74rem", fontWeight: 600, color: ink }}>
                bunx amigmi init <span style={{ color: yellow }}>&lt;your-key&gt;</span>
              </span>
            </div>
            <p style={{ fontSize: "0.82rem", color: muted, fontWeight: 600, margin: 0, lineHeight: 1.6 }}>
              Grab your key from your profile page. Run this once to authenticate your machine.
            </p>
          </div>

          {/* Step 3 */}
          <div
            style={{
              border: `3px solid ${ink}`,
              borderRadius: 22,
              background: surface,
              padding: "24px 22px",
              boxShadow: `6px 6px 0 ${green}`,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: `3px solid ${ink}`,
                  borderRadius: 10,
                  background: green,
                  color: bg,
                  fontWeight: 900,
                  fontSize: "0.9rem",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  boxShadow: `3px 3px 0 ${ink}`,
                }}
              >
                3
              </div>
              <span
                style={{
                  fontWeight: 900,
                  fontSize: "0.88rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: ink,
                }}
              >
                Sync anytime
              </span>
            </div>
            <div
              style={{
                background: term,
                border: `2px solid rgba(240,236,224,0.08)`,
                borderRadius: 12,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ color: green, fontFamily: "ui-monospace, monospace", fontSize: "0.72rem", fontWeight: 700 }}>$</span>
              <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.74rem", fontWeight: 600, color: ink }}>
                bunx amigmi sync
              </span>
            </div>
            <p style={{ fontSize: "0.82rem", color: muted, fontWeight: 600, margin: 0, lineHeight: 1.6 }}>
              Run whenever you want to push your latest usage. Shows up on your profile and the global leaderboard instantly.
            </p>
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
        </div>

        {/* Platform chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>

          {/* Claude Code */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, border: `3px solid ${ink}`, borderRadius: 18, background: surface, padding: "18px 20px", boxShadow: `4px 4px 0 ${coral}`, minWidth: 110 }}>
            <div style={{ display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: 12, background: "#D97757", border: `2px solid ${ink}` }}>
              <svg width="26" height="26" viewBox="0 0 248 248" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M52.4285 162.873L98.7844 136.879L99.5485 134.602L98.7844 133.334H96.4921L88.7237 132.862L62.2346 132.153L39.3113 131.207L17.0249 130.026L11.4214 128.844L6.2 121.873L6.7094 118.447L11.4214 115.257L18.171 115.847L33.0711 116.911L55.485 118.447L71.6586 119.392L95.728 121.873H99.5485L100.058 120.337L98.7844 119.392L97.7656 118.447L74.5877 102.732L49.4995 86.1905L36.3823 76.62L29.3779 71.7757L25.8121 67.2858L24.2839 57.3608L30.6515 50.2716L39.3113 50.8623L41.4763 51.4531L50.2636 58.1879L68.9842 72.7209L93.4357 90.6804L97.0015 93.6343L98.4374 92.6652L98.6571 91.9801L97.0015 89.2625L83.757 65.2772L69.621 40.8192L63.2534 30.6579L61.5978 24.632C60.9565 22.1032 60.579 20.0111 60.579 17.4246L67.8381 7.49965L71.9133 6.19995L81.7193 7.49965L85.7946 11.0443L91.9074 24.9865L101.714 46.8451L116.996 76.62L121.453 85.4816L123.873 93.6343L124.764 96.1155H126.292V94.6976L127.566 77.9197L129.858 57.3608L132.15 30.8942L132.915 23.4505L136.608 14.4708L143.994 9.62643L149.725 12.344L154.437 19.0788L153.8 23.4505L150.998 41.6463L145.522 70.1215L141.957 89.2625H143.994L146.414 86.7813L156.093 74.0206L172.266 53.698L179.398 45.6635L187.803 36.802L193.152 32.5484H203.34L210.726 43.6549L207.415 55.1159L196.972 68.3492L188.312 79.5739L175.896 96.2095L168.191 109.585L168.882 110.689L170.738 110.53L198.755 104.504L213.91 101.787L231.994 98.7149L240.144 102.496L241.036 106.395L237.852 114.311L218.495 119.037L195.826 123.645L162.07 131.592L161.696 131.893L162.137 132.547L177.36 133.925L183.855 134.279H199.774L229.447 136.524L237.215 141.605L241.8 147.867L241.036 152.711L229.065 158.737L213.019 154.956L175.45 145.977L162.587 142.787H160.805V143.85L171.502 154.366L191.242 172.089L215.82 195.011L217.094 200.682L213.91 205.172L210.599 204.699L188.949 188.394L180.544 181.069L161.696 165.118H160.422V166.772L164.752 173.152L187.803 207.771L188.949 218.405L187.294 221.832L181.308 223.959L174.813 222.777L161.187 203.754L147.305 182.486L136.098 163.345L134.745 164.2L128.075 235.42L125.019 239.082L117.887 241.8L111.902 237.31L108.718 229.984L111.902 215.452L115.722 196.547L118.779 181.541L121.58 162.873L123.291 156.636L123.14 156.219L121.773 156.449L107.699 175.752L86.304 204.699L69.3663 222.777L65.291 224.431L58.2867 220.768L58.9235 214.27L62.8713 208.48L86.304 178.705L100.44 160.155L109.551 149.507L109.462 147.967L108.959 147.924L46.6977 188.512L35.6182 189.93L30.7788 185.44L31.4156 178.115L33.7079 175.752L52.4285 162.873Z" fill="white"/>
              </svg>
            </div>
            <span style={{ fontWeight: 900, fontSize: "0.82rem", color: ink, textAlign: "center", lineHeight: 1.2 }}>Claude Code</span>
          </div>

          {/* Codex */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, border: `3px solid ${ink}`, borderRadius: 18, background: surface, padding: "18px 20px", boxShadow: `4px 4px 0 ${green}`, minWidth: 110 }}>
            <div style={{ display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: 12, background: "#f7f7f5", border: `2px solid ${ink}` }}>
              <svg width="26" height="26" viewBox="0 0 256 260" xmlns="http://www.w3.org/2000/svg">
                <path d="M239.183914,106.202783 C245.054304,88.5242096 243.02228,69.1733805 233.607599,53.0998864 C219.451678,28.4588021 190.999703,15.7836129 163.213007,21.739505 C147.554077,4.32145883 123.794909,-3.42398554 100.87901,1.41873898 C77.9631105,6.26146349 59.3690093,22.9572536 52.0959621,45.2214219 C33.8436494,48.9644867 18.0901721,60.392749 8.86672513,76.5818033 C-5.443491,101.182962 -2.19544431,132.215255 16.8986662,153.320094 C11.0060865,170.990656 13.0197283,190.343991 22.4238231,206.422991 C36.5975553,231.072344 65.0680342,243.746566 92.8695738,237.783372 C105.235639,251.708249 123.001113,259.630942 141.623968,259.52692 C170.105359,259.552169 195.337611,241.165718 204.037777,214.045661 C222.28734,210.296356 238.038489,198.869783 247.267014,182.68528 C261.404453,158.127515 258.142494,127.262775 239.183914,106.202783 Z M141.623968,242.541207 C130.255682,242.559177 119.243876,238.574642 110.519381,231.286197 L112.054146,230.416496 L163.724595,200.590881 C166.340648,199.056444 167.954321,196.256818 167.970781,193.224005 L167.970781,120.373788 L189.815614,133.010026 C190.034132,133.121423 190.186235,133.330564 190.224885,133.572774 L190.224885,193.940229 C190.168603,220.758427 168.442166,242.484864 141.623968,242.541207 Z M37.1575749,197.93062 C31.456498,188.086359 29.4094818,176.546984 31.3766237,165.342426 L32.9113895,166.263285 L84.6329973,196.088901 C87.2389349,197.618207 90.4682717,197.618207 93.0742093,196.088901 L156.255402,159.663793 L156.255402,184.885111 C156.243557,185.149771 156.111725,185.394602 155.89729,185.550176 L103.561776,215.733903 C80.3054953,229.131632 50.5924954,221.165435 37.1575749,197.93062 Z M23.5493181,85.3811273 C29.2899861,75.4733097 38.3511911,67.9162648 49.1287482,64.0478825 L49.1287482,125.438515 C49.0891492,128.459425 50.6965386,131.262556 53.3237748,132.754232 L116.198014,169.025864 L94.3531808,181.662102 C94.1132325,181.789434 93.8257461,181.789434 93.5857979,181.662102 L41.3526015,151.529534 C18.1419426,138.076098 10.1817681,108.385562 23.5493181,85.125333 Z M203.0146,127.075598 L139.935725,90.4458545 L161.7294,77.8607748 C161.969348,77.7334434 162.256834,77.7334434 162.496783,77.8607748 L214.729979,108.044502 C231.032329,117.451747 240.437294,135.426109 238.871504,154.182739 C237.305714,172.939368 225.050719,189.105572 207.414262,195.67963 L207.414262,134.288998 C207.322521,131.276867 205.650697,128.535853 203.0146,127.075598 Z M224.757116,94.3850867 L223.22235,93.4642272 L171.60306,63.3828173 C168.981293,61.8443751 165.732456,61.8443751 163.110689,63.3828173 L99.9806554,99.8079259 L99.9806554,74.5866077 C99.9533004,74.3254088 100.071095,74.0701869 100.287609,73.9215426 L152.520805,43.7889738 C168.863098,34.3743518 189.174256,35.2529043 204.642579,46.0434841 C220.110903,56.8340638 227.949269,75.5923959 224.757116,94.1804513 Z M88.0606409,139.097931 L66.2158076,126.512851 C65.9950399,126.379091 65.8450965,126.154176 65.8065367,125.898945 L65.8065367,65.684966 C65.8314495,46.8285367 76.7500605,29.6846032 93.8270852,21.6883055 C110.90411,13.6920079 131.063833,16.2835462 145.5632,28.338998 L144.028434,29.2086986 L92.3579852,59.0343142 C89.7419327,60.5687513 88.1282597,63.3683767 88.1117998,66.4011901 Z M99.9294965,113.5185 L128.06687,97.3011417 L156.255402,113.5185 L156.255402,145.953218 L128.169187,162.170577 L99.9806554,145.953218 Z" fill="#000000"/>
              </svg>
            </div>
            <span style={{ fontWeight: 900, fontSize: "0.82rem", color: ink, textAlign: "center", lineHeight: 1.2 }}>Codex</span>
          </div>

          {/* OpenCode */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, border: `3px solid ${ink}`, borderRadius: 18, background: surface, padding: "18px 20px", boxShadow: `4px 4px 0 ${cyan}`, minWidth: 110 }}>
            <div style={{ display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: 12, background: "#131010", border: `2px solid ${ink}` }}>
              <svg width="28" height="28" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M320 224V352H192V224H320Z" fill="#5A5858"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M384 416H128V96H384V416ZM320 160H192V352H320V160Z" fill="white"/>
              </svg>
            </div>
            <span style={{ fontWeight: 900, fontSize: "0.82rem", color: ink, textAlign: "center", lineHeight: 1.2 }}>OpenCode</span>
          </div>

          {/* More coming soon */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, border: `3px dashed rgba(240,236,224,0.25)`, borderRadius: 18, background: "transparent", padding: "18px 20px", minWidth: 110 }}>
            <div style={{ display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: 12, background: "rgba(240,236,224,0.05)", border: `2px dashed rgba(240,236,224,0.2)` }}>
              <span style={{ fontSize: "1.4rem", color: muted, lineHeight: 1 }}>+</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: "0.75rem", color: muted, textAlign: "center", lineHeight: 1.3 }}>More coming soon</span>
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
          amigmi.xyz
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
