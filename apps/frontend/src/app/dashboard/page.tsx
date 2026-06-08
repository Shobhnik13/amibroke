'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Profile {
  user: { username: string; apiKeyPrefix: string | null };
}

const ink     = '#f0ece0';
const bg      = '#0f0d0b';
const term    = '#090806';
const surface = '#1a1714';
const muted   = '#8c8278';
const yellow  = '#fff261';
const coral   = '#ff6464';
const green   = '#5dff9c';

type Step = 'loading' | 'generate' | 'install';

export default function DashboardPage() {
  const router = useRouter();
  const [step, setStep]         = useState<Step>('loading');
  const [username, setUsername] = useState('');
  const [rawKey, setRawKey]     = useState('');
  const [prefix, setPrefix]     = useState('');
  const [showKey, setShowKey]   = useState(false);
  const [copied, setCopied]     = useState<'key' | 'cmd' | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.startsWith('#token=')) {
        const token = hash.slice(7);
        localStorage.setItem('amigmi_token', token);
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
  }, [router]);

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

  const installCmd = `bunx amigmi init ${rawKey}`;

  if (step === 'loading') {
    return <Screen><Spinner /></Screen>;
  }

  const accentColor = step === 'install' ? green : yellow;

  return (
    <Screen>
      <div style={{ width: '100%', maxWidth: 540, border: `4px solid ${ink}`, borderRadius: 28, background: surface, boxShadow: `12px 12px 0 ${accentColor}`, overflow: 'hidden' }}>

        {/* Header bar */}
        <div style={{ background: accentColor, borderBottom: `3px solid ${ink}`, padding: '13px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 900, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: bg }}>
            {step === 'generate' ? 'Step 1 of 2 — get your key' : 'Step 2 of 2 — install cli'}
          </span>
          <div style={{ display: 'flex', gap: 7 }}>
            {['generate', 'install'].map((s, i) => (
              <div key={s} style={{ width: 10, height: 10, borderRadius: '50%', background: ['generate','install'].indexOf(step) >= i ? bg : 'rgba(15,13,11,0.25)', border: `2px solid ${bg}` }} />
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
                    bunx amigmi init <span style={{ color: yellow }}>{rawKey}</span>
                  </span>
                  <GhostBtn onClick={() => handleCopy(installCmd, 'cmd')} active={copied === 'cmd'}>
                    {copied === 'cmd' ? '✓' : 'Copy'}
                  </GhostBtn>
                </div>
              </div>

              <button onClick={() => router.push(`/${username}`)} style={primaryBtn(coral)}>
                Go to my profile →
              </button>
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
