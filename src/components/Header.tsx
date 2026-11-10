import React from 'react';
import {
  FileSpreadsheet,
  Moon,
  Sun,
  ClipboardPaste,
  HelpCircle,
  Search,
  Calendar,
  Building,
} from 'lucide-react';

interface HeaderProps {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadDemo: () => void;
  onOpenPasteModal: () => void;
  onOpenHelpModal: () => void;
  schools: string[];
  selectedSchool: string;
  onSelectSchool: (s: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (d: string) => void;
  onDateToChange: (d: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  hasData: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onFileUpload,
  onLoadDemo,
  onOpenPasteModal,
  onOpenHelpModal,
  schools,
  selectedSchool,
  onSelectSchool,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  searchQuery,
  onSearchChange,
  isDark,
  onToggleTheme,
  hasData,
}) => {
  return (
    <header className="noprint bg-[#0f3d3e] dark:bg-[#062021] text-[#f4f7f5] px-4 py-3 md:px-6 md:py-3.5 border-b-4 border-[#e9a914] shadow-md flex flex-wrap items-center justify-between gap-3">
      {/* Brand */}
      <div className="flex items-center gap-3 shrink-0">
        <svg
          className="w-10 h-10 text-[#e9a914] stroke-current"
          viewBox="0 0 40 40"
          fill="none"
          strokeWidth="2.6"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M6 25a14 14 0 0 1 28 0" stroke="#f4f7f5" />
          <path d="M11 27a9 9 0 0 1 18 0" />
          <path d="M16 29a4 4 0 0 1 8 0" stroke="#f4f7f5" />
          <path d="M20 21v14" />
          <circle cx="20" cy="37" r="1.5" fill="currentColor" />
        </svg>
        <div>
          <h1 className="text-lg md:text-xl font-bold font-reem text-[#f4f7f5] leading-tight">
            نظام تحليل بصمة الدوام
          </h1>
          <small className="text-xs text-[#a9c4be] block">
            حضور وانصراف مدرستك بنظرة واحدة — معالجة محلية 100%
          </small>
        </div>
      </div>

      {/* Tools */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Upload File Input */}
        <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0b2e2f] border border-[#2f6567] hover:border-[#e9a914] transition-colors text-[#f4f7f5]">
          <FileSpreadsheet className="w-4 h-4 text-[#e9a914]" />
          <span>رفع ملف البصمة</span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onFileUpload}
            className="hidden"
          />
        </label>

        {/* Demo Data button */}
        <button
          type="button"
          onClick={onLoadDemo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#174e50] border border-[#3a7a7c] hover:border-[#e9a914] hover:bg-[#206265] transition-colors font-semibold text-[#f4f7f5]"
          title="تحميل بيانات نموذجية تجريبية للتجربة فوراً"
        >
          <span>📊</span>
          <span>بيانات تجريبية</span>
        </button>

        {/* Direct Paste */}
        <button
          type="button"
          onClick={onOpenPasteModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#174e50] border border-[#3a7a7c] hover:border-[#e9a914] hover:bg-[#206265] transition-colors text-[#f4f7f5]"
          title="لصق جدول بصمات من الحافظة مباشرة"
        >
          <ClipboardPaste className="w-3.5 h-3.5 text-[#e9a914]" />
          <span>لصق جدول</span>
        </button>

        {/* Help guide */}
        <button
          type="button"
          onClick={onOpenHelpModal}
          className="p-1.5 rounded-lg bg-[#0b2e2f] border border-[#2f6567] hover:border-[#e9a914] text-[#a9c4be] hover:text-[#f4f7f5] transition-colors"
          title="دليل التوافق والأجهزة"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {hasData && (
          <>
            {/* School filter */}
            {schools.length > 1 && (
              <div className="flex items-center gap-1 bg-[#0b2e2f] border border-[#2f6567] rounded-lg px-2 py-1 text-[#f4f7f5]">
                <Building className="w-3.5 h-3.5 text-[#a9c4be]" />
                <select
                  value={selectedSchool}
                  onChange={e => onSelectSchool(e.target.value)}
                  className="bg-transparent text-xs text-[#f4f7f5] focus:outline-hidden"
                >
                  <option value="" className="bg-[#0b2e2f] text-white">
                    كل المدارس
                  </option>
                  {schools.map(s => (
                    <option key={s} value={s} className="bg-[#0b2e2f] text-white">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date range */}
            <div className="flex items-center gap-1 bg-[#0b2e2f] border border-[#2f6567] rounded-lg px-2 py-1 text-[#f4f7f5]">
              <Calendar className="w-3.5 h-3.5 text-[#a9c4be]" />
              <label className="text-[11px] text-[#a9c4be]">من</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => onDateFromChange(e.target.value)}
                className="bg-transparent text-xs text-[#f4f7f5] focus:outline-hidden"
              />
              <label className="text-[11px] text-[#a9c4be]">إلى</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => onDateToChange(e.target.value)}
                className="bg-transparent text-xs text-[#f4f7f5] focus:outline-hidden"
              />
            </div>

            {/* Search query */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute right-2.5 text-[#a9c4be] pointer-events-none" />
              <input
                type="search"
                placeholder="بحث بالاسم أو الرقم…"
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                className="pr-8 pl-3 py-1 bg-[#0b2e2f] border border-[#2f6567] rounded-lg text-xs text-[#f4f7f5] placeholder-[#7fa39d] focus:outline-hidden focus:border-[#e9a914] w-36 md:w-44"
              />
            </div>
          </>
        )}

        {/* Theme toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg bg-[#0b2e2f] border border-[#2f6567] hover:border-[#e9a914] text-[#f4f7f5] transition-colors"
          title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
          aria-label="تبديل الوضع"
        >
          {isDark ? <Sun className="w-4 h-4 text-[#e9a914]" /> : <Moon className="w-4 h-4 text-[#f4f7f5]" />}
        </button>
      </div>
    </header>
  );
};
