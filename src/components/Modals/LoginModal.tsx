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
} from 'lucide-react';
import { UserAccount, PlayerStats, DailyGameState } from '../../types';
import { apiLogin, apiSignup } from '../../utils/api';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (account: UserAccount) => void;
  onClose: () => void;
  currentUsername?: string;
  onLogout?: () => void;
  darkMode?: boolean;
  promptReason?: 'default' | 'first_win';
  guestStats?: PlayerStats;
  guestGameStates?: { [len: number]: DailyGameState };
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
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>(
    promptReason === 'first_win' ? 'signup' : 'login'
  );
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default to Sign Up tab when prompting right after the first solved puzzle
  useEffect(() => {
    if (isOpen) {
      setTab(promptReason === 'first_win' ? 'signup' : 'login');
      setErrorMessage('');
    }
  }, [isOpen, promptReason]);

  if (!isOpen) return null;

  const isFirstWinPrompt = promptReason === 'first_win' && !currentUsername;

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
      // Carry over current guest progress (solved puzzle, streak, seeds) into the new account!
      const { account } = await apiSignup(
        cleanUsername,
        password,
        guestStats,
        guestGameStates
      );
      const accounts = getStoredAccounts();
      accounts[account.username] = account;
      saveStoredAccounts(accounts);
      onLoginSuccess(account);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'خطا در ایجاد حساب کاربری.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ورود و ثبت‌نام حساب کلمباز"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-sm rounded-2xl border-2 p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[92vh] ${
          darkMode
            ? 'bg-[#201733] border-[#433266] text-[#f5f3ff]'
            : 'bg-white border-[#86efac] text-[#14532d]'
        }`}
      >
        {/* Always-visible Close Button (login is optional) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="بستن پنجره"
          className={`absolute top-4 left-4 p-1.5 rounded-lg transition-colors ${
            darkMode
              ? 'text-[#c4b5fd] hover:text-white hover:bg-[#291e40]'
              : 'text-[#166534] hover:text-[#14532d] hover:bg-[#dcfce7]'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <div
            className={`w-13 h-13 mx-auto mb-2 rounded-2xl flex items-center justify-center text-3xl border-2 ${
              darkMode
                ? 'bg-[#143d25] border-[#22c55e]'
                : 'bg-[#f3e8ff] border-[#9333ea]'
            }`}
          >
            {isFirstWinPrompt ? '🎉' : '🥦'}
          </div>
          <h2 className="text-xl font-black font-['Lalezar',sans-serif]">
            {isFirstWinPrompt
              ? 'آفرین! اولین معما را حل کردید!'
              : 'حساب کاربری کلمباز'}
          </h2>
          <p
            className={`text-xs font-semibold mt-1 leading-relaxed ${
              darkMode ? 'text-[#d8c7f0]' : 'text-[#166534]'
            }`}
          >
            {isFirstWinPrompt
              ? 'حساب بسازید یا وارد حساب قبلی شوید تا امتیاز و پیشرفت شما ذخیره بماند:'
              : 'ورود با نام و رمز عبور برای ذخیره استریک، بذرها و اشتراک‌گذاری نتایج'}
          </p>
        </div>

        {/* Post-first-win benefits list */}
        {isFirstWinPrompt && (
          <div
            className={`mb-4 p-3 rounded-xl border space-y-1.5 text-[11px] font-bold ${
              darkMode
                ? 'bg-[#161022] border-[#362854] text-[#e9d5ff]'
                : 'bg-[#f0fdf4] border-[#86efac] text-[#14532d]'
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
              <span>ذخیره بذرها و ادامه بازی روی هر دستگاه دیگر</span>
            </div>
          </div>
        )}

        {/* Currently logged-in indicator */}
        {currentUsername && (
          <div
            className={`mb-4 p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
              darkMode
                ? 'bg-[#26193d]/80 border-[#543c7d] text-[#f2edfa]'
                : 'bg-[#dcfce7] border-[#86efac] text-[#14532d]'
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
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                خروج
              </button>
            )}
          </div>
        )}

        {/* Tabs: Login / Sign Up */}
        <div
          className={`flex rounded-xl p-1 mb-4 border ${
            darkMode
              ? 'bg-[#161022] border-[#362854]'
              : 'bg-[#dcfce7] border-[#86efac]'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setErrorMessage('');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-colors flex items-center justify-center gap-1.5 ${
              tab === 'signup'
                ? darkMode
                  ? 'bg-[#15803d] text-white'
                  : 'bg-[#6b21a8] text-white'
                : darkMode
                ? 'text-[#c4b5fd] hover:text-white'
                : 'text-[#166534] hover:text-[#14532d]'
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
            className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-colors flex items-center justify-center gap-1.5 ${
              tab === 'login'
                ? darkMode
                  ? 'bg-[#6b21a8] text-white'
                  : 'bg-[#15803d] text-white'
                : darkMode
                ? 'text-[#c4b5fd] hover:text-white'
                : 'text-[#166534] hover:text-[#14532d]'
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
                className={`w-full pl-3 pr-9 py-2 rounded-xl border-2 text-xs font-bold focus:outline-hidden text-right ${
                  darkMode
                    ? 'bg-[#1c132e]/90 border-[#543c7d] text-white placeholder-[#a594c4] focus:border-[#6ee7b7]'
                    : 'bg-[#f0fdf4] border-[#86efac] text-[#14532d] placeholder-[#4d7c5f] focus:border-[#6b21a8]'
                }`}
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
                className={`w-full pl-3 pr-9 py-2 rounded-xl border-2 text-xs font-bold focus:outline-hidden text-right ${
                  darkMode
                    ? 'bg-[#172e28]/90 border-[#3d8b73]/75 text-white placeholder-[#82b5a5] focus:border-[#d8b4fe]'
                    : 'bg-[#f0fdf4] border-[#86efac] text-[#14532d] placeholder-[#4d7c5f] focus:border-[#6b21a8]'
                }`}
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
                  className={`w-full pl-3 pr-9 py-2 rounded-xl border-2 text-xs font-bold focus:outline-hidden text-right ${
                    darkMode
                      ? 'bg-[#1c132e]/90 border-[#543c7d] text-white placeholder-[#a594c4] focus:border-[#6ee7b7]'
                      : 'bg-[#f0fdf4] border-[#86efac] text-[#14532d] placeholder-[#4d7c5f] focus:border-[#6b21a8]'
                  }`}
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
              className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-white active:scale-98 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-60 ${
                darkMode
                  ? 'bg-[#15803d] hover:bg-[#16a34a]'
                  : 'bg-[#6b21a8] hover:bg-[#7e22ce]'
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
                className={`w-full py-2 px-4 rounded-xl font-bold text-xs transition-colors border ${
                  darkMode
                    ? 'bg-[#291e40] border-[#433266] text-[#c4b5fd] hover:text-white hover:bg-[#352752]'
                    : 'bg-[#dcfce7] border-[#86efac] text-[#166534] hover:bg-[#bbf7d0]'
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
