import React, { useState, useEffect, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  AppConfig,
  DataQuality,
  ImportMeta,
  PunchRecord,
  TabKey,
  ColumnIndexMap,
} from './types';
import {
  DEFAULT_CONFIG,
  ingestFileRows,
  analyzeRecords,
  generateSampleData,
  exportToExcel,
  exportToPdf,
  findHeaderRow,
  guessColumnsFromData,
} from './utils/engine';
import { Header } from './components/Header';
import { NavTabs, TABS_CONFIG } from './components/NavTabs';
import { EmptyState } from './components/EmptyState';
import { ColumnMappingModal } from './components/ColumnMappingModal';
import { PasteModal } from './components/PasteModal';
import { HelpModal } from './components/HelpModal';
import { ConfirmModal } from './components/ConfirmModal';
import { PrintHeader, PrintFooter } from './components/PrintHeaderFooter';
import { PrintModal } from './components/PrintModal';

import { DashboardTab } from './components/tabs/DashboardTab';
import { SummaryTab } from './components/tabs/SummaryTab';
import { DailyTab } from './components/tabs/DailyTab';
import { LateTab } from './components/tabs/LateTab';
import { EarlyTab } from './components/tabs/EarlyTab';
import { AbsenceTab } from './components/tabs/AbsenceTab';
import { MatrixTab } from './components/tabs/MatrixTab';
import { EvaluationTab } from './components/tabs/EvaluationTab';
import { QualityTab } from './components/tabs/QualityTab';
import { SettingsTab } from './components/tabs/SettingsTab';

