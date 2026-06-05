'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { getFunnyLine } from '@/lib/funny';
import { SHARE_THEMES } from '@/app/[username]/page';
import type { ShareTheme } from '@/app/[username]/page';

// ── types ────────────────────────────────────────────────
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

// ── helpers ───────────────────────────────────────────────
function n(v: string | null | undefined): number { return parseFloat(v ?? '0') || 0; }
function fmt(raw: string | null | undefined | number): string {
  const v = typeof raw === 'number' ? raw : n(raw as string | null);
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)         return `${(v / 1_000).toFixed(1)}k`;
  return `${Math.round(v)}`;
}
function fmtCost(raw: string | null | undefined): string { return `$${n(raw as string).toFixed(2)}`; }

const AGENT_LBL: Record<string, string> = { claude_code: 'Claude Code', codex: 'Codex', opencode: 'OpenCode' };

function aggBreakdown(rows: BreakdownRow[]) {
  return rows.reduce(
    (a, r) => ({ input: a.input + n(r.totalInputTokens), output: a.output + n(r.totalOutputTokens), cacheR: a.cacheR + n(r.totalCacheReadTokens), cacheW: a.cacheW + n(r.totalCacheWriteTokens), cost: a.cost + n(r.totalCostUsd) }),
    { input: 0, output: 0, cacheR: 0, cacheW: 0, cost: 0 }
  );
}

// blend hex toward a target
function blendToward(hex: string, toward: string, t: number): string {
  const p = (h: string): [number, number, number] => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
  const [ar,ag,ab] = p(hex), [br,bg2,bb] = p(toward);
  return `rgb(${lerp(ar,br)},${lerp(ag,bg2)},${lerp(ab,bb)})`;
}

