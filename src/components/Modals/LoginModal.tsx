import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  KeyRound,
  UserPlus,
  LogIn,
  X,
  AlertCircle,
  Loader2,
  Flame,
  Share2,
  Sparkles,
  Gift,
} from 'lucide-react';
import { UserAccount, PlayerStats, DailyGameState } from '../../types';
import { apiLogin, apiSignup } from '../../utils/api';
import { REFERRAL_REWARD_POINTS } from '../../utils/referral';
import { ReferralCard } from '../ReferralCard';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (account: UserAccount) => void;
  onClose: () => void;
  currentUsername?: string;
  onLogout?: () => void;
  darkMode?: boolean;
  promptReason?: 'default' | 'first_win' | 'hint_required';
  guestStats?: PlayerStats;
  guestGameStates?: { [len: number]: DailyGameState };
  pendingReferrer?: string | null;
  referralsCount?: number;
  referralPointsEarned?: number;
  onNotify?: (msg: string) => void;
  onReferralConsumed?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onLoginSuccess,
  onClose,
  currentUsername,
  onLogout,
  darkMode = true,
  promptReason = 'default',
  guestStats,
  guestGameStates,
  pendingReferrer = null,
  referralsCount = 0,
  referralPointsEarned = 0,
  onNotify,
  onReferralConsumed,
}) => {
  const shouldDefaultSignup =
    promptReason === 'first_win' || (!currentUsername && Boolean(pendingReferrer));
  const [tab, setTab] = useState<'login' | 'signup'>(
    shouldDefaultSignup ? 'signup' : 'login'
  );
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default to Sign Up tab when prompting right after the first solved puzzle or via referral link
  useEffect(() => {
    if (isOpen) {
      setTab(
        promptReason === 'first_win' || (!currentUsername && Boolean(pendingReferrer))
          ? 'signup'
          : 'login'
      );
      setErrorMessage('');
    }
  }, [isOpen, promptReason, currentUsername, pendingReferrer]);

  if (!isOpen) return null;

  const isFirstWinPrompt = promptReason === 'first_win' && !currentUsername;
  const isHintPrompt = promptReason === 'hint_required' && !currentUsername;

  // Retrieve cached accounts from localStorage for offline fallback / legacy migration
  const getStoredAccounts = (): { [username: string]: UserAccount } => {
    try {
      const data = localStorage.getItem('kalabaz_accounts');
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  };

  const saveStoredAccounts = (accounts: { [username: string]: UserAccount }) => {
    try {
      localStorage.setItem('kalabaz_accounts', JSON.stringify(accounts));
    } catch {}
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setErrorMessage('لطفاً نام کاربری را وارد کنید.');
      return;
    }
    if (!password) {
      setErrorMessage('لطفاً رمز عبور را وارد کنید.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { account } = await apiLogin(cleanUsername, password);
      const accounts = getStoredAccounts();
      accounts[account.username] = account;
      saveStoredAccounts(accounts);
      onLoginSuccess(account);
      onClose();
    } catch (err: any) {
      // Check if user had a legacy localStorage account that needs one-time migration
      const localAccounts = getStoredAccounts();
      const legacy = localAccounts[cleanUsername];
      if (legacy && legacy.password === password) {
        try {
          const { account } = await apiSignup(
            cleanUsername,
            password,
            legacy.stats,
            legacy.gameStates
          );
          localAccounts[account.username] = account;
          saveStoredAccounts(localAccounts);
          onLoginSuccess(account);
          onClose();
          return;
        } catch {}
      }
      setErrorMessage(err?.message || 'خطا در ورود به حساب کاربری.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setErrorMessage('لطفاً نام کاربری را وارد کنید.');
      return;
    }
    if (cleanUsername.length < 2) {
      setErrorMessage('نام کاربری باید حداقل ۲ نویسه باشد.');
      return;
    }
    if (password.length < 4) {
      setErrorMessage('رمز عبور باید حداقل ۴ نویسه باشد.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('تکرار رمز عبور با رمز اصلی یکسان نیست.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Carry over current guest progress (solved puzzle, streak, seeds) and optional referral into the new account
      const { account, referralApplied } = await apiSignup(
        cleanUsername,
        password,
        guestStats,
        guestGameStates,
        pendingReferrer
      );
      const accounts = getStoredAccounts();
      accounts[account.username] = account;
      saveStoredAccounts(accounts);
      onReferralConsumed?.();
      if (referralApplied && pendingReferrer) {
        onNotify?.(
          `🎁 دعوت «${pendingReferrer}» ثبت شد و ${REFERRAL_REWARD_POINTS.toLocaleString('fa-IR')} بذر هدیه به ایشان تعلق گرفت!`
        );
      }
      onLoginSuccess(account);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'خطا در ایجاد حساب کاربری.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = darkMode
    ? 'bg-[#161024] text-white placeholder-[#8e7fb0] focus:ring-2 focus:ring-[#4ade80]'
    : 'bg-[#eefaf2] text-[#14532d] placeholder-[#527d63] focus:ring-2 focus:ring-[#7e22ce]';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ورود و ثبت‌نام حساب کلمباز"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-[2px] animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-sm rounded-2xl p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[92vh] ${
          darkMode
            ? 'bg-[#211836] text-[#f5f3ff] shadow-black/50'
            : 'bg-white text-[#14532d] shadow-emerald-950/15'
        }`}
      >
        {/* Always-visible Close Button (login is optional) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="بستن پنجره"
          className={`absolute top-4 left-4 p-1.5 rounded-xl transition-colors ${
            darkMode
              ? 'bg-[#2e224b] text-[#d8b4fe] hover:text-white hover:bg-[#3c2d62]'
              : 'bg-[#eefaf2] text-[#166534] hover:text-[#14532d] hover:bg-[#dcfce7]'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <div
            className={`w-13 h-13 mx-auto mb-2 rounded-2xl flex items-center justify-center text-3xl ${
              darkMode ? 'bg-[#16422b]' : 'bg-[#f3e8ff]'
            }`}
          >
            {isFirstWinPrompt ? '🎉' : isHintPrompt ? '💡' : '🥦'}
          </div>
          <h2 className="text-xl font-black font-['Lalezar',sans-serif]">
            {isFirstWinPrompt
              ? 'آفرین! اولین معما را حل کردید!'
              : isHintPrompt
              ? 'راهنما ویژه کاربران عضو است'
              : 'حساب کاربری کلمباز'}
          </h2>
          <p
            className={`text-xs font-semibold mt-1 leading-relaxed ${
              darkMode ? 'text-[#d8c7f0]' : 'text-[#166534]'
            }`}
          >
            {isFirstWinPrompt
              ? 'حساب بسازید یا وارد حساب قبلی شوید تا امتیاز و پیشرفت شما ذخیره بماند:'
              : isHintPrompt
              ? 'برای استفاده از راهنمای حرف سبز با بذرهایتان، وارد حساب کاربری شوید یا یک حساب رایگان بسازید.'
              : 'ورود با نام و رمز عبور برای ذخیره استریک، بذرها و استفاده از راهنما'}
          </p>
        </div>

        {/* Post-first-win benefits list */}
        {isFirstWinPrompt && (
          <div
            className={`mb-4 p-3 rounded-xl space-y-1.5 text-[11px] font-bold ${
              darkMode
                ? 'bg-[#171126] text-[#e9d5ff]'
                : 'bg-[#eefaf2] text-[#14532d]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Flame className={`w-3.5 h-3.5 shrink-0 ${darkMode ? 'text-[#4ade80]' : 'text-[#6b21a8]'}`} />
              <span>حفظ استریک روزانه و آمار بردهای شما</span>
            </div>
            <div className="flex items-center gap-2">
              <Share2 className={`w-3.5 h-3.5 shrink-0 ${darkMode ? 'text-[#4ade80]' : 'text-[#6b21a8]'}`} />
              <span>اشتراک‌گذاری نتیجه با دوستان و مقایسه امتیازها</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className={`w-3.5 h-3.5 shrink-0 ${darkMode ? 'text-[#4ade80]' : 'text-[#6b21a8]'}`} />
              <span>استفاده از بذرها برای راهنمای حرف سبز و ذخیره پیشرفت</span>
            </div>
          </div>
        )}

        {/* Referral invite banner for guests arriving via ?ref= */}
        {!currentUsername && pendingReferrer && (
          <div
            className={`mb-4 p-3 rounded-xl flex items-start gap-2 text-[11px] font-bold leading-relaxed ${
              darkMode
                ? 'bg-[#16422b] text-[#dcfce7]'
                : 'bg-[#dcfce7] text-[#14532d]'
            }`}
          >
            <Gift className="w-4 h-4 shrink-0 mt-0.5 text-[#4ade80]" />
            <span>
              دعوت‌شده توسط <strong>«{pendingReferrer}»</strong> — با ساخت حساب جدید،{' '}
              {REFERRAL_REWARD_POINTS.toLocaleString('fa-IR')} بذر راهنما به ایشان هدیه داده می‌شود!
            </span>
          </div>
        )}

        {/* Currently logged-in indicator + personal referral card */}
        {currentUsername && (
          <div className="mb-4 space-y-3">
            <div
              className={`p-3 rounded-xl flex items-center justify-between text-xs font-semibold ${
                darkMode
                  ? 'bg-[#2a1f45] text-[#f2edfa]'
                  : 'bg-[#dcfce7] text-[#14532d]'
              }`}
            >
              <span>
                حساب فعال:{' '}
                <strong
                  className={darkMode ? 'text-[#86efac]' : 'text-[#15803d]'}
                >
                  {currentUsername}
                </strong>
              </span>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors"
                >
                  خروج
                </button>
              )}
            </div>

            <ReferralCard
              username={currentUsername}
              referralsCount={referralsCount}
              referralPointsEarned={referralPointsEarned}
              darkMode={darkMode}
              onNotify={onNotify}
              compact
            />
          </div>
        )}

        {/* Tabs: Login / Sign Up */}
        <div
          className={`flex rounded-xl p-1 gap-1 mb-4 ${
            darkMode ? 'bg-[#150f24]' : 'bg-[#e3f6ea]'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-colors flex items-center justify-center gap-1.5 ${
              tab === 'signup'
                ? darkMode
                  ? 'bg-[#15803d] text-white shadow-xs'
                  : 'bg-[#7e22ce] text-white shadow-xs'
                : darkMode
                ? 'text-[#c4b5fd] hover:text-white hover:bg-[#2a1f44]'
                : 'text-[#166534] hover:bg-[#ccefd9]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>ساخت حساب جدید</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-colors flex items-center justify-center gap-1.5 ${
              tab === 'login'
                ? darkMode
                  ? 'bg-[#7e22ce] text-white shadow-xs'
                  : 'bg-[#15803d] text-white shadow-xs'
                : darkMode
                ? 'text-[#c4b5fd] hover:text-white hover:bg-[#2a1f44]'
                : 'text-[#166534] hover:bg-[#ccefd9]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>ورود به حساب</span>
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-600 text-white flex items-center gap-2 text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={tab === 'login' ? handleLogin : handleSignup} className="space-y-3">
          {/* Username */}
          <div>
            <label
              htmlFor="auth-username"
              className={`block text-xs font-extrabold mb-1 ${
                darkMode ? 'text-[#86efac]' : 'text-[#15803d]'
              }`}
            >
              نام / نام کاربری:
            </label>
            <div className="relative">
              <input
                id="auth-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="مثلاً: سهراب"
                maxLength={30}
                required
                className={`w-full pl-3 pr-9 py-2.5 rounded-xl text-xs font-bold focus:outline-hidden text-right transition-shadow ${inputClass}`}
              />
              <User
                className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 ${
                  darkMode ? 'text-[#86efac]' : 'text-[#15803d]'
                }`}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="auth-password"
              className={`block text-xs font-extrabold mb-1 ${
                darkMode ? 'text-[#d8b4fe]' : 'text-[#166534]'
              }`}
            >
              رمز عبور:
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="حداقل ۴ نویسه"
                required
                className={`w-full pl-3 pr-9 py-2.5 rounded-xl text-xs font-bold focus:outline-hidden text-right transition-shadow ${inputClass}`}
              />
              <Lock
                className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 ${
                  darkMode ? 'text-[#d8b4fe]' : 'text-[#166534]'
                }`}
              />
            </div>
          </div>

          {/* Confirm Password (Sign up only) */}
          {tab === 'signup' && (
            <div className="animate-fade-in">
              <label
                htmlFor="auth-confirm-password"
                className={`block text-xs font-extrabold mb-1 ${
                  darkMode ? 'text-[#86efac]' : 'text-[#15803d]'
                }`}
              >
                تکرار رمز عبور:
              </label>
              <div className="relative">
                <input
                  id="auth-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="تکرار رمز عبور"
                  required
                  className={`w-full pl-3 pr-9 py-2.5 rounded-xl text-xs font-bold focus:outline-hidden text-right transition-shadow ${inputClass}`}
                />
                <KeyRound
                  className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 ${
                    darkMode ? 'text-[#86efac]' : 'text-[#15803d]'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-white active:scale-98 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-60 shadow-sm ${
                darkMode
                  ? 'bg-[#16a34a] hover:bg-[#15803d]'
                  : 'bg-[#7e22ce] hover:bg-[#6b21a8]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال ارتباط با سرور...</span>
                </>
              ) : tab === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>ورود به حساب</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {isFirstWinPrompt
                      ? 'ساخت حساب و ذخیره استریک'
                      : 'ایجاد حساب جدید'}
                  </span>
                </>
              )}
            </button>

            {!currentUsername && (
              <button
                type="button"
                onClick={onClose}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-colors ${
                  darkMode
                    ? 'bg-[#2e224b] text-[#d8c8ff] hover:text-white hover:bg-[#3c2d62]'
                    : 'bg-[#dff5e7] text-[#14532d] hover:bg-[#c5ecd4]'
                }`}
              >
                فعلاً نه، ادامه به عنوان مهمان
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
