import type { User as UserType, PatientMedicalHistory } from "@shared/schema";

export function formatMedicalHistoryForAI(history: PatientMedicalHistory | null | undefined): string {
  if (!history) return "";

  const sections: string[] = [];

  const basicInfo: string[] = [];
  if (history.name) basicInfo.push(`Name: ${history.name}`);
  if (history.age) basicInfo.push(`Age: ${history.age}`);
  if (history.gender) basicInfo.push(`Gender: ${history.gender}`);
  if (history.nationality) basicInfo.push(`Nationality: ${history.nationality}${history.nationalityOther ? ` (${history.nationalityOther})` : ''}`);
  if (history.ethnicity) basicInfo.push(`Ethnicity: ${history.ethnicity}`);
  if (history.caste) basicInfo.push(`Caste: ${history.caste}`);
  if (history.diet) basicInfo.push(`Diet: ${history.diet}`);
  if (history.maritalStatus) basicInfo.push(`Marital Status: ${history.maritalStatus}`);
  if (history.residenceLocation) basicInfo.push(`Residence: ${history.residenceLocation}`);
  if (history.educationQualification) basicInfo.push(`Education: ${history.educationQualification}${history.educationOther ? ` (${history.educationOther})` : ''}`);
  if (history.socioEconomicStatus) basicInfo.push(`Socio-Economic Status: ${history.socioEconomicStatus}`);
  if (basicInfo.length) sections.push(`[BASIC INFO] ${basicInfo.join(', ')}`);

  if (history.allergies?.length && !history.allergies.includes("None")) {
    let allergiesText = `Allergies: ${history.allergies.join(', ')}`;
    if (history.drugAllergyDetails) allergiesText += ` (Drug details: ${history.drugAllergyDetails})`;
    if (history.allergyOther) allergiesText += ` (Other: ${history.allergyOther})`;
    sections.push(`[ALLERGIES] ${allergiesText}`);
  }

  const medicalInfo: string[] = [];
  if (history.medicalConditions?.length && !history.medicalConditions.includes("None")) {
    medicalInfo.push(`Conditions: ${history.medicalConditions.join(', ')}${history.medicalConditionOther ? ` (${history.medicalConditionOther})` : ''}${history.medicalConditionSince ? `, since: ${history.medicalConditionSince}` : ''}`);
  }
  if (history.currentlyOnMedication === "Yes") {
    medicalInfo.push(`Currently on medication: Yes`);
    if (history.medicationDetails) medicalInfo.push(`Medication details: ${history.medicationDetails}`);
  }
  if (history.currentMedications) medicalInfo.push(`Current Medications: ${history.currentMedications}`);
  if (history.medicationDrugReaction === "Yes") {
    medicalInfo.push(`Drug reaction: Yes${history.drugReactionMedicineName ? `, medicine: ${history.drugReactionMedicineName}` : ''}${history.drugReaction ? `, reaction: ${history.drugReaction}` : ''}`);
    if (history.consultedPhysicianForReaction) medicalInfo.push(`Consulted physician for reaction: ${history.consultedPhysicianForReaction}`);
  }
  if (medicalInfo.length) sections.push(`[MEDICAL CONDITIONS] ${medicalInfo.join('. ')}`);

  if (history.surgicalHistory && history.surgicalHistory !== "No past surgery") {
    const surgeryInfo: string[] = [`Surgery history: ${history.surgicalHistory}`];
    if (history.surgicalHistoryOther) surgeryInfo.push(`Details: ${history.surgicalHistoryOther}`);
    if (history.surgeryDate) surgeryInfo.push(`Date: ${history.surgeryDate}`);
    if (history.surgeryIndication) surgeryInfo.push(`Indication: ${history.surgeryIndication}`);
    if (history.surgeries && Array.isArray(history.surgeries) && history.surgeries.length > 0) {
      const surgeryDetails = history.surgeries.map((s: any, i: number) => {
        let detail = `Surgery ${i + 1}: ${s.type || 'Unknown'}${s.typeOther ? ` (${s.typeOther})` : ''}`;
        if (s.date) detail += ` on ${s.date}`;
        if (s.indication) detail += `, indication: ${s.indication}`;
        if (s.intraOperativeComplication) detail += `, intra-op complication: ${s.intraOperativeComplication}${s.intraOperativeManagement ? ` (managed by: ${s.intraOperativeManagement})` : ''}`;
        if (s.postOperativeComplication) detail += `, post-op complication: ${s.postOperativeComplication}${s.postOperativeManagement ? ` (managed by: ${s.postOperativeManagement})` : ''}`;
        if (s.followUpInstructed) detail += `, follow-up: ${s.followUpInstructed}${s.followUpFrequency ? ` (${s.followUpFrequency})` : ''}`;
        return detail;
      }).join('; ');
      surgeryInfo.push(surgeryDetails);
    }
    sections.push(`[SURGICAL HISTORY] ${surgeryInfo.join('. ')}`);
  }

  const familyInfo: string[] = [];
  if (history.familyHistory?.length && !history.familyHistory.includes("None")) familyInfo.push(`Conditions in family: ${history.familyHistory.join(', ')}`);
  if (history.motherAlive) {
    let motherText = `Mother: ${history.motherAlive}`;
    if (history.motherAlive === "Dead" && history.motherCauseOfDeath) motherText += ` (cause: ${history.motherCauseOfDeath})`;
    if (history.motherHasSignificantHistory === "Yes" && history.motherMedicalHistory?.length && !history.motherMedicalHistory.includes("None")) {
      motherText += `, conditions: ${history.motherMedicalHistory.join(', ')}${history.motherMedicalHistoryOther ? ` (${history.motherMedicalHistoryOther})` : ''}${history.motherMedicalHistorySince ? `, since: ${history.motherMedicalHistorySince}` : ''}`;
    }
    if (history.motherOnMedication === "Yes" && history.motherMedications) motherText += `, medications: ${history.motherMedications}`;
    if (history.motherDrugReaction === "Yes") motherText += `, had drug reaction`;
    familyInfo.push(motherText);
  }
  if (history.fatherAlive) {
    let fatherText = `Father: ${history.fatherAlive}`;
    if (history.fatherAlive === "Dead" && history.fatherCauseOfDeath) fatherText += ` (cause: ${history.fatherCauseOfDeath})`;
    if (history.fatherHasSignificantHistory === "Yes" && history.fatherMedicalHistory?.length && !history.fatherMedicalHistory.includes("None")) {
      fatherText += `, conditions: ${history.fatherMedicalHistory.join(', ')}${history.fatherMedicalHistoryOther ? ` (${history.fatherMedicalHistoryOther})` : ''}${history.fatherMedicalHistorySince ? `, since: ${history.fatherMedicalHistorySince}` : ''}`;
    }
    if (history.fatherOnMedication === "Yes" && history.fatherMedications) fatherText += `, medications: ${history.fatherMedications}`;
    if (history.fatherDrugReaction === "Yes") fatherText += `, had drug reaction`;
    familyInfo.push(fatherText);
  }
  if (history.siblingsCount && history.siblingsCount > 0) {
    let siblingsText = `Siblings: ${history.siblingsCount}`;
    if (history.siblingsDetails && Array.isArray(history.siblingsDetails) && history.siblingsDetails.length > 0) {
      const siblingDetails = history.siblingsDetails.map((s: any, i: number) => {
        let detail = `${s.name || `Sibling ${i + 1}`} (${s.age || '?'}y, ${s.sex || '?'}, ${s.alive || '?'})`;
        if (s.alive === 'Dead' && s.causeOfDeath) detail += ` cause: ${s.causeOfDeath}`;
        if (s.hasSignificantHistory === 'Yes' && s.medicalHistory?.length) detail += `, conditions: ${Array.isArray(s.medicalHistory) ? s.medicalHistory.join(', ') : s.medicalHistory}${s.medicalHistoryOther ? ` (${s.medicalHistoryOther})` : ''}${s.medicalHistorySince ? `, since: ${s.medicalHistorySince}` : ''}`;
        if (s.onMedication === 'Yes' && s.medications) detail += `, meds: ${s.medications}`;
        if (s.drugReaction === 'Yes') detail += `, had drug reaction`;
        return detail;
      }).join('; ');
      siblingsText += `: ${siblingDetails}`;
    } else {
      if (history.siblingsAlive) siblingsText += `, status: ${history.siblingsAlive}`;
      if (history.siblingsDeceasedCause) siblingsText += ` (cause: ${history.siblingsDeceasedCause})`;
      if (history.siblingsMedicalHistory?.length && !history.siblingsMedicalHistory.includes("None")) siblingsText += `, conditions: ${history.siblingsMedicalHistory.join(', ')}`;
    }
    familyInfo.push(siblingsText);
  }
  if (history.childrenCount && history.childrenCount > 0) {
    let childrenText = `Children: ${history.childrenCount}`;
    if (history.childrenAgeGender) childrenText += ` (${history.childrenAgeGender})`;
    if (history.childrenHasSignificantHistory === "Yes" && history.childrenMedicalHistory?.length) {
      childrenText += `, conditions: ${history.childrenMedicalHistory.join(', ')}${history.childrenMedicalHistoryOther ? ` (${history.childrenMedicalHistoryOther})` : ''}`;
    }
    familyInfo.push(childrenText);
  }
  const grandparentInfo: string[] = [];
  if (history.maternalGrandmotherAlive) grandparentInfo.push(`Maternal grandmother: ${history.maternalGrandmotherAlive}${history.maternalGrandmotherCauseOfDeath ? ` (cause: ${history.maternalGrandmotherCauseOfDeath})` : ''}${history.maternalGrandmotherMedicalHistory?.length ? `, conditions: ${history.maternalGrandmotherMedicalHistory.join(', ')}` : ''}`);
  if (history.maternalGrandfatherAlive) grandparentInfo.push(`Maternal grandfather: ${history.maternalGrandfatherAlive}${history.maternalGrandfatherCauseOfDeath ? ` (cause: ${history.maternalGrandfatherCauseOfDeath})` : ''}${history.maternalGrandfatherMedicalHistory?.length ? `, conditions: ${history.maternalGrandfatherMedicalHistory.join(', ')}` : ''}`);
  if (history.paternalGrandmotherAlive) grandparentInfo.push(`Paternal grandmother: ${history.paternalGrandmotherAlive}${history.paternalGrandmotherCauseOfDeath ? ` (cause: ${history.paternalGrandmotherCauseOfDeath})` : ''}${history.paternalGrandmotherMedicalHistory?.length ? `, conditions: ${history.paternalGrandmotherMedicalHistory.join(', ')}` : ''}`);
  if (history.paternalGrandfatherAlive) grandparentInfo.push(`Paternal grandfather: ${history.paternalGrandfatherAlive}${history.paternalGrandfatherCauseOfDeath ? ` (cause: ${history.paternalGrandfatherCauseOfDeath})` : ''}${history.paternalGrandfatherMedicalHistory?.length ? `, conditions: ${history.paternalGrandfatherMedicalHistory.join(', ')}` : ''}`);
  if (grandparentInfo.length) familyInfo.push(`Grandparents: ${grandparentInfo.join('; ')}`);
  if (history.maternalUnclesCount && history.maternalUnclesCount > 0) familyInfo.push(`Maternal uncles: ${history.maternalUnclesCount}${history.maternalUnclesMedicalHistory?.length ? `, conditions: ${history.maternalUnclesMedicalHistory.join(', ')}` : ''}`);
  if (history.paternalUnclesCount && history.paternalUnclesCount > 0) familyInfo.push(`Paternal uncles: ${history.paternalUnclesCount}${history.paternalUnclesMedicalHistory?.length ? `, conditions: ${history.paternalUnclesMedicalHistory.join(', ')}` : ''}`);
  if (history.maternalAuntsCount && history.maternalAuntsCount > 0) familyInfo.push(`Maternal aunts: ${history.maternalAuntsCount}${history.maternalAuntsMedicalHistory?.length ? `, conditions: ${history.maternalAuntsMedicalHistory.join(', ')}` : ''}`);
  if (history.paternalAuntsCount && history.paternalAuntsCount > 0) familyInfo.push(`Paternal aunts: ${history.paternalAuntsCount}${history.paternalAuntsMedicalHistory?.length ? `, conditions: ${history.paternalAuntsMedicalHistory.join(', ')}` : ''}`);
  if (history.maternalCousinsCount && history.maternalCousinsCount > 0) familyInfo.push(`Maternal cousins: ${history.maternalCousinsCount}${history.maternalCousinsMedicalHistory?.length ? `, conditions: ${history.maternalCousinsMedicalHistory.join(', ')}` : ''}`);
  if (history.paternalCousinsCount && history.paternalCousinsCount > 0) familyInfo.push(`Paternal cousins: ${history.paternalCousinsCount}${history.paternalCousinsMedicalHistory?.length ? `, conditions: ${history.paternalCousinsMedicalHistory.join(', ')}` : ''}`);
  if (history.hasSpouse === "Yes") {
    let spouseText = `Spouse: ${history.spouseAlive || 'present'}`;
    if (history.spouseAlive === "Dead" && history.spouseCauseOfDeath) spouseText += ` (cause: ${history.spouseCauseOfDeath})`;
    if (history.spouseMedicalHistory?.length && !history.spouseMedicalHistory.includes("None")) spouseText += `, conditions: ${history.spouseMedicalHistory.join(', ')}`;
    familyInfo.push(spouseText);
  }
  if (history.inLawsSignificantHistory === "Yes" && history.inLawsMedicalHistory?.length) {
    familyInfo.push(`In-laws conditions: ${history.inLawsMedicalHistory.join(', ')}`);
  }
  if (history.familyPsychiatricHistory === "Yes") familyInfo.push(`Family psychiatric history: Yes`);
  if (history.familyUntimelyDeath === "Yes") familyInfo.push(`Untimely death in family: Yes${history.familyDeathType ? ` (${history.familyDeathType})` : ''}`);
  if (familyInfo.length) sections.push(`[FAMILY HISTORY] ${familyInfo.join('. ')}`);

  const substanceInfo: string[] = [];
  if (history.substanceUseStatus && history.substanceUseStatus !== "Never used") {
    substanceInfo.push(`Status: ${history.substanceUseStatus}`);
    if (history.substancesUsed?.length) {
      substanceInfo.push(`Substances: ${history.substancesUsed.join(', ')}${history.substanceOther ? ` (${history.substanceOther})` : ''}`);
      if (history.substanceDetails && typeof history.substanceDetails === 'object') {
        const substanceDetailsArr = Object.entries(history.substanceDetails).map(([substance, details]: [string, any]) => {
          let detail = `${substance}:`;
          if (details.startAge) detail += ` started at ${details.startAge}`;
          if (details.useYears) detail += `, ${details.useYears}y use`;
          if (details.frequency) detail += `, ${details.frequency}`;
          if (details.amount) detail += `, amount: ${details.amount}`;
          if (details.route?.length) detail += `, route: ${details.route.join('/')}`;
          if (details.lastUse) detail += `, last: ${details.lastUse}`;
          if (details.craving) detail += `, craving: ${details.craving}`;
          if (details.tolerance) detail += `, tolerance: ${details.tolerance}`;
          if (details.withdrawalSeverity) detail += `, withdrawal: ${details.withdrawalSeverity}`;
          if (details.withdrawalSymptoms?.length) detail += ` (${details.withdrawalSymptoms.join(', ')})`;
          return detail;
        });
        if (substanceDetailsArr.length > 0) substanceInfo.push(`Details: ${substanceDetailsArr.join('; ')}`);
      }
    }
    if (history.substanceFrequency) substanceInfo.push(`Frequency: ${history.substanceFrequency}`);
    if (history.substanceStartAge) substanceInfo.push(`Started at age: ${history.substanceStartAge}`);
    if (history.substanceUseYears) substanceInfo.push(`Duration: ${history.substanceUseYears} years`);
    if (history.substanceWithdrawalSymptoms?.length) substanceInfo.push(`Withdrawal symptoms: ${history.substanceWithdrawalSymptoms.join(', ')}`);
    if (history.substanceTreatmentHistory?.length) substanceInfo.push(`Treatment history: ${history.substanceTreatmentHistory.join(', ')}`);
    if (history.substanceNeedHelp) substanceInfo.push(`Needs help: ${history.substanceNeedHelp}`);
    if (history.substanceAdditionalInfo) substanceInfo.push(`Additional info: ${history.substanceAdditionalInfo}`);
  }
  if (history.addictionHistory?.length && !history.addictionHistory.includes("None")) {
    substanceInfo.push(`Addiction history: ${history.addictionHistory.join(', ')}`);
    if (history.addictionFrequency) substanceInfo.push(`Frequency: ${history.addictionFrequency}`);
    if (history.addictionStartAge) substanceInfo.push(`Started: ${history.addictionStartAge}`);
    if (history.addictionYears) substanceInfo.push(`Years: ${history.addictionYears}`);
    if (history.addictionAmount) substanceInfo.push(`Amount: ${history.addictionAmount}`);
    if (history.addictionRoute) substanceInfo.push(`Route: ${history.addictionRoute}`);
    if (history.withdrawalSymptoms?.length) substanceInfo.push(`Withdrawal: ${history.withdrawalSymptoms.join(', ')}`);
    if (history.addictionTreatment) substanceInfo.push(`Treatment: ${history.addictionTreatment}`);
  }
  if (substanceInfo.length) sections.push(`[SUBSTANCE USE] ${substanceInfo.join('. ')}`);

  const occupationInfo: string[] = [];
  if (history.currentWorkStatus) occupationInfo.push(`Work status: ${history.currentWorkStatus}`);
  if (history.currentJobTitle) occupationInfo.push(`Job: ${history.currentJobTitle}`);
  if (history.occupationType) occupationInfo.push(`Occupation type: ${history.occupationType}${history.occupationOther ? ` (${history.occupationOther})` : ''}`);
  if (history.workMainType) occupationInfo.push(`Work type: ${history.workMainType}`);
  if (history.workType) occupationInfo.push(`Work nature: ${history.workType}`);
  if (history.workYearsInJob || history.workYears) occupationInfo.push(`Years in job: ${history.workYearsInJob || history.workYears}`);
  if (history.workHoursDaily || history.workHoursPerDay) occupationInfo.push(`Daily hours: ${history.workHoursDaily || history.workHoursPerDay}`);
  if (history.workShifts || history.shiftWork) occupationInfo.push(`Shift work: ${history.workShifts || history.shiftWork}`);
  if (history.workHarmfulExposure === "Yes" || history.workplaceExposure?.length) {
    let exposureText = `Workplace exposures: `;
    if (history.workExposureTypes?.length) exposureText += history.workExposureTypes.join(', ');
    else if (history.workplaceExposure?.length) exposureText += history.workplaceExposure.join(', ');
    occupationInfo.push(exposureText);
  }
  if (history.workProtectiveEquipment || history.protectiveEquipment) occupationInfo.push(`Protective equipment: ${history.workProtectiveEquipment || history.protectiveEquipment}`);
  if (history.workPhysicalStrain) occupationInfo.push(`Physical strain: ${history.workPhysicalStrain}`);
  if (history.physicalActivity) occupationInfo.push(`Physical activity: ${history.physicalActivity}`);
  if (history.workMentalStress || history.jobStress) occupationInfo.push(`Job stress: ${history.workMentalStress || history.jobStress}`);
  if (history.workRelatedHealthProblems?.length || history.workHealthProblems?.length) {
    occupationInfo.push(`Work-related health issues: ${(history.workRelatedHealthProblems || history.workHealthProblems)?.join(', ')}`);
  }
  if (history.currentWorkRisks) occupationInfo.push(`Current work risks: ${history.currentWorkRisks}`);
  if (history.workJobChangeHealth === "Yes") occupationInfo.push(`Changed job due to health: Yes${history.workJobChangeReason ? ` (${history.workJobChangeReason})` : ''}`);
  if (history.previousJobTitle) occupationInfo.push(`Previous job: ${history.previousJobTitle}${history.previousJobYears ? ` (${history.previousJobYears}y)` : ''}${history.previousJobExposure === "Yes" && history.previousJobExposureDetails ? `, exposure: ${history.previousJobExposureDetails}` : ''}`);
  if (history.workAffectsMedicalVisits) occupationInfo.push(`Work affects medical visits: ${history.workAffectsMedicalVisits}`);
  if (history.workNeedAdvice) occupationInfo.push(`Needs work health advice: ${history.workNeedAdvice}`);
  if (history.workAdditionalInfo) occupationInfo.push(`Additional: ${history.workAdditionalInfo}`);
  if (occupationInfo.length) sections.push(`[OCCUPATION] ${occupationInfo.join('. ')}`);

  const obstetricInfo: string[] = [];
  if (history.menarcheAge) obstetricInfo.push(`Menarche age: ${history.menarcheAge}`);
  if (history.menstrualCycleType) obstetricInfo.push(`Menstrual cycle: ${history.menstrualCycleType}`);
  if (history.cycleLength) obstetricInfo.push(`Cycle length: ${history.cycleLength} days`);
  if (history.menstruationDuration) obstetricInfo.push(`Period duration: ${history.menstruationDuration} days`);
  if (history.menstrualFlow) obstetricInfo.push(`Flow: ${history.menstrualFlow}`);
  if (history.premenstrualSyndrome) obstetricInfo.push(`PMS: ${history.premenstrualSyndrome}`);
  if (history.dysmenorrhea) obstetricInfo.push(`Dysmenorrhea: ${history.dysmenorrhea}`);
  if (history.mittelschmerzPain) obstetricInfo.push(`Mittelschmerz pain: ${history.mittelschmerzPain}`);
  if (history.ayurvedicMedication === "Yes") {
    obstetricInfo.push(`Ayurvedic medication: Yes${history.ayurvedicMedicationType?.length ? ` (${history.ayurvedicMedicationType.join(', ')})` : ''}${history.ayurvedicMedicineName ? `, name: ${history.ayurvedicMedicineName}` : ''}`);
  }
  if (history.menstrualPatternChange === "Yes") {
    obstetricInfo.push(`Cycle change noticed: ${history.menstrualPatternChangeWhat || 'Yes'}${history.menstrualPatternChangeWhen ? ` (since: ${history.menstrualPatternChangeWhen})` : ''}`);
  }
  if (history.consultedGynaecologist) obstetricInfo.push(`Consulted gynaecologist: ${history.consultedGynaecologist}`);
  if (history.menopauseAge) obstetricInfo.push(`Menopause age: ${history.menopauseAge}`);
  if (history.menopauseSymptoms?.length && !history.menopauseSymptoms.includes("None")) obstetricInfo.push(`Menopause symptoms: ${history.menopauseSymptoms.join(', ')}`);
  if (history.postMenopauseBleeding) obstetricInfo.push(`Post-menopause bleeding: ${history.postMenopauseBleeding}`);
  if (history.ageAtMarriage) obstetricInfo.push(`Age at marriage: ${history.ageAtMarriage}`);
  if (history.everPregnant === "Yes") {
    obstetricInfo.push(`Ever pregnant: Yes`);
    if (history.pregnancyCount) obstetricInfo.push(`Total pregnancies: ${history.pregnancyCount}`);
    if (history.liveBirths) obstetricInfo.push(`Live births: ${history.liveBirths}`);
    if (history.miscarriages) obstetricInfo.push(`Miscarriages: ${history.miscarriages}`);
    if (history.inducedAbortions) obstetricInfo.push(`Induced abortions: ${history.inducedAbortions}`);
    if (history.stillbirths) obstetricInfo.push(`Stillbirths: ${history.stillbirths}`);
    if (history.firstBirthGender) {
      let firstBirth = `First birth: ${history.firstBirthGender}`;
      if (history.firstBirthWeight) firstBirth += `, ${history.firstBirthWeight}`;
      if (history.firstBirthDeliveryType) firstBirth += `, ${history.firstBirthDeliveryType}${history.firstBirthDeliveryIndication ? ` (${history.firstBirthDeliveryIndication})` : ''}`;
      if (history.firstBirthGestationalAge) firstBirth += `, ${history.firstBirthGestationalAge} weeks`;
      if (history.firstBirthCriedAfter) firstBirth += `, cried: ${history.firstBirthCriedAfter}`;
      if (history.firstBirthNICU === "Yes") firstBirth += `, NICU: ${history.firstBirthNICUDays || '?'} days${history.firstBirthNICUCause ? ` (${history.firstBirthNICUCause})` : ''}`;
      obstetricInfo.push(firstBirth);
    }
    if (history.secondBirthGender) {
      let secondBirth = `Second birth: ${history.secondBirthGender}`;
      if (history.secondBirthWeight) secondBirth += `, ${history.secondBirthWeight}`;
      if (history.secondBirthDeliveryType) secondBirth += `, ${history.secondBirthDeliveryType}${history.secondBirthDeliveryIndication ? ` (${history.secondBirthDeliveryIndication})` : ''}`;
      if (history.secondBirthGestationalAge) secondBirth += `, ${history.secondBirthGestationalAge} weeks`;
      if (history.secondBirthNICU === "Yes") secondBirth += `, NICU: ${history.secondBirthNICUDays || '?'} days`;
      obstetricInfo.push(secondBirth);
    }
    if (history.thirdBirthGender) {
      let thirdBirth = `Third birth: ${history.thirdBirthGender}`;
      if (history.thirdBirthWeight) thirdBirth += `, ${history.thirdBirthWeight}`;
      if (history.thirdBirthDeliveryType) thirdBirth += `, ${history.thirdBirthDeliveryType}${history.thirdBirthDeliveryIndication ? ` (${history.thirdBirthDeliveryIndication})` : ''}`;
      obstetricInfo.push(thirdBirth);
    }
    if (history.deliveryType) {
      obstetricInfo.push(`Delivery type: ${history.deliveryType}${history.deliveryIndication ? ` (indication: ${history.deliveryIndication})` : ''}`);
    }
  }
  if (history.contraceptiveUse) obstetricInfo.push(`Contraceptive use: ${history.contraceptiveUse}${history.contraceptiveOther ? ` (${history.contraceptiveOther})` : ''}`);
  if (obstetricInfo.length) sections.push(`[OBSTETRIC/GYNECOLOGY] ${obstetricInfo.join('. ')}`);

  const envInfo: string[] = [];
  if (history.livingArea) envInfo.push(`Living area: ${history.livingArea}`);
  if (history.livingYears) envInfo.push(`Years at residence: ${history.livingYears}`);
  if (history.houseType) envInfo.push(`House type: ${history.houseType}`);
  if (history.householdSize) envInfo.push(`Household size: ${history.householdSize}`);
  if (history.overcrowding) envInfo.push(`Overcrowding: ${history.overcrowding}`);
  if (history.drinkingWaterSource) envInfo.push(`Water source: ${history.drinkingWaterSource}`);
  if (history.waterTreatment) envInfo.push(`Water treatment: ${history.waterTreatment}`);
  if (history.toiletFacility) envInfo.push(`Toilet facility: ${history.toiletFacility}`);
  if (history.wasteDisposal) envInfo.push(`Waste disposal: ${history.wasteDisposal}`);
  if (history.cookingFuel) envInfo.push(`Cooking fuel: ${history.cookingFuel}`);
  if (history.kitchenVentilation) envInfo.push(`Kitchen ventilation: ${history.kitchenVentilation}`);
  if (history.indoorSmokeExposure?.length && !history.indoorSmokeExposure.includes("None")) {
    envInfo.push(`Indoor smoke exposure: ${history.indoorSmokeExposure.join(', ')}${history.indoorSmokeExposure.includes("Other") && history.indoorSmokeExposureOther ? ` (${history.indoorSmokeExposureOther})` : ''}`);
  }
  if (history.nearbyPollution?.length && !history.nearbyPollution.includes("None")) {
    envInfo.push(`Nearby pollution: ${history.nearbyPollution.join(', ')}${history.nearbyPollution.includes("Other") && history.nearbyPollutionOther ? ` (${history.nearbyPollutionOther})` : ''}`);
  }
  if (history.outdoorPollutionExposure) envInfo.push(`Outdoor pollution: ${history.outdoorPollutionExposure}`);
  if (history.pesticidesExposure) envInfo.push(`Pesticides exposure: ${history.pesticidesExposure}`);
  if (history.stagnantWater) envInfo.push(`Stagnant water nearby: ${history.stagnantWater}`);
  if (history.petsAtHome?.length && !history.petsAtHome.includes("None")) envInfo.push(`Pets: ${history.petsAtHome.join(', ')}`);
  if (history.mosquitoBorneDiseases?.length && !history.mosquitoBorneDiseases.includes("None")) {
    envInfo.push(`Mosquito-borne disease history: ${history.mosquitoBorneDiseases.join(', ')}${history.mosquitoBorneDiseases.includes("Other") && history.mosquitoDiseasesOther ? ` (${history.mosquitoDiseasesOther})` : ''}`);
  }
  if (history.environmentHealthProblems?.length && !history.environmentHealthProblems.includes("None")) envInfo.push(`Environment-related health issues: ${history.environmentHealthProblems.join(', ')}`);
  if (envInfo.length) sections.push(`[ENVIRONMENTAL] ${envInfo.join('. ')}`);

  const vaccineInfo: string[] = [];
  if (history.everVaccinated) vaccineInfo.push(`Vaccinated: ${history.everVaccinated}`);
  if (history.vaccinationCard) vaccineInfo.push(`Has vaccination card: ${history.vaccinationCard}`);
  if (history.childhoodVaccines?.length) vaccineInfo.push(`Childhood vaccines: ${history.childhoodVaccines.join(', ')}`);
  if (history.adultVaccines?.length && !history.adultVaccines.includes("None")) {
    vaccineInfo.push(`Adult vaccines: ${history.adultVaccines.join(', ')}${history.adultVaccinesOther ? ` (${history.adultVaccinesOther})` : ''}`);
    if (history.vaccineDetails && typeof history.vaccineDetails === 'object') {
      const vaccineDetailsArr = Object.entries(history.vaccineDetails).map(([vaccine, details]: [string, any]) => {
        let detail = `${vaccine}:`;
        if (details.date) detail += ` ${details.date}`;
        if (details.doses) detail += `, ${details.doses} doses`;
        if (details.reaction === "Yes") detail += `, had reaction${details.reactionDetails ? `: ${details.reactionDetails}` : ''}`;
        return detail;
      });
      if (vaccineDetailsArr.length > 0) vaccineInfo.push(`Details: ${vaccineDetailsArr.join('; ')}`);
    }
  }
  if (history.lastVaccinationDate) vaccineInfo.push(`Last vaccination: ${history.lastVaccinationDate}`);
  if (history.completedAllDoses) vaccineInfo.push(`Completed all doses: ${history.completedAllDoses}`);
  if (history.missedDelayedVaccine) vaccineInfo.push(`Missed/delayed vaccine: ${history.missedDelayedVaccine}`);
  if (history.workTravelVaccinated === "Yes") vaccineInfo.push(`Work/travel vaccine: ${history.workTravelVaccineName || 'Yes'}`);
  if (history.vaccineReaction === "Yes" && history.vaccineReactionType?.length) {
    vaccineInfo.push(`Vaccine reactions: ${history.vaccineReactionType.join(', ')}${history.vaccineReactionOther ? ` (${history.vaccineReactionOther})` : ''}`);
  }
  if (vaccineInfo.length) sections.push(`[VACCINATION] ${vaccineInfo.join('. ')}`);

  const travelInfo: string[] = [];
  if (history.recentTravel && history.recentTravel !== "No") {
    travelInfo.push(`Recent travel: ${history.recentTravel}`);
    if (history.travelTiming) travelInfo.push(`When: ${history.travelTiming}`);
    if (history.travelLocation) travelInfo.push(`Destination: ${history.travelLocation}`);
    if (history.travelCountry) travelInfo.push(`Country: ${history.travelCountry}`);
    if (history.travelPurpose) travelInfo.push(`Purpose: ${history.travelPurpose}${history.travelPurposeOther ? ` (${history.travelPurposeOther})` : ''}`);
    if (history.travelDuration) travelInfo.push(`Duration: ${history.travelDuration}`);
    if (history.travelAreaType) travelInfo.push(`Area type: ${history.travelAreaType}`);
    if (history.travelAccommodation) travelInfo.push(`Accommodation: ${history.travelAccommodation}`);
    if (history.travelFoodWater?.length) travelInfo.push(`Food/water sources: ${history.travelFoodWater.join(', ')}`);
    if (history.travelMosquitoExposure) travelInfo.push(`Mosquito exposure: ${history.travelMosquitoExposure}`);
    if (history.travelSickContact) travelInfo.push(`Contact with sick person: ${history.travelSickContact}`);
    if (history.endemicAreaTravel?.length) travelInfo.push(`Endemic area exposure: ${history.endemicAreaTravel.join(', ')}`);
    if (history.travelIllness === "Yes") {
      travelInfo.push(`Illness during travel: Yes`);
      if (history.travelIllnessSymptomsBefore?.length) travelInfo.push(`Symptoms before: ${history.travelIllnessSymptomsBefore.join(', ')}`);
      if (history.travelIllnessSymptomsDuring?.length) travelInfo.push(`Symptoms during: ${history.travelIllnessSymptomsDuring.join(', ')}`);
      if (history.travelIllnessSymptomsAfter?.length) travelInfo.push(`Symptoms after: ${history.travelIllnessSymptomsAfter.join(', ')}`);
    }
    if (history.travelPreventiveMeds === "Yes") {
      travelInfo.push(`Preventive medicines: ${history.travelPreventiveMedsTypes?.join(', ') || 'Yes'}${history.travelPreventiveMedsOther ? ` (${history.travelPreventiveMedsOther})` : ''}`);
    }
    if (history.preventiveMedicines?.length) travelInfo.push(`Preventive medicines taken: ${history.preventiveMedicines.join(', ')}`);
    if (history.internationalTravel) travelInfo.push(`International travel: ${history.internationalTravel}`);
    if (history.travelQuarantine) travelInfo.push(`Quarantine: ${history.travelQuarantine}`);
  }
  if (travelInfo.length) sections.push(`[TRAVEL] ${travelInfo.join('. ')}`);

  const psychInfo: string[] = [];
  if (history.moodInterestLoss !== undefined && history.moodInterestLoss > 0) psychInfo.push(`Interest loss: ${history.moodInterestLoss}/3`);
  if (history.moodDepressed !== undefined && history.moodDepressed > 0) psychInfo.push(`Depression score: ${history.moodDepressed}/3`);
  if (history.moodTired !== undefined && history.moodTired > 0) psychInfo.push(`Fatigue: ${history.moodTired}/3`);
  if (history.anxietyNervous !== undefined && history.anxietyNervous > 0) psychInfo.push(`Anxiety score: ${history.anxietyNervous}/3`);
  if (history.anxietyWorrying !== undefined && history.anxietyWorrying > 0) psychInfo.push(`Worrying: ${history.anxietyWorrying}/3`);
  if (history.anxietyInterference !== undefined && history.anxietyInterference > 0) psychInfo.push(`Anxiety interference: ${history.anxietyInterference}/3`);
  if (history.stressLevel) psychInfo.push(`Stress level: ${history.stressLevel}`);
  if (history.suicidalThoughts !== undefined && history.suicidalThoughts > 0) psychInfo.push(`Suicidal ideation: present`);
  if (history.suicidalActive) psychInfo.push(`Active suicidal thoughts: ${history.suicidalActive}`);
  if (history.feelingUnsafe) psychInfo.push(`Feeling unsafe: ${history.feelingUnsafe}`);
  if (history.sleepDifficulty) psychInfo.push(`Sleep difficulty: ${history.sleepDifficulty}`);
  if (history.sleepDuration) psychInfo.push(`Sleep duration: ${history.sleepDuration}`);
  if (history.bipolarEnergy) psychInfo.push(`Bipolar energy: ${history.bipolarEnergy}`);
  if (history.bipolarNoticed) psychInfo.push(`Bipolar noticed by others: ${history.bipolarNoticed}`);
  if (history.psychosisVoices) psychInfo.push(`Hearing voices: ${history.psychosisVoices}`);
  if (history.psychosisParanoia) psychInfo.push(`Paranoia: ${history.psychosisParanoia}`);
  if (history.substanceCoping) psychInfo.push(`Substance for coping: ${history.substanceCoping}`);
  if (history.substanceProblems) psychInfo.push(`Substance causing problems: ${history.substanceProblems}`);
  if (history.overallFunctioningImpact) psychInfo.push(`Functioning impact: ${history.overallFunctioningImpact}`);
  if (history.psychiatricHistory?.length && !history.psychiatricHistory.includes("None")) psychInfo.push(`Psychiatric history: ${history.psychiatricHistory.join(', ')}${history.psychiatricOther ? ` (${history.psychiatricOther})` : ''}`);
  if (history.socialHistory) psychInfo.push(`Social history: ${history.socialHistory}`);
  if (history.behavioralPattern) psychInfo.push(`Behavioral pattern: ${history.behavioralPattern}`);
  if (history.psychologicalProfile) psychInfo.push(`Psychological profile: ${history.psychologicalProfile}`);
  if (psychInfo.length) sections.push(`[PSYCHOSOCIAL] ${psychInfo.join('. ')}`);

  const visionInfo: string[] = [];
  if (history.visionProblem === "Yes") {
    visionInfo.push(`Vision problems: Yes`);
    if (history.visionProblemTypes?.length) visionInfo.push(`Types: ${history.visionProblemTypes.join(', ')}`);
    if (history.visionProblemDuration) visionInfo.push(`Duration: ${history.visionProblemDuration}`);
    if (history.visionAffectedEyes) visionInfo.push(`Affected eyes: ${history.visionAffectedEyes}`);
  }
  if (history.usesGlasses === "Yes") {
    let glassesText = `Uses glasses: Yes`;
    if (history.glassesType) glassesText += ` (${history.glassesType})`;
    if (history.spectaclePower) glassesText += `, power: ${history.spectaclePower}`;
    visionInfo.push(glassesText);
  }
  if (history.lastEyeCheckup) visionInfo.push(`Last eye checkup: ${history.lastEyeCheckup}`);
  if (history.eyeDiseases?.length && !history.eyeDiseases.includes("None")) visionInfo.push(`Eye diseases: ${history.eyeDiseases.join(', ')}`);
  if (history.eyeRelatedIllness?.length && !history.eyeRelatedIllness.includes("None")) {
    visionInfo.push(`Eye-related illnesses: ${history.eyeRelatedIllness.join(', ')}${history.eyeRelatedIllness.includes("Other") && history.eyeRelatedIllnessOther ? ` (${history.eyeRelatedIllnessOther})` : ''}`);
  }
  if (history.eyeSurgeryOrInjury === "Yes") {
    let surgeryText = `Eye surgery/injury: Yes`;
    if (history.eyeSurgeryDetails) surgeryText += ` (${history.eyeSurgeryDetails})`;
    if (history.eyeSurgeryTimePassed) surgeryText += `, ${history.eyeSurgeryTimePassed} ago`;
    visionInfo.push(surgeryText);
  }
  if (history.screenTimePerDay) visionInfo.push(`Screen time: ${history.screenTimePerDay}`);
  if (history.eyeStrainAfterScreen) visionInfo.push(`Eye strain after screen: ${history.eyeStrainAfterScreen}`);
  if (history.familyEyeDisease === "Yes") {
    visionInfo.push(`Family eye disease: ${history.familyEyeDiseaseTypes?.join(', ') || 'Yes'}${history.familyEyeDiseaseOther ? ` (${history.familyEyeDiseaseOther})` : ''}`);
  }
  if (history.medicinesAffectingVision === "Yes") {
    visionInfo.push(`Medicines affecting vision: Yes${history.medicinesAffectingVisionDetails ? ` (${history.medicinesAffectingVisionDetails})` : ''}`);
  }
  if (visionInfo.length) sections.push(`[VISION] ${visionInfo.join('. ')}`);

  const lifestyleInfo: string[] = [];
  if (history.bowelHabits) lifestyleInfo.push(`Bowel habits: ${history.bowelHabits}`);
  if (history.hydration) lifestyleInfo.push(`Hydration: ${history.hydration}`);
  if (history.screenTime || history.screenTimePerDay) lifestyleInfo.push(`Screen time: ${history.screenTimePerDay || history.screenTime}`);
  if (history.fitnessHistory) lifestyleInfo.push(`Fitness level: ${history.fitnessHistory}`);
  if (history.physicalActivity) lifestyleInfo.push(`Physical activity: ${history.physicalActivity}`);
  if (history.testHistory) lifestyleInfo.push(`Recent tests: ${history.testHistory}`);
  if (lifestyleInfo.length) sections.push(`[LIFESTYLE] ${lifestyleInfo.join('. ')}`);

  const dietInfo: string[] = [];
  if (history.mealsPerDay) dietInfo.push(`Meals per day: ${history.mealsPerDay}`);
  if (history.mealTimings) dietInfo.push(`Meal timings: ${history.mealTimings}`);
  if (history.dietCuisinePreference) dietInfo.push(`Cuisine preference: ${history.dietCuisinePreference}${history.dietCuisineOther ? ` (${history.dietCuisineOther})` : ''}`);
  if (history.dietTypePreference) dietInfo.push(`Food type: ${history.dietTypePreference}`);
  if (history.fitnessGoal) dietInfo.push(`Fitness goal: ${history.fitnessGoal}${history.fitnessGoalOther ? ` (${history.fitnessGoalOther})` : ''}`);
  if (history.medicalDietType?.length && !history.medicalDietType.includes("None")) {
    dietInfo.push(`Medical diet types: ${history.medicalDietType.join(', ')}${history.medicalDietTypeOther ? ` (${history.medicalDietTypeOther})` : ''}`);
  }
  if (history.dietFollowFrequency) dietInfo.push(`Diet adherence: ${history.dietFollowFrequency}`);
  if (history.dietRevisionDays) dietInfo.push(`Diet revision interval: every ${history.dietRevisionDays} days`);
  if (dietInfo.length) sections.push(`[DIET HISTORY] ${dietInfo.join('. ')}`);

  return sections.length > 0 ? sections.join(' || ') : "";
}

export function buildPatientContext(user: UserType | null | undefined): string {
  if (!user) return "";

  const parts: string[] = [];

  const basic: string[] = [];
  if (user.name) basic.push(`Name: ${user.name}`);
  if (user.age) basic.push(`Age: ${user.age}`);
  if (user.gender) basic.push(`Gender: ${user.gender}`);
  if (user.bloodGroup) basic.push(`Blood Group: ${user.bloodGroup}`);
  if (user.height) basic.push(`Height: ${user.height}`);
  if (user.weight) basic.push(`Weight: ${user.weight}`);
  if (basic.length) parts.push(basic.join(", "));

  const medHistory = formatMedicalHistoryForAI(user.patientMedicalHistory as PatientMedicalHistory | null);
  if (medHistory) parts.push(medHistory);

  return parts.filter(Boolean).join("\n");
}