// ── page ─────────────────────────────────────────────────
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

  const ink     = theme.accent;
  const inkSoft = `${theme.accent}cc`;
  const inkDim  = `${theme.accent}44`;
  const surface = blendToward(theme.bg, '#ffffff', 0.06);
  const term    = blendToward(theme.bg, '#000000', 0.25);
  const muted   = blendToward(theme.accent, theme.bg, 0.5);

  const gridBg = {
    backgroundColor: theme.bg,
    backgroundImage: `linear-gradient(${inkDim} 1px, transparent 1px), linear-gradient(90deg, ${inkDim} 1px, transparent 1px)`,
    backgroundSize: '40px 40px',
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#0f0d0b', backgroundImage: `linear-gradient(rgba(255,242,97,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,242,97,0.04) 1px, transparent 1px)`, backgroundSize: '40px 40px' }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fff261', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.05em' }}>loading receipt...</span>
      </div>
    );
  }

  if (notFound || !profile) {
    return <NotFound username={username} />;
  }

  const agg = aggBreakdown(profile.breakdown);
  const totalTokens = agg.input + agg.output + agg.cacheR + agg.cacheW;
  const agents = [...new Set(profile.breakdown.map(r => r.agent))];

  return (
    <div style={{ minHeight: '100dvh', ...gridBg, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px 80px' }}>

      {/* ── RECEIPT CARD ── */}
      <div style={{ width: '100%', maxWidth: 640, border: `4px solid ${ink}`, borderRadius: 32, overflow: 'hidden', boxShadow: `16px 16px 0 ${ink}` }}>

        {/* Header */}
        <div style={{ background: ink, padding: '13px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, border: `2px solid ${theme.bg}`, borderRadius: 7, background: 'rgba(0,0,0,0.15)', display: 'grid', placeItems: 'center', fontSize: '0.64rem', fontWeight: 900, color: theme.bg }}>A$</div>
            <span style={{ fontWeight: 900, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.bg }}>amibroke.dev</span>
          </div>
          <span style={{ fontWeight: 900, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: `${theme.bg}99` }}>AI SPEND RECEIPT</span>
        </div>

        {/* User row */}
        <div style={{ background: surface, borderBottom: `3px solid ${ink}`, padding: '24px 26px', display: 'flex', alignItems: 'center', gap: 18 }}>
          <AvatarBlock url={profile.user.avatarUrl} name={profile.user.username} size={72} accent={ink} bg={theme.bg} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 900, color: ink, textTransform: 'uppercase', lineHeight: 0.95, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              @{profile.user.username}
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: muted, marginTop: 8, lineHeight: 1.4 }}>{getFunnyLine(agg.cost)}</div>
          </div>
        </div>

        {/* Big spend number */}
        <div style={{ background: term, borderBottom: `3px solid ${ink}`, padding: '28px 26px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Total AI Spend</div>
            <div style={{ fontSize: 'clamp(3rem, 10vw, 4.5rem)', fontWeight: 900, color: ink, lineHeight: 0.9, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
              {fmtCost(agg.cost.toString())}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Total tokens</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: inkSoft, fontVariantNumeric: 'tabular-nums' }}>{fmt(totalTokens)}</div>
          </div>
        </div>

        {/* Token grid */}
        <div style={{ background: surface, borderBottom: `3px solid ${ink}`, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { label: 'Input',   value: fmt(agg.input),  col: ink },
            { label: 'Output',  value: fmt(agg.output), col: inkSoft },
            { label: 'Cache R', value: fmt(agg.cacheR), col: inkSoft },
          ].map((item, i) => (
            <div key={i} style={{ padding: '18px 16px', borderRight: i < 2 ? `2px solid ${inkDim}` : 'none' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 900, color: muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: item.col, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Agents */}
        {agents.length > 0 && (
          <div style={{ background: surface, borderBottom: `3px solid ${ink}`, padding: '16px 26px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: muted, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>Tools:</span>
            {agents.map(a => (
              <div key={a} style={{ border: `2px solid ${ink}`, borderRadius: 999, padding: '5px 13px', fontSize: '0.72rem', fontWeight: 800, color: ink, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {AGENT_LBL[a] ?? a}
              </div>
            ))}
          </div>
        )}

        {/* Breakdown table */}
        {profile.breakdown.length > 0 && (
          <div style={{ background: term }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 80px 80px', gap: 8, padding: '10px 20px', borderBottom: `2px solid ${inkDim}` }}>
              {['Agent', 'Model', 'Input', 'Output', 'Cost'].map(h => (
                <span key={h} style={{ fontSize: '0.62rem', fontWeight: 900, color: muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
              ))}
            </div>
            {profile.breakdown.map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 80px 80px', gap: 8, padding: '10px 20px', borderBottom: `1px solid ${inkDim}`, alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{AGENT_LBL[row.agent] ?? row.agent}</span>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.model}</span>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.72rem', fontWeight: 600, color: inkSoft, fontVariantNumeric: 'tabular-nums' }}>{fmt(row.totalInputTokens)}</span>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.72rem', fontWeight: 600, color: inkSoft, fontVariantNumeric: 'tabular-nums' }}>{fmt(row.totalOutputTokens)}</span>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.72rem', fontWeight: 700, color: ink, fontVariantNumeric: 'tabular-nums' }}>{fmtCost(row.totalCostUsd)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer CTA */}
        <div style={{ background: ink, padding: '18px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: theme.bg, opacity: 0.7 }}>Track your AI coding spend</span>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 34, padding: '0 14px', border: `2px solid ${theme.bg}`, borderRadius: 999, background: theme.bg, color: ink, fontWeight: 900, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', textDecoration: 'none', boxShadow: `2px 2px 0 rgba(0,0,0,0.3)` }}>
            amibroke.dev →
          </Link>
        </div>
      </div>

      {/* View full profile */}
      <div style={{ marginTop: 32 }}>
        <Link href={`/${username}`} style={{ fontSize: '0.78rem', fontWeight: 700, color: muted, textDecoration: 'none', borderBottom: `1px solid ${inkDim}` }}>
          View full profile →
        </Link>
      </div>
    </div>
  );
}

// ── not found state ───────────────────────────────────────
function NotFound({ username }: { username: string }) {
  const bg = '#0f0d0b';
  const gridBg = {
    backgroundColor: bg,
    backgroundImage: `linear-gradient(rgba(255,242,97,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,242,97,0.04) 1px, transparent 1px)`,
    backgroundSize: '40px 40px',
  };
  return (
    <div style={{ minHeight: '100dvh', ...gridBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 0 }}>
      <div style={{ width: '100%', maxWidth: 480, border: `4px solid #f0ece0`, borderRadius: 28, background: '#1a1714', overflow: 'hidden', boxShadow: `12px 12px 0 #ff6464` }}>
        {/* header */}
        <div style={{ background: '#ff6464', borderBottom: `3px solid #f0ece0`, padding: '13px 22px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, border: `2px solid #0f0d0b`, borderRadius: 7, background: 'rgba(0,0,0,0.15)', display: 'grid', placeItems: 'center', fontSize: '0.62rem', fontWeight: 900, color: '#0f0d0b' }}>A$</div>
          <span style={{ fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0f0d0b' }}>amibroke.dev</span>
        </div>

        <div style={{ padding: '40px 32px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center' }}>
          {/* ghost avatar */}
          <div style={{ width: 80, height: 80, borderRadius: 20, border: `3px solid rgba(240,236,224,0.18)`, background: '#090806', display: 'grid', placeItems: 'center', fontSize: '2rem', color: 'rgba(240,236,224,0.15)' }}>
            ?
          </div>

          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f0ece0', textTransform: 'uppercase', lineHeight: 1, letterSpacing: '-0.01em', marginBottom: 6 }}>
              @{username}
            </div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#8c8278', lineHeight: 1.5 }}>
              this ghost doesn&apos;t exist on amibroke.dev
            </div>
          </div>

          <div style={{ border: `2px solid rgba(240,236,224,0.08)`, borderRadius: 16, background: '#090806', padding: '16px 20px', width: '100%', fontFamily: 'ui-monospace, monospace', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8c8278' }}>total spend</span>
              <span style={{ color: 'rgba(240,236,224,0.2)' }}>???</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8c8278' }}>tokens burned</span>
              <span style={{ color: 'rgba(240,236,224,0.2)' }}>???</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8c8278' }}>tools detected</span>
              <span style={{ color: 'rgba(240,236,224,0.2)' }}>none</span>
            </div>
          </div>

          <Link
            href="/"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 48, padding: '0 24px', border: `3px solid #f0ece0`, borderRadius: 14, background: '#fff261', color: '#0f0d0b', fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', textDecoration: 'none', boxShadow: `5px 5px 0 #f0ece0` }}
          >
            Get your own receipt →
          </Link>

          <span style={{ fontSize: '0.74rem', color: '#8c8278', fontWeight: 600 }}>
            maybe they&apos;re spending on other things. or just too broke to track.
          </span>
        </div>
      </div>
    </div>
  );
}

// ── avatar ────────────────────────────────────────────────
function AvatarBlock({ url, name, size, accent, bg }: { url: string | null; name: string; size: number; accent: string; bg: string }) {
  const st: React.CSSProperties = { width: size, height: size, borderRadius: 18, border: `3px solid ${accent}`, flexShrink: 0, boxShadow: `5px 5px 0 ${accent}` };
  if (url) return <Image src={url} alt={name} width={size} height={size} style={st} unoptimized />;
  return <div style={{ ...st, background: accent, display: 'grid', placeItems: 'center', fontSize: size * 0.35, fontWeight: 900, color: bg }}>{name[0].toUpperCase()}</div>;
}
