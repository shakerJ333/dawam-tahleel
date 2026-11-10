import React from 'react';
import { FileText, Printer, FileSpreadsheet, RotateCcw, Trash2 } from 'lucide-react';
import { TabKey } from '../types';

interface NavTabsProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  printOrientation: 'auto' | 'landscape' | 'portrait';
  onChangeOrientation: (o: 'auto' | 'landscape' | 'portrait') => void;
  printFontSize: string;
  onChangeFontSize: (s: string) => void;
  isPrintBw: boolean;
  onTogglePrintBw: (bw: boolean) => void;
  onExportPdf: () => void;
  isExportingPdf?: boolean;
  onPrint: () => void;
  onExportExcel: () => void;
  deletedCount: number;
  onRestoreDeleted: () => void;
  onClearData: () => void;
  hasData: boolean;
}

export const TABS_CONFIG: {
  key: TabKey;
  label: string;
  icon: string;
  color: string;
}[] = [
  { key: 'dash', label: 'الرئيسية', icon: '🏠', color: '#0f8bb5' },
  { key: 'sum', label: 'ملخص المعلمين', icon: '📋', color: '#1fa67a' },
  { key: 'daily', label: 'السجل اليومي', icon: '🗓️', color: '#8b6bc2' },
  { key: 'late', label: 'التأخير', icon: '⏰', color: '#f0922b' },
  { key: 'early', label: 'المغادرات', icon: '🚪', color: '#e3b61c' },
  { key: 'abs', label: 'الغياب', icon: '🚫', color: '#e0584a' },
  { key: 'matrix', label: 'مصفوفة الغياب', icon: '🔳', color: '#3b82d6' },
  { key: 'eval', label: 'التقييم', icon: '⭐', color: '#e8a020' },
  { key: 'quality', label: 'جودة البيانات', icon: '🛡️', color: '#6f9f2f' },
  { key: 'set', label: 'الإعدادات', icon: '⚙️', color: '#6b7a8a' },
];

export const NavTabs: React.FC<NavTabsProps> = ({
  activeTab,
  onSelectTab,
  printOrientation,
  onChangeOrientation,
  printFontSize,
  onChangeFontSize,
  isPrintBw,
  onTogglePrintBw,
  onExportPdf,
  isExportingPdf,
  onPrint,
  onExportExcel,
  deletedCount,
  onRestoreDeleted,
  onClearData,
  hasData,
}) => {
  return (
    <nav className="noprint sticky top-0 z-20 flex flex-wrap items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-[#102627] border-b border-[#d5dfdb] dark:border-[#213e3f] shadow-xs">
      {/* Tab Buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        {TABS_CONFIG.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onSelectTab(tab.key)}
              style={
                isActive
                  ? {
                      backgroundColor: `color-mix(in srgb, ${tab.color} 30%, #fff)`,
                      borderColor: tab.color,
                      boxShadow: `0 0 0 2px color-mix(in srgb, ${tab.color} 35%, transparent)`,
                    }
                  : {
                      backgroundColor: `color-mix(in srgb, ${tab.color} 8%, transparent)`,
                      borderColor: `color-mix(in srgb, ${tab.color} 40%, transparent)`,
                    }
              }
              className={`inline-flex items-center gap-1.5 py-1 px-3 text-xs font-semibold rounded-xl border transition-all active:scale-95 ${
                isActive
                  ? 'text-slate-900 dark:text-white font-bold'
                  : 'text-[#141c19] dark:text-[#e6f1ee] hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span
                className="w-5 h-5 rounded-md flex items-center justify-center text-xs shrink-0"
                style={{ backgroundColor: tab.color }}
              >
                {tab.icon}
              </span>
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Print and Export Controls */}
      {hasData && (
        <div className="flex flex-wrap items-center gap-2 mr-auto text-xs">
          {/* Print Options */}
          <div className="flex items-center gap-1 text-[11px] text-[#435b54] dark:text-[#9bb5b0] bg-[#eef2ef] dark:bg-[#091718] px-2 py-1 rounded-lg border border-[#d5dfdb] dark:border-[#213e3f]">
            <select
              value={printOrientation}
              onChange={e => onChangeOrientation(e.target.value as 'auto' | 'landscape' | 'portrait')}
              className="bg-transparent text-[#141c19] dark:text-[#e6f1ee] focus:outline-hidden text-[11px]"
              aria-label="اتجاه الصفحة"
            >
              <option value="auto" className="dark:bg-[#102627]">
                اتجاه تلقائي
              </option>
              <option value="landscape" className="dark:bg-[#102627]">
                عرضي (أفقي A4)
              </option>
              <option value="portrait" className="dark:bg-[#102627]">
                طولي (عمودي A4)
              </option>
            </select>

            <select
              value={printFontSize}
              onChange={e => onChangeFontSize(e.target.value)}
              className="bg-transparent text-[#141c19] dark:text-[#e6f1ee] focus:outline-hidden text-[11px]"
              aria-label="حجم خط الطباعة"
            >
              <option value="8.5px" className="dark:bg-[#102627]">
                خط مدمج (8.5pt)
              </option>
              <option value="10px" className="dark:bg-[#102627]">
                خط صغير (10pt)
              </option>
              <option value="11px" className="dark:bg-[#102627]">
                خط عادي (11pt)
              </option>
              <option value="12.5px" className="dark:bg-[#102627]">
                خط كبير (12.5pt)
              </option>
            </select>

            <label className="flex items-center gap-1 cursor-pointer" title="توفير الحبر وطباعة أبيض وأسود">
              <input
                type="checkbox"
                checked={isPrintBw}
                onChange={e => onTogglePrintBw(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#1f8a6a]"
              />
              <span>أبيض وأسود</span>
            </label>
          </div>

          {/* PDF Export button */}
          <button
            type="button"
            onClick={onExportPdf}
            disabled={isExportingPdf}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white rounded-lg shadow-xs transition-all active:scale-95 ${
              isExportingPdf ? 'bg-slate-500 cursor-wait opacity-80' : 'bg-[#b9382b] hover:bg-rose-700'
            }`}
            title="تصدير التقرير الحالي كملف PDF رسمي أنيق بجودة عالية"
          >
            {isExportingPdf ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>{isExportingPdf ? 'جاري تجهيز PDF...' : 'تصدير PDF'}</span>
          </button>

          {/* Print button */}
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white rounded-lg bg-[#0f3d3e] dark:bg-[#165354] hover:bg-[#165354] shadow-xs transition-all active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة</span>
          </button>

          {/* Excel Export button */}
          <button
            type="button"
            onClick={onExportExcel}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#0b2b23] rounded-lg bg-[#5fd3a8] hover:bg-emerald-300 shadow-xs transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>تصدير Excel</span>
          </button>

          {/* Restore Deleted Records */}
          {deletedCount > 0 && (
            <button
              type="button"
              onClick={onRestoreDeleted}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-900 rounded-lg bg-[#c9dc6a] hover:bg-lime-400 shadow-xs transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>استعادة المحذوفات ({deletedCount})</span>
            </button>
          )}

          {/* Clear Data button */}
          <button
            type="button"
            onClick={onClearData}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white rounded-lg bg-[#f08a80] hover:bg-rose-500 shadow-xs transition-all active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>مسح البيانات</span>
          </button>
        </div>
      )}
    </nav>
  );
};
