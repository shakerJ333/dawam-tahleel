import React from 'react';
import { fm } from '../utils/engine';
import { AppConfig } from '../types';

interface PrintHeaderFooterProps {
  tabTitle: string;
  schoolName: string;
  dateFrom: string;
  dateTo: string;
  cfg: AppConfig;
  totalTeachers: number;
}

export const PrintHeader: React.FC<PrintHeaderFooterProps> = ({
  tabTitle,
  schoolName,
  dateFrom,
  dateTo,
  cfg,
  totalTeachers,
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const ym =
    dateFrom && dateTo
      ? dateFrom.slice(0, 7) === dateTo.slice(0, 7)
        ? `شهر ${+dateFrom.slice(5, 7)}/${dateFrom.slice(0, 4)}`
        : `الفترة من ${dateFrom} إلى ${dateTo}`
      : '';

  return (
    <div className="printhead hidden print:block mb-4 text-[#141c19]">
      <div className="flex items-center justify-between gap-4 pb-2.5 text-xs text-[#141c19] border-b-2 border-[#0f3d3e]">
        <div className="text-right leading-relaxed text-xs">
          <b className="text-sm font-bold text-[#0f3d3e]">المملكة العربية السعودية</b>
          <br />
          وزارة التعليم
          <br />
          إدارة التعليم العامة
          <br />
          <b className="text-[#0f3d3e]">مدرسة: {schoolName || 'المدرسة'}</b>
        </div>
        <div className="text-center">
          <div className="text-2xl leading-none mb-1">📊</div>
          <h2 className="text-lg font-bold m-0 text-[#0f3d3e] font-reem">تقرير {tabTitle}</h2>
          <h3 className="text-xs font-semibold m-0 text-[#435b54]">دوام الهيئة التعليمية والإدارية — {ym}</h3>
        </div>
        <div className="text-left text-xs leading-relaxed" dir="rtl">
          <span>
            تاريخ استخراج التقرير: <b>{today}</b>
          </span>
          <br />
          <span>
            الدوام الرسمي: <b>{fm(cfg.start)} - {fm(cfg.end)}</b>
          </span>
          <br />
          <span>
            إجمالي الكادر: <b>{totalTeachers} معلم</b>
          </span>
        </div>
      </div>
    </div>
  );
};

export const PrintFooter: React.FC = () => {
  return (
    <div className="printfoot hidden print:flex items-start justify-between gap-6 mt-8 pt-4 border-t-2 border-[#0f3d3e] text-[#141c19]">
      <div className="flex-1 text-center text-xs">
        <b className="block mb-6 text-sm text-[#0f3d3e]">مُعِدّ التقرير / مسؤول الدوام</b>
        <div className="text-right text-xs mb-1">الاسم: .......................................</div>
        <div className="text-right text-xs">التوقيع: .....................................</div>
      </div>
      <div className="flex-1 text-center text-xs">
        <b className="block mb-6 text-sm text-[#0f3d3e]">وكيل / وكيلة المدرسة</b>
        <div className="text-right text-xs mb-1">الاسم: .......................................</div>
        <div className="text-right text-xs">التوقيع: .....................................</div>
      </div>
      <div className="flex-1 text-center text-xs">
        <b className="block mb-6 text-sm text-[#0f3d3e]">مدير / مديرة المدرسة</b>
        <div className="text-right text-xs mb-1">الاسم: .......................................</div>
        <div className="text-right text-xs">التوقيع: .....................................</div>
      </div>
      <div className="w-28 h-24 border-2 border-dashed border-[#0f3d3e]/60 rounded-xl flex items-center justify-center text-xs text-[#435b54] text-center p-2 font-bold bg-[#f6f9f7]">
        ختم المدرسة الرسمي
      </div>
    </div>
  );
};
