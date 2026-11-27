import React, { useMemo, useState } from 'react';
import {
  Search,
  Edit3,
  Trash2,
  X,
  RotateCcw,
  KeyRound,
  Bell,
  Sprout,
  Flame,
  Check,
} from 'lucide-react';
import { AdminUserRecord, adminApi } from '../../utils/adminApi';
import { AdminLang, AdminStrings, formatNum } from './adminI18n';

interface UsersModuleProps {
  token: string;
  users: AdminUserRecord[];
  todayTehran: string;
  loading: boolean;
  darkMode: boolean;
  lang: AdminLang;
  t: AdminStrings;
  onUsersChange: (users: AdminUserRecord[]) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

type SortKey = 'recent' | 'seeds' | 'streak' | 'wins';
type FilterKey = 'all' | 'activeToday' | 'withPush';

export const UsersModule: React.FC<UsersModuleProps> = ({
  token,
  users,
  todayTehran,
  loading,
  darkMode,
  lang,
  t,
  onUsersChange,
  onNotify,
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('recent');
  const [filterBy, setFilterBy] = useState<FilterKey>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);

  // Editor drawer state
  const [points, setPoints] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [gamesWon, setGamesWon] = useState(0);
  const [lastPlayedDate, setLastPlayedDate] = useState('');
  const [guessDist, setGuessDist] = useState<Record<string, number>>({
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
    '6': 0,
  });
  const [resetToday, setResetToday] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const cardBg = darkMode ? 'bg-[#141923]' : 'bg-white';
  const inputBg = darkMode
    ? 'bg-[#1b2230] text-white placeholder-slate-500'
    : 'bg-[#f1f5f9] text-slate-900 placeholder-slate-400';
  const mutedText = darkMode ? 'text-slate-400' : 'text-slate-500';
  const headingText = darkMode ? 'text-white' : 'text-slate-900';

  const openEditor = (user: AdminUserRecord) => {
    setSelectedUser(user);
    setPoints(Number(user.stats?.points) || 0);
    setCurrentStreak(Number(user.stats?.currentStreak) || 0);
    setMaxStreak(Number(user.stats?.maxStreak) || 0);
    setGamesPlayed(Number(user.stats?.gamesPlayed) || 0);
    setGamesWon(Number(user.stats?.gamesWon) || 0);
    setLastPlayedDate(user.stats?.lastPlayedDate || '');
    const gd = user.stats?.guessDistribution || {};
    setGuessDist({
      '1': Number(gd[1] || 0),
      '2': Number(gd[2] || 0),
      '3': Number(gd[3] || 0),
      '4': Number(gd[4] || 0),
      '5': Number(gd[5] || 0),
      '6': Number(gd[6] || 0),
    });
    setResetToday(false);
    setNewPassword('');
    setConfirmDelete(false);
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users
      .filter((u) => {
        if (q && !u.username.toLowerCase().includes(q)) return false;
        if (filterBy === 'activeToday' && u.stats?.lastPlayedDate !== todayTehran) return false;
        if (filterBy === 'withPush' && (u.pushSubscriptionsCount || 0) <= 0) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'seeds') return (Number(b.stats?.points) || 0) - (Number(a.stats?.points) || 0);
        if (sortBy === 'streak')
          return (Number(b.stats?.currentStreak) || 0) - (Number(a.stats?.currentStreak) || 0);
        if (sortBy === 'wins')
          return (Number(b.stats?.gamesWon) || 0) - (Number(a.stats?.gamesWon) || 0);
        return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      });
  }, [users, search, sortBy, filterBy, todayTehran]);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    try {
      const res = await adminApi.updateUser(token, selectedUser.username, {
        stats: {
          points,
          currentStreak,
          maxStreak,
          gamesPlayed,
          gamesWon,
          lastPlayedDate: lastPlayedDate.trim(),
          guessDistribution: {
            1: guessDist['1'] || 0,
            2: guessDist['2'] || 0,
            3: guessDist['3'] || 0,
            4: guessDist['4'] || 0,
            5: guessDist['5'] || 0,
            6: guessDist['6'] || 0,
          },
        },
        resetToday,
        ...(newPassword.trim() ? { newPassword: newPassword.trim() } : {}),
      });
      onUsersChange(
        users.map((u) => (u.username === selectedUser.username ? res.user : u))
      );
      setSelectedUser(null);
      onNotify(lang === 'fa' ? `اطلاعات «${res.user.username}» ذخیره شد.` : `Saved ${res.user.username}.`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to update user.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await adminApi.deleteUser(token, selectedUser.username);
      onUsersChange(users.filter((u) => u.username !== selectedUser.username));
      const deletedName = selectedUser.username;
      setSelectedUser(null);
      onNotify(lang === 'fa' ? `کاربر «${deletedName}» حذف شد.` : `Deleted ${deletedName}.`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to delete user.', true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={`text-xl font-black tracking-tight ${headingText}`}>{t.usersTitle}</h2>
          <p className={`text-xs mt-0.5 tabular-nums ${mutedText}`}>
            {formatNum(filteredUsers.length, lang)} / {formatNum(users.length, lang)}
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className={`rounded-2xl p-3.5 flex flex-wrap items-center gap-2.5 ${cardBg}`}>
        <div className="relative flex-1 min-w-[200px]">
          <Search
            className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 ${
              lang === 'fa' ? 'right-3' : 'left-3'
            } ${mutedText}`}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchUsersPlaceholder}
            className={`w-full py-2.5 rounded-xl text-sm outline-none ${
              lang === 'fa' ? 'pr-9 pl-3' : 'pl-9 pr-3'
            } ${inputBg}`}
          />
        </div>

        <select
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value as FilterKey)}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold outline-none ${inputBg}`}
        >
          <option value="all">{t.filterAll}</option>
          <option value="activeToday">{t.filterActiveToday}</option>
          <option value="withPush">{t.filterWithPush}</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold outline-none ${inputBg}`}
        >
          <option value="recent">{t.sortRecent}</option>
          <option value="seeds">{t.sortSeeds}</option>
          <option value="streak">{t.sortStreak}</option>
          <option value="wins">{t.sortWins}</option>
        </select>
      </div>

      {/* Users Table */}
      <div className={`rounded-2xl overflow-hidden ${cardBg}`}>
        {loading && users.length === 0 ? (
          <div className={`p-8 text-center text-sm ${mutedText}`}>{t.loading}</div>
        ) : filteredUsers.length === 0 ? (
          <div className={`p-8 text-center text-sm ${mutedText}`}>{t.noData}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={darkMode ? 'bg-[#1a202d] text-slate-400' : 'bg-slate-100 text-slate-600'}>
                  <th className="text-start px-4 py-3 text-xs font-bold">{t.colUsername}</th>
                  <th className="text-start px-3 py-3 text-xs font-bold">{t.colSeeds}</th>
                  <th className="text-start px-3 py-3 text-xs font-bold">{t.colStreak}</th>
                  <th className="text-start px-3 py-3 text-xs font-bold">{t.colGames}</th>
                  <th className="text-start px-3 py-3 text-xs font-bold">{t.colLastPlayed}</th>
                  <th className="text-start px-3 py-3 text-xs font-bold">{t.colPush}</th>
                  <th className="text-end px-4 py-3 text-xs font-bold">{t.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-500/10">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.username}
                    className={`transition-colors ${
                      darkMode ? 'hover:bg-[#1a2230]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className={`px-4 py-2.5 font-bold ${headingText}`}>{u.username}</td>
                    <td className="px-3 py-2.5 tabular-nums font-bold text-emerald-500">
                      <span className="inline-flex items-center gap-1">
                        <Sprout className="w-3.5 h-3.5" />
                        {formatNum(Number(u.stats?.points) || 0, lang)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums font-semibold text-amber-500">
                      <span className="inline-flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" />
                        {formatNum(Number(u.stats?.currentStreak) || 0, lang)}
                        <span className={`text-[11px] ${mutedText}`}>
                          ({formatNum(Number(u.stats?.maxStreak) || 0, lang)})
                        </span>
                      </span>
                    </td>
                    <td className={`px-3 py-2.5 tabular-nums ${headingText}`}>
                      {formatNum(Number(u.stats?.gamesWon) || 0, lang)} /{' '}
                      {formatNum(Number(u.stats?.gamesPlayed) || 0, lang)}
                    </td>
                    <td className={`px-3 py-2.5 font-mono text-xs ${mutedText}`}>
                      {u.stats?.lastPlayedDate || '—'}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">
                      {u.pushSubscriptionsCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-400">
                          <Bell className="w-3.5 h-3.5" />
                          {formatNum(u.pushSubscriptionsCount, lang)}
                        </span>
                      ) : (
                        <span className={`text-xs ${mutedText}`}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-end">
                      <button
                        type="button"
                        onClick={() => openEditor(u)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          darkMode
                            ? 'bg-[#222b3c] hover:bg-emerald-600 text-slate-100'
                            : 'bg-slate-200/80 hover:bg-emerald-600 hover:text-white text-slate-800'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{t.edit}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-Over Editor Drawer */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs"
          onClick={() => !saving && setSelectedUser(null)}
        >
          <div
            className={`w-full max-w-md h-full overflow-y-auto p-5 sm:p-6 shadow-2xl ${
              darkMode ? 'bg-[#121720] text-slate-100' : 'bg-white text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 pb-4 mb-4">
              <div>
                <h3 className={`text-lg font-black ${headingText}`}>{t.editUserTitle}</h3>
                <p className="text-xs font-bold text-emerald-500 mt-0.5">{selectedUser.username}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className={`p-2 rounded-xl ${
                  darkMode ? 'bg-[#1e2636] hover:bg-[#273145]' : 'bg-slate-100 hover:bg-slate-200'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${mutedText}`}>
                    {t.seedsLabel}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={1000000}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm font-bold tabular-nums outline-none ${inputBg}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${mutedText}`}>
                    {t.lastPlayedDateLabel}
                  </label>
                  <input
                    type="text"
                    value={lastPlayedDate}
                    onChange={(e) => setLastPlayedDate(e.target.value)}
                    placeholder="2026-11-27"
                    dir="ltr"
                    className={`w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none ${inputBg}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${mutedText}`}>
                    {t.currentStreakLabel}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    value={currentStreak}
                    onChange={(e) => setCurrentStreak(Number(e.target.value))}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm font-bold tabular-nums outline-none ${inputBg}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${mutedText}`}>
                    {t.maxStreakLabel}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    value={maxStreak}
                    onChange={(e) => setMaxStreak(Number(e.target.value))}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm font-bold tabular-nums outline-none ${inputBg}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${mutedText}`}>
                    {t.gamesPlayedLabel}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100000}
                    value={gamesPlayed}
                    onChange={(e) => setGamesPlayed(Number(e.target.value))}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm font-bold tabular-nums outline-none ${inputBg}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${mutedText}`}>
                    {t.gamesWonLabel}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100000}
                    value={gamesWon}
                    onChange={(e) => setGamesWon(Number(e.target.value))}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm font-bold tabular-nums outline-none ${inputBg}`}
                  />
                </div>
              </div>

              {/* Guess Distribution */}
              <div>
                <label className={`block text-xs font-bold mb-2 ${mutedText}`}>
                  {t.guessDistributionLabel}
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {(['1', '2', '3', '4', '5', '6'] as const).map((k) => (
                    <div key={k} className="text-center">
                      <div className={`text-[10px] font-bold mb-1 ${mutedText}`}>{k}</div>
                      <input
                        type="number"
                        min={0}
                        max={100000}
                        value={guessDist[k]}
                        onChange={(e) =>
                          setGuessDist((prev) => ({ ...prev, [k]: Number(e.target.value) || 0 }))
                        }
                        className={`w-full px-1.5 py-2 rounded-lg text-xs text-center font-bold tabular-nums outline-none ${inputBg}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Reset Today Toggle */}
              <button
                type="button"
                onClick={() => setResetToday((v) => !v)}
                className={`w-full flex items-center justify-between gap-3 p-3.5 rounded-xl text-start transition-colors ${
                  resetToday
                    ? 'bg-amber-500/20 text-amber-400'
                    : darkMode
                      ? 'bg-[#1b2230] text-slate-300'
                      : 'bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">{t.resetTodayPuzzle}</div>
                    <div className={`text-[11px] mt-0.5 ${resetToday ? 'text-amber-300/80' : mutedText}`}>
                      {t.resetTodayHint}
                    </div>
                  </div>
                </div>
                {resetToday && <Check className="w-4 h-4 shrink-0" />}
              </button>

              {/* Reset Password */}
              <div>
                <label className={`flex items-center gap-1.5 text-xs font-bold mb-1.5 ${mutedText}`}>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{t.resetUserPasswordLabel}</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t.resetUserPasswordPlaceholder}
                  className={`w-full px-3 py-2.5 rounded-xl text-sm outline-none ${inputBg}`}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white transition-colors"
                >
                  {saving ? t.saving : t.save}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setSelectedUser(null)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold ${
                    darkMode ? 'bg-[#1f2737] text-slate-300' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {t.cancel}
                </button>
              </div>
            </form>

            {/* Danger Zone */}
            <div
              className={`mt-6 p-4 rounded-2xl ${
                darkMode ? 'bg-rose-500/10' : 'bg-rose-50'
              }`}
            >
              <div className="text-xs font-black text-rose-500 mb-1">{t.dangerZone}</div>
              <p className={`text-[11px] mb-3 ${mutedText}`}>{t.deleteUserWarn}</p>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600/20 hover:bg-rose-600 hover:text-white text-rose-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.delete}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleDeleteUser}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.confirmDelete}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold ${
                      darkMode ? 'bg-[#1f2737] text-slate-300' : 'bg-white text-slate-700'
                    }`}
                  >
                    {t.cancel}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
