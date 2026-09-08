import { TaxInputData, CalculationResult, Employer106Record, UnifiedCreditRow } from '../types/tax';
import { TAX_CONFIGS, ELIGIBLE_SETTLEMENTS } from '../data/taxRates';

/**
 * Calculates tax refund for an employee, supporting multiple Form 106s,
 * taxable National Insurance Institute benefits, deductions, statutory credits,
 * and married couple credit optimization (Section 45 and 46 transferability).
 */
export function calculateTaxRefund(
  input: TaxInputData,
  isRecursiveSpouseCall: boolean = false
): CalculationResult {
  const config = TAX_CONFIGS[input.taxYear] || TAX_CONFIGS[2024];

  // 1. Aggregate income and taxes from all employers (טפסי 106 מרובים)
  let totalGrossEmploymentIncome = 0;
  let totalTaxDeductedEmployment = 0;
  let totalEmployeePensionDeposits = 0; // שדות 045 / 086
  let totalEmployerPensionDeposits = 0; // שדות 036 / 081
  let totalNonInsuredSalary = 0; // שכר לא מבוטח
  let totalSection47InPayslip = 0; // שדה 047

  const employerList: Employer106Record[] = (input.employers && input.employers.length > 0)
    ? input.employers
    : [{
        id: 'primary',
        employerName: input.employerName || 'מעסיק עיקרי',
        grossSalary: input.grossSalary || 0,
        taxDeducted: input.taxDeducted || 0,
        workMonths: input.workMonths || 12,
        employeePensionDeposit: input.employeePensionDeposit || 0,
        employerPensionDeposit: input.employerPensionDeposit || 0,
        insuredSalary: input.insuredSalary || 0,
        nonInsuredSalary: input.nonInsuredSalary || 0,
      }];

  const employerCount = employerList.length;

  for (const emp of employerList) {
    totalGrossEmploymentIncome += Math.max(0, emp.grossSalary || 0);
    totalTaxDeductedEmployment += Math.max(0, emp.taxDeducted || 0);
    totalEmployeePensionDeposits += Math.max(0, emp.employeePensionDeposit || 0);
    totalEmployerPensionDeposits += Math.max(0, emp.employerPensionDeposit || 0);
    totalNonInsuredSalary += Math.max(0, emp.nonInsuredSalary || 0);
    totalSection47InPayslip += Math.max(0, emp.section47Deduction || 0);
  }

  // Detect missed tax coordination if multiple employers and secondary deducted >=35%
  let missedTaxCoordinationDetected = false;
  if (employerCount > 1) {
    for (let i = 1; i < employerList.length; i++) {
      const secondary = employerList[i];
      if (secondary.grossSalary > 0 && (secondary.taxDeducted / secondary.grossSalary) >= 0.35) {
        missedTaxCoordinationDetected = true;
        break;
      }
    }
  }

  // Taxable National Insurance Payments (אבטלה, מילואים, דמי לידה, דמי פגיעה וכו')
  const unemployment = Math.max(0, input.unemploymentBenefits || 0);
  const reserveDuty = Math.max(0, input.reserveDutyBenefits || 0);
  const maternity = Math.max(0, input.maternityBenefits || 0);
  const workInjury = Math.max(0, input.workInjuryBenefits || 0);
  const otherBL = Math.max(0, input.otherTaxableBituachLeumiBenefits || 0);
  const totalBituachLeumiIncome = unemployment + reserveDuty + maternity + workInjury + otherBL;

  const totalIncome = totalGrossEmploymentIncome + totalBituachLeumiIncome;

  // 2. Deductions (ניכויים המפחיתים את ההכנסה החייבת לפני חישוב מדרגות המס)
  let deductionsTotalNIS = 0;

  // הוצאות השתלמות מקצועית לשכיר לשמירה על הקיים (מופרד לחלוטין לפי פקודת מס הכנסה והלכת הידור)
  const studyExpenses = input.hasProfessionalStudiesExpenses ? Math.max(0, input.professionalStudiesExpenses || 0) : 0;
  deductionsTotalNIS += studyExpenses;

  // ניכוי סעיף 47: הפקדות לקופת גמל עבור שכר שאינו מבוטח (עד 11% מהשכר הלא מבוטח)
  let section47Deduction = totalSection47InPayslip;
  if (input.madeSelfPensionDeposits && input.selfPensionAmount > 0) {
    const nonInsuredBase = totalNonInsuredSalary > 0
      ? totalNonInsuredSalary
      : Math.max(0, totalIncome - (input.insuredSalary || 0));
    const maxDeductiblePension = Math.min(input.selfPensionAmount * 0.6, Math.max(0, nonInsuredBase * 0.11));
    section47Deduction += Math.round(maxDeductiblePension);
  }
  deductionsTotalNIS += section47Deduction;

  // Taxable income after deductions
  const taxableIncome = Math.max(0, totalIncome - deductionsTotalNIS);

  // 3. Tax brackets computation on taxableIncome
  let remainingTaxable = taxableIncome;
  let baseTaxBeforeCredits = 0;
  const bracketsBreakdown: CalculationResult['bracketsBreakdown'] = [];

  let previousLimit = 0;
  for (const bracket of config.brackets) {
    if (remainingTaxable <= 0) break;

    const bracketSpan = bracket.limit === Infinity ? remainingTaxable : bracket.limit - previousLimit;
    const taxableInThisBracket = Math.min(remainingTaxable, bracketSpan);
    const taxInThisBracket = taxableInThisBracket * bracket.rate;

    baseTaxBeforeCredits += taxInThisBracket;
    remainingTaxable -= taxableInThisBracket;

    const ratePercent = Math.round(bracket.rate * 100);
    const bracketLabel = bracket.limit === Infinity
      ? `מעל ₪${previousLimit.toLocaleString('he-IL')} (${ratePercent}%)`
      : `₪${previousLimit.toLocaleString('he-IL')} - ₪${bracket.limit.toLocaleString('he-IL')} (${ratePercent}%)`;

    bracketsBreakdown.push({
      bracketLabel,
      ratePercent,
      amountInBracket: Math.round(taxableInThisBracket),
      taxPaidInBracket: Math.round(taxInThisBracket),
    });

    previousLimit = bracket.limit;
  }

  // Surtax (מס יסף 3% מעל התקרה)
  let surtaxAmount = 0;
  if (taxableIncome > config.surtaxThreshold) {
    surtaxAmount = (taxableIncome - config.surtaxThreshold) * config.surtaxRate;
  }

  const initialTax = baseTaxBeforeCredits + surtaxAmount;

  // 4. Credit points compilation
  const creditPointsBreakdown: CalculationResult['creditPointsBreakdown'] = [];
  let creditPointsTotal = 0;

  // Basic Israeli resident
  if (input.isIsraeliResident) {
    creditPointsTotal += 2.25;
    creditPointsBreakdown.push({
      label: 'תושב/ת ישראל (בסיסי)',
      points: 2.25,
      reason: '2.25 נקודות זיכוי בסיסיות לכל תושב ישראל',
    });
  }

  // Female credit
  if (input.gender === 'female') {
    creditPointsTotal += 0.5;
    creditPointsBreakdown.push({
      label: 'אישה עובדת',
      points: 0.5,
      reason: 'חצי נקודת זיכוי נוספת לאישה',
    });
  }

  // Children points
  if (input.hasChildren && input.children && input.children.length > 0) {
    let childrenPoints = 0;
    for (const child of input.children) {
      const age = input.taxYear - child.birthYear;
      if (age >= 0 && age <= 18) {
        if (age === 0) {
          childrenPoints += input.taxYear >= 2024 ? 2.5 : 1.5;
        } else if (age >= 1 && age <= 2) {
          childrenPoints += input.taxYear >= 2024 ? 3.5 : 2.5;
        } else if (age === 3) {
          childrenPoints += input.taxYear >= 2024 ? 3.5 : 2.5;
        } else if (age >= 4 && age <= 5) {
          childrenPoints += input.taxYear >= 2024 ? 2.5 : 2.5;
        } else if (age >= 6 && age <= 17) {
          childrenPoints += input.taxYear >= 2024 ? 1.0 : 1.0;
        } else if (age === 18) {
          childrenPoints += 0.5;
        }
      }
    }
    if (childrenPoints > 0) {
      creditPointsTotal += childrenPoints;
      creditPointsBreakdown.push({
        label: `ילדים (${input.children.length} ילדים)`,
        points: Number(childrenPoints.toFixed(1)),
        reason: 'הטבות הורים עובדים, פעוטות וילדים בגילי 0-18',
      });
    }
  }

  // Single Parent
  if (input.isSingleParent) {
    creditPointsTotal += 1.0;
    creditPointsBreakdown.push({
      label: 'הורה יחידני / חד-הורי',
      points: 1.0,
      reason: 'נקודת זיכוי נוספת להורה יחיד המגדל ילדים',
    });
  }

  // Dependent Spouse (סעיף 37 - בן זוג ללא הכנסה)
  if (input.hasDependentSpouse || (input.maritalStatus === 'married' && !input.includeSpouseCalculation && input.grossSalary > 0 && input.spouseData?.grossSalary === 0)) {
    creditPointsTotal += 1.0;
    creditPointsBreakdown.push({
      label: 'בן/בת זוג ללא הכנסה (סעיף 37)',
      points: 1.0,
      reason: 'נקודת זיכוי שנתית בגין בן זוג שאינו עובד או שהגיע לגיל פרישה/נכות',
    });
  }

  // Alimony (מזונות לבן זוג לשעבר סעיף 40)
  if (input.paysAlimony) {
    creditPointsTotal += 1.0;
    creditPointsBreakdown.push({
      label: 'תשלום מזונות לבן זוג לשעבר (סעיף 40)',
      points: 1.0,
      reason: 'נקודת זיכוי למשלם מזונות לבן זוג לשעבר שהתגרש ממנו',
    });
  }

  // Special Needs Dependent (ילד / קרוב נטול יכולת סעיף 45)
  if (input.hasSpecialNeedsDependent) {
    creditPointsTotal += 2.0;
    creditPointsBreakdown.push({
      label: 'ילד או קרוב נטול יכולת (סעיף 45)',
      points: 2.0,
      reason: '2 נקודות זיכוי שוות ערך לכ-₪5,800 בשנה עבור תלוי עם מוגבלות',
    });
  }

  // Academic Degree (סעיף 40ד)
  if (input.hasAcademicDegree && input.graduationYear) {
    const yearsSinceGrad = input.taxYear - input.graduationYear;
    if (yearsSinceGrad >= 1 && yearsSinceGrad <= 3) {
      let degreePoints = 1.0;
      if (input.degreeType === 'master') degreePoints = 0.5;
      creditPointsTotal += degreePoints;
      creditPointsBreakdown.push({
        label: `סיום תואר אקדמי / מקצוע (${input.degreeType || 'תואר ראשון'})`,
        points: degreePoints,
        reason: 'נקודות זיכוי למסיימי תואר ב-3 השנים שלאחר סיום הלימודים (סעיף 40ד)',
      });
    }
  }

  // Discharged Soldier (סעיף 39א)
  if (input.isDischargedSoldier && input.dischargeYear) {
    const yearsSinceDischarge = input.taxYear - input.dischargeYear;
    if (yearsSinceDischarge >= 0 && yearsSinceDischarge <= 3) {
      const points = input.serviceType === 'combat' ? 2.0 : 1.0;
      creditPointsTotal += points;
      creditPointsBreakdown.push({
        label: `חייל/ת משוחרר/ת (${input.serviceType === 'combat' ? 'לוחם' : 'רגיל'})`,
        points,
        reason: 'נקודות זיכוי למשתחררים מצה״ל או שירות לאומי ב-36 החודשים הראשונים',
      });
    }
  }

  // New Immigrant / Returning Resident (סעיף 35)
  if (input.isNewImmigrant && input.immigrationYear) {
    const yearsSinceAliya = input.taxYear - input.immigrationYear;
    let aliyaPoints = 0;
    if (yearsSinceAliya >= 0 && yearsSinceAliya <= 1) {
      aliyaPoints = 3.0;
    } else if (yearsSinceAliya === 2) {
      aliyaPoints = 2.0;
    } else if (yearsSinceAliya === 3) {
      aliyaPoints = 1.0;
    }

    if (aliyaPoints > 0) {
      creditPointsTotal += aliyaPoints;
      creditPointsBreakdown.push({
        label: 'עולה חדש / תושב חוזר ותיק (סעיף 35)',
        points: aliyaPoints,
        reason: 'נקודות זיכוי מוגדלות ל-42 חודשים מיום העלייה לישראל',
      });
    }
  }

  // Monetary value of credit points
  const creditPointsValueNIS = Math.round(creditPointsTotal * config.creditPointAnnualValue);

  // 5. Direct Tax Credits Breakdown (זיכויי מס ישירים בשקלים)
  const directTaxCreditsBreakdown: CalculationResult['directTaxCreditsBreakdown'] = [];

  // 5a. Eligible settlement credit (סעיף 11)
  let settlementCreditNIS = 0;
  if (input.livesInEligibleSettlement && input.settlementName) {
    const settlement = ELIGIBLE_SETTLEMENTS.find(s => s.name === input.settlementName);
    if (settlement) {
      const eligibleIncome = Math.min(taxableIncome, settlement.ceiling);
      settlementCreditNIS = Math.round(eligibleIncome * settlement.rate);
      if (settlementCreditNIS > 0) {
        directTaxCreditsBreakdown.push({
          id: 'settlement-11',
          label: `הנחת תושב יישוב מזכה (${input.settlementName})`,
          sectionCode: 'סעיף 11 (שדות 131/132)',
          baseAmount: eligibleIncome,
          ratePercent: Math.round(settlement.rate * 100),
          creditNIS: settlementCreditNIS,
          description: `הנחת מס בשיעור ${Math.round(settlement.rate * 100)}% מההכנסה החייבת עד לתקרת ₪${settlement.ceiling.toLocaleString('he-IL')}`,
        });
      }
    }
  }

  // 5b. Section 46 Donations credit (35% from donations above minimum)
  let donationCreditNIS = 0;
  if (input.madeDonations && input.donationAmount > config.minDonationThreshold) {
    const maxAllowedDonation = taxableIncome * config.maxDonationPercentage;
    const recognizedDonation = Math.min(input.donationAmount, maxAllowedDonation);
    donationCreditNIS = Math.round(recognizedDonation * 0.35);
    if (donationCreditNIS > 0) {
      directTaxCreditsBreakdown.push({
        id: 'donations-46',
        label: 'זיכוי בגין תרומות למוסדות ציבוריים מוכרים',
        sectionCode: 'סעיף 46 (שדה 037)',
        baseAmount: recognizedDonation,
        ratePercent: 35,
        creditNIS: donationCreditNIS,
        description: `זיכוי ישיר בשיעור 35% מסכום תרומות מוכר בסך ₪${recognizedDonation.toLocaleString('he-IL')} (מתוך ₪${input.donationAmount.toLocaleString('he-IL')} שנתרמו)`,
      });
    }
  }

  // 5c. Pension & Life Insurance credit (סעיף 45א - זיכוי 35% על שדות 045/086 בכפוף לתקרות החוק ו-25% על ביטוח חיים)
  let empPensionCredit = 0;
  if (totalEmployeePensionDeposits > 0) {
    // לפי סעיף 45א(ב)(1): תקרת הפקדת עובד מוכרת היא עד 7% מהשכר המבוטח/ההכנסה, ולא יותר מ-7% מתקרת ההכנסה המזכה לשכיר
    const salaryLimit7Percent = Math.round(totalGrossEmploymentIncome * 0.07);
    const annualStatutoryCeiling = config.maxEmployeePensionAnnualDeposit; // e.g. 8,148 ₪ ב-2024-2026
    const recognizedEmpPension = Math.min(
      totalEmployeePensionDeposits,
      salaryLimit7Percent > 0 ? salaryLimit7Percent : annualStatutoryCeiling,
      annualStatutoryCeiling
    );
    empPensionCredit = Math.round(recognizedEmpPension * 0.35);

    directTaxCreditsBreakdown.push({
      id: 'pension-employee-45a',
      label: 'זיכוי 45א - הפרשות עובד לקופת גמל לקצבה (שדה 045 בטופס 106)',
      sectionCode: 'סעיף 45א(ב)',
      baseAmount: recognizedEmpPension,
      ratePercent: 35,
      creditNIS: empPensionCredit,
      description: `זיכוי מס בשיעור 35% מהפקדת עובד מוכרת כחוק (מוגבלת ל-7% משכר ועד תקרת הפקדה שנתית של ₪${annualStatutoryCeiling.toLocaleString('he-IL')}, תקרה שנתית לזיכוי ₪${config.maxEmployeePensionAnnualCredit.toFixed(0)}). סך הפקדת העובד בטופס 106: ₪${totalEmployeePensionDeposits.toLocaleString('he-IL')}.`,
    });
  }

  let selfPensionCredit = 0;
  if (input.madeSelfPensionDeposits && input.selfPensionAmount > 0) {
    // הפקדה עצמאית לשכיר על שכר לא מבוטח / כעמית מוטב (זיכוי 35% עד 5% משכר לא מבוטח ותקרה)
    const nonInsuredBase = totalNonInsuredSalary > 0
      ? totalNonInsuredSalary
      : Math.max(0, totalIncome - (input.insuredSalary || 0));
    const maxSelf5Percent = nonInsuredBase > 0
      ? Math.round(nonInsuredBase * 0.05)
      : config.maxSelfPensionQualifyingDeposit;
    const selfCeiling = config.maxSelfPensionQualifyingDeposit;
    const recognizedSelfPension = Math.min(
      input.selfPensionAmount,
      maxSelf5Percent,
      selfCeiling
    );
    selfPensionCredit = Math.round(recognizedSelfPension * 0.35);

    if (selfPensionCredit > 0) {
      directTaxCreditsBreakdown.push({
        id: 'pension-self-45',
        label: 'זיכוי 45א - הפקדות עצמאיות לקופת גמל לקצבה (שכר לא מבוטח)',
        sectionCode: 'סעיף 45א',
        baseAmount: recognizedSelfPension,
        ratePercent: 35,
        creditNIS: selfPensionCredit,
        description: `זיכוי בשיעור 35% מהפקדה עצמאית מוכרת (עד 5% משכר לא מבוטח ועד תקרה של ₪${selfCeiling.toLocaleString('he-IL')}). סך הפקדה עצמאית: ₪${input.selfPensionAmount.toLocaleString('he-IL')}.`,
      });
    }
  }

  let lifeInsuranceCredit = 0;
  if (input.selfLifeInsuranceAmount && input.selfLifeInsuranceAmount > 0) {
    // זיכוי סעיף 45א לביטוח חיים ומשכנתא: 25% מדמי הביטוח, מוגבל ל-5% מהכנסה ותקרה
    const maxLifeRecognized = Math.min(
      input.selfLifeInsuranceAmount,
      Math.round(totalIncome * 0.05),
      config.maxSelfPensionQualifyingDeposit
    );
    lifeInsuranceCredit = Math.round(maxLifeRecognized * 0.25);
    if (lifeInsuranceCredit > 0) {
      directTaxCreditsBreakdown.push({
        id: 'life-insurance-45',
        label: 'זיכוי 45א על ביטוח חיים ומשכנתא',
        sectionCode: 'סעיף 45א (שדה 268)',
        baseAmount: maxLifeRecognized,
        ratePercent: 25,
        creditNIS: lifeInsuranceCredit,
        description: `זיכוי ישיר של 25% מפרמיות ביטוח חיים/משכנתא (עד 5% מההכנסה, מתוך ₪${input.selfLifeInsuranceAmount.toLocaleString('he-IL')} ששולמו).`,
      });
    }
  }

  const pensionLifeCreditNIS = empPensionCredit + selfPensionCredit + lifeInsuranceCredit;

  // 5d. Nursing institution expense credit (סעיף 44 - 35% זיכוי כספי מופרד לחלוטין)
  let nursingInstitutionCreditNIS = 0;
  if (input.hasInstitutionalNursingExpenses && input.institutionalNursingExpenses > 0) {
    nursingInstitutionCreditNIS = Math.round(input.institutionalNursingExpenses * 0.35);
    directTaxCreditsBreakdown.push({
      id: 'nursing-44',
      label: 'זיכוי החזקת קרוב במוסד סיעודי',
      sectionCode: 'סעיף 44 (שדה 050)',
      baseAmount: input.institutionalNursingExpenses,
      ratePercent: 35,
      creditNIS: nursingInstitutionCreditNIS,
      description: 'זיכוי מס ישיר בשיעור 35% מתשלומי החזקת הורה או קרוב במוסד סיעודי',
    });
  }

  // 5e. Capital market calculations & loss offsets (סעיף 867)
  let capitalTaxLiability = 0;
  let capitalLossOffsetCreditNIS = 0;
  if (input.investedInCapitalMarket) {
    const realGains = Math.max(0, input.capitalGains || 0);
    const losses = Math.max(0, input.capitalLosses || 0);

    const offsetAmount = Math.min(realGains, losses);
    capitalLossOffsetCreditNIS = Math.round(offsetAmount * 0.25);

    const netCapitalGains = Math.max(0, realGains - losses);
    capitalTaxLiability = Math.round(netCapitalGains * 0.25);

    if (capitalLossOffsetCreditNIS > 0) {
      directTaxCreditsBreakdown.push({
        id: 'capital-loss-offset',
        label: 'קיזוז הפסדי הון ומס עודף (שוק ההון)',
        sectionCode: 'סעיף 92 (טופס 867)',
        baseAmount: offsetAmount,
        ratePercent: 25,
        creditNIS: capitalLossOffsetCreditNIS,
        description: 'קיזוז הפסדי הון כנגד רווחים ומס שנוכה במקור בבנק',
      });
    }
  }

  // Direct Tax Credits Total (sum of all direct credits)
  const directTaxCreditsTotalNIS = directTaxCreditsBreakdown.reduce((sum, item) => sum + item.creditNIS, 0);

  // 10. Total Credits & Final Liability
  const totalGeneralCredits = creditPointsValueNIS + directTaxCreditsTotalNIS;

  // Employment tax after credits (cannot be negative)
  const taxAfterCredits = Math.max(0, initialTax - totalGeneralCredits);

  // Unused credit points can offset capital gains tax
  const unusedGeneralCredits = Math.max(0, totalGeneralCredits - initialTax);
  const finalCapitalTax = Math.max(0, capitalTaxLiability - unusedGeneralCredits);

  let taxLiabilityFinal = Math.round(taxAfterCredits + finalCapitalTax);

  // 11. Total tax paid in advance (שכר + ביטוח לאומי שנוכה במקור + מס בנקאי)
  const bituachLeumiTaxDeducted = Math.max(0, input.bituachLeumiTaxDeducted || 0);
  const capitalTaxPaid = input.investedInCapitalMarket ? Math.max(0, input.capitalTaxPaid || 0) : 0;
  const taxAlreadyPaid = Math.round(totalTaxDeductedEmployment + bituachLeumiTaxDeducted + capitalTaxPaid);

  // 12. Net difference & STRICT SEPARATION: Nominal vs Interest/Linkage
  let netDifference = Math.round(taxAlreadyPaid - taxLiabilityFinal);

  // Nominal Refund (החזר קרן המס בלבד)
  let nominalRefund = netDifference > 0 ? netDifference : 0;

  // Statutory Interest & Indexation (4% שנתי + הצמדה למדד כחוק פטור ממס לפי סעיף 160)
  const yearsPassed = Math.max(0.5, 2026 - input.taxYear);
  const interestFactor = Math.pow(1 + 0.04, yearsPassed) - 1;
  let interestAndLinkageBenefit = netDifference > 0 ? Math.round(nominalRefund * interestFactor) : 0;
  let finalRefundWithInterest = netDifference > 0 ? nominalRefund + interestAndLinkageBenefit : netDifference;

  // 13. Compile key factors / narrative insights
  const keyRefundFactors: CalculationResult['keyRefundFactors'] = [];

  if (employerCount > 1) {
    keyRefundFactors.push({
      title: `עבודה אצל ${employerCount} מעסיקים במקביל / במעבר`,
      amount: missedTaxCoordinationDetected ? Math.round(totalTaxDeductedEmployment * 0.25) : 0,
      description: missedTaxCoordinationDetected
        ? 'זוהה ניכוי מס מקסימלי במעסיק משני ללא תיאום מס! מגיע לך החזר כספי ענק על כל המס העודף שנוכה.'
        : `סוכמו ${employerCount} טפסי 106. החישוב השנתי המאוחד מאזן את מדרגות המס ונקודות הזיכוי.`,
      icon: 'CalendarClock',
    });
  }

  if (totalBituachLeumiIncome > 0) {
    keyRefundFactors.push({
      title: 'תגמולים חייבים במס מביטוח לאומי (אבטלה / מילואים / דמי לידה)',
      amount: bituachLeumiTaxDeducted,
      description: `הוכנסו תגמולי ביטוח לאומי בסך ₪${totalBituachLeumiIncome.toLocaleString('he-IL')}. המס שנוכה במקור (₪${bituachLeumiTaxDeducted.toLocaleString('he-IL')}) נכלל במלואו בחישוב ההחזר!`,
      icon: 'CalendarClock',
    });
  }

  if (input.hasChildren && input.children.length > 0) {
    keyRefundFactors.push({
      title: 'הטבות הורים עובדים ופעוטות',
      amount: Math.round(input.children.length * config.creditPointAnnualValue * 1.5),
      description: `זכאות לנקודות זיכוי מוגדלות עבור ${input.children.length} ילדים בשווי של כ-₪${config.creditPointAnnualValue.toLocaleString('he-IL')} לנקודה.`,
      icon: 'Baby',
    });
  }

  if (input.hasDependentSpouse) {
    keyRefundFactors.push({
      title: 'זיכוי בגין בן/בת זוג ללא הכנסה (סעיף 37)',
      amount: Math.round(config.creditPointAnnualValue),
      description: 'נקודת זיכוי נוספת בשווי כ-₪2,900 עבור בן זוג שאינו עובד.',
      icon: 'HeartHandshake',
    });
  }

  if (deductionsTotalNIS > 0) {
    keyRefundFactors.push({
      title: 'ניכויים שהפחיתו את ההכנסה החייבת',
      amount: deductionsTotalNIS,
      description: `הפחתה של ₪${deductionsTotalNIS.toLocaleString('he-IL')} מההכנסה החייבת בגין שכר לא מבוטח (סעיף 47) / השתלמות מקצועית לשמירה על הקיים.`,
      icon: 'ShieldCheck',
    });
  }

  if (donationCreditNIS > 0) {
    keyRefundFactors.push({
      title: 'החזר 35% מתרומות (סעיף 46)',
      amount: donationCreditNIS,
      description: `תרמת ₪${input.donationAmount.toLocaleString('he-IL')} לעמותות מוכרות, ומגיע לך החזר כספי ישיר של 35% מהסכום!`,
      icon: 'HeartHandshake',
    });
  }

  if (settlementCreditNIS > 0) {
    keyRefundFactors.push({
      title: `הנחת תושב יישוב מזכה (${input.settlementName})`,
      amount: settlementCreditNIS,
      description: `הנחה מיוחדת בשיעור מההכנסה החייבת לתושבי ${input.settlementName} לפי סעיף 11 לפקודה.`,
      icon: 'MapPin',
    });
  }

  if (capitalLossOffsetCreditNIS > 0 || (input.investedInCapitalMarket && capitalTaxPaid > finalCapitalTax)) {
    const capitalSavings = capitalLossOffsetCreditNIS + (capitalTaxPaid - finalCapitalTax);
    keyRefundFactors.push({
      title: 'קיזוז הפסדים והחזר מס משוק ההון (טופס 867)',
      amount: Math.max(0, capitalSavings),
      description: 'קיזוז הפסדי הון שלא קוזזו בבנק או ניצול נקודות זיכוי עודפות כנגד מס ששולם על רווחי הון.',
      icon: 'TrendingUp',
    });
  }

  if (pensionLifeCreditNIS > 0) {
    keyRefundFactors.push({
      title: 'זיכוי על ביטוח חיים / משכנתא ופנסיה (סעיף 45)',
      amount: pensionLifeCreditNIS,
      description: 'זיכוי של 35% על הפרשות עובד לקצבה (שדות 045/086) ו-25% על ביטוח חיים ומשכנתא.',
      icon: 'ShieldCheck',
    });
  }

  if (nursingInstitutionCreditNIS > 0) {
    keyRefundFactors.push({
      title: 'זיכוי על החזקת קרוב במוסד סיעודי (סעיף 44)',
      amount: nursingInstitutionCreditNIS,
      description: 'זיכוי מס ישיר של 35% מתשלומי החזקת הורה או קרוב במוסד סיעודי / בית אבות.',
      icon: 'ShieldCheck',
    });
  }

  if (input.hasAcademicDegree) {
    keyRefundFactors.push({
      title: 'הטבת מס לבוגר תואר אקדמי / מקצוע',
      amount: Math.round(config.creditPointAnnualValue),
      description: 'נקודת זיכוי שנתית לפי סעיף 40ד המפחיתה את חבות המס.',
      icon: 'GraduationCap',
    });
  }

  if (input.isDischargedSoldier) {
    keyRefundFactors.push({
      title: 'הטבת חייל/ת משוחרר/ת',
      amount: Math.round(config.creditPointAnnualValue * (input.serviceType === 'combat' ? 2 : 1)),
      description: 'נקודות זיכוי מוגדלות ללוחמים ותומכי לחימה ב-36 החודשים שלאחר השחרור.',
      icon: 'Award',
    });
  }

  if (input.isNewImmigrant) {
    keyRefundFactors.push({
      title: 'הטבת עולה חדש / תושב חוזר (סעיף 35)',
      amount: Math.round(config.creditPointAnnualValue * 2),
      description: 'נקודות זיכוי מוגדלות המגיעות לעולים חדשים ותושבים חוזרים ותיקים.',
      icon: 'Award',
    });
  }

  // Recommendations
  const recommendations: string[] = [
    `ניתן להגיש בקשה להחזר מס לשנת ${input.taxYear} באמצעות טופס 135 (דוח מקוצר לשכירים).`,
    'מדינת ישראל מעניקה ריבית והצמדה של 4% שנתי ללא מס על כל סכום ההחזר החל מתום שנת המס!',
    'הזכות לדרוש החזר מס נשמרת עד 6 שנים אחורה בלבד – שנת 2020 תתיישן בקרוב!',
  ];

  if (employerCount > 1 && missedTaxCoordinationDetected) {
    recommendations.push('מומלץ לצרף את כל טפסי ה-106 של כל המעסיקים באותה שנה לקבלת ההחזר במלואו.');
  }

  // 13b. Construct Unified Continuous Credits List (רשימה רציפה אחידה שורה אחר שורה - שומת מס הכנסה)
  const unifiedCreditsList: UnifiedCreditRow[] = [];
  const pointAnnualVal = config.creditPointAnnualValue;

  // 1. Personal Credit Points (סעיפים 33–40 לפקודה, שדות 022–028)
  creditPointsBreakdown.forEach((item, index) => {
    const itemNIS = Math.round(item.points * pointAnnualVal);
    let sectionCode = 'סעיף 33–40';
    let formFieldCode = '022';

    if (item.label.includes('תושב')) {
      sectionCode = 'סעיף 33';
      formFieldCode = '022';
    } else if (item.label.includes('אישה')) {
      sectionCode = 'סעיף 36א';
      formFieldCode = '022';
    } else if (item.label.includes('ילד') || item.label.includes('פעוט') || item.label.includes('הורים')) {
      sectionCode = 'סעיף 40';
      formFieldCode = '022';
    } else if (item.label.includes('יחיד') || item.label.includes('חד-הורי')) {
      sectionCode = 'סעיף 40(ב)(1)';
      formFieldCode = '024';
    } else if (item.label.includes('מזונות')) {
      sectionCode = 'סעיף 40א / 40(ב)(2)';
      formFieldCode = '025';
    } else if (item.label.includes('ללא הכנסה')) {
      sectionCode = 'סעיף 37';
      formFieldCode = '023';
    } else if (item.label.includes('תואר') || item.label.includes('אקדמי') || item.label.includes('מקצוע')) {
      sectionCode = 'סעיף 40ד';
      formFieldCode = '026';
    } else if (item.label.includes('חייל') || item.label.includes('שירות לאומי')) {
      sectionCode = 'סעיף 39א';
      formFieldCode = '027';
    } else if (item.label.includes('עולה')) {
      sectionCode = 'סעיף 35';
      formFieldCode = '028';
    } else if (item.label.includes('נטול יכולת')) {
      sectionCode = 'סעיף 45';
      formFieldCode = '115';
    }

    unifiedCreditsList.push({
      id: `credit-point-${index}`,
      category: 'credit_point',
      label: item.label,
      sectionCode,
      formFieldCode,
      basisOrDetails: `${item.points} נקודות זיכוי (₪${pointAnnualVal.toLocaleString('he-IL')} לנקודה)`,
      creditNIS: itemNIS,
      description: item.reason,
    });
  });

  // 2. Direct Tax Credits (סעיף 45א פנסיה, סעיף 46 תרומות, סעיף 11 יישוב מוטב, סעיף 44)
  directTaxCreditsBreakdown.forEach((credit, idx) => {
    let formField = '045';
    if (credit.sectionCode.includes('46')) formField = '037';
    else if (credit.sectionCode.includes('11')) formField = '131';
    else if (credit.sectionCode.includes('268')) formField = '268';
    else if (credit.sectionCode.includes('44')) formField = '044';
    else if (credit.sectionCode.includes('200')) formField = '200';

    unifiedCreditsList.push({
      id: credit.id || `direct-credit-${idx}`,
      category: 'direct_credit',
      label: credit.label,
      sectionCode: credit.sectionCode,
      formFieldCode: formField,
      basisOrDetails: credit.ratePercent
        ? `בסיס מוכר: ₪${credit.baseAmount.toLocaleString('he-IL')} (${credit.ratePercent}%)`
        : `בסיס מוכר: ₪${credit.baseAmount.toLocaleString('he-IL')}`,
      ratePercent: credit.ratePercent,
      creditNIS: credit.creditNIS,
      description: credit.description,
    });
  });

  // 14. SPOUSE CALCULATION & CREDIT OPTIMIZATION (סעיף 45 / 46 ניוד זיכויים בין בני זוג בכפוף למגבלות החוק)
  let spouseResult: CalculationResult | undefined;
  let combinedFamilyNominalRefund: number | undefined;
  let combinedFamilyTotalRefund: number | undefined;
  let spouseCreditOptimization: CalculationResult['spouseCreditOptimization'] = undefined;

  // IMPORTANT: Spouse calculation is STRICTLY restricted to married couples only!
  // If maritalStatus is divorced, single, or widowed, spouse calculation is NEVER performed.
  const isMarried = input.maritalStatus === 'married';

  if (isMarried && input.includeSpouseCalculation && input.spouseData && !isRecursiveSpouseCall) {
    // Calculate spouse result recursively
    const spousePrimaryCalc = calculateTaxRefund(input.spouseData, true);

    // Statutory optimization check between Primary and Spouse:
    // Under Israeli Tax Ordinance (חישוב נפרד לפי סעיף 66):
    // 1. Personal credit points (תושב, אישה, ילדים, תואר וכו') CANNOT be transferred.
    // 2. Section 46 (Donations) can be transferred, SUBJECT TO:
    //    Total donations credited to recipient cannot exceed 30% of recipient's taxable income (סעיף 46(א)).
    // 3. Section 45A (Pension & Life Insurance) can be transferred, SUBJECT TO:
    //    Recipient's remaining statutory ceiling under Section 45A (annual ceiling maxEmployeePensionAnnualCredit e.g. ~₪2,852, plus 5% life insurance ceiling).
    // 4. Total transfer cannot exceed recipient's remaining positive tax liability.

    // Primary surplus analysis:
    const primaryInitialTax = baseTaxBeforeCredits + surtaxAmount;
    const primaryUnusedTotal = Math.max(0, totalGeneralCredits - primaryInitialTax);

    // Only Section 46 (donations) and Section 45A (pension & life insurance) are legally transferable:
    const primaryTransferablePool = Math.min(primaryUnusedTotal, donationCreditNIS + pensionLifeCreditNIS);
    const primaryDonationSurplus = Math.min(primaryTransferablePool, donationCreditNIS);
    const primary45aSurplus = Math.min(primaryTransferablePool - primaryDonationSurplus, pensionLifeCreditNIS);

    // Spouse surplus analysis:
    const spouseInitialTax = spousePrimaryCalc.baseTaxBeforeCredits + spousePrimaryCalc.surtaxAmount;
    const spouseUnusedTotal = Math.max(0, spousePrimaryCalc.totalCreditsNIS - spouseInitialTax);
    const spouseTransferablePool = Math.min(spouseUnusedTotal, spousePrimaryCalc.donationCreditNIS + spousePrimaryCalc.pensionLifeCreditNIS);
    const spouseDonationSurplus = Math.min(spouseTransferablePool, spousePrimaryCalc.donationCreditNIS);
    const spouse45aSurplus = Math.min(spouseTransferablePool - spouseDonationSurplus, spousePrimaryCalc.pensionLifeCreditNIS);

    // Scenario 1: Primary has transferable surplus, Spouse has tax liability > 0
    if (primaryTransferablePool > 10 && spousePrimaryCalc.taxLiabilityFinal > 10) {
      // Check Recipient Spouse's Section 46 limitation: 30% of taxable income
      const spouseTaxable = spousePrimaryCalc.taxableIncome;
      const spouseMaxDonationsCap = Math.round(spouseTaxable * (config.maxDonationPercentage || 0.30));
      const spouseExistingDonations = input.spouseData.donationAmount || 0;
      const spouseRemainingDonationCapacity = Math.max(0, spouseMaxDonationsCap - spouseExistingDonations);
      const allowableDonationCreditTransfer = Math.min(
        primaryDonationSurplus,
        Math.round(spouseRemainingDonationCapacity * 0.35)
      );

      // Check Recipient Spouse's Section 45A limitation: remaining statutory ceiling
      const spouseRemaining45aCapacity = Math.max(
        0,
        config.maxEmployeePensionAnnualCredit - spousePrimaryCalc.pensionLifeCreditNIS
      );
      const allowable45aCreditTransfer = Math.min(primary45aSurplus, spouseRemaining45aCapacity);

      // Total transferable under statutory limitations
      const totalStatutoryTransfer = allowableDonationCreditTransfer + allowable45aCreditTransfer;
      const transferAmount = Math.min(totalStatutoryTransfer, spousePrimaryCalc.taxLiabilityFinal);

      if (transferAmount > 10) {
        const newSpouseTaxLiability = Math.max(0, spousePrimaryCalc.taxLiabilityFinal - transferAmount);
        const newSpouseNetDiff = Math.round(spousePrimaryCalc.taxAlreadyPaid - newSpouseTaxLiability);
        const newSpouseNominal = newSpouseNetDiff > 0 ? newSpouseNetDiff : 0;
        const newSpouseInterest = newSpouseNominal > 0 ? Math.round(newSpouseNominal * interestFactor) : 0;
        const newSpouseFinalRefund = newSpouseNominal > 0 ? newSpouseNominal + newSpouseInterest : newSpouseNetDiff;

        // Also add the transferred credit to spouse's unifiedCreditsList!
        const transferredCreditRow: UnifiedCreditRow = {
          id: 'spousal-transfer-opt',
          category: 'spousal_transfer',
          label: `מיטוב זיכויים בין בני זוג - הועבר מ${input.employeeName || 'בן זוג א׳'}`,
          sectionCode: 'סעיפים 45א / 46',
          formFieldCode: 'מיטוב שומה',
          basisOrDetails: `העברת עודף זיכוי מוכר בכפוף לתקרת 30% מהכנסה חייבת (סעיף 46) ותקרת סעיף 45א`,
          creditNIS: transferAmount,
          description: `הועבר עודף זיכוי מוכר מתרומות (סעיף 46) או קופת גמל (סעיף 45א) שלא נוצל אצל בן/בת הזוג, בכפוף לתקרות החוקיות.`,
        };

        spouseResult = {
          ...spousePrimaryCalc,
          taxLiabilityFinal: newSpouseTaxLiability,
          netDifference: newSpouseNetDiff,
          nominalRefund: newSpouseNominal,
          interestAndLinkageBenefit: newSpouseInterest,
          finalRefundWithInterest: newSpouseFinalRefund,
          unifiedCreditsList: [...spousePrimaryCalc.unifiedCreditsList, transferredCreditRow],
        };

        spouseCreditOptimization = {
          applied: true,
          transferredCreditAmount: transferAmount,
          fromSpouseName: input.employeeName || 'בן זוג א׳',
          toSpouseName: input.spouseData.employeeName || 'בן/בת זוג ב׳',
          creditType: 'סעיף 46 (תרומות עד 30% מהכנסה) וסעיף 45א (קופת גמל עד תקרת הזיכוי)',
          explanation: `בוצע מיטוב זיכויים משפחתי כחוק: הועבר עודף זיכוי מס בסך ₪${transferAmount.toLocaleString('he-IL')} מ${input.employeeName || 'בן זוג א׳'} ל${input.spouseData.employeeName || 'בן/בת זוג ב׳'}. הניוד נבדק ואושר בכפוף למגבלת סעיף 46 (תקרת 30% מההכנסה החייבת) ולתקרת הזיכוי המרבי לפי סעיף 45א. הזיכוי מנע אובדן הטבת מס והגדיל ישירות את החזר המס המשפחתי!`,
        };
      } else {
        spouseResult = spousePrimaryCalc;
      }
    }
    // Scenario 2: Spouse has transferable surplus, Primary has tax liability > 0
    else if (spouseTransferablePool > 10 && taxLiabilityFinal > 10) {
      // Check Recipient Primary's Section 46 limitation: 30% of taxable income
      const primaryMaxDonationsCap = Math.round(taxableIncome * (config.maxDonationPercentage || 0.30));
      const primaryExistingDonations = input.donationAmount || 0;
      const primaryRemainingDonationCapacity = Math.max(0, primaryMaxDonationsCap - primaryExistingDonations);
      const allowableDonationCreditTransfer = Math.min(
        spouseDonationSurplus,
        Math.round(primaryRemainingDonationCapacity * 0.35)
      );

      // Check Recipient Primary's Section 45A limitation: remaining statutory ceiling
      const primaryRemaining45aCapacity = Math.max(
        0,
        config.maxEmployeePensionAnnualCredit - pensionLifeCreditNIS
      );
      const allowable45aCreditTransfer = Math.min(spouse45aSurplus, primaryRemaining45aCapacity);

      const totalStatutoryTransfer = allowableDonationCreditTransfer + allowable45aCreditTransfer;
      const transferAmount = Math.min(totalStatutoryTransfer, taxLiabilityFinal);

      if (transferAmount > 10) {
        taxLiabilityFinal = Math.max(0, taxLiabilityFinal - transferAmount);
        netDifference = Math.round(taxAlreadyPaid - taxLiabilityFinal);
        nominalRefund = netDifference > 0 ? netDifference : 0;
        interestAndLinkageBenefit = netDifference > 0 ? Math.round(nominalRefund * interestFactor) : 0;
        finalRefundWithInterest = netDifference > 0 ? nominalRefund + interestAndLinkageBenefit : netDifference;

        unifiedCreditsList.push({
          id: 'spousal-transfer-opt',
          category: 'spousal_transfer',
          label: `מיטוב זיכויים בין בני זוג - הועבר מ${input.spouseData.employeeName || 'בן/בת זוג ב׳'}`,
          sectionCode: 'סעיפים 45א / 46',
          formFieldCode: 'מיטוב שומה',
          basisOrDetails: `העברת עודף זיכוי מוכר בכפוף לתקרת 30% מהכנסה חייבת (סעיף 46) ותקרת סעיף 45א`,
          creditNIS: transferAmount,
          description: `הועבר עודף זיכוי מוכר מתרומות (סעיף 46) או קופת גמל (סעיף 45א) שלא נוצל אצל בן/בת הזוג, בכפוף לתקרות החוקיות.`,
        });

        spouseResult = spousePrimaryCalc;

        spouseCreditOptimization = {
          applied: true,
          transferredCreditAmount: transferAmount,
          fromSpouseName: input.spouseData.employeeName || 'בן/בת זוג ב׳',
          toSpouseName: input.employeeName || 'בן זוג א׳',
          creditType: 'סעיף 46 (תרומות עד 30% מהכנסה) וסעיף 45א (קופת גמל עד תקרת הזיכוי)',
          explanation: `בוצע מיטוב זיכויים משפחתי כחוק: הועבר עודף זיכוי בסך ₪${transferAmount.toLocaleString('he-IL')} מ${input.spouseData.employeeName || 'בן/בת זוג ב׳'} ל${input.employeeName || 'בן זוג א׳'}. הניוד נבדק ואושר בכפוף למגבלת סעיף 46 (30% מההכנסה החייבת) ולתקרת הפקדה מזכה לפי סעיף 45א, והגדיל ישירות את ההחזר המשפחתי!`,
        };
      } else {
        spouseResult = spousePrimaryCalc;
      }
    } else {
      spouseResult = spousePrimaryCalc;
    }

    combinedFamilyNominalRefund = nominalRefund + (spouseResult?.nominalRefund || 0);
    combinedFamilyTotalRefund = finalRefundWithInterest + (spouseResult?.finalRefundWithInterest || 0);
  }

  return {
    taxYear: input.taxYear,
    totalIncome,
    deductionsTotalNIS,
    taxableIncome,
    baseTaxBeforeCredits: Math.round(baseTaxBeforeCredits),
    bracketsBreakdown,
    surtaxAmount: Math.round(surtaxAmount),
    creditPointsTotal: Number(creditPointsTotal.toFixed(2)),
    creditPointsBreakdown,
    creditPointsValueNIS,
    settlementCreditNIS,
    donationCreditNIS,
    pensionLifeCreditNIS,
    nursingInstitutionCreditNIS,
    capitalLossOffsetCreditNIS,
    totalCreditsNIS: Math.round(totalGeneralCredits),
    directTaxCreditsBreakdown,
    directTaxCreditsTotalNIS,
    unifiedCreditsList,
    taxLiabilityFinal,
    taxAlreadyPaid,
    netDifference,
    nominalRefund,
    interestAndLinkageBenefit,
    finalRefundWithInterest,
    employerCount,
    missedTaxCoordinationDetected,
    keyRefundFactors,
    recommendations,
    spouseResult,
    combinedFamilyNominalRefund,
    combinedFamilyTotalRefund,
    spouseCreditOptimization,
  };
}
