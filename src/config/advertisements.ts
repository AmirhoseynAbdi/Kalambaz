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
  badgeText?: string;      // برچسب مانند "حامی مالی" یا "پذیرش آگهی"
  discountCode?: string;   // کد تخفیف یا شناسه ارتباطی
  accentColor?: string;
  bgGradientLight?: string;
  bgGradientDark?: string;
  borderColor?: string;
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
 * بنرهای تبلیغاتی داخل بازی (بالا، پایین و کناره‌های صفحه لپ‌تاپ)
 */
export const BANNER_ADS: AdItem[] = [
  {
    id: 'ad_order_1',
    title: 'تبلیغات خود را به ما بسپارید',
    tagline: 'رزرو جایگاه تبلیغات در کلمباز | تماس: justhawkstuff@gmail.com',
    contactEmail: 'justhawkstuff@gmail.com',
    ctaText: 'سفارش تبلیغات',
    ctaUrl: 'mailto:justhawkstuff@gmail.com?subject=سفارش%20تبلیغات%20در%20کلمباز',
    icon: '📣',
    badgeText: 'پذیرش تبلیغات',
    discountCode: 'justhawkstuff@gmail.com',
    bgGradientLight: 'from-purple-100 to-emerald-100',
    bgGradientDark: 'from-purple-950/80 to-emerald-950/80',
    borderColor: 'border-purple-500/30',
  },
  {
    id: 'ad_order_2',
    title: 'تبلیغات خود را به ما بسپارید',
    tagline: 'معرفی کسب‌وکار شما به مخاطبان روزانه | justhawkstuff@gmail.com',
    contactEmail: 'justhawkstuff@gmail.com',
    ctaText: 'ارتباط با ما',
    ctaUrl: 'mailto:justhawkstuff@gmail.com?subject=سفارش%20تبلیغات%20در%20کلمباز',
    icon: '✨',
    badgeText: 'همکاری تجاری',
    discountCode: 'justhawkstuff@gmail.com',
    bgGradientLight: 'from-emerald-100 to-teal-100',
    bgGradientDark: 'from-emerald-950/80 to-teal-950/80',
    borderColor: 'border-emerald-500/30',
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
  ctaText: 'شروع بازی کلمباز 🥬',
  ctaUrl: 'mailto:justhawkstuff@gmail.com',
};
