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
    bgGradientDark: 'from-[#0f382a]/95 via-[#132f28]/95 to-[#1a3d33]/95',
    bgGradientLight: 'from-[#d1fae5]/95 via-[#e6f7ef]/95 to-[#bbf7d0]/95',
    borderColor: 'border-[#34d399]/65',
    borderColorLight: 'border-[#10b981]/75',
    btnGradientDark: 'from-[#059669] to-[#047857] hover:from-[#10b981] hover:to-[#059669]',
    btnGradientLight: 'from-[#059669] to-[#065f46] hover:from-[#047857] hover:to-[#064e3b]',
    emailTextDark: 'text-[#6ee7b7]',
    emailTextLight: 'text-[#065f46]',
    boxBgDark: 'bg-[#0b291f]/80 border-[#34d399]/50',
    boxBgLight: 'bg-[#ecfdf5] border-[#6ee7b7]',
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
    bgGradientDark: 'from-[#2e164f]/95 via-[#24163e]/95 to-[#3b1d63]/95',
    bgGradientLight: 'from-[#ede9fe]/95 via-[#f3e8ff]/95 to-[#ddd6fe]/95',
    borderColor: 'border-[#a855f7]/65',
    borderColorLight: 'border-[#8b5cf6]/75',
    btnGradientDark: 'from-[#7c3aed] to-[#5b21b6] hover:from-[#8b5cf6] hover:to-[#6d28d9]',
    btnGradientLight: 'from-[#6d28d9] to-[#4c1d95] hover:from-[#5b21b6] hover:to-[#3b0764]',
    emailTextDark: 'text-[#d8b4fe]',
    emailTextLight: 'text-[#5b21b6]',
    boxBgDark: 'bg-[#21103b]/80 border-[#a855f7]/50',
    boxBgLight: 'bg-[#f5f3ff] border-[#c4b5fd]',
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
    bgGradientDark: 'from-[#112a4a]/95 via-[#15233d]/95 to-[#19385c]/95',
    bgGradientLight: 'from-[#dbeafe]/95 via-[#e0f2fe]/95 to-[#bae6fd]/95',
    borderColor: 'border-[#38bdf8]/65',
    borderColorLight: 'border-[#0284c7]/75',
    btnGradientDark: 'from-[#0284c7] to-[#1d4ed8] hover:from-[#0ea5e9] hover:to-[#2563eb]',
    btnGradientLight: 'from-[#0369a1] to-[#1e40af] hover:from-[#0284c7] hover:to-[#1d4ed8]',
    emailTextDark: 'text-[#7dd3fc]',
    emailTextLight: 'text-[#1e40af]',
    boxBgDark: 'bg-[#0d2038]/80 border-[#38bdf8]/50',
    boxBgLight: 'bg-[#f0f9ff] border-[#7dd3fc]',
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
    bgGradientDark: 'from-[#3f2212]/95 via-[#361c24]/95 to-[#472914]/95',
    bgGradientLight: 'from-[#fef3c7]/95 via-[#ffedd5]/95 to-[#fde68a]/95',
    borderColor: 'border-[#f59e0b]/65',
    borderColorLight: 'border-[#d97706]/75',
    btnGradientDark: 'from-[#d97706] to-[#b45309] hover:from-[#f59e0b] hover:to-[#d97706]',
    btnGradientLight: 'from-[#b45309] to-[#92400e] hover:from-[#d97706] hover:to-[#78350f]',
    emailTextDark: 'text-[#fcd34d]',
    emailTextLight: 'text-[#92400e]',
    boxBgDark: 'bg-[#2e180d]/80 border-[#f59e0b]/50',
    boxBgLight: 'bg-[#fffbeb] border-[#fcd34d]',
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
