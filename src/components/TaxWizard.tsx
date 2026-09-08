import React, { useState } from 'react';
import { 
  User, 
  Briefcase, 
  Users, 
  GraduationCap, 
  MapPin, 
  TrendingUp, 
  HeartHandshake, 
  Check, 
  ArrowLeft, 
  ArrowRight,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Building2,
  ChevronDown,
  ChevronUp,
  Sliders,
  Scale
} from 'lucide-react';
import { TaxInputData, TaxYear, Employer106Record, Child } from '../types/tax';
import { GuideTooltip } from './GuideTooltip';
import { Form106Scanner } from './Form106Scanner';
import { ELIGIBLE_SETTLEMENTS } from '../data/taxRates';

interface TaxWizardProps {
  input: TaxInputData;
  onChange: (updated: Partial<TaxInputData>) => void;
  currentStep: number;
  onStepChange: (step: number) => void;
  onCalculate: () => void;
  activeSpouseTab?: 'primary' | 'spouse';
  onSpouseTabChange?: (tab: 'primary' | 'spouse') => void;
}

const STEPS = [
  { id: 1, title: 'שנת מס ופרטים', icon: User },
  { id: 2, title: 'מעסיקים וטפסי 106', icon: Briefcase },
  { id: 3, title: 'תשלומי ביטוח לאומי', icon: Calendar },
  { id: 4, title: 'ילדים ומשפחה', icon: Users },
  { id: 5, title: 'תואר, צבא ועולים', icon: GraduationCap },
  { id: 6, title: 'יישוב מזכה', icon: MapPin },
  { id: 7, title: 'שוק ההון (867)', icon: TrendingUp },
  { id: 8, title: 'תרומות, ביטוח והוצאות', icon: HeartHandshake },
];

