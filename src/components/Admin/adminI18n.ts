export type AdminLang = 'fa' | 'en';

export type AdminSection =
  | 'overview'
  | 'users'
  | 'social'
  | 'dailyWords'
  | 'push'
  | 'referrals'
  | 'announcement';

export interface AdminStrings {
  brandTitle: string;
  brandSubtitle: string;
  backToGame: string;
  signOut: string;
  refresh: string;
  save: string;
  saving: string;
  cancel: string;
  delete: string;
  confirmDelete: string;
  edit: string;
  close: string;
  loading: string;
  noData: string;
  // Auth
  setupTitle: string;
  setupSubtitle: string;
  loginTitle: string;
  loginSubtitle: string;
  passwordLabel: string;
  confirmPasswordLabel: string;
  passwordPlaceholder: string;
  createAdminBtn: string;
  loginBtn: string;
  passwordMismatch: string;
  passwordTooShort: string;
  changePasswordBtn: string;
  currentPassword: string;
  newPassword: string;
  securityModalTitle: string;
  envPasswordActiveNote: string;
  // Nav
  nav: Record<AdminSection, string>;
  // Overview
  overviewTitle: string;
  tehranToday: string;
  kpiTotalUsers: string;
  kpiActiveToday: string;
  kpiWinRate: string;
  kpiTotalSeeds: string;
  kpiPushSubscribers: string;
  kpiReferrals: string;
  kpiSocialSent: string;
  kpiScheduledPosts: string;
  activityChartTitle: string;
  signupsLabel: string;
  activePlayersLabel: string;
  todayWordsTitle: string;
  overrideTag: string;
  defaultTag: string;
  channelsReadinessTitle: string;
  channelReady: string;
  channelNotConfigured: string;
  quickActionsTitle: string;
  lettersUnit: string;
  // Users
  usersTitle: string;
  searchUsersPlaceholder: string;
  sortRecent: string;
  sortSeeds: string;
  sortStreak: string;
  sortWins: string;
  filterAll: string;
  filterActiveToday: string;
  filterWithPush: string;
  colUsername: string;
  colSeeds: string;
  colStreak: string;
  colGames: string;
  colLastPlayed: string;
  colPush: string;
  colActions: string;
  editUserTitle: string;
  seedsLabel: string;
  currentStreakLabel: string;
  maxStreakLabel: string;
  gamesPlayedLabel: string;
  gamesWonLabel: string;
  lastPlayedDateLabel: string;
  guessDistributionLabel: string;
  resetTodayPuzzle: string;
  resetTodayHint: string;
  resetUserPasswordLabel: string;
  resetUserPasswordPlaceholder: string;
  dangerZone: string;
  deleteUserWarn: string;
  // Social Studio
  socialTitle: string;
  socialSubtitle: string;
  postTitlePlaceholder: string;
  postBodyPlaceholder: string;
  includeLinkLabel: string;
  insertTodayDate: string;
  insertHashtags: string;
  xCharCount: string;
  xOverLimit: string;
  targetChannels: string;
  comingSoon: string;
  publishNow: string;
  schedulePost: string;
  saveDraft: string;
  saveTemplate: string;
  scheduleDateTimeLabel: string;
  tehranTimeHint: string;
  templatesTab: string;
  scheduledTab: string;
  draftsTab: string;
  historyTab: string;
  allTab: string;
  useTemplate: string;
  retryFailed: string;
  publishDraftNow: string;
  statusSent: string;
  statusPartial: string;
  statusFailed: string;
  statusScheduled: string;
  statusDraft: string;
  // Daily Words
  dailyWordsTitle: string;
  dailyWordsSubtitle: string;
  colDate: string;
  todayBadge: string;
  overridePlaceholder: string;
  revertDefault: string;
  applyOverride: string;
  // Push
  pushTitle: string;
  pushSubtitle: string;
  linkedDevices: string;
  guestDevices: string;
  pushedToday: string;
  sendBroadcastBtn: string;
  forceAllLabel: string;
  recentDevicesTitle: string;
  // Referrals
  referralsTitle: string;
  referralsSubtitle: string;
  totalReferralsCount: string;
  totalRewardSeeds: string;
  leaderboardTitle: string;
  recentReferralsTitle: string;
  referrerCol: string;
  inviteeCol: string;
  rewardCol: string;
  // Announcement
  announcementTitle: string;
  announcementSubtitle: string;
  enableBannerLabel: string;
  bannerMessageLabel: string;
  bannerMessagePlaceholder: string;
  bannerLinkLabel: string;
  bannerLinkPlaceholder: string;
  bannerToneLabel: string;
  livePreviewLabel: string;
  saveBannerBtn: string;
}

