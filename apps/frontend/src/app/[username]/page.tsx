'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { getFunnyLine } from '@/lib/funny';
import { useWindowWidth } from '@/lib/use-responsive';

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
  user: { username: string; avatarUrl: string | null; createdAt: string };
  breakdown: BreakdownRow[];
  period: string;
}
interface OwnProfile {
  user: { username: string; avatarUrl: string | null; detectedAgents: string[]; apiKeyPrefix: string | null; publicTheme: string; createdAt: string };
  daemon: { status: string; lastSyncAt: string | null; message: string; lastSyncedAgents: string[]; nextSyncAt: string | null };
  totalCostUsd: string | null;
}
interface LbEntry {
  username: string; avatarUrl: string | null;
  totalCostUsd: string | null; totalInputTokens: string | null;
  totalOutputTokens: string | null; totalCacheReadTokens: string | null; totalCacheWriteTokens: string | null;
}
interface LbResponse { leaderboard: LbEntry[]; total: number; period: string; }

type Tab    = 'profile' | 'leaderboard';
type Period = 'all_time' | 'monthly' | 'weekly' | 'daily';

// ── design tokens ────────────────────────────────────────
const ink     = '#f0ece0';
const bg      = '#0f0d0b';
const term    = '#090806';
const surface = '#1a1714';
const muted   = '#8c8278';
const yellow  = '#fff261';
const cyan    = '#59e8ff';
const coral   = '#ff6464';
const green   = '#5dff9c';
const pink    = '#ff7bd4';

const RANK_BG   = [yellow, cyan, green, coral, pink];
const AGENT_LBL: Record<string, string> = { claude_code: 'Claude Code', codex: 'Codex', opencode: 'OpenCode' };
const DAEMON_COL: Record<string, string> = { active: green, stale: yellow, inactive: coral, stopped: coral, uninstalled: muted, never_installed: muted };
const LB_PERIODS: { key: Period; label: string }[] = [
  { key: 'all_time', label: 'All time' },
  { key: 'monthly',  label: 'Monthly'  },
  { key: 'weekly',   label: 'Weekly'   },
  { key: 'daily',    label: 'Daily'    },
];
const PER_PAGE = 20;

// ── share themes ─────────────────────────────────────────
export const SHARE_THEMES = [
  { key: 'noir',   name: 'Noir',   bg: '#0f0d0b', accent: '#fff261' },
  { key: 'neon',   name: 'Neon',   bg: '#03060d', accent: '#59e8ff' },
  { key: 'plasma', name: 'Plasma', bg: '#0d0313', accent: '#c084fc' },
  { key: 'matrix', name: 'Matrix', bg: '#000b00', accent: '#4ade80' },
  { key: 'ember',  name: 'Ember',  bg: '#130604', accent: '#fb923c' },
] as const;
export type ShareTheme = typeof SHARE_THEMES[number]['key'];

