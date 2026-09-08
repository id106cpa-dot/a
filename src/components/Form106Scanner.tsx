import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, Check, AlertCircle, Loader2, PlayCircle, Eye, RotateCcw } from 'lucide-react';
import { Employer106Record, TaxInputData, TaxYear } from '../types/tax';

interface Form106ScannerProps {
  onDataLoaded: (data: Partial<Employer106Record> & { taxYear?: TaxYear }) => void;
  currentYear: TaxYear;
  employerLabel?: string;
}

interface SamplePreset {
  name: string;
  badge: string;
  description: string;
  data: Partial<TaxInputData>;
}

const SAMPLE_PRESETS: SamplePreset[] = [
  {
    name: 'שכיר שהחליף עבודה ונולד לו ילד',
    badge: 'החזר גבוה נפוץ',
    description: 'עבד 9 חודשים, נוכה מס לפי שכר מלא, נולד ילד במהלך השנה',
    data: {
      taxYear: 2024,
      grossSalary: 185000,
      taxDeducted: 27400,
      employerName: 'אלפא תקשורת בע״מ',
      employeeName: 'ישראל ישראלי',
      employeePensionDeposit: 11100, // 6% pension deposit (שדה 045)
      employerPensionDeposit: 12025, // (שדה 036)
      hasChildren: true,
      children: [
        { id: '1', birthYear: 2024 }, // born in 2024
        { id: '2', birthYear: 2021 }, // age 3
      ],
      madeDonations: true,
      donationAmount: 1800,
    },
  },
  {
    name: 'שכיר שמשקיע בשוק ההון ותרם לעמותות',
    badge: 'שוק ההון סעיף 867',
    description: 'משכורת שנתית רגילה + הפסדים שלא קוזזו בשוק ההון ותרומות לפי סעיף 46',
    data: {
      taxYear: 2023,
      grossSalary: 165000,
      taxDeducted: 19800,
      employerName: 'טכנולוגיות דרום בע״מ',
      employeeName: 'רוני כהן',
      employeePensionDeposit: 9900,
      employerPensionDeposit: 10725,
      investedInCapitalMarket: true,
      capitalGains: 18000,
      capitalLosses: 14000,
      capitalTaxPaid: 4500,
      madeDonations: true,
      donationAmount: 2500,
    },
  },
  {
    name: 'אקדמאי וגר ביישוב מזכה (נהריה)',
    badge: 'הטבת פריפריה ותואר',
    description: 'בוגר תואר ראשון, גר בנהריה הזכאית ל-12% הנחת מס',
    data: {
      taxYear: 2024,
      grossSalary: 210000,
      taxDeducted: 34200,
      employerName: 'תעשיות צפון בע״מ',
      employeeName: 'דנה לוי',
      employeePensionDeposit: 12600,
      employerPensionDeposit: 13650,
      nonInsuredSalary: 24000, // שכר לא מבוטח
      hasAcademicDegree: true,
      degreeType: 'bachelor',
      graduationYear: 2023,
      livesInEligibleSettlement: true,
      settlementName: 'נהריה',
      monthsInSettlement: 12,
      madeSelfPensionDeposits: true,
      selfPensionAmount: 4000,
      selfLifeInsuranceAmount: 2100,
    },
  },
];

