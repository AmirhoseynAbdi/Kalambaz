/**
 * Advertisements Configuration Module for Kalabaz (کلمباز)
 *
 * Edit this file to easily change, add, or remove advertisements shown in the game:
 * - bannerAds: Ads displayed in the banners (top, bottom, and laptop side panels)
 * - preGameAd: The interstitial ad displayed before entering the game
 */

export interface AdItem {
  id: string;
  variant?: 'ad' | 'social';
  title: string;           // عنوان تبلیغ
  tagline: string;         // متن توضیحی تبلیغ
  contactEmail?: string;   // ایمیل ارتباطی برای سفارش تبلیغات
  ctaText: string;         // متن دکمه اقدام (Call to Action)
  ctaUrl?: string;         // لینک مقصد (در صورت کلیک)
  icon: string;            // اموجی یا آیکون
  badgeText?: string;      // برچسب مانند "پذیرش تبلیغات"
  discountCode?: string;   // کد تخفیف یا شناسه ارتباطی
  accentColor?: string;
  bgGradientLight?: string;
  bgGradientDark?: string;
  borderColor?: string;
  borderColorLight?: string;
  btnGradientDark?: string;
  btnGradientLight?: string;
  emailTextDark?: string;
  emailTextLight?: string;
  boxBgDark?: string;
  boxBgLight?: string;
}

export interface PreGameAdConfig {
  enabled: boolean;
  countdownSeconds: number;
  title: string;
  tagline: string;
  discountCode?: string;
  icon: string;
  ctaText: string;
  ctaUrl?: string;
}

/**
 * ۴ بنر تبلیغاتی با متن یکسان و ۴ رنگ‌بندی متفاوت (برای اسلایدر موبایل و بنرهای کناری دسکتاپ)
 */
export const BANNER_ADS: AdItem[] = [
  {
    id: 'ad_order_1',
    title: 'تبلیغات خود را به ما بسپارید',
    tagline: 'جهت سفارش و رزرو تبلیغات در کلمباز با ما در تماس باشید:',
    contactEmail: 'justhawkstuff@gmail.com',
    ctaText: 'سفارش تبلیغات',
    ctaUrl: 'mailto:justhawkstuff@gmail.com?subject=سفارش%20تبلیغات%20در%20کلمباز',
    icon: '📣',
    badgeText: 'پذیرش تبلیغات',
    discountCode: 'justhawkstuff@gmail.com',
    bgGradientDark: 'bg-[#143326]',
    bgGradientLight: 'bg-[#dcfce7]',
    btnGradientDark: 'bg-[#16a34a] hover:bg-[#15803d]',
    btnGradientLight: 'bg-[#15803d] hover:bg-[#166534]',
    emailTextDark: 'text-[#86efac]',
    emailTextLight: 'text-[#14532d]',
    boxBgDark: 'bg-[#0e261c]',
    boxBgLight: 'bg-white/90',
  },
  {
    id: 'ad_order_2',
    title: 'تبلیغات خود را به ما بسپارید',
    tagline: 'جهت سفارش و رزرو تبلیغات در کلمباز با ما در تماس باشید:',
    contactEmail: 'justhawkstuff@gmail.com',
    ctaText: 'سفارش تبلیغات',
    ctaUrl: 'mailto:justhawkstuff@gmail.com?subject=سفارش%20تبلیغات%20در%20کلمباز',
    icon: '📣',
    badgeText: 'پذیرش تبلیغات',
    discountCode: 'justhawkstuff@gmail.com',
    bgGradientDark: 'bg-[#281845]',
    bgGradientLight: 'bg-[#f3e8ff]',
    btnGradientDark: 'bg-[#7e22ce] hover:bg-[#9333ea]',
    btnGradientLight: 'bg-[#7e22ce] hover:bg-[#6b21a8]',
    emailTextDark: 'text-[#d8b4fe]',
    emailTextLight: 'text-[#581c87]',
    boxBgDark: 'bg-[#1c1033]',
    boxBgLight: 'bg-white/90',
  },
  {
    id: 'ad_social_follow',
    variant: 'social',
    title: 'کلمباز در تلگرام و ایکس',
    tagline: 'چالش‌های روزانه، خبرهای تازه و دورهمی کلمبازها را دنبال کنید:',
    ctaText: 'دنبال کردن',
    icon: '🥦',
    badgeText: 'شبکه‌های اجتماعی',
    bgGradientDark: 'bg-[#13294a]',
    bgGradientLight: 'bg-[#e0f2fe]',
    btnGradientDark: 'bg-[#0284c7] hover:bg-[#0369a1]',
    btnGradientLight: 'bg-[#0284c7] hover:bg-[#0369a1]',
    emailTextDark: 'text-[#7dd3fc]',
    emailTextLight: 'text-[#0c4a6e]',
    boxBgDark: 'bg-[#0d1d36]',
    boxBgLight: 'bg-white/90',
  },
  {
    id: 'ad_order_4',
    title: 'تبلیغات خود را به ما بسپارید',
    tagline: 'جهت سفارش و رزرو تبلیغات در کلمباز با ما در تماس باشید:',
    contactEmail: 'justhawkstuff@gmail.com',
    ctaText: 'سفارش تبلیغات',
    ctaUrl: 'mailto:justhawkstuff@gmail.com?subject=سفارش%20تبلیغات%20در%20کلمباز',
    icon: '📣',
    badgeText: 'پذیرش تبلیغات',
    discountCode: 'justhawkstuff@gmail.com',
    bgGradientDark: 'bg-[#382211]',
    bgGradientLight: 'bg-[#fef3c7]',
    btnGradientDark: 'bg-[#d97706] hover:bg-[#b45309]',
    btnGradientLight: 'bg-[#b45309] hover:bg-[#92400e]',
    emailTextDark: 'text-[#fcd34d]',
    emailTextLight: 'text-[#78350f]',
    boxBgDark: 'bg-[#28170b]',
    boxBgLight: 'bg-white/90',
  },
];

/**
 * تبلیغ پیش از بازی (قبل از ورود به جدول کلمات روزانه)
 */
export const PRE_GAME_AD: PreGameAdConfig = {
  enabled: true,
  countdownSeconds: 3,
  title: 'تبلیغات خود را به ما بسپارید',
  tagline: 'جهت درج آگهی و اسپانسری در کلمباز با ایمیل justhawkstuff@gmail.com در ارتباط باشید.',
  discountCode: 'justhawkstuff@gmail.com',
  icon: '📣',
  ctaText: 'شروع بازی کلمباز 🥦',
  ctaUrl: 'mailto:justhawkstuff@gmail.com',
};
