import React, { useMemo, useState } from 'react';
import {
  Send,
  Clock,
  Bookmark,
  FileText,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Hash,
  Link2,
  Sparkles,
} from 'lucide-react';
import {
  AdminSocialPost,
  SocialChannelReadiness,
  SocialPostTargets,
  adminApi,
} from '../../utils/adminApi';
import { AdminLang, AdminStrings, formatNum } from './adminI18n';

interface SocialStudioModuleProps {
  token: string;
  posts: AdminSocialPost[];
  channels: SocialChannelReadiness | null;
  todayTehran: string;
  loading: boolean;
  darkMode: boolean;
  lang: AdminLang;
  t: AdminStrings;
  onPostsChange: (posts: AdminSocialPost[]) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

type PostFilterTab = 'all' | 'history' | 'scheduled' | 'drafts' | 'templates';

export const SocialStudioModule: React.FC<SocialStudioModuleProps> = ({
  token,
  posts,
  channels,
  todayTehran,
  loading,
  darkMode,
  lang,
  t,
  onPostsChange,
  onNotify,
}) => {
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [includeLink, setIncludeLink] = useState(true);
  const [targets, setTargets] = useState<SocialPostTargets>({
    telegram1: true,
    telegram2: false,
    x: true,
  });
  const [scheduledFor, setScheduledFor] = useState(`${todayTehran}T09:00`);
  const [submitting, setSubmitting] = useState(false);
  const [busyPostId, setBusyPostId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<PostFilterTab>('all');

  const cardBg = darkMode ? 'bg-[#141923]' : 'bg-white';
  const subBg = darkMode ? 'bg-[#1b2230]' : 'bg-[#f1f5f9]';
  const inputBg = darkMode
    ? 'bg-[#1b2230] text-white placeholder-slate-500'
    : 'bg-[#f1f5f9] text-slate-900 placeholder-slate-400';
  const mutedText = darkMode ? 'text-slate-400' : 'text-slate-500';
  const headingText = darkMode ? 'text-white' : 'text-slate-900';

  const postUrl = channels?.postUrl || 'https://kalambaz.ir';
  const previewFinalText = useMemo(() => {
    const clean = bodyText.trim();
    if (!clean) return '';
    if (!includeLink) return clean;
    if (clean.includes(postUrl)) return clean;
    return `${clean}\n${postUrl}`;
  }, [bodyText, includeLink, postUrl]);

  const charCount = Array.from(previewFinalText).length;
  const xOverLimit = targets.x && charCount > 280;

  const handleAction = async (action: 'publish' | 'schedule' | 'draft' | 'template') => {
    if (!bodyText.trim()) {
      onNotify(lang === 'fa' ? 'متن پست نمی‌تواند خالی باشد.' : 'Post text cannot be empty.', true);
      return;
    }
    if ((action === 'publish' || action === 'schedule') && !targets.telegram1 && !targets.telegram2 && !targets.x) {
      onNotify(
        lang === 'fa' ? 'حداقل یک کانال مقصد (تلگرام یا X) انتخاب کنید.' : 'Select at least one channel.',
        true
      );
      return;
    }
    if (action === 'publish' && xOverLimit) {
      onNotify(t.xOverLimit, true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await adminApi.createSocialPost(token, {
        title: title.trim(),
        bodyText: bodyText.trim(),
        includeLink,
        mode:
          action === 'publish'
            ? 'published'
            : action === 'schedule'
              ? 'scheduled'
              : action === 'template'
                ? 'template'
                : 'draft',
        targets,
        scheduledFor: action === 'schedule' ? scheduledFor : null,
        publishNow: action === 'publish',
      });

      onPostsChange([res.post, ...posts]);
      if (action !== 'template') {
        setTitle('');
        setBodyText('');
      }

      if (action === 'publish') {
        if (res.post.status === 'sent') {
          onNotify(lang === 'fa' ? 'پست با موفقیت در کانال‌های انتخابی منتشر شد!' : 'Post published successfully!');
        } else if (res.post.status === 'partial') {
          onNotify(lang === 'fa' ? 'پست در برخی کانال‌ها ارسال شد و برخی خطا داشتند.' : 'Post partially delivered; check delivery log.', true);
        } else {
          onNotify(lang === 'fa' ? 'انتشار ناموفق بود. جزئیات خطا را در تاریخچه ببینید.' : 'Publish failed. Check error details below.', true);
        }
      } else if (action === 'schedule') {
        onNotify(lang === 'fa' ? `پست برای ${scheduledFor} زمان‌بندی شد.` : `Scheduled for ${scheduledFor}.`);
      } else if (action === 'template') {
        onNotify(lang === 'fa' ? 'قالب پست ذخیره شد.' : 'Template saved.');
      } else {
        onNotify(lang === 'fa' ? 'پیش‌نویس ذخیره شد.' : 'Draft saved.');
      }
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Action failed.', true);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishExisting = async (post: AdminSocialPost, retryFailedOnly: boolean) => {
    setBusyPostId(post.id);
    try {
      const res = await adminApi.publishSocialPost(token, post.id, retryFailedOnly);
      onPostsChange(posts.map((p) => (p.id === post.id ? res.post : p)));
      onNotify(
        res.post.status === 'sent'
          ? lang === 'fa'
            ? 'ارسال با موفقیت انجام شد!'
            : 'Delivered successfully!'
          : lang === 'fa'
            ? 'وضعیت ارسال به‌روزرسانی شد؛ جزئیات را بررسی کنید.'
            : 'Delivery updated; inspect status below.',
        res.post.status !== 'sent'
      );
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Publish failed.', true);
    } finally {
      setBusyPostId(null);
    }
  };

  const handleDeletePost = async (id: number) => {
    setBusyPostId(id);
    try {
      await adminApi.deleteSocialPost(token, id);
      onPostsChange(posts.filter((p) => p.id !== id));
      onNotify(lang === 'fa' ? 'پست حذف شد.' : 'Post deleted.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Delete failed.', true);
    } finally {
      setBusyPostId(null);
    }
  };

  const loadIntoComposer = (post: AdminSocialPost) => {
    setTitle(post.title);
    setBodyText(post.bodyText);
    setIncludeLink(post.includeLink);
    setTargets({ ...post.targets });
    if (post.scheduledFor) setScheduledFor(post.scheduledFor);
    onNotify(lang === 'fa' ? 'متن در ویرایشگر بارگذاری شد.' : 'Loaded into composer.');
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (activeTab === 'templates') return p.mode === 'template';
      if (activeTab === 'scheduled') return p.status === 'scheduled';
      if (activeTab === 'drafts') return p.mode === 'draft' && p.status === 'draft';
      if (activeTab === 'history') return p.status === 'sent' || p.status === 'partial' || p.status === 'failed';
      return true;
    });
  }, [posts, activeTab]);

  const statusBadge = (status: AdminSocialPost['status']) => {
    if (status === 'sent')
      return { text: t.statusSent, cls: 'bg-emerald-500/15 text-emerald-500' };
    if (status === 'partial')
      return { text: t.statusPartial, cls: 'bg-amber-500/15 text-amber-500' };
    if (status === 'failed')
      return { text: t.statusFailed, cls: 'bg-rose-500/15 text-rose-500' };
    if (status === 'scheduled')
      return { text: t.statusScheduled, cls: 'bg-sky-500/15 text-sky-400' };
    return { text: t.statusDraft, cls: darkMode ? 'bg-slate-700/70 text-slate-300' : 'bg-slate-200 text-slate-700' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-xl font-black tracking-tight ${headingText}`}>{t.socialTitle}</h2>
        <p className={`text-xs mt-1 ${mutedText}`}>{t.socialSubtitle}</p>
      </div>

      {/* Composer Card */}
      <div className={`rounded-2xl p-5 space-y-4 ${cardBg}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left/Main Text Editor */}
          <div className="lg:col-span-2 space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.postTitlePlaceholder}
              className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold outline-none ${inputBg}`}
            />

            <textarea
              rows={5}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder={t.postBodyPlaceholder}
              className={`w-full px-3.5 py-3 rounded-xl text-sm leading-relaxed outline-none resize-y ${inputBg}`}
            />

            {/* Quick Insert + Counter Row */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBodyText((prev) => `${prev}${prev ? ' ' : ''}${todayTehran}`)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${subBg} ${headingText}`}
                >
                  <Calendar className="w-3 h-3 text-emerald-500" />
                  <span>{t.insertTodayDate}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBodyText((prev) => `${prev}${prev ? '\n' : ''}#کلمباز #بازی_کلمات`)
                  }
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${subBg} ${headingText}`}
                >
                  <Hash className="w-3 h-3 text-purple-400" />
                  <span>{t.insertHashtags}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIncludeLink((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                    includeLink
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : `${subBg} ${mutedText}`
                  }`}
                >
                  <Link2 className="w-3 h-3" />
                  <span>{t.includeLinkLabel}</span>
                </button>
              </div>

              <div
                className={`text-xs font-bold tabular-nums ${
                  xOverLimit ? 'text-rose-500' : mutedText
                }`}
              >
                {t.xCharCount}: {formatNum(charCount, lang)} / {formatNum(280, lang)}
              </div>
            </div>

            {xOverLimit && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-500">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{t.xOverLimit}</span>
              </div>
            )}
          </div>

          {/* Right/Channel Toggles & Schedule */}
          <div className="space-y-4">
            <div>
              <div className={`text-xs font-bold mb-2 ${mutedText}`}>{t.targetChannels}</div>
              <div className="space-y-2">
                {/* Telegram 1 */}
                <button
                  type="button"
                  onClick={() => setTargets((p) => ({ ...p, telegram1: !p.telegram1 }))}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    targets.telegram1
                      ? 'bg-sky-500/20 text-sky-400'
                      : `${subBg} ${mutedText}`
                  }`}
                >
                  <span>
                    Telegram 1
                    {channels?.telegramChat1Label ? ` (${channels.telegramChat1Label})` : ''}
                  </span>
                  <span className="text-[10px]">
                    {channels?.telegram1 ? '●' : t.channelNotConfigured}
                  </span>
                </button>

                {/* Telegram 2 */}
                <button
                  type="button"
                  onClick={() => setTargets((p) => ({ ...p, telegram2: !p.telegram2 }))}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    targets.telegram2
                      ? 'bg-sky-500/20 text-sky-400'
                      : `${subBg} ${mutedText}`
                  }`}
                >
                  <span>
                    Telegram 2
                    {channels?.telegramChat2Label ? ` (${channels.telegramChat2Label})` : ''}
                  </span>
                  <span className="text-[10px]">
                    {channels?.telegram2 ? '●' : t.channelNotConfigured}
                  </span>
                </button>

                {/* X */}
                <button
                  type="button"
                  onClick={() => setTargets((p) => ({ ...p, x: !p.x }))}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    targets.x
                      ? darkMode
                        ? 'bg-white text-slate-900'
                        : 'bg-slate-900 text-white'
                      : `${subBg} ${mutedText}`
                  }`}
                >
                  <span>X (Twitter)</span>
                  <span className="text-[10px]">
                    {channels?.x ? '●' : t.channelNotConfigured}
                  </span>
                </button>

                {/* Coming Soon Slots: Instagram & TikTok */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {['Instagram', 'TikTok'].map((name) => (
                    <div
                      key={name}
                      className={`px-3 py-2 rounded-xl text-[11px] font-bold flex items-center justify-between opacity-55 ${subBg} ${mutedText}`}
                    >
                      <span>{name}</span>
                      <span className="text-[9px]">{t.comingSoon}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Schedule DateTime Picker */}
            <div className={`p-3 rounded-xl space-y-2 ${subBg}`}>
              <label className={`block text-[11px] font-bold ${mutedText}`}>
                {t.scheduleDateTimeLabel}
              </label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                dir="ltr"
                className={`w-full px-3 py-2 rounded-lg text-xs font-mono outline-none ${
                  darkMode ? 'bg-[#121720] text-white' : 'bg-white text-slate-900'
                }`}
              />
              <p className={`text-[10px] leading-relaxed ${mutedText}`}>{t.tehranTimeHint}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleAction('publish')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t.publishNow}</span>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleAction('schedule')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t.schedulePost}</span>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleAction('draft')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              darkMode
                ? 'bg-[#222b3c] hover:bg-[#2c374c] text-slate-100'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t.saveDraft}</span>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleAction('template')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              darkMode
                ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300'
                : 'bg-purple-100 hover:bg-purple-200 text-purple-800'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{t.saveTemplate}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Posts History / Queue / Templates */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ['all', t.allTab],
              ['history', t.historyTab],
              ['scheduled', t.scheduledTab],
              ['drafts', t.draftsTab],
              ['templates', t.templatesTab],
            ] as Array<[PostFilterTab, string]>
          ).map(([tabKey, label]) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setActiveTab(tabKey)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === tabKey
                  ? 'bg-emerald-600 text-white'
                  : darkMode
                    ? 'bg-[#141923] text-slate-400 hover:text-white'
                    : 'bg-white text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && posts.length === 0 ? (
          <div className={`rounded-2xl p-8 text-center text-sm ${cardBg} ${mutedText}`}>
            {t.loading}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className={`rounded-2xl p-8 text-center text-sm ${cardBg} ${mutedText}`}>
            {t.noData}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => {
              const badge = statusBadge(post.status);
              const hasFailedDelivery = post.deliveries.some((d) => d.status === 'failed');
              const isBusy = busyPostId === post.id;

              return (
                <div key={post.id} className={`rounded-2xl p-4 space-y-3 ${cardBg}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${badge.cls}`}>
                          {badge.text}
                        </span>
                        {post.mode === 'template' && (
                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-purple-500/15 text-purple-400 inline-flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {t.templatesTab}
                          </span>
                        )}
                        {post.title && (
                          <span className={`text-sm font-black ${headingText}`}>{post.title}</span>
                        )}
                      </div>
                      {post.scheduledFor && post.status === 'scheduled' && (
                        <div className="text-[11px] font-mono text-sky-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{post.scheduledFor.replace('T', ' ')} (Tehran)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => loadIntoComposer(post)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold ${subBg} ${headingText}`}
                      >
                        {t.useTemplate}
                      </button>

                      {(post.status === 'draft' || post.status === 'scheduled') &&
                        post.mode !== 'template' && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handlePublishExisting(post, false)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            <Send className="w-3 h-3" />
                            <span>{t.publishDraftNow}</span>
                          </button>
                        )}

                      {hasFailedDelivery && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handlePublishExisting(post, true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-amber-600 hover:bg-amber-500 text-white"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>{t.retryFailed}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/15 transition-colors"
                        title={t.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className={`text-sm whitespace-pre-wrap leading-relaxed ${headingText}`}>
                    {post.bodyText}
                  </p>

                  {/* Per-Channel Delivery Results */}
                  {post.deliveries.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {post.deliveries.map((d) => (
                        <div
                          key={`${post.id}-${d.channel}`}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 ${
                            d.status === 'sent'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : 'bg-rose-500/15 text-rose-400'
                          }`}
                        >
                          {d.status === 'sent' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>{d.channel}</span>
                          {d.error && (
                            <span className="font-normal opacity-90">— {d.error}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
