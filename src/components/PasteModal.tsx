import React, { useState } from 'react';
import { Clipboard, Check, X, FileText } from 'lucide-react';

interface PasteModalProps {
  isOpen: boolean;
  onImportRows: (rows: string[][], sourceName: string) => void;
  onClose: () => void;
}

export const PasteModal: React.FC<PasteModalProps> = ({
  isOpen,
  onImportRows,
  onClose,
}) => {
  const [text, setText] = useState('');
  const [parsedRows, setParsedRows] = useState<string[][]>([]);

  if (!isOpen) return null;

  const parseRawText = (raw: string) => {
    setText(raw);
    const lines = raw
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);
    if (!lines.length) {
      setParsedRows([]);
      return;
    }

    const firstLine = lines[0];
    let delim = '\t';
    if (!firstLine.includes('\t')) {
      if (firstLine.includes(';')) delim = ';';
      else if (firstLine.includes(',')) delim = ',';
      else if (firstLine.includes('|')) delim = '|';
    }

    const rows = lines.map(line =>
      line.split(delim).map(c => c.trim().replace(/^["']|["']$/g, ''))
    );
    setParsedRows(rows);
  };

  const loadSamplePaste = () => {
    const sample =
      "الرقم الوزاري\tاسم المعلم\tالتاريخ\tأول تسجيل دخول\tآخر تسجيل خروج\tالمدرسة\n" +
      "104201\tسلطان بن حمود الحربي\t2026-10-04\t07:35\t12:25\tمدرسة الأمل الثانوية\n" +
      "104202\tمحمد بن إبراهيم القحطاني\t2026-10-04\t07:42\t12:20\tمدرسة الأمل الثانوية\n" +
      "104203\tخالد بن ناصر الغامدي\t2026-10-04\t07:55\t12:30\tمدرسة الأمل الثانوية";
    parseRawText(sample);
  };

  const handleSubmit = () => {
    if (!parsedRows.length) return;
    onImportRows(parsedRows, 'بيانات_ملصقة_من_الحافظة.xlsx');
    onClose();
  };

  const colCount = parsedRows.length ? Math.max(...parsedRows.map(r => r.length)) : 0;
  const sample = parsedRows.slice(0, 4);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-white dark:bg-[#102627] text-[#141c19] dark:text-[#e6f1ee] rounded-2xl shadow-2xl border-2 border-[#d5dfdb] dark:border-[#386062] transition-transform animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#d5dfdb] dark:border-[#213e3f]">
          <h3 className="flex items-center gap-2 text-xl font-bold font-reem text-[#0f3d3e] dark:text-[#f2b933]">
            <Clipboard className="w-6 h-6 text-[#1f8a6a]" />
            لصق بيانات البصمة مباشرة من إكسل أو الحافظة
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <p className="mb-3 text-xs text-[#435b54] dark:text-[#9bb5b0] leading-relaxed">
          انسخ جدول الحركات من أي ملف Excel أو Google Sheets أو نظام نور، ثم الصقه هنا (Ctrl+V):
        </p>

        <textarea
          dir="ltr"
          value={text}
          onChange={e => parseRawText(e.target.value)}
          placeholder="Paste table here (supports tab-separated or comma-separated rows)..."
          className="w-full min-h-[160px] p-3 text-xs font-mono bg-[#eef2ef] dark:bg-[#091718] text-[#141c19] dark:text-[#e6f1ee] border border-[#9fb3ad] dark:border-[#386062] rounded-xl focus:outline-hidden focus:border-[#1f8a6a]"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs">
          <div className="font-semibold text-[#435b54] dark:text-[#9bb5b0]">
            {parsedRows.length > 0 ? (
              <span className="text-[#1f8a6a] font-bold">
                ✓ تم رصد {parsedRows.length.toLocaleString('ar-EG')} صفاً و {colCount.toLocaleString('ar-EG')} أعمدة
              </span>
            ) : (
              'لم يتم لصق أي بيانات بعد'
            )}
          </div>
          <button
            type="button"
            onClick={loadSamplePaste}
            className="flex items-center gap-1 px-3 py-1 text-xs font-medium border border-[#9fb3ad] dark:border-[#386062] rounded-lg hover:bg-[#eef2ef] dark:hover:bg-[#091718]"
          >
            <FileText className="w-3.5 h-3.5 text-[#1f8a6a]" />
            تجربة نص نموذجي
          </button>
        </div>

        {sample.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-xs font-bold text-[#0f3d3e] dark:text-[#f2b933]">
              معاينة أول 4 صفوف من الجدول الملصق:
            </div>
            <div className="overflow-x-auto border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl max-h-36 custom-scroll">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-[#d3e7e0] dark:bg-[#082829] text-[#0e3334] dark:text-[#eaf3f0] font-bold sticky top-0">
                    {sample[0].map((c, i) => (
                      <th key={i} className="p-2 border border-[#9fb3ad] dark:border-[#386062] whitespace-nowrap">
                        {c || `عمود ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sample.slice(1).map((r, ri) => (
                    <tr key={ri} className="odd:bg-white even:bg-slate-50 dark:odd:bg-[#102627] dark:even:bg-[#091718]">
                      {sample[0].map((_, ci) => (
                        <td key={ci} className="p-2 border border-[#d5dfdb] dark:border-[#213e3f] whitespace-nowrap">
                          {r[ci] || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-4 border-t border-[#d5dfdb] dark:border-[#213e3f]">
          <button
            type="button"
            disabled={!parsedRows.length}
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-6 py-2 text-sm font-bold text-white rounded-xl bg-[#1f8a6a] hover:bg-[#165354] disabled:opacity-50 disabled:pointer-events-none shadow-sm transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            معالجة واستيراد الجدول
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
