import React from 'react';
import { DataQuality, ImportMeta } from '../../types';
import { ShieldCheck, Settings, CheckCircle2, AlertTriangle } from 'lucide-react';

interface QualityTabProps {
  quality: DataQuality;
  importMeta: ImportMeta | null;
  totalTeachers: number;
  fewCount: number;
  onOpenColumnMapping: () => void;
}

export const QualityTab: React.FC<QualityTabProps> = ({
  quality,
  importMeta,
  totalTeachers,
  fewCount,
  onOpenColumnMapping,
}) => {
  const qCards = [
    { label: 'صفوف مقروءة بنجاح', val: quality.read, color: '#1fa67a' },
    { label: 'صفوف متجاهلة (غير صالحة)', val: quality.skip, color: '#c4473a' },
    { label: 'صفوف مكررة (دُمجت آلياً)', val: quality.dup, color: '#e9a914' },
    { label: 'حركات نهاية الأسبوع', val: quality.wkend, color: '#6b7a8a' },
    { label: 'بصمة واحدة فقط باليوم', val: quality.single, color: '#f0922b' },
    { label: 'خارج النطاق الصالح للوقت', val: quality.outr, color: '#c4473a' },
    { label: 'مدة دوام أقل من ساعة', val: quality.short, color: '#f0922b' },
    { label: 'مدة دوام أكثر من 10 ساعات', val: quality.long, color: '#8b6bc2' },
    { label: 'معلمون ببيانات قليلة (<20%)', val: fewCount, color: '#e9a914' },
    { label: 'إجمالي المعلمين الفريدين', val: totalTeachers, color: '#0f3d3e' },
  ];

  const conflicts = [
    ...quality.names.map(x => `رقم وزاري بأكثر من اسم — ${x}`),
    ...quality.ids.map(x => `اسم معلم بأكثر من رقم وزاري — ${x}`),
  ];

  return (
    <div className="space-y-4">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {qCards.map((c, i) => (
          <div
            key={i}
            className="p-3 bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl shadow-xs"
            style={{ borderTop: `4px solid ${c.color}` }}
          >
            <span className="text-[11px] text-[#435b54] dark:text-[#9bb5b0] block mb-1">
              {c.label}
            </span>
            <b className="text-xl font-bold font-reem text-[#141c19] dark:text-[#e6f1ee]">
              {c.val.toLocaleString('ar-EG')}
            </b>
          </div>
        ))}
      </div>

      {/* Import Configuration Details */}
      {importMeta && (
        <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 rounded-xl shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <b className="text-sm font-bold text-[#0f3d3e] dark:text-[#f2b933] flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-[#1f8a6a]" />
                خريطة استيراد ومطابقة أعمدة ملف البصمة الحالي ({importMeta.fileName})
              </b>
              <div className="mt-2 text-xs text-[#141c19] dark:text-[#e6f1ee] leading-relaxed">
                • الترويسة المكتشفة: <b>الصف رقم {importMeta.headerRow + 1}</b>
                <br />
                • نمط السجلات: <b>{importMeta.pattern}</b>
                <br />
                • عمود الرقم: <b>{importMeta.ix.id >= 0 ? `عمود ${importMeta.ix.id + 1}` : 'غير محدد'}</b> |
                عمود الاسم: <b>{importMeta.ix.name >= 0 ? `عمود ${importMeta.ix.name + 1}` : 'غير محدد'}</b> |
                عمود التاريخ: <b>{importMeta.ix.date >= 0 ? `عمود ${importMeta.ix.date + 1}` : 'غير محدد'}</b> |
                عمود الدخول: <b>{importMeta.ix.in >= 0 ? `عمود ${importMeta.ix.in + 1}` : 'غير محدد'}</b> |
                عمود الخروج: <b>{importMeta.ix.out >= 0 ? `عمود ${importMeta.ix.out + 1}` : 'غير محدد'}</b>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenColumnMapping}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl bg-[#1f8a6a] hover:bg-[#165354] shadow-xs transition-all active:scale-95"
            >
              <Settings className="w-4 h-4" />
              <span>فتح مساعد مطابقة الأعمدة</span>
            </button>
          </div>
        </div>
      )}

      {/* Conflict Diagnostics */}
      <div className="p-4 bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl shadow-xs">
        <h3 className="flex items-center gap-2 text-sm font-bold font-reem text-[#0f3d3e] dark:text-[#f2b933] mb-3">
          <ShieldCheck className="w-5 h-5 text-[#1f8a6a]" />
          فحص تعارض الأسماء والأرقام الوزارية
        </h3>
        {conflicts.length ? (
          <div className="space-y-2">
            {conflicts.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2.5 text-xs rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-r-4 border-[#e9a914]"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{c}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border-r-4 border-emerald-500 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>لا توجد أي تعارضات في الأرقام الوزارية أو أسماء المعلمين ✓</span>
          </div>
        )}
      </div>
    </div>
  );
};
