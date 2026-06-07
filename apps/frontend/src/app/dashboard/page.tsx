'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Profile {
  user: { username: string; detectedAgents: string[]; apiKeyPrefix: string | null };
}

const ink     = '#f0ece0';
const bg      = '#0f0d0b';
const term    = '#090806';
const surface = '#1a1714';
const muted   = '#8c8278';
const yellow  = '#fff261';
const coral   = '#ff6464';
const green   = '#5dff9c';
const cyan    = '#59e8ff';

const TOOLS = [
  { key: 'claude_code', label: 'Claude Code', color: coral },
  { key: 'codex',       label: 'Codex',       color: green },
  { key: 'opencode',    label: 'OpenCode',     color: cyan  },
];

type Step = 'loading' | 'generate' | 'install' | 'detect';

export default function DashboardPage() {
  const router = useRouter();
  const [step, setStep]         = useState<Step>('loading');
  const [username, setUsername] = useState('');
  const [rawKey, setRawKey]     = useState('');
  const [prefix, setPrefix]     = useState('');
  const [showKey, setShowKey]   = useState(false);
  const [copied, setCopied]     = useState<'key' | 'cmd' | null>(null);
  const [agents, setAgents]     = useState<string[]>([]);
  const [checking, setChecking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  useEffect(() => {
    // extract JWT from hash if coming from OAuth redirect
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.startsWith('#token=')) {
        const token = hash.slice(7);
        localStorage.setItem('amibroke_token', token);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    api.get<Profile>('/api/auth/profile')
      .then(res => {
        const u = res.data.user;
        setUsername(u.username);
        if (u.apiKeyPrefix) {
          router.replace(`/${u.username}`);
        } else {
          setStep('generate');
        }
      })
      .catch(() => router.push('/'));
    return stopPoll;
  }, [router, stopPoll]);

  async function handleGenerateKey() {
    setGenerating(true);
    try {
      const res = await api.post<{ key: string; prefix: string }>('/api/auth/key');
      setRawKey(res.data.key);
      setPrefix(res.data.prefix);
      setShowKey(true);
      setStep('install');
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy(text: string, label: 'key' | 'cmd') {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleInstalledClick() {
    setStep('detect');
    setChecking(true);
    const timeoutId = setTimeout(() => { setChecking(false); stopPoll(); }, 20_000);
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get<Profile>('/api/auth/profile');
        const a = res.data.user.detectedAgents ?? [];
        if (a.length > 0) { setAgents(a); setChecking(false); stopPoll(); clearTimeout(timeoutId); }
      } catch { /* ignore */ }
    }, 2500);
  }

  async function handleRefresh() {
    setChecking(true);
    try {
      const res = await api.get<Profile>('/api/auth/profile');
      setAgents(res.data.user.detectedAgents ?? []);
    } finally {
      setChecking(false);
    }
  }

  const installCmd = `bunx amibroke init ${rawKey}`;

  if (step === 'loading') {
    return <Screen><Spinner /></Screen>;
  }

  const accentColor = step === 'install' || step === 'detect' ? green : yellow;

  return (
    <Screen>
      <div style={{ width: '100%', maxWidth: 540, border: `4px solid ${ink}`, borderRadius: 28, background: surface, boxShadow: `12px 12px 0 ${accentColor}`, overflow: 'hidden' }}>

        {/* Header bar */}
        <div style={{ background: accentColor, borderBottom: `3px solid ${ink}`, padding: '13px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 900, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: bg }}>
            {step === 'generate' ? 'Step 1 of 3 — get your key'
            : step === 'install'  ? 'Step 2 of 3 — install cli'
            : 'Step 3 of 3 — detect tools'}
          </span>
          <div style={{ display: 'flex', gap: 7 }}>
            {['generate', 'install', 'detect'].map((s, i) => (
              <div key={s} style={{ width: 10, height: 10, borderRadius: '50%', background: ['generate','install','detect'].indexOf(step) >= i ? bg : 'rgba(15,13,11,0.25)', border: `2px solid ${bg}` }} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="dash-card" style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* ── STEP: GENERATE ── */}
          {step === 'generate' && (
            <>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, color: ink, textTransform: 'uppercase', lineHeight: 1, letterSpacing: '-0.01em', marginBottom: 10 }}>
                  You&apos;re in,<br /><span style={{ color: yellow }}>@{username}</span> 🎉
                </h1>
                <p style={{ fontSize: '0.9rem', color: muted, fontWeight: 600, lineHeight: 1.55, margin: 0 }}>
                  Generate your API key to start tracking. You&apos;ll only see the full key once — save it somewhere safe.
                </p>
              </div>
              <button
                onClick={handleGenerateKey}
                disabled={generating}
                style={{ ...primaryBtn(yellow), opacity: generating ? 0.7 : 1, cursor: generating ? 'wait' : 'pointer' }}
              >
                {generating ? 'Generating...' : 'Generate my API key →'}
              </button>
            </>
          )}

          {/* ── STEP: INSTALL ── */}
          {step === 'install' && (
            <>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: ink, textTransform: 'uppercase', lineHeight: 1, letterSpacing: '-0.01em', marginBottom: 10 }}>
                  Install the CLI
                </h1>
                <p style={{ fontSize: '0.9rem', color: muted, fontWeight: 600, lineHeight: 1.55, margin: 0 }}>
                  Run this command in your terminal.
                </p>
              </div>

              {/* Key display */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Label>Your API key — save this now</Label>
                <div style={{ display: 'flex', alignItems: showKey ? 'flex-start' : 'center', gap: 8, background: term, border: `3px solid ${ink}`, borderRadius: 14, padding: '12px 14px', boxShadow: `4px 4px 0 ${ink}` }}>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.76rem', fontWeight: 600, color: green, flex: 1, wordBreak: showKey ? 'break-all' : undefined, overflow: showKey ? undefined : 'hidden', textOverflow: showKey ? undefined : 'ellipsis', whiteSpace: showKey ? undefined : 'nowrap' }}>
                    {showKey ? rawKey : `${prefix}${'•'.repeat(32)}`}
                  </span>
                  <GhostBtn onClick={() => setShowKey(v => !v)}>{showKey ? 'Hide' : 'Show'}</GhostBtn>
                  <GhostBtn onClick={() => handleCopy(rawKey, 'key')} active={copied === 'key'}>{copied === 'key' ? '✓ Copied' : 'Copy'}</GhostBtn>
                </div>
              </div>

              {/* Install command */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Label>Install command</Label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: term, border: `3px solid ${ink}`, borderRadius: 14, padding: '13px 16px', boxShadow: `4px 4px 0 ${ink}`, overflow: 'hidden' }}>
                  <span style={{ color: green, fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>$</span>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.76rem', fontWeight: 600, color: ink, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    bunx amibroke init <span style={{ color: yellow }}>{rawKey}</span>
                  </span>
                  <GhostBtn onClick={() => handleCopy(installCmd, 'cmd')} active={copied === 'cmd'}>
                    {copied === 'cmd' ? '✓' : 'Copy'}
                  </GhostBtn>
                </div>
              </div>

              <button onClick={handleInstalledClick} style={primaryBtn(coral)}>
                I&apos;ve installed it →
              </button>
            </>
          )}

          {/* ── STEP: DETECT ── */}
          {step === 'detect' && (
            <>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: ink, textTransform: 'uppercase', lineHeight: 1, letterSpacing: '-0.01em', marginBottom: 10 }}>
                  {checking ? 'Detecting tools...' : agents.length > 0 ? 'Tools found!' : 'No tools yet'}
                </h1>
                <p style={{ fontSize: '0.9rem', color: muted, fontWeight: 600, lineHeight: 1.55, margin: 0 }}>
                  {checking ? 'Waiting for the CLI to report back...'
                  : agents.length > 0 ? 'The CLI detected your AI coding tools.'
                  : 'Run the install command first, then hit refresh.'}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {TOOLS.map(tool => {
                  const found = agents.includes(tool.key);
                  return (
                    <div key={tool.key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 17px', border: `3px solid ${found ? ink : 'rgba(240,236,224,0.12)'}`, borderRadius: 16, background: found ? 'rgba(255,255,255,0.03)' : term, boxShadow: found ? `4px 4px 0 ${tool.color}` : 'none', transition: 'all 0.2s' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, border: `2px solid ${found ? ink : 'rgba(240,236,224,0.15)'}`, background: found ? tool.color : 'transparent', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: '0.82rem', color: found ? bg : muted, flexShrink: 0 }}>
                        {checking ? '·' : found ? '✓' : '–'}
                      </div>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: found ? ink : muted }}>{tool.label}</span>
                      {found && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 900, color: tool.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detected</span>}
                    </div>
                  );
                })}
              </div>

              <button onClick={() => router.push(`/${username}`)} style={primaryBtn(green)}>
                Continue to my profile →
              </button>
              {!checking && (
                <button onClick={handleRefresh} style={{ ...ghostOutlineBtn, width: '100%' }}>
                  ↺ Refresh detection
                </button>
              )}
            </>
          )}

        </div>
      </div>
    </Screen>
  );
}

