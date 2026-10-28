import React, { useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
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
    const msg =
      ad.ctaUrl && ad.ctaUrl !== '#'
        ? `حامی مالی کلمباز: «${ad.title}» (${ad.ctaText})`
        : `با سپاس از توجه شما به حامی کلمباز: «${ad.title}» 🥬`;
    if (onNotify) {
      onNotify(msg);
    }
  };

  // Sidebar layout on laptop/desktop
  if (position === 'sidebar') {
    return (
      <aside
        role="complementary"
        aria-label="جایگاه تبلیغات حامی کلمباز"
        className={`w-full rounded-2xl border-2 p-4 shadow-md transition-all relative overflow-hidden backdrop-blur-sm ${
          darkMode
            ? 'bg-gradient-to-br from-[#25183e]/95 via-[#1e2038]/95 to-[#162e29]/95 border-[#543c7d]/70 text-[#f2edfa]'
            : 'bg-gradient-to-br from-[#e6f3ec]/95 via-[#eef6f1]/95 to-[#ece4f6]/95 border-[#82b59d]/75 text-[#17382b]'
        }`}
      >
        <button
          onClick={() => setClosed(true)}
          aria-label="بستن تبلیغ"
          className={`absolute top-2.5 left-2.5 p-1 rounded-lg transition-colors ${
            darkMode
              ? 'text-[#c4b5fd] hover:text-white hover:bg-white/10'
              : 'text-[#215c46] hover:text-[#123628] hover:bg-[#cfe5da]/60'
          }`}
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1.5 mb-3">
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full leading-none text-white ${
              darkMode
                ? 'bg-gradient-to-r from-[#237a5b] to-[#3f2b69]'
                : 'bg-gradient-to-r from-[#5c328c] to-[#266b52]'
            }`}
          >
            {ad.badgeText || 'حامی کلمباز'}
          </span>
          <span
            className={`text-[10px] font-bold ${
              darkMode ? 'text-[#d8b4fe]' : 'text-[#215c46]'
            }`}
          >
            فضای تبلیغاتی
          </span>
        </div>

        <div className="text-center my-3">
          <div
            className={`w-14 h-14 mx-auto mb-2 rounded-2xl border-2 flex items-center justify-center text-3xl shadow-inner ${
              darkMode
                ? 'bg-gradient-to-br from-[#2a1c42] to-[#17362e] border-[#529980]/55'
                : 'bg-gradient-to-br from-[#f3effa] to-[#e3f2ea] border-[#9b7ec7]/65'
            }`}
          >
            {ad.icon}
          </div>
          <h4
            className={`text-sm font-extrabold mb-1 ${
              darkMode ? 'text-white' : 'text-[#17382b]'
            }`}
          >
            {ad.title}
          </h4>
          <p
            className={`text-xs font-medium leading-relaxed px-1 ${
              darkMode ? 'text-[#d8c7f0]' : 'text-[#214f3d]'
            }`}
          >
            {ad.tagline}
          </p>
        </div>

        {ad.discountCode && (
          <div
            className={`my-2.5 p-2 rounded-xl border text-center ${
              darkMode
                ? 'bg-[#173830]/75 border-[#428f76]/60'
                : 'bg-[#ebe3f6] border-[#a58fd1]'
            }`}
          >
            <span
              className={`text-[10px] font-bold block ${
                darkMode ? 'text-[#a7f3d0]' : 'text-[#4c2478]'
              }`}
            >
              کد تخفیف اختصاصی:
            </span>
            <strong
              className={`text-xs font-mono font-extrabold tracking-wider ${
                darkMode ? 'text-[#6ee7b7]' : 'text-[#351857]'
              }`}
            >
              {ad.discountCode}
            </strong>
          </div>
        )}

        <button
          onClick={handleClickAd}
          className={`w-full mt-2 py-2 px-3 rounded-xl text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all ${
            darkMode
              ? 'bg-gradient-to-r from-[#237a5b] to-[#3f2b69] hover:from-[#298f6b] hover:to-[#4c357d]'
              : 'bg-gradient-to-r from-[#5c328c] to-[#266b52] hover:from-[#6b3ba1] hover:to-[#2d7d60]'
          }`}
        >
          <span>{ad.ctaText}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </aside>
    );
  }

  // Compact single-line mobile/tablet horizontal banner
  return (
    <div
      role="region"
      aria-label="جایگاه تبلیغات حامی کلمباز"
      className={`w-full max-w-xl mx-auto px-1.5 sm:px-2 shrink-0 ${
        position === 'top' ? 'mb-1' : 'mt-1'
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-xl border px-2 py-1 sm:px-3 sm:py-1.5 flex items-center justify-between gap-2 shadow-2xs ${
          darkMode
            ? 'bg-gradient-to-r from-[#24173b]/90 via-[#1d2436]/90 to-[#172e29]/90 border-[#523b78]/65 text-[#f2edfa]'
            : 'bg-gradient-to-r from-[#e2f1ea]/95 via-[#edf6f1]/95 to-[#ebe3f6]/95 border-[#82b59d]/70 text-[#17382b]'
        }`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          <span className="text-base sm:text-lg shrink-0 select-none">
            {ad.icon}
          </span>
          <span
            className={`hidden xs:inline-block text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded text-white leading-none shrink-0 ${
              darkMode
                ? 'bg-gradient-to-r from-[#237a5b] to-[#3f2b69]'
                : 'bg-gradient-to-r from-[#5c328c] to-[#266b52]'
            }`}
          >
            {ad.badgeText || 'حامی'}
          </span>
          <div className="min-w-0 flex-1 flex items-center gap-1.5 truncate">
            <h4 className="text-[11px] sm:text-xs font-extrabold truncate">
              {ad.title}
            </h4>
            <span className="hidden sm:inline opacity-50">·</span>
            <p
              className={`hidden sm:inline text-[11px] font-medium truncate ${
                darkMode ? 'text-[#d8c7f0]' : 'text-[#215c46]'
              }`}
            >
              {ad.tagline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleClickAd}
            className={`flex items-center gap-1 text-[10px] sm:text-xs font-extrabold px-2 py-1 rounded-lg text-white shadow-2xs transition-colors whitespace-nowrap ${
              darkMode
                ? 'bg-gradient-to-r from-[#237a5b] to-[#3f2b69] hover:from-[#298f6b] hover:to-[#4c357d]'
                : 'bg-gradient-to-r from-[#5c328c] to-[#266b52] hover:from-[#6b3ba1] hover:to-[#2d7d60]'
            }`}
          >
            <span>{ad.ctaText}</span>
            <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => setClosed(true)}
            aria-label="بستن تبلیغ"
            className="p-1 rounded-md opacity-75 hover:opacity-100 hover:bg-black/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
