import React from 'react';
import {
  FileSpreadsheet,
  Download,
  ClipboardPaste,
  HelpCircle,
  ShieldCheck,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { downloadTemplate } from '../utils/engine';

interface EmptyStateProps {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDropFiles: (files: FileList) => void;
  onLoadDemo: () => void;
  onOpenPasteModal: () => void;
  onOpenHelpModal: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onFileUpload,
  onDropFiles,
  onLoadDemo,
  onOpenPasteModal,
  onOpenHelpModal,
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      onDropFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-8 px-4 flex flex-col items-center gap-6">
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full flex flex-col items-center justify-center p-10 md:p-14 border-3 border-dashed rounded-3xl cursor-pointer text-center transition-all ${
          isDragOver
            ? 'border-[#1f8a6a] bg-amber-50/50 dark:bg-amber-950/20 scale-[1.01]'
            : 'border-[#e9a914] bg-white dark:bg-[#102627] hover:bg-[#eef2ef]/60 dark:hover:bg-[#172a2b] shadow-lg'
        }`}
      >
        <svg
          className="w-20 h-20 text-[#0f3d3e] dark:text-[#f2b933] stroke-current mb-4"
          viewBox="0 0 40 40"
          fill="none"
          strokeWidth="2.4"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M6 25a14 14 0 0 1 28 0" stroke="#f4f7f5" />
          <path d="M11 27a9 9 0 0 1 18 0" />
          <path d="M16 29a4 4 0 0 1 8 0" stroke="#f4f7f5" />
          <path d="M20 21v14" />
          <circle cx="20" cy="37" r="1.5" fill="currentColor" />
        </svg>

        <b className="text-2xl md:text-3xl font-bold font-reem text-[#141c19] dark:text-[#e6f1ee] mb-1">
          اسحب ملف البصمة إلى هنا
        </b>
        <span className="text-sm text-[#435b54] dark:text-[#9bb5b0] mb-2">
          أو اضغط لاختياره من جهازك (يدعم ملفات Excel بصيغة .xlsx / .xls أو .csv)
        </span>
        <em className="text-xs font-semibold text-[#1f8a6a] dark:text-[#4fd1a1] not-italic mb-6">
          🔒 معالجة محلية ذكية 100% داخل المتصفح بأمان تام دون رفع أي بيانات إلى خوادم خارجية
        </em>

        {/* Feature Badges */}
        <div className="flex flex-wrap justify-center gap-2 max-w-xl">
          <span className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-[#e9a914]" />
            كشف ذكي تلقائي للترويسة والأعمدة
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 text-[#1f8a6a]" />
            دعم كامل للأوقات صباحاً ومساءً (ص / م و AM/PM)
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            دمج الحركات وتحديد أول دخول وآخر خروج
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            متوافق مع ZKTeco، نظام نور، Suprema وغيرها
          </span>
        </div>

        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onFileUpload}
          className="hidden"
        />
      </label>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full">
        <button
          type="button"
          onClick={onLoadDemo}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-[#0f3d3e] dark:bg-[#165354] hover:bg-[#165354] border border-[#e9a914] shadow-md transition-all active:scale-95"
        >
          <FileSpreadsheet className="w-4 h-4 text-[#e9a914]" />
          تحميل بيانات نموذجية تجريبية (مدرسة الأمل الثانوية)
        </button>

        <button
          type="button"
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-[#165354] hover:bg-[#0f3d3e] border border-teal-500/30 shadow-md transition-all active:scale-95"
        >
          <Download className="w-4 h-4" />
          تحميل نموذج إكسل جاهز للتعبئة (.xlsx)
        </button>

        <button
          type="button"
          onClick={onOpenPasteModal}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-[#102627] text-[#141c19] dark:text-[#e6f1ee] border border-[#d5dfdb] dark:border-[#386062] hover:border-[#1f8a6a] shadow-xs transition-all active:scale-95"
        >
          <ClipboardPaste className="w-4 h-4 text-[#1f8a6a]" />
          لصق جدول من الحافظة
        </button>

        <button
          type="button"
          onClick={onOpenHelpModal}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-[#102627] text-[#141c19] dark:text-[#e6f1ee] border border-[#d5dfdb] dark:border-[#386062] hover:border-[#1f8a6a] shadow-xs transition-all active:scale-95"
        >
          <HelpCircle className="w-4 h-4 text-[#1f8a6a]" />
          دليل التوافق والأجهزة
        </button>
      </div>
    </div>
  );
};
