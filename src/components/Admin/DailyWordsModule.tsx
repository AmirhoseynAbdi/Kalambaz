import React, { useState } from 'react';
import { RotateCcw, Check, CalendarDays } from 'lucide-react';
import { DailyWordRow, adminApi } from '../../utils/adminApi';
import { DAILY_WORDS } from '../../data/wordLists';
import { getDailyWord } from '../../game/wordleLogic';
import { AdminLang, AdminStrings, formatNum } from './adminI18n';

interface DailyWordsModuleProps {
  token: string;
  rows: DailyWordRow[];
  loading: boolean;
  darkMode: boolean;
  lang: AdminLang;
  t: AdminStrings;
  onRefresh: () => Promise<void>;
  onNotify: (msg: string, isError?: boolean) => void;
}

export const DailyWordsModule: React.FC<DailyWordsModuleProps> = ({
  token,
  rows,
  loading,
  darkMode,
  lang,
  t,
  onRefresh,
  onNotify,
}) => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftWord, setDraftWord] = useState('');
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const cardBg = darkMode ? 'bg-[#141923]' : 'bg-white';
  const subBg = darkMode ? 'bg-[#1b2230]' : 'bg-[#f1f5f9]';
  const mutedText = darkMode ? 'text-slate-400' : 'text-slate-500';
  const headingText = darkMode ? 'text-white' : 'text-slate-900';

  const startEdit = (dateKey: string, len: 4 | 5 | 6, currentWord: string) => {
    setEditingKey(`${dateKey}:${len}`);
    setDraftWord(currentWord);
  };

  const handleSaveOverride = async (dateKey: string, len: 4 | 5 | 6) => {
    const key = `${dateKey}:${len}`;
    setBusyKey(key);
    try {
      const res = await adminApi.setDailyWordOverride(token, {
        dateKey,
        wordLength: len,
        word: draftWord,
      });
      setEditingKey(null);
      await onRefresh();
      onNotify(
        lang === 'fa'
          ? `کلمه ${formatNum(len, lang)} حرفی تاریخ ${dateKey} روی «${res.word}» تنظیم شد.`
          : `Set ${len}-letter word for ${dateKey} to "${res.word}".`
      );
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to save override.', true);
    } finally {
      setBusyKey(null);
    }
  };

  const handleRevert = async (dateKey: string, len: 4 | 5 | 6) => {
    const key = `${dateKey}:${len}`;
    setBusyKey(key);
    try {
      await adminApi.deleteDailyWordOverride(token, dateKey, len);
      await onRefresh();
      onNotify(
        lang === 'fa'
          ? `کلمه ${dateKey} به حالت خودکار برگشت.`
          : `Reverted ${dateKey} (${len}-letter) to default.`
      );
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to revert override.', true);
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className={`text-xl font-black tracking-tight flex items-center gap-2 ${headingText}`}>
          <CalendarDays className="w-5 h-5 text-emerald-500" />
          <span>{t.dailyWordsTitle}</span>
        </h2>
        <p className={`text-xs mt-1 ${mutedText}`}>{t.dailyWordsSubtitle}</p>
      </div>

      <div className={`rounded-2xl overflow-hidden ${cardBg}`}>
        {loading && rows.length === 0 ? (
          <div className={`p-8 text-center text-sm ${mutedText}`}>{t.loading}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={darkMode ? 'bg-[#1a202d] text-slate-400' : 'bg-slate-100 text-slate-600'}>
                  <th className="text-start px-4 py-3 text-xs font-bold">{t.colDate}</th>
                  {[4, 5, 6].map((len) => (
                    <th key={len} className="text-start px-3 py-3 text-xs font-bold">
                      {formatNum(len, lang)} {t.lettersUnit}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-500/10">
                {rows.map((row) => (
                  <tr
                    key={row.dateKey}
                    className={
                      row.isToday
                        ? darkMode
                          ? 'bg-emerald-500/10'
                          : 'bg-emerald-50/80'
                        : ''
                    }
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-bold ${headingText}`}>
                          {row.dateKey}
                        </span>
                        {row.isToday && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-600 text-white">
                            {t.todayBadge}
                          </span>
                        )}
                      </div>
                    </td>

                    {([4, 5, 6] as const).map((len) => {
                      const cell = row.words[len];
                      const defaultWord =
                        cell?.defaultWord || getDailyWord(row.dateKey, len, DAILY_WORDS[len]).word;
                      const activeWord = cell?.word || defaultWord;
                      const isOverridden = Boolean(cell?.isOverridden);
                      const cellKey = `${row.dateKey}:${len}`;
                      const isEditing = editingKey === cellKey;
                      const isBusy = busyKey === cellKey;

                      return (
                        <td key={len} className="px-3 py-2.5 min-w-[170px]">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={draftWord}
                                onChange={(e) => setDraftWord(e.target.value)}
                                placeholder={t.overridePlaceholder}
                                dir="rtl"
                                className={`w-24 px-2.5 py-1.5 rounded-lg text-sm font-bold outline-none ${
                                  darkMode ? 'bg-[#0e131b] text-white' : 'bg-white text-slate-900'
                                }`}
                                autoFocus
                              />
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleSaveOverride(row.dateKey, len)}
                                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                                title={t.applyOverride}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingKey(null)}
                                className={`px-2 py-1.5 rounded-lg text-[11px] font-bold ${subBg} ${mutedText}`}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => startEdit(row.dateKey, len, activeWord)}
                                className={`px-2.5 py-1.5 rounded-xl text-sm font-black transition-colors ${
                                  isOverridden
                                    ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                                    : `${subBg} ${headingText} hover:opacity-80`
                                }`}
                                title={
                                  isOverridden
                                    ? `${t.defaultTag}: ${defaultWord}`
                                    : t.edit
                                }
                              >
                                {activeWord}
                              </button>
                              {isOverridden && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleRevert(row.dateKey, len)}
                                  className={`p-1.5 rounded-lg transition-colors ${mutedText} hover:text-amber-500`}
                                  title={t.revertDefault}
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
