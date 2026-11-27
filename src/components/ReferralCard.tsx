import React, { useState } from 'react';
import { Gift, Copy, Check, Share2, Users, LogIn } from 'lucide-react';
import { buildReferralUrl, REFERRAL_REWARD_POINTS } from '../utils/referral';
import { GreenSeedIcon } from './GreenSeedIcon';

interface ReferralCardProps {
  username?: string;
  referralsCount?: number;
  referralPointsEarned?: number;
  darkMode?: boolean;
  onOpenLogin?: () => void;
  onNotify?: (msg: string) => void;
  compact?: boolean;
}

export const ReferralCard: React.FC<ReferralCardProps> = ({
  username,
  referralsCount = 0,
  referralPointsEarned = 0,
  darkMode = true,
  onOpenLogin,
  onNotify,
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);

  const rewardFa = REFERRAL_REWARD_POINTS.toLocaleString('fa-IR');
  const countFa = Math.max(0, Number(referralsCount) || 0).toLocaleString('fa-IR');
  const earnedFa = Math.max(0, Number(referralPointsEarned) || 0).toLocaleString('fa-IR');

  if (!username) {
    return (
      <div
        className={`rounded-2xl p-3.5 ${
          darkMode
            ? 'bg-[#2a1f45] text-[#f5f3ff]'
            : 'bg-[#f3e8ff] text-[#3b0764]'
        }`}
      >
        <div className="flex items-start gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              darkMode
                ? 'bg-[#16422b] text-[#4ade80]'
                : 'bg-[#dcfce7] text-[#15803d]'
            }`}
          >
            <Gift className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="text-xs font-extrabold">دعوت از دوستان</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                  darkMode
                    ? 'bg-[#15803d] text-white'
                    : 'bg-[#7e22ce] text-white'
                }`}
              >
                <GreenSeedIcon className="w-3 h-3" />
                <span>+{rewardFa} بذر هدیه</span>
              </span>
            </div>
            <p
              className={`text-[11px] font-semibold leading-relaxed ${
                darkMode ? 'text-[#d8c7f0]' : 'text-[#581c87]'
              }`}
            >
              با ساخت حساب، لینک اختصاصی خود را بگیرید و به ازای هر دوستی که عضو شود،{' '}
              <strong>{rewardFa} بذر راهنما</strong> هدیه بگیرید!
            </p>
            {onOpenLogin && (
              <button
                type="button"
                onClick={onOpenLogin}
                className={`mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-extrabold text-white transition-colors active:scale-95 ${
                  darkMode
                    ? 'bg-[#16a34a] hover:bg-[#15803d]'
                    : 'bg-[#7e22ce] hover:bg-[#6b21a8]'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>ساخت حساب و دریافت لینک دعوت</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const referralUrl = buildReferralUrl(username);

  const copyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(referralUrl);
      } else {
        const input = document.createElement('input');
        input.value = referralUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      onNotify?.('لینک دعوت اختصاصی شما کپی شد! به ازای هر عضویت ۱۰۰ بذر می‌گیرید 🎁');
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      onNotify?.('امکان کپی خودکار وجود نداشت؛ لینک را به صورت دستی کپی کنید.');
    }
  };

  const shareLink = async () => {
    const shareText = `🥦 بیا با هم کلمباز بازی کنیم! بازی روزانه حدس کلمات فارسی:\n${referralUrl}`;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'دعوت به بازی روزانه کلمباز 🥦',
          text: `بیا با هم کلمباز بازی کنیم! معماهای ۴، ۵ و ۶ حرفی روزانه فارسی:`,
          url: referralUrl,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        onNotify?.('متن و لینک دعوت کپی شد! برای دوستانتان ارسال کنید 🎁');
        window.setTimeout(() => setCopied(false), 2400);
        return;
      }
    } catch {}
    await copyLink();
  };

  return (
    <div
      className={`rounded-2xl ${compact ? 'p-3.5' : 'p-4'} ${
        darkMode
          ? 'bg-[#163326] text-[#ecfdf5]'
          : 'bg-[#dcfce7] text-[#14532d]'
      }`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Gift
            className={`w-4 h-4 shrink-0 ${
              darkMode ? 'text-[#4ade80]' : 'text-[#15803d]'
            }`}
          />
          <span className="text-xs font-extrabold truncate">
            دعوت از دوستان و هدیه بذر
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 ${
            darkMode
              ? 'bg-[#15803d] text-white'
              : 'bg-[#7e22ce] text-white'
          }`}
        >
          <GreenSeedIcon className="w-3 h-3" />
          <span>+{rewardFa} بذر / دعوت</span>
        </span>
      </div>

      {/* Description */}
      <p
        className={`text-[11px] font-semibold leading-relaxed mb-2.5 ${
          darkMode ? 'text-[#bbf7d0]' : 'text-[#166534]'
        }`}
      >
        لینک اختصاصی زیر را برای دوستانتان بفرستید؛ با هر ثبت‌نام جدید،{' '}
        <strong>{rewardFa} بذر راهنما</strong> به حساب شما اضافه می‌شود.
      </p>

      {/* Referral URL Box */}
      <div
        dir="ltr"
        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[11px] font-mono mb-2.5 select-all overflow-hidden ${
          darkMode
            ? 'bg-[#0e2219] text-[#86efac]'
            : 'bg-white text-[#14532d]'
        }`}
        title={referralUrl}
      >
        <span className="truncate">{referralUrl}</span>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={copyLink}
          className={`py-2 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors active:scale-95 text-white ${
            darkMode
              ? 'bg-[#16a34a] hover:bg-[#15803d]'
              : 'bg-[#7e22ce] hover:bg-[#6b21a8]'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>کپی شد!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 shrink-0" />
              <span>کپی لینک دعوت</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={shareLink}
          className={`py-2 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors active:scale-95 ${
            darkMode
              ? 'bg-[#2e224b] hover:bg-[#3c2d62] text-[#e9d5ff]'
              : 'bg-white hover:bg-[#eefaf2] text-[#14532d]'
          }`}
        >
          <Share2 className="w-3.5 h-3.5 shrink-0" />
          <span>اشتراک‌گذاری</span>
        </button>
      </div>

      {/* Invite Stats Footer */}
      <div
        className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[11px] font-bold ${
          darkMode
            ? 'border-white/10 text-[#d1fae5]'
            : 'border-emerald-950/10 text-[#166534]'
        }`}
      >
        <span className="inline-flex items-center gap-1">
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span>دعوت‌های موفق: {countFa} نفر</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <GreenSeedIcon className="w-3.5 h-3.5 shrink-0" />
          <span>مجموع هدیه: +{earnedFa} بذر</span>
        </span>
      </div>
    </div>
  );
};
