import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import {
  AnalysisResult,
  AppConfig,
  ImportMeta,
} from '../../types';
import {
  fm,
  pc,
  toM,
  esc,
  DAYS,
} from '../../utils/engine';
import {
  Settings,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';

interface DashboardTabProps {
  analysis: AnalysisResult;
  cfg: AppConfig;
  onUpdateCfg: (key: keyof AppConfig, value: unknown) => void;
  importMeta: ImportMeta | null;
  onOpenColumnMapping: () => void;
  schoolName: string;
  dateFrom: string;
  dateTo: string;
  onNavigateToQuality?: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  analysis,
  cfg,
  onUpdateCfg,
  importMeta,
  onOpenColumnMapping,
  schoolName,
  dateFrom,
  dateTo,
  onNavigateToQuality,
}) => {
  const chart1Ref = useRef<HTMLCanvasElement | null>(null);
  const chart2Ref = useRef<HTMLCanvasElement | null>(null);
  const chartInstancesRef = useRef<Chart[]>([]);

  const ok = analysis.ok;
  const sm = (f: (o: typeof ok[0]) => number) => ok.reduce((q, o) => q + f(o), 0);
  const pres = sm(o => o.pres);
  const lateD = sm(o => o.late.length);
  const earlyD = sm(o => o.early.length);
  const chk = ok.filter(o => o.pres + o.abs + o.exc + o.skipN !== analysis.work.length).length;

  // Incomplete / Missing punch records calculations
  const incompleteTeachers = analysis.list.filter(o => (o.inc && o.inc > 0) || (o.noOut && o.noOut > 0));
  const totalIncompleteCount = analysis.list.reduce((sum, o) => sum + (o.inc || 0), 0);

  const ym =
    dateFrom && dateTo
      ? dateFrom.slice(0, 7) === dateTo.slice(0, 7)
        ? `شهر ${+dateFrom.slice(5, 7)}/${dateFrom.slice(0, 4)}`
        : `الفترة من ${dateFrom} إلى ${dateTo}`
      : 'الفترة المحددة';

  // Smart Notes
  const notes: string[] = [];
  const t1 = ok.slice().sort((a, b) => b.lateMin - a.lateMin)[0];
  if (t1 && t1.late.length && t1.lateMin / t1.late.length >= 120) {
    notes.push(
      `تأخير الأستاذ ${t1.name} مرتفع (متوسط ${Math.round(
        t1.lateMin / t1.late.length
      )} دقيقة لليوم) وقد يكون دوامه يبدأ بعد الظهر في عدة أيام؛ راجع السجل اليومي.`
    );
  }

  // Alerts
  const alerts: string[] = [];
  ok.forEach(o => {
    if (o.maxStreak >= cfg.aStreak) {
      alerts.push(`${o.name}: غياب ${o.maxStreak} أيام متتالية دون انقطاع`);
    }
    if (o.lateMin > cfg.aLate) {
      alerts.push(`${o.name}: تأخير تراكمي مرتفع (${o.lateMin} دقيقة)`);
    }
    if (o.late.length >= cfg.aDays) {
      alerts.push(`${o.name}: ${o.late.length} أيام تأخير متكررة`);
    }
  });

  // Chart Rendering
  useEffect(() => {
    chartInstancesRef.current.forEach(c => c.destroy());
    chartInstancesRef.current = [];

    const ds = analysis.work;
    const A: Record<string, number> = {};
    const Lt: Record<string, number> = {};
    const E: Record<string, number> = {};

    ds.forEach(d => {
      A[d] = 0;
      Lt[d] = 0;
      E[d] = 0;
    });

    analysis.ok.forEach(o => {
      ds.forEach(d => {
        if (o.cells[d] === 'غ') A[d]++;
      });
      o.late.forEach(x => {
        if (x.d in Lt) Lt[x.d]++;
      });
      o.early.forEach(x => {
        if (x.d in E) E[x.d]++;
      });
    });

    if (chart1Ref.current) {
      const c1 = new Chart(chart1Ref.current, {
        type: 'bar',
        data: {
          labels: ds.map(d => `${d.slice(8)}/${d.slice(5, 7)}`),
          datasets: [
            { label: 'عدد الغائبين', data: ds.map(d => A[d]), backgroundColor: '#4472c4', borderRadius: 4 },
            { label: 'عدد المتأخرين', data: ds.map(d => Lt[d]), backgroundColor: '#e0584a', borderRadius: 4 },
            { label: 'عدد المغادرين مبكراً', data: ds.map(d => E[d]), backgroundColor: '#1fa67a', borderRadius: 4 },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'توزيع المتأخرين والغائبين والمغادرين يومياً على مدار الشهر',
              font: { size: 14, family: 'Tajawal, sans-serif' },
            },
            legend: { position: 'bottom', labels: { font: { family: 'Tajawal, sans-serif' } } },
          },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'عدد المعلمين' } },
          },
        },
      });
      chartInstancesRef.current.push(c1);
    }

    if (chart2Ref.current) {
      const gs = ['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'ضعيف'];
      const c2 = new Chart(chart2Ref.current, {
        type: 'doughnut',
        data: {
          labels: gs,
          datasets: [
            {
              data: gs.map(g => analysis.ok.filter(o => o.grade[0] === g).length),
              backgroundColor: ['#5fd3a0', '#7cc4ee', '#c8dc5a', '#f5b955', '#f08a80'],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'توزيع تقديرات كادر المدرسة',
              font: { size: 14, family: 'Tajawal, sans-serif' },
            },
            legend: { position: 'bottom', labels: { font: { family: 'Tajawal, sans-serif' } } },
          },
        },
      });
      chartInstancesRef.current.push(c2);
    }

    return () => {
      chartInstancesRef.current.forEach(c => c.destroy());
      chartInstancesRef.current = [];
    };
  }, [analysis]);

  return (
    <div className="space-y-4">
      {/* Smart Import Info Bar */}
      {importMeta && (
        <div className="noprint flex flex-wrap items-center justify-between gap-3 p-3 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 rounded-xl">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0f3d3e] text-white font-bold text-[11px]">
              <Sparkles className="w-3 h-3 text-[#e9a914]" />
              استيراد ذكي ناجح
            </span>
            <span className="font-bold text-[#141c19] dark:text-[#e6f1ee]">📁 {importMeta.fileName}</span>
            <span className="text-[#435b54] dark:text-[#9bb5b0]">| النمط: <b className="text-[#141c19] dark:text-[#e6f1ee]">{importMeta.pattern}</b></span>
            <span className="text-[#435b54] dark:text-[#9bb5b0]">| المقروء: <b className="text-[#141c19] dark:text-[#e6f1ee]">{importMeta.totalPunches.toLocaleString('ar-EG')} حركة</b></span>
            <span className="text-[#435b54] dark:text-[#9bb5b0]">| الكادر: <b className="text-[#141c19] dark:text-[#e6f1ee]">{importMeta.uniqueTeachers.toLocaleString('ar-EG')} معلم</b></span>
            <span className="text-[#435b54] dark:text-[#9bb5b0]">| الفترة: <b className="text-[#141c19] dark:text-[#e6f1ee]">{importMeta.dateRange}</b></span>
          </div>
          <button
            type="button"
            onClick={onOpenColumnMapping}
            className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-white rounded-lg bg-[#1f8a6a] hover:bg-[#165354] transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>مساعد مطابقة الأعمدة</span>
          </button>
        </div>
      )}

      {/* Main Banner */}
      <div className="bg-[#0f3d3e] dark:bg-[#062021] text-white text-center rounded-xl p-4 border-b-3 border-[#e9a914] shadow-sm">
        <h2 className="text-xl md:text-2xl font-bold font-reem m-0">
          تحليل بصمة دوام معلمي {schoolName || 'المدرسة'} — {ym}
        </h2>
        <div className="text-xs text-[#cfe3de] mt-1">
          الدوام الرسمي من {fm(cfg.start)} إلى {fm(cfg.end)} — أيام الدوام: {cfg.days.map(i => DAYS[i]).join('، ')} — الخلايا الصفراء قابلة للتعديل وتتحدّث النتائج فوراً
        </div>
      </div>

      {/* Incomplete / Missing Punch Records Summary Card */}
      <div className="noprint p-4 rounded-xl border transition-all bg-white dark:bg-[#102627] border-[#d5dfdb] dark:border-[#213e3f] shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 ${
                incompleteTeachers.length > 0
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {incompleteTeachers.length > 0 ? (
                <AlertCircle className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-sm md:text-base font-reem text-[#0f3d3e] dark:text-[#f2b933]">
                  سجلات البصمة الناقصة وغير المكتملة
                </h3>
                {incompleteTeachers.length > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200">
                    {incompleteTeachers.length} معلماً بحاجة لمراجعة البصمة
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200">
                    جميع بصمات الكادر مكتملة ✓
                  </span>
                )}
              </div>

              <p className="text-xs text-[#435b54] dark:text-[#9bb5b0] leading-relaxed">
                {incompleteTeachers.length > 0 ? (
                  <>
                    يوجد{' '}
                    <b className="font-mono text-sm md:text-base font-bold text-amber-700 dark:text-amber-300">
                      {incompleteTeachers.length}
                    </b>{' '}
                    معلم لديهم حركات بصمة ناقصة أو غير مكتملة (بإجمالي{' '}
                    <b className="font-mono text-sm md:text-base font-bold text-[#141c19] dark:text-[#e6f1ee]">
                      {totalIncompleteCount}
                    </b>{' '}
                    حركة دخول دون تسجيل خروج أو خروج دون تسجيل دخول).
                  </>
                ) : (
                  'سجلات حضور وانصراف المعلمين مكتملة بالكامل بدون أي بصمات فردية مفقودة.'
                )}
              </p>

              {incompleteTeachers.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-[#435b54] dark:text-[#9bb5b0]">أبرز المعلمين:</span>
                  {incompleteTeachers.slice(0, 6).map(t => (
                    <span
                      key={t.id}
                      className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#eef2ef] dark:bg-[#091718] border border-[#d5dfdb] dark:border-[#213e3f] text-[#141c19] dark:text-[#e6f1ee]"
                    >
                      {t.name} (<b>{t.inc}</b> بصمة)
                    </span>
                  ))}
                  {incompleteTeachers.length > 6 && (
                    <span className="text-[11px] font-bold text-[#1f8a6a]">
                      +{incompleteTeachers.length - 6} آخرين
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Direct Link to Quality Report */}
          {onNavigateToQuality && (
            <button
              type="button"
              onClick={onNavigateToQuality}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white rounded-xl bg-[#0f3d3e] dark:bg-[#165354] hover:bg-[#1f8a6a] transition-all shadow-xs shrink-0 active:scale-95"
              title="الانتقال المباشر لتقرير جودة البيانات وفحص الحركات"
            >
              <ShieldAlert className="w-4 h-4 text-[#e9a914]" />
              <span>الانتقال إلى تقرير الجودة</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Configuration & Main Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {/* Table 1: Editable Parameters */}
        <div className="bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="bg-[#d3e7e0] dark:bg-[#082829] text-[#0e3334] dark:text-[#eaf3f0] font-bold text-center py-2 text-xs">
            إعدادات الدوام والحساب (تعديل سريع)
          </div>
          <table className="w-full text-xs text-right border-collapse">
            <tbody className="divide-y divide-[#d5dfdb] dark:divide-[#213e3f]">
              <tr>
                <td className="p-2 font-semibold">بداية الدوام</td>
                <td className="p-2 text-center w-28">
                  <input
                    type="time"
                    value={fm(cfg.start)}
                    onChange={e => onUpdateCfg('start', toM(e.target.value))}
                    className="w-full text-center bg-[#fff200] dark:bg-[#f0c326] text-black font-bold py-0.5 px-1 rounded border border-[#bba800] text-xs"
                  />
                </td>
              </tr>
              <tr>
                <td className="p-2 font-semibold">نهاية الدوام</td>
                <td className="p-2 text-center w-28">
                  <input
                    type="time"
                    value={fm(cfg.end)}
                    onChange={e => onUpdateCfg('end', toM(e.target.value))}
                    className="w-full text-center bg-[#fff200] dark:bg-[#f0c326] text-black font-bold py-0.5 px-1 rounded border border-[#bba800] text-xs"
                  />
                </td>
              </tr>
              <tr>
                <td className="p-2 font-semibold">عدد أيام الدوام الفعلي</td>
                <td className="p-2 text-center font-bold">{analysis.work.length}</td>
              </tr>
              <tr>
                <td className="p-2 font-semibold">يوم تعطل الخروج (عام)</td>
                <td className="p-2 text-center w-28">
                  <input
                    type="date"
                    value={cfg.noExit || ''}
                    onChange={e => onUpdateCfg('noExit', e.target.value)}
                    className="w-full text-center bg-[#fff200] dark:bg-[#f0c326] text-black font-bold py-0.5 px-1 rounded border border-[#bba800] text-xs"
                  />
                </td>
              </tr>
              <tr>
                <td className="p-2 font-semibold">خصم كل يوم غياب</td>
                <td className="p-2 text-center w-28">
                  <input
                    type="number"
                    step="any"
                    value={cfg.pAbs}
                    onChange={e => onUpdateCfg('pAbs', +e.target.value)}
                    className="w-full text-center bg-[#fff200] dark:bg-[#f0c326] text-black font-bold py-0.5 px-1 rounded border border-[#bba800] text-xs"
                  />
                </td>
              </tr>
              <tr>
                <td className="p-2 font-semibold">خصم كل مرة تأخير</td>
                <td className="p-2 text-center w-28">
                  <input
                    type="number"
                    step="any"
                    value={cfg.pLate}
                    onChange={e => onUpdateCfg('pLate', +e.target.value)}
                    className="w-full text-center bg-[#fff200] dark:bg-[#f0c326] text-black font-bold py-0.5 px-1 rounded border border-[#bba800] text-xs"
                  />
                </td>
              </tr>
              <tr>
                <td className="p-2 font-semibold">خصم كل مغادرة مبكرة</td>
                <td className="p-2 text-center w-28">
                  <input
                    type="number"
                    step="any"
                    value={cfg.pEarly}
                    onChange={e => onUpdateCfg('pEarly', +e.target.value)}
                    className="w-full text-center bg-[#fff200] dark:bg-[#f0c326] text-black font-bold py-0.5 px-1 rounded border border-[#bba800] text-xs"
                  />
                </td>
              </tr>
              <tr>
                <td className="p-2 font-semibold">خصم كل بصمة ناقصة</td>
                <td className="p-2 text-center w-28">
                  <input
                    type="number"
                    step="any"
                    value={cfg.pInc}
                    onChange={e => onUpdateCfg('pInc', +e.target.value)}
                    className="w-full text-center bg-[#fff200] dark:bg-[#f0c326] text-black font-bold py-0.5 px-1 rounded border border-[#bba800] text-xs"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Table 2: General Attendance Indicators */}
        <div className="bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="bg-[#d3e7e0] dark:bg-[#082829] text-[#0e3334] dark:text-[#eaf3f0] font-bold text-center py-2 text-xs">
            المؤشرات العامة للدوام
          </div>
          <table className="w-full text-xs text-right border-collapse">
            <tbody className="divide-y divide-[#d5dfdb] dark:divide-[#213e3f]">
              <tr>
                <td className="p-2 font-semibold">عدد المعلمين النشطين</td>
                <td className="p-2 text-center font-mono font-bold text-sm md:text-base">{analysis.list.length}</td>
              </tr>
              <tr>
                <td className="p-2 font-semibold">إجمالي سجلات الحضور (يوم/معلم)</td>
                <td className="p-2 text-center font-mono font-bold text-sm md:text-base">{pres.toLocaleString('ar-EG')}</td>
              </tr>
              <tr>
                <td className="p-2 font-semibold">نسبة الحضور الإجمالية</td>
                <td className="p-2 text-center font-mono font-bold text-base md:text-lg text-emerald-600">{pc(analysis.att)}</td>
              </tr>
              <tr>
                <td className="p-2 font-semibold">إجمالي أيام الغياب</td>
                <td className="p-2 text-center font-mono font-bold text-base md:text-lg text-rose-600">{analysis.abs.toLocaleString('ar-EG')}</td>
              </tr>
              <tr>
                <td className="p-2 font-semibold">أيام التأخير (بعد {fm(cfg.start)})</td>
                <td className="p-2 text-center font-mono font-bold text-base md:text-lg text-amber-600">{lateD.toLocaleString('ar-EG')}</td>
              </tr>
              <tr>
                <td className="p-2 font-semibold">نسبة أيام التأخير من الحضور</td>
                <td className="p-2 text-center font-mono font-bold text-sm md:text-base">{pres ? pc(lateD / pres) : '0%'}</td>
              </tr>
              <tr>
                <td className="p-2 font-semibold">إجمالي دقائق التأخير</td>
                <td className="p-2 text-center font-mono font-bold text-base md:text-lg text-[#0f3d3e] dark:text-emerald-400">{analysis.lateMin.toLocaleString('ar-EG')} د</td>
              </tr>
              <tr>
                <td className="p-2 font-semibold">أيام المغادرة المبكرة (قبل {fm(cfg.end)})</td>
                <td className="p-2 text-center font-mono font-bold text-base md:text-lg text-amber-600">{earlyD.toLocaleString('ar-EG')}</td>
              </tr>
              <tr>
                <td className="p-2 font-semibold">إجمالي دقائق المغادرة</td>
                <td className="p-2 text-center font-mono font-bold text-base md:text-lg text-[#0f3d3e] dark:text-emerald-400">{analysis.earlyMin.toLocaleString('ar-EG')} د</td>
              </tr>
              <tr>
                <td className="p-2 font-semibold">بصمات ناقصة / مشكوكة</td>
                <td className="p-2 text-center font-mono font-bold text-sm md:text-base">{sm(o => o.inc + o.sus).toLocaleString('ar-EG')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Card 3: School Evaluation Scorecard */}
        <div className="bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl shadow-xs overflow-hidden flex flex-col text-center justify-between">
          <div className="bg-[#d3e7e0] dark:bg-[#082829] text-[#0e3334] dark:text-[#eaf3f0] font-bold py-2 text-xs">
            التقييم العام لدوام المدرسة
          </div>
          <div className="p-6">
            <div className="text-5xl font-bold font-reem text-[#141c19] dark:text-[#e6f1ee]">
              {analysis.avg.toFixed(1)}
              <span className="text-xl text-[#435b54] dark:text-[#9bb5b0] mr-1">/ 10</span>
            </div>
            <div
              className="mt-4 mx-6 py-2 px-4 rounded-xl text-base font-bold text-slate-900 shadow-xs"
              style={{ backgroundColor: analysis.g[1] }}
            >
              {analysis.g[0]}
            </div>
          </div>
          <div className="p-4 border-t border-[#d5dfdb] dark:border-[#213e3f] text-xs text-[#435b54] dark:text-[#9bb5b0] italic flex items-center justify-center gap-1.5">
            {chk > 0 ? (
              <span className="text-amber-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                تعارض في {chk} معلم
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                فحص التطابق سليم ودقيق ✓
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Top 5 Lists */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Most Late */}
        <div className="bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl shadow-xs overflow-hidden">
          <div className="bg-[#d3e7e0] dark:bg-[#082829] text-[#0e3334] dark:text-[#eaf3f0] font-bold p-2 text-center text-xs">
            الأكثر تأخّراً (بالدقائق)
          </div>
          <table className="w-full text-xs text-right">
            <tbody>
              {ok
                .slice()
                .sort((a, b) => b.lateMin - a.lateMin)
                .slice(0, 5)
                .map(o => (
                  <tr key={o.id} className="border-b border-[#d5dfdb] dark:border-[#213e3f] last:border-0">
                    <td className="p-2 font-semibold text-xs md:text-sm">{o.name}</td>
                    <td className="p-2 text-center font-mono font-bold text-sm md:text-base text-amber-600 w-24">
                      {o.lateMin.toLocaleString('ar-EG')} د
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Most Early Departure */}
        <div className="bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl shadow-xs overflow-hidden">
          <div className="bg-[#d3e7e0] dark:bg-[#082829] text-[#0e3334] dark:text-[#eaf3f0] font-bold p-2 text-center text-xs">
            الأكثر مغادرة مبكرة (بالدقائق)
          </div>
          <table className="w-full text-xs text-right">
            <tbody>
              {ok
                .slice()
                .sort((a, b) => b.earlyMin - a.earlyMin)
                .slice(0, 5)
                .map(o => (
                  <tr key={o.id} className="border-b border-[#d5dfdb] dark:border-[#213e3f] last:border-0">
                    <td className="p-2 font-semibold text-xs md:text-sm">{o.name}</td>
                    <td className="p-2 text-center font-mono font-bold text-sm md:text-base text-[#1f8a6a] w-24">
                      {o.earlyMin.toLocaleString('ar-EG')} د
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Most Absent */}
        <div className="bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl shadow-xs overflow-hidden">
          <div className="bg-[#d3e7e0] dark:bg-[#082829] text-[#0e3334] dark:text-[#eaf3f0] font-bold p-2 text-center text-xs">
            الأكثر غياباً (بالأيام)
          </div>
          <table className="w-full text-xs text-right">
            <tbody>
              {ok
                .slice()
                .sort((a, b) => b.abs - a.abs)
                .slice(0, 5)
                .map(o => (
                  <tr key={o.id} className="border-b border-[#d5dfdb] dark:border-[#213e3f] last:border-0">
                    <td className="p-2 font-semibold text-xs md:text-sm">{o.name}</td>
                    <td className="p-2 text-center font-mono font-bold text-sm md:text-base text-rose-600 w-24">
                      {o.abs.toLocaleString('ar-EG')} يوم
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Smart Notes */}
      {notes.length > 0 && (
        <div className="p-3 bg-white dark:bg-[#102627] border-r-4 border-[#1f8a6a] rounded-xl text-xs text-[#141c19] dark:text-[#e6f1ee] shadow-xs">
          <b>💡 ملاحظة ذكية:</b> {notes.join(' ')}
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-4 bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl shadow-xs min-h-[280px]">
          <canvas ref={chart1Ref} />
        </div>
        <div className="p-4 bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl shadow-xs min-h-[280px]">
          <canvas ref={chart2Ref} />
        </div>
      </div>

      {/* Alerts and Warnings */}
      <div className="bg-white dark:bg-[#102627] border border-[#d5dfdb] dark:border-[#213e3f] rounded-xl p-4 shadow-xs">
        <h3 className="flex items-center gap-2 text-base font-bold font-reem text-[#0f3d3e] dark:text-[#f2b933] mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          إنذارات وتنبيهات هامة ({alerts.length})
        </h3>
        {alerts.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {alerts.slice(0, 30).map((a, i) => (
              <div
                key={i}
                className="p-2.5 text-xs rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-r-4 border-[#e9a914]"
              >
                ⚠️ {a}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 text-xs rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border-r-4 border-emerald-500">
            ✓ لا توجد إنذارات حرجة؛ الالتزام بالدوام ممتاز!
          </div>
        )}
      </div>
    </div>
  );
};
