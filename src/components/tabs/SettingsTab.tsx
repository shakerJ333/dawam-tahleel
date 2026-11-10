import React, { useState } from 'react';
import { AppConfig } from '../../types';
import { fm, toM, DAYS } from '../../utils/engine';
import { Save, RotateCcw, Check } from 'lucide-react';

interface SettingsTabProps {
  cfg: AppConfig;
  onSaveConfig: (newCfg: AppConfig) => void;
  onResetDefault: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  cfg,
  onSaveConfig,
  onResetDefault,
}) => {
  const [localCfg, setLocalCfg] = useState<AppConfig>({ ...cfg });
  const [savedMessage, setSavedMessage] = useState(false);

  const handleChange = (key: keyof AppConfig, value: any) => {
    setLocalCfg(prev => ({ ...prev, [key]: value }));
  };

  const handleToggleDay = (dayIndex: number) => {
    setLocalCfg(prev => {
      const exists = prev.days.includes(dayIndex);
      const nextDays = exists
        ? prev.days.filter(d => d !== dayIndex)
        : [...prev.days, dayIndex].sort();
      return { ...prev, days: nextDays };
    });
  };

  const handleSave = () => {
    onSaveConfig(localCfg);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  };

  return (
    <div className="bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-2xl p-6 shadow-xs max-w-4xl mx-auto space-y-6">
      <div className="border-b border-[#d5dfdb] dark:border-[#213e3f] pb-3">
        <h2 className="text-xl font-bold font-reem text-[#0f3d3e] dark:text-[#f2b933]">
          إعدادات وضوابط تحليل الدوام
        </h2>
        <p className="text-xs text-[#435b54] dark:text-[#9bb5b0] mt-1">
          حدد مواعيد وساعات الدوام الرسمي وفترات السماح ونسب الخصم والإنذارات المدرسية
        </p>
      </div>

      {/* Grid of Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Start */}
        <div className="flex flex-col gap-1 text-xs">
          <label className="font-semibold text-[#435b54] dark:text-[#9bb5b0]">بداية الدوام الرسمي</label>
          <input
            type="time"
            value={fm(localCfg.start)}
            onChange={e => handleChange('start', toM(e.target.value))}
            className="p-2 text-xs bg-[#eef2ef] dark:bg-[#091718] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
          />
        </div>

        {/* End */}
        <div className="flex flex-col gap-1 text-xs">
          <label className="font-semibold text-[#435b54] dark:text-[#9bb5b0]">نهاية الدوام الرسمي</label>
          <input
            type="time"
            value={fm(localCfg.end)}
            onChange={e => handleChange('end', toM(e.target.value))}
            className="p-2 text-xs bg-[#eef2ef] dark:bg-[#091718] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
          />
        </div>

        {/* Grace */}
        <div className="flex flex-col gap-1 text-xs">
          <label className="font-semibold text-[#435b54] dark:text-[#9bb5b0]">فترة سماح التأخير (دقائق)</label>
          <input
            type="number"
            value={localCfg.grace}
            onChange={e => handleChange('grace', +e.target.value)}
            className="p-2 text-xs bg-[#eef2ef] dark:bg-[#091718] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
          />
        </div>

        {/* Early Grace */}
        <div className="flex flex-col gap-1 text-xs">
          <label className="font-semibold text-[#435b54] dark:text-[#9bb5b0]">فترة سماح المغادرة (دقائق)</label>
          <input
            type="number"
            value={localCfg.egrace}
            onChange={e => handleChange('egrace', +e.target.value)}
            className="p-2 text-xs bg-[#eef2ef] dark:bg-[#091718] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
          />
        </div>

        {/* Severe */}
        <div className="flex flex-col gap-1 text-xs">
          <label className="font-semibold text-[#435b54] dark:text-[#9bb5b0]">حد التأخير الجسيم (دقائق)</label>
          <input
            type="number"
            value={localCfg.severe}
            onChange={e => handleChange('severe', +e.target.value)}
            className="p-2 text-xs bg-[#eef2ef] dark:bg-[#091718] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
          />
        </div>

        {/* Valid window From */}
        <div className="flex flex-col gap-1 text-xs">
          <label className="font-semibold text-[#435b54] dark:text-[#9bb5b0]">أول وقت مقبول للبصمة</label>
          <input
            type="time"
            value={fm(localCfg.from)}
            onChange={e => handleChange('from', toM(e.target.value))}
            className="p-2 text-xs bg-[#eef2ef] dark:bg-[#091718] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
          />
        </div>

        {/* Valid window To */}
        <div className="flex flex-col gap-1 text-xs">
          <label className="font-semibold text-[#435b54] dark:text-[#9bb5b0]">آخر وقت مقبول للبصمة</label>
          <input
            type="time"
            value={fm(localCfg.to)}
            onChange={e => handleChange('to', toM(e.target.value))}
            className="p-2 text-xs bg-[#eef2ef] dark:bg-[#091718] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
          />
        </div>

        {/* Auto holiday threshold */}
        <div className="flex flex-col gap-1 text-xs">
          <label className="font-semibold text-[#435b54] dark:text-[#9bb5b0]">حد اعتبار اليوم عطلة (% حضور &lt;)</label>
          <input
            type="number"
            value={localCfg.hol}
            onChange={e => handleChange('hol', +e.target.value)}
            className="p-2 text-xs bg-[#eef2ef] dark:bg-[#091718] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
          />
        </div>

        {/* Few data threshold */}
        <div className="flex flex-col gap-1 text-xs">
          <label className="font-semibold text-[#435b54] dark:text-[#9bb5b0]">حد المعلم بيانات ناقصة (% حضور &lt;)</label>
          <input
            type="number"
            value={localCfg.few}
            onChange={e => handleChange('few', +e.target.value)}
            className="p-2 text-xs bg-[#eef2ef] dark:bg-[#091718] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
          />
        </div>

        {/* Single punch threshold */}
        <div className="flex flex-col gap-1 text-xs">
          <label className="font-semibold text-[#435b54] dark:text-[#9bb5b0]">بصمة واحدة قبل هذا الوقت تُحتسب دخول</label>
          <input
            type="time"
            value={fm(localCfg.single)}
            onChange={e => handleChange('single', toM(e.target.value))}
            className="p-2 text-xs bg-[#eef2ef] dark:bg-[#091718] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
          />
        </div>

        {/* Irregular threshold */}
        <div className="flex flex-col gap-1 text-xs">
          <label className="font-semibold text-[#435b54] dark:text-[#9bb5b0]">عدد البصمات الشاذة لتصنيف المعلم غير منتظم</label>
          <input
            type="number"
            value={localCfg.irrN}
            onChange={e => handleChange('irrN', +e.target.value)}
            className="p-2 text-xs bg-[#eef2ef] dark:bg-[#091718] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
          />
        </div>

        {/* Streak warning */}
        <div className="flex flex-col gap-1 text-xs">
          <label className="font-semibold text-[#435b54] dark:text-[#9bb5b0]">إنذار: عدد أيام الغياب المتتالية</label>
          <input
            type="number"
            value={localCfg.aStreak}
            onChange={e => handleChange('aStreak', +e.target.value)}
            className="p-2 text-xs bg-[#eef2ef] dark:bg-[#091718] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
          />
        </div>

        {/* Late minutes warning */}
        <div className="flex flex-col gap-1 text-xs">
          <label className="font-semibold text-[#435b54] dark:text-[#9bb5b0]">إنذار: دقائق التأخير التراكمية</label>
          <input
            type="number"
            value={localCfg.aLate}
            onChange={e => handleChange('aLate', +e.target.value)}
            className="p-2 text-xs bg-[#eef2ef] dark:bg-[#091718] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
          />
        </div>

        {/* Late days warning */}
        <div className="flex flex-col gap-1 text-xs">
          <label className="font-semibold text-[#435b54] dark:text-[#9bb5b0]">إنذار: عدد أيام التأخير المتكررة</label>
          <input
            type="number"
            value={localCfg.aDays}
            onChange={e => handleChange('aDays', +e.target.value)}
            className="p-2 text-xs bg-[#eef2ef] dark:bg-[#091718] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
          />
        </div>

        {/* Absence penalty */}
        <div className="flex flex-col gap-1 text-xs">
          <label className="font-semibold text-[#435b54] dark:text-[#9bb5b0]">خصم كل يوم غياب</label>
          <input
            type="number"
            step="any"
            value={localCfg.pAbs}
            onChange={e => handleChange('pAbs', +e.target.value)}
            className="p-2 text-xs bg-[#eef2ef] dark:bg-[#091718] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
          />
        </div>

        {/* Late count penalty */}
        <div className="flex flex-col gap-1 text-xs">
          <label className="font-semibold text-[#435b54] dark:text-[#9bb5b0]">خصم كل مرة تأخير</label>
          <input
            type="number"
            step="any"
            value={localCfg.pLate}
            onChange={e => handleChange('pLate', +e.target.value)}
            className="p-2 text-xs bg-[#eef2ef] dark:bg-[#091718] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
          />
        </div>

        {/* Late minute penalty */}
        <div className="flex flex-col gap-1 text-xs">
          <label className="font-semibold text-[#435b54] dark:text-[#9bb5b0]">خصم كل دقيقة تأخير</label>
          <input
            type="number"
            step="any"
            value={localCfg.pLateMin}
            onChange={e => handleChange('pLateMin', +e.target.value)}
            className="p-2 text-xs bg-[#eef2ef] dark:bg-[#091718] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
          />
        </div>

        {/* Early count penalty */}
        <div className="flex flex-col gap-1 text-xs">
          <label className="font-semibold text-[#435b54] dark:text-[#9bb5b0]">خصم كل مغادرة مبكرة</label>
          <input
            type="number"
            step="any"
            value={localCfg.pEarly}
            onChange={e => handleChange('pEarly', +e.target.value)}
            className="p-2 text-xs bg-[#eef2ef] dark:bg-[#091718] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
          />
        </div>

        {/* Early minute penalty */}
        <div className="flex flex-col gap-1 text-xs">
          <label className="font-semibold text-[#435b54] dark:text-[#9bb5b0]">خصم كل دقيقة مغادرة</label>
          <input
            type="number"
            step="any"
            value={localCfg.pEarlyMin}
            onChange={e => handleChange('pEarlyMin', +e.target.value)}
            className="p-2 text-xs bg-[#eef2ef] dark:bg-[#091718] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
          />
        </div>

        {/* Incomplete punch penalty */}
        <div className="flex flex-col gap-1 text-xs">
          <label className="font-semibold text-[#435b54] dark:text-[#9bb5b0]">خصم كل بصمة ناقصة</label>
          <input
            type="number"
            step="any"
            value={localCfg.pInc}
            onChange={e => handleChange('pInc', +e.target.value)}
            className="p-2 text-xs bg-[#eef2ef] dark:bg-[#091718] border border-[#9fb3ad] dark:border-[#386062] rounded-lg"
          />
        </div>
      </div>

      {/* Work Days of Week */}
      <div className="p-4 bg-[#eef2ef] dark:bg-[#091718] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl space-y-2">
        <b className="text-xs font-bold block text-[#0f3d3e] dark:text-[#f2b933]">
          أيام الدوام الرسمي الأسبوعية:
        </b>
        <div className="flex flex-wrap gap-4">
          {DAYS.map((name, i) => (
            <label key={i} className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={localCfg.days.includes(i)}
                onChange={() => handleToggleDay(i)}
                className="w-4 h-4 rounded text-[#1f8a6a]"
              />
              <span>{name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Full Calculation Checkbox */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={localCfg.full}
            onChange={e => handleChange('full', e.target.checked)}
            className="w-4 h-4 rounded text-[#1f8a6a]"
          />
          <span>احتساب التأخير من بداية الدوام مباشرة (وليس من نهاية فترة السماح)</span>
        </label>

        {/* Single Punch as Absence Checkbox */}
        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={localCfg.singleAsAbsence ?? true}
            onChange={e => handleChange('singleAsAbsence', e.target.checked)}
            className="w-4 h-4 rounded text-[#1f8a6a]"
          />
          <span className="text-[#0f3d3e] dark:text-[#f2b933] font-bold">
            احتساب البصمة الفردية (دخول بدون خروج، أو خروج بدون دخول) كغياب
          </span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#d5dfdb] dark:border-[#213e3f]">
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-[#0b2b23] rounded-xl bg-[#5fd3a8] hover:bg-emerald-300 shadow-xs transition-all active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>حفظ وتطبيق الإعدادات</span>
        </button>

        <button
          type="button"
          onClick={onResetDefault}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700"
        >
          <RotateCcw className="w-4 h-4" />
          <span>استعادة الإعدادات الافتراضية</span>
        </button>

        {savedMessage && (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
            <Check className="w-4 h-4" />
            تم حفظ وتطبيق الإعدادات بنجاح
          </span>
        )}
      </div>
    </div>
  );
};
