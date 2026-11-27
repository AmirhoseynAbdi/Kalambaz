import React, { useCallback, useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Send,
  CalendarDays,
  Bell,
  Gift,
  Megaphone,
  LogOut,
  RefreshCw,
  Sun,
  Moon,
  Languages,
  ArrowLeft,
  Menu,
  X,
  Lock,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import {
  AdminAuthStatus,
  AdminOverviewData,
  AdminPushStats,
  AdminReferralsData,
  AdminSocialPost,
  AdminUserRecord,
  DailyWordRow,
  SiteAnnouncement,
  SocialChannelReadiness,
  adminApi,
} from '../../utils/adminApi';
import { ADMIN_I18N, AdminLang, AdminSection } from './adminI18n';
import { OverviewModule } from './OverviewModule';
import { UsersModule } from './UsersModule';
import { SocialStudioModule } from './SocialStudioModule';
import { DailyWordsModule } from './DailyWordsModule';
import {
  AnnouncementsModule,
  PushModule,
  ReferralsModule,
} from './GameToolsModules';

interface AdminAppProps {
  onNavigateToGame?: () => void;
}

export const AdminApp: React.FC<AdminAppProps> = ({ onNavigateToGame }) => {
  // Language & Theme preferences (safe UI prefs only; auth token is strictly kept in React state memory)
  const [lang, setLang] = useState<AdminLang>(() => {
    try {
      return localStorage.getItem('kalabaz_admin_lang') === 'en' ? 'en' : 'fa';
    } catch {
      return 'fa';
    }
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kalabaz_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.darkMode === 'boolean') return parsed.darkMode;
      }
    } catch {}
    return true;
  });

  // Strict in-memory admin Bearer token (NEVER persisted in localStorage/sessionStorage)
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<AdminAuthStatus | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Navigation & UI state
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; isError: boolean } | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  // Module data caches
  const [loadingSection, setLoadingSection] = useState(false);
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [socialPosts, setSocialPosts] = useState<AdminSocialPost[]>([]);
  const [socialChannels, setSocialChannels] = useState<SocialChannelReadiness | null>(null);
  const [dailyWordsRows, setDailyWordsRows] = useState<DailyWordRow[]>([]);
  const [pushStats, setPushStats] = useState<AdminPushStats | null>(null);
  const [referrals, setReferrals] = useState<AdminReferralsData | null>(null);
  const [announcement, setAnnouncement] = useState<SiteAnnouncement | null>(null);

  const t = ADMIN_I18N[lang];

  const showToast = useCallback((msg: string, isError = false) => {
    setToast({ msg, isError });
    window.setTimeout(() => {
      setToast((prev) => (prev?.msg === msg ? null : prev));
    }, 3400);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('kalabaz_admin_lang', lang);
    } catch {}
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Check admin configuration status on mount
  const checkAuthStatus = useCallback(async (token?: string | null) => {
    setAuthLoading(true);
    try {
      const status = await adminApi.getStatus(token);
      setAuthStatus(status);
      if (token && !status.authenticated) {
        setAdminToken(null);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to reach admin API.');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkAuthStatus(null);
  }, [checkAuthStatus]);

  // Load active section data
  const loadSectionData = useCallback(
    async (section: AdminSection, token: string) => {
      setLoadingSection(true);
      try {
        if (section === 'overview') {
          const data = await adminApi.getOverview(token);
          setOverview(data);
          setSocialChannels(data.channels);
          setAnnouncement(data.announcement);
        } else if (section === 'users') {
          const [uRes, ovRes] = await Promise.all([
            adminApi.getUsers(token),
            overview ? Promise.resolve(null) : adminApi.getOverview(token),
          ]);
          setUsers(uRes.users);
          if (ovRes) setOverview(ovRes);
        } else if (section === 'social') {
          const [sRes, ovRes] = await Promise.all([
            adminApi.getSocialPosts(token),
            overview ? Promise.resolve(null) : adminApi.getOverview(token),
          ]);
          setSocialPosts(sRes.posts);
          setSocialChannels(sRes.channels);
          if (ovRes) setOverview(ovRes);
        } else if (section === 'dailyWords') {
          const res = await adminApi.getDailyWords(token, 21);
          setDailyWordsRows(res.rows);
        } else if (section === 'push') {
          const res = await adminApi.getPushStats(token);
          setPushStats(res);
        } else if (section === 'referrals') {
          const res = await adminApi.getReferrals(token);
          setReferrals(res);
        } else if (section === 'announcement') {
          const res = await adminApi.getAnnouncement(token);
          setAnnouncement(res.announcement);
        }
      } catch (err: any) {
        if (err?.status === 401) {
          setAdminToken(null);
          showToast(
            lang === 'fa' ? 'نشست مدیریت منقضی شد. دوباره وارد شوید.' : 'Session expired. Please sign in again.',
            true
          );
        } else {
          showToast(err instanceof Error ? err.message : 'Failed to load data.', true);
        }
      } finally {
        setLoadingSection(false);
      }
    },
    [lang, overview, showToast]
  );

  useEffect(() => {
    if (adminToken) {
      void loadSectionData(activeSection, adminToken);
    }
  }, [adminToken, activeSection, loadSectionData]);

  const handleSetupOrLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (authStatus?.canClaimSetup) {
      if (passwordInput.length < 8) {
        setAuthError(t.passwordTooShort);
        return;
      }
      if (passwordInput !== confirmPasswordInput) {
        setAuthError(t.passwordMismatch);
        return;
      }
      setAuthSubmitting(true);
      try {
        const res = await adminApi.setupPassword(passwordInput);
        setAdminToken(res.token);
        setAuthStatus({
          configured: true,
          hasEnvPassword: false,
          canClaimSetup: false,
          authenticated: true,
        });
        setPasswordInput('');
        setConfirmPasswordInput('');
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Setup failed.');
      } finally {
        setAuthSubmitting(false);
      }
      return;
    }

    setAuthSubmitting(true);
    try {
      const res = await adminApi.login(passwordInput);
      setAdminToken(res.token);
      setAuthStatus((prev) => (prev ? { ...prev, authenticated: true } : prev));
      setPasswordInput('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (adminToken) {
      try {
        await adminApi.logout(adminToken);
      } catch {}
    }
    setAdminToken(null);
    setOverview(null);
    setUsers([]);
    setSocialPosts([]);
    setAuthStatus((prev) => (prev ? { ...prev, authenticated: false } : prev));
  };

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    if (newPw.length < 8) {
      showToast(t.passwordTooShort, true);
      return;
    }
    setPwSaving(true);
    try {
      const res = await adminApi.changePassword(adminToken, currentPw, newPw);
      setIsPasswordModalOpen(false);
      setCurrentPw('');
      setNewPw('');
      showToast(
        res.note || (lang === 'fa' ? 'رمز عبور مدیریت با موفقیت تغییر کرد.' : 'Admin password updated.')
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to change password.', true);
    } finally {
      setPwSaving(false);
    }
  };

  const goBackToGame = () => {
    if (onNavigateToGame) {
      onNavigateToGame();
    } else {
      window.location.href = '/';
    }
  };

  const pageBg = darkMode ? 'bg-[#0d1016] text-slate-100' : 'bg-[#f4f6f9] text-slate-900';
  const sidebarBg = darkMode ? 'bg-[#121720]' : 'bg-white';
  const mutedText = darkMode ? 'text-slate-400' : 'text-slate-500';
  const inputBg = darkMode
    ? 'bg-[#1b2230] text-white placeholder-slate-500'
    : 'bg-[#f1f5f9] text-slate-900 placeholder-slate-400';

  // ============================================================
  // AUTH GATE (FIRST-RUN SETUP OR LOGIN)
  // ============================================================
  if (!adminToken) {
    return (
      <div
        dir={lang === 'fa' ? 'rtl' : 'ltr'}
        className={`min-h-screen flex flex-col items-center justify-center p-4 ${pageBg}`}
      >
        <div className="w-full max-w-md space-y-4">
          {/* Top utility controls */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={goBackToGame}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                darkMode ? 'bg-[#171d29] text-slate-300' : 'bg-white text-slate-700'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.backToGame}</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setLang((l) => (l === 'fa' ? 'en' : 'fa'))}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold ${
                  darkMode ? 'bg-[#171d29] text-slate-200' : 'bg-white text-slate-800'
                }`}
              >
                <Languages className="w-3.5 h-3.5 text-emerald-500" />
                <span>{lang === 'fa' ? 'EN' : 'فا'}</span>
              </button>
              <button
                type="button"
                onClick={() => setDarkMode((d) => !d)}
                className={`p-2 rounded-xl ${
                  darkMode ? 'bg-[#171d29] text-amber-400' : 'bg-white text-slate-700'
                }`}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className={`rounded-3xl p-6 sm:p-8 shadow-2xl ${sidebarBg}`}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600/20 text-emerald-500 flex items-center justify-center">
                {authStatus?.canClaimSetup ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </div>
              <div>
                <h1 className="text-lg font-black">
                  {authStatus?.canClaimSetup ? t.setupTitle : t.loginTitle}
                </h1>
                <p className={`text-xs mt-0.5 ${mutedText}`}>{t.brandTitle}</p>
              </div>
            </div>

            {authLoading ? (
              <div className={`py-8 text-center text-sm ${mutedText}`}>{t.loading}</div>
            ) : (
              <form onSubmit={handleSetupOrLogin} className="space-y-4">
                <p className={`text-xs leading-relaxed ${mutedText}`}>
                  {authStatus?.canClaimSetup ? t.setupSubtitle : t.loginSubtitle}
                </p>

                {authError && (
                  <div className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-400">
                    {authError}
                  </div>
                )}

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${mutedText}`}>
                    {t.passwordLabel}
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className={`w-full px-3.5 py-3 rounded-xl text-sm outline-none ${inputBg}`}
                    autoFocus
                  />
                </div>

                {authStatus?.canClaimSetup && (
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${mutedText}`}>
                      {t.confirmPasswordLabel}
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder={t.passwordPlaceholder}
                      className={`w-full px-3.5 py-3 rounded-xl text-sm outline-none ${inputBg}`}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-3 rounded-xl text-sm font-black bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white transition-colors"
                >
                  {authSubmitting
                    ? t.loading
                    : authStatus?.canClaimSetup
                      ? t.createAdminBtn
                      : t.loginBtn}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // AUTHENTICATED ADMIN DASHBOARD SHELL
  // ============================================================
  const navItems: Array<{ id: AdminSection; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', icon: LayoutDashboard },
    { id: 'users', icon: Users },
    { id: 'social', icon: Send },
    { id: 'dailyWords', icon: CalendarDays },
    { id: 'push', icon: Bell },
    { id: 'referrals', icon: Gift },
    { id: 'announcement', icon: Megaphone },
  ];

  const todayTehran = overview?.todayTehran || new Date().toISOString().slice(0, 10);

  const renderSidebarNav = () => (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center gap-3 px-2 py-2 mb-5">
        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg">
          ک
        </div>
        <div className="min-w-0">
          <div className="text-sm font-black truncate">{t.brandTitle}</div>
          <div className={`text-[10px] truncate ${mutedText}`}>kalambaz.ir/admin</div>
        </div>
      </div>

      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveSection(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : darkMode
                    ? 'text-slate-300 hover:bg-[#1c2331]'
                    : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{t.nav[item.id]}</span>
            </button>
          );
        })}
      </nav>

      <div className="pt-4 space-y-1.5">
        <button
          type="button"
          onClick={() => {
            setIsPasswordModalOpen(true);
            setMobileMenuOpen(false);
          }}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
            darkMode ? 'bg-[#1a2230] text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-700'
          }`}
        >
          <KeyRound className="w-4 h-4 text-amber-400" />
          <span>{t.changePasswordBtn}</span>
        </button>

        <button
          type="button"
          onClick={goBackToGame}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
            darkMode ? 'bg-[#1a2230] text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-700'
          }`}
        >
          <ArrowLeft className="w-4 h-4 text-emerald-500" />
          <span>{t.backToGame}</span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-600 hover:text-white text-rose-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{t.signOut}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div dir={lang === 'fa' ? 'rtl' : 'ltr'} className={`min-h-screen flex ${pageBg}`}>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xl ${
            toast.isError ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block w-64 shrink-0 sticky top-0 h-screen ${sidebarBg}`}>
        {renderSidebarNav()}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex bg-black/60 backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className={`w-64 max-w-[82vw] h-full shadow-2xl ${sidebarBg}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end p-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="h-[calc(100%-3rem)]">{renderSidebarNav()}</div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Utility Header */}
        <header
          className={`sticky top-0 z-30 px-4 sm:px-6 h-14 flex items-center justify-between gap-3 ${
            darkMode ? 'bg-[#0d1016]/90' : 'bg-[#f4f6f9]/90'
          } backdrop-blur-md`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className={`lg:hidden p-2 rounded-xl ${sidebarBg}`}
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-sm font-black truncate">{t.nav[activeSection]}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadSectionData(activeSection, adminToken)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${sidebarBg}`}
              title={t.refresh}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSection ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t.refresh}</span>
            </button>

            <button
              type="button"
              onClick={() => setLang((l) => (l === 'fa' ? 'en' : 'fa'))}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${sidebarBg}`}
            >
              <Languages className="w-3.5 h-3.5 text-emerald-500" />
              <span>{lang === 'fa' ? 'English' : 'فارسی'}</span>
            </button>

            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              className={`p-2 rounded-xl ${sidebarBg}`}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
          </div>
        </header>

        {/* Module Viewport */}
        <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto">
          {activeSection === 'overview' && (
            <OverviewModule
              data={overview}
              loading={loadingSection}
              darkMode={darkMode}
              lang={lang}
              t={t}
              onNavigate={setActiveSection}
            />
          )}

          {activeSection === 'users' && (
            <UsersModule
              token={adminToken}
              users={users}
              todayTehran={todayTehran}
              loading={loadingSection}
              darkMode={darkMode}
              lang={lang}
              t={t}
              onUsersChange={setUsers}
              onNotify={showToast}
            />
          )}

          {activeSection === 'social' && (
            <SocialStudioModule
              token={adminToken}
              posts={socialPosts}
              channels={socialChannels}
              todayTehran={todayTehran}
              loading={loadingSection}
              darkMode={darkMode}
              lang={lang}
              t={t}
              onPostsChange={setSocialPosts}
              onNotify={showToast}
            />
          )}

          {activeSection === 'dailyWords' && (
            <DailyWordsModule
              token={adminToken}
              rows={dailyWordsRows}
              loading={loadingSection}
              darkMode={darkMode}
              lang={lang}
              t={t}
              onRefresh={async () => {
                const res = await adminApi.getDailyWords(adminToken, 21);
                setDailyWordsRows(res.rows);
              }}
              onNotify={showToast}
            />
          )}

          {activeSection === 'push' && (
            <PushModule
              token={adminToken}
              stats={pushStats}
              loading={loadingSection}
              darkMode={darkMode}
              lang={lang}
              t={t}
              onRefresh={async () => {
                const res = await adminApi.getPushStats(adminToken);
                setPushStats(res);
              }}
              onNotify={showToast}
            />
          )}

          {activeSection === 'referrals' && (
            <ReferralsModule
              data={referrals}
              loading={loadingSection}
              darkMode={darkMode}
              lang={lang}
              t={t}
            />
          )}

          {activeSection === 'announcement' && (
            <AnnouncementsModule
              token={adminToken}
              initial={announcement}
              darkMode={darkMode}
              lang={lang}
              t={t}
              onSaved={(next) => {
                setAnnouncement(next);
                setOverview((prev) => (prev ? { ...prev, announcement: next } : prev));
              }}
              onNotify={showToast}
            />
          )}
        </main>
      </div>

      {/* Change Admin Password Modal */}
      {isPasswordModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => !pwSaving && setIsPasswordModalOpen(false)}
        >
          <div
            className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl ${sidebarBg}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black">{t.securityModalTitle}</h3>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {authStatus?.hasEnvPassword && (
              <div className="mb-4 px-3 py-2 rounded-xl text-[11px] font-bold bg-amber-500/15 text-amber-400">
                {t.envPasswordActiveNote}
              </div>
            )}

            <form onSubmit={handleChangeAdminPassword} className="space-y-3.5">
              <div>
                <label className={`block text-xs font-bold mb-1 ${mutedText}`}>
                  {t.currentPassword}
                </label>
                <input
                  type="password"
                  required
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm outline-none ${inputBg}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-1 ${mutedText}`}>
                  {t.newPassword}
                </label>
                <input
                  type="password"
                  required
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm outline-none ${inputBg}`}
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={pwSaving}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {pwSaving ? t.saving : t.save}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold ${
                    darkMode ? 'bg-[#1f2737] text-slate-300' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
