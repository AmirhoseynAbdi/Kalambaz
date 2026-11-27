import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Lightbulb,
  Keyboard,
  Smartphone,
  Bell,
  BellRing,
  MoreVertical,
  Download,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Share,
  SlidersHorizontal,
} from 'lucide-react';
import { HINT_COST, STARTING_POINTS } from '../../game/wordleLogic';
import { NotificationPermissionState } from '../../utils/notifications';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
  initialSlide?: 0 | 1 | 2;
  isInstallable?: boolean;
  isInstalled?: boolean;
  isIOS?: boolean;
  onInstallApp?: () => void;
  notificationPermission?: NotificationPermissionState;
  notificationsEnabled?: boolean;
  onEnableNotifications?: () => void;
  onSendTestNotification?: () => void;
}

const SLIDE_TABS = [
  { index: 0 as const, label: '۱. آموزش بازی' },
  { index: 1 as const, label: '۲. نصب روی گوشی' },
  { index: 2 as const, label: '۳. اعلان روزانه' },
];

type MockTileStatus = 'correct' | 'present' | 'absent';

interface MockSolvedStep {
  stepNum: number;
  word: string;
  tiles: { letter: string; status: MockTileStatus }[];
  badge: string;
  explanation: string;
}

// Verified step-by-step solved walkthrough for the 4-letter target word «گلاب»
const MOCK_SOLVED_TARGET = 'گلاب';
const MOCK_SOLVED_STEPS: MockSolvedStep[] = [
  {
    stepNum: 1,
    word: 'بالش',
    badge: 'حدس ۱',
    tiles: [
      { letter: 'ب', status: 'present' },
      { letter: 'ا', status: 'present' },
      { letter: 'ل', status: 'present' },
      { letter: 'ش', status: 'absent' },
    ],
    explanation:
      '«ب»، «ا» و «ل» نارنجی شدند؛ یعنی در «گلاب» هستند ولی جایشان اشتباه است. «ش» تیره شد پس اصلاً در کلمه نیست.',
  },
  {
    stepNum: 2,
    word: 'لباس',
    badge: 'حدس ۲',
    tiles: [
      { letter: 'ل', status: 'present' },
      { letter: 'ب', status: 'present' },
      { letter: 'ا', status: 'correct' },
      { letter: 'س', status: 'absent' },
    ],
    explanation:
      '«ا» سبز شد (خانه سوم قطعی شد!). «ل» و «ب» هنوز نارنجی‌اند، پس باید به خانه‌های ۲ و ۴ بروند (_ ل ا ب). «س» هم حذف می‌شود.',
  },
  {
    stepNum: 3,
    word: 'گلاب',
    badge: 'حدس ۳ ✓',
    tiles: [
      { letter: 'گ', status: 'correct' },
      { letter: 'ل', status: 'correct' },
      { letter: 'ا', status: 'correct' },
      { letter: 'ب', status: 'correct' },
    ],
    explanation:
      'با گذاشتن «گ» در خانه اول و چیدن «ل»، «ا»، «ب» در جای درستشان، هر ۴ خانه سبز شد و معمای «گلاب» حل شد! 🎉',
  },
];

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  darkMode = true,
  initialSlide = 0,
  isInstallable = false,
  isInstalled = false,
  isIOS = false,
  onInstallApp,
  notificationPermission = 'default',
  notificationsEnabled = false,
  onEnableNotifications,
  onSendTestNotification,
}) => {
  const [activeSlide, setActiveSlide] = useState<0 | 1 | 2>(initialSlide);
  const [focusedStep, setFocusedStep] = useState<number>(3);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveSlide(initialSlide);
      setFocusedStep(3);
    }
  }, [isOpen, initialSlide]);

  if (!isOpen) return null;

  const absentTile = darkMode
    ? 'bg-[#1c152e] text-[#9b8bb8]'
    : 'bg-[#566d60] text-white';

  const stepCardClass = darkMode
    ? 'bg-[#171126] text-[#e9d5ff]'
    : 'bg-[#eefaf2] text-[#14532d]';

  const stepBadgeClass = darkMode
    ? 'bg-[#15803d] text-white'
    : 'bg-[#7e22ce] text-white';

  const primaryBtnClass = darkMode
    ? 'bg-[#16a34a] hover:bg-[#15803d] text-white shadow-sm'
    : 'bg-[#7e22ce] hover:bg-[#6b21a8] text-white shadow-sm';

  const secondaryBtnClass = darkMode
    ? 'bg-[#2e224b] text-[#e9d5ff] hover:bg-[#3c2d62]'
    : 'bg-[#dff5e7] text-[#14532d] hover:bg-[#c5ecd4]';

  const isNotifActive = notificationPermission === 'granted' && notificationsEnabled;

  const goNext = () => {
    if (activeSlide < 2) {
      setActiveSlide((prev) => (prev + 1) as 0 | 1 | 2);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (activeSlide > 0) {
      setActiveSlide((prev) => (prev - 1) as 0 | 1 | 2);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 45) return;
    // RTL: swipe right -> next slide, swipe left -> previous slide
    if (delta > 0 && activeSlide < 2) {
      setActiveSlide((prev) => (prev + 1) as 0 | 1 | 2);
    } else if (delta < 0 && activeSlide > 0) {
      setActiveSlide((prev) => (prev - 1) as 0 | 1 | 2);
    }
  };

  const headerMeta =
    activeSlide === 0
      ? {
          icon: <span className="text-2xl select-none">🥦</span>,
          title: 'چطور کلمباز بازی کنیم؟',
          subtitle: 'کلمه پنهان امروز را در ۶ تلاش حدس بزنید!',
        }
      : activeSlide === 1
      ? {
          icon: (
            <Smartphone
              className={`w-6 h-6 ${darkMode ? 'text-[#4ade80]' : 'text-[#6b21a8]'}`}
            />
          ),
          title: 'نصب کلمباز روی صفحه گوشی',
          subtitle: 'ساخت میانبر سریع در کروم (Chrome) مثل یک اپلیکیشن واقعی',
        }
      : {
          icon: (
            <BellRing
              className={`w-6 h-6 ${darkMode ? 'text-[#4ade80]' : 'text-[#6b21a8]'}`}
            />
          ),
          title: 'فعال‌سازی اعلان روزانه',
          subtitle: 'هر روز با آمدن کلمه جدید مطلع شوید و استریک خود را حفظ کنید',
        };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="راهنمای بازی کلمباز"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-[2px] animate-fade-in"
    >
      <div
        dir="ltr"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full max-w-md rounded-2xl p-4 sm:p-6 shadow-2xl overflow-y-auto max-h-[92vh] ${
          darkMode
            ? 'bg-[#211836] text-[#f5f3ff] shadow-black/50'
            : 'bg-white text-[#14532d] shadow-emerald-950/15'
        }`}
      >
        <div dir="rtl">
          {/* Header */}
          <div
            className={`flex items-center justify-between pb-3 border-b mb-3 ${
              darkMode ? 'border-white/8' : 'border-emerald-950/8'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="shrink-0">{headerMeta.icon}</div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold font-['Lalezar',sans-serif] leading-tight">
                  {headerMeta.title}
                </h2>
                <p
                  className={`text-[11px] font-semibold mt-0.5 ${
                    darkMode ? 'text-[#c4b5fd]' : 'text-[#166534]'
                  }`}
                >
                  {headerMeta.subtitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن راهنما"
              className={`p-1.5 rounded-xl transition-colors shrink-0 ${
                darkMode
                  ? 'bg-[#2e224b] text-[#d8b4fe] hover:text-white hover:bg-[#3c2d62]'
                  : 'bg-[#eefaf2] text-[#166534] hover:text-[#14532d] hover:bg-[#dcfce7]'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 3-Slide Stepper Tabs */}
          <div
            role="tablist"
            aria-label="صفحات راهنما"
            className={`grid grid-cols-3 gap-1 p-1 rounded-xl mb-4 ${
              darkMode ? 'bg-[#150f24]' : 'bg-[#e3f6ea]'
            }`}
          >
            {SLIDE_TABS.map((tab) => {
              const isSelected = activeSlide === tab.index;
              return (
                <button
                  key={tab.index}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveSlide(tab.index)}
                  className={`py-1.5 px-1.5 rounded-lg text-[11px] font-extrabold whitespace-nowrap transition-colors ${
                    isSelected
                      ? darkMode
                        ? 'bg-[#15803d] text-white shadow-xs'
                        : 'bg-[#7e22ce] text-white shadow-xs'
                      : darkMode
                      ? 'text-[#c4b5fd] hover:text-white hover:bg-[#2a1f44]'
                      : 'text-[#166534] hover:bg-[#ccefd9]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* SLIDE 1: Game Guide — Mock Grid & Step-by-Step Solved Example («گلاب») */}
          {activeSlide === 0 && (
            <div className="space-y-3 text-xs sm:text-sm">
              {/* Concise Gameplay Overview */}
              <div
                className={`p-3 rounded-xl font-semibold leading-relaxed ${stepCardClass}`}
              >
                در <strong>کلمباز</strong> باید کلمه پنهان امروز (۴، ۵ یا ۶ حرفی) را در{' '}
                <strong className={darkMode ? 'text-[#4ade80]' : 'text-[#6b21a8]'}>
                  ۶ تلاش
                </strong>{' '}
                حدس بزنید. بعد از هر حدس و زدن{' '}
                <strong className={darkMode ? 'text-[#4ade80]' : 'text-[#6b21a8]'}>
                  ثبت
                </strong>
                ، رنگ هر خانه وضعیت آن حرف را نشان می‌دهد:
              </div>

              {/* Compact 3-Color Logic Key */}
              <div className="grid grid-cols-3 gap-1.5 text-[10px] sm:text-[11px] font-extrabold text-center">
                <div
                  className={`py-2 px-1.5 rounded-xl flex flex-col items-center gap-1 ${
                    darkMode
                      ? 'bg-[#16422b] text-[#dcfce7]'
                      : 'bg-[#dcfce7] text-[#14532d]'
                  }`}
                >
                  <span className="inline-block w-3 h-3 rounded-xs bg-[#16a34a]" />
                  <span>سبز: حرف و جای درست</span>
                </div>
                <div
                  className={`py-2 px-1.5 rounded-xl flex flex-col items-center gap-1 ${
                    darkMode
                      ? 'bg-[#3d2312] text-[#ffedd5]'
                      : 'bg-[#fef3c7] text-[#78350f]'
                  }`}
                >
                  <span className="inline-block w-3 h-3 rounded-xs bg-[#f97316]" />
                  <span>نارنجی: هست، جای غلط</span>
                </div>
                <div
                  className={`py-2 px-1.5 rounded-xl flex flex-col items-center gap-1 ${stepCardClass}`}
                >
                  <span
                    className={`inline-block w-3 h-3 rounded-xs ${absentTile}`}
                  />
                  <span>تیره: در کلمه نیست</span>
                </div>
              </div>

              {/* Authentic Stacked Mock Board + Step-by-Step Explanations */}
              <div
                className={`p-3.5 rounded-2xl space-y-3 ${
                  darkMode ? 'bg-[#171126]' : 'bg-[#eefaf2]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black">
                    مثال یک جدول حل‌شده (قدم‌به‌قدم)
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                      darkMode
                        ? 'bg-[#16422b] text-[#86efac]'
                        : 'bg-[#dcfce7] text-[#15803d]'
                    }`}
                  >
                    جواب مخفی: «{MOCK_SOLVED_TARGET}»
                  </span>
                </div>

                {/* Stacked Mock Wordle Grid (3 Guess Rows) */}
                <div
                  role="group"
                  aria-label={`جدول نمونه حل کلمه ${MOCK_SOLVED_TARGET}`}
                  className={`p-2 rounded-xl space-y-1.5 ${
                    darkMode ? 'bg-[#211836]' : 'bg-white'
                  }`}
                >
                  {MOCK_SOLVED_STEPS.map((step) => {
                    const isFocused = focusedStep === step.stepNum;
                    const isSolvedRow = step.stepNum === 3;
                    return (
                      <button
                        key={step.stepNum}
                        type="button"
                        onClick={() => setFocusedStep(step.stepNum)}
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl transition-colors text-right ${
                          isFocused
                            ? isSolvedRow
                              ? darkMode
                                ? 'bg-[#16422b]'
                                : 'bg-[#dcfce7]'
                              : darkMode
                              ? 'bg-[#312352]'
                              : 'bg-[#ede9fe]'
                            : darkMode
                            ? 'hover:bg-[#2a1f44]'
                            : 'hover:bg-[#f2fbf5]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 ${
                              isSolvedRow
                                ? 'bg-[#15803d] text-white'
                                : isFocused
                                ? 'bg-[#7e22ce] text-white'
                                : darkMode
                                ? 'bg-[#2e224b] text-[#c4b5fd]'
                                : 'bg-[#dff5e7] text-[#166534]'
                            }`}
                          >
                            {step.badge}
                          </span>
                          <span
                            className={`text-xs font-extrabold truncate ${
                              darkMode ? 'text-[#f5f3ff]' : 'text-[#14532d]'
                            }`}
                          >
                            «{step.word}»
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-1.5 shrink-0">
                          {step.tiles.map((tile, tIdx) => {
                            const tileClass =
                              tile.status === 'correct'
                                ? 'bg-[#16a34a] text-white'
                                : tile.status === 'present'
                                ? 'bg-[#f97316] text-white'
                                : absentTile;
                            return (
                              <div
                                key={`${step.stepNum}-${tIdx}`}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm select-none ${tileClass}`}
                              >
                                {tile.letter}
                              </div>
                            );
                          })}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Step-by-Step Color Logic Breakdown */}
                <div className="space-y-1.5">
                  {MOCK_SOLVED_STEPS.map((step) => {
                    const isFocused = focusedStep === step.stepNum;
                    const isSolvedRow = step.stepNum === 3;
                    return (
                      <button
                        key={`explain-${step.stepNum}`}
                        type="button"
                        onClick={() => setFocusedStep(step.stepNum)}
                        className={`w-full text-right p-2.5 rounded-xl transition-colors flex items-start gap-2 ${
                          isFocused
                            ? isSolvedRow
                              ? darkMode
                                ? 'bg-[#16422b] text-[#dcfce7]'
                                : 'bg-[#dcfce7] text-[#14532d]'
                              : darkMode
                              ? 'bg-[#312352] text-[#f5f3ff]'
                              : 'bg-[#ede9fe] text-[#3b0764]'
                            : darkMode
                            ? 'bg-[#211836] text-[#d8c7f0] hover:bg-[#2a1f44]'
                            : 'bg-white text-[#166534] hover:bg-[#f2fbf5]'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 ${
                            isSolvedRow
                              ? 'bg-[#15803d] text-white'
                              : darkMode
                              ? 'bg-[#7e22ce] text-white'
                              : 'bg-[#15803d] text-white'
                          }`}
                        >
                          {step.stepNum.toLocaleString('fa-IR')}
                        </span>
                        <span className="text-[11px] font-semibold leading-relaxed">
                          <strong className="font-extrabold">«{step.word}»:</strong>{' '}
                          {step.explanation}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Tips */}
              <div className="grid grid-cols-1 gap-2 pt-0.5">
                <div
                  className={`flex items-start gap-2 p-3 rounded-xl text-xs ${
                    darkMode
                      ? 'bg-[#2a1f45] text-[#e9d5ff]'
                      : 'bg-[#dcfce7] text-[#14532d]'
                  }`}
                >
                  <Lightbulb
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      darkMode ? 'text-[#fde047]' : 'text-[#6b21a8]'
                    }`}
                  />
                  <span>
                    <strong>بذر و راهنما:</strong> با {STARTING_POINTS.toLocaleString('fa-IR')} بذر شروع می‌کنید و با هر برد بذر جایزه می‌گیرید. پس از ورود به حساب کاربری، با {HINT_COST.toLocaleString('fa-IR')} بذر می‌توانید یک حرف سبز را ببینید.
                  </span>
                </div>

                <div
                  className={`flex items-start gap-2 p-3 rounded-xl text-xs ${
                    darkMode
                      ? 'bg-[#2a1f45] text-[#e9d5ff]'
                      : 'bg-[#dcfce7] text-[#14532d]'
                  }`}
                >
                  <Keyboard
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      darkMode ? 'text-[#4ade80]' : 'text-[#15803d]'
                    }`}
                  />
                  <span>
                    <strong>حروف آ، ژ، ئ:</strong> روی کلیدهای «ا»، «ز» یا «ی» کمی نگه دارید (یا کلیک‌راست کنید).
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 2: Chrome Phone Install / Home Screen Shortcut Guide */}
          {activeSlide === 1 && (
            <div className="space-y-3 text-xs sm:text-sm">
              {/* Installed Status or Direct Install CTA */}
              {isInstalled ? (
                <div
                  className={`p-3 rounded-xl flex items-center gap-2 font-extrabold text-xs ${
                    darkMode
                      ? 'bg-[#16422b] text-[#dcfce7]'
                      : 'bg-[#dcfce7] text-[#14532d]'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-[#22c55e]" />
                  <span>کلمباز هم‌اکنون به عنوان اپلیکیشن روی دستگاه شما نصب است!</span>
                </div>
              ) : isInstallable && onInstallApp ? (
                <button
                  type="button"
                  onClick={onInstallApp}
                  className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors active:scale-98 ${primaryBtnClass}`}
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>نصب مستقیم کلمباز روی صفحه گوشی</span>
                </button>
              ) : null}

              <div className={`p-3 rounded-xl font-semibold leading-relaxed ${stepCardClass}`}>
                با نصب کلمباز از طریق <strong className={darkMode ? 'text-[#4ade80]' : 'text-[#6b21a8]'}>مرورگر کروم (Chrome)</strong>، آیکون 🥦 کلمباز روی صفحه اصلی گوشی شما قرار می‌گیرد و هر روز با یک لمس تمام‌صفحه باز می‌شود:
              </div>

              {/* 3 Clear Chrome Steps */}
              <div className="space-y-2">
                <div className={`p-3 rounded-xl flex items-start gap-2.5 ${stepCardClass}`}>
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${stepBadgeClass}`}>
                    ۱
                  </span>
                  <div className="space-y-1 flex-1">
                    <div className="font-extrabold flex items-center gap-1.5">
                      <span>منوی سه‌نقطه کروم را باز کنید</span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-black ${
                          darkMode
                            ? 'bg-[#2e224b] text-[#d8b4fe]'
                            : 'bg-white text-[#6b21a8]'
                        }`}
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-[#c4b5fd]' : 'text-[#166534]'}`}>
                      در مرورگر <strong>Chrome</strong> گوشی، روی آیکون سه‌نقطه (⋮) در گوشه بالای صفحه ضربه بزنید.
                    </p>
                  </div>
                </div>

                <div className={`p-3 rounded-xl flex items-start gap-2.5 ${stepCardClass}`}>
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${stepBadgeClass}`}>
                    ۲
                  </span>
                  <div className="space-y-1 flex-1">
                    <div className="font-extrabold flex items-center gap-1.5">
                      <span>گزینه «نصب برنامه» یا «افزودن به صفحه اصلی» را بزنید</span>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-[#c4b5fd]' : 'text-[#166534]'}`}>
                      در منوی بازشده، روی <strong>Install app</strong> (نصب برنامه) یا <strong>Add to Home screen</strong> (افزودن به صفحه اصلی) بزنید.
                    </p>
                  </div>
                </div>

                <div className={`p-3 rounded-xl flex items-start gap-2.5 ${stepCardClass}`}>
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${stepBadgeClass}`}>
                    ۳
                  </span>
                  <div className="space-y-1 flex-1">
                    <div className="font-extrabold">تأیید نصب و ساخت میانبر 🥦</div>
                    <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-[#c4b5fd]' : 'text-[#166534]'}`}>
                      روی <strong>Install / Add</strong> بزنید. میانبر کلمباز به صفحه گوشی شما اضافه می‌شود و بدون نوار آدرس مرورگر باز خواهد شد.
                    </p>
                  </div>
                </div>
              </div>

              {/* Compact iOS Safari tip */}
              <div
                className={`flex items-start gap-2 p-3 rounded-xl text-[11px] ${
                  isIOS
                    ? darkMode
                      ? 'bg-[#16422b] text-[#dcfce7]'
                      : 'bg-[#ede9fe] text-[#581c87]'
                    : darkMode
                    ? 'bg-[#2a1f45] text-[#e9d5ff]'
                    : 'bg-[#dcfce7] text-[#14532d]'
                }`}
              >
                <Share className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>کاربران آیفون (Safari):</strong> دکمه اشتراک‌گذاری (Share) پایین مرورگر را بزنید و سپس گزینه <strong>Add to Home Screen</strong> را انتخاب کنید.
                </span>
              </div>
            </div>
          )}

          {/* SLIDE 3: Daily Notifications & How to Enable Guide */}
          {activeSlide === 2 && (
            <div className="space-y-3 text-xs sm:text-sm">
              {/* Live Notification Status & Action */}
              {isNotifActive ? (
                <div
                  className={`p-3 rounded-xl space-y-2.5 ${
                    darkMode
                      ? 'bg-[#16422b] text-[#dcfce7]'
                      : 'bg-[#dcfce7] text-[#14532d]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-extrabold text-xs">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-[#22c55e]" />
                    <span>اعلان روزانه کلمباز برای شما فعال است!</span>
                  </div>
                  {onSendTestNotification && (
                    <button
                      type="button"
                      onClick={onSendTestNotification}
                      className={`w-full py-2 px-3 rounded-xl font-extrabold text-xs transition-colors ${secondaryBtnClass}`}
                    >
                      ارسال یک اعلان آزمایشی 🔔
                    </button>
                  )}
                </div>
              ) : notificationPermission === 'denied' ? (
                <div
                  className={`p-3 rounded-xl space-y-2 text-xs ${
                    darkMode
                      ? 'bg-[#3d1727] text-rose-100'
                      : 'bg-rose-100 text-rose-900'
                  }`}
                >
                  <div className="font-extrabold flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 shrink-0" />
                    <span>اعلان‌ها در مرورگر مسدود شده‌اند</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    برای فعال‌سازی مجدد در کروم، روی آیکون تنظیمات/قفل کنار آدرس <strong>kalambaz.ir</strong> بزنید ← <strong>مجوزها (Permissions)</strong> ← <strong>اعلان‌ها (Notifications)</strong> ← <strong>اجازه دادن (Allow)</strong>.
                  </p>
                  {onEnableNotifications && (
                    <button
                      type="button"
                      onClick={onEnableNotifications}
                      className={`w-full py-2 px-3 rounded-xl font-extrabold text-xs transition-colors ${secondaryBtnClass}`}
                    >
                      تغییر دادم، بررسی مجدد اعلان 🔔
                    </button>
                  )}
                </div>
              ) : notificationPermission === 'unsupported' ? (
                <div className={`p-3 rounded-xl text-xs font-bold ${stepCardClass}`}>
                  مرورگر فعلی شما از اعلان‌ها پشتیبانی نمی‌کند. برای دریافت اعلان روی گوشی، کلمباز را در <strong>Chrome</strong> باز کنید یا روی صفحه اصلی نصب نمایید.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onEnableNotifications}
                  className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors active:scale-98 ${primaryBtnClass}`}
                >
                  <Bell className="w-4 h-4 shrink-0" />
                  <span>فعال‌سازی اعلان روزانه کلمباز 🔔</span>
                </button>
              )}

              <div className={`p-3 rounded-xl font-semibold leading-relaxed ${stepCardClass}`}>
                با فعال کردن اعلان‌ها، هر روز با منتشر شدن کلمات جدید (ساعت ۰۰:۰۰ به وقت تهران) به شما یادآوری می‌کنیم تا بازی روز را از دست ندهید و استریک خود را حفظ کنید:
              </div>

              {/* Step-by-step Notification Guide */}
              <div className="space-y-2">
                <div className={`p-3 rounded-xl flex items-start gap-2.5 ${stepCardClass}`}>
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${stepBadgeClass}`}>
                    ۱
                  </span>
                  <div className="space-y-0.5 flex-1">
                    <div className="font-extrabold">دکمه فعال‌سازی اعلان را بزنید</div>
                    <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-[#c4b5fd]' : 'text-[#166534]'}`}>
                      روی دکمه <strong>«فعال‌سازی اعلان روزانه»</strong> در بالا بزنید (یا هر زمان خواستید از بخش <strong>تنظیمات ⚙️</strong> آن را روشن/خاموش کنید).
                    </p>
                  </div>
                </div>

                <div className={`p-3 rounded-xl flex items-start gap-2.5 ${stepCardClass}`}>
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${stepBadgeClass}`}>
                    ۲
                  </span>
                  <div className="space-y-0.5 flex-1">
                    <div className="font-extrabold">در پنجره کروم گزینه «اجازه دادن» (Allow) را بزنید</div>
                    <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-[#c4b5fd]' : 'text-[#166534]'}`}>
                      پس از تأیید، یک اعلان آزمایشی بلافاصله ارسال می‌شود تا مطمئن شوید اعلان‌های گوشی برای کلمباز روشن هستند.
                    </p>
                  </div>
                </div>

                <div className={`p-3 rounded-xl flex items-start gap-2.5 ${stepCardClass}`}>
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${stepBadgeClass}`}>
                    ۳
                  </span>
                  <div className="space-y-0.5 flex-1">
                    <div className="font-extrabold">تنظیم در صورت خاموش بودن اعلان مرورگر</div>
                    <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-[#c4b5fd]' : 'text-[#166534]'}`}>
                      اگر قبلاً گزینه Block را زده‌اید، از کنار آدرس سایت در کروم وارد <strong>Site settings → Notifications</strong> شوید و آن را روی <strong>Allow</strong> بگذارید.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Navigation Controls + Dots */}
          <div className="pt-4 mt-4 space-y-2.5">
            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
              {([0, 1, 2] as const).map((idx) => (
                <span
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    activeSlide === idx
                      ? darkMode
                        ? 'w-6 bg-[#22c55e]'
                        : 'w-6 bg-[#7e22ce]'
                      : darkMode
                      ? 'w-2 bg-[#3d2e62]'
                      : 'w-2 bg-[#bbf7d0]'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {activeSlide > 0 ? (
                <button
                  type="button"
                  onClick={goPrev}
                  className={`py-2.5 px-3.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1 transition-colors shrink-0 ${secondaryBtnClass}`}
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>قبلی</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className={`py-2.5 px-3.5 rounded-xl font-bold text-xs sm:text-sm transition-colors shrink-0 ${secondaryBtnClass}`}
                >
                  شروع بازی
                </button>
              )}

              <button
                type="button"
                onClick={goNext}
                className={`flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors ${primaryBtnClass}`}
              >
                {activeSlide === 0 ? (
                  <>
                    <span>بعدی: نصب روی گوشی</span>
                    <ChevronLeft className="w-4 h-4" />
                  </>
                ) : activeSlide === 1 ? (
                  <>
                    <span>بعدی: فعال‌سازی اعلان</span>
                    <ChevronLeft className="w-4 h-4" />
                  </>
                ) : (
                  <span>فهمیدم، بزن بریم بازی! 🥦</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
