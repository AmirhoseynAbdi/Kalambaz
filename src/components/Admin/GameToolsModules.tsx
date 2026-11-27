import React, { useEffect, useState } from 'react';
import {
  Bell,
  Send,
  Gift,
  Sprout,
  Megaphone,
  ExternalLink,
  Check,
  Search,
} from 'lucide-react';
import {
  AdminPushStats,
  AdminReferralsData,
  SiteAnnouncement,
  adminApi,
} from '../../utils/adminApi';
import { AdminLang, AdminStrings, formatNum } from './adminI18n';

// ============================================================
// 1. WEB PUSH BROADCAST & SUBSCRIBERS MODULE
// ============================================================
interface PushModuleProps {
  token: string;
  stats: AdminPushStats | null;
  loading: boolean;
  darkMode: boolean;
  lang: AdminLang;
  t: AdminStrings;
  onRefresh: () => Promise<void>;
  onNotify: (msg: string, isError?: boolean) => void;
}

export const PushModule: React.FC<PushModuleProps> = ({
  token,
  stats,
  loading,
  darkMode,
  lang,
  t,
  onRefresh,
  onNotify,
}) => {
  const [forceAll, setForceAll] = useState(true);
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{
    totalChecked: number;
    sent: number;
    pruned: number;
    failed: number;
  } | null>(null);

  const cardBg = darkMode ? 'bg-[#141923]' : 'bg-white';
  const subBg = darkMode ? 'bg-[#1b2230]' : 'bg-[#f1f5f9]';
  const mutedText = darkMode ? 'text-slate-400' : 'text-slate-500';
  const headingText = darkMode ? 'text-white' : 'text-slate-900';

  const handleBroadcast = async () => {
    setSending(true);
    try {
      const res = await adminApi.sendPushBroadcast(token, forceAll);
      setLastResult(res);
      await onRefresh();
      onNotify(
        lang === 'fa'
          ? `ارسال اعلان انجام شد: ${formatNum(res.sent, lang)} موفق، ${formatNum(res.pruned, lang)} منقضی حذف شد.`
          : `Broadcast done: ${res.sent} sent, ${res.pruned} pruned, ${res.failed} failed.`
      );
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Broadcast failed.', true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className={`text-xl font-black tracking-tight flex items-center gap-2 ${headingText}`}>
          <Bell className="w-5 h-5 text-purple-400" />
          <span>{t.pushTitle}</span>
        </h2>
        <p className={`text-xs mt-1 ${mutedText}`}>{t.pushSubtitle}</p>
      </div>

      {loading && !stats ? (
        <div className={`rounded-2xl p-8 text-center text-sm ${cardBg} ${mutedText}`}>
          {t.loading}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {[
              { label: t.kpiPushSubscribers, val: stats?.totalSubscriptions || 0, color: 'text-purple-400' },
              { label: t.linkedDevices, val: stats?.linkedUsersCount || 0, color: 'text-emerald-500' },
              { label: t.guestDevices, val: stats?.guestDevicesCount || 0, color: 'text-sky-400' },
              { label: t.pushedToday, val: stats?.pushedTodayCount || 0, color: 'text-amber-500' },
            ].map((item) => (
              <div key={item.label} className={`rounded-2xl p-4 ${cardBg}`}>
                <div className={`text-xs font-semibold mb-2 ${mutedText}`}>{item.label}</div>
                <div className={`text-2xl font-black tabular-nums ${item.color}`}>
                  {formatNum(item.val, lang)}
                </div>
              </div>
            ))}
          </div>

          <div className={`rounded-2xl p-5 space-y-4 ${cardBg}`}>
            <button
              type="button"
              onClick={() => setForceAll((v) => !v)}
              className={`inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                forceAll
                  ? 'bg-purple-500/15 text-purple-400'
                  : `${subBg} ${mutedText}`
              }`}
            >
              <span
                className={`w-4 h-4 rounded-md flex items-center justify-center ${
                  forceAll ? 'bg-purple-500 text-white' : darkMode ? 'bg-slate-700' : 'bg-slate-300'
                }`}
              >
                {forceAll && <Check className="w-3 h-3" />}
              </span>
              <span>{t.forceAllLabel}</span>
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={sending}
                onClick={handleBroadcast}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? t.loading : t.sendBroadcastBtn}</span>
              </button>

              {lastResult && (
                <div className={`text-xs font-bold tabular-nums px-3.5 py-2 rounded-xl ${subBg} ${headingText}`}>
                  Checked: {formatNum(lastResult.totalChecked, lang)} · Sent:{' '}
                  <span className="text-emerald-500">{formatNum(lastResult.sent, lang)}</span> · Pruned:{' '}
                  <span className="text-amber-500">{formatNum(lastResult.pruned, lang)}</span> · Failed:{' '}
                  <span className="text-rose-500">{formatNum(lastResult.failed, lang)}</span>
                </div>
              )}
            </div>
          </div>

          <div className={`rounded-2xl overflow-hidden ${cardBg}`}>
            <div className={`px-4 py-3 text-xs font-bold ${darkMode ? 'bg-[#1a202d] text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
              {t.recentDevicesTitle}
            </div>
            {!stats || stats.recentSubscriptions.length === 0 ? (
              <div className={`p-6 text-center text-sm ${mutedText}`}>{t.noData}</div>
            ) : (
              <div className="divide-y divide-slate-500/10">
                {stats.recentSubscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${headingText}`}>{sub.username || 'Guest'}</span>
                      <span className={`font-mono ${mutedText}`}>{sub.host}</span>
                    </div>
                    <span className={`font-mono ${mutedText}`}>
                      {sub.lastPushedDate || '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================
// 2. REFERRALS TRACKING & LEADERBOARD MODULE
// ============================================================
interface ReferralsModuleProps {
  data: AdminReferralsData | null;
  loading: boolean;
  darkMode: boolean;
  lang: AdminLang;
  t: AdminStrings;
}

export const ReferralsModule: React.FC<ReferralsModuleProps> = ({
  data,
  loading,
  darkMode,
  lang,
  t,
}) => {
  const [query, setQuery] = useState('');
  const cardBg = darkMode ? 'bg-[#141923]' : 'bg-white';
  const inputBg = darkMode
    ? 'bg-[#1b2230] text-white placeholder-slate-500'
    : 'bg-[#f1f5f9] text-slate-900 placeholder-slate-400';
  const mutedText = darkMode ? 'text-slate-400' : 'text-slate-500';
  const headingText = darkMode ? 'text-white' : 'text-slate-900';

  const q = query.trim().toLowerCase();
  const filteredRecent = (data?.recent || []).filter(
    (r) =>
      !q ||
      r.referrerUsername.toLowerCase().includes(q) ||
      r.inviteeUsername.toLowerCase().includes(q)
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className={`text-xl font-black tracking-tight flex items-center gap-2 ${headingText}`}>
          <Gift className="w-5 h-5 text-pink-400" />
          <span>{t.referralsTitle}</span>
        </h2>
        <p className={`text-xs mt-1 ${mutedText}`}>{t.referralsSubtitle}</p>
      </div>

      {loading && !data ? (
        <div className={`rounded-2xl p-8 text-center text-sm ${cardBg} ${mutedText}`}>
          {t.loading}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className={`rounded-2xl p-5 ${cardBg}`}>
              <div className={`text-xs font-semibold mb-2 ${mutedText}`}>{t.totalReferralsCount}</div>
              <div className={`text-3xl font-black tabular-nums ${headingText}`}>
                {formatNum(data?.totalReferrals || 0, lang)}
              </div>
            </div>
            <div className={`rounded-2xl p-5 ${cardBg}`}>
              <div className={`text-xs font-semibold mb-2 ${mutedText}`}>{t.totalRewardSeeds}</div>
              <div className="text-3xl font-black tabular-nums text-emerald-500 flex items-center gap-2">
                <Sprout className="w-6 h-6" />
                <span>{formatNum(data?.totalRewardSeeds || 0, lang)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Leaderboard */}
            <div className={`rounded-2xl overflow-hidden ${cardBg}`}>
              <div className={`px-4 py-3 text-xs font-bold ${darkMode ? 'bg-[#1a202d] text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                {t.leaderboardTitle}
              </div>
              {!data || data.leaderboard.length === 0 ? (
                <div className={`p-6 text-center text-sm ${mutedText}`}>{t.noData}</div>
              ) : (
                <div className="divide-y divide-slate-500/10">
                  {data.leaderboard.map((row, idx) => (
                    <div
                      key={row.username}
                      className="px-4 py-3 flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black tabular-nums ${
                            idx === 0
                              ? 'bg-amber-500/20 text-amber-400'
                              : idx === 1
                                ? 'bg-slate-400/20 text-slate-300'
                                : 'bg-slate-500/15 text-slate-400'
                          }`}
                        >
                          {formatNum(idx + 1, lang)}
                        </span>
                        <span className={`font-bold ${headingText}`}>{row.username}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold tabular-nums">
                        <span className={mutedText}>{formatNum(row.referralsCount, lang)}×</span>
                        <span className="text-emerald-500">
                          +{formatNum(row.totalRewardSeeds, lang)} 🌱
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Audit Log */}
            <div className={`rounded-2xl overflow-hidden ${cardBg}`}>
              <div className={`px-4 py-2.5 flex items-center justify-between gap-2 ${darkMode ? 'bg-[#1a202d]' : 'bg-slate-100'}`}>
                <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {t.recentReferralsTitle}
                </span>
                <div className="relative w-44">
                  <Search
                    className={`w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 ${
                      lang === 'fa' ? 'right-2.5' : 'left-2.5'
                    } ${mutedText}`}
                  />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t.searchUsersPlaceholder}
                    className={`w-full py-1.5 rounded-lg text-[11px] outline-none ${
                      lang === 'fa' ? 'pr-7 pl-2' : 'pl-7 pr-2'
                    } ${inputBg}`}
                  />
                </div>
              </div>
              {filteredRecent.length === 0 ? (
                <div className={`p-6 text-center text-sm ${mutedText}`}>{t.noData}</div>
              ) : (
                <div className="divide-y divide-slate-500/10 max-h-[380px] overflow-y-auto">
                  {filteredRecent.map((item) => (
                    <div
                      key={`${item.referrerUsername}-${item.inviteeUsername}`}
                      className="px-4 py-2.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-bold ${headingText}`}>{item.referrerUsername}</span>
                        <span className={mutedText}>→</span>
                        <span className="font-semibold text-emerald-500">{item.inviteeUsername}</span>
                      </div>
                      <span className={`font-mono text-[11px] ${mutedText}`}>
                        {(item.createdAt || '').slice(0, 10)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================
// 3. IN-GAME ANNOUNCEMENT BANNER EDITOR
// ============================================================
interface AnnouncementsModuleProps {
  token: string;
  initial: SiteAnnouncement | null;
  darkMode: boolean;
  lang: AdminLang;
  t: AdminStrings;
  onSaved: (next: SiteAnnouncement) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

const TONE_PREVIEW_STYLES: Record<
  SiteAnnouncement['tone'],
  { dark: string; light: string; swatch: string }
> = {
  emerald: {
    dark: 'bg-emerald-500/20 text-emerald-200',
    light: 'bg-emerald-100 text-emerald-900',
    swatch: 'bg-emerald-500',
  },
  purple: {
    dark: 'bg-purple-500/20 text-purple-200',
    light: 'bg-purple-100 text-purple-900',
    swatch: 'bg-purple-500',
  },
  amber: {
    dark: 'bg-amber-500/20 text-amber-200',
    light: 'bg-amber-100 text-amber-900',
    swatch: 'bg-amber-500',
  },
  sky: {
    dark: 'bg-sky-500/20 text-sky-200',
    light: 'bg-sky-100 text-sky-900',
    swatch: 'bg-sky-500',
  },
};

export const AnnouncementsModule: React.FC<AnnouncementsModuleProps> = ({
  token,
  initial,
  darkMode,
  lang,
  t,
  onSaved,
  onNotify,
}) => {
  const [enabled, setEnabled] = useState(Boolean(initial?.enabled));
  const [message, setMessage] = useState(initial?.message || '');
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl || '');
  const [tone, setTone] = useState<SiteAnnouncement['tone']>(initial?.tone || 'emerald');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setEnabled(Boolean(initial.enabled));
      setMessage(initial.message || '');
      setLinkUrl(initial.linkUrl || '');
      setTone(initial.tone || 'emerald');
    }
  }, [initial]);

  const cardBg = darkMode ? 'bg-[#141923]' : 'bg-white';
  const inputBg = darkMode
    ? 'bg-[#1b2230] text-white placeholder-slate-500'
    : 'bg-[#f1f5f9] text-slate-900 placeholder-slate-400';
  const mutedText = darkMode ? 'text-slate-400' : 'text-slate-500';
  const headingText = darkMode ? 'text-white' : 'text-slate-900';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminApi.updateAnnouncement(token, {
        enabled,
        message: message.trim(),
        linkUrl: linkUrl.trim(),
        tone,
      });
      onSaved(res.announcement);
      onNotify(lang === 'fa' ? 'تنظیمات بنر اطلاع‌رسانی ذخیره شد!' : 'Announcement banner updated!');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to save banner.', true);
    } finally {
      setSaving(false);
    }
  };

  const previewToneCls = darkMode
    ? TONE_PREVIEW_STYLES[tone].dark
    : TONE_PREVIEW_STYLES[tone].light;

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h2 className={`text-xl font-black tracking-tight flex items-center gap-2 ${headingText}`}>
          <Megaphone className="w-5 h-5 text-amber-400" />
          <span>{t.announcementTitle}</span>
        </h2>
        <p className={`text-xs mt-1 ${mutedText}`}>{t.announcementSubtitle}</p>
      </div>

      <form onSubmit={handleSave} className={`rounded-2xl p-5 space-y-4 ${cardBg}`}>
        {/* Enable Toggle */}
        <button
          type="button"
          onClick={() => setEnabled((v) => !v)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
            enabled
              ? 'bg-emerald-500/20 text-emerald-400'
              : darkMode
                ? 'bg-[#1b2230] text-slate-300'
                : 'bg-slate-100 text-slate-700'
          }`}
        >
          <span>{t.enableBannerLabel}</span>
          <span
            className={`w-10 h-6 rounded-full p-0.5 transition-colors flex items-center ${
              enabled ? 'bg-emerald-500 justify-end' : 'bg-slate-500/50 justify-start'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
          </span>
        </button>

        {/* Message */}
        <div>
          <label className={`block text-xs font-bold mb-1.5 ${mutedText}`}>
            {t.bannerMessageLabel}
          </label>
          <textarea
            rows={3}
            maxLength={280}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.bannerMessagePlaceholder}
            className={`w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none ${inputBg}`}
          />
          <div className={`text-[11px] text-end mt-1 tabular-nums ${mutedText}`}>
            {formatNum(Array.from(message).length, lang)} / {formatNum(280, lang)}
          </div>
        </div>

        {/* Optional Link */}
        <div>
          <label className={`block text-xs font-bold mb-1.5 ${mutedText}`}>
            {t.bannerLinkLabel}
          </label>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder={t.bannerLinkPlaceholder}
            dir="ltr"
            className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono outline-none ${inputBg}`}
          />
        </div>

        {/* Tone Selector */}
        <div>
          <label className={`block text-xs font-bold mb-2 ${mutedText}`}>{t.bannerToneLabel}</label>
          <div className="flex flex-wrap gap-2">
            {(['emerald', 'purple', 'amber', 'sky'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setTone(k)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                  tone === k
                    ? `${TONE_PREVIEW_STYLES[k].swatch} text-white`
                    : darkMode
                      ? 'bg-[#1b2230] text-slate-300'
                      : 'bg-slate-100 text-slate-700'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${tone === k ? 'bg-white' : TONE_PREVIEW_STYLES[k].swatch}`} />
                <span>{k}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview */}
        <div className="pt-2">
          <div className={`text-xs font-bold mb-2 ${mutedText}`}>{t.livePreviewLabel}</div>
          <div className={`rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs font-bold ${previewToneCls}`}>
            <div className="flex items-center gap-2 min-w-0">
              <Megaphone className="w-4 h-4 shrink-0" />
              <span className="truncate">{message.trim() || t.bannerMessagePlaceholder}</span>
            </div>
            {linkUrl.trim() && (
              <span className="inline-flex items-center gap-1 shrink-0 underline">
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white transition-colors"
        >
          {saving ? t.saving : t.saveBannerBtn}
        </button>
      </form>
    </div>
  );
};
