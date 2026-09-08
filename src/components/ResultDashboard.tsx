import React, { useState } from 'react';
import { 
  CheckCircle2, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight, 
  Printer, 
  RefreshCw,
  Baby,
  CalendarClock,
  HeartHandshake,
  MapPin,
  GraduationCap,
  Award,
  Sparkles,
  ShieldCheck,
  Layers,
  Coins,
  Percent,
  Users,
  Building2,
  HelpCircle,
  RotateCcw,
  FileSpreadsheet
} from 'lucide-react';
import { CalculationResult, TaxInputData } from '../types/tax';

interface ResultDashboardProps {
  result: CalculationResult;
  input: TaxInputData;
  onEdit: () => void;
  onCheckAnotherYear: () => void;
  onReset?: () => void;
}

export const ResultDashboard: React.FC<ResultDashboardProps> = ({
  result,
  input,
  onEdit,
  onCheckAnotherYear,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<'individual' | 'spouse' | 'combined'>('individual');

  const isRefund = result.netDifference > 0;
  const isDebt = result.netDifference < 0;

  const iconMap: Record<string, any> = {
    CalendarClock,
    Baby,
    HeartHandshake,
    MapPin,
    TrendingUp,
    ShieldCheck,
    GraduationCap,
    Award,
  };

  const handlePrint = () => {
    window.print();
  };

  // Spouse view is strictly allowed ONLY if maritalStatus is 'married' and spouseResult exists!
  const hasSpouseData = input.maritalStatus === 'married' && !!result.spouseResult && !!input.spouseData;

  // Selected view data
  const currentDisplay = activeTab === 'spouse' && hasSpouseData && result.spouseResult
    ? result.spouseResult
    : result;

  const currentInput = activeTab === 'spouse' && hasSpouseData && input.spouseData
    ? input.spouseData
    : input;

  const currentIsRefund = currentDisplay.netDifference > 0;
  const currentIsDebt = currentDisplay.netDifference < 0;

  return (
    <div className="space-y-8 animate-fade-in print:p-0">
      {/* Top Action Bar with 'ניקוי שדות' button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-bold text-slate-800">
            תחשיב שומת מס הכנסה לשנת המס {currentDisplay.taxYear}
          </span>
          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-semibold">
            מתכונת רשות המסים
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition-colors cursor-pointer shadow-2xs"
              title="ניקוי כל שדות המחשבון והתחלת חישוב חדש"
            >
              <RotateCcw className="w-4 h-4 text-slate-600" />
              <span>ניקוי שדות</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>הדפס שומה</span>
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer shadow-xs"
          >
            <ArrowRight className="w-4 h-4" />
            <span>ערוך נתונים</span>
          </button>
        </div>
      </div>

      {/* Spouse View Selector Banner if spouse calculated */}
      {hasSpouseData && (
        <div className="bg-indigo-900 text-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-300" />
            <div>
              <h4 className="font-bold text-sm">חישוב החזר מס משפחתי זוגי</h4>
              <p className="text-xs text-indigo-200">
                הוזנו נתונים עבור שני בני הזוג לשנת {result.taxYear}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-indigo-950/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('individual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'individual'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-indigo-200 hover:text-white'
              }`}
            >
              {input.employeeName || 'בן זוג א׳'} (₪{result.finalRefundWithInterest.toLocaleString('he-IL')})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('spouse')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'spouse'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-indigo-200 hover:text-white'
              }`}
            >
              {input.spouseData?.employeeName || 'בן/בת זוג ב׳'} (₪{(result.spouseResult?.finalRefundWithInterest || 0).toLocaleString('he-IL')})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('combined')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'combined'
                  ? 'bg-emerald-400 text-emerald-950 shadow-xs'
                  : 'text-emerald-300 hover:text-white'
              }`}
            >
              סה״כ משפחתי (₪{(result.combinedFamilyTotalRefund || 0).toLocaleString('he-IL')})
            </button>
          </div>
        </div>
      )}

      {/* COMBINED FAMILY VIEW (when combined tab is selected) */}
      {activeTab === 'combined' && hasSpouseData ? (
        <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 text-white rounded-3xl p-6 sm:p-10 border border-emerald-500 shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                דוח החזר מס משפחתי מאוחד • שנת {result.taxYear}
              </span>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>הדפס דוח</span>
                </button>
              </div>
            </div>

            <p className="text-emerald-100 text-base font-medium">
              סך כל ההחזר המשותף שיועבר ישירות לחשבון הבנק שלכם:
            </p>
            <div className="text-4xl sm:text-6xl font-black tracking-tight mt-1">
              ₪{(result.combinedFamilyTotalRefund || 0).toLocaleString('he-IL')}
            </div>

            {/* Strict Separation: Nominal vs Interest/Linkage for family */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/20 text-xs sm:text-sm">
              <div className="bg-white/15 p-4 rounded-2xl backdrop-blur-xs">
                <div className="flex items-center gap-1.5 text-emerald-200 text-xs font-bold mb-1">
                  <Coins className="w-4 h-4" />
                  <span>החזר קרן המס הנומינלי:</span>
                </div>
                <div className="text-2xl font-black">
                  ₪{(result.combinedFamilyNominalRefund || 0).toLocaleString('he-IL')}
                </div>
                <div className="text-[11px] text-emerald-100 mt-1">
                  עודף המס שנוכה מתלושי המשכורת של שניכם
                </div>
              </div>

              <div className="bg-white/15 p-4 rounded-2xl backdrop-blur-xs">
                <div className="flex items-center gap-1.5 text-amber-200 text-xs font-bold mb-1">
                  <Percent className="w-4 h-4 text-amber-300" />
                  <span>ריבית והצמדה כחוק (פטורה ממס):</span>
                </div>
                <div className="text-2xl font-black text-amber-200">
                  +₪{((result.interestAndLinkageBenefit || 0) + (result.spouseResult?.interestAndLinkageBenefit || 0)).toLocaleString('he-IL')}
                </div>
                <div className="text-[11px] text-emerald-100 mt-1">
                  4% שנתי מצטבר + הצמדה למדד (סעיף 160)
                </div>
              </div>

              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-xs ring-1 ring-white/30">
                <div className="flex items-center gap-1.5 text-white text-xs font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>סה"כ החזר מאוחד לבנק:</span>
                </div>
                <div className="text-2xl font-black text-emerald-100">
                  ₪{(result.combinedFamilyTotalRefund || 0).toLocaleString('he-IL')}
                </div>
                <div className="text-[11px] text-emerald-100 mt-1">
                  סכום סופי מדויק שיופק בשומת מס הכנסה
                </div>
              </div>
            </div>

            {/* Individual breakdown summary */}
            <div className="mt-6 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-emerald-200 font-medium">חלקו של {input.employeeName || 'בן זוג א׳'}:</span>{' '}
                <strong>₪{result.finalRefundWithInterest.toLocaleString('he-IL')}</strong> (קרן: ₪{result.nominalRefund.toLocaleString('he-IL')})
              </div>
              <div>
                <span className="text-emerald-200 font-medium">חלקו של {input.spouseData?.employeeName || 'בן/בת זוג ב׳'}:</span>{' '}
                <strong>₪{(result.spouseResult?.finalRefundWithInterest || 0).toLocaleString('he-IL')}</strong> (קרן: ₪{(result.spouseResult?.nominalRefund || 0).toLocaleString('he-IL')})
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* INDIVIDUAL / SPOUSE SINGLE VIEW */
        <div
          className={`rounded-3xl p-6 sm:p-10 border shadow-lg relative overflow-hidden ${
            currentIsRefund
              ? 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 text-white border-emerald-500'
              : currentIsDebt
              ? 'bg-gradient-to-br from-amber-700 via-orange-800 to-red-900 text-white border-amber-600'
              : 'bg-gradient-to-br from-slate-700 to-slate-900 text-white border-slate-600'
          }`}
        >
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  דוח תוצאות מס הכנסה • שנת {currentDisplay.taxYear}
                </span>
                {currentDisplay.employerCount && currentDisplay.employerCount > 1 && (
                  <span className="bg-indigo-400 text-indigo-950 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    <span>שולבו {currentDisplay.employerCount} מעסיקים</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>הדפס דוח</span>
                </button>
                <button
                  type="button"
                  onClick={onEdit}
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>ערוך נתונים</span>
                </button>
              </div>
            </div>

            {/* Main Refund Sum */}
            <div className="my-6">
              <p className="text-emerald-100 text-base font-medium">
                {currentIsRefund
                  ? 'סך החזר המס הצפוי להפקדה בחשבון הבנק שלך:'
                  : currentIsDebt
                  ? 'חבות מס משוערת לשנת המס:'
                  : 'אין הפרש מס לתשלום או החזר:'}
              </p>
              <div className="text-4xl sm:text-6xl font-black tracking-tight mt-1">
                ₪{Math.abs(currentIsRefund ? currentDisplay.finalRefundWithInterest : currentDisplay.netDifference).toLocaleString('he-IL')}
              </div>
            </div>

            {/* STRICT USER REQUIREMENT: Clear separation between Nominal Tax Refund & Statutory Interest/Indexation */}
            {currentIsRefund && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-white/20 text-xs sm:text-sm">
                {/* 1. Nominal Refund */}
                <div className="bg-white/15 p-4 rounded-2xl backdrop-blur-xs">
                  <div className="flex items-center gap-1.5 text-emerald-200 text-xs font-bold mb-1">
                    <Coins className="w-4 h-4" />
                    <span>החזר מס נומינלי (קרן):</span>
                  </div>
                  <div className="text-2xl font-black">
                    ₪{currentDisplay.nominalRefund.toLocaleString('he-IL')}
                  </div>
                  <div className="text-[11px] text-emerald-100 mt-1">
                    הפרש המס שנוכה בפועל (₪{currentDisplay.taxAlreadyPaid.toLocaleString('he-IL')}) פחות חבות המס (₪{currentDisplay.taxLiabilityFinal.toLocaleString('he-IL')})
                  </div>
                </div>

                {/* 2. Statutory Interest & Linkage */}
                <div className="bg-white/15 p-4 rounded-2xl backdrop-blur-xs">
                  <div className="flex items-center gap-1.5 text-amber-200 text-xs font-bold mb-1">
                    <Percent className="w-4 h-4 text-amber-300" />
                    <span>ריבית שנתית 4% + הצמדה למדד:</span>
                  </div>
                  <div className="text-2xl font-black text-amber-200">
                    +₪{currentDisplay.interestAndLinkageBenefit.toLocaleString('he-IL')}
                  </div>
                  <div className="text-[11px] text-emerald-100 mt-1">
                    רווח כספי טהור ללא מס לפי סעיף 160 לפקודת מס הכנסה
                  </div>
                </div>

                {/* 3. Combined Total */}
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-xs ring-1 ring-white/30">
                  <div className="flex items-center gap-1.5 text-white text-xs font-bold mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>סה"כ החזר כולל לחשבון הבנק:</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-100">
                    ₪{currentDisplay.finalRefundWithInterest.toLocaleString('he-IL')}
                  </div>
                  <div className="text-[11px] text-emerald-100 mt-1">
                    קרן נומינלית + ריבית והצמדה מחושבת
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
              <div className="bg-black/15 p-2.5 rounded-xl">
                <span className="text-emerald-200 block text-[11px]">מס שנוכה בפועל:</span>
                <span className="font-bold text-sm sm:text-base">₪{currentDisplay.taxAlreadyPaid.toLocaleString('he-IL')}</span>
              </div>
              <div className="bg-black/15 p-2.5 rounded-xl">
                <span className="text-emerald-200 block text-[11px]">מס סופי לתשלום:</span>
                <span className="font-bold text-sm sm:text-base">₪{currentDisplay.taxLiabilityFinal.toLocaleString('he-IL')}</span>
              </div>
              <div className="bg-black/15 p-2.5 rounded-xl">
                <span className="text-emerald-200 block text-[11px]">נקודות זיכוי שנצברו:</span>
                <span className="font-bold text-sm sm:text-base">{currentDisplay.creditPointsTotal} נקודות</span>
              </div>
              <div className="bg-black/15 p-2.5 rounded-xl">
                <span className="text-emerald-200 block text-[11px]">שווי כספי של זיכויים:</span>
                <span className="font-bold text-sm sm:text-base">₪{currentDisplay.totalCreditsNIS.toLocaleString('he-IL')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spouse Credit Optimization Banner (סעיף 45 / 46) */}
      {result.spouseCreditOptimization && result.spouseCreditOptimization.applied && (
        <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl flex items-start gap-3 shadow-xs">
          <Sparkles className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-emerald-950 text-sm sm:text-base block">
                מיטוב זיכויים בין בני זוג בוצע בהצלחה! ({result.spouseCreditOptimization.creditType})
              </span>
              <span className="text-xs bg-emerald-200 text-emerald-900 font-bold px-2.5 py-0.5 rounded-full">
                חיסכון משפחתי מקסימלי
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-900 mt-1 leading-relaxed">
              {result.spouseCreditOptimization.explanation}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 bg-white border border-emerald-200 text-emerald-900 text-xs font-bold px-3 py-1 rounded-xl shadow-xs">
              <span>סך זיכוי עודף שנויד בין בני הזוג:</span>
              <span className="font-mono text-emerald-700 font-black">
                ₪{result.spouseCreditOptimization.transferredCreditAmount.toLocaleString('he-IL')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Multiple Employers Note if applicable */}
      {currentDisplay.employerCount && currentDisplay.employerCount > 1 && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center gap-3">
          <Building2 className="w-6 h-6 text-indigo-600 flex-shrink-0" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold text-indigo-950 block">
              שקלול {currentDisplay.employerCount} טפסי 106 בוצע בהצלחה:
            </span>
            <p className="text-indigo-800">
              המשכורות מכל המעסיקים חוברו לשכר שנתי כולל של ₪{currentDisplay.totalIncome.toLocaleString('he-IL')}, ומס הכנסה חושב על פי מדרגות שנתיות אמיתיות.
              {currentDisplay.missedTaxCoordinationDetected && (
                <strong className="text-amber-800 block mt-1">
                  זוהה שבאחד המעסיקים נוכה מס מירבי (47%) ללא תיאום מס! ההחזר הנומינלי כולל את מלוא המס העודף שנוכה.
                </strong>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Deductions banner (ניכויים שמקטינים הכנסה חייבת) */}
      {currentDisplay.deductionsTotalNIS && currentDisplay.deductionsTotalNIS > 0 && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <span className="font-bold text-emerald-950">
                ניכויים שהפחיתו את ההכנסה החייבת שלך במס:
              </span>
              <span className="text-emerald-800 block text-xs">
                סעיף 47 (שכר לא מבוטח לפנסיה) / השתלמות מקצועית
              </span>
            </div>
          </div>
          <div className="text-left font-mono font-bold text-emerald-900 text-base">
            -₪{currentDisplay.deductionsTotalNIS.toLocaleString('he-IL')} מההכנסה החייבת
          </div>
        </div>
      )}

      {/* Breakdown: Where did your money come from? */}
      {currentDisplay.keyRefundFactors.length > 0 && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>מאיפה מגיע הכסף? פירוט הגורמים להחזר המס שלך</span>
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            סעיפי החוק, שדות טופס 106 ונקודות הזיכוי שהפחיתו את חבות המס שלך:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentDisplay.keyRefundFactors.map((factor, idx) => {
              const IconComp = iconMap[factor.icon] || ShieldCheck;

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-indigo-300 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-sm sm:text-base">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span>{factor.title}</span>
                    </div>
                    {factor.amount > 0 && (
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                        +₪{factor.amount.toLocaleString('he-IL')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {factor.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Credit Points & Direct Tax Credits Breakdown (Full Transparency & Row-by-Row Summation) */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>פירוט מלא: נקודות זיכוי והטבות מס לשנת {currentDisplay.taxYear}</span>
            </h3>
            <span className="text-xs bg-indigo-50 text-indigo-800 font-bold px-3 py-1 rounded-full w-fit">
              ערך נקודת זיכוי שנתית: ₪{(currentDisplay.creditPointsValueNIS / (currentDisplay.creditPointsTotal || 1)).toFixed(0)}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            להלן פירוט שקוף ומלא של כל נקודות הזיכוי האישיות וכל זיכויי המס הישירים (תרומות לפי סעיף 46, זיכוי 45א לפנסיה, יישוב מזכה ועוד). כל סעיף מחושב ומסוכם במדויק.
          </p>
        </div>

        {/* Table 1: Personal Credit Points */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>חלק 1: נקודות זיכוי אישיות (סעיפים 33–40 לפקודה, שדה 022 בטופס 135)</span>
            </h4>
            <span className="text-xs font-semibold text-indigo-700">
              {currentDisplay.creditPointsTotal} נקודות = ₪{currentDisplay.creditPointsValueNIS.toLocaleString('he-IL')}
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold text-xs">
                <tr>
                  <th className="p-3">סעיף הזיכוי</th>
                  <th className="p-3">נימוק וזכאות בחוק</th>
                  <th className="p-3 text-center">נקודות</th>
                  <th className="p-3 text-left">שווי כספי שנתי</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentDisplay.creditPointsBreakdown.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-900">{item.label}</td>
                    <td className="p-3 text-slate-600">{item.reason}</td>
                    <td className="p-3 text-center font-mono font-bold text-indigo-700">{item.points}</td>
                    <td className="p-3 text-left font-mono font-semibold text-slate-900">
                      ₪{Math.round(item.points * (currentDisplay.creditPointsValueNIS / (currentDisplay.creditPointsTotal || 1))).toLocaleString('he-IL')}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50/90 font-bold text-slate-900 border-t border-slate-200 text-xs sm:text-sm">
                  <td className="p-3" colSpan={2}>סה״כ שווי נקודות זיכוי אישיות [שדה 022]:</td>
                  <td className="p-3 text-center font-mono text-indigo-700">{currentDisplay.creditPointsTotal} נקודות</td>
                  <td className="p-3 text-left font-mono text-indigo-900 font-black">
                    ₪{currentDisplay.creditPointsValueNIS.toLocaleString('he-IL')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Direct Tax Credits (Donations Section 46, Pension 45a, Settlement, Life Insurance) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>חלק 2: זיכויי מס ישירים (סעיף 45א פנסיה, סעיף 46 תרומות, סעיף 11 יישוב מזכה ועוד)</span>
            </h4>
            <span className="text-xs font-semibold text-emerald-700">
              סה״כ זיכויים ישירים: ₪{currentDisplay.directTaxCreditsTotalNIS.toLocaleString('he-IL')}
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold text-xs">
                <tr>
                  <th className="p-3">סעיף זיכוי במס</th>
                  <th className="p-3">סעיף חוק / שדה בטופס</th>
                  <th className="p-3 text-left">סכום בסיס מוכר</th>
                  <th className="p-3 text-center">שיעור הזיכוי</th>
                  <th className="p-3 text-left">סכום הזיכוי [₪]</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentDisplay.directTaxCreditsBreakdown && currentDisplay.directTaxCreditsBreakdown.length > 0 ? (
                  currentDisplay.directTaxCreditsBreakdown.map((credit, idx) => (
                    <tr key={credit.id || idx} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{credit.label}</div>
                        {credit.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{credit.description}</div>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-600 text-xs">{credit.sectionCode}</td>
                      <td className="p-3 text-left font-mono">₪{credit.baseAmount.toLocaleString('he-IL')}</td>
                      <td className="p-3 text-center font-mono font-bold text-indigo-700">{credit.ratePercent}%</td>
                      <td className="p-3 text-left font-mono font-bold text-emerald-800">
                        ₪{credit.creditNIS.toLocaleString('he-IL')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400 text-xs">
                      לא הוזנו זיכויי מס ישירים נוספים (תרומות 46, פנסיה 45א, יישוב מזכה וכו').
                    </td>
                  </tr>
                )}
                <tr className="bg-slate-50/90 font-bold text-slate-900 border-t border-slate-200 text-xs sm:text-sm">
                  <td className="p-3" colSpan={4}>סה״כ זיכויי מס ישירים בשקלים:</td>
                  <td className="p-3 text-left font-mono text-emerald-800 font-black">
                    ₪{currentDisplay.directTaxCreditsTotalNIS.toLocaleString('he-IL')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Reconciliation Card - Exact 100% Match Between Rows and Total */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <h4 className="font-bold text-sm sm:text-base text-white">
                  סיכום והתאמה מלאה של כלל הזיכויים (100% סנכרון שורות)
                </h4>
              </div>
              <p className="text-xs text-indigo-200 leading-relaxed max-w-xl">
                חיבור מדויק של שורות הפירוט לעיל: שווי נקודות הזיכוי האישיות (₪{currentDisplay.creditPointsValueNIS.toLocaleString('he-IL')}) יחד עם סך הזיכויים הישירים (₪{currentDisplay.directTaxCreditsTotalNIS.toLocaleString('he-IL')}) מסתכמים בדיוק של שקל לשקל לסך הזיכויים הכללי המקוזז מחבות המס שלך.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xs px-5 py-3 rounded-xl border border-white/15 flex flex-col items-end flex-shrink-0">
              <span className="text-[11px] text-indigo-200 font-medium">
                סה״כ כלל הזיכויים המופחתים מהמס:
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-300">
                ₪{currentDisplay.totalCreditsNIS.toLocaleString('he-IL')}
              </span>
              <span className="text-[10px] text-emerald-200 font-mono mt-0.5">
                (₪{currentDisplay.creditPointsValueNIS.toLocaleString('he-IL')} + ₪{currentDisplay.directTaxCreditsTotalNIS.toLocaleString('he-IL')})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progressive Tax Brackets Details */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          <span>חישוב מדרגות המס השנתיות (לפני זיכויים)</span>
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          הכנסתך החייבת (₪{currentDisplay.taxableIncome.toLocaleString('he-IL')}) חולקה למדרגות המס לפי החוק:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {currentDisplay.bracketsBreakdown.map((b, idx) => (
            <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span>מדרגה {idx + 1} ({b.ratePercent}%)</span>
                <span>מס: ₪{b.taxPaidInBracket.toLocaleString('he-IL')}</span>
              </div>
              <div className="text-sm font-bold text-slate-800">{b.bracketLabel}</div>
              <div className="text-xs text-slate-600 mt-1">
                סכום שחויב במדרגה: ₪{b.amountInBracket.toLocaleString('he-IL')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps: Filing Form 135 */}
      <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-emerald-50 rounded-2xl p-6 sm:p-8 border border-indigo-200">
        <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          <span>כיצד לקבל את הכסף ממס הכנסה? המדריך הפשוט</span>
        </h3>
        <p className="text-sm text-slate-700 mb-4">
          אין צורך לשלם עמלות של 20%-25% לחברות החזרי מס! שכיר יכול להגיש בעצמו ישירות לרשות המסים בקלות:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-2">
              1
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">איסוף המסמכים</h4>
            <p className="text-xs text-slate-600">
              טפסי 106 מכל המעסיקים (מעסיק 1, 2 וכו'), טופס 867 משוק ההון, קבלות תרומות (סעיף 46), ואישור ניהול חשבון בנק לקבלת ההחזר.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-2">
              2
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">הגשת טופס 135 מקוון</h4>
            <p className="text-xs text-slate-600">
              היכנס לאזור האישי באתר רשות המסים ומלא דוח מקוצר לשכיר (טופס 135), או הגש בסניף פקיד השומה הקרוב.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-2">
              3
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">הכסף נכנס לחשבון הבנק</h4>
            <p className="text-xs text-slate-600">
              הכסף מועבר ישירות לחשבון הבנק שלך תוך 30-90 ימים בתוספת 4% ריבית שנתית והצמדה למדד כחוק!
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onCheckAnotherYear}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>בדוק שנה נוספת (עד 6 שנים אחורה!)</span>
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-800 font-semibold px-5 py-2.5 rounded-xl border border-slate-300 transition-colors cursor-pointer"
          >
            <span>חזרה לעריכת פרטים</span>
          </button>
        </div>
      </div>
    </div>
  );
};
