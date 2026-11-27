import React from 'react';
import {
  Users,
  Activity,
  Trophy,
  Sprout,
  Bell,
  Gift,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Megaphone,
  CalendarDays,
} from 'lucide-react';
import { AdminOverviewData } from '../../utils/adminApi';
import { DAILY_WORDS } from '../../data/wordLists';
import { getDailyWord } from '../../game/wordleLogic';
import { AdminLang, AdminSection, AdminStrings, formatNum } from './adminI18n';

interface OverviewModuleProps {
  data: AdminOverviewData | null;
  loading: boolean;
  darkMode: boolean;
  lang: AdminLang;
  t: AdminStrings;
  onNavigate: (section: AdminSection) => void;
}

export const OverviewModule: React.FC<OverviewModuleProps> = ({
  data,
  loading,
  darkMode,
  lang,
  t,
  onNavigate,
}) => {
  const cardBg = darkMode ? 'bg-[#141923]' : 'bg-white';
  const subCardBg = darkMode ? 'bg-[#1b2230]' : 'bg-[#f1f5f9]';
  const mutedText = darkMode ? 'text-slate-400' : 'text-slate-500';
  const headingText = darkMode ? 'text-white' : 'text-slate-900';

  if (loading && !data) {
    return (
      <div className={`rounded-2xl p-8 text-center ${cardBg} ${mutedText}`}>
        {t.loading}
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`rounded-2xl p-8 text-center ${cardBg} ${mutedText}`}>
        {t.noData}
      </div>
    );
  }

  const kpiCards = [
    {
      label: t.kpiTotalUsers,
      value: formatNum(data.kpis.totalUsers, lang),
      icon: Users,
      tint: darkMode ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-700',
    },
    {
      label: t.kpiActiveToday,
      value: formatNum(data.kpis.activeToday, lang),
      icon: Activity,
      tint: darkMode ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-100 text-sky-700',
    },
    {
      label: t.kpiWinRate,
      value: `${formatNum(data.kpis.winRate, lang)}%`,
      icon: Trophy,
      tint: darkMode ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-100 text-amber-700',
    },
    {
      label: t.kpiTotalSeeds,
      value: formatNum(data.kpis.totalSeeds, lang),
      icon: Sprout,
      tint: darkMode ? 'bg-lime-500/15 text-lime-400' : 'bg-lime-100 text-lime-700',
    },
    {
      label: t.kpiPushSubscribers,
      value: formatNum(data.kpis.pushSubscribers, lang),
      icon: Bell,
      tint: darkMode ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-100 text-purple-700',
    },
    {
      label: t.kpiReferrals,
      value: formatNum(data.kpis.totalReferrals, lang),
      icon: Gift,
      tint: darkMode ? 'bg-pink-500/15 text-pink-400' : 'bg-pink-100 text-pink-700',
    },
    {
      label: t.kpiSocialSent,
      value: formatNum(data.kpis.socialPostsSent, lang),
      icon: Send,
      tint: darkMode ? 'bg-teal-500/15 text-teal-400' : 'bg-teal-100 text-teal-700',
    },
    {
      label: t.kpiScheduledPosts,
      value: formatNum(data.kpis.scheduledPostsCount, lang),
      icon: Clock,
      tint: darkMode ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-100 text-indigo-700',
    },
  ];

  const maxChartValue = Math.max(
    1,
    ...data.activitySeries.map((pt) => Math.max(pt.signups, pt.activePlayers))
  );

  // Enrich defaultWord via deterministic client logic if PHP omitted full word list
  const resolvedTodayWords = data.todayWords.map((item) => {
    const defWord =
      item.defaultWord || getDailyWord(data.todayTehran, item.length, DAILY_WORDS[item.length]).word;
    const effectiveWord = item.word || defWord;
    return {
      ...item,
      defaultWord: defWord,
      word: effectiveWord,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={`text-xl font-black tracking-tight ${headingText}`}>
            {t.overviewTitle}
          </h2>
          <p className={`text-xs mt-1 ${mutedText}`}>
            {t.tehranToday}: <span className="font-mono font-semibold">{data.todayTehran}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('social')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t.nav.social}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('users')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              darkMode
                ? 'bg-[#1f2737] hover:bg-[#283246] text-slate-100'
                : 'bg-slate-200/80 hover:bg-slate-300/80 text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t.nav.users}</span>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`rounded-2xl p-4 ${cardBg}`}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className={`text-xs font-semibold ${mutedText}`}>{card.label}</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.tint}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-2xl font-black tabular-nums ${headingText}`}>
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Chart + Today's Words */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 14-day Bar Chart */}
        <div className={`lg:col-span-2 rounded-2xl p-5 ${cardBg}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <h3 className={`text-sm font-bold ${headingText}`}>{t.activityChartTitle}</h3>
            <div className="flex items-center gap-4 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1.5 text-emerald-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                {t.activePlayersLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 text-purple-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                {t.signupsLabel}
              </span>
            </div>
          </div>

          <div className="h-44 flex items-end gap-1.5 sm:gap-2">
            {data.activitySeries.map((pt) => {
              const activeH = Math.max(4, Math.round((pt.activePlayers / maxChartValue) * 100));
              const signupH = Math.max(4, Math.round((pt.signups / maxChartValue) * 100));
              const shortDay = pt.date.slice(5);
              return (
                <div
                  key={pt.date}
                  className="flex-1 flex flex-col items-center justify-end h-full group"
                  title={`${pt.date} — ${t.activePlayersLabel}: ${pt.activePlayers}, ${t.signupsLabel}: ${pt.signups}`}
                >
                  <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-36">
                    <div
                      className="w-1/2 max-w-[12px] rounded-t-md bg-emerald-500/85 group-hover:bg-emerald-400 transition-all"
                      style={{ height: `${pt.activePlayers > 0 ? activeH : 4}%` }}
                    />
                    <div
                      className="w-1/2 max-w-[12px] rounded-t-md bg-purple-500/85 group-hover:bg-purple-400 transition-all"
                      style={{ height: `${pt.signups > 0 ? signupH : 4}%` }}
                    />
                  </div>
                  <span className={`text-[9px] font-mono mt-2 ${mutedText}`}>
                    {shortDay.slice(3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's 4/5/6 Words + Channels */}
        <div className="space-y-4">
          <div className={`rounded-2xl p-5 ${cardBg}`}>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className={`text-sm font-bold flex items-center gap-2 ${headingText}`}>
                <CalendarDays className="w-4 h-4 text-emerald-500" />
                <span>{t.todayWordsTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('dailyWords')}
                className="text-[11px] font-bold text-emerald-500 hover:text-emerald-400"
              >
                {t.edit}
              </button>
            </div>
            <div className="space-y-2.5">
              {resolvedTodayWords.map((w) => (
                <div
                  key={w.length}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl ${subCardBg}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${mutedText}`}>
                      {formatNum(w.length, lang)} {t.lettersUnit}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        w.isOverridden
                          ? 'bg-purple-500/20 text-purple-400'
                          : darkMode
                            ? 'bg-slate-700/70 text-slate-300'
                            : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {w.isOverridden ? t.overrideTag : t.defaultTag}
                    </span>
                  </div>
                  <span className={`text-base font-black tracking-wide ${headingText}`}>
                    {w.word}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-2xl p-5 ${cardBg}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-bold flex items-center gap-2 ${headingText}`}>
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>{t.channelsReadinessTitle}</span>
              </h3>
            </div>
            <div className="space-y-2">
              {[
                {
                  name: data.channels.telegramChat1Label
                    ? `Telegram 1 (${data.channels.telegramChat1Label})`
                    : 'Telegram Chat 1',
                  ready: data.channels.telegram1,
                },
                {
                  name: data.channels.telegramChat2Label
                    ? `Telegram 2 (${data.channels.telegramChat2Label})`
                    : 'Telegram Chat 2 (Optional)',
                  ready: data.channels.telegram2,
                },
                { name: 'X (Twitter)', ready: data.channels.x },
              ].map((ch) => (
                <div
                  key={ch.name}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs ${subCardBg}`}
                >
                  <span className={`font-semibold ${headingText}`}>{ch.name}</span>
                  <span
                    className={`inline-flex items-center gap-1 font-bold ${
                      ch.ready ? 'text-emerald-500' : mutedText
                    }`}
                  >
                    {ch.ready ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    {ch.ready ? t.channelReady : t.channelNotConfigured}
                  </span>
                </div>
              ))}
            </div>

            {data.announcement.enabled && data.announcement.message && (
              <button
                type="button"
                onClick={() => onNavigate('announcement')}
                className={`mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-start ${
                  darkMode
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{data.announcement.message}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