// ── sub-components ────────────────────────────────────────
function Screen({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: '40px 20px' }}>{children}</div>;
}
function Spinner() {
  return <div style={{ color: '#8c8278', fontFamily: 'ui-monospace, monospace', fontSize: '0.9rem', fontWeight: 600 }}>Preparing account...</div>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#8c8278', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{children}</div>;
}
function GhostBtn({ onClick, children, active }: { onClick: () => void; children: React.ReactNode; active?: boolean }) {
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 30, padding: '0 10px', border: '2px solid rgba(240,236,224,0.2)', borderRadius: 8, background: active ? '#5dff9c' : 'rgba(240,236,224,0.06)', color: active ? '#0f0d0b' : '#8c8278', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '0.04em', flexShrink: 0, fontFamily: 'inherit' }}>
      {children}
    </button>
  );
}

// ── style helpers ─────────────────────────────────────────
function primaryBtn(accent: string): React.CSSProperties {
  return { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 52, padding: '0 24px', border: `3px solid ${ink}`, borderRadius: 16, background: accent, color: bg, fontWeight: 900, fontSize: '0.95rem', textTransform: 'uppercase', cursor: 'pointer', boxShadow: `6px 6px 0 ${ink}`, letterSpacing: '0.04em', width: '100%', fontFamily: 'inherit' };
}

const ghostOutlineBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  minHeight: 42, padding: '0 18px',
  border: '2px solid rgba(240,236,224,0.2)', borderRadius: 14,
  background: 'transparent', color: '#8c8278',
  fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase',
  cursor: 'pointer', letterSpacing: '0.04em', fontFamily: 'inherit',
};