export const ADMIN_I18N: Record<AdminLang, AdminStrings> = {
  fa: {
    brandTitle: 'پنل مدیریت کلمباز',
    brandSubtitle: 'مدیریت کامل بازی، کاربران و شبکه‌های اجتماعی',
    backToGame: 'بازگشت به بازی',
    signOut: 'خروج',
    refresh: 'به‌روزرسانی',
    save: 'ذخیره تغییرات',
    saving: 'در حال ذخیره...',
    cancel: 'انصراف',
    delete: 'حذف',
    confirmDelete: 'تایید حذف قطعی',
    edit: 'ویرایش',
    close: 'بستن',
    loading: 'در حال بارگذاری...',
    noData: 'داده‌ای برای نمایش وجود ندارد.',
    setupTitle: 'راه‌اندازی اولیه پنل مدیریت',
    setupSubtitle: 'برای نخستین ورود، یک رمز عبور قوی (حداقل ۸ کاراکتر) جهت قفل‌کردن kalambaz.ir/admin تعیین کنید.',
    loginTitle: 'ورود به پنل مدیریت کلمباز',
    loginSubtitle: 'رمز عبور مدیریت را وارد کنید. نشست شما فقط در حافظه این تب نگهداری می‌شود.',
    passwordLabel: 'رمز عبور مدیریت',
    confirmPasswordLabel: 'تکرار رمز عبور',
    passwordPlaceholder: 'حداقل ۸ کاراکتر...',
    createAdminBtn: 'ثبت رمز و ورود به پنل',
    loginBtn: 'ورود به پنل',
    passwordMismatch: 'رمز عبور و تکرار آن یکسان نیستند.',
    passwordTooShort: 'رمز عبور باید حداقل ۸ کاراکتر باشد.',
    changePasswordBtn: 'تغییر رمز مدیریت',
    currentPassword: 'رمز فعلی',
    newPassword: 'رمز جدید (حداقل ۸ کاراکتر)',
    securityModalTitle: 'امنیت و رمز عبور مدیریت',
    envPasswordActiveNote: 'توجه: متغیر ADMIN_PASSWORD در تنظیمات سرور فعال است و اولویت دارد.',
    nav: {
      overview: 'نمای کلی',
      users: 'مدیریت کاربران',
      social: 'استودیو شبکه‌های اجتماعی',
      dailyWords: 'کلمات روزانه',
      push: 'اعلان‌های وب (Push)',
      referrals: 'معرفی دوستان',
      announcement: 'بنر اطلاع‌رسانی بازی',
    },
    overviewTitle: 'نمای کلی وضعیت بازی',
    tehranToday: 'امروز (تهران)',
    kpiTotalUsers: 'کل کاربران',
    kpiActiveToday: 'فعال امروز',
    kpiWinRate: 'نرخ برد کل',
    kpiTotalSeeds: 'کل بذرها',
    kpiPushSubscribers: 'مشترکین اعلان',
    kpiReferrals: 'دعوت‌های موفق',
    kpiSocialSent: 'پست‌های منتشرشده',
    kpiScheduledPosts: 'پست‌های زمان‌بندی‌شده',
    activityChartTitle: 'روند ۱۴ روز اخیر (ثبت‌نام و بازیکنان فعال)',
    signupsLabel: 'ثبت‌نام جدید',
    activePlayersLabel: 'بازیکن فعال',
    todayWordsTitle: 'کلمات امروز کلمباز',
    overrideTag: 'سفارشی',
    defaultTag: 'خودکار',
    channelsReadinessTitle: 'وضعیت اتصال کانال‌های انتشار',
    channelReady: 'متصل و آماده',
    channelNotConfigured: 'تنظیم نشده',
    quickActionsTitle: 'دسترسی سریع',
    lettersUnit: 'حرفی',
    usersTitle: 'پایگاه داده کاربران',
    searchUsersPlaceholder: 'جستجو بر اساس نام کاربری...',
    sortRecent: 'جدیدترین فعالیت',
    sortSeeds: 'بیشترین بذر',
    sortStreak: 'بیشترین استریک',
    sortWins: 'بیشترین برد',
    filterAll: 'همه کاربران',
    filterActiveToday: 'فعال امروز',
    filterWithPush: 'دارای اعلان',
    colUsername: 'نام کاربری',
    colSeeds: 'بذر',
    colStreak: 'استریک',
    colGames: 'برد / بازی',
    colLastPlayed: 'آخرین بازی',
    colPush: 'اعلان',
    colActions: 'عملیات',
    editUserTitle: 'ویرایش اطلاعات کاربر',
    seedsLabel: 'موجودی بذر (امتیاز)',
    currentStreakLabel: 'استریک فعلی',
    maxStreakLabel: 'بیشترین استریک',
    gamesPlayedLabel: 'کل بازی‌ها',
    gamesWonLabel: 'تعداد بردها',
    lastPlayedDateLabel: 'تاریخ آخرین بازی (YYYY-MM-DD)',
    guessDistributionLabel: 'توزیع حدس‌های موفق (۱ تا ۶)',
    resetTodayPuzzle: 'ریست پازل امروز کاربر',
    resetTodayHint: 'وضعیت بازی امروز کاربر پاک می‌شود تا دوباره بازی کند.',
    resetUserPasswordLabel: 'بازنشانی رمز عبور کاربر (اختیاری)',
    resetUserPasswordPlaceholder: 'خالی بگذارید تا تغییر نکند...',
    dangerZone: 'منطقه حساس',
    deleteUserWarn: 'حذف کامل حساب کاربری و تمام آمار آن غیرقابل بازگشت است.',
    socialTitle: 'استودیو انتشار در شبکه‌های اجتماعی',
    socialSubtitle: 'پست‌های خودتان را بنویسید، زمان‌بندی کنید و مستقیم در تلگرام و X منتشر کنید (بدون نیاز به کلید Gemini).',
    postTitlePlaceholder: 'عنوان داخلی پست (اختیاری، مثلاً: چالش جمعه)',
    postBodyPlaceholder: 'متن پست را اینجا بنویسید...',
    includeLinkLabel: 'افزودن خودکار لینک بازی به انتهای پست',
    insertTodayDate: 'درج تاریخ امروز',
    insertHashtags: 'درج هشتگ کلمباز',
    xCharCount: 'شمارنده X',
    xOverLimit: 'بیش از حد مجاز ۲۸۰ کاراکتر برای X!',
    targetChannels: 'کانال‌های مقصد',
    comingSoon: 'به‌زودی',
    publishNow: 'انتشار فوری',
    schedulePost: 'زمان‌بندی انتشار',
    saveDraft: 'ذخیره پیش‌نویس',
    saveTemplate: 'ذخیره به عنوان قالب',
    scheduleDateTimeLabel: 'تاریخ و ساعت انتشار (به وقت تهران)',
    tehranTimeHint: 'پست‌های زمان‌بندی‌شده به صورت خودکار توسط کرون سرور در زمان مقرر منتشر می‌شوند.',
    templatesTab: 'قالب‌ها',
    scheduledTab: 'زمان‌بندی‌شده',
    draftsTab: 'پیش‌نویس‌ها',
    historyTab: 'تاریخچه ارسال',
    allTab: 'همه',
    useTemplate: 'استفاده در ویرایشگر',
    retryFailed: 'تلاش مجدد ناموفق‌ها',
    publishDraftNow: 'انتشار همین حالا',
    statusSent: 'ارسال شد',
    statusPartial: 'ارسال ناقص',
    statusFailed: 'ناموفق',
    statusScheduled: 'زمان‌بندی‌شده',
    statusDraft: 'پیش‌نویس',
    dailyWordsTitle: 'مدیریت کلمات روزانه',
    dailyWordsSubtitle: 'برنامه ۲۱ روزه کلمات ۴، ۵ و ۶ حرفی را ببینید و در صورت نیاز کلمه سفارشی جایگزین کنید.',
    colDate: 'تاریخ (تهران)',
    todayBadge: 'امروز',
    overridePlaceholder: 'کلمه جدید...',
    revertDefault: 'بازگشت به پیش‌فرض',
    applyOverride: 'ثبت',
    pushTitle: 'مدیریت اعلان‌های وب (Web Push)',
    pushSubtitle: 'آمار دستگاه‌های مشترک و ارسال فوری یادآور بازی به تمام کاربران.',
    linkedDevices: 'دستگاه‌های متصل به حساب',
    guestDevices: 'دستگاه‌های مهمان',
    pushedToday: 'ارسال‌شده امروز',
    sendBroadcastBtn: 'ارسال همگانی اعلان یادآور',
    forceAllLabel: 'ارسال مجدد حتی به دستگاه‌هایی که امروز اعلان گرفته‌اند',
    recentDevicesTitle: 'آخرین دستگاه‌های ثبت‌شده (فقط دامنه سرویس‌دهنده)',
    referralsTitle: 'گزارش معرفی دوستان (Referral)',
    referralsSubtitle: 'برترین دعوت‌کنندگان و تاریخچه کامل پاداش‌های معرفی.',
    totalReferralsCount: 'کل معرفی‌های ثبت‌شده',
    totalRewardSeeds: 'مجموع بذر پاداش داده‌شده',
    leaderboardTitle: 'برترین معرف‌ها',
    recentReferralsTitle: 'تاریخچه آخرین دعوت‌ها',
    referrerCol: 'معرف',
    inviteeCol: 'کاربر دعوت‌شده',
    rewardCol: 'پاداش',
    announcementTitle: 'بنر اطلاع‌رسانی داخل بازی',
    announcementSubtitle: 'یک پیام کوتاه و زنده در بالای صفحه اصلی کلمباز برای همه بازیکنان نمایش دهید.',
    enableBannerLabel: 'نمایش بنر اطلاع‌رسانی در صفحه اصلی بازی',
    bannerMessageLabel: 'متن اطلاعیه (حداکثر ۲۸۰ کاراکتر)',
    bannerMessagePlaceholder: 'مثلاً: چالش ویژه آخر هفته شروع شد! کلمه ۶ حرفی امروز رو از دست نده.',
    bannerLinkLabel: 'لینک دکمه اختیاری (فقط https://)',
    bannerLinkPlaceholder: 'https://t.me/...',
    bannerToneLabel: 'رنگ بنر',
    livePreviewLabel: 'پیش‌نمایش زنده در بازی',
    saveBannerBtn: 'ذخیره تنظیمات بنر',
  },
  en: {
    brandTitle: 'Kalambaz Admin',
    brandSubtitle: 'Game database, live config & social publishing',
    backToGame: 'Back to Game',
    signOut: 'Sign Out',
    refresh: 'Refresh',
    save: 'Save Changes',
    saving: 'Saving...',
    cancel: 'Cancel',
    delete: 'Delete',
    confirmDelete: 'Confirm Permanent Delete',
    edit: 'Edit',
    close: 'Close',
    loading: 'Loading...',
    noData: 'No data available yet.',
    setupTitle: 'First-Run Admin Setup',
    setupSubtitle: 'Create a strong admin password (min 8 characters) to secure kalambaz.ir/admin.',
    loginTitle: 'Kalambaz Admin Sign In',
    loginSubtitle: 'Enter your admin password. Sessions are kept in memory for this tab only.',
    passwordLabel: 'Admin Password',
    confirmPasswordLabel: 'Confirm Password',
    passwordPlaceholder: 'At least 8 characters...',
    createAdminBtn: 'Claim Admin & Continue',
    loginBtn: 'Sign In',
    passwordMismatch: 'Passwords do not match.',
    passwordTooShort: 'Password must be at least 8 characters.',
    changePasswordBtn: 'Change Admin Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password (min 8 chars)',
    securityModalTitle: 'Admin Password & Security',
    envPasswordActiveNote: 'Note: ADMIN_PASSWORD is set in server config and takes precedence.',
    nav: {
      overview: 'Overview',
      users: 'User Database',
      social: 'Social Post Studio',
      dailyWords: 'Daily Words',
      push: 'Web Push Broadcast',
      referrals: 'Referrals',
      announcement: 'In-Game Banner',
    },
    overviewTitle: 'Game Overview & Analytics',
    tehranToday: 'Today (Tehran)',
    kpiTotalUsers: 'Total Users',
    kpiActiveToday: 'Active Today',
    kpiWinRate: 'Global Win Rate',
    kpiTotalSeeds: 'Total Seeds',
    kpiPushSubscribers: 'Push Subscribers',
    kpiReferrals: 'Total Referrals',
    kpiSocialSent: 'Social Posts Sent',
    kpiScheduledPosts: 'Scheduled Posts',
    activityChartTitle: '14-Day Activity (Signups & Active Players)',
    signupsLabel: 'New Signups',
    activePlayersLabel: 'Active Players',
    todayWordsTitle: "Today's Active Words",
    overrideTag: 'Override',
    defaultTag: 'Default',
    channelsReadinessTitle: 'Publishing Channel Status',
    channelReady: 'Connected',
    channelNotConfigured: 'Not Configured',
    quickActionsTitle: 'Quick Actions',
    lettersUnit: 'Letters',
    usersTitle: 'User Database Manager',
    searchUsersPlaceholder: 'Search by username...',
    sortRecent: 'Recently Active',
    sortSeeds: 'Most Seeds',
    sortStreak: 'Highest Streak',
    sortWins: 'Most Wins',
    filterAll: 'All Users',
    filterActiveToday: 'Active Today',
    filterWithPush: 'Push Enabled',
    colUsername: 'Username',
    colSeeds: 'Seeds',
    colStreak: 'Streak',
    colGames: 'Won / Played',
    colLastPlayed: 'Last Played',
    colPush: 'Push',
    colActions: 'Actions',
    editUserTitle: 'Edit User Record',
    seedsLabel: 'Seeds Balance (Points)',
    currentStreakLabel: 'Current Streak',
    maxStreakLabel: 'Max Streak',
    gamesPlayedLabel: 'Games Played',
    gamesWonLabel: 'Games Won',
    lastPlayedDateLabel: 'Last Played Date (YYYY-MM-DD)',
    guessDistributionLabel: 'Guess Distribution (1–6)',
    resetTodayPuzzle: "Reset Today's Puzzle",
    resetTodayHint: "Clears today's puzzle progress so the player can replay today.",
    resetUserPasswordLabel: 'Reset User Password (Optional)',
    resetUserPasswordPlaceholder: 'Leave blank to keep unchanged...',
    dangerZone: 'Danger Zone',
    deleteUserWarn: 'Permanently deletes this user account and all associated stats.',
    socialTitle: 'Social Post Studio',
    socialSubtitle: 'Write your own posts, schedule them for Tehran time, and publish to Telegram & X (no Gemini key required).',
    postTitlePlaceholder: 'Internal post title (optional, e.g. Weekend Challenge)',
    postBodyPlaceholder: 'Write your Persian or English post here...',
    includeLinkLabel: 'Auto-append game URL to post',
    insertTodayDate: 'Insert Today Date',
    insertHashtags: 'Insert #کلمباز Tags',
    xCharCount: 'X Counter',
    xOverLimit: 'Exceeds X 280-character limit!',
    targetChannels: 'Destination Channels',
    comingSoon: 'Coming Soon',
    publishNow: 'Publish Now',
    schedulePost: 'Schedule Post',
    saveDraft: 'Save Draft',
    saveTemplate: 'Save as Template',
    scheduleDateTimeLabel: 'Schedule Date & Time (Tehran Time)',
    tehranTimeHint: 'Scheduled posts are dispatched automatically by your server/cPanel cron job.',
    templatesTab: 'Templates',
    scheduledTab: 'Scheduled',
    draftsTab: 'Drafts',
    historyTab: 'Delivery Log',
    allTab: 'All',
    useTemplate: 'Load into Composer',
    retryFailed: 'Retry Failed',
    publishDraftNow: 'Publish Now',
    statusSent: 'Sent',
    statusPartial: 'Partial',
    statusFailed: 'Failed',
    statusScheduled: 'Scheduled',
    statusDraft: 'Draft',
    dailyWordsTitle: 'Daily Word Schedule & Overrides',
    dailyWordsSubtitle: 'Inspect the rolling 21-day schedule for 4, 5, and 6-letter puzzles and set custom overrides.',
    colDate: 'Date (Tehran)',
    todayBadge: 'Today',
    overridePlaceholder: 'Custom word...',
    revertDefault: 'Revert',
    applyOverride: 'Set',
    pushTitle: 'Web Push Broadcast & Subscribers',
    pushSubtitle: 'View device subscription stats and send a live daily reminder wake-up push.',
    linkedDevices: 'Account-Linked Devices',
    guestDevices: 'Guest Devices',
    pushedToday: 'Pushed Today',
    sendBroadcastBtn: 'Send Broadcast Now',
    forceAllLabel: 'Force resend even to devices already pushed today',
    recentDevicesTitle: 'Recent Subscriptions (Sanitized Push Service Host Only)',
    referralsTitle: 'Referral Tracking & Leaderboard',
    referralsSubtitle: 'Top inviters and recent referral reward audit log.',
    totalReferralsCount: 'Total Referrals',
    totalRewardSeeds: 'Total Reward Seeds',
    leaderboardTitle: 'Top Referrers',
    recentReferralsTitle: 'Recent Invites',
    referrerCol: 'Referrer',
    inviteeCol: 'Invitee',
    rewardCol: 'Reward',
    announcementTitle: 'In-Game Announcement Banner',
    announcementSubtitle: 'Display a live, dismissible announcement banner at the top of Kalambaz.',
    enableBannerLabel: 'Show live banner on the main game screen',
    bannerMessageLabel: 'Banner Message (max 280 chars)',
    bannerMessagePlaceholder: 'e.g. Weekend word challenge is live! Try the 6-letter word today.',
    bannerLinkLabel: 'Optional Action Link (https:// only)',
    bannerLinkPlaceholder: 'https://t.me/...',
    bannerToneLabel: 'Banner Color Tone',
    livePreviewLabel: 'Live In-Game Preview',
    saveBannerBtn: 'Save Banner Settings',
  },
};

export function formatNum(n: number, lang: AdminLang): string {
  return n.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US');
}
