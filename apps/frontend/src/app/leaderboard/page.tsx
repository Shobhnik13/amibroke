'use client';

import React, { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api, { hasToken } from '@/lib/api';
import { useWindowWidth } from '@/lib/use-responsive';

interface LbEntry {
  username: string; avatarUrl: string | null;
  totalCostUsd: string | null; totalInputTokens: string | null;
  totalOutputTokens: string | null; totalCacheReadTokens: string | null; totalCacheWriteTokens: string | null;
}
interface LbResponse { leaderboard: LbEntry[]; total: number; period: string; }

type Period = 'all_time' | 'monthly' | 'weekly' | 'daily';

const ink     = '#f0ece0';
const bg      = '#0f0d0b';
const surface = '#1a1714';
const muted   = '#8c8278';
const yellow  = '#fff261';
const cyan    = '#59e8ff';
const coral   = '#ff6464';
const green   = '#5dff9c';
const pink    = '#ff7bd4';

const RANK_BG = [yellow, cyan, green, coral, pink];
const LB_PERIODS: { key: Period; label: string }[] = [
  { key: 'all_time', label: 'All time' },
  { key: 'monthly',  label: 'Monthly'  },
  { key: 'weekly',   label: 'Weekly'   },
  { key: 'daily',    label: 'Daily'    },
];
const PER_PAGE = 20;

// avoids React's "useLayoutEffect does nothing on the server" warning during SSR
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function n(v: string | null | undefined): number { return parseFloat(v ?? '0') || 0; }
function fmt(raw: string | null | undefined | number): string {
  const v = typeof raw === 'number' ? raw : n(raw as string | null);
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)         return `${(v / 1_000).toFixed(1)}k`;
  return `${Math.round(v)}`;
}
function fmtCost(raw: string | null | undefined): string { return `$${n(raw as string).toFixed(2)}`; }

function buildPageNums(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const pages: (number | '...')[] = [];
  const add = (p: number | '...') => { if (pages[pages.length - 1] !== p) pages.push(p); };
  add(0);
  if (current > 2) add('...');
  for (let p = Math.max(1, current - 1); p <= Math.min(total - 2, current + 1); p++) add(p);
  if (current < total - 3) add('...');
  add(total - 1);
  return pages;
}

function Avatar({ url, name, size, border }: { url: string | null; name: string; size: number; border?: string }) {
  const st: React.CSSProperties = { width: size, height: size, borderRadius: size / 2, border: border ?? `2px solid ${ink}`, flexShrink: 0 };
  if (url) return <Image src={url} alt={name} width={size} height={size} style={st} unoptimized />;
  return <div style={{ ...st, background: yellow, display: 'grid', placeItems: 'center', fontSize: size * 0.35, fontWeight: 900, color: bg }}>{name[0].toUpperCase()}</div>;
}

// lands a row after it slides: a short vibrate + a coloured glow pulse
function land(el: HTMLElement, color: string, strong: boolean) {
  const base = getComputedStyle(el).boxShadow;
  const amp = strong ? 6 : 3.5;
  const pop = strong ? 1.035 : 1.012;
  el.animate([
    { transform: 'translateX(0) scale(1)' },
    { transform: `translateX(${-amp}px) scale(${pop})` },
    { transform: `translateX(${amp}px) scale(${pop})` },
    { transform: `translateX(${-amp * 0.55}px) scale(1)` },
    { transform: `translateX(${amp * 0.4}px) scale(1)` },
    { transform: 'translateX(0) scale(1)' },
  ], { duration: strong ? 460 : 300, easing: 'ease-out' });
  const glow = el.animate([
    { boxShadow: `0 0 0 0 ${color}00, ${base}` },
    { boxShadow: `0 0 0 7px ${color}66, ${base}` },
    { boxShadow: `0 0 0 0 ${color}00, ${base}` },
  ], { duration: strong ? 900 : 620, easing: 'ease-out' });
  return glow.finished;
}

function RankDelta({ delta }: { delta: number }) {
  const up = delta > 0;
  return (
    <span style={{ position: 'absolute', top: -9, right: -12, display: 'inline-flex', alignItems: 'center', gap: 1, padding: '1px 5px', borderRadius: 999, border: `2px solid ${bg}`, background: up ? green : coral, color: bg, fontSize: '0.56rem', fontWeight: 900, lineHeight: 1.5, animation: 'fade-up 0.35s ease-out both', pointerEvents: 'none' }}>
      {up ? '▲' : '▼'}{Math.abs(delta)}
    </span>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: spinning ? 'spin 0.7s linear infinite' : 'none' }} aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

