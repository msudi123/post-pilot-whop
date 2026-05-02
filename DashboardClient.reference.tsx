'use client';

import { useState, useEffect, useCallback, CSSProperties } from 'react';
import { POST_SCHEDULE, type ScheduledPost } from '@/lib/schedule';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Settings {
  startDate: string;
  experienceId: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPostTypeBadgeStyle(postType: string): CSSProperties {
  const map: Record<string, CSSProperties> = {
    'Value Drop':        { background: 'rgba(20,83,45,0.55)',   color: '#4ade80', border: '1px solid rgba(22,163,74,0.25)' },
    'Soft Promo':        { background: 'rgba(23,37,84,0.55)',   color: '#60a5fa', border: '1px solid rgba(37,99,235,0.25)' },
    'Mindset / Hook':    { background: 'rgba(46,16,101,0.55)',  color: '#c084fc', border: '1px solid rgba(124,58,237,0.25)' },
    'Mindset':           { background: 'rgba(46,16,101,0.55)',  color: '#c084fc', border: '1px solid rgba(124,58,237,0.25)' },
    'Story':             { background: 'rgba(80,7,36,0.55)',    color: '#f472b6', border: '1px solid rgba(219,39,119,0.25)' },
    'Quick Tip':         { background: 'rgba(8,51,68,0.55)',    color: '#22d3ee', border: '1px solid rgba(6,182,212,0.25)' },
    'FAQ Style':         { background: 'rgba(66,32,6,0.55)',    color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' },
    'Stat / Data':       { background: 'rgba(67,20,7,0.55)',    color: '#fb923c', border: '1px solid rgba(249,115,22,0.25)' },
    'Community Prompt':  { background: 'rgba(4,47,46,0.55)',    color: '#2dd4bf', border: '1px solid rgba(20,184,166,0.25)' },
    'How-To':            { background: 'rgba(26,46,5,0.55)',    color: '#84cc16', border: '1px solid rgba(101,163,13,0.25)' },
    'Direct Promo':      { background: 'rgba(69,10,10,0.55)',   color: '#f87171', border: '1px solid rgba(220,38,38,0.25)' },
    'Myth Bust':         { background: 'rgba(46,16,101,0.55)',  color: '#a78bfa', border: '1px solid rgba(109,40,217,0.25)' },
    'Behind the Scenes': { background: 'rgba(30,41,59,0.55)',   color: '#94a3b8', border: '1px solid rgba(71,85,105,0.25)' },
    'Soft CTA':          { background: 'rgba(66,32,6,0.55)',    color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' },
    'Urgency':           { background: 'rgba(69,10,10,0.65)',   color: '#fb7185', border: '1px solid rgba(225,29,72,0.25)' },
    'Reflection':        { background: 'rgba(17,24,39,0.55)',   color: '#9ca3af', border: '1px solid rgba(75,85,99,0.25)' },
    'Final CTA':         { background: 'rgba(69,10,10,0.75)',   color: '#f87171', border: '1px solid rgba(220,38,38,0.35)' },
  };
  return (
    map[postType] ?? {
      background: 'rgba(17,24,39,0.55)',
      color: '#9ca3af',
      border: '1px solid rgba(75,85,99,0.25)',
    }
  );
}

const DAYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardClient({ companyId }: { companyId: string }) {
  const [settings, setSettings] = useState<Settings>({ startDate: '', experienceId: '' });
  const [draft, setDraft]       = useState<Settings>({ startDate: '', experienceId: '' });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [postedIds, setPostedIds]         = useState<Set<string>>(new Set());
  const [postingIds, setPostingIds]       = useState<Set<string>>(new Set());
  const [previews, setPreviews]           = useState<Record<string, string>>({});
  const [previewLoading, setPreviewLoading] = useState<Set<string>>(new Set());

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeDay, setActiveDay] = useState<number | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const getActiveCompanyId = useCallback(() => {
    if (companyId) return companyId;
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const dashboardIndex = pathParts.indexOf('dashboard');
    return dashboardIndex >= 0 ? pathParts[dashboardIndex + 1] ?? '' : '';
  }, [companyId]);

  // ── Load settings from localStorage ────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem('postpilot-settings');
      if (raw) {
        const parsed = JSON.parse(raw) as Settings;
        setSettings(parsed);
        setDraft(parsed);
      }
    } catch {}
  }, []);

  // ── Fetch posted post IDs from Supabase ─────────────────────────────────────
  const fetchPosted = useCallback(async () => {
    try {
      const activeCompanyId = getActiveCompanyId();
      if (!activeCompanyId) {
        addToast('Unable to find company ID in the Whop URL', 'error');
        return;
      }

      const res = await fetch(`/api/post-log?companyId=${encodeURIComponent(activeCompanyId)}`);
      const data = await res.json();

      if (data.success) {
        setPostedIds(new Set(data.postIds));
      } else {
        addToast(data.error ?? 'Failed to load posted status', 'error');
      }
    } catch {
      addToast('Network error while loading posted status', 'error');
    }
  }, [addToast, getActiveCompanyId]);

  useEffect(() => {
    fetchPosted();
  }, [fetchPosted]);

  // ── Save settings ────────────────────────────────────────────────────────────
  const saveSettings = () => {
    localStorage.setItem('postpilot-settings', JSON.stringify(draft));
    setSettings(draft);
    setSettingsOpen(false);
    addToast('Settings saved', 'success');
  };

  // ── Post Now ─────────────────────────────────────────────────────────────────
  const handlePostNow = async (post: ScheduledPost) => {
    const activeCompanyId = getActiveCompanyId();

    setPostingIds((prev) => new Set(prev).add(post.id));
    try {
      const res = await fetch('/api/post-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          experienceId: settings.experienceId,
          companyId: activeCompanyId,
          content: previews[post.id],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPostedIds((prev) => new Set(prev).add(post.id));
        addToast('Post published to Whop!', 'success');
      } else {
        addToast(data.error ?? 'Failed to post', 'error');
      }
    } catch {
      addToast('Network error — check the console', 'error');
    } finally {
      setPostingIds((prev) => {
        const s = new Set(prev);
        s.delete(post.id);
        return s;
      });
    }
  };

  // ── AI Preview ───────────────────────────────────────────────────────────────
  const handlePreview = async (post: ScheduledPost) => {
    const activeCompanyId = getActiveCompanyId();
    setPreviewLoading((prev) => new Set(prev).add(post.id));
    try {
      const res = await fetch('/api/preview-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, companyId: activeCompanyId }),
      });
      const data = await res.json();
      if (data.success) {
        setPreviews((prev) => ({ ...prev, [post.id]: data.content }));
        addToast('AI preview ready', 'success');
      } else {
        addToast(data.error ?? 'Preview failed', 'error');
      }
    } catch {
      addToast('Network error — check the console', 'error');
    } finally {
      setPreviewLoading((prev) => {
        const s = new Set(prev);
        s.delete(post.id);
        return s;
      });
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const filteredPosts =
    activeDay === 'all'
      ? POST_SCHEDULE
      : POST_SCHEDULE.filter((p) => p.day === activeDay);

  const postedCount = postedIds.size;
  const progressPct = Math.round((postedCount / 20) * 100);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#080808', minHeight: '100vh', color: '#F0F0F0', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header
        style={{
          background: '#111111',
          borderBottom: '1px solid #222222',
          padding: '0 24px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>
            ⚡ PostPilot
          </span>
          <span
            style={{
              background: '#1a1a1a',
              color: '#777777',
              fontSize: 12,
              fontWeight: 500,
              padding: '2px 10px',
              borderRadius: 999,
              border: '1px solid #2a2a2a',
            }}
          >
            Posted {postedCount}/20
          </span>
        </div>

        <button
          onClick={() => setSettingsOpen((o) => !o)}
          title="Settings"
          style={{
            background: settingsOpen ? '#222222' : 'transparent',
            border: '1px solid #2a2a2a',
            color: settingsOpen ? '#F0F0F0' : '#666666',
            borderRadius: 8,
            width: 36,
            height: 36,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 17,
            transition: 'all 0.15s',
          }}
        >
          ⚙
        </button>
      </header>

      {/* ── SETTINGS PANEL ────────────────────────────────────────────────── */}
      {settingsOpen && (
        <div
          style={{
            background: '#0e0e0e',
            borderBottom: '1px solid #222222',
            padding: '20px 24px',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
              Settings
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14,
                marginBottom: 16,
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 6, fontWeight: 500 }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={draft.startDate}
                  onChange={(e) => setDraft((s) => ({ ...s, startDate: e.target.value }))}
                  style={{
                    width: '100%',
                    background: '#161616',
                    border: '1px solid #2a2a2a',
                    borderRadius: 8,
                    padding: '9px 12px',
                    color: '#F0F0F0',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 6, fontWeight: 500 }}>
                  Forum Experience ID (optional)
                </label>
                <input
                  type="text"
                  value={draft.experienceId}
                  onChange={(e) => setDraft((s) => ({ ...s, experienceId: e.target.value }))}
                  placeholder="Leave blank for public forum"
                  style={{
                    width: '100%',
                    background: '#161616',
                    border: '1px solid #2a2a2a',
                    borderRadius: 8,
                    padding: '9px 12px',
                    color: '#F0F0F0',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
            </div>
            <button
              onClick={saveSettings}
              style={{
                background: '#FF5C1A',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 24px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: 0.2,
              }}
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* ── BODY ──────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '24px 20px 60px' }}>

        {/* Stats Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10,
            marginBottom: 20,
          }}
        >
          {[
            { label: 'Total Posts', value: 20 },
            { label: 'Posted',      value: postedCount },
            { label: 'Remaining',   value: 20 - postedCount },
            { label: 'Days',        value: 10 },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: '#161616',
                border: '1px solid #222222',
                borderRadius: 12,
                padding: '16px 18px',
              }}
            >
              <div style={{ fontSize: 30, fontWeight: 800, color: '#F0F0F0', lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 6, fontWeight: 500 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Progress
            </span>
            <span style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>
              {progressPct}%
            </span>
          </div>
          <div
            style={{
              background: '#1a1a1a',
              borderRadius: 999,
              height: 7,
              overflow: 'hidden',
              border: '1px solid #222',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 999,
                background: 'linear-gradient(90deg, #FF5C1A 0%, #F59E0B 100%)',
                width: `${progressPct}%`,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>

        {/* Day Filter Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {(['all', ...DAYS] as const).map((day) => {
            const active = activeDay === day;
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                style={{
                  padding: '5px 14px',
                  borderRadius: 999,
                  border: `1px solid ${active ? '#FF5C1A' : '#222222'}`,
                  background: active ? '#FF5C1A' : 'transparent',
                  color: active ? '#fff' : '#666666',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
              >
                {day === 'all' ? 'All' : `Day ${day}`}
              </button>
            );
          })}
        </div>

        {/* Post List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filteredPosts.map((post) => {
            const isPosted   = postedIds.has(post.id);
            const isPosting  = postingIds.has(post.id);
            const isExpanded = expandedId === post.id;
            const preview    = previews[post.id];
            const isLoadingPreview = previewLoading.has(post.id);
            const firstLine  = post.copy.split('\n').find((l) => l.trim()) ?? post.copy;

            return (
              <PostCard
                key={post.id}
                post={post}
                isPosted={isPosted}
                isPosting={isPosting}
                isExpanded={isExpanded}
                preview={preview}
                isLoadingPreview={isLoadingPreview}
                firstLine={firstLine}
                onToggle={() => setExpandedId(isExpanded ? null : post.id)}
                onPostNow={() => handlePostNow(post)}
                onPreview={() => handlePreview(post)}
              />
            );
          })}
        </div>
      </div>

      {/* ── TOAST NOTIFICATIONS ───────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="toast-enter"
            style={{
              background: toast.type === 'success' ? '#0a2016' : '#200a0a',
              border: `1px solid ${toast.type === 'success' ? '#16a34a' : '#dc2626'}`,
              color: toast.type === 'success' ? '#22C55E' : '#ef4444',
              padding: '11px 22px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              whiteSpace: 'nowrap',
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PostCard sub-component ────────────────────────────────────────────────────

interface PostCardProps {
  post: ScheduledPost;
  isPosted: boolean;
  isPosting: boolean;
  isExpanded: boolean;
  preview?: string;
  isLoadingPreview: boolean;
  firstLine: string;
  onToggle: () => void;
  onPostNow: () => void;
  onPreview: () => void;
}

function PostCard({
  post,
  isPosted,
  isPosting,
  isExpanded,
  preview,
  isLoadingPreview,
  firstLine,
  onToggle,
  onPostNow,
  onPreview,
}: PostCardProps) {
  const statusLabel = isPosting ? '⟳ Posting…' : isPosted ? '✓ Posted' : '◷ Scheduled';
  const statusStyle: CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 999,
    whiteSpace: 'nowrap',
    ...(isPosting
      ? { background: '#0e1d30', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.3)' }
      : isPosted
      ? { background: '#071a10', color: '#22C55E', border: '1px solid rgba(22,163,74,0.3)' }
      : { background: '#161616', color: '#555555', border: '1px solid #222222' }),
  };

  return (
    <div
      style={{
        background: '#161616',
        border: `1px solid ${isPosted ? 'rgba(22,163,74,0.2)' : '#222222'}`,
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {/* ── Collapsed row ─────────────────────────────────────────────────── */}
      <div
        onClick={onToggle}
        style={{
          padding: '13px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          userSelect: 'none',
        }}
      >
        {/* Day number */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: '#FF5C1A',
            minWidth: 26,
            textAlign: 'center',
            lineHeight: 1,
          }}
        >
          {post.day}
        </div>

        {/* Slot badge */}
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 999,
            letterSpacing: 0.5,
            ...(post.slot === 'AM'
              ? { background: '#0f2040', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.3)' }
              : { background: '#1a0f3a', color: '#a78bfa', border: '1px solid rgba(109,40,217,0.3)' }),
          }}
        >
          {post.slot}
        </span>

        {/* Post type badge */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 9px',
            borderRadius: 6,
            ...getPostTypeBadgeStyle(post.postType),
          }}
        >
          {post.postType}
        </span>

        {/* First line preview */}
        <span
          style={{
            flex: 1,
            fontSize: 13,
            color: '#777',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {firstLine}
        </span>

        {/* Status */}
        <span style={statusStyle}>{statusLabel}</span>

        {/* Chevron */}
        <span
          style={{
            color: '#333',
            fontSize: 11,
            display: 'inline-block',
            transition: 'transform 0.2s',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
      </div>

      {/* ── Expanded content ──────────────────────────────────────────────── */}
      {isExpanded && (
        <div style={{ borderTop: '1px solid #1e1e1e', padding: '18px 16px' }}>
          {/* Copy label */}
          <div style={{ fontSize: 10, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            {preview ? 'AI Preview' : 'Draft Copy'}
          </div>

          {/* Copy text */}
          <div
            style={{
              background: '#111111',
              borderRadius: 8,
              padding: '14px 16px',
              fontSize: 14,
              color: '#DDDDDD',
              lineHeight: 1.75,
              whiteSpace: 'pre-wrap',
              border: '1px solid #1c1c1c',
              marginBottom: 16,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            {preview ?? post.copy}
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 18, flexWrap: 'wrap' }}>
            <MetaItem label="Goal" value={post.goal} />
            <MetaItem label="CTA" value={post.cta} />
            <MetaItem label="Best Time" value={`${post.bestTime} UTC`} />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={onPostNow}
              disabled={isPosted || isPosting}
              style={{
                background: isPosted ? '#0a1f0a' : '#FF5C1A',
                color: isPosted ? '#22C55E' : '#fff',
                border: isPosted ? '1px solid rgba(22,163,74,0.3)' : 'none',
                borderRadius: 8,
                padding: '9px 22px',
                fontSize: 13,
                fontWeight: 700,
                cursor: isPosted || isPosting ? 'not-allowed' : 'pointer',
                opacity: isPosting ? 0.65 : 1,
                transition: 'all 0.15s',
                letterSpacing: 0.1,
              }}
            >
              {isPosting ? 'Posting…' : isPosted ? '✓ Posted' : 'Post Now'}
            </button>

            <button
              onClick={onPreview}
              disabled={isLoadingPreview}
              style={{
                background: 'transparent',
                color: isLoadingPreview ? '#888' : '#F59E0B',
                border: `1px solid ${isLoadingPreview ? '#333' : '#F59E0B'}`,
                borderRadius: 8,
                padding: '9px 22px',
                fontSize: 13,
                fontWeight: 700,
                cursor: isLoadingPreview ? 'not-allowed' : 'pointer',
                opacity: isLoadingPreview ? 0.6 : 1,
                transition: 'all 0.15s',
                letterSpacing: 0.1,
              }}
            >
              {isLoadingPreview ? 'Generating…' : preview ? '↻ Regenerate AI' : '✦ AI Preview'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: '#888' }}>{value}</div>
    </div>
  );
}
