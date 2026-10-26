import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  BookOpen,
  Check,
  Hash,
} from 'lucide-react';
import { WordEntry } from '../../types';
import { normalizePersian, getWordPrefix } from '../../game/wordleLogic';

interface VocabularyModalProps {
  isOpen: boolean;
  onClose: () => void;
  words4: WordEntry[];
  words5: WordEntry[];
  words6: WordEntry[];
  onSaveWord: (length: 4 | 5 | 6, word: WordEntry, oldWord?: string) => void;
  onDeleteWord: (length: 4 | 5 | 6, wordText: string) => void;
  onResetVocabulary: (length: 4 | 5 | 6) => void;
  onImportVocabulary: (length: 4 | 5 | 6, newWords: WordEntry[]) => void;
}

export const VocabularyModal: React.FC<VocabularyModalProps> = ({
  isOpen,
  onClose,
  words4,
  words5,
  words6,
  onSaveWord,
  onDeleteWord,
  onResetVocabulary,
  onImportVocabulary,
}) => {
  const [activeLength, setActiveLength] = useState<4 | 5 | 6>(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingWord, setEditingWord] = useState<WordEntry | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states
  const [formWord, setFormWord] = useState('');
  const [formError, setFormError] = useState('');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const currentList = activeLength === 4 ? words4 : activeLength === 5 ? words5 : words6;
  const activePrefix = getWordPrefix(activeLength);
  const nextCounterId = `${activePrefix}${currentList.length + 1}`;

  // Filtered vocabulary list by Persian word or counter ID (four1, five2, six3...)
  const filteredWords = useMemo(() => {
    if (!searchTerm.trim()) return currentList;
    const rawTerm = searchTerm.trim().toLowerCase();
    const normTerm = normalizePersian(rawTerm);
    return currentList.filter((item) => {
      const matchWord = normalizePersian(item.word.toLowerCase()).includes(normTerm);
      const matchId = (item.id || '').toLowerCase().includes(rawTerm);
      return matchWord || matchId;
    });
  }, [currentList, searchTerm]);

  if (!isOpen) return null;

  const startEdit = (entry: WordEntry) => {
    setEditingWord(entry);
    setFormWord(entry.word);
    setFormError('');
    setIsAddingNew(false);
  };

  const startAdd = () => {
    setEditingWord(null);
    setFormWord('');
    setFormError('');
    setIsAddingNew(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWord = normalizePersian(formWord);
    if (!cleanWord) {
      setFormError('لطفاً کلمه را وارد کنید');
      return;
    }
    if (cleanWord.length !== activeLength) {
      setFormError(`طول کلمه باید دقیقاً ${activeLength} حرف باشد (طول فعلی: ${cleanWord.length})`);
      return;
    }

    const newEntry: WordEntry = {
      id: editingWord?.id || nextCounterId,
      word: cleanWord,
    };

    onSaveWord(activeLength, newEntry, editingWord?.word);
    setIsAddingNew(false);
    setEditingWord(null);
    setFormError('');
  };

  const handleExportJSON = () => {
    const filename = `words${activeLength}.json`;
    const prefix = getWordPrefix(activeLength);
    const cleanExport = currentList.map((item, idx) => ({
      id: item.id || `${prefix}${idx + 1}`,
      word: item.word,
    }));
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(cleanExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const prefix = getWordPrefix(activeLength);
          const normalized: WordEntry[] = parsed
            .map((item, idx) => {
              if (typeof item === 'string') {
                return { id: `${prefix}${idx + 1}`, word: normalizePersian(item) };
              }
              return {
                id: item.id || `${prefix}${idx + 1}`,
                word: normalizePersian(item.word || ''),
              };
            })
            .filter((entry) => entry.word.length === activeLength);

          if (normalized.length > 0) {
            onImportVocabulary(activeLength, normalized);
            setStatusNotice(
              `تعداد ${normalized.length.toLocaleString('fa-IR')} واژه برای کلمات ${activeLength} حرفی بارگذاری شد!`
            );
          } else {
            setStatusNotice(`هیچ کلمه ${activeLength} حرفی در فایل یافت نشد.`);
          }
        } else {
          setStatusNotice('فرمت فایل JSON نامعتبر است.');
        }
      } catch {
        setStatusNotice('خطا در خواندن فایل JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="مدیریت واژگان بازی"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-neutral-900 border border-purple-500/40 text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-500/20 bg-purple-950/40">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base sm:text-lg font-bold font-['Lalezar',sans-serif]">
                واژه‌نامه کلمباز (با شناسه شمارنده روزانه)
              </h2>
              <p className="text-[11px] text-neutral-400">
                فایل فعال:{' '}
                <strong className="text-emerald-400 font-mono">
                  words{activeLength}.json
                </strong>{' '}
                (شناسه‌های{' '}
                <code className="text-purple-300 font-mono">
                  {activePrefix}1
                </code>{' '}
                تا{' '}
                <code className="text-purple-300 font-mono">
                  {activePrefix}{currentList.length}
                </code>
                )
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="بستن پنجره"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Length Tabs Selector */}
        <div className="flex border-b border-neutral-800 bg-neutral-950 px-4 pt-2 gap-2">
          {([4, 5, 6] as const).map((len) => {
            const pref = getWordPrefix(len);
            const listForLen = len === 4 ? words4 : len === 5 ? words5 : words6;
            return (
              <button
                key={len}
                onClick={() => {
                  setActiveLength(len);
                  setIsAddingNew(false);
                  setEditingWord(null);
                  setSearchTerm('');
                  setStatusNotice(null);
                }}
                className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                  activeLength === len
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <span>کلمات {len.toLocaleString('fa-IR')} حرفی</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/10 text-neutral-300">
                  {pref}1..{pref}{listForLen.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar: Search & Actions */}
        <div className="p-3 bg-neutral-950 border-b border-neutral-800 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Search input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`جستجو با کلمه یا شناسه (مثلاً ${activePrefix}1)...`}
                className="w-full pr-9 pl-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-purple-400 text-right"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={startAdd}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن ({nextCounterId})</span>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                title={`دانلود words${activeLength}.json`}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs border border-purple-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>دانلود words{activeLength}.json</span>
              </button>

              <label
                title={`بارگذاری words${activeLength}.json`}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs border border-purple-700 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>بارگذاری JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => onResetVocabulary(activeLength)}
                title="بازنشانی به حالت اولیه"
                className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {statusNotice && (
            <div className="text-xs text-emerald-300 bg-emerald-950/50 border border-emerald-700/50 rounded-lg px-3 py-1.5 flex items-center justify-between">
              <span>{statusNotice}</span>
              <button
                type="button"
                onClick={() => setStatusNotice(null)}
                className="text-neutral-400 hover:text-white text-[11px]"
              >
                بستن
              </button>
            </div>
          )}
        </div>

        {/* Add/Edit Form */}
        {(isAddingNew || editingWord) && (
          <form
            onSubmit={handleSaveForm}
            className="p-4 bg-purple-950/90 border-b border-purple-500/40 animate-fade-in space-y-3"
          >
            <div className="flex items-center justify-between pb-1 border-b border-purple-800">
              <h3 className="text-xs sm:text-sm font-bold text-emerald-300 flex items-center gap-2">
                <span>
                  {editingWord
                    ? `ویرایش کلمه (${editingWord.id})`
                    : `افزودن کلمه ${activeLength} حرفی جدید`}
                </span>
                <span className="px-2 py-0.5 rounded bg-black/50 border border-purple-500/50 font-mono text-xs text-purple-200">
                  id: &quot;{editingWord ? editingWord.id : nextCounterId}&quot;
                </span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingWord(null);
                }}
                className="text-xs text-neutral-400 hover:text-white"
              >
                انصراف
              </button>
            </div>

            {formError && (
              <p className="text-xs text-rose-300 bg-rose-950/60 p-2 rounded-lg border border-rose-800">
                {formError}
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5">
              <div className="flex-1">
                <label className="block text-[11px] text-neutral-300 mb-1">
                  کلمه ({activeLength} حرفی):
                </label>
                <input
                  type="text"
                  value={formWord}
                  onChange={(e) => setFormWord(normalizePersian(e.target.value))}
                  placeholder={`کلمه دقیقاً ${activeLength} حرفی...`}
                  maxLength={activeLength}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-purple-500/60 text-sm text-white text-right"
                  required
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>ذخیره در words{activeLength}.json</span>
              </button>
            </div>
          </form>
        )}

        {/* Word List (dir="ltr" puts scrollbar on the right, inner dir="rtl" preserves Persian layout) */}
        <div dir="ltr" className="flex-1 overflow-y-auto p-3">
          <div dir="rtl" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {filteredWords.length === 0 ? (
              <div className="col-span-full text-center py-12 text-neutral-500 text-xs">
                کلمه‌ای با این مشخصات یافت نشد. می‌توانید با دکمه بالا آن را به words{activeLength}.json اضافه کنید.
              </div>
            ) : (
              filteredWords.map((item, index) => {
                const displayId = item.id || `${activePrefix}${index + 1}`;
                return (
                  <div
                    key={displayId}
                    className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-purple-500/40 flex items-center justify-between gap-2 group transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        dir="ltr"
                        className="inline-flex items-center gap-0.5 text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-950/90 border border-purple-700/70 text-purple-300 font-bold shrink-0"
                      >
                        <Hash className="w-3 h-3 text-purple-400" />
                        {displayId}
                      </span>
                      <span className="text-base sm:text-lg font-black text-emerald-300 font-['Lalezar',sans-serif] truncate">
                        {item.word}
                      </span>
                    </div>

                    {/* Edit & Delete actions */}
                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(item)}
                        aria-label={`ویرایش ${item.word}`}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteWord(activeLength, item.word)}
                        aria-label={`حذف ${item.word}`}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