export default function App() {
  // Config
  const [cfg, setCfg] = useState<AppConfig>(() => {
    try {
      const saved = localStorage.getItem('cfg_school_attendance');
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch {}
    return { ...DEFAULT_CONFIG };
  });

  // State
  const [tab, setTab] = useState<TabKey>('dash');
  const [records, setRecords] = useState<PunchRecord[]>([]);
  const [quality, setQuality] = useState<DataQuality>({
    read: 0,
    skip: 0,
    dup: 0,
    wkend: 0,
    single: 0,
    outr: 0,
    short: 0,
    long: 0,
    names: [],
    ids: [],
  });
  const [importMeta, setImportMeta] = useState<ImportMeta | null>(null);
  const [schools, setSchools] = useState<string[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [minDate, setMinDate] = useState<string>('');
  const [maxDate, setMaxDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Overrides & exclusions
  const [deletedTeachers, setDeletedTeachers] = useState<Record<string, boolean>>({});
  const [skippedDays, setSkippedDays] = useState<Record<string, boolean>>({});
  const [noExitOverrides, setNoExitOverrides] = useState<Record<string, boolean>>({});
  const [excusedAbsences, setExcusedAbsences] = useState<Record<string, boolean>>({});
  const [dayOverrides, setDayOverrides] = useState<Record<string, string>>({});

  // Theme
  const [isDark, setIsDark] = useState<boolean>(false);

  // Print settings
  const [printOrientation, setPrintOrientation] = useState<'auto' | 'landscape' | 'portrait'>('landscape');
  const [printFontSize, setPrintFontSize] = useState<string>('10px');
  const [isPrintBw, setIsPrintBw] = useState<boolean>(false);

  // Modals state
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isColumnMappingOpen, setIsColumnMappingOpen] = useState(false);
  const [mappingRawRows, setMappingRawRows] = useState<any[][]>([]);
  const [mappingHeaderRow, setMappingHeaderRow] = useState<number>(0);
  const [mappingIx, setMappingIx] = useState<ColumnIndexMap>({
    id: -1,
    name: -1,
    date: -1,
    in: -1,
    out: -1,
    school: -1,
  });
  const [mappingCustomMsg, setMappingCustomMsg] = useState<string>('');
  const [rawSheets, setRawSheets] = useState<Record<string, any[][]>>({});
  const [activeSheetName, setActiveSheetName] = useState<string>('');
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Confirm Modal state
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    icon?: 'trash' | 'warn' | 'help';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Theme sync
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.dataset.theme = 'dark';
    } else {
      root.classList.remove('dark');
      root.dataset.theme = '';
    }
  }, [isDark]);

  // Save config changes to localStorage
  const handleSaveConfig = useCallback((newCfg: AppConfig) => {
    setCfg(newCfg);
    try {
      localStorage.setItem('cfg_school_attendance', JSON.stringify(newCfg));
    } catch {}
  }, []);

  const handleUpdateConfigParam = useCallback((key: keyof AppConfig, value: unknown) => {
    setCfg(prev => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem('cfg_school_attendance', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Process rows with engine
  const processRows = useCallback(
    (
      rows: unknown[][],
      manualMap: { headerRow: number; ix: ColumnIndexMap } | null,
      name: string
    ) => {
      try {
        const res = ingestFileRows(rows, manualMap, name, cfg);
        setRecords(res.recs);
        setQuality(res.Q);
        setMinDate(res.min);
        setMaxDate(res.max);
        setDateFrom(res.min);
        setDateTo(res.max);
        setSchools(res.schools);
        setSelectedSchool(res.schools[0] || '');
        setImportMeta(res.importMeta);
        setCurrentFileName(name);

        // Reset manual filters
        setDeletedTeachers({});
        setSkippedDays({});
        setNoExitOverrides({});
        setExcusedAbsences({});
        setDayOverrides({});

        setTab('dash');
      } catch (err: any) {
        if (err.message === 'COLUMN_MAPPING_REQUIRED') {
          setMappingRawRows(err.rawRows);
          setMappingHeaderRow(err.headerRow);
          setMappingIx(err.ix);
          setMappingCustomMsg(
            'لم يتم التعرف على بعض الأعمدة الأساسية تلقائياً. يرجى مراجعة وتحديد الأعمدة أدناه:'
          );
          setIsColumnMappingOpen(true);
        } else {
          alert('تعذّر استيراد الملف: ' + (err.message || err));
        }
      }
    },
    [cfg]
  );

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array', cellDates: true, raw: true });
      if (!wb.SheetNames || !wb.SheetNames.length) {
        alert('الملف لا يحتوي على أي صفحات أو جداول صالحة.');
        return;
      }

      const sheetsMap: Record<string, any[][]> = {};
      let bestScore = -1;
      let bestSheet = wb.SheetNames[0];

      for (const sName of wb.SheetNames) {
        const ws = wb.Sheets[sName];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' }) as any[][];
        if (!data || !data.length) continue;
        sheetsMap[sName] = data;

        const { score } = findHeaderRow(data);
        let weight = score * 100 + Math.min(data.length, 50);
        if (/حركات|بصم|دوام|حضور|log|attend|punch|trans/i.test(sName)) {
          weight += 200;
        }

        if (weight > bestScore) {
          bestScore = weight;
          bestSheet = sName;
        }
      }

      setRawSheets(sheetsMap);
      setActiveSheetName(bestSheet);
      processRows(sheetsMap[bestSheet], null, file.name);
    } catch (err: any) {
      alert('خطأ أثناء قراءة الملف: ' + (err.message || err));
    }
  };

  // Load sample data
  const handleLoadDemo = () => {
    const demoData = generateSampleData();
    processRows(demoData, null, 'نموذج_مدرسة_الأمل_التجريبي.xlsx');
  };

  // Run analysis calculation
  const analysis = useMemo(() => {
    if (!records.length) return null;

    return analyzeRecords(records, cfg, {
      school: selectedSchool,
      from: dateFrom,
      to: dateTo,
      delE: deletedTeachers,
      skip: skippedDays,
      exc: excusedAbsences,
      noE: noExitOverrides,
      ov: dayOverrides,
    });
  }, [
    records,
    cfg,
    selectedSchool,
    dateFrom,
    dateTo,
    deletedTeachers,
    skippedDays,
    excusedAbsences,
    noExitOverrides,
    dayOverrides,
  ]);

  // Filtered teachers list by search query
  const displayTeachers = useMemo(() => {
    if (!analysis) return [];
    if (!searchQuery.trim()) return analysis.list;

    const q = searchQuery.toLowerCase().trim();
    return analysis.list.filter(o => o.name.toLowerCase().includes(q) || o.id.includes(q));
  }, [analysis, searchQuery]);

  // Actions
  const handleToggleExcuse = (key: string) => {
    setExcusedAbsences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleDeleteTeacher = (id: string) => {
    const teacher = analysis?.list.find(t => t.id === id);
    const teacherName = teacher?.name || id;

    setConfirmModalConfig({
      isOpen: true,
      title: 'استبعاد المعلم من التقارير',
      message: `هل أنت متأكد من استبعاد المعلم «${teacherName}» من جميع التقارير والإحصائيات؟`,
      details: (
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400">
          💡 يمكنك التراجع عن الحذف في أي وقت بالضغط على زر «استعادة المحذوفات» في الشريط العلوي.
        </div>
      ),
      confirmText: 'نعم، استبعاد المعلم',
      cancelText: 'إلغاء وتراجع',
      isDanger: true,
      icon: 'trash',
      onConfirm: () => {
        setDeletedTeachers(prev => ({ ...prev, [id]: true }));
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleSkipRecord = (key: string) => {
    setSkippedDays(prev => ({ ...prev, [key]: true }));
  };

  const handleDeleteEarlyRecord = (key: string) => {
    setNoExitOverrides(prev => ({ ...prev, [key]: true }));
  };

  const handleUpdateDayOverride = (date: string, type: string) => {
    setDayOverrides(prev => {
      const next = { ...prev };
      if (type) next[date] = type;
      else delete next[date];
      return next;
    });
  };

  const handleRestoreDeleted = () => {
    setDeletedTeachers({});
    setSkippedDays({});
    setNoExitOverrides({});
  };

  const handleClearData = () => {
    const teacherCount = analysis?.list.length || 0;
    const punchCount = records.length;

    setConfirmModalConfig({
      isOpen: true,
      title: 'تأكيد مسح جميع بيانات البصمة',
      message: 'أنت على وشك تفريغ ومسح جميع سجلات الحضور والانصراف والبيانات المحملة حالياً من ذاكرة المتصفح.',
      details: (
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
          <div>• عدد المعلمين في الكادر: <b>{teacherCount.toLocaleString('ar-EG')} معلم</b></div>
          <div>• إجمالي السجلات والحركات: <b>{punchCount.toLocaleString('ar-EG')} حركة</b></div>
          <div className="text-rose-600 font-bold pt-1">
            ⚠️ سيتم تفريغ كافة الجداول والتقارير والعودة لشاشة رفع الملفات الرئيسية.
          </div>
        </div>
      ),
      confirmText: 'نعم، مسح جميع البيانات',
      cancelText: 'إلغاء والاحتفاظ بالبيانات',
      isDanger: true,
      icon: 'trash',
      onConfirm: () => {
        setRecords([]);
        setQuality({
          read: 0,
          skip: 0,
          dup: 0,
          wkend: 0,
          single: 0,
          outr: 0,
          short: 0,
          long: 0,
          names: [],
          ids: [],
        });
        setImportMeta(null);
        setDeletedTeachers({});
        setSkippedDays({});
        setNoExitOverrides({});
        setExcusedAbsences({});
        setDayOverrides({});
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleResetDefaultSettings = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'استعادة الإعدادات الافتراضية',
      message: 'هل تريد إعادة ضبط جميع مواعيد الدوام وفترات السماح ونسب الخصم إلى قيمها الأصلية؟',
      details: (
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-400">
          ستتم استعادة مواعيد الدوام الرسمي من 07:45 إلى 12:20 وأيام العمل من الأحد إلى الخميس.
        </div>
      ),
      confirmText: 'نعم، استعادة الافتراضي',
      cancelText: 'إلغاء',
      isDanger: false,
      icon: 'warn',
      onConfirm: () => {
        setCfg({ ...DEFAULT_CONFIG });
        try {
          localStorage.removeItem('cfg_school_attendance');
        } catch {}
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Print handler - opens A4 print setup modal with auto-scaling to paper size
  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  const handlePrintNow = (orient: 'landscape' | 'portrait', zoom: number, fontSize: string) => {
    let styleEl = document.getElementById('print-page-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'print-page-style';
      document.head.append(styleEl);
    }

    styleEl.textContent = `
      @page { size: A4 ${orient}; margin: 6mm 6mm 8mm 6mm; }
      @media print {
        #printable-content-root {
          zoom: ${zoom} !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        table, table.min-w-max, .min-w-max {
          min-width: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
        }
      }
    `;
    document.documentElement.style.setProperty('--print-zoom', String(zoom));
    document.documentElement.style.setProperty('--pfs', fontSize || '9.5px');
    document.body.classList.toggle('bw', !!isPrintBw);

    try {
      window.print();
    } catch (e) {
      console.warn('window.print error:', e);
    }
  };

  // PDF Export with complete fidelity
  const handleExportPdf = async () => {
    if (!analysis || isExportingPdf) return;
    const tabObj = TABS_CONFIG.find(t => t.key === tab);
    const tabTitle = tabObj ? tabObj.label : 'تقرير_الدوام';
    const school = selectedSchool || 'المدرسة';
    const orient =
      printOrientation === 'auto'
        ? ['sum', 'daily', 'matrix', 'dash', 'early'].includes(tab)
          ? 'landscape'
          : 'portrait'
        : printOrientation;

    setIsExportingPdf(true);
    try {
      await exportToPdf('printable-content-root', tabTitle, school, orient);
    } catch (err: any) {
      alert('خطأ أثناء تصدير PDF: ' + (err.message || err));
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Excel Export
  const handleExportExcel = () => {
    if (!analysis) return;
    exportToExcel(analysis, quality, selectedSchool || 'المدرسة');
  };

  const deletedCount =
    Object.keys(deletedTeachers).length +
    Object.keys(skippedDays).length +
    Object.keys(noExitOverrides).length;

  const currentTabObj = TABS_CONFIG.find(t => t.key === tab);
  const activeTabTitle = currentTabObj ? currentTabObj.label : 'الرئيسية';

  return (
    <div className="min-h-screen flex flex-col bg-[#eef2ef] dark:bg-[#091718] text-[#141c19] dark:text-[#e6f1ee] selection:bg-[#e9a914]/30 selection:text-black">
      {/* Top Header */}
      <Header
        onFileUpload={handleFileUpload}
        onLoadDemo={handleLoadDemo}
        onOpenPasteModal={() => setIsPasteModalOpen(true)}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
        schools={schools}
        selectedSchool={selectedSchool}
        onSelectSchool={setSelectedSchool}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        hasData={records.length > 0}
      />

      {/* Tabs Navigation */}
      <NavTabs
        activeTab={tab}
        onSelectTab={setTab}
        printOrientation={printOrientation}
        onChangeOrientation={setPrintOrientation}
        printFontSize={printFontSize}
        onChangeFontSize={setPrintFontSize}
        isPrintBw={isPrintBw}
        onTogglePrintBw={setIsPrintBw}
        onExportPdf={handleExportPdf}
        isExportingPdf={isExportingPdf}
        onPrint={handlePrint}
        onExportExcel={handleExportExcel}
        deletedCount={deletedCount}
        onRestoreDeleted={handleRestoreDeleted}
        onClearData={handleClearData}
        hasData={records.length > 0}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 p-3 md:p-6 max-w-[1540px] w-full mx-auto" id="printable-content-root">
        {/* Printable Official Header */}
        {records.length > 0 && (
          <PrintHeader
            tabTitle={activeTabTitle}
            schoolName={selectedSchool || 'المدرسة'}
            dateFrom={dateFrom}
            dateTo={dateTo}
            cfg={cfg}
            totalTeachers={analysis?.list.length || 0}
          />
        )}

        {/* Tab content rendering */}
        {tab === 'set' ? (
          <SettingsTab
            cfg={cfg}
            onSaveConfig={handleSaveConfig}
            onResetDefault={handleResetDefaultSettings}
          />
        ) : !records.length ? (
          <EmptyState
            onFileUpload={handleFileUpload}
            onDropFiles={files => {
              if (files[0]) {
                const fakeEvent = {
                  target: { files },
                } as unknown as React.ChangeEvent<HTMLInputElement>;
                handleFileUpload(fakeEvent);
              }
            }}
            onLoadDemo={handleLoadDemo}
            onOpenPasteModal={() => setIsPasteModalOpen(true)}
            onOpenHelpModal={() => setIsHelpModalOpen(true)}
          />
        ) : !analysis ? null : (
          <>
            {tab === 'dash' && (
              <DashboardTab
                analysis={analysis}
                cfg={cfg}
                onUpdateCfg={handleUpdateConfigParam}
                importMeta={importMeta}
                onOpenColumnMapping={() => {
                  if (importMeta?.rawRows) {
                    setMappingRawRows(importMeta.rawRows);
                    setMappingHeaderRow(importMeta.headerRow);
                    setMappingIx(importMeta.ix);
                    setIsColumnMappingOpen(true);
                  }
                }}
                schoolName={selectedSchool}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onNavigateToQuality={() => setTab('quality')}
              />
            )}

            {tab === 'sum' && (
              <SummaryTab
                teachers={displayTeachers}
                onDeleteTeacher={handleDeleteTeacher}
                onExportPdf={handleExportPdf}
                isExportingPdf={isExportingPdf}
                onPrint={handlePrint}
              />
            )}

            {tab === 'daily' && (
              <DailyTab
                analysis={analysis}
                cfg={cfg}
                noExitOverrides={noExitOverrides}
                onSkipRecord={handleSkipRecord}
              />
            )}

            {tab === 'late' && (
              <LateTab
                teachers={displayTeachers}
                onDeleteTeacher={handleDeleteTeacher}
              />
            )}

            {tab === 'early' && (
              <EarlyTab
                teachers={displayTeachers}
                cfg={cfg}
                onDeleteEarlyRecord={handleDeleteEarlyRecord}
              />
            )}

            {tab === 'abs' && (
              <AbsenceTab
                analysis={analysis}
                cfg={cfg}
                onUpdateCfg={handleUpdateConfigParam}
                excusedMap={excusedAbsences}
                onToggleExcuse={handleToggleExcuse}
                onSkipRecord={handleSkipRecord}
              />
            )}

            {tab === 'matrix' && (
              <MatrixTab
                analysis={analysis}
                onToggleExcuse={handleToggleExcuse}
                onDeleteTeacher={handleDeleteTeacher}
              />
            )}

            {tab === 'eval' && (
              <EvaluationTab
                teachers={displayTeachers}
                onDeleteTeacher={handleDeleteTeacher}
              />
            )}

            {tab === 'quality' && (
              <QualityTab
                quality={quality}
                importMeta={importMeta}
                totalTeachers={analysis.emps.size}
                fewCount={analysis.list.filter(o => o.few).length}
                onOpenColumnMapping={() => {
                  if (importMeta?.rawRows) {
                    setMappingRawRows(importMeta.rawRows);
                    setMappingHeaderRow(importMeta.headerRow);
                    setMappingIx(importMeta.ix);
                    setIsColumnMappingOpen(true);
                  }
                }}
              />
            )}
          </>
        )}

        {/* Printable Official Footer */}
        {records.length > 0 && <PrintFooter />}
      </main>

      {/* Column Mapping Modal */}
      <ColumnMappingModal
        isOpen={isColumnMappingOpen}
        rows={mappingRawRows}
        headerRow={mappingHeaderRow}
        initialIx={mappingIx}
        sheetNames={Object.keys(rawSheets)}
        activeSheetName={activeSheetName}
        onSelectSheet={sName => {
          if (rawSheets[sName]) {
            setActiveSheetName(sName);
            setMappingRawRows(rawSheets[sName]);
            const found = findHeaderRow(rawSheets[sName]);
            const guessed = guessColumnsFromData(
              rawSheets[sName].slice(found.headerRow + 1),
              rawSheets[sName][found.headerRow],
              found.ix
            );
            setMappingHeaderRow(found.headerRow);
            setMappingIx(guessed);
          }
        }}
        onApply={({ headerRow, ix }) => {
          setIsColumnMappingOpen(false);
          processRows(mappingRawRows, { headerRow, ix }, currentFileName);
        }}
        onClose={() => setIsColumnMappingOpen(false)}
        customMessage={mappingCustomMsg}
      />

      {/* Paste Modal */}
      <PasteModal
        isOpen={isPasteModalOpen}
        onImportRows={(rows, sName) => {
          processRows(rows, null, sName);
        }}
        onClose={() => setIsPasteModalOpen(false)}
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        details={confirmModalConfig.details}
        confirmText={confirmModalConfig.confirmText}
        cancelText={confirmModalConfig.cancelText}
        isDanger={confirmModalConfig.isDanger}
        icon={confirmModalConfig.icon}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
      />

      {/* A4 Print Setup & Preview Modal */}
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onPrintNow={handlePrintNow}
        onExportPdf={handleExportPdf}
        tabTitle={activeTabTitle}
        schoolName={selectedSchool || 'المدرسة'}
        dateFrom={dateFrom}
        dateTo={dateTo}
        cfg={cfg}
        totalTeachers={analysis?.list.length || 0}
        printOrientation={printOrientation}
        onChangeOrientation={setPrintOrientation}
        printFontSize={printFontSize}
        onChangeFontSize={setPrintFontSize}
        isPrintBw={isPrintBw}
        onTogglePrintBw={setIsPrintBw}
        isExportingPdf={isExportingPdf}
      />

      {/* High-Fidelity PDF Exporting Toast */}
      {isExportingPdf && (
        <div className="fixed bottom-6 left-6 z-50 p-4 bg-[#0f3d3e] text-white rounded-2xl shadow-2xl border-2 border-[#e9a914] flex items-center gap-3 animate-pulse">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
          <div className="text-xs">
            <b className="block text-sm font-bold text-[#e9a914]">جاري تصدير ملف PDF الرسمي</b>
            <span>يتم الآن توليد التقرير بكامل ألوان وتنسيقات الجدول ودون أي اقتطاع للأعمدة...</span>
          </div>
        </div>
      )}
    </div>
  );
}
