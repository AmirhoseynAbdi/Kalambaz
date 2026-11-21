import React, { useState, useEffect, useRef } from 'react';
import { Mail } from 'lucide-react';
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
    if (!isSlider || isPaused) return;
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % BANNER_ADS.length);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [isSlider, isPaused]);

  if (BANNER_ADS.length === 0) return null;

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
    ? `${ad.bgGradientDark || 'bg-[#201733]'} ${ad.borderColor || 'border-[#433266]'} text-[#f5f3ff]`
    : `${ad.bgGradientLight || 'bg-[#f0eaf8]'} ${ad.borderColorLight || 'border-[#cbbce0]'} text-[#1e1033]`;

  const btnClasses = darkMode
    ? `${ad.btnGradientDark || 'bg-[#15803d] hover:bg-[#16a34a]'}`
    : `${ad.btnGradientLight || 'bg-[#15803d] hover:bg-[#166534]'}`;

  const emailClasses = darkMode
    ? ad.emailTextDark || 'text-[#86efac]'
    : ad.emailTextLight || 'text-[#15803d]';

  const boxClasses = darkMode
    ? ad.boxBgDark || 'bg-[#161022] border-[#362854]'
    : ad.boxBgLight || 'bg-white border-[#cbbce0]';

  // Sidebar layout on laptop/desktop
  if (position === 'sidebar') {
    return (
      <div
        role="region"
        aria-label="جایگاه تبلیغات کلمباز"
        className={`w-full rounded-2xl border-2 p-3 transition-colors duration-200 relative overflow-hidden ${bgClasses}`}
      >

        <div className="flex items-center gap-1.5 mb-2">
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md leading-none text-white ${btnClasses}`}
          >
            {ad.badgeText || 'پذیرش تبلیغات'}
          </span>
          <span className="text-[10px] font-bold opacity-85">
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
        </div>
      </div>
    </div>
  );
};
