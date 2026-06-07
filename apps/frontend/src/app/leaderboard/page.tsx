'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
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

const periodPill: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', minHeight: 36, padding: '0 15px', borderRadius: 999, fontWeight: 900, fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s' };
const pagBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 36, padding: '0 14px', border: `3px solid ${ink}`, borderRadius: 12, fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'inherit' };
const pageNumBtn: React.CSSProperties = { width: 34, height: 34, borderRadius: 10, fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' };

export default function LeaderboardPage() {
  const [lb, setLb]           = useState<LbResponse | null>(null);
  const [period, setPeriod]   = useState<Period>('all_time');
  const [page, setPage]       = useState(0);
  const [loading, setLoading] = useState(true);
  const [me, setMe]           = useState<string | null>(null);

  const w = useWindowWidth();
  const isMobile = w < 640;

  useEffect(() => {
    api.get<{ user: { username: string } }>('/api/auth/profile')
      .then(r => setMe(r.data.user.username))
      .catch(() => null);
  }, []);

  const fetchLb = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get<LbResponse>(`/api/leaderboard?limit=${PER_PAGE}&offset=${page * PER_PAGE}&period=${period}`);
      setLb(r.data);
    } finally { setLoading(false); }
  }, [page, period]);

  useEffect(() => { fetchLb(); }, [fetchLb]);

  const totalPages = lb ? Math.ceil(lb.total / PER_PAGE) : 0;

  return (
    <>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: `${bg}e0`, backdropFilter: 'blur(14px)', borderBottom: `1px solid rgba(240,236,224,0.07)` }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 'min(1180px, calc(100% - 40px))', margin: '0 auto', padding: '16px 0' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: ink, textDecoration: 'none' }}>
            <div style={{ display: 'grid', placeItems: 'center', width: 36, height: 36, border: `3px solid ${ink}`, borderRadius: 10, background: yellow, color: bg, fontWeight: 900, fontSize: '0.72rem', boxShadow: `4px 4px 0 ${ink}` }}>A$</div>
            amibroke
          </Link>
          {me && (
            <Link href={`/${me}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 34, padding: '0 14px', border: `2px solid rgba(240,236,224,0.18)`, borderRadius: 999, background: surface, color: muted, fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none' }}>
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
            Who&apos;s most broke?
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
          {LB_PERIODS.map(({ key, label }) => (
            <button key={key} onClick={() => { setPeriod(key); setPage(0); }} style={{ ...periodPill, border: `3px solid ${period === key ? ink : 'rgba(240,236,224,0.18)'}`, background: period === key ? yellow : 'transparent', color: period === key ? bg : muted, boxShadow: period === key ? `3px 3px 0 ${ink}` : 'none' }}>
              {label}
            </button>
          ))}
          {lb && <span style={{ marginLeft: 'auto', fontSize: '0.74rem', fontWeight: 600, color: muted }}>{lb.total} total</span>}
        </div>

        {loading ? (
          <div style={{ color: muted, fontFamily: 'ui-monospace, monospace', fontSize: '0.86rem', padding: '60px 0', textAlign: 'center', fontWeight: 600 }}>Loading...</div>
        ) : lb && lb.leaderboard.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                <a key={entry.username} href={`/${entry.username}`} style={{ display: 'grid', gridTemplateColumns: cols, gap: isMobile ? 8 : 12, alignItems: 'center', padding: isMobile ? '10px 14px' : '12px 18px', border: `3px solid ${isMe ? yellow : ink}`, borderRadius: 18, background: isMe ? `radial-gradient(circle at 12% 50%, rgba(255,242,97,0.1), transparent 45%), ${surface}` : surface, boxShadow: isMe ? `5px 5px 0 ${yellow}` : `4px 4px 0 rgba(240,236,224,0.05)`, textDecoration: 'none' }}>
                  <div style={{ display: 'grid', placeItems: 'center', width: isMobile ? 32 : 42, height: isMobile ? 32 : 42, border: `3px solid ${ink}`, borderRadius: 11, background: RANK_BG[(rank - 1) % RANK_BG.length], color: bg, fontWeight: 900, fontSize: isMobile ? '0.68rem' : '0.82rem', boxShadow: `3px 3px 0 ${ink}` }}>#{rank}</div>
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
