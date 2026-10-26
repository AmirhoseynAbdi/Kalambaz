import React, { useState } from 'react';
import { User, Lock, KeyRound, UserPlus, LogIn, X, AlertCircle } from 'lucide-react';
import { UserAccount } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (account: UserAccount) => void;
  onClose: () => void;
  currentUsername?: string;
  onLogout?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onLoginSuccess,
  onClose,
  currentUsername,
  onLogout,
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Retrieve accounts from localStorage
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

  const handleLogin = (e: React.FormEvent) => {
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

    const accounts = getStoredAccounts();
    const existing = accounts[cleanUsername];

    if (!existing) {
      setErrorMessage('حساب کاربری با این نام یافت نشد. می‌توانید ثبت‌نام کنید.');
      return;
    }

    if (existing.password !== password) {
      setErrorMessage('رمز عبور وارد شده نادرست است.');
      return;
    }

    // Success
    onLoginSuccess(existing);
    onClose();
  };

  const handleSignup = (e: React.FormEvent) => {
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

    const accounts = getStoredAccounts();
    if (accounts[cleanUsername]) {
      setErrorMessage('این نام کاربری قبلاً ثبت شده است. لطفاً وارد شوید.');
      return;
    }

    const newAccount: UserAccount = {
      username: cleanUsername,
      password: password,
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        maxStreak: 0,
        lastPlayedDate: '',
        guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      },
      gameStates: {},
      createdAt: new Date().toISOString(),
    };

    accounts[cleanUsername] = newAccount;
    saveStoredAccounts(accounts);

    onLoginSuccess(newAccount);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ورود و ثبت‌نام حساب کلمباز"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-sm rounded-2xl bg-neutral-900 border border-purple-500/40 p-5 sm:p-6 text-white shadow-2xl">
        {/* Close Button if already has account */}
        {currentUsername && (
          <button
            onClick={onClose}
            aria-label="بستن پنجره"
            className="absolute top-4 left-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-emerald-600 to-purple-700 flex items-center justify-center text-3xl shadow-lg ring-4 ring-emerald-400/20">
            🥬
          </div>
          <h2 className="text-xl font-black text-white font-['Lalezar',sans-serif]">
            حساب کاربری کلمباز
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            ورود با نام و رمز عبور برای ذخیره و پیگیری استریک و پیشرفت
          </p>
        </div>

        {/* Currently logged-in indicator */}
        {currentUsername && (
          <div className="mb-4 p-2.5 rounded-xl bg-purple-950/60 border border-purple-600/40 flex items-center justify-between text-xs">
            <span className="text-neutral-300">
              حساب فعال: <strong className="text-emerald-300">{currentUsername}</strong>
            </span>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold"
              >
                خروج
              </button>
            )}
          </div>
        )}

        {/* Tabs: Login / Sign Up */}
        <div className="flex rounded-xl bg-black/40 p-1 mb-4 border border-white/10">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'login'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-neutral-400 hover:text-white'
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
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'signup'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>ثبت‌نام</span>
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-3 p-2 rounded-xl bg-rose-950/70 border border-rose-800 flex items-center gap-2 text-rose-200 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={tab === 'login' ? handleLogin : handleSignup} className="space-y-3.5">
          {/* Username */}
          <div>
            <label
              htmlFor="auth-username"
              className="block text-xs font-semibold text-emerald-300 mb-1"
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
                className="w-full pl-3 pr-9 py-2 rounded-xl bg-black/50 border border-purple-500/40 text-white text-xs focus:outline-hidden focus:border-emerald-400 text-right"
              />
              <User className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="auth-password"
              className="block text-xs font-semibold text-emerald-300 mb-1"
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
                className="w-full pl-3 pr-9 py-2 rounded-xl bg-black/50 border border-purple-500/40 text-white text-xs focus:outline-hidden focus:border-emerald-400 text-right"
              />
              <Lock className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Confirm Password (Sign up only) */}
          {tab === 'signup' && (
            <div className="animate-fade-in">
              <label
                htmlFor="auth-confirm-password"
                className="block text-xs font-semibold text-emerald-300 mb-1"
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
                  className="w-full pl-3 pr-9 py-2 rounded-xl bg-black/50 border border-purple-500/40 text-white text-xs focus:outline-hidden focus:border-emerald-400 text-right"
                />
                <KeyRound className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-purple-700 hover:from-emerald-500 hover:to-purple-600 text-white shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              {tab === 'login' ? (
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
