import React, { useState } from 'react';
import { User, Lock, KeyRound, UserPlus, LogIn, X, AlertCircle, Loader2 } from 'lucide-react';
import { UserAccount } from '../../types';
import { apiLogin, apiSignup } from '../../utils/api';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (account: UserAccount) => void;
  onClose: () => void;
  currentUsername?: string;
  onLogout?: () => void;
  darkMode?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onLoginSuccess,
  onClose,
  currentUsername,
  onLogout,
  darkMode = true,
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

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
      // Check if user had a legacy localStorage account that needs one-time migration to SQLite
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
      const { account } = await apiSignup(cleanUsername, password);
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
    >
      <div
        className={`relative w-full max-w-sm rounded-2xl border-2 p-5 sm:p-6 shadow-2xl ${
          darkMode
            ? 'bg-gradient-to-br from-[#23173b] via-[#1d2236] to-[#152b26] border-[#543c7d]/75 text-[#f2edfa]'
            : 'bg-gradient-to-br from-[#e6f3ec] via-[#eef6f1] to-[#ece4f6] border-[#82b59d] text-[#17382b]'
        }`}
      >
        {/* Close Button if already has account */}
        {currentUsername && (
          <button
            onClick={onClose}
            aria-label="بستن پنجره"
            className={`absolute top-4 left-4 p-1.5 rounded-lg transition-colors ${
              darkMode
                ? 'text-[#d8b4fe] hover:text-white hover:bg-[#31214f]/60'
                : 'text-[#215c46] hover:text-[#123628] hover:bg-[#cfe5da]/60'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-5">
          <div
            className={`w-14 h-14 mx-auto mb-2 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-2 ${
              darkMode
                ? 'bg-gradient-to-br from-[#237a5b] to-[#3f2b69] border-[#6ee7b7]/70'
                : 'bg-gradient-to-br from-[#5c328c] to-[#266b52] border-[#482373]'
            }`}
          >
            🥬
          </div>
          <h2 className="text-xl font-black font-['Lalezar',sans-serif]">
            حساب کاربری کلمباز
          </h2>
          <p
            className={`text-xs font-semibold mt-1 ${
              darkMode ? 'text-[#d8c7f0]' : 'text-[#215c46]'
            }`}
          >
            ورود با نام و رمز عبور برای ذخیره و پیگیری استریک و پیشرفت
          </p>
        </div>

        {/* Currently logged-in indicator */}
        {currentUsername && (
          <div
            className={`mb-4 p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
              darkMode
                ? 'bg-[#26193d]/80 border-[#543c7d] text-[#f2edfa]'
                : 'bg-[#dfeee6] border-[#82b59d] text-[#17382b]'
            }`}
          >
            <span>
              حساب فعال:{' '}
              <strong
                className={darkMode ? 'text-[#86efac]' : 'text-[#5c328c]'}
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
          className={`flex rounded-xl p-1 mb-4 border-2 ${
            darkMode
              ? 'bg-[#1a122b]/90 border-[#4b3570]/75'
              : 'bg-[#d9ece2]/90 border-[#85b8a0]/80'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'login'
                ? darkMode
                  ? 'bg-gradient-to-r from-[#237a5b] to-[#3f2b69] text-white shadow-xs'
                  : 'bg-gradient-to-r from-[#5c328c] to-[#266b52] text-white shadow-xs'
                : darkMode
                ? 'text-[#d8b4fe] hover:text-white'
                : 'text-[#1c4233] hover:text-[#122e22]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>ورود</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setErrorMessage('');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'signup'
                ? darkMode
                  ? 'bg-gradient-to-r from-[#237a5b] to-[#3f2b69] text-white shadow-xs'
                  : 'bg-gradient-to-r from-[#5c328c] to-[#266b52] text-white shadow-xs'
                : darkMode
                ? 'text-[#d8b4fe] hover:text-white'
                : 'text-[#1c4233] hover:text-[#122e22]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>ثبت‌نام</span>
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-600 text-white flex items-center gap-2 text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={tab === 'login' ? handleLogin : handleSignup} className="space-y-3.5">
          {/* Username */}
          <div>
            <label
              htmlFor="auth-username"
              className={`block text-xs font-extrabold mb-1 ${
                darkMode ? 'text-[#86efac]' : 'text-[#5c328c]'
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
                    : 'bg-[#f6f3fa] border-[#82b59d] text-[#17382b] placeholder-[#527a68] focus:border-[#5c328c]'
                }`}
              />
              <User
                className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 ${
                  darkMode ? 'text-[#86efac]' : 'text-[#5c328c]'
                }`}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="auth-password"
              className={`block text-xs font-extrabold mb-1 ${
                darkMode ? 'text-[#d8b4fe]' : 'text-[#21664d]'
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
                    : 'bg-[#eef7f2] border-[#9b7ec7] text-[#17382b] placeholder-[#68548c] focus:border-[#21664d]'
                }`}
              />
              <Lock
                className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 ${
                  darkMode ? 'text-[#d8b4fe]' : 'text-[#21664d]'
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
                  darkMode ? 'text-[#86efac]' : 'text-[#5c328c]'
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
                      : 'bg-[#f6f3fa] border-[#82b59d] text-[#17382b] placeholder-[#527a68] focus:border-[#5c328c]'
                  }`}
                />
                <KeyRound
                  className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 ${
                    darkMode ? 'text-[#86efac]' : 'text-[#5c328c]'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-white shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-60 ${
                darkMode
                  ? 'bg-gradient-to-r from-[#237a5b] to-[#3f2b69] hover:from-[#298f6b] hover:to-[#4c357d]'
                  : 'bg-gradient-to-r from-[#5c328c] to-[#266b52] hover:from-[#6b3ba1] hover:to-[#2d7d60]'
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
                  <span>ایجاد حساب جدید</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
