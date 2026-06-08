'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { getFunnyLine } from '@/lib/funny';
import { SHARE_THEMES } from '@/app/[username]/page';
import type { ShareTheme } from '@/app/[username]/page';

interface BreakdownRow {
  agent: string; model: string;
  totalInputTokens:      string | null;
  totalOutputTokens:     string | null;
  totalCacheReadTokens:  string | null;
  totalCacheWriteTokens: string | null;
  totalCostUsd:          string | null;
}
interface PublicProfile {
  user: { username: string; avatarUrl: string | null; publicTheme: string; createdAt: string };
  breakdown: BreakdownRow[];
}

function n(v: string | null | undefined): number { return parseFloat(v ?? '0') || 0; }
function fmt(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)         return `${(v / 1_000).toFixed(1)}k`;
  return `${Math.round(v)}`;
}
function fmtCost(v: number): string { return `$${v.toFixed(2)}`; }

const AGENT_LBL: Record<string, string> = {
  claude_code: 'Claude Code',
  codex: 'Codex',
  opencode: 'OpenCode',
};

function blend(hex: string, toward: string, t: number): string {
  const p = (h: string): [number, number, number] => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  const l = (a: number, b: number) => Math.round(a + (b - a) * t);
  const [ar,ag,ab] = p(hex), [br,bg2,bb] = p(toward);
  return `rgb(${l(ar,br)},${l(ag,bg2)},${l(ab,bb)})`;
}

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get<PublicProfile>(`/api/leaderboard/users/${username}?period=all_time`)
      .then(r => setProfile(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  const themeKey = (profile?.user.publicTheme ?? 'noir') as ShareTheme;
  const theme    = SHARE_THEMES.find(t => t.key === themeKey) ?? SHARE_THEMES[0];
  const ink      = theme.accent;
  const inkDim   = `${theme.accent}30`;
  const surface  = blend(theme.bg, '#ffffff', 0.06);
  const term     = blend(theme.bg, '#000000', 0.35);
  const muted    = blend(theme.accent, theme.bg, 0.5);

  const gridBg = {
    backgroundColor: theme.bg,
    backgroundImage: `linear-gradient(${inkDim} 1px, transparent 1px), linear-gradient(90deg, ${inkDim} 1px, transparent 1px)`,
    backgroundSize: '40px 40px',
  };

  if (loading) return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', backgroundColor: '#0f0d0b' }}>
      <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fff261', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.05em' }}>loading receipt...</span>
    </div>
  );

  if (notFound || !profile) return <NotFound username={username} />;

  // aggregate
  const totals = profile.breakdown.reduce(
    (a, r) => ({
      input:  a.input  + n(r.totalInputTokens),
      output: a.output + n(r.totalOutputTokens),
      cacheR: a.cacheR + n(r.totalCacheReadTokens),
      cacheW: a.cacheW + n(r.totalCacheWriteTokens),
      cost:   a.cost   + n(r.totalCostUsd),
    }),
    { input: 0, output: 0, cacheR: 0, cacheW: 0, cost: 0 }
  );
  const totalTokens = totals.input + totals.output + totals.cacheR + totals.cacheW;
  const agentCount  = new Set(profile.breakdown.map(r => r.agent)).size;

  // row-level totals
  const rows = profile.breakdown.map(r => ({
    agent:  AGENT_LBL[r.agent] ?? r.agent,
    model:  r.model,
    cost:   n(r.totalCostUsd),
    tokens: n(r.totalInputTokens) + n(r.totalOutputTokens) + n(r.totalCacheReadTokens),
  }));

  const sep = { borderTop: `1px dashed ${inkDim}` } as React.CSSProperties;

  return (
    <div style={{ minHeight: '100dvh', ...gridBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '32px 16px 64px' }}>

      {/* ── CARD ── max 480px — pure receipt width */}
      <div style={{ width: '100%', maxWidth: 480, border: `4px solid ${ink}`, borderRadius: 28, overflow: 'hidden', boxShadow: `12px 12px 0 ${ink}` }}>

        {/* ── HEADER BAR ── */}
        <div style={{ background: ink, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 30, height: 30, border: `2px solid ${theme.bg}`, borderRadius: 7, background: 'rgba(0,0,0,0.18)', display: 'grid', placeItems: 'center', fontSize: '0.66rem', fontWeight: 900, color: theme.bg, flexShrink: 0 }}>A$</div>
            <span style={{ fontWeight: 900, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.09em', color: theme.bg }}>amigmi.xyz</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: `${theme.bg}88` }}>AI Spend Receipt</span>
        </div>

        {/* ── USER ROW ── */}
        <div style={{ background: surface, borderBottom: `3px solid ${ink}`, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <AvatarBlock url={profile.user.avatarUrl} name={profile.user.username} size={60} accent={ink} bg={theme.bg} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: ink, textTransform: 'uppercase', lineHeight: 1, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              @{profile.user.username}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: muted, marginTop: 7, lineHeight: 1.45 }}>{getFunnyLine(totals.cost)}</div>
          </div>
        </div>

        {/* ── HERO SPEND (full width, centered) ── */}
        <div style={{ background: term, borderBottom: `3px solid ${ink}`, padding: '32px 22px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.66rem', fontWeight: 900, color: muted, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>Total AI Spend</div>
          <div style={{ fontSize: 'clamp(3.8rem, 18vw, 5.5rem)', fontWeight: 900, color: ink, lineHeight: 0.88, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>
            {fmtCost(totals.cost)}
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: muted, marginTop: 14, letterSpacing: '0.04em' }}>
            {fmt(totalTokens)} tokens across {agentCount} {agentCount === 1 ? 'tool' : 'tools'}
          </div>
        </div>

        {/* ── TOKEN STRIP ── 3 cols */}
        <div style={{ background: surface, borderBottom: `3px solid ${ink}`, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { label: 'Input',   value: fmt(totals.input) },
            { label: 'Output',  value: fmt(totals.output) },
            { label: 'Cache R', value: fmt(totals.cacheR) },
          ].map((item, i) => (
            <div key={i} style={{ padding: '16px 14px', borderRight: i < 2 ? `2px solid ${inkDim}` : 'none', textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 900, color: muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* ── ITEMISED BREAKDOWN ── receipt style */}
        <div style={{ background: term }}>

          {/* column headers */}
          <div style={{ padding: '12px 22px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${inkDim}` }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tool / Model</span>
            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cost</span>
          </div>

          {/* rows */}
          {rows.map((row, i) => (
            <div key={i} style={{ padding: '14px 22px', ...( i > 0 ? sep : {}) }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                {/* left */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 900, color: ink, lineHeight: 1.2 }}>{row.agent}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: muted, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'ui-monospace, monospace' }}>{row.model}</div>
                </div>
                {/* right */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '1.05rem', fontWeight: 900, color: ink, fontVariantNumeric: 'tabular-nums' }}>{fmtCost(row.cost)}</div>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.68rem', fontWeight: 600, color: muted, marginTop: 3 }}>{fmt(row.tokens)} tok</div>
                </div>
              </div>
            </div>
          ))}

          {/* total row */}
          <div style={{ padding: '14px 22px', borderTop: `3px solid ${ink}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 900, color: ink, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</span>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '1.1rem', fontWeight: 900, color: ink, fontVariantNumeric: 'tabular-nums' }}>{fmtCost(totals.cost)}</span>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ background: ink, padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: theme.bg, opacity: 0.7 }}>Track your AI coding spend</span>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, minHeight: 36, padding: '0 14px', border: `2px solid ${theme.bg}`, borderRadius: 999, background: theme.bg, color: ink, fontWeight: 900, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em', textDecoration: 'none', boxShadow: `3px 3px 0 rgba(0,0,0,0.2)`, flexShrink: 0 }}>
            amigmi.xyz →
          </Link>
        </div>
      </div>

      {/* view full profile */}
      <div style={{ marginTop: 32 }}>
        <Link href={`/${username}`} style={{ fontSize: '0.8rem', fontWeight: 700, color: muted, textDecoration: 'none', borderBottom: `1px solid ${inkDim}` }}>
          View full profile →
        </Link>
      </div>
    </div>
  );
}

// ── not found ─────────────────────────────────────────────
function NotFound({ username }: { username: string }) {
  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#0f0d0b', backgroundImage: `linear-gradient(rgba(255,242,97,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,242,97,0.04) 1px, transparent 1px)`, backgroundSize: '40px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ width: '100%', maxWidth: 440, border: `4px solid #f0ece0`, borderRadius: 28, background: '#1a1714', overflow: 'hidden', boxShadow: `12px 12px 0 #ff6464` }}>
        <div style={{ background: '#ff6464', borderBottom: `3px solid #f0ece0`, padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, border: `2px solid #0f0d0b`, borderRadius: 7, background: 'rgba(0,0,0,0.15)', display: 'grid', placeItems: 'center', fontSize: '0.66rem', fontWeight: 900, color: '#0f0d0b', flexShrink: 0 }}>A$</div>
          <span style={{ fontWeight: 900, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0f0d0b' }}>amigmi.xyz</span>
        </div>
        <div style={{ padding: '44px 28px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, border: `3px solid rgba(240,236,224,0.15)`, background: '#090806', display: 'grid', placeItems: 'center', fontSize: '2rem', color: 'rgba(240,236,224,0.12)' }}>?</div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f0ece0', textTransform: 'uppercase', lineHeight: 1, letterSpacing: '-0.01em', marginBottom: 8 }}>@{username}</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#8c8278', lineHeight: 1.5 }}>this ghost doesn&apos;t exist on amigmi.xyz</div>
          </div>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 50, padding: '0 26px', border: `3px solid #f0ece0`, borderRadius: 14, background: '#fff261', color: '#0f0d0b', fontWeight: 900, fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.05em', textDecoration: 'none', boxShadow: `5px 5px 0 #f0ece0` }}>
            Get your own receipt →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── avatar ────────────────────────────────────────────────
function AvatarBlock({ url, name, size, accent, bg }: { url: string | null; name: string; size: number; accent: string; bg: string }) {
  const st: React.CSSProperties = { width: size, height: size, borderRadius: Math.round(size * 0.22), border: `3px solid ${accent}`, flexShrink: 0, boxShadow: `4px 4px 0 ${accent}` };
  if (url) return <Image src={url} alt={name} width={size} height={size} style={st} unoptimized />;
  return <div style={{ ...st, background: accent, display: 'grid', placeItems: 'center', fontSize: size * 0.38, fontWeight: 900, color: bg }}>{name[0].toUpperCase()}</div>;
}
