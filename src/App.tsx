import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Sparkles, 
  HelpCircle, 
  FileCheck2, 
  History, 
  ArrowLeft, 
  Coins, 
  RotateCcw, 
  ChevronDown, 
  Info,
  Users,
  Building2
} from 'lucide-react';
import { TaxInputData, TaxYear, createDefaultTaxInput } from './types/tax';
import { calculateTaxRefund } from './utils/taxCalculator';
import { TaxWizard } from './components/TaxWizard';
import { ResultDashboard } from './components/ResultDashboard';

const INITIAL_PRIMARY_DATA: TaxInputData = createDefaultTaxInput({
  taxYear: 2024,
  gender: 'male',
  maritalStatus: 'single',
  isIsraeliResident: true,
  employeeName: '',

  employers: [
    {
      id: 'emp-1',
      employerName: '',
      grossSalary: 0,
      taxDeducted: 0,
      workMonths: 12,
      employeePensionDeposit: 0,
      employerPensionDeposit: 0,
      nonInsuredSalary: 0,
    }
  ],
  grossSalary: 0,
  taxDeducted: 0,
  workMonths: 12,
  employerName: '',
  employeePensionDeposit: 0,
  employerPensionDeposit: 0,

  receivedBituachLeumiBenefits: false,
  unemploymentBenefits: 0,
  reserveDutyBenefits: 0,
  maternityBenefits: 0,
  workInjuryBenefits: 0,
  otherTaxableBituachLeumiBenefits: 0,
  bituachLeumiTaxDeducted: 0,

  hasChildren: false,
  children: [],
  isSingleParent: false,
  paysAlimony: false,
  hasSpecialNeedsDependent: false,

  hasAcademicDegree: false,
  isDischargedSoldier: false,
  isNewImmigrant: false,

  livesInEligibleSettlement: false,

  investedInCapitalMarket: false,
  capitalGains: 0,
  capitalLosses: 0,
  capitalTaxPaid: 0,

  madeSelfPensionDeposits: false,
  selfPensionAmount: 0,
  selfLifeInsuranceAmount: 0,
  madeDonations: false,
  donationAmount: 0,

  hasDependentSpouse: false,
  includeSpouseCalculation: false,
  spouseData: undefined,
});

