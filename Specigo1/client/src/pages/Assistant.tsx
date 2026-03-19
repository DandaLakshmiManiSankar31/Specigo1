import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useUser, useUserById, useUpdateUser, useFamilyMembers, useCreateFamilyMember } from "@/hooks/use-users";
import { useAiChat, useCreateRecord, useMedicalReports, useMedicalRecords } from "@/hooks/use-medical";
import { api } from "@shared/routes";
import { useSpeech } from "@/hooks/use-speech";
import { useTranslate, type SupportedLanguage, languageNames } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/Input";
import { Waveform } from "@/components/Waveform";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, User, Activity, LogOut, ChevronRight, FileText, Globe, ClipboardList, HeartPulse, Menu, X, MessageSquare, ArrowLeft, FileSearch, Check, UserPlus, ChevronDown, Users, Salad } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User as UserType, PatientMedicalHistory } from "@shared/schema";

// Helper to format patient medical history for AI context - comprehensive version covering ALL 250+ fields
const formatMedicalHistoryForAI = (history: PatientMedicalHistory | null | undefined): string => {
  if (!history) return "No detailed medical history available";
  
  const sections: string[] = [];
  
  // === BASIC INFORMATION ===
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
  
  // === ALLERGIES ===
  if (history.allergies?.length && !history.allergies.includes("None")) {
    let allergiesText = `Allergies: ${history.allergies.join(', ')}`;
    if (history.drugAllergyDetails) allergiesText += ` (Drug details: ${history.drugAllergyDetails})`;
    if (history.allergyOther) allergiesText += ` (Other: ${history.allergyOther})`;
    sections.push(`[ALLERGIES] ${allergiesText}`);
  }
  
  // === MEDICAL CONDITIONS & MEDICATIONS ===
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
  
  // === SURGICAL HISTORY ===
  if (history.surgicalHistory && history.surgicalHistory !== "No past surgery") {
    const surgeryInfo: string[] = [`Surgery history: ${history.surgicalHistory}`];
    if (history.surgicalHistoryOther) surgeryInfo.push(`Details: ${history.surgicalHistoryOther}`);
    if (history.surgeryDate) surgeryInfo.push(`Date: ${history.surgeryDate}`);
    if (history.surgeryIndication) surgeryInfo.push(`Indication: ${history.surgeryIndication}`);
    if (history.surgeries && Array.isArray(history.surgeries) && history.surgeries.length > 0) {
      const surgeryDetails = history.surgeries.map((s: any, i: number) => {
        let detail = `Surgery ${i+1}: ${s.type || 'Unknown'}${s.typeOther ? ` (${s.typeOther})` : ''}`;
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
  
  // === FAMILY HISTORY - COMPREHENSIVE ===
  const familyInfo: string[] = [];
  if (history.familyHistory?.length && !history.familyHistory.includes("None")) familyInfo.push(`Conditions in family: ${history.familyHistory.join(', ')}`);
  
  // Mother
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
  
  // Father
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
  
  // Siblings - per-sibling details
  if (history.siblingsCount && history.siblingsCount > 0) {
    let siblingsText = `Siblings: ${history.siblingsCount}`;
    if (history.siblingsDetails && Array.isArray(history.siblingsDetails) && history.siblingsDetails.length > 0) {
      const siblingDetails = history.siblingsDetails.map((s: any, i: number) => {
        let detail = `${s.name || `Sibling ${i+1}`} (${s.age || '?'}y, ${s.sex || '?'}, ${s.alive || '?'})`;
        if (s.alive === 'Dead' && s.causeOfDeath) detail += ` cause: ${s.causeOfDeath}`;
        if (s.hasSignificantHistory === 'Yes' && s.medicalHistory?.length) detail += `, conditions: ${Array.isArray(s.medicalHistory) ? s.medicalHistory.join(', ') : s.medicalHistory}${s.medicalHistoryOther ? ` (${s.medicalHistoryOther})` : ''}${s.medicalHistorySince ? `, since: ${s.medicalHistorySince}` : ''}`;
        if (s.onMedication === 'Yes' && s.medications) detail += `, meds: ${s.medications}`;
        if (s.drugReaction === 'Yes') detail += `, had drug reaction`;
        return detail;
      }).join('; ');
      siblingsText += `: ${siblingDetails}`;
    } else {
      // Legacy sibling fields
      if (history.siblingsAlive) siblingsText += `, status: ${history.siblingsAlive}`;
      if (history.siblingsDeceasedCause) siblingsText += ` (cause: ${history.siblingsDeceasedCause})`;
      if (history.siblingsMedicalHistory?.length && !history.siblingsMedicalHistory.includes("None")) siblingsText += `, conditions: ${history.siblingsMedicalHistory.join(', ')}`;
    }
    familyInfo.push(siblingsText);
  }
  
  // Children
  if (history.childrenCount && history.childrenCount > 0) {
    let childrenText = `Children: ${history.childrenCount}`;
    if (history.childrenAgeGender) childrenText += ` (${history.childrenAgeGender})`;
    if (history.childrenHasSignificantHistory === "Yes" && history.childrenMedicalHistory?.length) {
      childrenText += `, conditions: ${history.childrenMedicalHistory.join(', ')}${history.childrenMedicalHistoryOther ? ` (${history.childrenMedicalHistoryOther})` : ''}`;
    }
    familyInfo.push(childrenText);
  }
  
  // Grandparents
  const grandparentInfo: string[] = [];
  if (history.maternalGrandmotherAlive) grandparentInfo.push(`Maternal grandmother: ${history.maternalGrandmotherAlive}${history.maternalGrandmotherCauseOfDeath ? ` (cause: ${history.maternalGrandmotherCauseOfDeath})` : ''}${history.maternalGrandmotherMedicalHistory?.length ? `, conditions: ${history.maternalGrandmotherMedicalHistory.join(', ')}` : ''}`);
  if (history.maternalGrandfatherAlive) grandparentInfo.push(`Maternal grandfather: ${history.maternalGrandfatherAlive}${history.maternalGrandfatherCauseOfDeath ? ` (cause: ${history.maternalGrandfatherCauseOfDeath})` : ''}${history.maternalGrandfatherMedicalHistory?.length ? `, conditions: ${history.maternalGrandfatherMedicalHistory.join(', ')}` : ''}`);
  if (history.paternalGrandmotherAlive) grandparentInfo.push(`Paternal grandmother: ${history.paternalGrandmotherAlive}${history.paternalGrandmotherCauseOfDeath ? ` (cause: ${history.paternalGrandmotherCauseOfDeath})` : ''}${history.paternalGrandmotherMedicalHistory?.length ? `, conditions: ${history.paternalGrandmotherMedicalHistory.join(', ')}` : ''}`);
  if (history.paternalGrandfatherAlive) grandparentInfo.push(`Paternal grandfather: ${history.paternalGrandfatherAlive}${history.paternalGrandfatherCauseOfDeath ? ` (cause: ${history.paternalGrandfatherCauseOfDeath})` : ''}${history.paternalGrandfatherMedicalHistory?.length ? `, conditions: ${history.paternalGrandfatherMedicalHistory.join(', ')}` : ''}`);
  if (grandparentInfo.length) familyInfo.push(`Grandparents: ${grandparentInfo.join('; ')}`);
  
  // Uncles
  if (history.maternalUnclesCount && history.maternalUnclesCount > 0) familyInfo.push(`Maternal uncles: ${history.maternalUnclesCount}${history.maternalUnclesMedicalHistory?.length ? `, conditions: ${history.maternalUnclesMedicalHistory.join(', ')}` : ''}`);
  if (history.paternalUnclesCount && history.paternalUnclesCount > 0) familyInfo.push(`Paternal uncles: ${history.paternalUnclesCount}${history.paternalUnclesMedicalHistory?.length ? `, conditions: ${history.paternalUnclesMedicalHistory.join(', ')}` : ''}`);
  
  // Aunts
  if (history.maternalAuntsCount && history.maternalAuntsCount > 0) familyInfo.push(`Maternal aunts: ${history.maternalAuntsCount}${history.maternalAuntsMedicalHistory?.length ? `, conditions: ${history.maternalAuntsMedicalHistory.join(', ')}` : ''}`);
  if (history.paternalAuntsCount && history.paternalAuntsCount > 0) familyInfo.push(`Paternal aunts: ${history.paternalAuntsCount}${history.paternalAuntsMedicalHistory?.length ? `, conditions: ${history.paternalAuntsMedicalHistory.join(', ')}` : ''}`);
  
  // Cousins
  if (history.maternalCousinsCount && history.maternalCousinsCount > 0) familyInfo.push(`Maternal cousins: ${history.maternalCousinsCount}${history.maternalCousinsMedicalHistory?.length ? `, conditions: ${history.maternalCousinsMedicalHistory.join(', ')}` : ''}`);
  if (history.paternalCousinsCount && history.paternalCousinsCount > 0) familyInfo.push(`Paternal cousins: ${history.paternalCousinsCount}${history.paternalCousinsMedicalHistory?.length ? `, conditions: ${history.paternalCousinsMedicalHistory.join(', ')}` : ''}`);
  
  // Spouse & In-laws
  if (history.hasSpouse === "Yes") {
    let spouseText = `Spouse: ${history.spouseAlive || 'present'}`;
    if (history.spouseAlive === "Dead" && history.spouseCauseOfDeath) spouseText += ` (cause: ${history.spouseCauseOfDeath})`;
    if (history.spouseMedicalHistory?.length && !history.spouseMedicalHistory.includes("None")) spouseText += `, conditions: ${history.spouseMedicalHistory.join(', ')}`;
    familyInfo.push(spouseText);
  }
  if (history.inLawsSignificantHistory === "Yes" && history.inLawsMedicalHistory?.length) {
    familyInfo.push(`In-laws conditions: ${history.inLawsMedicalHistory.join(', ')}`);
  }
  
  // Other family history
  if (history.familyPsychiatricHistory === "Yes") familyInfo.push(`Family psychiatric history: Yes`);
  if (history.familyUntimelyDeath === "Yes") familyInfo.push(`Untimely death in family: Yes${history.familyDeathType ? ` (${history.familyDeathType})` : ''}`);
  
  if (familyInfo.length) sections.push(`[FAMILY HISTORY] ${familyInfo.join('. ')}`);
  
  // === SUBSTANCE USE / ADDICTION HISTORY - COMPREHENSIVE ===
  const substanceInfo: string[] = [];
  if (history.substanceUseStatus && history.substanceUseStatus !== "Never used") {
    substanceInfo.push(`Status: ${history.substanceUseStatus}`);
    if (history.substancesUsed?.length) {
      substanceInfo.push(`Substances: ${history.substancesUsed.join(', ')}${history.substanceOther ? ` (${history.substanceOther})` : ''}`);
      // Per-substance details
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
    // Legacy fields
    if (history.substanceFrequency) substanceInfo.push(`Frequency: ${history.substanceFrequency}`);
    if (history.substanceStartAge) substanceInfo.push(`Started at age: ${history.substanceStartAge}`);
    if (history.substanceUseYears) substanceInfo.push(`Duration: ${history.substanceUseYears} years`);
    if (history.substanceWithdrawalSymptoms?.length) substanceInfo.push(`Withdrawal symptoms: ${history.substanceWithdrawalSymptoms.join(', ')}`);
    if (history.substanceTreatmentHistory?.length) substanceInfo.push(`Treatment history: ${history.substanceTreatmentHistory.join(', ')}`);
    if (history.substanceNeedHelp) substanceInfo.push(`Needs help: ${history.substanceNeedHelp}`);
    if (history.substanceAdditionalInfo) substanceInfo.push(`Additional info: ${history.substanceAdditionalInfo}`);
  }
  // Legacy addiction fields
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
  
  // === OCCUPATION HISTORY - COMPREHENSIVE ===
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
  
  // === MENSTRUAL & OBSTETRIC HISTORY - COMPREHENSIVE ===
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
    
    // First birth details
    if (history.firstBirthGender) {
      let firstBirth = `First birth: ${history.firstBirthGender}`;
      if (history.firstBirthWeight) firstBirth += `, ${history.firstBirthWeight}`;
      if (history.firstBirthDeliveryType) firstBirth += `, ${history.firstBirthDeliveryType}${history.firstBirthDeliveryIndication ? ` (${history.firstBirthDeliveryIndication})` : ''}`;
      if (history.firstBirthGestationalAge) firstBirth += `, ${history.firstBirthGestationalAge} weeks`;
      if (history.firstBirthCriedAfter) firstBirth += `, cried: ${history.firstBirthCriedAfter}`;
      if (history.firstBirthNICU === "Yes") firstBirth += `, NICU: ${history.firstBirthNICUDays || '?'} days${history.firstBirthNICUCause ? ` (${history.firstBirthNICUCause})` : ''}`;
      obstetricInfo.push(firstBirth);
    }
    
    // Second birth details
    if (history.secondBirthGender) {
      let secondBirth = `Second birth: ${history.secondBirthGender}`;
      if (history.secondBirthWeight) secondBirth += `, ${history.secondBirthWeight}`;
      if (history.secondBirthDeliveryType) secondBirth += `, ${history.secondBirthDeliveryType}${history.secondBirthDeliveryIndication ? ` (${history.secondBirthDeliveryIndication})` : ''}`;
      if (history.secondBirthGestationalAge) secondBirth += `, ${history.secondBirthGestationalAge} weeks`;
      if (history.secondBirthNICU === "Yes") secondBirth += `, NICU: ${history.secondBirthNICUDays || '?'} days`;
      obstetricInfo.push(secondBirth);
    }
    
    // Third birth details
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
  
  // === ENVIRONMENTAL HISTORY - COMPREHENSIVE ===
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
  
  // === VACCINATION HISTORY - COMPREHENSIVE ===
  const vaccineInfo: string[] = [];
  if (history.everVaccinated) vaccineInfo.push(`Vaccinated: ${history.everVaccinated}`);
  if (history.vaccinationCard) vaccineInfo.push(`Has vaccination card: ${history.vaccinationCard}`);
  if (history.childhoodVaccines?.length) vaccineInfo.push(`Childhood vaccines: ${history.childhoodVaccines.join(', ')}`);
  if (history.adultVaccines?.length && !history.adultVaccines.includes("None")) {
    vaccineInfo.push(`Adult vaccines: ${history.adultVaccines.join(', ')}${history.adultVaccinesOther ? ` (${history.adultVaccinesOther})` : ''}`);
    // Per-vaccine details
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
  
  // === TRAVEL HISTORY - COMPREHENSIVE ===
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
  
  // === PSYCHOSOCIAL HISTORY - COMPREHENSIVE ===
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
  
  // === VISION HISTORY - COMPREHENSIVE ===
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
  
  // === LIFESTYLE & GENERAL ===
  const lifestyleInfo: string[] = [];
  if (history.bowelHabits) lifestyleInfo.push(`Bowel habits: ${history.bowelHabits}`);
  if (history.hydration) lifestyleInfo.push(`Hydration: ${history.hydration}`);
  if (history.screenTime || history.screenTimePerDay) lifestyleInfo.push(`Screen time: ${history.screenTimePerDay || history.screenTime}`);
  if (history.fitnessHistory) lifestyleInfo.push(`Fitness level: ${history.fitnessHistory}`);
  if (history.physicalActivity) lifestyleInfo.push(`Physical activity: ${history.physicalActivity}`);
  if (history.testHistory) lifestyleInfo.push(`Recent tests: ${history.testHistory}`);
  if (lifestyleInfo.length) sections.push(`[LIFESTYLE] ${lifestyleInfo.join('. ')}`);
  
  return sections.length > 0 ? sections.join(' || ') : "No detailed medical history available";
};

// Helper to get user from local storage
const getStoredUser = () => {
  const stored = localStorage.getItem("med_user");
  return stored ? JSON.parse(stored) as UserType : null;
};

// Onboarding Steps
const STEPS = ["name", "age", "gender", "bloodGroup", "height", "weight", "place", "occupation", "qualification"] as const;
type Step = typeof STEPS[number];

export default function Assistant() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [currentUser, setCurrentUser] = useState<UserType | null>(getStoredUser());
  const [onboardingStep, setOnboardingStep] = useState<Step | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage | null>(null);
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [symptomaticTurnCount, setSymptomaticTurnCount] = useState(0);
  const [showReportChat, setShowReportChat] = useState(false);
  const [selectedReportIds, setSelectedReportIds] = useState<number[]>([]);
  const [reportMessages, setReportMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([]);
  const [reportProcessing, setReportProcessing] = useState(false);
  const [reportInputValue, setReportInputValue] = useState("");
  const [isFirstReportMessage, setIsFirstReportMessage] = useState(true);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [reportFollowUpQuestions, setReportFollowUpQuestions] = useState<string[]>([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [userSelectorTarget, setUserSelectorTarget] = useState<'reports' | 'check' | null>(null);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberAge, setNewMemberAge] = useState("");
  const [newMemberGender, setNewMemberGender] = useState("");
  const [newMemberBloodGroup, setNewMemberBloodGroup] = useState("");
  const [newMemberHeight, setNewMemberHeight] = useState("");
  const [newMemberWeight, setNewMemberWeight] = useState("");
  const [newMemberPlace, setNewMemberPlace] = useState("");
  const [newMemberOccupation, setNewMemberOccupation] = useState("");
  const [newMemberQualification, setNewMemberQualification] = useState("");

  // Hooks
  const { data: refreshedUser } = useUserById(currentUser?.id ?? null);
  const { data: records = [] } = useMedicalRecords(currentUser?.id);
  const { data: reports = [] } = useMedicalReports(currentUser?.id);
  const updateUser = useUpdateUser();
  const aiChat = useAiChat();
  const createRecord = useCreateRecord();
  const translate = useTranslate();
  const { data: familyMembers = [] } = useFamilyMembers(currentUser?.phoneNumber ?? null);
  const createFamilyMember = useCreateFamilyMember();
  
  // Voice Hook - pass selected language for proper recognition
  const { 
    transcript, 
    listening, 
    startListening, 
    stopListening, 
    resetTranscript, 
    speak,
    speakSentences,
    stopSpeaking,
    setAutoListen,
    browserSupportsSpeechRecognition 
  } = useSpeech(selectedLanguage || 'en');

  // Streaming display state
  const [streamingText, setStreamingText] = useState('');
  const streamTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Split text into sentences for TTS chaining
  const splitIntoSentences = (text: string): string[] => {
    const stripped = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#+\s*/g, '')
      .replace(/`[^`]*`/g, '')
      .replace(/\n+/g, ' ')
      .trim();
    const parts = stripped.split(/(?<=[.!?])\s+/);
    const merged: string[] = [];
    let buf = '';
    for (const p of parts) {
      buf = buf ? buf + ' ' + p : p;
      if (buf.length >= 60) { merged.push(buf.trim()); buf = ''; }
    }
    if (buf.trim()) merged.push(buf.trim());
    return merged.filter(Boolean);
  };

  // Animate response word-by-word and speak sentence-by-sentence
  const animateResponse = (
    fullText: string,
    lang: string,
    onCommit: (text: string) => void
  ) => {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    setStreamingText('');

    const sentences = splitIntoSentences(fullText);

    const words = fullText.split(' ');
    let idx = 0;
    const WORD_INTERVAL = 50;

    const startWordAnimation = () => {
      streamTimerRef.current = setInterval(() => {
        idx++;
        if (idx >= words.length) {
          clearInterval(streamTimerRef.current!);
          streamTimerRef.current = null;
          setStreamingText('');
          onCommit(fullText);
        } else {
          setStreamingText(words.slice(0, idx).join(' '));
        }
      }, WORD_INTERVAL);
    };

    // Start TTS first; delay word animation so voice and text start together
    speakSentences(sentences, lang);
    setTimeout(startWordAnimation, 400);
  };

  // Scroll refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reportMessagesEndRef = useRef<HTMLDivElement>(null);

  // Update local user when refreshed from API
  useEffect(() => {
    if (refreshedUser) {
      setCurrentUser(refreshedUser);
      localStorage.setItem("med_user", JSON.stringify(refreshedUser));
    }
  }, [refreshedUser]);

  // Pre-warm Kaggle session in background when user loads or switches profile
  useEffect(() => {
    if (!currentUser?.id) return;
    const patientHistory = currentUser.patientMedicalHistory as PatientMedicalHistory | null;
    const detailedHistory = formatMedicalHistoryForAI(patientHistory);
    const context = `Patient Profile: Name: ${currentUser.name}, Age: ${currentUser.age}, Gender: ${currentUser.gender || 'Not specified'}, Blood Group: ${currentUser.bloodGroup}, Height: ${currentUser.height || 'Not specified'}, Weight: ${currentUser.weight || 'Not specified'}, Place: ${currentUser.place || 'Not specified'}, Occupation: ${currentUser.occupation || 'Not specified'}.\n\nDetailed Medical History: ${detailedHistory}.\n\nSummary: ${currentUser.medicalHistory || 'None'}`;
    fetch(api.ai.warmSession.path, {
      method: api.ai.warmSession.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.id, mode: 'symptomatic', context }),
      credentials: "include",
    }).then(r => r.json()).then(data => {
      if (data.success) console.log("[Assistant] Session pre-warmed for user", currentUser.id);
    }).catch(err => console.warn("[Assistant] Pre-warm failed:", err));
  }, [currentUser?.id]);

  // Check Onboarding Status
  useEffect(() => {
    if (!currentUser) {
      setLocation("/");
      return;
    }

    const isFamilyMember = currentUser.isPrimary !== 1;

    if (!currentUser.name) {
      if (onboardingStep !== "name") {
        setOnboardingStep("name");
        speak("Welcome! I noticed we haven't met properly yet. What is your name?");
      }
    } else if (!currentUser.age) {
      if (onboardingStep !== "age") {
        setOnboardingStep("age");
        speak(isFamilyMember ? `Hi ${currentUser.name}! How old are you?` : `Nice to meet you ${currentUser.name}. How old are you?`);
      }
    } else if (!currentUser.gender) {
      if (onboardingStep !== "gender") {
        setOnboardingStep("gender");
        speak("What is your gender? Male, Female, or Other?");
      }
    } else if (!isFamilyMember && !currentUser.bloodGroup) {
      if (onboardingStep !== "bloodGroup") {
        setOnboardingStep("bloodGroup");
        speak("What is your blood group?");
      }
    } else if (!isFamilyMember && !currentUser.height) {
      if (onboardingStep !== "height") {
        setOnboardingStep("height");
        speak("What is your height?");
      }
    } else if (!isFamilyMember && !currentUser.weight) {
      if (onboardingStep !== "weight") {
        setOnboardingStep("weight");
        speak("What is your weight?");
      }
    } else if (!isFamilyMember && !currentUser.place) {
      if (onboardingStep !== "place") {
        setOnboardingStep("place");
        speak("Where do you live?");
      }
    } else if (!isFamilyMember && !currentUser.occupation) {
      if (onboardingStep !== "occupation") {
        setOnboardingStep("occupation");
        speak("What is your occupation?");
      }
    } else if (!isFamilyMember && !currentUser.qualification) {
      if (onboardingStep !== "qualification") {
        setOnboardingStep("qualification");
        speak("What is your highest qualification?");
      }
    } else {
      setOnboardingStep(null);
      if (!selectedLanguage && !showLanguageSelection) {
        setShowLanguageSelection(true);
        setAutoListen(false);
        stopListening();
      }
    }
  }, [currentUser, speak, setLocation, messages.length, onboardingStep, selectedLanguage, showLanguageSelection, setAutoListen, stopListening]);

  // Handle language selection
  const handleLanguageSelect = (lang: SupportedLanguage) => {
    setSelectedLanguage(lang);
    setShowLanguageSelection(false);
    setAutoListen(true);
    
    const welcomeMessages: Record<SupportedLanguage, string> = {
      en: `Hello ${currentUser?.name}. I'm ready to help. How are you feeling today?`,
      te: `హలో ${currentUser?.name}. మీకు సహాయం చేయడానికి నేను సిద్ధంగా ఉన్నాను. ఈ రోజు మీరు ఎలా అనుభవిస్తున్నారు?`,
      hi: `नमस्ते ${currentUser?.name}. मैं आपकी मदद करने के लिए तैयार हूं। आज आप कैसा महसूस कर रहे हैं?`
    };
    
    const welcome = welcomeMessages[lang];
    // Pass language explicitly since state hasn't updated yet
    speak(welcome, lang);
    setMessages([{ role: 'assistant', text: welcome }]);
  };

  // Track last transcript for detecting speech pauses
  const lastTranscriptRef = useRef<string>("");
  const speechPauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle Transcript Updates - with continuous mode, detect pause to auto-stop
  useEffect(() => {
    console.log("[Voice] transcript:", transcript, "listening:", listening, "lang:", selectedLanguage);
    
    // Clear any existing pause timeout
    if (speechPauseTimeoutRef.current) {
      clearTimeout(speechPauseTimeoutRef.current);
      speechPauseTimeoutRef.current = null;
    }
    
    // If we have a transcript and are still listening, set up auto-stop on pause
    if (transcript && listening) {
      lastTranscriptRef.current = transcript;
      // Stop listening after 1.5 seconds of no new speech
      speechPauseTimeoutRef.current = setTimeout(() => {
        console.log("[Voice] Speech pause detected, stopping and processing");
        stopListening();
      }, 1500);
    }
    
    if (transcript && !listening) {
      console.log("[Voice] Processing transcript:", transcript);
      const timeout = setTimeout(() => {
        if (showReportChat && selectedReportIds.length > 0) {
          handleReportChatSubmit(transcript);
        } else {
          handleInputSubmit(transcript);
        }
        resetTranscript();
        lastTranscriptRef.current = "";
      }, 300);
      return () => clearTimeout(timeout);
    }
    
    return () => {
      if (speechPauseTimeoutRef.current) {
        clearTimeout(speechPauseTimeoutRef.current);
      }
    };
  }, [transcript, listening, stopListening]);

  // Ensure speech synthesis is cancelled when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      // stopListening is available from useSpeech hook, not SpeechRecognition global
      stopListening();
    };
  }, [stopListening]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    reportMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [reportMessages]);

  useEffect(() => {
    if (showReportChat) {
      setAutoListen(false);
      window.speechSynthesis?.cancel();
      stopListening();
    } else {
      setAutoListen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showReportChat]);

  const handleInputSubmit = async (text: string) => {
    if (!text.trim() || !currentUser) return;
    setInputValue("");
    setFollowUpQuestions([]);
    setIsProcessing(true);

    // --- ONBOARDING LOGIC ---
    if (onboardingStep) {
      // Add user message to UI temporarily for feedback (optional) or just process it
      
      const updates: any = {};
      
      if (onboardingStep === "name") updates.name = text;
      else if (onboardingStep === "age") updates.age = parseInt(text.replace(/\D/g, '')) || 0;
      else if (onboardingStep === "gender") updates.gender = text;
      else if (onboardingStep === "bloodGroup") updates.bloodGroup = text;
      else if (onboardingStep === "height") updates.height = text;
      else if (onboardingStep === "weight") updates.weight = text;
      else if (onboardingStep === "place") updates.place = text;
      else if (onboardingStep === "occupation") updates.occupation = text;
      else if (onboardingStep === "qualification") updates.qualification = text;

      try {
        const result = await updateUser.mutateAsync({ 
          id: currentUser.id, 
          updates,
          phoneNumber: currentUser.phoneNumber 
        });
        // Update local state immediately with the response
        setCurrentUser(result.data);
        localStorage.setItem("med_user", JSON.stringify(result.data));
      } catch (err) {
        speak("I didn't quite catch that properly. Could you repeat?");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // --- MEDICAL CHAT LOGIC ---
    // 1. Add User Message (in original language)
    const newMessages = [...messages, { role: 'user' as const, text }];
    setMessages(newMessages);

    // 2. Translate user input to English if needed
    let messageForAI = text;
    if (selectedLanguage && selectedLanguage !== "en") {
      try {
        const translated = await translate.mutateAsync({
          text,
          fromLang: selectedLanguage,
          toLang: "en"
        });
        messageForAI = translated.translatedText;
      } catch (err) {
        console.error("Translation error:", err);
      }
    }

    // 3. Send to AI — symptomatic triage mode with medical history
    try {
      const patientHistory = currentUser.patientMedicalHistory as PatientMedicalHistory | null;
      const detailedHistory = formatMedicalHistoryForAI(patientHistory);

      const context = `Patient Profile: Name: ${currentUser.name}, Age: ${currentUser.age}, Gender: ${currentUser.gender || 'Not specified'}, Blood Group: ${currentUser.bloodGroup}, Height: ${currentUser.height || 'Not specified'}, Weight: ${currentUser.weight || 'Not specified'}, Place: ${currentUser.place || 'Not specified'}, Occupation: ${currentUser.occupation || 'Not specified'}.\n\nDetailed Medical History: ${detailedHistory}.\n\nSummary: ${currentUser.medicalHistory || 'None'}`;

      const { response, followUpQuestions: apiFollowUps } = await aiChat.mutateAsync({ 
        message: messageForAI, 
        context: isFirstMessage ? context : undefined,
        userId: currentUser.id,
        isFirstMessage: isFirstMessage,
        mode: 'symptomatic',
        //turnCount: symptomaticTurnCount,
      });
      
      if (isFirstMessage) {
        setIsFirstMessage(false);
      }
      setSymptomaticTurnCount(prev => prev + 1);

      let responseInUserLang = response;
      if (selectedLanguage && selectedLanguage !== "en") {
        try {
          const translated = await translate.mutateAsync({
            text: response,
            fromLang: "en",
            toLang: selectedLanguage
          });
          responseInUserLang = translated.translatedText;
        } catch (err) {
          console.error("Translation error:", err);
        }
      }

      const committed = [...newMessages];
      animateResponse(responseInUserLang, selectedLanguage || 'en', (text) => {
        setMessages([...committed, { role: 'assistant', text }]);
      });
      setFollowUpQuestions(apiFollowUps || []);

      createRecord.mutate({
        userId: currentUser.id,
        symptom: text,
        diagnosis: responseInUserLang,
        fullConversation: newMessages
      });

    } catch (error: any) {
      console.error("[Assistant] Chat error:", error, "| name:", error?.name, "| message:", error?.message);
      const errorMessages: Record<SupportedLanguage, string> = {
        en: "I'm having trouble connecting to the medical database right now.",
        te: "నేను ప్రస్తుతం వైద్య డేటాబేస్‌కు కనెక్ట్ చేయడంలో సమస్య ఎదుర్కొంటున్నాను.",
        hi: "मुझे अभी मेडिकल डेटाबेस से कनेक्ट करने में समस्या हो रही है।"
      };
      const errText = errorMessages[selectedLanguage || "en"];
      setMessages([...newMessages, { role: 'assistant', text: errText }]);
      speak(errText, selectedLanguage || 'en');
    } finally {
      setIsProcessing(false);
    }
  };

  const sendChatFollowUp = (question: string, mode: 'symptomatic' | 'report') => {
    if (mode === 'report') {
      setReportFollowUpQuestions([]);
      setReportInputValue(question);
      setTimeout(() => handleReportChatSubmit(question), 0);
    } else {
      setFollowUpQuestions([]);
      setInputValue(question);
      setTimeout(() => handleInputSubmit(question), 0);
    }
  };

  const toggleListening = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("med_user");
    setLocation("/");
  };

  const handleSwitchProfile = (user: UserType) => {
    localStorage.setItem("med_user", JSON.stringify(user));
    setCurrentUser(user);
    setShowProfileDropdown(false);
    setSidebarOpen(false);
    setMessages([]);
    setReportMessages([]);
    setIsFirstMessage(true);
    setSymptomaticTurnCount(0);
    setIsFirstReportMessage(true);
    setShowReportChat(false);
    setSelectedReportIds([]);
    setSelectedLanguage(null);
    setShowLanguageSelection(false);
    setOnboardingStep(null);
    queryClient.invalidateQueries({ queryKey: [api.users.getById.path, user.id] });
    queryClient.invalidateQueries({ queryKey: [api.records.list.path] });
    queryClient.invalidateQueries({ queryKey: [api.reports.list.path] });
    toast({ title: "Profile switched", description: `Now viewing ${user.name || "Patient"}'s profile` });
  };

  const resetMemberForm = () => {
    setNewMemberName("");
    setNewMemberAge("");
    setNewMemberGender("");
    setNewMemberBloodGroup("");
    setNewMemberHeight("");
    setNewMemberWeight("");
    setNewMemberPlace("");
    setNewMemberOccupation("");
    setNewMemberQualification("");
  };

  const handleAddFamilyMember = () => {
    if (!newMemberName.trim() || !currentUser) return;
    createFamilyMember.mutate({
      phoneNumber: currentUser.phoneNumber,
      name: newMemberName.trim(),
      age: newMemberAge ? parseInt(newMemberAge) : undefined,
      gender: newMemberGender || undefined,
      bloodGroup: newMemberBloodGroup || undefined,
      height: newMemberHeight || undefined,
      weight: newMemberWeight || undefined,
      place: newMemberPlace || undefined,
      occupation: newMemberOccupation || undefined,
      qualification: newMemberQualification || undefined,
      parentUserId: currentUser.isPrimary === 1 ? currentUser.id : (currentUser.parentUserId || currentUser.id),
    }, {
      onSuccess: (newUser) => {
        setShowAddMemberDialog(false);
        resetMemberForm();
        handleSwitchProfile(newUser);
        toast({ title: "Family member added", description: `${newUser.name} has been added successfully` });
      },
      onError: () => {
        toast({ title: "Error", description: "Could not add family member", variant: "destructive" });
      },
    });
  };

  const handleNavigateWithUserSelect = (target: 'reports' | 'check') => {
    setSidebarOpen(false);
    if (familyMembers.length > 1) {
      setUserSelectorTarget(target);
      setShowUserSelector(true);
    } else {
      if (target === 'reports') setLocation(`/reports/${currentUser?.id}`);
      else setLocation('/symptom-check');
    }
  };

  const handleUserSelectorConfirm = (member: UserType) => {
    handleSwitchProfile(member);
    setShowUserSelector(false);
    if (userSelectorTarget === 'reports') setLocation(`/reports/${member.id}`);
    else if (userSelectorTarget === 'check') setLocation('/symptom-check');
    setUserSelectorTarget(null);
  };

  const selectedReports = reports.filter(r => selectedReportIds.includes(r.id));

  const toggleReportSelection = (reportId: number) => {
    setSelectedReportIds(prev =>
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const confirmReportSelection = () => {
    if (selectedReportIds.length === 0) return;
    const names = selectedReports.map(r => `"${r.fileName}"`).join(', ');
    const welcomeMsg = selectedReportIds.length === 1
      ? `Selected ${names}. Ask me anything about this report — values, meanings, what's normal or abnormal.`
      : `Selected ${selectedReportIds.length} reports: ${names}. Ask me anything about these reports — I can compare values, highlight differences, and explain what's normal or abnormal.`;
    setReportMessages([{ role: 'assistant', text: welcomeMsg }]);
    setIsFirstReportMessage(true);
  };

  const handleReportChatSubmit = async (text: string) => {
    if (!text.trim() || !currentUser || selectedReports.length === 0) return;
    setReportInputValue("");
    setReportFollowUpQuestions([]);
    resetTranscript();

    const newMessages = [...reportMessages, { role: 'user' as const, text }];
    setReportMessages(newMessages);
    setReportProcessing(true);

    let messageForAI = text;
    if (selectedLanguage && selectedLanguage !== "en") {
      try {
        const translated = await translate.mutateAsync({
          text,
          fromLang: selectedLanguage,
          toLang: "en"
        });
        messageForAI = translated.translatedText;
      } catch (err) {
        console.error("Translation error:", err);
      }
    }

    try {
      const reportContext = selectedReports.map((report, idx) => {
        const reportDate = report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Unknown date';
        return `[REPORT ${idx + 1}: ${report.reportType}] File: ${report.fileName}, Date: ${reportDate}, Risk Level: ${report.riskLevel || 'unknown'}.\nAI Analysis:\n${report.analysis || 'Not yet analyzed'}`;
      }).join('\n\n---\n\n');

      const { response, followUpQuestions: reportApiFollowUps } = await aiChat.mutateAsync({
        message: messageForAI,
        context: undefined,
        reportContext,
        userId: currentUser.id,
        isFirstMessage: isFirstReportMessage,
        mode: 'report-analysis'
      });

      if (isFirstReportMessage) {
        setIsFirstReportMessage(false);
      }

      let responseInUserLang = response;
      if (selectedLanguage && selectedLanguage !== "en") {
        try {
          const translated = await translate.mutateAsync({
            text: response,
            fromLang: "en",
            toLang: selectedLanguage
          });
          responseInUserLang = translated.translatedText;
        } catch (err) {
          console.error("Translation error:", err);
        }
      }

      const committed = [...newMessages];
      animateResponse(responseInUserLang, selectedLanguage || 'en', (text) => {
        setReportMessages([...committed, { role: 'assistant', text }]);
        setReportFollowUpQuestions(reportApiFollowUps || []);
      });
    } catch (error) {
      const errText = "I'm having trouble analyzing the reports right now. Please try again.";
      setReportMessages([...newMessages, { role: 'assistant', text: errText }]);
      speak(errText, selectedLanguage || 'en');
    } finally {
      setReportProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
              data-testid="sidebar-backdrop"
            />
            {/* Sidebar */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-72 bg-white z-50 shadow-2xl flex flex-col"
              data-testid="sidebar"
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-slate-900">SpeciGO</h2>
                    <p className="text-xs text-slate-500">Medical Assistant</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSidebarOpen(false)}
                  data-testid="button-close-sidebar"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* User Info with Profile Switcher */}
              {currentUser && (
                <div className="border-b border-slate-200 bg-slate-50">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-slate-100 transition-colors"
                    data-testid="button-sidebar-profile-switcher"
                  >
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-slate-900">{currentUser.name || "Patient"}</p>
                      <p className="text-sm text-slate-500">{currentUser.bloodGroup ? `${currentUser.bloodGroup} | ` : ""}Age: {currentUser.age || "—"}</p>
                    </div>
                    {familyMembers.length > 0 && <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProfileDropdown ? "rotate-180" : ""}`} />}
                  </button>

                  <AnimatePresence>
                    {showProfileDropdown && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-slate-200"
                      >
                        <div className="bg-white max-h-48 overflow-y-auto">
                          {familyMembers.map((member: any) => (
                            <button
                              key={member.id}
                              onClick={() => handleSwitchProfile(member)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors ${member.id === currentUser?.id ? "bg-primary/5" : ""}`}
                              data-testid={`profile-switch-${member.id}`}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${member.id === currentUser?.id ? "bg-primary text-white" : "bg-slate-200 text-slate-600"}`}>
                                <User className="w-4 h-4" />
                              </div>
                              <div className="text-left flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${member.id === currentUser?.id ? "text-primary" : "text-slate-700"}`}>{member.name || "Patient"}</p>
                                <p className="text-xs text-slate-400">Age: {member.age || "—"}</p>
                              </div>
                              {member.id === currentUser?.id && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => { setShowProfileDropdown(false); setShowAddMemberDialog(true); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 border-t border-slate-100 hover:bg-teal-50 text-teal-700 transition-colors"
                          data-testid="button-add-member-sidebar"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span className="text-sm font-medium">Add Family Member</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Navigation Items */}
              <nav className="flex-1 p-4 space-y-2">
                <button
                  onClick={() => { setSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-medium"
                  data-testid="nav-assistant"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Medical Assistant</span>
                </button>

                {selectedLanguage && (
                  <button
                    onClick={() => { setSidebarOpen(false); setShowLanguageSelection(true); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
                    data-testid="nav-language"
                  >
                    <Globe className="w-5 h-5" />
                    <span>Change Language</span>
                    <span className="ml-auto text-xs bg-slate-200 px-2 py-1 rounded">{languageNames[selectedLanguage]}</span>
                  </button>
                )}

                <button
                  onClick={() => { setSidebarOpen(false); setLocation(`/profile/${currentUser?.id}`); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
                  data-testid="nav-profile"
                >
                  <User className="w-5 h-5" />
                  <span>Personal Details</span>
                </button>

                <button
                  onClick={() => { setSidebarOpen(false); setLocation(`/records/${currentUser?.id}`); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
                  data-testid="nav-records"
                >
                  <FileText className="w-5 h-5" />
                  <span>Consultation History</span>
                </button>

                <button
                  onClick={() => handleNavigateWithUserSelect('reports')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
                  data-testid="nav-reports"
                >
                  <ClipboardList className="w-5 h-5" />
                  <span>Lab Reports</span>
                </button>

                <button
                  onClick={() => { setSidebarOpen(false); setLocation(`/medical-history/${currentUser?.id}`); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
                  data-testid="nav-medical-history"
                >
                  <HeartPulse className="w-5 h-5" />
                  <span>Medical History</span>
                </button>

                <button
                  onClick={() => { setSidebarOpen(false); setShowReportChat(true); window.speechSynthesis?.cancel(); if (listening) stopListening(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
                  data-testid="nav-report-chat"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Chat with Reports</span>
                </button>

                <button
                  onClick={() => handleNavigateWithUserSelect('check')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
                  data-testid="nav-symptom-check"
                >
                  <Check className="w-5 h-5" />
                  <span>Check</span>
                </button>

                <button
                  onClick={() => { setSidebarOpen(false); setLocation('/diet-planner'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
                  data-testid="nav-diet-planner"
                >
                  <Salad className="w-5 h-5" />
                  <span>Diet Planner</span>
                </button>

              </nav>

              {/* Logout Button */}
              <div className="p-4 border-t border-slate-200">
                <button
                  onClick={() => { setSidebarOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                  data-testid="nav-logout"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* User Selector Modal */}
      <AnimatePresence>
        {showUserSelector && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setShowUserSelector(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Who is this for?</h2>
                      <p className="text-sm text-slate-500">Select the person to continue</p>
                    </div>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto py-2">
                  {familyMembers.map((member: any) => (
                    <button
                      key={member.id}
                      onClick={() => handleUserSelectorConfirm(member)}
                      className={`w-full flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors ${member.id === currentUser?.id ? 'bg-primary/5' : ''}`}
                      data-testid={`user-selector-${member.id}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${member.id === currentUser?.id ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'}`}>
                        <User className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className={`font-semibold truncate ${member.id === currentUser?.id ? 'text-primary' : 'text-slate-800'}`}>{member.name || 'Patient'}</p>
                        <p className="text-sm text-slate-400">
                          {[member.age ? `Age ${member.age}` : null, member.bloodGroup, member.gender].filter(Boolean).join(' · ') || 'No details'}
                        </p>
                      </div>
                      {member.id === currentUser?.id && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="px-6 py-4 border-t border-slate-100">
                  <button
                    onClick={() => setShowUserSelector(false)}
                    className="w-full py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    data-testid="button-user-selector-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="relative z-10 px-4 py-3 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="flex items-center gap-3">
          {/* Hamburger Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(true)}
            data-testid="button-menu"
          >
            <Menu className="w-6 h-6 text-slate-700" />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-slate-900 leading-tight">SpeciGO</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 hidden sm:block">{currentUser.name || "Patient"}</span>
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col max-w-3xl mx-auto w-full">
        
        {/* Language Selection Overlay */}
        <AnimatePresence>
          {showLanguageSelection && !onboardingStep && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-50/90 backdrop-blur-sm"
            >
              <div className="w-full max-w-xs space-y-5 text-center">
                <div className="w-14 h-14 bg-primary rounded-xl mx-auto flex items-center justify-center shadow-lg shadow-primary/20">
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Select Language</h2>
                  <p className="text-sm text-slate-500 mt-1">Choose your preferred language</p>
                </div>
                
                <div className="flex flex-col gap-2">
                  {(["en", "te", "hi"] as SupportedLanguage[]).map((lang) => (
                    <button 
                      key={lang} 
                      onClick={() => handleLanguageSelect(lang)}
                      className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
                      data-testid={`button-lang-${lang}`}
                    >
                      {languageNames[lang]}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Onboarding Overlay */}
        <AnimatePresence>
          {onboardingStep && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-slate-50/90 backdrop-blur-sm"
            >
              <div className="w-full max-w-md space-y-6 text-center">
                <div className="w-20 h-20 bg-primary rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-primary/30">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Profile Setup</h2>
                  <p className="text-lg text-slate-600">
                    {onboardingStep === "name" && "What is your full name?"}
                    {onboardingStep === "age" && "How old are you?"}
                    {onboardingStep === "gender" && "What is your gender?"}
                    {onboardingStep === "bloodGroup" && "What is your blood group?"}
                    {onboardingStep === "height" && "What is your height?"}
                    {onboardingStep === "weight" && "What is your weight?"}
                    {onboardingStep === "place" && "Where do you live?"}
                    {onboardingStep === "occupation" && "What is your occupation?"}
                    {onboardingStep === "qualification" && "What is your highest qualification?"}
                  </p>
                </div>
                
                {onboardingStep === "gender" || onboardingStep === "bloodGroup" ? (
                  <div className="flex flex-wrap gap-4 justify-center">
                    {(onboardingStep === "gender" 
                      ? ["Male", "Female", "Other"] 
                      : ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
                    ).map((option) => (
                      <Button 
                        key={option} 
                        onClick={() => handleInputSubmit(option)}
                        className="min-w-20"
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                ) : (
                  /* Manual Input Fallback */
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleInputSubmit(inputValue); }}
                    className="flex gap-2"
                  >
                    <Input 
                      value={inputValue} 
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Type or speak..."
                      autoFocus
                    />
                    <Button type="submit" size="icon" className="shrink-0">
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {showReportChat ? (
          <>
            {/* Report Chat Header */}
            <div className="flex items-center gap-3 p-4 bg-white border-b border-slate-200">
              <button
                onClick={() => { setShowReportChat(false); setSelectedReportIds([]); setReportMessages([]); setIsFirstReportMessage(true); }}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                data-testid="button-back-to-chat"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <FileSearch className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-slate-900">Chat with Reports</h2>
            </div>

            {/* Report Selector */}
            {reportMessages.length === 0 ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <p className="text-sm text-slate-500 text-center mb-4">Select one or more reports to start asking questions</p>
                {reports.length === 0 ? (
                  <div className="text-center py-12">
                    <FileSearch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No reports uploaded yet</p>
                    <Button
                      onClick={() => { setShowReportChat(false); setLocation(`/reports/${currentUser?.id}`); }}
                      className="mt-4"
                      variant="outline"
                      data-testid="button-go-to-reports"
                    >
                      Upload Reports
                    </Button>
                  </div>
                ) : (
                  <>
                    {reports.map((report) => {
                      const isSelected = selectedReportIds.includes(report.id);
                      return (
                        <motion.button
                          key={report.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => toggleReportSelection(report.id)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'bg-primary/5 border-primary/40 shadow-md'
                              : 'bg-white border-slate-200 hover:border-primary/20 hover:shadow-sm'
                          }`}
                          data-testid={`report-select-${report.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? 'bg-primary text-white' : 'bg-primary/10'
                            }`}>
                              {isSelected ? <Check className="w-5 h-5" /> : <FileText className="w-5 h-5 text-primary" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 truncate">{report.fileName}</p>
                              <p className="text-sm text-slate-500">{report.reportType} | {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Unknown date'}</p>
                              {report.riskLevel && (
                                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                                  report.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                                  report.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {report.riskLevel} risk
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                    {selectedReportIds.length > 0 && (
                      <div className="sticky bottom-0 pt-3 pb-2 bg-slate-50">
                        <Button
                          onClick={confirmReportSelection}
                          className="w-full py-5 text-base"
                          data-testid="button-start-report-chat"
                        >
                          Chat with {selectedReportIds.length} {selectedReportIds.length === 1 ? 'report' : 'reports'}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Selected reports indicator */}
                <div className="px-4 py-2 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-medium text-primary truncate">
                      {selectedReports.length === 1
                        ? selectedReports[0]?.fileName
                        : `${selectedReports.length} reports selected`}
                    </span>
                  </div>
                  <button
                    onClick={() => { setSelectedReportIds([]); setReportMessages([]); setIsFirstReportMessage(true); }}
                    className="text-xs text-slate-500 hover:text-slate-700 shrink-0 ml-2"
                    data-testid="button-change-report"
                  >
                    Change
                  </button>
                </div>

                {/* Report Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide pb-32">
                  {reportMessages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[90%] p-4 rounded-2xl text-base leading-relaxed shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-primary text-white rounded-br-none'
                            : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                  {reportProcessing && !streamingText && (
                    <div className="flex justify-start">
                      <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-slate-100 flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  {streamingText && !reportProcessing && (
                    <div className="flex justify-start">
                      <div className="max-w-[90%] p-4 rounded-2xl rounded-bl-none bg-white text-slate-800 border border-slate-100 shadow-sm text-base leading-relaxed">
                        {streamingText}<span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
                      </div>
                    </div>
                  )}
                  {!reportProcessing && !streamingText && reportFollowUpQuestions.length > 0 && reportMessages.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-slate-400 px-1">Follow-ups</p>
                      {reportFollowUpQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => sendChatFollowUp(q, 'report')}
                          className="w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-left transition-colors"
                          data-testid={`button-report-followup-${i}`}
                        >
                          <span className="flex-1 text-sm text-slate-600">{q}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                  <div ref={reportMessagesEndRef} />
                </div>

                {/* Report Chat Voice Controls */}
                <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
                  <div className="flex flex-col items-center gap-4">
                    <Waveform active={listening} />
                    <div className="flex items-center gap-4 w-full max-w-md">
                      {browserSupportsSpeechRecognition && (
                        <button
                          onClick={toggleListening}
                          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                            listening
                              ? 'bg-destructive text-white scale-110 shadow-destructive/40'
                              : 'bg-primary text-white hover:bg-primary/90 shadow-primary/40 hover:scale-105'
                          }`}
                          data-testid="button-report-microphone"
                        >
                          {listening && <div className="absolute inset-0 rounded-full animate-pulse-ring border-2 border-destructive opacity-50" />}
                          {listening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </button>
                      )}
                      <form
                        onSubmit={(e) => { e.preventDefault(); if (!listening) handleReportChatSubmit(reportInputValue); }}
                        className="flex-1 relative"
                      >
                        <input
                          className="w-full bg-white border-2 border-transparent focus:border-primary/20 rounded-full py-3 px-5 pr-12 shadow-lg shadow-slate-200/50 focus:outline-none transition-all"
                          placeholder="Ask about this report..."
                          value={reportInputValue}
                          onChange={(e) => setReportInputValue(e.target.value)}
                          data-testid="input-report-message"
                        />
                        <button type="submit" className="absolute right-2 top-2 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors" data-testid="button-send-report-message">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      {listening ? "Listening..." : "Ask about your report"}
                    </p>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {/* Regular Symptomatic Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide pb-32">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] p-4 rounded-2xl text-base leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isProcessing && !streamingText && (
                <div className="flex justify-start">
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-slate-100 flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              {streamingText && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[90%] p-4 rounded-2xl rounded-bl-none text-base leading-relaxed shadow-sm bg-white text-slate-800 border border-slate-100">
                    {streamingText}
                    <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle animate-pulse" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Voice Controls / Footer - Only show after onboarding and language selection is complete */}
            {!onboardingStep && !showLanguageSelection && selectedLanguage && (
              <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
                <div className="flex flex-col items-center gap-6">
                  <Waveform active={listening} />
                  
                  <div className="flex items-center gap-4 w-full max-w-md">
                    {!browserSupportsSpeechRecognition ? (
                       <p className="text-destructive text-center w-full bg-white p-2 rounded-lg border border-destructive/20">
                         Browser does not support Speech Recognition. Use Chrome.
                       </p>
                    ) : (
                      <button
                        onClick={toggleListening}
                        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                          listening 
                            ? 'bg-destructive text-white scale-110 shadow-destructive/40' 
                            : 'bg-primary text-white hover:bg-primary/90 shadow-primary/40 hover:scale-105'
                        }`}
                        data-testid="button-microphone"
                      >
                        {listening && <div className="absolute inset-0 rounded-full animate-pulse-ring border-2 border-destructive opacity-50" />}
                        {listening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                      </button>
                    )}

                    <div className="flex-1 hidden md:block">
                       <form 
                        onSubmit={(e) => { 
                          e.preventDefault(); 
                          if (!listening) handleInputSubmit(inputValue); 
                        }}
                        className="relative"
                      >
                        <input
                          className="w-full bg-white border-2 border-transparent focus:border-primary/20 rounded-full py-3 px-6 pl-4 pr-12 shadow-lg shadow-slate-200/50 focus:outline-none transition-all"
                          placeholder="Type a message..."
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          data-testid="input-message"
                        />
                        <button type="submit" className="absolute right-2 top-2 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors" data-testid="button-send-message">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-400 font-medium">
                    {listening ? "Listening..." : "Tap microphone to speak"}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

      </main>

      <AnimatePresence>
        {showAddMemberDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddMemberDialog(false)}
              className="fixed inset-0 bg-black/50 z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserPlus className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Add Family Member</h3>
                    <p className="text-xs text-slate-500">Create a new profile under your account</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Name *</label>
                    <input
                      type="text"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="Enter name"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      data-testid="input-member-name"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Age</label>
                      <input
                        type="number"
                        value={newMemberAge}
                        onChange={(e) => setNewMemberAge(e.target.value)}
                        placeholder="Age"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        data-testid="input-member-age"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Blood Group</label>
                      <select
                        value={newMemberBloodGroup}
                        onChange={(e) => setNewMemberBloodGroup(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                        data-testid="select-member-blood-group"
                      >
                        <option value="">Select</option>
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Gender</label>
                    <div className="flex gap-2">
                      {["Male", "Female", "Other"].map((g) => (
                        <button
                          key={g}
                          onClick={() => setNewMemberGender(g)}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${newMemberGender === g ? "bg-teal-50 border-teal-500 text-teal-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                          data-testid={`button-gender-${g.toLowerCase()}`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Height</label>
                      <input
                        type="text"
                        value={newMemberHeight}
                        onChange={(e) => setNewMemberHeight(e.target.value)}
                        placeholder="e.g. 5'8&quot;"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        data-testid="input-member-height"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Weight</label>
                      <input
                        type="text"
                        value={newMemberWeight}
                        onChange={(e) => setNewMemberWeight(e.target.value)}
                        placeholder="e.g. 70 kg"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        data-testid="input-member-weight"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Place</label>
                    <input
                      type="text"
                      value={newMemberPlace}
                      onChange={(e) => setNewMemberPlace(e.target.value)}
                      placeholder="City / Town"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      data-testid="input-member-place"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Occupation</label>
                      <input
                        type="text"
                        value={newMemberOccupation}
                        onChange={(e) => setNewMemberOccupation(e.target.value)}
                        placeholder="Job / Role"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        data-testid="input-member-occupation"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Qualification</label>
                      <input
                        type="text"
                        value={newMemberQualification}
                        onChange={(e) => setNewMemberQualification(e.target.value)}
                        placeholder="Education"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        data-testid="input-member-qualification"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setShowAddMemberDialog(false); resetMemberForm(); }}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm"
                    data-testid="button-cancel-member"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddFamilyMember}
                    disabled={!newMemberName.trim() || createFamilyMember.isPending}
                    className="flex-1 py-2.5 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors text-sm"
                    data-testid="button-save-member"
                  >
                    {createFamilyMember.isPending ? "Adding..." : "Add Member"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
