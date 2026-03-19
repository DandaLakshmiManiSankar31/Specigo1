import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  name: text("name"),
  age: integer("age"),
  bloodGroup: text("blood_group"),
  height: text("height"),
  weight: text("weight"),
  medicalHistory: text("medical_history"),
  gender: text("gender"),
  place: text("place"),
  occupation: text("occupation"),
  qualification: text("qualification"),
  patientMedicalHistory: jsonb("patient_medical_history"),
  isPrimary: integer("is_primary").default(1),
  parentUserId: integer("parent_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Type definition for patient medical history
export type PatientMedicalHistory = {
  // Basic Information - Auto-populated from profile
  name?: string;
  age?: number;
  gender?: string;
  
  // Basic Information
  nationality?: string;
  nationalityOther?: string;
  ethnicity?: string;
  caste?: string;
  diet?: string;
  maritalStatus?: string;
  
  // Medical History
  allergies?: string[];
  drugAllergyDetails?: string;
  allergyOther?: string;
  medicalConditions?: string[];
  medicalConditionOther?: string;
  medicalConditionSince?: string;
  currentMedications?: string;
  drugReaction?: string;
  
  // Current Medication Questions
  currentlyOnMedication?: string;
  medicationDetails?: string; // Name, dose, for what disease/symptom, since when
  medicationDrugReaction?: string;
  drugReactionMedicineName?: string;
  consultedPhysicianForReaction?: string;
  
  // Surgical History - supports multiple surgeries
  surgicalHistory?: string;
  surgeries?: Array<{
    type: string;
    typeOther?: string;
    date?: string;
    indication?: string;
    intraOperativeComplication?: string;
    intraOperativeManagement?: string;
    postOperativeComplication?: string;
    postOperativeManagement?: string;
    followUpInstructed?: string;
    followUpFrequency?: string;
  }>;
  surgicalHistoryOther?: string;
  surgeryDate?: string;
  surgeryIndication?: string;
  
  // Family History - Mother
  motherAlive?: string;
  motherCauseOfDeath?: string;
  motherHasSignificantHistory?: string;
  motherMedicalHistory?: string[];
  motherMedicalHistoryOther?: string;
  motherMedicalHistorySince?: string;
  motherOnMedication?: string;
  motherMedications?: string;
  motherDrugReaction?: string;
  motherConsultedPhysician?: string;
  
  // Family History - Father
  fatherAlive?: string;
  fatherCauseOfDeath?: string;
  fatherHasSignificantHistory?: string;
  fatherMedicalHistory?: string[];
  fatherMedicalHistoryOther?: string;
  fatherMedicalHistorySince?: string;
  fatherOnMedication?: string;
  fatherMedications?: string;
  fatherDrugReaction?: string;
  fatherConsultedPhysician?: string;
  
  // Family History - Siblings
  siblingsCount?: number;
  siblingsAlive?: string;
  siblingsDeceasedCause?: string;
  siblingsHasSignificantHistory?: string;
  siblingsMedicalHistory?: string[];
  siblingsMedicalHistoryOther?: string;
  siblingsMedicalHistorySince?: string;
  siblingsOnMedication?: string;
  siblingsMedications?: string;
  siblingsDrugReaction?: string;
  siblingsConsultedPhysician?: string;
  // Per-sibling details (for when user has multiple siblings)
  siblingsDetails?: Array<{
    index: number;
    name?: string;
    age?: number;
    sex?: string;
    alive?: string;
    causeOfDeath?: string;
    hasSignificantHistory?: string;
    medicalHistory?: string[];
    medicalHistoryOther?: string;
    medicalHistorySince?: string;
    onMedication?: string;
    medications?: string;
    drugReaction?: string;
    consultedPhysician?: string;
  }>;
  
  // Family History - Children
  childrenCount?: number;
  childrenAgeGender?: string;
  childrenHasSignificantHistory?: string;
  childrenMedicalHistory?: string[];
  childrenMedicalHistoryOther?: string;
  
  // Family History - Grandparents
  maternalGrandmotherAlive?: string;
  maternalGrandmotherCauseOfDeath?: string;
  maternalGrandmotherMedicalHistory?: string[];
  maternalGrandmotherMedicalHistoryOther?: string;
  maternalGrandfatherAlive?: string;
  maternalGrandfatherCauseOfDeath?: string;
  maternalGrandfatherMedicalHistory?: string[];
  maternalGrandfatherMedicalHistoryOther?: string;
  paternalGrandmotherAlive?: string;
  paternalGrandmotherCauseOfDeath?: string;
  paternalGrandmotherMedicalHistory?: string[];
  paternalGrandmotherMedicalHistoryOther?: string;
  paternalGrandfatherAlive?: string;
  paternalGrandfatherCauseOfDeath?: string;
  paternalGrandfatherMedicalHistory?: string[];
  paternalGrandfatherMedicalHistoryOther?: string;
  
  // Family History - Uncles
  maternalUnclesCount?: number;
  maternalUnclesMedicalHistory?: string[];
  maternalUnclesMedicalHistoryOther?: string;
  paternalUnclesCount?: number;
  paternalUnclesMedicalHistory?: string[];
  paternalUnclesMedicalHistoryOther?: string;
  
  // Family History - Aunts
  maternalAuntsCount?: number;
  maternalAuntsMedicalHistory?: string[];
  maternalAuntsMedicalHistoryOther?: string;
  paternalAuntsCount?: number;
  paternalAuntsMedicalHistory?: string[];
  paternalAuntsMedicalHistoryOther?: string;
  
  // Family History - Cousins
  maternalCousinsCount?: number;
  maternalCousinsMedicalHistory?: string[];
  maternalCousinsMedicalHistoryOther?: string;
  paternalCousinsCount?: number;
  paternalCousinsMedicalHistory?: string[];
  paternalCousinsMedicalHistoryOther?: string;
  
  // Family History - Spouse & In-laws
  hasSpouse?: string;
  spouseAlive?: string;
  spouseCauseOfDeath?: string;
  spouseMedicalHistory?: string[];
  spouseMedicalHistoryOther?: string;
  inLawsSignificantHistory?: string;
  inLawsMedicalHistory?: string[];
  inLawsMedicalHistoryOther?: string;
  
  // Family History - Other
  familyPsychiatricHistory?: string;
  familyUntimelyDeath?: string;
  familyDeathType?: string;
  
  // Obstetric & Gynecology History (for females)
  menarcheAge?: number;
  menstrualCycleType?: string;
  cycleLength?: number;
  menstruationDuration?: number;
  menstrualFlow?: string;
  premenstrualSyndrome?: string;
  dysmenorrhea?: string;
  
  // Additional Menstrual History
  mittelschmerzPain?: string;
  ayurvedicMedication?: string;
  ayurvedicMedicationType?: string[];
  ayurvedicMedicineName?: string;
  menstrualPatternChange?: string;
  menstrualPatternChangeWhat?: string;
  menstrualPatternChangeWhen?: string;
  consultedGynaecologist?: string;
  
  menopauseAge?: number;
  menopauseSymptoms?: string[];
  postMenopauseBleeding?: string;
  ageAtMarriage?: number;
  everPregnant?: string;
  pregnancyCount?: number;
  liveBirths?: number;
  
  // First Live Birth Details
  firstBirthGender?: string;
  firstBirthWeight?: string;
  firstBirthDeliveryType?: string;
  firstBirthDeliveryIndication?: string;
  firstBirthGestationalAge?: string;
  firstBirthCriedAfter?: string;
  firstBirthNICU?: string;
  firstBirthNICUDays?: number;
  firstBirthNICUCause?: string;
  
  // Second Live Birth Details
  secondBirthGender?: string;
  secondBirthWeight?: string;
  secondBirthDeliveryType?: string;
  secondBirthDeliveryIndication?: string;
  secondBirthGestationalAge?: string;
  secondBirthCriedAfter?: string;
  secondBirthNICU?: string;
  secondBirthNICUDays?: number;
  secondBirthNICUCause?: string;
  
  // Third Live Birth Details
  thirdBirthGender?: string;
  thirdBirthWeight?: string;
  thirdBirthDeliveryType?: string;
  thirdBirthDeliveryIndication?: string;
  thirdBirthGestationalAge?: string;
  thirdBirthCriedAfter?: string;
  thirdBirthNICU?: string;
  thirdBirthNICUDays?: number;
  thirdBirthNICUCause?: string;
  
  miscarriages?: number;
  inducedAbortions?: number;
  stillbirths?: number;
  deliveryType?: string;
  deliveryIndication?: string;
  contraceptiveUse?: string;
  contraceptiveOther?: string;
  
  // Addiction History
  addictionHistory?: string[];
  addictionFrequency?: string;
  addictionStartAge?: number;
  addictionYears?: number;
  addictionAmount?: string;
  addictionRoute?: string;
  withdrawalSymptoms?: string[];
  addictionTreatment?: string;
  
  // Occupation History
  occupationType?: string;
  occupationOther?: string;
  workType?: string;
  workYears?: number;
  workHoursPerDay?: string;
  shiftWork?: string;
  workplaceExposure?: string[];
  protectiveEquipment?: string;
  physicalActivity?: string;
  jobStress?: string;
  workHealthProblems?: string[];
  
  // Environmental History
  livingArea?: string;
  livingYears?: number;
  houseType?: string;
  householdSize?: number;
  overcrowding?: string;
  drinkingWaterSource?: string;
  waterTreatment?: string;
  toiletFacility?: string;
  wasteDisposal?: string;
  cookingFuel?: string;
  kitchenVentilation?: string;
  indoorSmokeExposure?: string[];
  indoorSmokeExposureOther?: string;
  nearbyPollution?: string[];
  nearbyPollutionOther?: string;
  pesticidesExposure?: string;
  petsAtHome?: string[];
  environmentHealthProblems?: string[];
  outdoorPollutionExposure?: string;
  stagnantWater?: string;
  mosquitoBorneDiseases?: string[];
  mosquitoDiseasesOther?: string;
  
  // Vaccination History
  everVaccinated?: string;
  vaccinationCard?: string;
  childhoodVaccines?: string[];
  adultVaccines?: string[];
  lastVaccinationDate?: string;
  completedAllDoses?: string;
  missedDelayedVaccine?: string;
  workTravelVaccinated?: string;
  workTravelVaccineName?: string;
  vaccineReaction?: string;
  vaccineReactionType?: string[];
  // Per-vaccine details (keyed by vaccine name)
  vaccineDetails?: {
    [key: string]: {
      date?: string;
      doses?: string;
      reaction?: string;
      reactionDetails?: string;
    };
  };
  
  // Travel History
  recentTravel?: string;
  travelTiming?: string;
  travelLocation?: string;
  travelCountry?: string;
  travelPurpose?: string;
  travelDuration?: string;
  travelAreaType?: string;
  travelAccommodation?: string;
  travelFoodWater?: string[];
  travelMosquitoExposure?: string;
  travelSickContact?: string;
  travelIllness?: string;
  travelIllnessSymptomsBefore?: string[];
  travelIllnessSymptomsDuring?: string[];
  travelIllnessSymptomsAfter?: string[];
  endemicAreaTravel?: string[];
  travelPreventiveMeds?: string;
  travelPreventiveMedsTypes?: string[];
  travelPreventiveMedsOther?: string;
  preventiveMedicines?: string[];
  internationalTravel?: string;
  travelQuarantine?: string;
  travelPurposeOther?: string;
  
  // Vaccination History "Other" fields
  adultVaccinesOther?: string;
  vaccineReactionOther?: string;
  
  // Psychosocial History
  moodInterestLoss?: number;
  moodDepressed?: number;
  moodTired?: number;
  anxietyNervous?: number;
  anxietyWorrying?: number;
  anxietyInterference?: number;
  stressLevel?: string;
  suicidalThoughts?: number;
  suicidalActive?: string;
  feelingUnsafe?: string;
  sleepDifficulty?: string;
  sleepDuration?: string;
  bipolarEnergy?: string;
  bipolarNoticed?: string;
  psychosisVoices?: string;
  psychosisParanoia?: string;
  substanceCoping?: string;
  substanceProblems?: string;
  overallFunctioningImpact?: string;
  
  // Vision History
  visionProblem?: string;
  visionProblemTypes?: string[];
  visionProblemDuration?: string;
  visionAffectedEyes?: string;
  usesGlasses?: string;
  glassesType?: string;
  spectaclePower?: string;
  lastEyeCheckup?: string;
  eyeDiseases?: string[];
  eyeRelatedIllness?: string[];
  eyeRelatedIllnessOther?: string;
  eyeSurgeryOrInjury?: string;
  eyeSurgeryDetails?: string;
  eyeSurgeryTimePassed?: string;
  screenTimePerDay?: string;
  eyeStrainAfterScreen?: string;
  familyEyeDisease?: string;
  familyEyeDiseaseTypes?: string[];
  familyEyeDiseaseOther?: string;
  medicinesAffectingVision?: string;
  medicinesAffectingVisionDetails?: string;
  
  // Personal History
  residenceLocation?: string;
  educationQualification?: string;
  educationOther?: string;

  // Diet History
  mealsPerDay?: string;
  mealTimings?: string;
  dietCuisinePreference?: string;
  dietCuisineOther?: string;
  dietTypePreference?: string;
  fitnessGoal?: string;
  fitnessGoalOther?: string;
  medicalDietType?: string[];
  medicalDietTypeOther?: string;
  dietFollowFrequency?: string;
  dietRevisionDays?: string;

  // Lifestyle - Socio-Economic Status
  socioEconomicStatus?: string;
  
  // Lifestyle - Addiction History
  substanceUseStatus?: string;
  substancesUsed?: string[];
  substanceOther?: string;
  // Per-substance details (keyed by substance name)
  substanceDetails?: {
    [key: string]: {
      startAge?: number;
      useYears?: number;
      frequency?: string;
      amount?: string;
      route?: string[];
      lastUse?: string;
      craving?: string;
      tolerance?: string;
      lossOfControl?: string;
      continueDespiteHarm?: string;
      withdrawalSeverity?: string;
      withdrawalSymptoms?: string[];
    };
  };
  // Legacy fields for backward compatibility
  substanceStartAge?: number;
  substanceUseYears?: number;
  substanceFrequency?: string;
  substanceAmountTobacco?: string;
  substanceAmountAlcohol?: string;
  substanceAmountOther?: string;
  substanceRoute?: string[];
  substanceLastUse?: string;
  substanceCraving?: string;
  substanceTolerance?: string;
  substanceLossOfControl?: string;
  substanceContinueDespiteHarm?: string;
  substanceWithdrawalSeverity?: string;
  substanceWithdrawalSymptoms?: string[];
  substanceTreatmentHistory?: string[];
  substanceNeedHelp?: string;
  substanceAdditionalInfo?: string;
  
  // Lifestyle - Occupation History
  currentWorkStatus?: string;
  currentJobTitle?: string;
  workMainType?: string;
  workYearsInJob?: number;
  workHoursDaily?: string;
  workShifts?: string;
  workHarmfulExposure?: string;
  workExposureTypes?: string[];
  workProtectiveEquipment?: string;
  workPhysicalStrain?: string;
  workMentalStress?: string;
  workRelatedHealthProblems?: string[];
  workJobChangeHealth?: string;
  workJobChangeReason?: string;
  previousJobTitle?: string;
  previousJobYears?: number;
  previousJobExposure?: string;
  previousJobExposureDetails?: string;
  currentWorkRisks?: string;
  workAffectsMedicalVisits?: string;
  workNeedAdvice?: string;
  workAdditionalInfo?: string;
  
  // Legacy fields for backward compatibility
  familyHistory?: string[];
  environmentalExposure?: string[];
  vaccinationHistory?: string[];
  vaccinationOther?: string;
  travelHistory?: string;
  obstetricHistory?: string;
  bowelHabits?: string;
  hydration?: string;
  screenTime?: string;
  psychiatricHistory?: string[];
  psychiatricOther?: string;
  socialHistory?: string;
  fitnessHistory?: string;
  behavioralPattern?: string;
  testHistory?: string;
  psychologicalProfile?: string;
};

export const medicalRecords = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  symptom: text("symptom").notNull(),
  diagnosis: text("diagnosis"), // Response from AI
  fullConversation: jsonb("full_conversation"), // Store the chat context
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Medical Reports (Lab reports, blood tests, etc.)
export const medicalReports = pgTable("medical_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  reportType: text("report_type").notNull(), // 'blood_test', 'lab_report', 'scan', 'other'
  fileName: text("file_name"),
  reportText: text("report_text").notNull(), // Extracted or pasted text from report
  analysis: text("analysis"), // AI analysis of the report
  riskLevel: text("risk_level"), // 'low', 'moderate', 'high', 'critical'
  parameters: jsonb("parameters"), // Parsed parameters with their analysis
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true 
});

export const insertRecordSchema = createInsertSchema(medicalRecords).omit({ 
  id: true, 
  createdAt: true 
});

export const insertReportSchema = createInsertSchema(medicalReports).omit({ 
  id: true, 
  createdAt: true 
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type InsertMedicalRecord = z.infer<typeof insertRecordSchema>;
export type MedicalReport = typeof medicalReports.$inferSelect;
export type InsertMedicalReport = z.infer<typeof insertReportSchema>;
