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
  ctaText: string;         // متن دکمه اقدام (Call to Action)
  ctaUrl?: string;         // لینک مقصد (در صورت کلیک)
  icon: string;            // اموجی یا آیکون
  badgeText?: string;      // برچسب مانند "حامی مالی" یا "پیشنهاد ویژه"
  discountCode?: string;   // کد تخفیف اختصاصی (اختیاری)
  // رنگ‌های اختصاصی برای هماهنگی با تم
  accentColor?: string;
  bgGradientLight?: string;
  bgGradientDark?: string;
  borderColor?: string;
}

export interface PreGameAdConfig {
  enabled: boolean;
  countdownSeconds: number; // مدت زمان شمارش معکوس به ثانیه
  title: string;
  tagline: string;
  discountCode?: string;
  icon: string;
  ctaText: string;
  ctaUrl?: string;
}

/**
 * بنرهای تبلیغاتی داخل بازی (بالا، پایین و کناره‌های صفحه لپ‌تاپ)
 * می‌توانید به سادگی متن‌ها، لینک‌ها یا آیکون‌ها را ویرایش کنید یا تبلیغ جدید اضافه نمایید.
 */
export const BANNER_ADS: AdItem[] = [
  {
    id: 'ad_bookstore',
    title: 'کتابفروشی باغ دانایی',
    tagline: 'تخفیف ویژه ۳۰٪ برای کلمبازهای اهل مطالعه | کد KALABAZ',
    ctaText: 'مشاهده کتاب‌ها',
    ctaUrl: 'https://example.com/books',
    icon: '📚',
    badgeText: 'حامی کلمباز',
    discountCode: 'KALABAZ',
    bgGradientLight: 'from-purple-100 to-emerald-100',
    bgGradientDark: 'from-purple-950/80 to-emerald-950/80',
    borderColor: 'border-purple-500/30',
  },
  {
    id: 'ad_organic_farm',
    title: 'مزرعه ارگانیک کلم سبز',
    tagline: 'سبزیجات ارگانیک، کلم‌های بنفش و میوه‌های تازه مستقیم از مزرعه',
    ctaText: 'سفارش آنلاین',
    ctaUrl: 'https://example.com/organic',
    icon: '🥬',
    badgeText: 'تخفیف ویژه',
    discountCode: 'CABBAGE20',
    bgGradientLight: 'from-emerald-100 to-teal-100',
    bgGradientDark: 'from-emerald-950/80 to-teal-950/80',
    borderColor: 'border-emerald-500/30',
  },
  {
    id: 'ad_podcast',
    title: 'پادکست ریشه‌شناسی فارسی',
    tagline: 'سفری در ریشه واژگان کهن پارسی با داستان‌های شنیدنی در هر قسمت',
    ctaText: 'شنیدن پادکست',
    ctaUrl: 'https://example.com/podcast',
    icon: '🎙️',
    badgeText: 'پیشنهاد فرهنگی',
    bgGradientLight: 'from-amber-100 to-purple-100',
    bgGradientDark: 'from-amber-950/80 to-purple-950/80',
    borderColor: 'border-amber-500/30',
  },
];

/**
 * تبلیغ پیش از بازی (قبل از ورود به جدول کلمات روزانه)
 */
export const PRE_GAME_AD: PreGameAdConfig = {
  enabled: true,
  countdownSeconds: 3,
  title: 'مزرعه کلم‌های بنفش و سبز ارگانیک',
  tagline: 'تأمین‌کننده طراوت و ویتامین‌های مغز برای حل هوشمندانه جدول کلمات روزانه کلمباز!',
  discountCode: 'KALAMBAZ2026',
  icon: '🥗',
  ctaText: 'شروع بازی کلمباز 🥬',
  ctaUrl: 'https://example.com/sponsor',
};