// ── number helpers ───────────────────────────────────────
function n(v: string | null | undefined): number { return parseFloat(v ?? '0') || 0; }
function fmt(raw: string | null | undefined | number): string {
  const v = typeof raw === 'number' ? raw : n(raw as string | null);
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)         return `${(v / 1_000).toFixed(1)}k`;
  return `${Math.round(v)}`;
}
function fmtCost(raw: string | null | undefined): string { return `$${n(raw as string).toFixed(2)}`; }
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000), m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m ago` : `${m}m ago`;
}
function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'soon';
  const h = Math.floor(diff / 3_600_000), m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
}
function aggBreakdown(rows: BreakdownRow[]) {
  return rows.reduce(
    (a, r) => ({ input: a.input + n(r.totalInputTokens), output: a.output + n(r.totalOutputTokens), cacheR: a.cacheR + n(r.totalCacheReadTokens), cacheW: a.cacheW + n(r.totalCacheWriteTokens), cost: a.cost + n(r.totalCostUsd) }),
    { input: 0, output: 0, cacheR: 0, cacheW: 0, cost: 0 }
  );
}

// ── page ─────────────────────────────────────────────────
export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();

  const [pub,      setPub]      = useState<PublicProfile | null>(null);
  const [own,      setOwn]      = useState<OwnProfile | null>(null);
  const [tab,      setTab]      = useState<Tab>('profile');
  const [lbPeriod, setLbPeriod] = useState<Period>('all_time');
  const [lb,       setLb]       = useState<LbResponse | null>(null);
  const [page,     setPage]     = useState(0);
  const [init,     setInit]     = useState(true);
  const [fetchErr, setFetchErr] = useState<'not_found' | 'private' | null>(null);
  const [lbLoading, setLbLoading] = useState(false);
  const [showKey,   setShowKey]   = useState(false);
  const [genning,   setGenning]   = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareTheme, setShareTheme] = useState<ShareTheme>('noir');
  const [linkCopied, setLinkCopied] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [uninstallOS, setUninstallOS] = useState<'macos' | 'linux'>('macos');
  const [uninstallCopied, setUninstallCopied] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [uninstallOpen, setUninstallOpen] = useState(false);
  const [setupCmdCopied, setSetupCmdCopied] = useState(false);
  const [storedKey, setStoredKey] = useState<string | null>(null);

  const w = useWindowWidth();
  const isMobile = w < 640;

  const isOwn = own?.user.username === username;

  useEffect(() => {
    (async () => {
      try {
        const [pubRes] = await Promise.allSettled([
          api.get<PublicProfile>(`/api/leaderboard/users/${username}?period=all_time`),
          api.get<OwnProfile>('/api/auth/profile').then(async r => {
            setOwn(r.data);
            setShareTheme((r.data.user.publicTheme as ShareTheme) ?? 'noir');
            if (r.data.user.apiKeyPrefix) {
              const keyRes = await api.get<{ key: string }>('/api/auth/key').catch(() => null);
              if (keyRes) setStoredKey(keyRes.data.key);
            }
          }),
        ]);
        if (pubRes.status === 'fulfilled') {
          setPub(pubRes.value.data);
        } else {
          const status = (pubRes.reason as { response?: { status: number } })?.response?.status;
          setFetchErr(status === 403 ? 'private' : 'not_found');
        }
      } finally {
        setInit(false);
      }
    })();
  }, [username, router]);

  const fetchLb = useCallback(async () => {
    setLbLoading(true);
    try {
      const r = await api.get<LbResponse>(`/api/leaderboard?limit=${PER_PAGE}&offset=${page * PER_PAGE}&period=${lbPeriod}`);
      setLb(r.data);
    } finally { setLbLoading(false); }
  }, [page, lbPeriod]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (tab === 'leaderboard') fetchLb(); }, [tab, fetchLb]);

  async function handleGenKey() {
    setGenning(true);
    try {
      const r = await api.post<{ key: string; prefix: string }>('/api/auth/key');
      setStoredKey(r.data.key);
      setShowKey(true);
      setOwn(prev => prev ? { ...prev, user: { ...prev.user, apiKeyPrefix: r.data.prefix } } : prev);
    } finally { setGenning(false); }
  }

  async function copyText(text: string, which: 'key' | 'link') {
    await navigator.clipboard.writeText(text);
    if (which === 'key') { setKeyCopied(true); setTimeout(() => setKeyCopied(false), 2000); }
    else { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }
  }

  const UNINSTALL_CMDS = {
    macos: [
      'launchctl unload ~/Library/LaunchAgents/dev.amibroke.daemon.plist',
      'rm ~/Library/LaunchAgents/dev.amibroke.daemon.plist',
      'rm -rf ~/.config/amibroke',
    ],
    linux: [
      'systemctl --user disable --now amibroke.timer',
      'rm ~/.config/systemd/user/amibroke.service ~/.config/systemd/user/amibroke.timer',
      'rm -rf ~/.config/amibroke',
    ],
  };

  async function copyUninstall() {
    await navigator.clipboard.writeText(UNINSTALL_CMDS[uninstallOS].join('\n'));
    setUninstallCopied(true);
    setTimeout(() => setUninstallCopied(false), 2000);
  }

  async function copySetupCmd() {
    const cmd = storedKey ? `bunx amibroke init ${storedKey}` : 'bunx amibroke init <your-key>';
    await navigator.clipboard.writeText(cmd);
    setSetupCmdCopied(true);
    setTimeout(() => setSetupCmdCopied(false), 2000);
  }

  async function handleThemeChange(t: ShareTheme) {
    setShareTheme(t);
    setSavingTheme(true);
    try { await api.patch('/api/auth/public-theme', { theme: t }); } finally { setSavingTheme(false); }
  }

  function shareUrl() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://amibroke.dev';
    return `${origin}/public/${username}`;
  }

  if (init) return <Loading />;
  if (fetchErr) return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#0f0d0b' }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
        <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f0ece0', textTransform: 'uppercase' }}>
          {fetchErr === 'private' ? 'Private profile' : `@${username} not found`}
        </div>
        <p style={{ color: '#8c8278', fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>
          {fetchErr === 'private' ? 'This profile is set to private.' : "This user doesn't exist on amibroke.dev."}
        </p>
        <Link href="/" style={{ color: '#fff261', fontWeight: 700, fontSize: '0.85rem' }}>← Back to home</Link>
      </div>
    </div>
  );
  if (!pub) return null;

  const agg = aggBreakdown(pub.breakdown);
  const totalCost = isOwn && own?.totalCostUsd ? n(own.totalCostUsd) : agg.cost;
  const totalPages = lb ? Math.ceil(lb.total / PER_PAGE) : 0;

  return (
    <>
      {/* ── NAV ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: `${bg}e0`, backdropFilter: 'blur(14px)', borderBottom: `1px solid rgba(240,236,224,0.07)` }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 'min(1180px, calc(100% - 40px))', margin: '0 auto', padding: '16px 0' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: ink, textDecoration: 'none' }}>
            <div style={{ display: 'grid', placeItems: 'center', width: 36, height: 36, border: `3px solid ${ink}`, borderRadius: 10, background: yellow, color: bg, fontWeight: 900, fontSize: '0.72rem', boxShadow: `4px 4px 0 ${ink}` }}>A$</div>
            amibroke
          </Link>
          {isOwn && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, border: `2px solid rgba(240,236,224,0.18)`, borderRadius: 999, padding: '5px 12px 5px 5px', background: surface }}>
              <Avatar url={pub.user.avatarUrl} name={pub.user.username} size={24} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: ink }}>@{pub.user.username}</span>
            </div>
          )}
        </nav>
      </header>

      {/* ── HERO ── */}
      <section style={{ width: isMobile ? 'calc(100% - 24px)' : 'min(1180px, calc(100% - 40px))', margin: '0 auto', padding: `${isMobile ? '20px' : '44px'} 0 0` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 36, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <Avatar url={pub.user.avatarUrl} name={pub.user.username} size={80} border={`3px solid ${ink}`} shadow={`5px 5px 0 ${yellow}`} radius={20} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, color: ink, textTransform: 'uppercase', lineHeight: 0.95, letterSpacing: '-0.01em', margin: 0 }}>
                  @{pub.user.username}
                </h1>
                <a
                  href={`https://github.com/${pub.user.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 30, padding: '0 11px', border: `2px solid rgba(240,236,224,0.22)`, borderRadius: 9, background: surface, color: muted, fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', textDecoration: 'none', flexShrink: 0 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                  GitHub
                </a>
              </div>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: muted, margin: 0 }}>{getFunnyLine(totalCost)}</p>
            </div>
          </div>
          {isOwn && (
            <button
              onClick={() => setShowShare(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '0 20px', border: `3px solid ${ink}`, borderRadius: 14, background: pink, color: bg, fontWeight: 900, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', boxShadow: `4px 4px 0 ${ink}`, fontFamily: 'inherit', flexShrink: 0 }}
            >
              ↗ Share receipt
            </button>
          )}
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', borderBottom: `3px solid rgba(240,236,224,0.1)`, marginBottom: 30 }}>
          {(['profile', 'leaderboard'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ minHeight: 44, padding: '0 22px', border: 'none', borderBottom: `3px solid ${tab === t ? yellow : 'transparent'}`, background: 'transparent', color: tab === t ? ink : muted, fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', marginBottom: -3, fontFamily: 'inherit' }}>
              {t}
            </button>
          ))}
        </div>

        {/* ══════════════════════ PROFILE TAB ══════════════════════ */}
        {tab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 80 }}>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, minmax(0,1fr))`, gap: 12 }}>
              <StatCard label="Total spend"    value={fmtCost(totalCost.toString())} color={coral} />
              <StatCard label="Input tokens"   value={fmt(agg.input)}                color={yellow} />
              <StatCard label="Output tokens"  value={fmt(agg.output)}               color={cyan} />
              <StatCard label="Cache read"     value={fmt(agg.cacheR)}               color={green} />
            </div>

            {/* Breakdown table — shown first */}
            {pub.breakdown.length > 0 && (
              <div style={{ border: `3px solid ${ink}`, borderRadius: 22, background: surface, overflow: 'hidden', boxShadow: `5px 5px 0 rgba(240,236,224,0.06)` }}>
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ minWidth: 520 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 80px 80px 80px 80px', gap: 8, padding: '12px 20px', borderBottom: `2px solid rgba(240,236,224,0.08)`, background: term }}>
                      {['Agent', 'Model', 'Input', 'Output', 'Cache R', 'Cost'].map(h => (
                        <span key={h} style={{ fontSize: '0.68rem', fontWeight: 900, color: muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
                      ))}
                    </div>
                    {pub.breakdown.map((row, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 80px 80px 80px 80px', gap: 8, padding: '12px 20px', borderBottom: `1px solid rgba(240,236,224,0.05)`, alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{AGENT_LBL[row.agent] ?? row.agent}</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.model}</span>
                        <Mono>{fmt(row.totalInputTokens)}</Mono>
                        <Mono>{fmt(row.totalOutputTokens)}</Mono>
                        <Mono color={cyan}>{fmt(row.totalCacheReadTokens)}</Mono>
                        <Mono color={coral} bold>{fmtCost(row.totalCostUsd)}</Mono>
                      </div>
                    ))}
                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 80px 80px 80px 80px', gap: 8, padding: '12px 20px', background: 'rgba(240,236,224,0.03)', borderTop: `2px solid rgba(240,236,224,0.1)`, alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 900, color: ink, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</span>
                      <span />
                      <Mono bold>{fmt(agg.input)}</Mono>
                      <Mono bold>{fmt(agg.output)}</Mono>
                      <Mono color={cyan} bold>{fmt(agg.cacheR)}</Mono>
                      <Mono color={coral} bold>{fmtCost(totalCost.toString())}</Mono>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Own-profile: api key + accordions */}
            {isOwn && own && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* ── API KEY + DAEMON (combined full-width card) ── */}
                <div style={{ border: `3px solid ${ink}`, borderRadius: 22, background: surface, padding: '22px 20px', boxShadow: `5px 5px 0 ${yellow}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* header row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <Pill bg={yellow} text="🔑 API key" />
                    <Pill bg={DAEMON_COL[own.daemon.status] ?? muted} text={`● Daemon · ${own.daemon.status.replace(/_/g, ' ')}`} />
                  </div>

                  {/* key display */}
                  {(storedKey ?? own.user.apiKeyPrefix) ? (
                    <KeyBox value={showKey ? (storedKey ?? `${own.user.apiKeyPrefix}${'•'.repeat(28)}`) : `${own.user.apiKeyPrefix}${'•'.repeat(28)}`} green={!!showKey} wrap={showKey}>
                      <TinyBtn onClick={() => setShowKey(v => !v)}>{showKey ? 'Hide' : 'Show'}</TinyBtn>
                      <TinyBtn onClick={() => copyText(storedKey ?? own.user.apiKeyPrefix!, 'key')} active={keyCopied}>{keyCopied ? '✓ Copied' : 'Copy'}</TinyBtn>
                    </KeyBox>
                  ) : (
                    <button onClick={handleGenKey} disabled={genning} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 40, padding: '0 14px', border: `2px solid ${ink}`, borderRadius: 12, background: coral, color: bg, fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', cursor: genning ? 'wait' : 'pointer', opacity: genning ? 0.6 : 1, letterSpacing: '0.04em', fontFamily: 'inherit' }}>
                      {genning ? 'Generating...' : 'Generate API key →'}
                    </button>
                  )}

                  {/* daemon inline row */}
                  {own.daemon.lastSyncAt ? (
                    <div style={{ background: term, border: `2px solid rgba(240,236,224,0.07)`, borderRadius: 12, padding: '10px 14px', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <KVRow l="last sync" r={timeAgo(own.daemon.lastSyncAt)} rColor={ink} />
                      {own.daemon.nextSyncAt && <KVRow l="next sync" r={timeUntil(own.daemon.nextSyncAt)} rColor={green} />}
                      {own.daemon.lastSyncedAgents.length > 0 && <KVRow l="last synced agents" r={own.daemon.lastSyncedAgents.map(a => AGENT_LBL[a] ?? a).join(', ')} rColor={cyan} />}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: muted, lineHeight: 1.5, margin: 0 }}>{own.daemon.message}</p>
                  )}
                </div>

                {/* ── SETUP & HELP accordion ── */}
                <div style={{ border: `3px solid rgba(240,236,224,0.14)`, borderRadius: 18, background: surface, overflow: 'hidden' }}>
                  <button
                    onClick={() => setHelpOpen(v => !v)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', border: 'none', background: 'transparent', color: ink, fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <span>📦 Setup &amp; help</span>
                    <span style={{ color: muted, fontSize: '0.8rem', fontWeight: 700, transition: 'transform 0.15s', display: 'inline-block', transform: helpOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                  </button>
                  {helpOpen && (
                    <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14, borderTop: `2px solid rgba(240,236,224,0.07)` }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: muted, lineHeight: 1.55, margin: '14px 0 0' }}>
                        Install the CLI and paste your key to start tracking. macOS &amp; Linux only.
                      </p>
                      <div style={{ background: term, border: `2px solid rgba(240,236,224,0.08)`, borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <span style={{ color: green, fontFamily: 'ui-monospace, monospace', fontSize: '0.74rem', fontWeight: 700, flexShrink: 0, paddingTop: 1 }}>$</span>
                          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.76rem', fontWeight: 600, color: ink, flex: 1, wordBreak: 'break-all' }}>
                            bunx amibroke init{' '}
                            <span style={{ color: yellow }}>{storedKey ?? '<your-key>'}</span>
                          </span>
                          <TinyBtn onClick={copySetupCmd} active={setupCmdCopied}>{setupCmdCopied ? '✓' : 'Copy'}</TinyBtn>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── UNINSTALL accordion ── */}
                <div style={{ border: `3px solid rgba(240,236,224,0.14)`, borderRadius: 18, background: surface, overflow: 'hidden' }}>
                  <button
                    onClick={() => setUninstallOpen(v => !v)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', border: 'none', background: 'transparent', color: muted, fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <span>🗑 Uninstall / stop tracking</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, transition: 'transform 0.15s', display: 'inline-block', transform: uninstallOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                  </button>
                  {uninstallOpen && (
                    <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14, borderTop: `2px solid rgba(240,236,224,0.07)` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: muted, lineHeight: 1.5, margin: 0 }}>
                          Stops the daemon and removes local config. Your account and data on amibroke.dev are unaffected.
                        </p>
                        <div style={{ display: 'flex', border: `2px solid rgba(240,236,224,0.18)`, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                          {(['macos', 'linux'] as const).map(os => (
                            <button key={os} onClick={() => setUninstallOS(os)} style={{ minHeight: 28, padding: '0 12px', border: 'none', background: uninstallOS === os ? ink : 'transparent', color: uninstallOS === os ? bg : muted, fontWeight: 800, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', fontFamily: 'inherit' }}>
                              {os === 'macos' ? 'macOS' : 'Linux'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div style={{ background: term, border: `2px solid rgba(240,236,224,0.08)`, borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {UNINSTALL_CMDS[uninstallOS].map((cmd, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ color: coral, fontFamily: 'ui-monospace, monospace', fontSize: '0.74rem', fontWeight: 700, flexShrink: 0 }}>$</span>
                            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.74rem', fontWeight: 600, color: ink, flex: 1, wordBreak: 'break-all' }}>{cmd}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: muted }}>
                          Config at <span style={{ fontFamily: 'ui-monospace, monospace', color: cyan }}>~/.config/amibroke/</span>
                        </span>
                        <TinyBtn onClick={copyUninstall} active={uninstallCopied}>{uninstallCopied ? '✓ Copied' : 'Copy all'}</TinyBtn>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}


          </div>
        )}

        {/* ══════════════════════ LEADERBOARD TAB ══════════════════════ */}
        {tab === 'leaderboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 80 }}>
            {/* Period filter */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {LB_PERIODS.map(({ key, label }) => (
                <button key={key} onClick={() => { setLbPeriod(key); setPage(0); }} style={{ ...periodPill, border: `3px solid ${lbPeriod === key ? ink : 'rgba(240,236,224,0.18)'}`, background: lbPeriod === key ? yellow : 'transparent', color: lbPeriod === key ? bg : muted, boxShadow: lbPeriod === key ? `3px 3px 0 ${ink}` : 'none' }}>
                  {label}
                </button>
              ))}
              {lb && <span style={{ marginLeft: 'auto', fontSize: '0.74rem', fontWeight: 600, color: muted }}>{lb.total} total</span>}
            </div>

            {lbLoading ? (
              <div style={{ color: muted, fontFamily: 'ui-monospace, monospace', fontSize: '0.86rem', padding: '40px 0', textAlign: 'center', fontWeight: 600 }}>Loading...</div>
            ) : lb && lb.leaderboard.length > 0 ? (
              <>
                {!isMobile && (
                  <div style={{ display: 'grid', gridTemplateColumns: '56px minmax(0,1fr) 100px 100px 90px 100px', gap: 12, padding: '10px 18px', borderBottom: `2px solid rgba(240,236,224,0.08)` }}>
                    {['Rank', 'User', 'Input', 'Output', 'Cache', 'Cost'].map(h => (
                      <span key={h} style={{ fontSize: '0.68rem', fontWeight: 900, color: muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
                    ))}
                  </div>
                )}
                {lb.leaderboard.map((entry, i) => {
                  const rank = page * PER_PAGE + i + 1;
                  const isMe = entry.username === username;
                  const lbCols = isMobile ? '40px minmax(0,1fr) 70px' : '56px minmax(0,1fr) 100px 100px 90px 100px';
                  return (
                    <a key={entry.username} href={`/${entry.username}`} style={{ display: 'grid', gridTemplateColumns: lbCols, gap: isMobile ? 8 : 12, alignItems: 'center', padding: isMobile ? '10px 14px' : '12px 18px', border: `3px solid ${isMe ? yellow : ink}`, borderRadius: 18, background: isMe ? `radial-gradient(circle at 12% 50%, rgba(255,242,97,0.1), transparent 45%), ${surface}` : surface, boxShadow: isMe ? `5px 5px 0 ${yellow}` : `4px 4px 0 rgba(240,236,224,0.05)`, textDecoration: 'none' }}>
                      <div style={{ display: 'grid', placeItems: 'center', width: isMobile ? 32 : 42, height: isMobile ? 32 : 42, border: `3px solid ${ink}`, borderRadius: 11, background: RANK_BG[(rank - 1) % RANK_BG.length], color: bg, fontWeight: 900, fontSize: isMobile ? '0.68rem' : '0.82rem', boxShadow: `3px 3px 0 ${ink}` }}>#{rank}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                        <Avatar url={entry.avatarUrl} name={entry.username} size={isMobile ? 22 : 28} border={`2px solid ${isMe ? yellow : ink}`} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: isMobile ? '0.78rem' : '0.88rem', color: isMe ? yellow : ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{entry.username}{isMe ? ' (you)' : ''}</div>
                          {isMobile
                            ? <div style={{ fontSize: '0.62rem', color: muted, fontWeight: 600, marginTop: 1 }}>{fmt(n(entry.totalInputTokens) + n(entry.totalOutputTokens))} tokens</div>
                            : <div style={{ fontSize: '0.68rem', color: muted, fontWeight: 600, marginTop: 1 }}>{fmt(n(entry.totalInputTokens) + n(entry.totalOutputTokens) + n(entry.totalCacheReadTokens))} total tokens</div>
                          }
                        </div>
                      </div>
                      {!isMobile && <Mono>{fmt(entry.totalInputTokens)}</Mono>}
                      {!isMobile && <Mono>{fmt(entry.totalOutputTokens)}</Mono>}
                      {!isMobile && <Mono color={cyan}>{fmt(n(entry.totalCacheReadTokens))}</Mono>}
                      <div style={{ fontWeight: 900, fontSize: isMobile ? '0.92rem' : '1.1rem', color: RANK_BG[(rank - 1) % RANK_BG.length], fontVariantNumeric: 'tabular-nums' }}>{fmtCost(entry.totalCostUsd)}</div>
                    </a>
                  );
                })}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, border: `3px solid ${ink}`, borderRadius: 18, background: surface, padding: '12px 16px', boxShadow: `4px 4px 0 rgba(240,236,224,0.06)` }}>
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ ...pagBtn, opacity: page === 0 ? 0.35 : 1, cursor: page === 0 ? 'not-allowed' : 'pointer' }}>← Prev</button>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                      {buildPageNums(page, totalPages).map((p, idx) =>
                        typeof p === 'number'
                          ? <button key={idx} onClick={() => setPage(p)} style={{ ...pageNumBtn, border: `3px solid ${p === page ? ink : 'rgba(240,236,224,0.18)'}`, background: p === page ? yellow : 'transparent', color: p === page ? bg : muted }}>{p + 1}</button>
                          : <span key={idx} style={{ width: 32, display: 'grid', placeItems: 'center', color: muted, fontSize: '0.82rem' }}>…</span>
                      )}
                    </div>
                    <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{ ...pagBtn, background: page >= totalPages - 1 ? 'transparent' : coral, color: page >= totalPages - 1 ? muted : bg, border: `3px solid ${page >= totalPages - 1 ? 'rgba(240,236,224,0.18)' : ink}`, opacity: page >= totalPages - 1 ? 0.35 : 1, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}>Next →</button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: muted, fontWeight: 600, fontSize: '0.9rem', padding: '48px 0', textAlign: 'center' }}>No data for this period yet.</div>
            )}
          </div>
        )}
      </section>

      {/* ══════════════════════ SHARE MODAL ══════════════════════ */}
      {showShare && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowShare(false); }}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(9,8,6,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 20 }}
        >
          <div style={{ width: '100%', maxWidth: isMobile ? '100%' : 480, border: isMobile ? 'none' : `4px solid ${ink}`, borderTop: `4px solid ${ink}`, borderRadius: isMobile ? '24px 24px 0 0' : 24, background: surface, boxShadow: isMobile ? `0 -8px 0 ${cyan}` : `12px 12px 0 ${cyan}`, overflow: 'hidden' }}>

            {/* drag handle on mobile */}
            {isMobile && (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(240,236,224,0.2)' }} />
              </div>
            )}

            {/* header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '12px 20px 0' : '16px 22px 0' }}>
              <span style={{ fontWeight: 900, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: ink }}>
                Share receipt{savingTheme ? <span style={{ color: muted, fontWeight: 600 }}> · saving…</span> : ''}
              </span>
              <button onClick={() => setShowShare(false)} style={{ width: 30, height: 30, border: `2px solid rgba(240,236,224,0.2)`, borderRadius: 8, background: 'transparent', color: muted, fontWeight: 900, fontSize: '1rem', cursor: 'pointer', display: 'grid', placeItems: 'center', fontFamily: 'inherit' }}>×</button>
            </div>

            <div style={{ padding: isMobile ? '16px 20px 32px' : '20px 22px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Theme picker */}
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                {SHARE_THEMES.map(t => {
                  const active = shareTheme === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => handleThemeChange(t.key)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '10px 10px 8px', border: `3px solid ${active ? ink : 'rgba(240,236,224,0.12)'}`, borderRadius: 16, background: active ? 'rgba(240,236,224,0.05)' : 'transparent', cursor: 'pointer', boxShadow: active ? `4px 4px 0 ${t.accent}` : 'none', flexShrink: 0, minWidth: 68, fontFamily: 'inherit' }}
                    >
                      <div style={{ width: 42, height: 42, borderRadius: 11, background: t.bg, border: `2px solid ${active ? ink : 'rgba(240,236,224,0.18)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, overflow: 'hidden', position: 'relative' }}>
                        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${t.accent}20 1px, transparent 1px), linear-gradient(90deg, ${t.accent}20 1px, transparent 1px)`, backgroundSize: '10px 10px' }} />
                        <div style={{ position: 'relative', fontWeight: 900, fontSize: '0.78rem', color: t.accent }}>A$</div>
                        <div style={{ position: 'relative', width: 20, height: 2, borderRadius: 2, background: t.accent, opacity: 0.6 }} />
                      </div>
                      <span style={{ fontSize: '0.62rem', fontWeight: 800, color: active ? ink : muted, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{t.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => copyText(shareUrl(), 'link')}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 50, border: `3px solid ${ink}`, borderRadius: 14, background: linkCopied ? green : yellow, color: bg, fontWeight: 900, fontSize: '0.88rem', textTransform: 'uppercase', cursor: 'pointer', boxShadow: `5px 5px 0 ${ink}`, letterSpacing: '0.04em', fontFamily: 'inherit' }}
                >
                  {linkCopied ? '✓ Copied!' : '⎘ Copy link'}
                </button>
                <a
                  href={shareUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 50, padding: '0 18px', border: `3px solid rgba(240,236,224,0.2)`, borderRadius: 14, background: 'transparent', color: muted, fontWeight: 900, fontSize: '0.88rem', textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '0.04em', fontFamily: 'inherit', textDecoration: 'none', whiteSpace: 'nowrap' }}
                >
                  ↗ Preview
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── helpers ──────────────────────────────────────────────
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

// ── sub-components ────────────────────────────────────────
function Loading() {
  return <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}><span style={{ color: '#8c8278', fontFamily: 'ui-monospace, monospace', fontSize: '0.9rem', fontWeight: 600 }}>Loading...</span></div>;
}
function Avatar({ url, name, size, border, shadow, radius }: { url: string | null; name: string; size: number; border?: string; shadow?: string; radius?: number }) {
  const r = radius ?? size / 2;
  const st: React.CSSProperties = { width: size, height: size, borderRadius: r, border: border ?? '2px solid #f0ece0', flexShrink: 0, boxShadow: shadow };
  if (url) return <Image src={url} alt={name} width={size} height={size} style={st} unoptimized />;
  return <div style={{ ...st, background: '#fff261', display: 'grid', placeItems: 'center', fontSize: size * 0.35, fontWeight: 900, color: '#0f0d0b' }}>{name[0].toUpperCase()}</div>;
}
function StatCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ border: `3px solid #f0ece0`, borderRadius: 18, background: '#1a1714', padding: '16px', boxShadow: `4px 4px 0 ${color}` }}>
      <div style={{ fontSize: '0.67rem', fontWeight: 900, color: '#8c8278', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 900, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.68rem', color: '#8c8278', fontWeight: 600, marginTop: 5, fontFamily: 'ui-monospace, monospace' }}>{sub}</div>}
    </div>
  );
}
function Pill({ bg: bgColor, text }: { bg: string; text: string }) {
  return <div style={{ display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start', border: `2px solid #f0ece0`, borderRadius: 999, background: bgColor, padding: '5px 11px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#0f0d0b', letterSpacing: '0.06em' }}>{text}</div>;
}
function KeyBox({ value, green: isGreen, wrap, children }: { value: string; green?: boolean; wrap?: boolean; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: wrap ? 'flex-start' : 'center', gap: 7, background: '#090806', border: `2px solid rgba(240,236,224,0.1)`, borderRadius: 12, padding: '10px 13px' }}>
      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.74rem', fontWeight: 600, color: isGreen ? '#5dff9c' : '#8c8278', flex: 1, wordBreak: wrap ? 'break-all' : undefined, overflow: wrap ? undefined : 'hidden', textOverflow: wrap ? undefined : 'ellipsis', whiteSpace: wrap ? undefined : 'nowrap' }}>{value}</span>
      {children}
    </div>
  );
}
function TinyBtn({ onClick, children, active }: { onClick: () => void; children: React.ReactNode; active?: boolean }) {
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 26, padding: '0 8px', border: '2px solid rgba(240,236,224,0.18)', borderRadius: 7, background: active ? '#5dff9c' : 'rgba(240,236,224,0.05)', color: active ? '#0f0d0b' : '#8c8278', fontWeight: 700, fontSize: '0.67rem', textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '0.04em', flexShrink: 0, fontFamily: 'inherit' }}>
      {children}
    </button>
  );
}
function Mono({ children, color, bold }: { children: React.ReactNode; color?: string; bold?: boolean }) {
  return <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.76rem', fontWeight: bold ? 800 : 600, color: color ?? '#8c8278', fontVariantNumeric: 'tabular-nums' }}>{children}</span>;
}
function KVRow({ l, r, rColor }: { l: string; r: string; rColor: string }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#8c8278' }}>{l}</span><span style={{ color: rColor }}>{r}</span></div>;
}

// ── shared styles ─────────────────────────────────────────
const periodPill: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', minHeight: 36, padding: '0 15px', borderRadius: 999, fontWeight: 900, fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s' };
const pagBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 36, padding: '0 14px', border: '3px solid #f0ece0', borderRadius: 12, fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'inherit' };
const pageNumBtn: React.CSSProperties = { width: 34, height: 34, borderRadius: 10, fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' };
