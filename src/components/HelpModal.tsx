import React from 'react';
import { HelpCircle, X, Download, ShieldCheck, Clock, FileSpreadsheet } from 'lucide-react';
import { downloadTemplate } from '../utils/engine';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

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
            <HelpCircle className="w-6 h-6 text-[#1f8a6a]" />
            دليل التوافق واستيراد بصمات الدوام
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <p className="mb-4 text-xs text-[#435b54] dark:text-[#9bb5b0] leading-relaxed">
          صُمم النظام ليتعامل تلقائياً بمرونة فائقة مع كافة برامج وأجهزة البصمة المدرسية دون الحاجة لتعديل الملف يدوياً:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="p-3.5 bg-[#eef2ef] dark:bg-[#091718] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl">
            <div className="flex items-center gap-2 mb-2 font-bold text-xs text-[#0f3d3e] dark:text-[#f2b933]">
              <FileSpreadsheet className="w-4 h-4 text-[#1f8a6a]" />
              الصيغ والملفات المدعومة
            </div>
            <div className="text-xs text-[#435b54] dark:text-[#9bb5b0] leading-relaxed">
              • ملفات Excel الحديثة (.xlsx)<br />
              • ملفات Excel القديمة (.xls)<br />
              • ملفات القيم المفصولة (.csv, .tsv)<br />
              • لصق نصوص الحافظة مباشرة (Ctrl+V)
            </div>
          </div>

          <div className="p-3.5 bg-[#eef2ef] dark:bg-[#091718] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl">
            <div className="flex items-center gap-2 mb-2 font-bold text-xs text-[#0f3d3e] dark:text-[#f2b933]">
              <ShieldCheck className="w-4 h-4 text-[#1f8a6a]" />
              الأجهزة والأنظمة المتوافقة
            </div>
            <div className="text-xs text-[#435b54] dark:text-[#9bb5b0] leading-relaxed">
              • أجهزة ZKTeco بكافة إصداراتها<br />
              • منصة نظام نور ونظام مدرستي<br />
              • أجهزة BioStar و Suprema<br />
              • أجهزة FingerTec و Hikvision
            </div>
          </div>

          <div className="p-3.5 bg-[#eef2ef] dark:bg-[#091718] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl">
            <div className="flex items-center gap-2 mb-2 font-bold text-xs text-[#0f3d3e] dark:text-[#f2b933]">
              <Clock className="w-4 h-4 text-[#1f8a6a]" />
              صيغ الأوقات والتواريخ
            </div>
            <div className="text-xs text-[#435b54] dark:text-[#9bb5b0] leading-relaxed">
              • نظام 12 ساعة مع (ص / م أو AM/PM)<br />
              • نظام 24 ساعة العسكري (07:45، 13:15)<br />
              • التواريخ الهجرية والميلادية والشرطية<br />
              • التاريخ والوقت في خلية واحدة مدمجة
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 leading-relaxed mb-5">
          <b className="block mb-1 font-bold text-amber-950 dark:text-amber-100">💡 نمطا الحركات المدعومان:</b>
          1. <b>نمط السجل المباشر:</b> كل صف يحتوي على اسم المعلم، التاريخ، وقت الدخول، ووقت الخروج في أعمدة منفصلة.<br />
          2. <b>نمط الحركات المتتالية (Logs):</b> كل حركة بصمة في صف مستقل. يقوم النظام آلياً بدمج حركات اليوم واحتساب أول بصمة كدخول وآخر بصمة كخروج.
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#d5dfdb] dark:border-[#213e3f]">
          <button
            type="button"
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl bg-[#0f3d3e] dark:bg-[#165354] hover:bg-[#165354] shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            تحميل نموذج إكسل جاهز للتعبئة (.xlsx)
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