export const Form106Scanner: React.FC<Form106ScannerProps> = ({ 
  onDataLoaded, 
  currentYear,
  employerLabel = 'טופס 106'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastScannedResult, setLastScannedResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastFileRef = useRef<File | null>(null);

  // Helper to optimize large images before sending to AI OCR
  const prepareFileData = async (file: File): Promise<{ base64: string; mimeType: string }> => {
    // For non-images or files under 1.5MB, read directly
    if (!file.type.startsWith('image/') || file.size < 1.5 * 1024 * 1024) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ base64: reader.result as string, mimeType: file.type || 'image/jpeg' });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    // For large images, scale down to max 2048px on longest side to speed up OCR and prevent server timeout
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDimension = 2048;
          let width = img.width;
          let height = img.height;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.88);
            resolve({ base64: optimizedBase64, mimeType: 'image/jpeg' });
            return;
          }
          resolve({ base64: e.target?.result as string, mimeType: file.type });
        };
        img.onerror = () => {
          resolve({ base64: e.target?.result as string, mimeType: file.type });
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        resolve({ base64: '', mimeType: file.type });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    lastFileRef.current = file;
    setError(null);
    setStatusMessage(`מפענח את ${employerLabel} באמצעות מנוע AI (כולל שדות 045, 086, 036, 081)...`);
    setIsScanning(true);

    try {
      const { base64, mimeType } = await prepareFileData(file);
      if (!base64) {
        throw new Error('לא הצלחנו לקרוא את קובץ הטופס.');
      }

      const res = await fetch('/api/scan-106', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: mimeType || 'image/jpeg',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        let message = errData.error || errData.details || 'שגיאה בסריקת המסמך';
        if (typeof message === 'string' && (message.includes('503') || message.includes('high demand') || message.includes('UNAVAILABLE'))) {
          message = 'עומס רגעי בשרת ה-AI של גוגל. לחץ "נסה שוב" לסריקה מיידית.';
        }
        throw new Error(message);
      }

      const result = await res.json();
      if (result.success && result.data) {
        const d = result.data;
        const extracted: Partial<Employer106Record> & { taxYear?: TaxYear } = {
          grossSalary: Number(d.grossSalary) || 0,
          taxDeducted: Number(d.taxDeducted) || 0,
          employerName: d.employerName || '',
          insuredSalary: Number(d.insuredSalary) || 0,
          nonInsuredSalary: Number(d.nonInsuredSalary) || 0,
          employeePensionDeposit: Number(d.pensionEmployee) || 0,
          employerPensionDeposit: Number(d.pensionEmployer) || 0,
          section47Deduction: Number(d.section47Deduction) || 0,
          nationalInsuranceDeducted: Number(d.nationalInsuranceDeducted) || 0,
          creditPointsInPayslip: Number(d.creditPoints) || 0,
        };

        if (d.taxYear) {
          const yr = Number(d.taxYear);
          if (yr >= 2020 && yr <= 2026) {
            extracted.taxYear = yr as TaxYear;
          }
        }

        onDataLoaded(extracted);
        const notes = d.notes ? ` (${d.notes})` : '';
        setLastScannedResult(`חולצו בהצלחה: שכר ₪${(extracted.grossSalary || 0).toLocaleString('he-IL')}, מס שנוכה ₪${(extracted.taxDeducted || 0).toLocaleString('he-IL')}, שכר מבוטח ₪${(extracted.insuredSalary || 0).toLocaleString('he-IL')}, הפרשות עובד (שדה 045) ₪${(extracted.employeePensionDeposit || 0).toLocaleString('he-IL')}${notes}`);
        setStatusMessage(null);
      } else {
        throw new Error('לא זוהו שדות קריאים בטופס.');
      }
    } catch (apiErr: unknown) {
      let errMsg = apiErr instanceof Error ? apiErr.message : 'שגיאה בעיבוד המסמך';
      if (errMsg.startsWith('{') && errMsg.includes('503')) {
        errMsg = 'עומס רגעי בשרת ה-AI של גוגל. לחץ "נסה שוב" לסריקה מיידית.';
      }
      setError(errMsg);
      setStatusMessage(null);
    } finally {
      setIsScanning(false);
    }
  };

  const retryLastScan = () => {
    if (lastFileRef.current) {
      handleFileUpload(lastFileRef.current);
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const loadPreset = (preset: SamplePreset) => {
    onDataLoaded({
      grossSalary: preset.data.grossSalary,
      taxDeducted: preset.data.taxDeducted,
      workMonths: preset.data.workMonths,
      employerName: preset.data.employerName,
      employeePensionDeposit: preset.data.employeePensionDeposit,
      employerPensionDeposit: preset.data.employerPensionDeposit,
      nonInsuredSalary: preset.data.nonInsuredSalary,
      taxYear: currentYear || preset.data.taxYear,
    });
    setLastScannedResult(`הוטענו נתוני דוגמה: ${preset.name}`);
    setError(null);
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>סריקה אוטומטית ({employerLabel})</span>
            <span className="bg-indigo-100 text-indigo-800 text-[11px] font-semibold px-2 py-0.5 rounded-full">
              כולל שדות 045, 086, 036, 081
            </span>
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            העלה קובץ צילום/PDF או בחר דוגמה לבדיקה מהירה
          </p>
        </div>

        {/* Demo buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-500 font-medium">דוגמאות מוכנות:</span>
          {SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadPreset(preset)}
              className="text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-medium px-2 py-1 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              title={preset.description}
            >
              <PlayCircle className="w-3 h-3 text-indigo-500" />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Drag and drop upload box */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
            : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        {isScanning ? (
          <div className="flex flex-col items-center justify-center py-3">
            <Loader2 className="w-7 h-7 text-indigo-600 animate-spin mb-2" />
            <p className="text-sm font-semibold text-indigo-900">{statusMessage}</p>
            <p className="text-xs text-slate-500 mt-1">מפענח שדות 158, 042, 010, 045, 086, 036, 081...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-1">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-2 shadow-inner">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800">
              גרור לכאן את {employerLabel} או <span className="text-indigo-600 underline underline-offset-2">לחץ לבחירת קובץ</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">סורק אוטומטית שכר, ניכויי מס והפרשות פנסיה לקצבה</p>
          </div>
        )}
      </div>

      {/* Scanned result notification */}
      {lastScannedResult && !error && (
        <div className="mt-2.5 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{lastScannedResult}</span>
          </div>
          <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">מעודכן בתאים</span>
        </div>
      )}

      {/* Error alert with retry button */}
      {error && (
        <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-start sm:items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              retryLastScan();
            }}
            className="self-end sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-xs transition-colors cursor-pointer text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>נסה שוב</span>
          </button>
        </div>
      )}
    </div>
  );
};