export const TaxWizard: React.FC<TaxWizardProps> = ({
  input,
  onChange,
  currentStep,
  onStepChange,
  onCalculate,
  activeSpouseTab = 'primary',
  onSpouseTabChange,
}) => {
  const [expandedEmployerId, setExpandedEmployerId] = useState<string | null>(null);

  // Initialize employers list if empty
  const employers: Employer106Record[] = (input.employers && input.employers.length > 0)
    ? input.employers
    : [{
        id: '1',
        employerName: input.employerName || 'מעסיק עיקרי',
        grossSalary: input.grossSalary || 0,
        taxDeducted: input.taxDeducted || 0,
        workMonths: input.workMonths || 12,
        employeePensionDeposit: input.employeePensionDeposit || 0,
        employerPensionDeposit: input.employerPensionDeposit || 0,
        nonInsuredSalary: input.nonInsuredSalary || 0,
      }];

  const updateEmployer = (id: string, updates: Partial<Employer106Record>) => {
    const updated = employers.map(emp => emp.id === id ? { ...emp, ...updates } : emp);
    
    // Sync top-level convenience values with primary employer or aggregates
    const totalGross = updated.reduce((acc, e) => acc + (e.grossSalary || 0), 0);
    const totalTax = updated.reduce((acc, e) => acc + (e.taxDeducted || 0), 0);
    const primary = updated[0];

    onChange({
      employers: updated,
      grossSalary: totalGross,
      taxDeducted: totalTax,
      workMonths: primary.workMonths,
      employerName: primary.employerName,
      employeePensionDeposit: primary.employeePensionDeposit,
      employerPensionDeposit: primary.employerPensionDeposit,
      nonInsuredSalary: primary.nonInsuredSalary,
      hadMultipleEmployers: updated.length > 1,
    });
  };

  const addEmployer = () => {
    const newEmp: Employer106Record = {
      id: Math.random().toString(),
      employerName: `מעסיק ${employers.length + 1}`,
      grossSalary: 0,
      taxDeducted: 0,
      workMonths: 12,
      employeePensionDeposit: 0,
      employerPensionDeposit: 0,
      nonInsuredSalary: 0,
    };
    const updated = [...employers, newEmp];
    onChange({
      employers: updated,
      hadMultipleEmployers: true,
    });
    setExpandedEmployerId(newEmp.id);
  };

  const removeEmployer = (id: string) => {
    if (employers.length <= 1) return;
    const updated = employers.filter(emp => emp.id !== id);
    const totalGross = updated.reduce((acc, e) => acc + (e.grossSalary || 0), 0);
    const totalTax = updated.reduce((acc, e) => acc + (e.taxDeducted || 0), 0);
    const primary = updated[0];

    onChange({
      employers: updated,
      grossSalary: totalGross,
      taxDeducted: totalTax,
      workMonths: primary.workMonths,
      employerName: primary.employerName,
      hadMultipleEmployers: updated.length > 1,
    });
  };

  // Aggregated totals across all employers
  const totalGrossAll = employers.reduce((acc, e) => acc + (e.grossSalary || 0), 0);
  const totalTaxAll = employers.reduce((acc, e) => acc + (e.taxDeducted || 0), 0);
  const totalPensionEmployeeAll = employers.reduce((acc, e) => acc + (e.employeePensionDeposit || 0), 0);

  const addChild = () => {
    const newChild: Child = {
      id: Math.random().toString(),
      birthYear: input.taxYear,
    };
    onChange({ children: [...(input.children || []), newChild] });
  };

  const removeChild = (id: string) => {
    onChange({ children: (input.children || []).filter(c => c.id !== id) });
  };

  const updateChild = (id: string, updates: Partial<Child>) => {
    onChange({
      children: (input.children || []).map(c => c.id === id ? { ...c, ...updates } : c),
    });
  };

  const availableYears: TaxYear[] = [2025, 2024, 2023, 2022, 2021, 2020];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Spouse Navigation Banner (if married and enabled) */}
      {input.maritalStatus === 'married' && onSpouseTabChange && (
        <div className="bg-indigo-900 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Scale className="w-4 h-4 text-indigo-300" />
            <span>חישוב זוגי משותף:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSpouseTabChange('primary')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSpouseTab === 'primary'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-indigo-200 hover:bg-indigo-800'
              }`}
            >
              בן הזוג העיקרי ({input.employeeName || 'עובד א׳'})
            </button>
            <button
              type="button"
              onClick={() => {
                onChange({ includeSpouseCalculation: true });
                onSpouseTabChange('spouse');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSpouseTab === 'spouse'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-indigo-200 hover:bg-indigo-800'
              }`}
            >
              בן/בת הזוג ({input.spouseData?.employeeName || 'עובד ב׳'})
            </button>
          </div>
        </div>
      )}

      {/* Step Navigation Bar */}
      <div className="border-b border-slate-200 bg-slate-50/70 p-3 sm:p-4 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[720px] sm:min-w-0">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isDone = currentStep > step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepChange(step.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/30'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isDone
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3" /> : step.id}
                </div>
                <span>{step.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Step Body */}
      <div className="p-5 sm:p-8 min-h-[460px]">
        {/* Step 1: General Info & Year Selection */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs tracking-wide">
                <span>שלב 1 מתוך 8</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                עבור איזו שנת מס תרצה לבדוק החזר מס?
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                לפי החוק בישראל, שכירים יכולים להגיש בקשה להחזר מס עבור <strong>עד 6 שנים אחורה</strong>. כל שנה נבדקת בנפרד.
              </p>
            </div>

            {/* Year Selector */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                בחר שנת מס:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {availableYears.map((yr) => {
                  const isSelected = input.taxYear === yr;
                  const isExpiringSoon = yr === 2020;

                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => onChange({ taxYear: yr })}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold shadow-sm ring-2 ring-indigo-500/30'
                          : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-lg font-bold">{yr}</div>
                      <div className="text-[11px] text-slate-500">
                        {isExpiringSoon ? 'מתיישן בקרוב!' : yr === 2025 ? 'שנה אחרונה' : 'זמין להחזר'}
                      </div>
                      {isExpiringSoon && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                          דחוף
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gender Selection */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-bold text-slate-800">
                  מגדר (משפיע על נקודות הזיכוי הבסיסיות):
                </label>
                <span className="text-xs text-indigo-700 font-medium bg-indigo-50 px-2 py-0.5 rounded-md">
                  אישה מקבלת חצי נקודת זיכוי נוספת כחוק
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => onChange({ gender: 'male' })}
                  className={`p-3.5 rounded-xl border text-center font-bold text-sm transition-all cursor-pointer ${
                    input.gender === 'male'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  גבר (2.25 נקודות זיכוי)
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ gender: 'female' })}
                  className={`p-3.5 rounded-xl border text-center font-bold text-sm transition-all cursor-pointer ${
                    input.gender === 'female'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  אישה (2.75 נקודות זיכוי)
                </button>
              </div>
            </div>

            {/* Marital Status & Dependent Spouse */}
            <div className="pt-2">
              <label className="block text-sm font-bold text-slate-800 mb-2">
                מצב משפחתי בשנת {input.taxYear}:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl">
                {(
                  [
                    { key: 'married', label: 'נשוי / נשואה' },
                    { key: 'single', label: 'רווק / רווקה' },
                    { key: 'divorced', label: 'גרוש / גרושה' },
                    { key: 'widowed', label: 'אלמן / אלמנה' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      if (item.key !== 'married') {
                        onChange({
                          maritalStatus: item.key,
                          hasDependentSpouse: false,
                          includeSpouseCalculation: false,
                          spouseData: undefined,
                        });
                        if (onSpouseTabChange) {
                          onSpouseTabChange('primary');
                        }
                      } else {
                        onChange({ maritalStatus: item.key });
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-center text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                      input.maritalStatus === item.key
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Married options: Dependent Spouse (סעיף 37) & Dual Calculation */}
              {input.maritalStatus === 'married' && (
                <div className="mt-4 p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-3">
                  <div className="font-bold text-indigo-950 text-sm flex items-center gap-2">
                    <Scale className="w-4 h-4 text-indigo-600" />
                    <span>התייחסות לבן/בת הזוג בשנת {input.taxYear}:</span>
                  </div>

                  <label className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-indigo-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={input.hasDependentSpouse || false}
                      onChange={(e) => onChange({ hasDependentSpouse: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 mt-0.5 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span>בן/בת הזוג לא עבדו כלל בשנת המס (סעיף 37 לפקודה)</span>
                        <GuideTooltip fieldKey="dependentSpouse" />
                      </span>
                      <p className="text-xs text-slate-600 mt-0.5">
                        מזכה אותך בתוספת של 1 נקודת זיכוי שנתית (כ-2,900 ₪) ישירות למשכורת שלך!
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-indigo-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={input.includeSpouseCalculation || false}
                      onChange={(e) => onChange({ includeSpouseCalculation: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 mt-0.5 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span>בן/בת הזוג עבדו - ברצוני לבצע חישוב זוגי מאוחד וסופי</span>
                      </span>
                      <p className="text-xs text-slate-600 mt-0.5">
                        המערכת תאפשר הזנת טפסי 106 של שניכם ותחשב את סך כל הכסף שמגיע למשפחה!
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Multiple Employers & Form 106 Fields */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs tracking-wide">
                  <span>שלב 2 מתוך 8</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">
                  מעסיקים ונתוני טופס 106 לשנת {input.taxYear}
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  עבדת אצל יותר ממעסיק אחד? תוכל להוסיף כל מעסיק בנפרד – המערכת תסכום את כל הנתונים אוטומטית!
                </p>
              </div>

              <button
                type="button"
                onClick={addEmployer}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>הוסף מעסיק נוסף (טופס 106)</span>
              </button>
            </div>

            {/* Aggregated Totals Bar (when multiple employers) */}
            {employers.length > 1 && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-medium">
                <div className="flex items-center gap-2 font-bold text-indigo-950">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>סך הכל מכל {employers.length} המעסיקים יחד:</span>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <span className="text-slate-500">משכורת ברוטו:</span>{' '}
                    <strong className="text-slate-900">₪{totalGrossAll.toLocaleString('he-IL')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">מס שנוכה בפועל:</span>{' '}
                    <strong className="text-amber-800">₪{totalTaxAll.toLocaleString('he-IL')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">הפרשות עובד לפנסיה:</span>{' '}
                    <strong className="text-emerald-800">₪{totalPensionEmployeeAll.toLocaleString('he-IL')}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Employers List */}
            <div className="space-y-6">
              {employers.map((emp, idx) => {
                const isExpanded = expandedEmployerId === emp.id || employers.length === 1;

                return (
                  <div
                    key={emp.id}
                    className="border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden"
                  >
                    {/* Employer Card Header */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-sm sm:text-base">
                            {emp.employerName || `מעסיק ${idx + 1}`}
                          </span>
                          {idx === 0 && (
                            <span className="mr-2 text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
                              מעסיק עיקרי
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {employers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEmployer(emp.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                            title="מחק מעסיק זה"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {employers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setExpandedEmployerId(isExpanded ? null : emp.id)}
                            className="p-1.5 text-slate-500 hover:text-slate-800"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Employer Card Body */}
                    {isExpanded && (
                      <div className="p-5 space-y-5">
                        {/* Scanner for this employer */}
                        <Form106Scanner
                          employerLabel={`טופס 106 - ${emp.employerName || `מעסיק ${idx + 1}`}`}
                          currentYear={input.taxYear}
                          onDataLoaded={(scanned) => {
                            updateEmployer(emp.id, scanned);
                            if (scanned.taxYear) {
                              onChange({ taxYear: scanned.taxYear });
                            }
                          }}
                        />

                        {/* Primary Income and Insured Base inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs font-bold text-slate-800 block mb-1">
                              שם המעסיק / החברה:
                            </label>
                            <input
                              type="text"
                              value={emp.employerName || ''}
                              onChange={(e) => updateEmployer(emp.id, { employerName: e.target.value })}
                              placeholder="לדוגמה: אלפא הייטק בע״מ"
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                <span>שכר ברוטו שנתי כולל</span>
                                <GuideTooltip fieldKey="grossSalary" />
                              </label>
                              <span className="text-[10px] text-indigo-700 font-mono bg-indigo-50 px-1 py-0.5 rounded">
                                שדה 158 / 244
                              </span>
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                value={emp.grossSalary || ''}
                                onChange={(e) => updateEmployer(emp.id, { grossSalary: Number(e.target.value) || 0 })}
                                placeholder="0"
                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-8 text-sm"
                              />
                              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                                ₪
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                <span>מס הכנסה שנוכה בפועל</span>
                                <GuideTooltip fieldKey="taxDeducted" />
                              </label>
                              <span className="text-[10px] text-amber-800 font-mono bg-amber-50 px-1 py-0.5 rounded">
                                שדה 042 / 142
                              </span>
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                value={emp.taxDeducted || ''}
                                onChange={(e) => updateEmployer(emp.id, { taxDeducted: Number(e.target.value) || 0 })}
                                placeholder="0"
                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-8 text-sm"
                              />
                              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                                ₪
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                <span>שכר מבוטח לפנסיה</span>
                                <GuideTooltip fieldKey="insuredSalary" />
                              </label>
                              <span className="text-[10px] text-indigo-700 font-mono bg-indigo-50 px-1 py-0.5 rounded">
                                חלק ד׳ / ה׳
                              </span>
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                value={emp.insuredSalary || ''}
                                onChange={(e) => updateEmployer(emp.id, { insuredSalary: Number(e.target.value) || 0 })}
                                placeholder="משכורת קובעת"
                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-8 text-sm"
                              />
                              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                                ₪
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Additional 106 Fields: Fields 045, 086, 036, 081 & Non-insured salary */}
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <div className="text-xs font-bold text-indigo-950 mb-3 flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                            <span>שדות נוספים בטופס 106 המשפיעים על המס (פנסיה, קצבה ושכר לא מבוטח):</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                  <span>הפרשות עובד לקצבה</span>
                                  <GuideTooltip fieldKey="pensionEmployee" />
                                </label>
                                <span className="text-[10px] text-indigo-700 font-mono">045 / 086</span>
                              </div>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={emp.employeePensionDeposit || ''}
                                  onChange={(e) => updateEmployer(emp.id, { employeePensionDeposit: Number(e.target.value) || 0 })}
                                  placeholder="0"
                                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 text-xs font-semibold pl-7"
                                />
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₪</div>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5">זיכוי 35% סעיף 45</p>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                  <span>הפרשות מעביד מעל התקרה</span>
                                  <GuideTooltip fieldKey="pensionEmployer" />
                                </label>
                                <span className="text-[10px] text-indigo-700 font-mono">036 / 081</span>
                              </div>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={emp.employerPensionDeposit || ''}
                                  onChange={(e) => updateEmployer(emp.id, { employerPensionDeposit: Number(e.target.value) || 0 })}
                                  placeholder="0"
                                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 text-xs font-semibold pl-7"
                                />
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₪</div>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5">שווי הפרשות חייב</p>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                  <span>שכר לא מבוטח לפנסיה</span>
                                  <GuideTooltip fieldKey="nonInsuredSalary" />
                                </label>
                              </div>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={emp.nonInsuredSalary || ''}
                                  onChange={(e) => updateEmployer(emp.id, { nonInsuredSalary: Number(e.target.value) || 0 })}
                                  placeholder="0"
                                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 text-xs font-semibold pl-7"
                                />
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₪</div>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5">זכאות להפקדה וניכוי סעיף 47</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Taxable National Insurance Payments */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs tracking-wide">
                <span>שלב 3 מתוך 8</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                תשלומי ביטוח לאומי החייבים במס בשנת {input.taxYear}
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                האם קיבלת בשנת המס גמלאות חייבות במס מביטוח לאומי (דמי אבטלה, תגמולי מילואים ישירים, דמי לידה ושמירת היריון, דמי פגיעה ועוד)?
              </p>
            </div>

            {/* Yes/No Toggle */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => onChange({
                  receivedBituachLeumiBenefits: false,
                  unemploymentBenefits: 0,
                  reserveDutyBenefits: 0,
                  maternityBenefits: 0,
                  workInjuryBenefits: 0,
                  otherTaxableBituachLeumiBenefits: 0,
                  bituachLeumiTaxDeducted: 0,
                })}
                className={`flex-1 p-4 rounded-xl border text-center font-bold text-sm sm:text-base transition-all cursor-pointer ${
                  !input.receivedBituachLeumiBenefits
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                לא, לא קיבלתי גמלאות מביטוח לאומי
              </button>
              <button
                type="button"
                onClick={() => onChange({ receivedBituachLeumiBenefits: true })}
                className={`flex-1 p-4 rounded-xl border text-center font-bold text-sm sm:text-base transition-all cursor-pointer ${
                  input.receivedBituachLeumiBenefits
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                כן, קיבלתי תשלומים מביטוח לאומי בשנת {input.taxYear}
              </button>
            </div>

            {/* Detailed National Insurance Benefits Fields */}
            {input.receivedBituachLeumiBenefits && (
              <div className="p-5 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-5">
                <div className="flex items-start gap-2.5 p-3.5 bg-white rounded-xl border border-indigo-100 text-xs sm:text-sm text-slate-700">
                  <AlertCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block font-bold">היכן משיגים את הנתונים?</strong>
                    <span>
                      היכנס לאזור האישי באתר המוסד לביטוח לאומי והורד את המסמך: <strong>"אישור שנתי למס הכנסה על תשלומים וניכויים"</strong>. כל הנתונים מופיעים שם מרוכזים!
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* דמי אבטלה */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <span>דמי אבטלה</span>
                        <GuideTooltip fieldKey="unemploymentBenefits" />
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={input.unemploymentBenefits || ''}
                        onChange={(e) => onChange({ unemploymentBenefits: Number(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-8 text-sm"
                      />
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">₪</div>
                    </div>
                  </div>

                  {/* תגמולי מילואים ישירים */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <span>תגמולי מילואים ישירים</span>
                        <GuideTooltip fieldKey="reserveDutyBenefits" />
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={input.reserveDutyBenefits || ''}
                        onChange={(e) => onChange({ reserveDutyBenefits: Number(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-8 text-sm"
                      />
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">₪</div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">ששולמו ישירות לחשבון (לא דרך המעסיק)</p>
                  </div>

                  {/* דמי לידה ושמירת היריון */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <span>דמי לידה ושמירת היריון</span>
                        <GuideTooltip fieldKey="maternityBenefits" />
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={input.maternityBenefits || ''}
                        onChange={(e) => onChange({ maternityBenefits: Number(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-8 text-sm"
                      />
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">₪</div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">סכום ברוטו חייב במס</p>
                  </div>

                  {/* דמי פגיעה בעבודה */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <span>דמי פגיעה בעבודה</span>
                        <GuideTooltip fieldKey="workInjuryBenefits" />
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={input.workInjuryBenefits || ''}
                        onChange={(e) => onChange({ workInjuryBenefits: Number(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-8 text-sm"
                      />
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">₪</div>
                    </div>
                  </div>

                  {/* תגמולים חייבים נוספים */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <span>תגמולים חייבים נוספים</span>
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={input.otherTaxableBituachLeumiBenefits || ''}
                        onChange={(e) => onChange({ otherTaxableBituachLeumiBenefits: Number(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-8 text-sm"
                      />
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">₪</div>
                    </div>
                  </div>

                  {/* מס הכנסה שנוכה במקור ע"י ביטוח לאומי */}
                  <div className="p-3 bg-amber-50/80 border-2 border-amber-300 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-amber-950 flex items-center gap-1">
                        <span>מס שנוכה במקור בביטוח לאומי</span>
                        <GuideTooltip fieldKey="bituachLeumiTaxDeducted" />
                      </label>
                      <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                        קריטי להחזר!
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={input.bituachLeumiTaxDeducted || ''}
                        onChange={(e) => onChange({ bituachLeumiTaxDeducted: Number(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 pl-8 text-sm"
                      />
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-700 text-xs font-bold">₪</div>
                    </div>
                    <p className="text-[10px] text-amber-900 mt-1 font-medium">
                      כל שקל שנוכה ע"י ביטוח לאומי מתווסף ישירות לסך המיסים ששילמת ועשוי לחזור במלואו!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Children & Family */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs tracking-wide">
                <span>שלב 4 מתוך 8</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                האם יש לך ילדים מתחת לגיל 18 או נסיבות משפחתיות?
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                נקודות זיכוי בגין ילדים מעניקות אלפי שקלים בשנה. כל ילד שנולד בשנת המס מעניק הטבה רטרואקטיבית!
              </p>
            </div>

            {/* Yes/No Toggle */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => onChange({ hasChildren: false, children: [] })}
                className={`flex-1 p-4 rounded-xl border text-center font-bold text-sm sm:text-base transition-all cursor-pointer ${
                  !input.hasChildren
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                אין לי ילדים עד גיל 18
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange({ hasChildren: true });
                  if (!input.children || input.children.length === 0) {
                    addChild();
                  }
                }}
                className={`flex-1 p-4 rounded-xl border text-center font-bold text-sm sm:text-base transition-all cursor-pointer ${
                  input.hasChildren
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                כן, יש לי ילדים עד גיל 18
              </button>
            </div>

            {/* Children List */}
            {input.hasChildren && (
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span>פירוט הילדים (שנת לידה)</span>
                      <GuideTooltip fieldKey="children" />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={addChild}
                    className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>הוסף ילד</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(input.children || []).map((child, idx) => {
                    const childAgeInTaxYear = input.taxYear - child.birthYear;

                    return (
                      <div
                        key={child.id}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            ילד #{idx + 1}
                          </div>
                          <div className="text-[11px] text-indigo-700 font-medium">
                            {childAgeInTaxYear < 0
                              ? 'טרם נולד בשנת המס'
                              : childAgeInTaxYear === 0
                              ? 'שנת לידה (זיכוי פעוטות!)'
                              : `גיל ${childAgeInTaxYear} בשנת ${input.taxYear}`}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-600">שנת לידה:</label>
                          <select
                            value={child.birthYear}
                            onChange={(e) => updateChild(child.id, { birthYear: Number(e.target.value) })}
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold rounded-lg px-2 py-1.5 cursor-pointer"
                          >
                            {Array.from({ length: 25 }, (_, i) => input.taxYear - i).map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => removeChild(child.id)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                            title="מחק ילד"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Additional family options */}
                <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={input.isSingleParent || false}
                      onChange={(e) => onChange({ isSingleParent: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-800">הורה יחיד / משפחה חד הורית</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={input.paysAlimony || false}
                      onChange={(e) => onChange({ paysAlimony: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-slate-800">משלם מזונות</span>
                      <GuideTooltip fieldKey="alimony" />
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={input.hasSpecialNeedsDependent || false}
                      onChange={(e) => onChange({ hasSpecialNeedsDependent: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-slate-800">ילד נטול יכולת (סעיף 45)</span>
                      <GuideTooltip fieldKey="specialNeeds" />
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Academic Degree, Military Service & New Immigrants */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs tracking-wide">
                <span>שלב 5 מתוך 8</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                תואר אקדמי, שחרור מצה״ל או עולה חדש (סעיף 35)
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                בוגרי תארים, חיילים משוחררים ועולים חדשים זכאים לנקודות זיכוי בשווי אלפי שקלים!
              </p>
            </div>

            {/* Academic Degree Section */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={input.hasAcademicDegree || false}
                  onChange={(e) => onChange({ hasAcademicDegree: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <span>סיימתי תואר אקדמי או לימודי מקצוע (סעיף 40ד)</span>
                  <GuideTooltip fieldKey="academicDegree" />
                </span>
              </label>

              {input.hasAcademicDegree && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">סוג התואר:</label>
                    <select
                      value={input.degreeType || 'bachelor'}
                      onChange={(e) => onChange({ degreeType: e.target.value as any })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold cursor-pointer"
                    >
                      <option value="bachelor">תואר ראשון (1 נקודת זיכוי ל-3 שנים)</option>
                      <option value="master">תואר שני (0.5 נקודת זיכוי לשנתיים)</option>
                      <option value="practical_engineer">הנדסאי / לימודי מקצוע מוכרים (1 נקודה)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">שנת סיום הלימודים:</label>
                    <select
                      value={input.graduationYear || input.taxYear - 1}
                      onChange={(e) => onChange({ graduationYear: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold cursor-pointer"
                    >
                      {Array.from({ length: 6 }, (_, i) => input.taxYear - i).map((y) => (
                        <option key={y} value={y}>
                          שנת {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Military Service Section */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={input.isDischargedSoldier || false}
                  onChange={(e) => onChange({ isDischargedSoldier: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <span>השתחררתי משירות צבאי / שירות לאומי (36 חודשים אחרונים)</span>
                  <GuideTooltip fieldKey="dischargedSoldier" />
                </span>
              </label>

              {input.isDischargedSoldier && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">אופי השירות:</label>
                    <select
                      value={input.serviceType || 'combat'}
                      onChange={(e) => onChange({ serviceType: e.target.value as any })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold cursor-pointer"
                    >
                      <option value="combat">לוחם / לוחמת (2 נקודות זיכוי = ₪5,800+ לשנה)</option>
                      <option value="regular">תומך לחימה / עורפי / שירות לאומי (1 נקודת זיכוי)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">שנת השחרור:</label>
                    <select
                      value={input.dischargeYear || input.taxYear}
                      onChange={(e) => onChange({ dischargeYear: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold cursor-pointer"
                    >
                      {Array.from({ length: 4 }, (_, i) => input.taxYear - i).map((y) => (
                        <option key={y} value={y}>
                          שנת {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* New Immigrant Section (סעיף 35) */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={input.isNewImmigrant || false}
                  onChange={(e) => onChange({ isNewImmigrant: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <span>עולה חדש / תושב חוזר ותיק (סעיף 35 לפקודה)</span>
                  <GuideTooltip fieldKey="newImmigrant" />
                </span>
              </label>

              {input.isNewImmigrant && (
                <div className="pt-2 border-t border-slate-200 max-w-sm">
                  <label className="text-xs font-bold text-slate-700 block mb-1">שנת העלייה לישראל:</label>
                  <select
                    value={input.immigrationYear || input.taxYear}
                    onChange={(e) => onChange({ immigrationYear: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold cursor-pointer"
                  >
                    {Array.from({ length: 5 }, (_, i) => input.taxYear - i).map((y) => (
                      <option key={y} value={y}>
                        שנת {y}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 6: Eligible Settlement */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs tracking-wide">
                <span>שלב 6 מתוך 8</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                מגורים ביישוב מזכה (הנחת פריפריה לפי סעיף 11)
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                תושבי יישובים בפריפריה, גליל, נגב, עוטף עזה וקו עימות זכאים לזיכוי כספי אחוזי ניכר מההכנסה!
              </p>
            </div>

            {/* Yes/No Toggle */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => onChange({ livesInEligibleSettlement: false, settlementName: '' })}
                className={`flex-1 p-4 rounded-xl border text-center font-bold text-sm sm:text-base transition-all cursor-pointer ${
                  !input.livesInEligibleSettlement
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                לא גרתי ביישוב מזכה
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange({
                    livesInEligibleSettlement: true,
                    settlementName: input.settlementName || ELIGIBLE_SETTLEMENTS[0].name,
                  });
                }}
                className={`flex-1 p-4 rounded-xl border text-center font-bold text-sm sm:text-base transition-all cursor-pointer ${
                  input.livesInEligibleSettlement
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                כן, גרתי ביישוב מזכה
              </button>
            </div>

            {/* Settlement selector */}
            {input.livesInEligibleSettlement && (
              <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>בחר את היישוב בו התגוררת בשנת {input.taxYear}</span>
                    <GuideTooltip fieldKey="eligibleSettlement" />
                  </label>
                  <span className="text-xs text-emerald-800 bg-emerald-100 font-semibold px-2 py-0.5 rounded">
                    נדרש אישור תושבות (טופס 1312)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto p-1">
                  {ELIGIBLE_SETTLEMENTS.map((s) => {
                    const isSelected = input.settlementName === s.name;
                    return (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => onChange({ settlementName: s.name })}
                        className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-sm'
                            : 'bg-white hover:bg-emerald-50 text-slate-800 border-slate-200'
                        }`}
                      >
                        <div className="font-bold text-sm">{s.name}</div>
                        <div className={`text-[11px] ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                          הנחה של {Math.round(s.rate * 100)}% (עד ₪{(s.ceiling / 1000)}k)
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 7: Capital Market (שוק ההון) */}
        {currentStep === 7 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs tracking-wide">
                <span>שלב 7 מתוך 8</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                האם השקעת בשוק ההון בשנת {input.taxYear}?
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                אם מכרת ניירות ערך (מניות, קרנות, אג״ח) בבנק או בבית השקעות – ניתן לקזז הפסדים כנגד רווחים ולדרוש החזר מס שנוכה במקור!
              </p>
            </div>

            {/* Yes/No Toggle */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => onChange({
                  investedInCapitalMarket: false,
                  capitalGains: 0,
                  capitalLosses: 0,
                  capitalTaxPaid: 0,
                })}
                className={`flex-1 p-4 rounded-xl border text-center font-bold text-sm sm:text-base transition-all cursor-pointer ${
                  !input.investedInCapitalMarket
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                לא השקעתי בשוק ההון
              </button>
              <button
                type="button"
                onClick={() => onChange({ investedInCapitalMarket: true })}
                className={`flex-1 p-4 rounded-xl border text-center font-bold text-sm sm:text-base transition-all cursor-pointer ${
                  input.investedInCapitalMarket
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                כן, השקעתי וקיים לי טופס 867
              </button>
            </div>

            {/* Capital Market inputs */}
            {input.investedInCapitalMarket && (
              <div className="p-5 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-indigo-950 text-sm flex items-center gap-1.5">
                    <span>הזנת נתונים מטופס 867 (דוח מס מהבנק/ברוקר)</span>
                    <GuideTooltip fieldKey="capitalGains" />
                  </div>
                  <span className="text-xs text-indigo-700 bg-indigo-100 font-semibold px-2 py-0.5 rounded">
                    סעיף 867
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1 mb-1">
                      <span>רווחי הון ריאליים (חייבים 25%)</span>
                      <GuideTooltip fieldKey="capitalGains" />
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={input.capitalGains || ''}
                        onChange={(e) => onChange({ capitalGains: Number(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-8"
                      />
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                        ₪
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1 mb-1">
                      <span>הפסדי הון שלא קוזזו</span>
                      <GuideTooltip fieldKey="capitalLosses" />
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={input.capitalLosses || ''}
                        onChange={(e) => onChange({ capitalLosses: Number(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-8"
                      />
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                        ₪
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1 mb-1">
                      <span>מס שנוכה במקור בבנק</span>
                      <GuideTooltip fieldKey="capitalTaxPaid" />
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={input.capitalTaxPaid || ''}
                        onChange={(e) => onChange({ capitalTaxPaid: Number(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-8"
                      />
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                        ₪
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 8: Donations, Pension, Nursing & Deductions */}
        {currentStep === 8 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs tracking-wide">
                <span>שלב 8 מתוך 8</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                תרומות, ביטוח חיים, ניכויים והוצאות מותרות
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                סעיפים 44, 45, 46 ו-47 מעניקים החזרי מס כספיים ישירים וניכויים שמקטינים את ההכנסה החייבת!
              </p>
            </div>

            {/* Donations section (סעיף 46) */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={input.madeDonations || false}
                    onChange={(e) => onChange({ madeDonations: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span>תרמתי למוסדות מוכרים לפי סעיף 46 (מעל 200 ₪)</span>
                    <GuideTooltip fieldKey="donations" />
                  </span>
                </label>
                <span className="text-xs text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded">
                  35% החזר כספי ישיר!
                </span>
              </div>

              {input.madeDonations && (
                <div className="pt-2 border-t border-slate-200 max-w-sm">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    סך כל התרומות בשנת {input.taxYear}:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={input.donationAmount || ''}
                      onChange={(e) => onChange({ donationAmount: Number(e.target.value) || 0 })}
                      placeholder="לדוגמה: 1500"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-10"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                      ₪
                    </div>
                  </div>
                  {input.donationAmount && input.donationAmount > 200 && (
                    <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                      החזר צפוי מתרומות בלבד: ₪{Math.round(input.donationAmount * 0.35).toLocaleString('he-IL')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Self Pension & Mortgage Life Insurance (סעיף 45) */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={input.madeSelfPensionDeposits || false}
                    onChange={(e) => onChange({ madeSelfPensionDeposits: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span>הפקדתי עצמאית לפנסיה או שילמתי ביטוח חיים / משכנתא (סעיף 45)</span>
                    <GuideTooltip fieldKey="selfLifeInsurance" />
                  </span>
                </label>
                <span className="text-xs text-indigo-700 bg-indigo-100 font-semibold px-2 py-0.5 rounded">
                  עד 35% זיכוי
                </span>
              </div>

              {input.madeSelfPensionDeposits && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                      <span>תשלומים לביטוח חיים (כולל ביטוח משכנתא)</span>
                      <GuideTooltip fieldKey="selfLifeInsurance" />
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={input.selfLifeInsuranceAmount || ''}
                        onChange={(e) => onChange({ selfLifeInsuranceAmount: Number(e.target.value) || 0 })}
                        placeholder="סכום שנתי ב-₪"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-8"
                      />
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                        ₪
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">25% זיכוי מס ישיר</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                      <span>הפקדות עצמאיות לקופת גמל / פנסיה</span>
                      <GuideTooltip fieldKey="selfPension" />
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={input.selfPensionAmount || ''}
                        onChange={(e) => onChange({ selfPensionAmount: Number(e.target.value) || 0 })}
                        placeholder="סכום שנתי ב-₪"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-8"
                      />
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                        ₪
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">35% זיכוי + ניכוי סעיף 47</p>
                  </div>
                </div>
              )}
            </div>

            {/* הוצאות השתלמות מקצועית לשכיר לשמירה על הקיים (הוצאה מוכרת בניכוי) */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={input.hasProfessionalStudiesExpenses || false}
                    onChange={(e) => onChange({
                      hasProfessionalStudiesExpenses: e.target.checked,
                      hasDeductibleExpenses: e.target.checked || input.hasInstitutionalNursingExpenses,
                      professionalStudiesExpenses: e.target.checked ? (input.professionalStudiesExpenses || 0) : 0,
                    })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span>השתלמות מקצועית לשכיר לשמירה על הקיים (הוצאה מותרת בניכוי)</span>
                    <GuideTooltip fieldKey="professionalStudies" />
                  </span>
                </label>
                <span className="text-xs text-indigo-700 bg-indigo-100 font-bold px-2 py-0.5 rounded">
                  ניכוי מההכנסה החייבת
                </span>
              </div>

              {input.hasProfessionalStudiesExpenses && (
                <div className="pt-2 border-t border-slate-200 max-w-sm">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    סך הוצאות השתלמות מקצועית לשמירה על הקיים ב-₪:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={input.professionalStudiesExpenses || ''}
                      onChange={(e) => onChange({ professionalStudiesExpenses: Number(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-8 text-sm"
                    />
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                      ₪
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    לפי סעיף 17 לפקודה והלכת ביהמ"ש העליון, קורסים, כנסים וספרות מקצועית לשמירה על הקיים במקצוע מפחיתים ישירות את ההכנסה החייבת במס.
                  </p>
                </div>
              )}
            </div>

            {/* החזקת קרוב במוסד סיעודי / רפואי (סעיף 44 - 35% זיכוי מס כספי) */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={input.hasInstitutionalNursingExpenses || false}
                    onChange={(e) => onChange({
                      hasInstitutionalNursingExpenses: e.target.checked,
                      hasDeductibleExpenses: e.target.checked || input.hasProfessionalStudiesExpenses,
                      institutionalNursingExpenses: e.target.checked ? (input.institutionalNursingExpenses || 0) : 0,
                    })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span>החזקת הורה, בן זוג או ילד במוסד סיעודי / בית אבות (סעיף 44)</span>
                    <GuideTooltip fieldKey="nursingInstitution" />
                  </span>
                </label>
                <span className="text-xs text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded">
                  35% זיכוי מס כספי ישיר!
                </span>
              </div>

              {input.hasInstitutionalNursingExpenses && (
                <div className="pt-2 border-t border-slate-200 max-w-sm">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    סך תשלומים למוסד הסיעודי בשנת {input.taxYear} ב-₪:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={input.institutionalNursingExpenses || ''}
                      onChange={(e) => onChange({ institutionalNursingExpenses: Number(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-8 text-sm"
                    />
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                      ₪
                    </div>
                  </div>
                  {input.institutionalNursingExpenses && input.institutionalNursingExpenses > 0 && (
                    <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                      זיכוי כספי צפוי: ₪{Math.round(input.institutionalNursingExpenses * 0.35).toLocaleString('he-IL')} ישירות לחשבון!
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="border-t border-slate-200 bg-slate-50/70 p-4 sm:p-5 flex items-center justify-between">
        <div>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => onStepChange(currentStep - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>הקודם</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentStep < 8 ? (
            <button
              type="button"
              onClick={() => onStepChange(currentStep + 1)}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer"
            >
              <span>המשך לשלב הבא</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onCalculate}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-md hover:shadow-lg transition-all cursor-pointer ring-2 ring-emerald-400/30"
            >
              <span>חשב החזר מס מלא לשנת {input.taxYear}!</span>
              <Check className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