const periodPill: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', minHeight: 36, padding: '0 15px', borderRadius: 999, fontWeight: 900, fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s' };
const pagBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 36, padding: '0 14px', border: `3px solid ${ink}`, borderRadius: 12, fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'inherit' };
const refreshBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 7, minHeight: 36, padding: '0 14px', border: `3px solid ${ink}`, borderRadius: 999, background: cyan, color: bg, fontWeight: 900, fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'inherit', boxShadow: `3px 3px 0 ${ink}`, transition: 'all 0.12s' };
const pageNumBtn: React.CSSProperties = { width: 34, height: 34, borderRadius: 10, fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' };

export default function LeaderboardPage() {
  const [lb, setLb]           = useState<LbResponse | null>(null);
  const [period, setPeriod]   = useState<Period>('all_time');
  const [page, setPage]       = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [me, setMe]           = useState<string | null>(null);
  const [deltas, setDeltas]   = useState<Record<string, number>>({});

  const rowRefs   = useRef(new Map<string, HTMLAnchorElement>());
  const prevTops  = useRef(new Map<string, number>());
  const prevRanks = useRef(new Map<string, number>());
  const listKey   = `${period}:${page}`;
  const prevKey   = useRef(listKey);

  const w = useWindowWidth();
  const isMobile = w < 640;

  useEffect(() => {
    if (!hasToken()) return;
    api.get<{ user: { username: string } }>('/api/auth/profile')
      .then(r => setMe(r.data.user.username))
      .catch(() => null);
  }, []);

  const fetchLb = useCallback(async (soft = false) => {
    if (soft) setRefreshing(true); else setLoading(true);
    try {
      const req = api.get<LbResponse>(`/api/leaderboard?limit=${PER_PAGE}&offset=${page * PER_PAGE}&period=${period}`);
      // keep the spinner up long enough to read as a refresh, not a flicker
      const [r] = await Promise.all([req, soft ? new Promise(res => setTimeout(res, 450)) : null]);
      setLb(r.data);
    } finally { if (soft) setRefreshing(false); else setLoading(false); }
  }, [page, period]);

  useEffect(() => { fetchLb(); }, [fetchLb]);

  // FLIP: when a refresh reshuffles the board, slide every row from where it
  // was to where it now is, then vibrate it on landing.
  useIsoLayoutEffect(() => {
    if (!lb) return;
    const tops = new Map<string, number>();
    rowRefs.current.forEach((el, name) => tops.set(name, el.getBoundingClientRect().top + window.scrollY));
    const ranks = new Map<string, number>();
    lb.leaderboard.forEach((e, i) => ranks.set(e.username, page * PER_PAGE + i + 1));

    const sameList = prevKey.current === listKey && prevTops.current.size > 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (sameList) {
      const moved: Record<string, number> = {};
      const oldKing = [...prevRanks.current.entries()].find(([, r]) => r === 1)?.[0];

      rowRefs.current.forEach((el, name) => {
        const from = prevTops.current.get(name);
        const to = tops.get(name);
        const oldRank = prevRanks.current.get(name);
        const newRank = ranks.get(name);
        if (oldRank != null && newRank != null && oldRank !== newRank) moved[name] = oldRank - newRank;
        if (from == null || to == null || reduced) return;

        const dy = from - to;
        if (Math.abs(dy) < 1) return;
        const climbed = dy > 0;
        const color = climbed ? green : coral;
        const crowned = climbed && newRank === 1 && oldKing != null && oldKing !== name;

        // lift the travelling row above the ones it slides past
        el.style.zIndex = climbed ? '6' : '4';
        el.animate(
          [{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }],
          { duration: Math.min(950, 400 + Math.abs(dy) * 0.7), easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        ).finished
          .then(() => land(el, color, crowned))
          .catch(() => null)
          .finally(() => { el.style.zIndex = ''; });
      });

      if (Object.keys(moved).length) {
        setDeltas(moved);
        const t = setTimeout(() => setDeltas({}), 4500);
        prevTops.current = tops; prevRanks.current = ranks; prevKey.current = listKey;
        return () => clearTimeout(t);
      }
    }

    prevTops.current = tops; prevRanks.current = ranks; prevKey.current = listKey;
  }, [lb, listKey, page]);

  const totalPages = lb ? Math.ceil(lb.total / PER_PAGE) : 0;

  return (
    <>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: `${bg}e0`, backdropFilter: 'blur(14px)', borderBottom: `1px solid rgba(240,236,224,0.07)` }}>
        <nav className="nav-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 'min(1180px, calc(100% - 40px))', margin: '0 auto', padding: '16px 0' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: ink, textDecoration: 'none' }}>
            <div style={{ display: 'grid', placeItems: 'center', width: 36, height: 36, border: `3px solid ${ink}`, borderRadius: 10, background: yellow, color: bg, fontWeight: 900, fontSize: '0.72rem', boxShadow: `4px 4px 0 ${ink}`, flexShrink: 0 }}>A$</div>
            <span className="nav-wordmark">amigmi</span>
          </Link>
          {me && (
            <Link href={`/${me}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 34, padding: '0 12px', border: `2px solid rgba(240,236,224,0.18)`, borderRadius: 999, background: surface, color: muted, fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none', flexShrink: 0 }}>
              @{me}
            </Link>
          )}
        </nav>
      </header>

      <main style={{ width: 'min(1180px, calc(100% - 40px))', margin: '0 auto', padding: `${isMobile ? '28px' : '48px'} 0 80px` }}>

        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: `2px solid ${ink}`, borderRadius: 999, background: coral, padding: '6px 14px', fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: bg, marginBottom: 14 }}>
            ★ Leaderboard
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, color: ink, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 0.95, margin: 0 }}>
            Who&apos;s spending to make it?
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
          {LB_PERIODS.map(({ key, label }) => (
            <button key={key} onClick={() => { setPeriod(key); setPage(0); }} style={{ ...periodPill, border: `3px solid ${period === key ? ink : 'rgba(240,236,224,0.18)'}`, background: period === key ? yellow : 'transparent', color: period === key ? bg : muted, boxShadow: period === key ? `3px 3px 0 ${ink}` : 'none' }}>
              {label}
            </button>
          ))}
          {lb && <span style={{ marginLeft: 'auto', fontSize: '0.74rem', fontWeight: 600, color: muted }}>{lb.total} total</span>}
          <button
            onClick={() => fetchLb(true)}
            disabled={refreshing || loading}
            title="Refresh leaderboard"
            aria-label="Refresh leaderboard"
            style={{ ...refreshBtn, marginLeft: lb ? 0 : 'auto', opacity: refreshing || loading ? 0.55 : 1, cursor: refreshing || loading ? 'wait' : 'pointer' }}
          >
            <RefreshIcon spinning={refreshing} />
            {!isMobile && (refreshing ? 'Refreshing' : 'Refresh')}
          </button>
        </div>

        {loading ? (
          <div style={{ color: muted, fontFamily: 'ui-monospace, monospace', fontSize: '0.86rem', padding: '60px 0', textAlign: 'center', fontWeight: 600 }}>Loading...</div>
        ) : lb && lb.leaderboard.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: refreshing ? 0.55 : 1, transition: 'opacity 0.15s' }}>
            {!isMobile && (
              <div style={{ display: 'grid', gridTemplateColumns: '56px minmax(0,1fr) 100px 100px 90px 100px', gap: 12, padding: '10px 18px', borderBottom: `2px solid rgba(240,236,224,0.08)` }}>
                {['Rank', 'User', 'Input', 'Output', 'Cache', 'Cost'].map(h => (
                  <span key={h} style={{ fontSize: '0.68rem', fontWeight: 900, color: muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
                ))}
              </div>
            )}

            {lb.leaderboard.map((entry, i) => {
              const rank = page * PER_PAGE + i + 1;
              const isMe = entry.username === me;
              const cols = isMobile ? '40px minmax(0,1fr) 70px' : '56px minmax(0,1fr) 100px 100px 90px 100px';
              return (
                <a key={entry.username} href={`/${entry.username}`} ref={el => { if (el) rowRefs.current.set(entry.username, el); else rowRefs.current.delete(entry.username); }} style={{ display: 'grid', gridTemplateColumns: cols, gap: isMobile ? 8 : 12, alignItems: 'center', padding: isMobile ? '10px 14px' : '12px 18px', border: `3px solid ${isMe ? yellow : ink}`, borderRadius: 18, background: isMe ? `radial-gradient(circle at 12% 50%, rgba(255,242,97,0.1), transparent 45%), ${surface}` : surface, boxShadow: isMe ? `5px 5px 0 ${yellow}` : `4px 4px 0 rgba(240,236,224,0.05)`, textDecoration: 'none' }}>
                  <div style={{ position: 'relative', display: 'grid', placeItems: 'center', width: isMobile ? 32 : 42, height: isMobile ? 32 : 42, border: `3px solid ${ink}`, borderRadius: 11, background: RANK_BG[(rank - 1) % RANK_BG.length], color: bg, fontWeight: 900, fontSize: isMobile ? '0.68rem' : '0.82rem', boxShadow: `3px 3px 0 ${ink}` }}>
                    #{rank}
                    {deltas[entry.username] ? <RankDelta delta={deltas[entry.username]} /> : null}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                    <Avatar url={entry.avatarUrl} name={entry.username} size={isMobile ? 22 : 28} border={`2px solid ${isMe ? yellow : ink}`} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: isMobile ? '0.78rem' : '0.88rem', color: isMe ? yellow : ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{entry.username}{isMe ? ' (you)' : ''}</div>
                      <div style={{ fontSize: isMobile ? '0.62rem' : '0.68rem', color: muted, fontWeight: 600, marginTop: 1 }}>
                        {fmt(n(entry.totalInputTokens) + n(entry.totalOutputTokens) + (isMobile ? 0 : n(entry.totalCacheReadTokens)))} total tokens
                      </div>
                    </div>
                  </div>
                  {!isMobile && <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.76rem', fontWeight: 600, color: muted, fontVariantNumeric: 'tabular-nums' }}>{fmt(entry.totalInputTokens)}</span>}
                  {!isMobile && <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.76rem', fontWeight: 600, color: muted, fontVariantNumeric: 'tabular-nums' }}>{fmt(entry.totalOutputTokens)}</span>}
                  {!isMobile && <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.76rem', fontWeight: 600, color: cyan, fontVariantNumeric: 'tabular-nums' }}>{fmt(n(entry.totalCacheReadTokens))}</span>}
                  <div style={{ fontWeight: 900, fontSize: isMobile ? '0.92rem' : '1.1rem', color: RANK_BG[(rank - 1) % RANK_BG.length], fontVariantNumeric: 'tabular-nums' }}>{fmtCost(entry.totalCostUsd)}</div>
                </a>
              );
            })}

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, border: `3px solid ${ink}`, borderRadius: 18, background: surface, padding: '12px 16px', marginTop: 4, boxShadow: `4px 4px 0 rgba(240,236,224,0.06)` }}>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ ...pagBtn, opacity: page === 0 ? 0.35 : 1, cursor: page === 0 ? 'not-allowed' : 'pointer', background: 'transparent', color: muted }}>← Prev</button>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {buildPageNums(page, totalPages).map((p, idx) =>
                    typeof p === 'number'
                      ? <button key={idx} onClick={() => setPage(p)} style={{ ...pageNumBtn, border: `3px solid ${p === page ? ink : 'rgba(240,236,224,0.18)'}`, background: p === page ? yellow : 'transparent', color: p === page ? bg : muted, cursor: 'pointer' }}>{p + 1}</button>
                      : <span key={idx} style={{ width: 32, display: 'grid', placeItems: 'center', color: muted, fontSize: '0.82rem' }}>…</span>
                  )}
                </div>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{ ...pagBtn, background: page >= totalPages - 1 ? 'transparent' : coral, color: page >= totalPages - 1 ? muted : bg, border: `3px solid ${page >= totalPages - 1 ? 'rgba(240,236,224,0.18)' : ink}`, opacity: page >= totalPages - 1 ? 0.35 : 1, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}>Next →</button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: muted, fontWeight: 600, fontSize: '0.9rem', padding: '60px 0', textAlign: 'center' }}>No data for this period yet.</div>
        )}
      </main>
    </>
  );
}
