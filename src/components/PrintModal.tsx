import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  FileText,
  Sliders,
  Maximize2,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AppConfig } from '../types';
import { fm } from '../utils/engine';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrintNow: (orient: 'landscape' | 'portrait', zoom: number, fontSize: string) => void;
  onExportPdf: () => void;
  tabTitle: string;
  schoolName: string;
  dateFrom: string;
  dateTo: string;
  cfg: AppConfig;
  totalTeachers: number;
  printOrientation: 'auto' | 'landscape' | 'portrait';
  onChangeOrientation: (o: 'auto' | 'landscape' | 'portrait') => void;
  printFontSize: string;
  onChangeFontSize: (s: string) => void;
  isPrintBw: boolean;
  onTogglePrintBw: (bw: boolean) => void;
  isExportingPdf?: boolean;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  onPrintNow,
  onExportPdf,
  tabTitle,
  schoolName,
  dateFrom,
  dateTo,
  cfg,
  totalTeachers,
  printOrientation,
  onChangeOrientation,
  printFontSize,
  onChangeFontSize,
  isPrintBw,
  onTogglePrintBw,
  isExportingPdf,
}) => {
  const [selectedOrient, setSelectedOrient] = useState<'landscape' | 'portrait'>('landscape');
  const [fitMode, setFitMode] = useState<'auto' | '100' | '90' | '80' | '70'>('auto');
  const [computedZoom, setComputedZoom] = useState<number>(0.85);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  // Initialize orientation based on current tab
  useEffect(() => {
    if (isOpen) {
      if (printOrientation === 'auto') {
        setSelectedOrient('landscape');
      } else {
        setSelectedOrient(printOrientation);
      }
    }
  }, [isOpen, printOrientation]);

  // Measure table width in document to calculate optimal A4 fit ratio
  useEffect(() => {
    if (!isOpen) return;
    const table = document.querySelector('#printable-content-root table') as HTMLElement;
    if (table) {
      const scrollW = table.scrollWidth || 1400;
      // A4 printable width in px (96 DPI): Landscape ~1080px, Portrait ~760px
      const a4Width = selectedOrient === 'landscape' ? 1080 : 760;
      if (fitMode === 'auto') {
        const autoRatio = Math.max(0.42, Math.min(1, a4Width / Math.max(scrollW, 1000)));
        setComputedZoom(+autoRatio.toFixed(2));
      } else {
        setComputedZoom(+fitMode / 100);
      }
    } else {
      setComputedZoom(selectedOrient === 'landscape' ? 0.9 : 0.75);
    }
  }, [isOpen, selectedOrient, fitMode]);

  if (!isOpen) return null;

  const handlePrint = () => {
    onPrintNow(selectedOrient, computedZoom, printFontSize);
  };

  const today = new Date().toISOString().slice(0, 10);
  const ym =
    dateFrom && dateTo
      ? dateFrom.slice(0, 7) === dateTo.slice(0, 7)
        ? `شهر ${+dateFrom.slice(5, 7)}/${dateFrom.slice(0, 4)}`
        : `الفترة من ${dateFrom} إلى ${dateTo}`
      : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white dark:bg-[#102627] rounded-2xl shadow-2xl border border-[#d5dfdb] dark:border-[#213e3f] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#0f3d3e] text-white flex items-center justify-between border-b-2 border-[#e9a914]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-[#e9a914]">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold font-reem text-white m-0">
                إعداد ومعاينة الطباعة — مقاس A4 المعتمد
              </h2>
              <p className="text-xs text-[#cfe3de] mt-0.5">
                ملاءمة محتوى جدول «{tabTitle}» ليتناسب بدقة مع أبعاد ورقة A4 دون اقتطاع
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Control Toolbar */}
        <div className="p-3.5 bg-[#f6f9f7] dark:bg-[#091718] border-b border-[#d5dfdb] dark:border-[#213e3f] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Page Orientation */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#435b54] dark:text-[#9bb5b0]">اتجاه الورقة:</span>
              <div className="inline-flex rounded-lg border border-[#9fb3ad] dark:border-[#386062] p-0.5 bg-white dark:bg-[#102627]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrient('landscape');
                    onChangeOrientation('landscape');
                  }}
                  className={`px-3 py-1 rounded-md font-bold transition-all ${
                    selectedOrient === 'landscape'
                      ? 'bg-[#0f3d3e] text-white shadow-2xs'
                      : 'text-[#435b54] dark:text-[#9bb5b0] hover:bg-slate-100'
                  }`}
                >
                  عرضي (أفقي A4)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrient('portrait');
                    onChangeOrientation('portrait');
                  }}
                  className={`px-3 py-1 rounded-md font-bold transition-all ${
                    selectedOrient === 'portrait'
                      ? 'bg-[#0f3d3e] text-white shadow-2xs'
                      : 'text-[#435b54] dark:text-[#9bb5b0] hover:bg-slate-100'
                  }`}
                >
                  طولي (عمودي A4)
                </button>
              </div>
            </div>

            {/* A4 Fitting Mode */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#435b54] dark:text-[#9bb5b0]">ملاءمة A4:</span>
              <select
                value={fitMode}
                onChange={e => setFitMode(e.target.value as any)}
                className="px-2.5 py-1 font-bold bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded-lg text-xs"
              >
                <option value="auto">ملاءمة تلقائية لعرض A4 ({Math.round(computedZoom * 100)}%)</option>
                <option value="100">الحجم الطبيعي 100%</option>
                <option value="90">مقياس 90%</option>
                <option value="80">مقياس 80% (مدمج)</option>
                <option value="70">مقياس 70% (للجداول العريضة جداً)</option>
              </select>
            </div>

            {/* Print Font Size */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#435b54] dark:text-[#9bb5b0]">حجم الخط:</span>
              <select
                value={printFontSize}
                onChange={e => onChangeFontSize(e.target.value)}
                className="px-2 py-1 font-semibold bg-white dark:bg-[#102627] border border-[#9fb3ad] dark:border-[#386062] rounded-lg text-xs"
              >
                <option value="8.5px">مدمج (8.5pt)</option>
                <option value="9.5px">صغير (9.5pt)</option>
                <option value="10.5px">عادي (10.5pt)</option>
                <option value="12px">كبير (12pt)</option>
              </select>
            </div>

            {/* B&W Ink Saver */}
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold select-none">
              <input
                type="checkbox"
                checked={isPrintBw}
                onChange={e => onTogglePrintBw(e.target.checked)}
                className="w-4 h-4 rounded text-[#1f8a6a]"
              />
              <span>توفير الحبر (أبيض وأسود)</span>
            </label>
          </div>

          <div className="text-[11px] text-[#435b54] dark:text-[#9bb5b0]">
            المقياس المعتمد: <b>{Math.round(computedZoom * 100)}%</b> | مقاس الورق: <b>A4 ({selectedOrient === 'landscape' ? '297 × 210 مم' : '210 × 297 مم'})</b>
          </div>
        </div>

        {/* Live Preview Paper */}
        <div
          ref={previewContainerRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#dbe4e0] dark:bg-[#071314] flex justify-center custom-scroll"
        >
          {/* Simulated Physical A4 Sheet */}
          <div
            className={`bg-white text-[#141c19] shadow-xl border border-slate-300 p-6 md:p-8 transition-all ${
              selectedOrient === 'landscape'
                ? 'w-full max-w-[940px] min-h-[660px]'
                : 'w-full max-w-[700px] min-h-[960px]'
            }`}
            style={{
              fontFamily: 'Tajawal, Cairo, sans-serif',
              filter: isPrintBw ? 'grayscale(100%)' : 'none',
            }}
          >
            {/* Simulated Official Header */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#0f3d3e] text-xs mb-4">
              <div className="text-right leading-relaxed">
                <b className="text-sm font-bold text-[#0f3d3e]">المملكة العربية السعودية</b>
                <br />
                وزارة التعليم
                <br />
                إدارة التعليم العامة
                <br />
                <b className="text-[#0f3d3e]">مدرسة: {schoolName || 'المدرسة'}</b>
              </div>
              <div className="text-center">
                <div className="text-xl mb-0.5">📊</div>
                <h3 className="text-base font-bold font-reem text-[#0f3d3e] m-0">
                  تقرير {tabTitle}
                </h3>
                <span className="text-[11px] text-slate-600 font-semibold">
                  دوام الهيئة التعليمية والإدارية — {ym}
                </span>
              </div>
              <div className="text-left text-[11px] leading-relaxed" dir="rtl">
                <span>تاريخ التقرير: <b>{today}</b></span>
                <br />
                <span>الدوام الرسمي: <b>{fm(cfg.start)} - {fm(cfg.end)}</b></span>
                <br />
                <span>إجمالي الكادر: <b>{totalTeachers} معلم</b></span>
              </div>
            </div>

            {/* Note badge */}
            <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center justify-between">
              <span>
                ✓ تم ضبط تناسب الجدول تلقائياً ليغطي عرض صفحة A4 بالكامل ({Math.round(computedZoom * 100)}%) دون أي اقتطاع للأعمدة.
              </span>
              <span className="font-mono font-bold text-xs">A4 {selectedOrient === 'landscape' ? 'أفقي' : 'عمودي'}</span>
            </div>

            {/* Table preview notice */}
            <div className="text-center py-8 px-4 border-2 border-dashed border-[#0f3d3e]/30 rounded-xl bg-[#f6f9f7] my-4">
              <p className="text-sm font-bold text-[#0f3d3e] mb-1">
                محتوى جدول «{tabTitle}» جاهز للطباعة والتصدير بكامل التنسيقات
              </p>
              <p className="text-xs text-[#435b54] max-w-md mx-auto leading-relaxed">
                ستتم طباعة جميع أعمدة وصفوف الجدول المحددة مع المحافظة على ألوان الشارات، والأرقام الكبيرة، وتنسيقات الحضور والغياب دون أي اقتطاع.
              </p>
            </div>

            {/* Simulated Official Footer */}
            <div className="flex items-start justify-between gap-4 mt-8 pt-4 border-t-2 border-[#0f3d3e] text-xs">
              <div className="flex-1 text-center">
                <b className="block mb-6 text-xs text-[#0f3d3e]">مسؤول الدوام / مُعِدّ التقرير</b>
                <div className="text-right text-[10px]">الاسم: ...............................</div>
              </div>
              <div className="flex-1 text-center">
                <b className="block mb-6 text-xs text-[#0f3d3e]">وكيل / وكيلة المدرسة</b>
                <div className="text-right text-[10px]">الاسم: ...............................</div>
              </div>
              <div className="flex-1 text-center">
                <b className="block mb-6 text-xs text-[#0f3d3e]">مدير / مديرة المدرسة</b>
                <div className="text-right text-[10px]">الاسم: ...............................</div>
              </div>
              <div className="w-20 h-16 border-2 border-dashed border-[#0f3d3e]/50 rounded-lg flex items-center justify-center text-[10px] text-slate-500 font-bold bg-slate-50 text-center">
                ختم المدرسة
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="p-4 bg-white dark:bg-[#102627] border-t border-[#d5dfdb] dark:border-[#213e3f] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#435b54] dark:text-[#9bb5b0]">
            <Sparkles className="w-4 h-4 text-[#e9a914]" />
            <span>
              نصيحة: يمكنك استخدام خيار <b>«حفظ بتنسيق PDF»</b> من نافذة الطباعة للحصول على ملف متجهي (Vector) فائق الوضوح.
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              إلغاء
            </button>

            {/* Direct A4 PDF Download */}
            <button
              type="button"
              onClick={() => {
                onExportPdf();
                onClose();
              }}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl bg-[#b9382b] hover:bg-rose-700 shadow-xs transition-all active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>تنزيل كملف PDF متناسب مع A4</span>
            </button>

            {/* Execute Print Now */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-white rounded-xl bg-[#0f3d3e] hover:bg-[#1f8a6a] shadow-xs transition-all active:scale-95"
            >
              <Printer className="w-4 h-4 text-[#e9a914]" />
              <span>🖨️ طباعة الآن (Print)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