export default function App() {
  const [taxData, setTaxData] = useState<TaxInputData>(INITIAL_PRIMARY_DATA);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'wizard' | 'results'>('wizard');
  const [showFaq, setShowFaq] = useState<boolean>(false);
  const [activeSpouseTab, setActiveSpouseTab] = useState<'primary' | 'spouse'>('primary');

  const updateTaxData = (updated: Partial<TaxInputData>) => {
    if (activeSpouseTab === 'spouse') {
      setTaxData((prev) => ({
        ...prev,
        spouseData: {
          ...(prev.spouseData || {
            taxYear: prev.taxYear,
            gender: 'female',
            maritalStatus: 'married',
            isIsraeliResident: true,
            grossSalary: 0,
            taxDeducted: 0,
            workMonths: 12,
            hasChildren: prev.hasChildren,
            children: prev.children,
          }),
          ...updated,
        }
      }));
    } else {
      setTaxData((prev) => {
        const isNotMarried = updated.maritalStatus && updated.maritalStatus !== 'married';
        return {
          ...prev,
          ...updated,
          ...(isNotMarried ? {
            hasDependentSpouse: false,
            includeSpouseCalculation: false,
            spouseData: undefined,
          } : {}),
          // sync tax year to spouse if present
          ...(updated.taxYear && prev.spouseData ? {
            spouseData: { ...prev.spouseData, taxYear: updated.taxYear }
          } : {})
        };
      });
      if (updated.maritalStatus && updated.maritalStatus !== 'married') {
        setActiveSpouseTab('primary');
      }
    }
  };

  const handleReset = () => {
    setTaxData({
      ...INITIAL_PRIMARY_DATA,
      maritalStatus: 'single',
      grossSalary: 0,
      taxDeducted: 0,
      workMonths: 12,
      hadEmploymentBreak: false,
      hasChildren: false,
      children: [],
      madeDonations: false,
      donationAmount: 0,
      employers: [
        {
          id: '1',
          employerName: 'מעסיק 1',
          grossSalary: 0,
          taxDeducted: 0,
          workMonths: 12,
          employeePensionDeposit: 0,
          employerPensionDeposit: 0,
          nonInsuredSalary: 0,
        }
      ],
      hasDependentSpouse: false,
      includeSpouseCalculation: false,
      spouseData: undefined,
    });
    setActiveSpouseTab('primary');
    setCurrentStep(1);
    setViewMode('wizard');
  };

  // Live calculation results
  const calculationResult = useMemo(() => {
    return calculateTaxRefund(taxData);
  }, [taxData]);

  const isRefund = calculationResult.netDifference > 0;
  const isFamilyRefund = taxData.maritalStatus === 'married' && (calculationResult.combinedFamilyTotalRefund || 0) > 0;

  // Active data for wizard display depending on spouse tab
  const wizardActiveData = taxData.maritalStatus === 'married' && activeSpouseTab === 'spouse' && taxData.spouseData
    ? taxData.spouseData
    : taxData;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Assistant',sans-serif]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 text-lg leading-tight tracking-tight">
                  מחשבון מס והחזר מס לשכיר
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  מעודכן 2020-2026
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                בדיקה מודרכת צעד-אחר-צעד עם מורה דרך, מספר מעסיקים, חישוב זוגי וסריקת 106
              </p>
            </div>
          </div>

          {/* Quick Live Status / View Mode */}
          <div className="flex items-center gap-3">
            {calculationResult.netDifference !== 0 && (
              <div
                onClick={() => setViewMode(viewMode === 'wizard' ? 'results' : 'wizard')}
                className={`hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  isRefund
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                }`}
                title="לחץ לצפייה בפירוט המלא"
              >
                <Coins className="w-4 h-4 text-emerald-600" />
                <span>
                  {taxData.maritalStatus === 'married' && taxData.includeSpouseCalculation && calculationResult.combinedFamilyTotalRefund ? (
                    <>
                      החזר משפחתי כולל:{' '}
                      <strong>₪{calculationResult.combinedFamilyTotalRefund.toLocaleString('he-IL')}</strong>
                    </>
                  ) : (
                    <>
                      {isRefund ? 'החזר משוער:' : 'חבות משוערת:'}{' '}
                      <strong>₪{Math.abs(isRefund ? calculationResult.finalRefundWithInterest : calculationResult.netDifference).toLocaleString('he-IL')}</strong>
                    </>
                  )}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
              title="ניקוי כל השדות והתחלת חישוב חדש"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>ניקוי שדות</span>
            </button>

            {viewMode === 'wizard' ? (
              <button
                type="button"
                onClick={() => setViewMode('results')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>צפה בתוצאות</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setViewMode('wizard')}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>חזרה לשאלון</span>
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Banner with 6-year law reminder & Features */}
        <div className="mb-6 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-950">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <div>
              <span className="font-bold">זכאות רטרואקטיבית לשכירים: </span>
              <span>
                ניתן לקבל החזרי מס עד 6 שנים אחורה בתוספת <strong>4% ריבית שנתית והצמדה למדד</strong> פטורים ממס! תמיכה מלאה במספר מעסיקים ובחישוב זוגי.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            <span className="font-semibold text-slate-500">שנת הבדיקה:</span>
            <span className="bg-white border border-indigo-200 text-indigo-800 font-bold px-2.5 py-0.5 rounded-lg">
              {taxData.taxYear}
            </span>
          </div>
        </div>

        {/* View switching */}
        {viewMode === 'wizard' ? (
          <TaxWizard
            input={wizardActiveData}
            onChange={updateTaxData}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onCalculate={() => setViewMode('results')}
            activeSpouseTab={activeSpouseTab}
            onSpouseTabChange={(tab) => setActiveSpouseTab(tab)}
            onReset={handleReset}
          />
        ) : (
          <ResultDashboard
            result={calculationResult}
            input={taxData}
            onEdit={() => setViewMode('wizard')}
            onReset={handleReset}
            onCheckAnotherYear={() => {
              const nextYear = (taxData.taxYear > 2020 ? taxData.taxYear - 1 : 2025) as TaxYear;
              updateTaxData({ taxYear: nextYear });
              setCurrentStep(1);
              setViewMode('wizard');
            }}
          />
        )}

        {/* Live bottom bar for mobile / sticky progress */}
        {viewMode === 'wizard' && calculationResult.taxAlreadyPaid > 0 && (
          <div className="mt-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                ₪
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">
                  {taxData.maritalStatus === 'married' && taxData.includeSpouseCalculation && calculationResult.combinedFamilyTotalRefund ? (
                    'הערכת החזר מס משפחתי כולל (קרן + ריבית והצמדה):'
                  ) : (
                    `הערכת החזר מס (שנת ${taxData.taxYear}):`
                  )}
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {taxData.maritalStatus === 'married' && taxData.includeSpouseCalculation && calculationResult.combinedFamilyTotalRefund ? (
                    <span className="text-emerald-600">
                      ₪{calculationResult.combinedFamilyTotalRefund.toLocaleString('he-IL')}+
                    </span>
                  ) : isRefund ? (
                    <span className="text-emerald-600">
                      ₪{calculationResult.finalRefundWithInterest.toLocaleString('he-IL')}+
                    </span>
                  ) : calculationResult.netDifference < 0 ? (
                    <span className="text-amber-600">
                      ₪{Math.abs(calculationResult.netDifference).toLocaleString('he-IL')} חבות
                    </span>
                  ) : (
                    <span>₪0</span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViewMode('results')}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>צפה בדוח המלא ומדריך ההגשה</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Educational Q&A section */}
        <div className="mt-10 border-t border-slate-200 pt-8">
          <button
            type="button"
            onClick={() => setShowFaq(!showFaq)}
            className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 transition-colors text-right cursor-pointer"
          >
            <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              <span>שאלות ותשובות נפוצות על שדות טופס 106, מספר מעסיקים וזוגות נשואים</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transform transition-transform ${showFaq ? 'rotate-180' : ''}`} />
          </button>

          {showFaq && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  1. מה המשמעות של שדות 045/086 ו-036/081 בטופס 106?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  שדה 045/086 מציג את הפרשות העובד לפנסיה ולקצבה ומזכה אותך ישירות ב-35% זיכוי מס לפי סעיף 45. שדה 036/081 מציג הפרשות מעביד שחויבו במס (מעל תקרת הפטור). שדות אלו קריטיים לחישוב מדויק של חבות המס.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  2. עבדתי אצל שני מעסיקים במקביל ולא עשיתי תיאום מס, מה קורה?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  המעסיק המשני מחויב לפי חוק לנכות את מדרגת המס המקסימלית (עד 47%). בהגשת דוח שנתי (טופס 135) שסוכם את שני המעסיקים יחד, המס מחושב מחדש לפי מדרגות שנתיות אמיתיות, וכל הכסף העודף מוחזר לחשבון הבנק שלך!
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  3. איך מחושב החזר מס עבור זוג נשוי?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  אם בן/בת הזוג לא עבדו, מגיעה לך נקודת זיכוי לפי סעיף 37 (תוספת של כ-₪2,900 לשנה). אם שניכם עבדתם, מבוצע חישוב נפרד לכל אחד ובנוסף שקלול של כלל נקודות הזיכוי של הילדים והתרומות המשפחתיות – לקבלת סך ההחזר המשותף שנכנס לבנק.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  4. האם מס הכנסה משלם ריבית והצמדה על ההחזר?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  כן! לפי סעיף 160 לפקודה, המדינה משלמת 4% ריבית שנתית מצטברת בתוספת הצמדה למדד המחירים לצרכן מיום תום שנת המס ועד התשלום. הריבית וההצמדה פטורות ממס לחלוטין!
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4">
          <p>
            מחשבון מס והחזר מס לשכיר • מבוסס על פקודת מס הכנסה, מדרגות המס, ושווי נקודות הזיכוי המעודכנים לשנים 2020–2026.
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            החישוב נועד לצורך סימולציה והערכה. לקבלת החזר בפועל יש להגיש דוח שנתי (טופס 135) לרשות המסים.
          </p>
        </div>
      </footer>
    </div>
  );
}
