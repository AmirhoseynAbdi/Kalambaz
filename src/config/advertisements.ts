/**
 * Advertisements Configuration Module for Kalabaz (کلمباز)
 *
 * Edit this file to easily change, add, or remove advertisements shown in the game:
 * - bannerAds: Ads displayed in the banners (top, bottom, and laptop side panels)
 * - preGameAd: The interstitial ad displayed before entering the game
 */

export interface AdItem {
  id: string;
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
    bgGradientDark: 'bg-[#123324]',
    bgGradientLight: 'bg-[#dcfce7]',
    borderColor: 'border-[#22c55e]',
    borderColorLight: 'border-[#16a34a]',
    btnGradientDark: 'bg-[#15803d] hover:bg-[#16a34a]',
    btnGradientLight: 'bg-[#15803d] hover:bg-[#166534]',
    emailTextDark: 'text-[#86efac]',
    emailTextLight: 'text-[#14532d]',
    boxBgDark: 'bg-[#0d2419] border-[#22c55e]/60',
    boxBgLight: 'bg-white border-[#86efac]',
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
    bgGradientDark: 'bg-[#261642]',
    bgGradientLight: 'bg-[#f3e8ff]',
    borderColor: 'border-[#9333ea]',
    borderColorLight: 'border-[#7e22ce]',
    btnGradientDark: 'bg-[#6b21a8] hover:bg-[#7e22ce]',
    btnGradientLight: 'bg-[#6b21a8] hover:bg-[#581c87]',
    emailTextDark: 'text-[#d8b4fe]',
    emailTextLight: 'text-[#581c87]',
    boxBgDark: 'bg-[#1b0f30] border-[#9333ea]/60',
    boxBgLight: 'bg-white border-[#d8b4fe]',
  },
  {
    id: 'ad_order_3',
    title: 'تبلیغات خود را به ما بسپارید',
    tagline: 'جهت سفارش و رزرو تبلیغات در کلمباز با ما در تماس باشید:',
    contactEmail: 'justhawkstuff@gmail.com',
    ctaText: 'سفارش تبلیغات',
    ctaUrl: 'mailto:justhawkstuff@gmail.com?subject=سفارش%20تبلیغات%20در%20کلمباز',
    icon: '📣',
    badgeText: 'پذیرش تبلیغات',
    discountCode: 'justhawkstuff@gmail.com',
    bgGradientDark: 'bg-[#122645]',
    bgGradientLight: 'bg-[#dbeafe]',
    borderColor: 'border-[#38bdf8]',
    borderColorLight: 'border-[#0284c7]',
    btnGradientDark: 'bg-[#0369a1] hover:bg-[#0284c7]',
    btnGradientLight: 'bg-[#0369a1] hover:bg-[#075985]',
    emailTextDark: 'text-[#7dd3fc]',
    emailTextLight: 'text-[#0c4a6e]',
    boxBgDark: 'bg-[#0c1b33] border-[#38bdf8]/60',
    boxBgLight: 'bg-white border-[#7dd3fc]',
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
    bgGradientDark: 'bg-[#3b2210]',
    bgGradientLight: 'bg-[#fef3c7]',
    borderColor: 'border-[#f59e0b]',
    borderColorLight: 'border-[#d97706]',
    btnGradientDark: 'bg-[#b45309] hover:bg-[#d97706]',
    btnGradientLight: 'bg-[#b45309] hover:bg-[#92400e]',
    emailTextDark: 'text-[#fcd34d]',
    emailTextLight: 'text-[#78350f]',
    boxBgDark: 'bg-[#29170a] border-[#f59e0b]/60',
    boxBgLight: 'bg-white border-[#fcd34d]',
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
