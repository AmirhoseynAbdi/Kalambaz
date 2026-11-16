import React, { useState, useEffect, useRef } from 'react';
import { Mail, X } from 'lucide-react';
import { BANNER_ADS, AdItem } from '../config/advertisements';

interface AdBannerProps {
  position?: 'top' | 'bottom' | 'sidebar';
  adIndex?: number;
  darkMode?: boolean;
  onNotify?: (message: string) => void;
  onOpenContact?: () => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  position = 'top',
  adIndex,
  darkMode = true,
  onNotify,
  onOpenContact,
}) => {
  const [closed, setClosed] = useState(false);
  const [activeSlide, setActiveSlide] = useState<number>(() => {
    if (typeof adIndex === 'number' && BANNER_ADS[adIndex]) {
      return adIndex;
    }
    return 0;
  });
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const isSlider = position !== 'sidebar' && BANNER_ADS.length > 1;

  // Auto-advance the small horizontal banner slider every 3.5 seconds
  useEffect(() => {
    if (!isSlider || closed || isPaused) return;
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % BANNER_ADS.length);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [isSlider, closed, isPaused]);

  if (closed || BANNER_ADS.length === 0) return null;

  const currentIndex =
    position === 'sidebar' && typeof adIndex === 'number'
      ? adIndex % BANNER_ADS.length
      : activeSlide % BANNER_ADS.length;

  const ad: AdItem = BANNER_ADS[currentIndex] || BANNER_ADS[0];
  const email = ad.contactEmail || 'justhawkstuff@gmail.com';

  const handleClickAd = () => {
    if (onOpenContact) {
      onOpenContact();
      return;
    }
    try {
      navigator.clipboard?.writeText(email);
    } catch {}
    if (onNotify) {
      onNotify(`ایمیل سفارش تبلیغات کپی شد: ${email}`);
    }
  };

  const bgClasses = darkMode
    ? `bg-gradient-to-r ${ad.bgGradientDark || 'from-[#24173b]/95 via-[#1d2436]/95 to-[#172e29]/95'} ${ad.borderColor || 'border-[#523b78]/65'} text-[#f2edfa]`
    : `bg-gradient-to-r ${ad.bgGradientLight || 'from-[#e2f1ea]/95 via-[#edf6f1]/95 to-[#ebe3f6]/95'} ${ad.borderColorLight || 'border-[#82b59d]/75'} text-[#17382b]`;

  const btnClasses = darkMode
    ? `bg-gradient-to-r ${ad.btnGradientDark || 'from-[#237a5b] to-[#3f2b69]'}`
    : `bg-gradient-to-r ${ad.btnGradientLight || 'from-[#5c328c] to-[#266b52]'}`;

  const emailClasses = darkMode
    ? ad.emailTextDark || 'text-[#6ee7b7]'
    : ad.emailTextLight || 'text-[#5c328c]';

  const boxClasses = darkMode
    ? ad.boxBgDark || 'bg-[#173830]/75 border-[#428f76]/60'
    : ad.boxBgLight || 'bg-[#ebe3f6] border-[#a58fd1]';

  // Sidebar layout on laptop/desktop
  if (position === 'sidebar') {
    return (
      <div
        role="region"
        aria-label="جایگاه تبلیغات کلمباز"
        className={`w-full rounded-2xl border-2 p-3 shadow-md transition-all duration-500 relative overflow-hidden backdrop-blur-sm ${bgClasses}`}
      >
        <button
          onClick={() => setClosed(true)}
          aria-label="بستن تبلیغ"
          className={`absolute top-2 left-2 p-1 rounded-lg transition-colors ${
            darkMode
              ? 'text-[#c4b5fd] hover:text-white hover:bg-white/10'
              : 'text-[#215c46] hover:text-[#123628] hover:bg-black/10'
          }`}
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1.5 mb-2">
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full leading-none text-white ${btnClasses}`}
          >
            {ad.badgeText || 'پذیرش تبلیغات'}
          </span>
          <span
            className={`text-[10px] font-bold opacity-85`}
          >
            جایگاه آگهی
          </span>
        </div>

        <div className="text-center my-1.5">
          <div
            className={`w-10 h-10 mx-auto mb-1.5 rounded-xl border flex items-center justify-center text-xl shadow-inner ${boxClasses}`}
          >
            {ad.icon}
          </div>
          <h4
            className={`text-xs xl:text-sm font-extrabold mb-0.5 ${
              darkMode ? 'text-white' : 'text-[#17382b]'
            }`}
          >
            {ad.title}
          </h4>
          <p
            className={`text-[11px] font-medium leading-snug px-1 opacity-90`}
          >
            جهت سفارش و رزرو تبلیغات در کلمباز با ما در تماس باشید:
          </p>
        </div>

        <div
          dir="ltr"
          className={`my-2 p-1.5 rounded-xl border text-center ${boxClasses}`}
        >
          <span
            dir="rtl"
            className={`text-[10px] font-bold block opacity-85`}
          >
            ایمیل ارتباطی:
          </span>
          <a
            href={`mailto:${email}`}
            className={`text-[11px] font-mono font-extrabold tracking-wide underline underline-offset-2 ${emailClasses}`}
          >
            {email}
          </a>
        </div>

        <button
          type="button"
          onClick={handleClickAd}
          className={`w-full mt-1.5 py-1.5 px-3 rounded-xl text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all ${btnClasses}`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>{ad.ctaText}</span>
        </button>
      </div>
    );
  }

  // Small horizontal ad banner slider (4 slides with same text & 4 different colors)
  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="اسلایدر جایگاه تبلیغات کلمباز"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(e) => {
        setIsPaused(true);
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        setIsPaused(false);
        if (touchStartX.current === null) return;
        const deltaX = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
        if (Math.abs(deltaX) > 30) {
          if (deltaX > 0) {
            setActiveSlide((prev) => (prev + 1) % BANNER_ADS.length);
          } else {
            setActiveSlide((prev) => (prev - 1 + BANNER_ADS.length) % BANNER_ADS.length);
          }
        }
        touchStartX.current = null;
      }}
      className={`w-full max-w-xl mx-auto px-1.5 sm:px-2 shrink-0 ${
        position === 'top' ? 'mb-0.5' : 'mt-0.5'
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-xl border px-2 py-1 sm:px-3 sm:py-1.5 flex items-center justify-between gap-1.5 sm:gap-2 shadow-2xs transition-colors duration-500 ${bgClasses}`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          <span className="text-sm sm:text-base shrink-0 select-none">
            {ad.icon}
          </span>
          <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-1.5 truncate">
            <h4 className="text-[11px] sm:text-xs font-extrabold truncate leading-tight">
              {ad.title}
            </h4>
            <span className="hidden sm:inline opacity-50">·</span>
            <span
              dir="ltr"
              className={`text-[9px] sm:text-[11px] font-mono font-bold truncate leading-tight ${emailClasses}`}
            >
              {email}
            </span>
          </div>
        </div>

        {/* 4 Slide Indicator Dots */}
        <div
          className="flex items-center gap-1 shrink-0 px-0.5"
          role="tablist"
          aria-label="انتخاب اسلاید تبلیغ"
        >
          {BANNER_ADS.map((item, idx) => {
            const isActive = idx === currentIndex;
            const dotColors = [
              'bg-emerald-400',
              'bg-purple-400',
              'bg-sky-400',
              'bg-amber-400',
            ];
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`بنر تبلیغاتی ${idx + 1}`}
                onClick={() => setActiveSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? `w-3.5 ${dotColors[idx % dotColors.length]} opacity-100`
                    : 'w-1.5 bg-current opacity-35 hover:opacity-70'
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleClickAd}
            className={`flex items-center gap-1 text-[10px] sm:text-xs font-extrabold px-2 py-1 rounded-lg text-white shadow-2xs transition-all duration-500 whitespace-nowrap ${btnClasses}`}
          >
            <Mail className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
            <span>{ad.ctaText}</span>
          </button>
          <button
            type="button"
            onClick={() => setClosed(true)}
            aria-label="بستن تبلیغ"
            className="p-0.5 sm:p-1 rounded-md opacity-75 hover:opacity-100 hover:bg-black/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
