import React, { useState } from 'react';
import { ExternalLink, X, Sparkles, Tag } from 'lucide-react';
import { BANNER_ADS, AdItem } from '../config/advertisements';

interface AdBannerProps {
  position?: 'top' | 'bottom' | 'sidebar';
  adIndex?: number;
  darkMode?: boolean;
  onNotify?: (message: string) => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  position = 'top',
  adIndex,
  darkMode = true,
  onNotify,
}) => {
  const [closed, setClosed] = useState(false);
  const [selectedIndex] = useState(() => {
    if (typeof adIndex === 'number' && BANNER_ADS[adIndex]) {
      return adIndex;
    }
    return Math.floor(Math.random() * BANNER_ADS.length);
  });

  if (closed || BANNER_ADS.length === 0) return null;

  const ad: AdItem = BANNER_ADS[selectedIndex] || BANNER_ADS[0];

  const handleClickAd = () => {
    const msg = ad.ctaUrl && ad.ctaUrl !== '#'
      ? `حامی مالی کلمباز: «${ad.title}» (${ad.ctaText})`
      : `با سپاس از توجه شما به حامی کلمباز: «${ad.title}» 🥬`;
    if (onNotify) {
      onNotify(msg);
    }
  };

  // If sidebar layout on laptop/desktop
  if (position === 'sidebar') {
    return (
      <aside
        role="complementary"
        aria-label="جایگاه تبلیغات حامی کلمباز"
        className="w-full rounded-2xl border p-4 shadow-md transition-all relative overflow-hidden bg-gradient-to-b from-purple-950/70 via-neutral-900/90 to-emerald-950/70 border-purple-500/30 text-white"
      >
        <button
          onClick={() => setClosed(true)}
          aria-label="بستن تبلیغ"
          className="absolute top-2.5 left-2.5 p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-white/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600/90 text-white leading-none">
            {ad.badgeText || 'حامی کلمباز'}
          </span>
          <span className="text-[10px] text-neutral-400">فضای تبلیغاتی</span>
        </div>

        <div className="text-center my-3">
          <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-3xl shadow-inner">
            {ad.icon}
          </div>
          <h4 className="text-sm font-bold text-white mb-1">
            {ad.title}
          </h4>
          <p className="text-xs text-neutral-300 leading-relaxed px-1">
            {ad.tagline}
          </p>
        </div>

        {ad.discountCode && (
          <div className="my-2.5 p-2 rounded-xl bg-black/40 border border-amber-500/30 text-center">
            <span className="text-[10px] text-amber-300 block">کد تخفیف اختصاصی:</span>
            <strong className="text-xs font-mono font-bold text-amber-400 tracking-wider">
              {ad.discountCode}
            </strong>
          </div>
        )}

        <button
          onClick={handleClickAd}
          className="w-full mt-2 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-purple-600 hover:from-emerald-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
        >
          <span>{ad.ctaText}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </aside>
    );
  }

  // Standard horizontal banner (top/bottom)
  return (
    <div
      role="region"
      aria-label="جایگاه تبلیغات حامی کلمباز"
      className={`w-full max-w-2xl mx-auto px-2 transition-all ${
        position === 'top' ? 'mb-1.5' : 'mt-2 mb-1'
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-xl border p-2 sm:px-3 sm:py-2 flex items-center justify-between gap-2.5 shadow-sm bg-gradient-to-r ${
          darkMode
            ? ad.bgGradientDark || 'from-purple-950/80 to-emerald-950/80 border-purple-800/60 text-purple-100'
            : ad.bgGradientLight || 'from-purple-100 to-emerald-100 border-purple-200 text-purple-950'
        } ${ad.borderColor || 'border-purple-500/30'}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="text-xl sm:text-2xl shrink-0 p-1.5 rounded-lg bg-black/10 dark:bg-white/10 backdrop-blur-sm">
            {ad.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white leading-none">
                {ad.badgeText || 'حامی مالی'}
              </span>
              <h4 className="text-xs sm:text-sm font-bold truncate">
                {ad.title}
              </h4>
            </div>
            <p className="text-[11px] sm:text-xs opacity-85 truncate mt-0.5">
              {ad.tagline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleClickAd}
            className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition-colors"
          >
            <span>{ad.ctaText}</span>
            <ExternalLink className="w-3 h-3" />
          </button>
          <button
            onClick={() => setClosed(true)}
            aria-label="بستن تبلیغ"
            className="p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-black/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
