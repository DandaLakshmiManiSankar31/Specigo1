import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save, ChevronDown, ChevronUp, Heart, Baby, TreePine, Syringe, Plane, Brain, Eye, User as UserIcon, Stethoscope, Briefcase, Home, Wine, GraduationCap, Pill, Plus, Trash2, Utensils } from "lucide-react";
import type { PatientMedicalHistory, User } from "@shared/schema";

interface MedicalHistoryFormProps {
  initialData?: PatientMedicalHistory;
  onSave: (data: PatientMedicalHistory) => Promise<void>;
  isSaving?: boolean;
  user?: User;
}

const medicalConditionOptions = [
  "None", "Diabetes", "Hypertension", "Heart Disease", "Asthma", "COPD",
  "Thyroid Disorder", "Kidney Disease", "Liver Disease", "Cancer",
  "Autoimmune Disease", "Stroke", "Epilepsy", "Tuberculosis", "Other"
];

const yesNoOptions = ["Yes", "No"];
const yesNoNotSureOptions = ["Yes", "No", "Not Sure"];

const FormField = ({ label, children, required = false }: { label: string; children: React.ReactNode; required?: boolean }) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    {children}
  </div>
);

export default function MedicalHistoryForm({ initialData, onSave, isSaving, user }: MedicalHistoryFormProps) {
  const [formData, setFormData] = useState<PatientMedicalHistory>(initialData || {});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    medical: false,
    family: false,
    obstetric: false,
    environmental: false,
    vaccination: false,
    travel: false,
    psychosocial: false,
    vision: false,
    personal: false,
    lifestyle: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Auto-open and scroll to section specified in URL hash (e.g. #diet)
  useEffect(() => {
    const hash = window.location.hash.replace("#", "").toLowerCase();
    if (hash) {
      setExpandedSections(prev => ({ ...prev, [hash]: true }));
      setTimeout(() => {
        const el = document.getElementById(`section-${hash}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, []);

  // Auto-populate name, age, gender from user profile
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        age: user.age || prev.age,
        gender: user.gender || prev.gender,
      }));
    }
  }, [user]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSave = async () => {
    await onSave(formData);
  };

  const updateField = (field: keyof PatientMedicalHistory, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleMultiSelect = (field: keyof PatientMedicalHistory, value: string) => {
    const current = (formData[field] as string[]) || [];
    const disablingOptions = ["None", "No known allergies"];
    
    if (current.includes(value)) {
      updateField(field, current.filter(v => v !== value));
    } else {
      // If selecting a disabling option, clear other selections
      if (disablingOptions.includes(value)) {
        updateField(field, [value]);
      } else {
        // If selecting something else, remove any disabling options
        const filtered = current.filter(v => !disablingOptions.includes(v));
        updateField(field, [...filtered, value]);
      }
    }
  };

  // Helper function to normalize substance key for consistent storage
  const normalizeSubstanceKey = (substance: string) => substance.replace(/[^a-zA-Z0-9]/g, '_');
  
  // Helper function to update per-substance details
  const updateSubstanceDetail = (substanceKey: string, detailField: string, value: unknown) => {
    const currentDetails = formData.substanceDetails || {};
    setFormData(prev => ({
      ...prev,
      substanceDetails: {
        ...currentDetails,
        [substanceKey]: {
          ...(currentDetails[substanceKey] || {}),
          [detailField]: value
        }
      }
    }));
  };

  const getSubstanceDetail = (substanceKey: string, detailField: string) => {
    const details = formData.substanceDetails?.[substanceKey];
    return details ? (details as Record<string, unknown>)[detailField] : undefined;
  };

  // Helper function to add a new surgery
  const addSurgery = () => {
    const currentSurgeries = formData.surgeries || [];
    setFormData(prev => ({
      ...prev,
      surgeries: [...currentSurgeries, { type: "" }]
    }));
  };

  // Helper function to update a surgery
  const updateSurgery = (index: number, field: string, value: string) => {
    const currentSurgeries = [...(formData.surgeries || [])];
    currentSurgeries[index] = { ...currentSurgeries[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      surgeries: currentSurgeries
    }));
  };

  // Helper function to remove a surgery
  const removeSurgery = (index: number) => {
    const currentSurgeries = [...(formData.surgeries || [])];
    currentSurgeries.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      surgeries: currentSurgeries
    }));
  };

  const SectionHeader = ({ title, section, icon: Icon }: { title: string; section: string; icon: React.ComponentType<{ className?: string }> }) => (
    <div 
      className="flex items-center justify-between cursor-pointer py-4 px-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-xl hover-elevate transition-all duration-200"
      onClick={() => toggleSection(section)}
      data-testid={`section-${section}`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white dark:bg-slate-600 rounded-lg shadow-sm">
          <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      </div>
      {expandedSections[section] ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
    </div>
  );

  const MultiSelectGroup = ({ 
    label, 
    field, 
    options 
  }: { 
    label: string; 
    field: keyof PatientMedicalHistory; 
    options: string[];
  }) => {
    const selectedValues = (formData[field] as string[]) || [];
    // Check for disabling options - "None" and "No known allergies" both disable other options
    const disablingOptions = ["None", "No known allergies"];
    const hasDisablingSelection = disablingOptions.some(opt => selectedValues.includes(opt));
    
    return (
      <FormField label={label}>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {options.map(option => {
            const isDisablingOption = disablingOptions.includes(option);
            const isDisabled = hasDisablingSelection && !isDisablingOption;
            
            return (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${String(field)}-${option}`}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={() => toggleMultiSelect(field, option)}
                  disabled={isDisabled}
                  data-testid={`checkbox-${String(field)}-${option}`}
                />
                <label 
                  htmlFor={`${String(field)}-${option}`} 
                  className={`text-sm cursor-pointer ${isDisabled ? 'text-slate-400 dark:text-slate-600' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  {option}
                </label>
              </div>
            );
          })}
        </div>
      </FormField>
    );
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Basic Information Section */}
      <Card className="overflow-hidden border-0 shadow-md">
        <SectionHeader title="Basic Information" section="basic" icon={UserIcon} />
        {expandedSections.basic && (
          <CardContent className="p-5 space-y-4 bg-white dark:bg-slate-800">
            {/* Profile Information - Auto-populated from Profile */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">Auto-populated from your profile</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Name">
                  <Input 
                    value={formData.name || ""} 
                    disabled
                    className="bg-white/50 dark:bg-slate-700/50"
                    data-testid="input-name"
                  />
                </FormField>
                <FormField label="Age">
                  <Input 
                    value={formData.age ? `${formData.age} years` : ""} 
                    disabled
                    className="bg-white/50 dark:bg-slate-700/50"
                    data-testid="input-age"
                  />
                </FormField>
                <FormField label="Gender">
                  <Input 
                    value={formData.gender || ""} 
                    disabled
                    className="bg-white/50 dark:bg-slate-700/50"
                    data-testid="input-gender"
                  />
                </FormField>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Nationality">
                <Select value={formData.nationality || ""} onValueChange={(v) => updateField("nationality", v)}>
                  <SelectTrigger data-testid="select-nationality"><SelectValue placeholder="Select nationality" /></SelectTrigger>
                  <SelectContent>
                    {["Indian", "American", "British", "Canadian", "Australian", "Middle Eastern", "African", "South East Asian", "European", "Other"].map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              
              <FormField label="Ethnicity">
                <Select value={formData.ethnicity || ""} onValueChange={(v) => updateField("ethnicity", v)}>
                  <SelectTrigger data-testid="select-ethnicity"><SelectValue placeholder="Select ethnicity" /></SelectTrigger>
                  <SelectContent>
                    {["South Asian", "East Asian", "Caucasian", "African", "Hispanic/Latino", "Middle Eastern", "Indigenous", "Mixed", "Prefer not to say"].map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              
              <FormField label="Category">
                <Select value={formData.caste || ""} onValueChange={(v) => updateField("caste", v)}>
                  <SelectTrigger data-testid="select-category"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {["General", "OBC", "SC", "ST", "Other", "Prefer not to say"].map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            
            {formData.nationality === "Other" && (
              <FormField label="Specify nationality">
                <Input 
                  placeholder="Enter your nationality" 
                  value={formData.nationalityOther || ""} 
                  onChange={(e) => updateField("nationalityOther", e.target.value)}
                  data-testid="input-nationality-other"
                />
              </FormField>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Diet">
                <Select value={formData.diet || ""} onValueChange={(v) => updateField("diet", v)}>
                  <SelectTrigger data-testid="select-diet"><SelectValue placeholder="Select diet type" /></SelectTrigger>
                  <SelectContent>
                    {["Vegetarian", "Non-Vegetarian", "Eggetarian", "Vegan", "Mixed", "High-protein", "Keto/Low-carb", "Junk-food heavy"].map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              
              <FormField label="Marital Status">
                <Select value={formData.maritalStatus || ""} onValueChange={(v) => updateField("maritalStatus", v)}>
                  <SelectTrigger data-testid="select-marital"><SelectValue placeholder="Select marital status" /></SelectTrigger>
                  <SelectContent>
                    {["Single", "Married", "Divorced", "Widowed", "Prefer not to say"].map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <MultiSelectGroup 
              label="Known Allergies" 
              field="allergies" 
              options={["No known allergies", "Drug allergy", "Food allergy", "Dust/pollen", "Animal dander", "Latex", "Insect bite", "Other"]} 
            />
            
            {((formData.allergies as string[]) || []).includes("Drug allergy") && (
              <FormField label="Drug Allergy Details">
                <Input 
                  placeholder="Specify which drug(s)" 
                  value={formData.drugAllergyDetails || ""} 
                  onChange={(e) => updateField("drugAllergyDetails", e.target.value)}
                  data-testid="input-drug-allergy"
                />
              </FormField>
            )}
            
            {((formData.allergies as string[]) || []).includes("Other") && (
              <FormField label="Specify other allergy">
                <Input 
                  placeholder="Enter allergy details" 
                  value={formData.allergyOther || ""} 
                  onChange={(e) => updateField("allergyOther", e.target.value)}
                  data-testid="input-allergy-other"
                />
              </FormField>
            )}
          </CardContent>
        )}
      </Card>

      {/* Personal History Section */}
      <Card className="overflow-hidden border-0 shadow-md">
        <SectionHeader title="Personal History" section="personal" icon={Home} />
        {expandedSections.personal && (
          <CardContent className="p-5 space-y-4 bg-white dark:bg-slate-800">
            <FormField label="Where do you live?">
              <Input 
                placeholder="Enter your residence location/city" 
                value={formData.residenceLocation || ""} 
                onChange={(e) => updateField("residenceLocation", e.target.value)}
                data-testid="input-residence"
              />
            </FormField>
            
            <FormField label="What's your educational qualification?">
              <Select value={formData.educationQualification || ""} onValueChange={(v) => updateField("educationQualification", v)}>
                <SelectTrigger data-testid="select-education"><SelectValue placeholder="Select qualification" /></SelectTrigger>
                <SelectContent>
                  {[
                    "No formal education",
                    "School level (up to 10th)",
                    "Higher secondary (12th)",
                    "School dropout or College dropout",
                    "Diploma",
                    "Graduate - BA, BSc, BCom, BBA, BCA, BTech, MBBS, BDS, BPharm",
                    "Postgraduate - MA, MSc, MCom, MBA, MCA, MD, MS",
                    "Doctorate",
                    "Other"
                  ].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            
            {formData.educationQualification === "Other" && (
              <FormField label="Specify qualification">
                <Input 
                  placeholder="Enter your qualification" 
                  value={formData.educationOther || ""} 
                  onChange={(e) => updateField("educationOther", e.target.value)}
                  data-testid="input-education-other"
                />
              </FormField>
            )}
          </CardContent>
        )}
      </Card>

      {/* Diet History Section */}
      <Card id="section-diet" className="overflow-hidden border-0 shadow-md">
        <SectionHeader title="Diet History" section="diet" icon={Utensils} />
        {expandedSections.diet && (
          <CardContent className="p-5 space-y-4 bg-white dark:bg-slate-800">
            <FormField label="How many meals do you have in a day?">
              <Select value={formData.mealsPerDay || ""} onValueChange={(v) => updateField("mealsPerDay", v)}>
                <SelectTrigger data-testid="select-meals-per-day"><SelectValue placeholder="Select number of meals" /></SelectTrigger>
                <SelectContent>
                  {["1", "2", "3", "4", "5", "6 or more"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="When do you have these meals? (Timings)">
              {(() => {
                const count = parseInt(formData.mealsPerDay || "0") || 0;
                const numMeals = formData.mealsPerDay === "6 or more" ? 6 : count;
                if (numMeals === 0) {
                  return <p className="text-sm text-slate-400 italic">Select number of meals first</p>;
                }
                const timings: Record<string, string> = (() => {
                  try {
                    const raw = formData.mealTimings || "";
                    const obj: Record<string, string> = {};
                    raw.split("|").forEach(part => {
                      const idx = part.indexOf(":");
                      if (idx > -1) {
                        const key = part.slice(0, idx).trim();
                        const val = part.slice(idx + 1).trim();
                        if (key) obj[key] = val;
                      }
                    });
                    return obj;
                  } catch {}
                  return {};
                })();
                const saveTiming = (mealKey: string, val: string) => {
                  const updated = { ...timings, [mealKey]: val };
                  const str = Object.entries(updated).map(([k, v]) => `${k}: ${v}`).join(" | ");
                  updateField("mealTimings", str);
                };
                return (
                  <div className="space-y-2">
                    {Array.from({ length: numMeals }, (_, i) => {
                      const key = `Meal ${i + 1}`;
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-600 w-16 flex-shrink-0">{key}:</span>
                          <Input
                            placeholder="e.g. 8:00 AM"
                            value={timings[key] || ""}
                            onChange={(e) => saveTiming(key, e.target.value)}
                            data-testid={`input-meal-timing-${i + 1}`}
                            className="flex-1"
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </FormField>

            <FormField label="Diet Preference — Cuisine Style">
              <Select value={formData.dietCuisinePreference || ""} onValueChange={(v) => updateField("dietCuisinePreference", v)}>
                <SelectTrigger data-testid="select-cuisine-preference"><SelectValue placeholder="Select cuisine style" /></SelectTrigger>
                <SelectContent>
                  {["Indian", "Western", "Mediterranean", "Asian", "Middle Eastern", "Mixed / No Preference", "Other"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>

            {formData.dietCuisinePreference === "Other" && (
              <FormField label="Specify cuisine style">
                <Input
                  placeholder="Enter your cuisine preference"
                  value={formData.dietCuisineOther || ""}
                  onChange={(e) => updateField("dietCuisineOther", e.target.value)}
                  data-testid="input-cuisine-other"
                />
              </FormField>
            )}

            <FormField label="Diet Preference — Food Type">
              <Select value={formData.dietTypePreference || ""} onValueChange={(v) => updateField("dietTypePreference", v)}>
                <SelectTrigger data-testid="select-diet-type"><SelectValue placeholder="Select food type" /></SelectTrigger>
                <SelectContent>
                  {["Vegan", "Vegetarian", "Eggetarian", "Non-Vegetarian", "Pescatarian"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Fitness Goal">
              <Select value={formData.fitnessGoal || ""} onValueChange={(v) => updateField("fitnessGoal", v)}>
                <SelectTrigger data-testid="select-fitness-goal"><SelectValue placeholder="Select fitness goal" /></SelectTrigger>
                <SelectContent>
                  {["Fat Loss / Weight Loss", "Muscle Gain", "Weight Maintenance", "Endurance / Stamina", "Flexibility & Mobility", "General Health & Wellness", "Athletic Performance", "Other"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>

            {formData.fitnessGoal === "Other" && (
              <FormField label="Specify fitness goal">
                <Input
                  placeholder="Enter your fitness goal"
                  value={formData.fitnessGoalOther || ""}
                  onChange={(e) => updateField("fitnessGoalOther", e.target.value)}
                  data-testid="input-fitness-goal-other"
                />
              </FormField>
            )}

            <FormField label="Medical Goal (select all that apply)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "Maintenance of Blood Sugar (Diabetic Diet)",
                  "Cholesterol Management",
                  "Blood Pressure Management (DASH Diet)",
                  "Keto Diet",
                  "High Protein Diet",
                  "Low Protein Diet",
                  "Mediterranean Diet",
                  "Anti-Inflammatory Diet",
                  "Renal / Kidney Diet",
                  "Cardiac Diet",
                  "No specific medical diet",
                  "Other"
                ].map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={(formData.medicalDietType || []).includes(opt)}
                      onCheckedChange={(checked) => {
                        const current = formData.medicalDietType || [];
                        if (opt === "No specific medical diet") {
                          updateField("medicalDietType", checked ? ["No specific medical diet"] : []);
                        } else {
                          const filtered = current.filter(v => v !== "No specific medical diet");
                          updateField("medicalDietType", checked ? [...filtered, opt] : filtered.filter(v => v !== opt));
                        }
                      }}
                      data-testid={`checkbox-diet-${opt.replace(/\s+/g, "-").toLowerCase()}`}
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{opt}</span>
                  </label>
                ))}
              </div>
            </FormField>

            {(formData.medicalDietType || []).includes("Other") && (
              <FormField label="Specify diet type">
                <Input
                  placeholder="Describe the diet you want to follow"
                  value={formData.medicalDietTypeOther || ""}
                  onChange={(e) => updateField("medicalDietTypeOther", e.target.value)}
                  data-testid="input-diet-type-other"
                />
              </FormField>
            )}

            <FormField label="How many calories do you want to consume in a day?">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="e.g. 2000"
                  value={formData.dailyCalorieTarget || ""}
                  onChange={(e) => updateField("dailyCalorieTarget", e.target.value)}
                  data-testid="input-daily-calorie-target"
                  className="flex-1"
                />
                <span className="text-sm font-medium text-slate-600 flex-shrink-0">Kcal</span>
              </div>
            </FormField>

            <FormField label="Meal variety preference">
              <Select value={formData.dietRevisionDays || ""} onValueChange={(v) => updateField("dietRevisionDays", v)}>
                <SelectTrigger data-testid="select-diet-revision"><SelectValue placeholder="Select meal variety" /></SelectTrigger>
                <SelectContent>
                  {["Same meal everyday", "Different meal everyday"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          </CardContent>
        )}
      </Card>

      {/* Lifestyle Section */}
      <Card className="overflow-hidden border-0 shadow-md">
        <SectionHeader title="Lifestyle History" section="lifestyle" icon={Briefcase} />
        {expandedSections.lifestyle && (
          <CardContent className="p-5 space-y-6 bg-white dark:bg-slate-800">
            {/* Occupation & Socio-Economic Status - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Occupation">
                <Select value={formData.occupationType || ""} onValueChange={(v) => updateField("occupationType", v)}>
                  <SelectTrigger data-testid="select-occupation-type"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {[
                      "Professional/Administrative - Healthcare workers, Teachers, Legal, Business executives",
                      "Technical/Skilled Trades - Engineers, Electricians, IT professionals",
                      "Service Industry - Food service, Retail, Transportation, Security",
                      "Industrial/Manufacturing - Factory workers, Chemical plant, Assembly line",
                      "Agricultural/Environmental - Farmers, Forestry, Mining",
                      "Public Safety - Police, Firefighters, Military, EMS",
                      "Student",
                      "Homemaker",
                      "Retired",
                      "Unemployed",
                      "Other"
                    ].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              
              <FormField label="Socio-Economic Status">
                <Select value={formData.socioEconomicStatus || ""} onValueChange={(v) => updateField("socioEconomicStatus", v)}>
                  <SelectTrigger data-testid="select-socioeconomic"><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {[
                      "Upper class",
                      "Upper middle class",
                      "Lower middle class",
                      "Upper lower class",
                      "Lower class"
                    ].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            
            {formData.occupationType === "Other" && (
              <FormField label="Specify occupation">
                <Input 
                  placeholder="Enter your occupation" 
                  value={formData.occupationOther || ""} 
                  onChange={(e) => updateField("occupationOther", e.target.value)}
                  data-testid="input-occupation-other"
                />
              </FormField>
            )}

            {/* Addiction History */}
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg space-y-4">
              <h4 className="font-medium text-red-800 dark:text-red-300 flex items-center gap-2">
                <Wine className="w-4 h-4" /> Addiction History
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">Please answer honestly. Your answers help doctors understand your test results better.</p>
              
              <FormField label="Have you ever used any habit-forming substances?">
                <Select value={formData.substanceUseStatus || ""} onValueChange={(v) => updateField("substanceUseStatus", v)}>
                  <SelectTrigger data-testid="select-substance-status"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {[
                      "No, never",
                      "Yes, in the past but stopped now",
                      "Yes, I am currently using"
                    ].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              
              {(formData.substanceUseStatus === "Yes, in the past but stopped now" || formData.substanceUseStatus === "Yes, I am currently using") && (
                <>
                  <MultiSelectGroup 
                    label="Which substance(s) have you used or are using?" 
                    field="substancesUsed" 
                    options={[
                      "Cigarettes/bidi",
                      "Chewing tobacco/gutkha/khaini",
                      "Beer",
                      "Wine",
                      "Whisky/rum/brandy",
                      "Painkillers (opioids)",
                      "Sleeping/anxiety pills (sedatives)",
                      "Ganja/marijuana/charas (cannabis)",
                      "Cocaine/stimulants",
                      "Glue/whitener/thinner (inhalants)",
                      "Steroids",
                      "Other"
                    ]} 
                  />
                  
                  {((formData.substancesUsed as string[]) || []).includes("Other") && (
                    <FormField label="Specify other substance">
                      <Input 
                        placeholder="Enter substance name" 
                        value={formData.substanceOther || ""} 
                        onChange={(e) => updateField("substanceOther", e.target.value)}
                        data-testid="input-substance-other"
                      />
                    </FormField>
                  )}
                  
                  {/* Per-substance details */}
                  {((formData.substancesUsed as string[]) || []).map((substance) => {
                    // For "Other", use the custom name if provided
                    const displayName = substance === "Other" 
                      ? (formData.substanceOther ? `Other: ${formData.substanceOther}` : "Other (please specify name above)") 
                      : substance;
                    // Normalize the key for consistent storage
                    const substanceKey = normalizeSubstanceKey(
                      substance === "Other" && formData.substanceOther 
                        ? `Other_${formData.substanceOther}` 
                        : substance
                    );
                    
                    // Don't show details for "Other" until name is specified
                    if (substance === "Other" && !formData.substanceOther) return null;
                    
                    return (
                    <div key={substanceKey} className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 rounded-lg space-y-4 border border-red-200 dark:border-red-800">
                      <h5 className="font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                        <Pill className="w-4 h-4" /> Details for: {displayName}
                      </h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="At what age did you start?">
                          <Input 
                            type="number" 
                            min="1"
                            placeholder="Age in years" 
                            value={(getSubstanceDetail(substanceKey, "startAge") as number) || ""} 
                            onChange={(e) => updateSubstanceDetail(substanceKey, "startAge", parseInt(e.target.value) || undefined)}
                            data-testid={`input-${substanceKey.replace(/[^a-zA-Z0-9]/g, '-')}-start-age`}
                          />
                        </FormField>
                        
                        <FormField label="For how many years have you used?">
                          <Input 
                            type="number" 
                            min="0"
                            placeholder="Years" 
                            value={(getSubstanceDetail(substanceKey, "useYears") as number) || ""} 
                            onChange={(e) => updateSubstanceDetail(substanceKey, "useYears", parseInt(e.target.value) || undefined)}
                            data-testid={`input-${substanceKey.replace(/[^a-zA-Z0-9]/g, '-')}-years`}
                          />
                        </FormField>
                      </div>
                      
                      <FormField label="How often do you use it?">
                        <Select 
                          value={(getSubstanceDetail(substanceKey, "frequency") as string) || ""} 
                          onValueChange={(v) => updateSubstanceDetail(substanceKey, "frequency", v)}
                        >
                          <SelectTrigger data-testid={`select-${substanceKey.replace(/[^a-zA-Z0-9]/g, '-')}-frequency`}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              "Every day",
                              "A few times a week",
                              "Occasionally (once in a while)",
                              "Only in large amounts at one time (binge use)"
                            ].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormField>
                      
                      <FormField label="Amount consumed">
                        <Input 
                          placeholder="e.g., 2 drinks per day, 5 cigarettes per day" 
                          value={(getSubstanceDetail(substanceKey, "amount") as string) || ""} 
                          onChange={(e) => updateSubstanceDetail(substanceKey, "amount", e.target.value)}
                          data-testid={`input-${substanceKey.replace(/[^a-zA-Z0-9]/g, '-')}-amount`}
                        />
                      </FormField>
                      
                      <FormField label="When was the last time you used it?">
                        <Input 
                          placeholder="Date or days ago" 
                          value={(getSubstanceDetail(substanceKey, "lastUse") as string) || ""} 
                          onChange={(e) => updateSubstanceDetail(substanceKey, "lastUse", e.target.value)}
                          data-testid={`input-${substanceKey.replace(/[^a-zA-Z0-9]/g, '-')}-last-use`}
                        />
                      </FormField>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Do you feel a strong urge or need to use?">
                          <Select 
                            value={(getSubstanceDetail(substanceKey, "craving") as string) || ""} 
                            onValueChange={(v) => updateSubstanceDetail(substanceKey, "craving", v)}
                          >
                            <SelectTrigger data-testid={`select-${substanceKey.replace(/[^a-zA-Z0-9]/g, '-')}-craving`}>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormField>
                        
                        <FormField label="Do you need more to get the same effect?">
                          <Select 
                            value={(getSubstanceDetail(substanceKey, "tolerance") as string) || ""} 
                            onValueChange={(v) => updateSubstanceDetail(substanceKey, "tolerance", v)}
                          >
                            <SelectTrigger data-testid={`select-${substanceKey.replace(/[^a-zA-Z0-9]/g, '-')}-tolerance`}>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormField>
                      </div>
                      
                      <FormField label="Do you feel unwell when you stop using?">
                        <Select 
                          value={(getSubstanceDetail(substanceKey, "withdrawalSeverity") as string) || ""} 
                          onValueChange={(v) => updateSubstanceDetail(substanceKey, "withdrawalSeverity", v)}
                        >
                          <SelectTrigger data-testid={`select-${substanceKey.replace(/[^a-zA-Z0-9]/g, '-')}-withdrawal`}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {["No symptoms", "Mild symptoms", "Severe symptoms"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormField>
                    </div>
                  );
                  })}
                  
                  <MultiSelectGroup 
                    label="Have you ever taken treatment to stop this habit?" 
                    field="substanceTreatmentHistory" 
                    options={[
                      "No",
                      "Yes, medicines or hospital admission (detox)",
                      "Counseling or rehabilitation center",
                      "Started again after stopping (relapse)"
                    ]} 
                  />
                  
                  <FormField label="Would you like help or guidance to reduce/stop?">
                    <Select value={formData.substanceNeedHelp || ""} onValueChange={(v) => updateField("substanceNeedHelp", v)}>
                      <SelectTrigger data-testid="select-need-help"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {["Yes", "No", "Maybe later"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  
                  <FormField label="Any additional information? (Optional)">
                    <Input 
                      placeholder="Any other details you'd like to share" 
                      value={formData.substanceAdditionalInfo || ""} 
                      onChange={(e) => updateField("substanceAdditionalInfo", e.target.value)}
                      data-testid="input-substance-additional"
                    />
                  </FormField>
                </>
              )}
            </div>

            {/* Occupation History */}
            <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg space-y-4">
              <h4 className="font-medium text-teal-800 dark:text-teal-300 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Occupation History
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">Your work may affect your health and blood test results. Please answer honestly.</p>
              
              <FormField label="Are you currently working?">
                <Select value={formData.currentWorkStatus || ""} onValueChange={(v) => updateField("currentWorkStatus", v)}>
                  <SelectTrigger data-testid="select-work-status"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Yes", "No", "Retired", "Student", "Homemaker"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              
              {formData.currentWorkStatus === "Yes" && (
                <>
                  <FormField label="What is your current occupation/job title?">
                    <Input 
                      placeholder="Enter job title" 
                      value={formData.currentJobTitle || ""} 
                      onChange={(e) => updateField("currentJobTitle", e.target.value)}
                      data-testid="input-job-title"
                    />
                  </FormField>
                  
                  <FormField label="What type of work do you mainly do?">
                    <Select value={formData.workMainType || ""} onValueChange={(v) => updateField("workMainType", v)}>
                      <SelectTrigger data-testid="select-work-type"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {[
                          "Office/desk work (sitting most of the time)",
                          "Physical/manual work (lifting, walking, standing)",
                          "Skilled technical work (machine operation, repair)",
                          "Healthcare work (hospital, lab, nursing)",
                          "Agriculture/farming",
                          "Industrial/factory work",
                          "Business/shop work",
                          "Other"
                        ].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="How many years have you been doing this work?">
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="Years" 
                        value={formData.workYearsInJob || ""} 
                        onChange={(e) => updateField("workYearsInJob", parseInt(e.target.value) || undefined)}
                        data-testid="input-work-years"
                      />
                    </FormField>
                    
                    <FormField label="How many hours do you work per day?">
                      <Select value={formData.workHoursDaily || ""} onValueChange={(v) => updateField("workHoursDaily", v)}>
                        <SelectTrigger data-testid="select-work-hours"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {["Less than 6 hours", "6-8 hours", "More than 8 hours"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>
                  
                  <FormField label="Do you work in shifts?">
                    <Select value={formData.workShifts || ""} onValueChange={(v) => updateField("workShifts", v)}>
                      <SelectTrigger data-testid="select-work-shifts"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {["No", "Yes, rotating shifts", "Yes, night shifts"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  
                  <FormField label="Does your work involve exposure to harmful substances?">
                    <Select value={formData.workHarmfulExposure || ""} onValueChange={(v) => updateField("workHarmfulExposure", v)}>
                      <SelectTrigger data-testid="select-harmful-exposure"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  
                  {formData.workHarmfulExposure === "Yes" && (
                    <MultiSelectGroup 
                      label="Types of harmful exposure" 
                      field="workExposureTypes" 
                      options={[
                        "Dust (cement, coal, silica)",
                        "Chemicals (acids, solvents, pesticides)",
                        "Fumes or gases (smoke, welding fumes)",
                        "Heavy metals (lead, mercury, arsenic)",
                        "Biological materials (blood, body fluids)",
                        "Radiation (X-ray, nuclear, radiology work)",
                        "Loud noise (machines, factories)"
                      ]} 
                    />
                  )}
                  
                  <FormField label="Do you use protective equipment at work?">
                    <Select value={formData.workProtectiveEquipment || ""} onValueChange={(v) => updateField("workProtectiveEquipment", v)}>
                      <SelectTrigger data-testid="select-protective-equipment"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {["Yes, regularly (mask, gloves, helmet, goggles)", "Sometimes", "No"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Does your work involve heavy physical activity?">
                      <Select value={formData.workPhysicalStrain || ""} onValueChange={(v) => updateField("workPhysicalStrain", v)}>
                        <SelectTrigger data-testid="select-physical-strain"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {["No", "Mild (walking, light lifting)", "Moderate (regular lifting, long standing)", "Heavy (very hard physical labor)"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormField>
                    
                    <FormField label="Does your job cause mental stress?">
                      <Select value={formData.workMentalStress || ""} onValueChange={(v) => updateField("workMentalStress", v)}>
                        <SelectTrigger data-testid="select-mental-stress"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {["No", "Mild", "Moderate", "Severe"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>
                  
                  <MultiSelectGroup 
                    label="Do you have any health problems related to your work?" 
                    field="workRelatedHealthProblems" 
                    options={[
                      "None",
                      "Back pain/joint pain",
                      "Breathing problems (asthma, cough)",
                      "Skin problems (rashes, itching)",
                      "Hearing problems",
                      "Vision problems",
                      "Frequent infections"
                    ]} 
                  />
                  
                  <FormField label="Have you ever changed or stopped a job due to health issues?">
                    <Select value={formData.workJobChangeHealth || ""} onValueChange={(v) => updateField("workJobChangeHealth", v)}>
                      <SelectTrigger data-testid="select-job-change"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  
                  {formData.workJobChangeHealth === "Yes" && (
                    <FormField label="Reason for job change">
                      <Input 
                        placeholder="Briefly describe the reason" 
                        value={formData.workJobChangeReason || ""} 
                        onChange={(e) => updateField("workJobChangeReason", e.target.value)}
                        data-testid="input-job-change-reason"
                      />
                    </FormField>
                  )}
                </>
              )}
              
              {/* Previous Occupation */}
              <div className="pt-4 border-t border-teal-200 dark:border-teal-700">
                <h5 className="text-sm font-medium text-teal-700 dark:text-teal-400 mb-3">Previous Occupation (if different)</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Previous job title">
                    <Input 
                      placeholder="Previous occupation" 
                      value={formData.previousJobTitle || ""} 
                      onChange={(e) => updateField("previousJobTitle", e.target.value)}
                      data-testid="input-previous-job"
                    />
                  </FormField>
                  
                  <FormField label="Years worked">
                    <Input 
                      type="number" 
                      min="0"
                      placeholder="Years" 
                      value={formData.previousJobYears || ""} 
                      onChange={(e) => updateField("previousJobYears", parseInt(e.target.value) || undefined)}
                      data-testid="input-previous-years"
                    />
                  </FormField>
                </div>
                
                <div className="mt-4">
                  <FormField label="Did previous job involve harmful exposure?">
                    <Select value={formData.previousJobExposure || ""} onValueChange={(v) => updateField("previousJobExposure", v)}>
                      <SelectTrigger data-testid="select-previous-exposure"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  
                  {formData.previousJobExposure === "Yes" && (
                    <div className="mt-4">
                      <FormField label="Details of previous exposure">
                        <Input 
                          placeholder="Describe the exposure" 
                          value={formData.previousJobExposureDetails || ""} 
                          onChange={(e) => updateField("previousJobExposureDetails", e.target.value)}
                          data-testid="input-previous-exposure"
                        />
                      </FormField>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Additional Questions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <FormField label="Are you currently exposed to work-related risks?">
                  <Select value={formData.currentWorkRisks || ""} onValueChange={(v) => updateField("currentWorkRisks", v)}>
                    <SelectTrigger data-testid="select-work-risks"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Yes", "No", "Occasionally", "Not Sure"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="Does your occupation affect medical follow-ups?">
                  <Select value={formData.workAffectsMedicalVisits || ""} onValueChange={(v) => updateField("workAffectsMedicalVisits", v)}>
                    <SelectTrigger data-testid="select-affects-visits"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["No", "Yes, due to work timing", "Yes, due to travel or shift duties"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              
              <FormField label="Would you like advice on reducing work-related health risks?">
                <Select value={formData.workNeedAdvice || ""} onValueChange={(v) => updateField("workNeedAdvice", v)}>
                  <SelectTrigger data-testid="select-work-advice"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Yes", "No", "Maybe later"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              
              <FormField label="Any additional work information to share? (Optional)">
                <Input 
                  placeholder="Any other work-related details" 
                  value={formData.workAdditionalInfo || ""} 
                  onChange={(e) => updateField("workAdditionalInfo", e.target.value)}
                  data-testid="input-work-additional"
                />
              </FormField>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Medical & Surgical History Section */}
      <Card className="overflow-hidden border-0 shadow-md">
        <SectionHeader title="Medical & Surgical History" section="medical" icon={Stethoscope} />
        {expandedSections.medical && (
          <CardContent className="p-5 space-y-4 bg-white dark:bg-slate-800">
            <MultiSelectGroup 
              label="Medical Conditions" 
              field="medicalConditions" 
              options={medicalConditionOptions} 
            />
            
            {((formData.medicalConditions as string[]) || []).includes("Other") && (
              <FormField label="Specify other medical condition">
                <Input 
                  placeholder="Enter medical condition" 
                  value={formData.medicalConditionOther || ""} 
                  onChange={(e) => updateField("medicalConditionOther", e.target.value)}
                  data-testid="input-condition-other"
                />
              </FormField>
            )}
            
            {((formData.medicalConditions as string[]) || []).length > 0 && !((formData.medicalConditions as string[]) || []).includes("None") && (
              <FormField label="Since when?">
                <Input 
                  placeholder="e.g., 5 years, since 2019" 
                  value={formData.medicalConditionSince || ""} 
                  onChange={(e) => updateField("medicalConditionSince", e.target.value)}
                  data-testid="input-condition-since"
                />
              </FormField>
            )}
            
            {/* Current Medication Questions */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-4">
              <h4 className="font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <Pill className="w-4 h-4" /> Current Medication
              </h4>
              
              <FormField label="Are you on any medication right now?">
                <Select value={formData.currentlyOnMedication || ""} onValueChange={(v) => updateField("currentlyOnMedication", v)}>
                  <SelectTrigger data-testid="select-currently-on-medication"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              
              {formData.currentlyOnMedication === "Yes" && (
                <>
                  <FormField label="Please provide medication details">
                    <Input 
                      placeholder="Name of medicine with dose, for what disease/symptom, since when" 
                      value={formData.medicationDetails || ""} 
                      onChange={(e) => updateField("medicationDetails", e.target.value)}
                      data-testid="input-medication-details"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Example: Metformin 500mg twice daily for diabetes, since 2020</p>
                  </FormField>
                  
                  <FormField label="Have you ever experienced any kind of drug reaction after taking these medications?">
                    <Select value={formData.medicationDrugReaction || ""} onValueChange={(v) => updateField("medicationDrugReaction", v)}>
                      <SelectTrigger data-testid="select-medication-drug-reaction"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  
                  {formData.medicationDrugReaction === "Yes" && (
                    <>
                      <FormField label="Which medicine caused the reaction?">
                        <Input 
                          placeholder="Enter medicine name that caused the reaction" 
                          value={formData.drugReactionMedicineName || ""} 
                          onChange={(e) => updateField("drugReactionMedicineName", e.target.value)}
                          data-testid="input-drug-reaction-medicine"
                        />
                      </FormField>
                      <FormField label="Did you consult any physician regarding that?">
                        <Select value={formData.consultedPhysicianForReaction || ""} onValueChange={(v) => updateField("consultedPhysicianForReaction", v)}>
                          <SelectTrigger data-testid="select-consulted-physician"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormField>
                    </>
                  )}
                </>
              )}
            </div>

            <FormField label="Do you have any history of surgery?">
              <Select value={formData.surgicalHistory || ""} onValueChange={(v) => updateField("surgicalHistory", v)}>
                <SelectTrigger data-testid="select-surgery"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["No past surgery", "Yes, I have had surgery"].map(o => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            
            {formData.surgicalHistory === "Yes, I have had surgery" && (
              <div className="space-y-4">
                {/* List of surgeries */}
                {(formData.surgeries || []).map((surgery, index) => (
                  <div key={index} className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg space-y-4 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-purple-700 dark:text-purple-300">Surgery {index + 1}</h5>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        onClick={() => removeSurgery(index)}
                        data-testid={`button-remove-surgery-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <FormField label="Type of surgery">
                      <Select 
                        value={surgery.type || ""} 
                        onValueChange={(v) => updateSurgery(index, "type", v)}
                      >
                        <SelectTrigger data-testid={`select-surgery-type-${index}`}>
                          <SelectValue placeholder="Select surgery type" />
                        </SelectTrigger>
                        <SelectContent>
                          {["Appendectomy", "Caesarean section", "Gall bladder removal", "Hernia repair", "Heart surgery", "Orthopedic surgery", "Eye surgery", "Other"].map(o => (
                            <SelectItem key={o} value={o}>{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                    
                    {surgery.type === "Other" && (
                      <FormField label="Specify surgery type">
                        <Input 
                          placeholder="Enter the type of surgery" 
                          value={surgery.typeOther || ""} 
                          onChange={(e) => updateSurgery(index, "typeOther", e.target.value)}
                          data-testid={`input-surgery-other-${index}`}
                        />
                      </FormField>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="When was the surgery?">
                        <Input 
                          type="date" 
                          value={surgery.date || ""} 
                          onChange={(e) => updateSurgery(index, "date", e.target.value)}
                          data-testid={`input-surgery-date-${index}`}
                        />
                      </FormField>
                      <FormField label="Indication for surgery">
                        <Input 
                          placeholder="Reason for surgery" 
                          value={surgery.indication || ""} 
                          onChange={(e) => updateSurgery(index, "indication", e.target.value)}
                          data-testid={`input-surgery-indication-${index}`}
                        />
                      </FormField>
                    </div>
                    
                    {/* Intra-operative complication */}
                    <FormField label="Did you have any intra-operative complication?">
                      <Select 
                        value={surgery.intraOperativeComplication || ""} 
                        onValueChange={(v) => updateSurgery(index, "intraOperativeComplication", v)}
                      >
                        <SelectTrigger data-testid={`select-intra-op-complication-${index}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormField>
                    
                    {surgery.intraOperativeComplication === "Yes" && (
                      <FormField label="How was it managed?">
                        <Input 
                          placeholder="Describe how the complication was managed" 
                          value={surgery.intraOperativeManagement || ""} 
                          onChange={(e) => updateSurgery(index, "intraOperativeManagement", e.target.value)}
                          data-testid={`input-intra-op-management-${index}`}
                        />
                      </FormField>
                    )}
                    
                    {/* Post-operative complication */}
                    <FormField label="Did you have any post-operative complication?">
                      <Select 
                        value={surgery.postOperativeComplication || ""} 
                        onValueChange={(v) => updateSurgery(index, "postOperativeComplication", v)}
                      >
                        <SelectTrigger data-testid={`select-post-op-complication-${index}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormField>
                    
                    {surgery.postOperativeComplication === "Yes" && (
                      <FormField label="How was it managed?">
                        <Input 
                          placeholder="Describe how the complication was managed" 
                          value={surgery.postOperativeManagement || ""} 
                          onChange={(e) => updateSurgery(index, "postOperativeManagement", e.target.value)}
                          data-testid={`input-post-op-management-${index}`}
                        />
                      </FormField>
                    )}
                    
                    {/* Follow-up instructions */}
                    <FormField label="Were you instructed to appear for follow-up?">
                      <Select 
                        value={surgery.followUpInstructed || ""} 
                        onValueChange={(v) => updateSurgery(index, "followUpInstructed", v)}
                      >
                        <SelectTrigger data-testid={`select-follow-up-${index}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormField>
                    
                    {surgery.followUpInstructed === "Yes" && (
                      <FormField label="How often were you instructed to appear for follow-ups?">
                        <Input 
                          placeholder="e.g., Weekly, Monthly, Every 3 months" 
                          value={surgery.followUpFrequency || ""} 
                          onChange={(e) => updateSurgery(index, "followUpFrequency", e.target.value)}
                          data-testid={`input-follow-up-frequency-${index}`}
                        />
                      </FormField>
                    )}
                  </div>
                ))}
                
                {/* Add surgery button */}
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addSurgery}
                  className="w-full"
                  data-testid="button-add-surgery"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Surgery
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Family History Section */}
      <Card className="overflow-hidden border-0 shadow-md">
        <SectionHeader title="Family History" section="family" icon={Heart} />
        {expandedSections.family && (
          <CardContent className="p-5 space-y-6 bg-white dark:bg-slate-800">
            {/* Mother */}
            <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg space-y-4">
              <h4 className="font-medium text-pink-800 dark:text-pink-300">Mother's History</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Is your mother alive?">
                  <Select value={formData.motherAlive || ""} onValueChange={(v) => updateField("motherAlive", v)}>
                    <SelectTrigger data-testid="select-mother-alive"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                {formData.motherAlive === "No" && (
                  <FormField label="Cause and time of death">
                    <Input 
                      placeholder="e.g., Heart disease, 5 years ago" 
                      value={formData.motherCauseOfDeath || ""} 
                      onChange={(e) => updateField("motherCauseOfDeath", e.target.value)}
                      data-testid="input-mother-death"
                    />
                  </FormField>
                )}
              </div>
              
              {formData.motherAlive === "Yes" && (
                <>
                  <FormField label="Does she have any significant medical history?">
                    <Select value={formData.motherHasSignificantHistory || ""} onValueChange={(v) => updateField("motherHasSignificantHistory", v)}>
                      <SelectTrigger data-testid="select-mother-significant-history"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  
                  {formData.motherHasSignificantHistory === "Yes" && (
                    <>
                      <MultiSelectGroup 
                        label="Mother's medical conditions" 
                        field="motherMedicalHistory" 
                        options={medicalConditionOptions} 
                      />
                      
                      {((formData.motherMedicalHistory as string[]) || []).includes("Other") && (
                        <FormField label="Specify other condition">
                          <Input 
                            placeholder="Enter medical condition" 
                            value={formData.motherMedicalHistoryOther || ""} 
                            onChange={(e) => updateField("motherMedicalHistoryOther", e.target.value)}
                            data-testid="input-mother-condition-other"
                          />
                        </FormField>
                      )}
                      
                      <FormField label="Since when?">
                        <Input 
                          placeholder="e.g., 5 years, since 2019" 
                          value={formData.motherMedicalHistorySince || ""} 
                          onChange={(e) => updateField("motherMedicalHistorySince", e.target.value)}
                          data-testid="input-mother-condition-since"
                        />
                      </FormField>
                    </>
                  )}
                  
                  <FormField label="Is she on any medication right now?">
                    <Select value={formData.motherOnMedication || ""} onValueChange={(v) => updateField("motherOnMedication", v)}>
                      <SelectTrigger data-testid="select-mother-on-medication"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  
                  {formData.motherOnMedication === "Yes" && (
                    <>
                      <FormField label="Medication details">
                        <Input 
                          placeholder="Name of medicine with dose & since when" 
                          value={formData.motherMedications || ""} 
                          onChange={(e) => updateField("motherMedications", e.target.value)}
                          data-testid="input-mother-meds"
                        />
                      </FormField>
                      
                      <FormField label="Has she ever experienced any drug reaction after taking these medications?">
                        <Select value={formData.motherDrugReaction || ""} onValueChange={(v) => updateField("motherDrugReaction", v)}>
                          <SelectTrigger data-testid="select-mother-drug-reaction"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormField>
                      
                      {formData.motherDrugReaction === "Yes" && (
                        <FormField label="Did she consult any physician regarding that?">
                          <Select value={formData.motherConsultedPhysician || ""} onValueChange={(v) => updateField("motherConsultedPhysician", v)}>
                            <SelectTrigger data-testid="select-mother-consulted-physician"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormField>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Father */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-4">
              <h4 className="font-medium text-blue-800 dark:text-blue-300">Father's History</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Is your father alive?">
                  <Select value={formData.fatherAlive || ""} onValueChange={(v) => updateField("fatherAlive", v)}>
                    <SelectTrigger data-testid="select-father-alive"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                {formData.fatherAlive === "No" && (
                  <FormField label="Cause and time of death">
                    <Input 
                      placeholder="e.g., Heart disease, 5 years ago" 
                      value={formData.fatherCauseOfDeath || ""} 
                      onChange={(e) => updateField("fatherCauseOfDeath", e.target.value)}
                      data-testid="input-father-death"
                    />
                  </FormField>
                )}
              </div>
              
              {formData.fatherAlive === "Yes" && (
                <>
                  <FormField label="Does he have any significant medical history?">
                    <Select value={formData.fatherHasSignificantHistory || ""} onValueChange={(v) => updateField("fatherHasSignificantHistory", v)}>
                      <SelectTrigger data-testid="select-father-significant-history"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  
                  {formData.fatherHasSignificantHistory === "Yes" && (
                    <>
                      <MultiSelectGroup 
                        label="Father's medical conditions" 
                        field="fatherMedicalHistory" 
                        options={medicalConditionOptions} 
                      />
                      
                      {((formData.fatherMedicalHistory as string[]) || []).includes("Other") && (
                        <FormField label="Specify other condition">
                          <Input 
                            placeholder="Enter medical condition" 
                            value={formData.fatherMedicalHistoryOther || ""} 
                            onChange={(e) => updateField("fatherMedicalHistoryOther", e.target.value)}
                            data-testid="input-father-condition-other"
                          />
                        </FormField>
                      )}
                      
                      <FormField label="Since when?">
                        <Input 
                          placeholder="e.g., 5 years, since 2019" 
                          value={formData.fatherMedicalHistorySince || ""} 
                          onChange={(e) => updateField("fatherMedicalHistorySince", e.target.value)}
                          data-testid="input-father-condition-since"
                        />
                      </FormField>
                    </>
                  )}
                  
                  <FormField label="Is he on any medication right now?">
                    <Select value={formData.fatherOnMedication || ""} onValueChange={(v) => updateField("fatherOnMedication", v)}>
                      <SelectTrigger data-testid="select-father-on-medication"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  
                  {formData.fatherOnMedication === "Yes" && (
                    <>
                      <FormField label="Medication details">
                        <Input 
                          placeholder="Name of medicine with dose & since when" 
                          value={formData.fatherMedications || ""} 
                          onChange={(e) => updateField("fatherMedications", e.target.value)}
                          data-testid="input-father-meds"
                        />
                      </FormField>
                      
                      <FormField label="Has he ever experienced any drug reaction after taking these medications?">
                        <Select value={formData.fatherDrugReaction || ""} onValueChange={(v) => updateField("fatherDrugReaction", v)}>
                          <SelectTrigger data-testid="select-father-drug-reaction"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormField>
                      
                      {formData.fatherDrugReaction === "Yes" && (
                        <FormField label="Did he consult any physician regarding that?">
                          <Select value={formData.fatherConsultedPhysician || ""} onValueChange={(v) => updateField("fatherConsultedPhysician", v)}>
                            <SelectTrigger data-testid="select-father-consulted-physician"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormField>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Siblings */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg space-y-4">
              <h4 className="font-medium text-green-800 dark:text-green-300">Siblings</h4>
              <FormField label="How many siblings do you have?">
                <Select 
                  value={formData.siblingsCount?.toString() || ""} 
                  onValueChange={(v) => {
                    const count = parseInt(v) || 0;
                    updateField("siblingsCount", count);
                    // Initialize siblingsDetails array when count changes
                    const currentDetails = (formData.siblingsDetails as any[]) || [];
                    if (count > currentDetails.length) {
                      const newDetails = [...currentDetails];
                      for (let i = currentDetails.length; i < count; i++) {
                        newDetails.push({ index: i });
                      }
                      updateField("siblingsDetails", newDetails);
                    } else if (count < currentDetails.length) {
                      updateField("siblingsDetails", currentDetails.slice(0, count));
                    }
                  }}
                >
                  <SelectTrigger data-testid="select-siblings-count"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10+"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              
              {(formData.siblingsCount || 0) > 0 && (
                <>
                  {Array.from({ length: Math.min(formData.siblingsCount || 0, 10) }).map((_, idx) => {
                    const siblingsDetails = (formData.siblingsDetails as any[]) || [];
                    const sibling = siblingsDetails[idx] || { index: idx };
                    
                    const updateSiblingField = (field: string, value: any) => {
                      const newDetails = [...siblingsDetails];
                      if (!newDetails[idx]) {
                        newDetails[idx] = { index: idx };
                      }
                      newDetails[idx] = { ...newDetails[idx], [field]: value };
                      updateField("siblingsDetails", newDetails);
                    };
                    
                    return (
                      <div key={idx} className="p-3 bg-white dark:bg-slate-700 rounded-lg space-y-3 border border-green-200 dark:border-green-700">
                        <h5 className="font-medium text-green-700 dark:text-green-400">Sibling {idx + 1}</h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <FormField label="Name (optional)">
                            <Input 
                              placeholder="Name" 
                              value={sibling.name || ""} 
                              onChange={(e) => updateSiblingField("name", e.target.value)}
                              data-testid={`input-sibling-${idx}-name`}
                            />
                          </FormField>
                          
                          <FormField label="Age">
                            <Input 
                              type="number" 
                              min="0"
                              placeholder="Age" 
                              value={sibling.age || ""} 
                              onChange={(e) => updateSiblingField("age", parseInt(e.target.value) || undefined)}
                              data-testid={`input-sibling-${idx}-age`}
                            />
                          </FormField>
                          
                          <FormField label="Sex">
                            <Select value={sibling.sex || ""} onValueChange={(v) => updateSiblingField("sex", v)}>
                              <SelectTrigger data-testid={`select-sibling-${idx}-sex`}><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {["Male", "Female"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormField>
                        </div>
                        
                        <FormField label="Status">
                          <Select value={sibling.alive || ""} onValueChange={(v) => updateSiblingField("alive", v)}>
                            <SelectTrigger data-testid={`select-sibling-${idx}-alive`}><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {["Alive", "Deceased"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormField>
                        
                        {sibling.alive === "Deceased" && (
                          <FormField label="Cause and time of death">
                            <Input 
                              placeholder="e.g., Cancer, 3 years ago" 
                              value={sibling.causeOfDeath || ""} 
                              onChange={(e) => updateSiblingField("causeOfDeath", e.target.value)}
                              data-testid={`input-sibling-${idx}-death-cause`}
                            />
                          </FormField>
                        )}
                        
                        {sibling.alive === "Alive" && (
                          <>
                            <FormField label="Any significant medical history?">
                              <Select value={sibling.hasSignificantHistory || ""} onValueChange={(v) => updateSiblingField("hasSignificantHistory", v)}>
                                <SelectTrigger data-testid={`select-sibling-${idx}-significant-history`}><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                  {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </FormField>
                            
                            {sibling.hasSignificantHistory === "Yes" && (
                              <>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Medical conditions</label>
                                  <div className="flex flex-wrap gap-2">
                                    {medicalConditionOptions.map(option => {
                                      const selected = (sibling.medicalHistory || []).includes(option);
                                      return (
                                        <label key={option} className="flex items-center gap-2 cursor-pointer">
                                          <Checkbox 
                                            checked={selected}
                                            onCheckedChange={(checked) => {
                                              const current = sibling.medicalHistory || [];
                                              if (checked) {
                                                updateSiblingField("medicalHistory", [...current, option]);
                                              } else {
                                                updateSiblingField("medicalHistory", current.filter((c: string) => c !== option));
                                              }
                                            }}
                                            data-testid={`checkbox-sibling-${idx}-condition-${option.toLowerCase().replace(/\s+/g, '-')}`}
                                          />
                                          <span className="text-sm">{option}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                                
                                {(sibling.medicalHistory || []).includes("Other") && (
                                  <FormField label="Specify other condition">
                                    <Input 
                                      placeholder="Enter medical condition" 
                                      value={sibling.medicalHistoryOther || ""} 
                                      onChange={(e) => updateSiblingField("medicalHistoryOther", e.target.value)}
                                      data-testid={`input-sibling-${idx}-condition-other`}
                                    />
                                  </FormField>
                                )}
                                
                                <FormField label="Since when?">
                                  <Input 
                                    placeholder="e.g., 5 years, since 2019" 
                                    value={sibling.medicalHistorySince || ""} 
                                    onChange={(e) => updateSiblingField("medicalHistorySince", e.target.value)}
                                    data-testid={`input-sibling-${idx}-condition-since`}
                                  />
                                </FormField>
                              </>
                            )}
                            
                            <FormField label="Currently on any medication?">
                              <Select value={sibling.onMedication || ""} onValueChange={(v) => updateSiblingField("onMedication", v)}>
                                <SelectTrigger data-testid={`select-sibling-${idx}-on-medication`}><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                  {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </FormField>
                            
                            {sibling.onMedication === "Yes" && (
                              <>
                                <FormField label="Medication details">
                                  <Input 
                                    placeholder="Name of medicine with dose & since when" 
                                    value={sibling.medications || ""} 
                                    onChange={(e) => updateSiblingField("medications", e.target.value)}
                                    data-testid={`input-sibling-${idx}-meds`}
                                  />
                                </FormField>
                                
                                <FormField label="Any drug reaction?">
                                  <Select value={sibling.drugReaction || ""} onValueChange={(v) => updateSiblingField("drugReaction", v)}>
                                    <SelectTrigger data-testid={`select-sibling-${idx}-drug-reaction`}><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                      {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </FormField>
                                
                                {sibling.drugReaction === "Yes" && (
                                  <FormField label="Did they consult a physician?">
                                    <Select value={sibling.consultedPhysician || ""} onValueChange={(v) => updateSiblingField("consultedPhysician", v)}>
                                      <SelectTrigger data-testid={`select-sibling-${idx}-consulted-physician`}><SelectValue placeholder="Select" /></SelectTrigger>
                                      <SelectContent>
                                        {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  </FormField>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Children */}
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg space-y-4">
              <h4 className="font-medium text-purple-800 dark:text-purple-300">Children</h4>
              <FormField label="How many children do you have?">
                <Input 
                  type="number" 
                  min="0"
                  placeholder="0" 
                  value={formData.childrenCount || ""} 
                  onChange={(e) => updateField("childrenCount", parseInt(e.target.value) || 0)}
                  data-testid="input-children-count"
                />
              </FormField>
              
              {(formData.childrenCount || 0) > 0 && (
                <>
                  <FormField label="Their age & gender">
                    <Input 
                      placeholder="e.g., Son 12 years, Daughter 8 years" 
                      value={formData.childrenAgeGender || ""} 
                      onChange={(e) => updateField("childrenAgeGender", e.target.value)}
                      data-testid="input-children-age-gender"
                    />
                  </FormField>
                  
                  <FormField label="Do they have any significant medical history?">
                    <Select value={formData.childrenHasSignificantHistory || ""} onValueChange={(v) => updateField("childrenHasSignificantHistory", v)}>
                      <SelectTrigger data-testid="select-children-significant-history"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  
                  {formData.childrenHasSignificantHistory === "Yes" && (
                    <>
                      <MultiSelectGroup 
                        label="Children's medical conditions" 
                        field="childrenMedicalHistory" 
                        options={medicalConditionOptions} 
                      />
                      
                      {((formData.childrenMedicalHistory as string[]) || []).includes("Other") && (
                        <FormField label="Specify other condition">
                          <Input 
                            placeholder="Enter medical condition" 
                            value={formData.childrenMedicalHistoryOther || ""} 
                            onChange={(e) => updateField("childrenMedicalHistoryOther", e.target.value)}
                            data-testid="input-children-condition-other"
                          />
                        </FormField>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Grandparents */}
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg space-y-4">
              <h4 className="font-medium text-amber-800 dark:text-amber-300">Grandparents</h4>
              
              {/* Maternal Grandmother */}
              <div className="pl-4 border-l-2 border-amber-300 space-y-3">
                <h5 className="font-medium text-amber-700 dark:text-amber-400">Maternal Grandmother</h5>
                <FormField label="Is she alive?">
                  <Select value={formData.maternalGrandmotherAlive || ""} onValueChange={(v) => updateField("maternalGrandmotherAlive", v)}>
                    <SelectTrigger data-testid="select-maternal-grandmother-alive"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                {formData.maternalGrandmotherAlive === "No" && (
                  <FormField label="Cause and time of death">
                    <Input placeholder="e.g., Old age, 10 years ago" value={formData.maternalGrandmotherCauseOfDeath || ""} onChange={(e) => updateField("maternalGrandmotherCauseOfDeath", e.target.value)} data-testid="input-maternal-grandmother-death" />
                  </FormField>
                )}
                {formData.maternalGrandmotherAlive === "Yes" && (
                  <>
                    <MultiSelectGroup label="Medical conditions" field="maternalGrandmotherMedicalHistory" options={medicalConditionOptions} />
                    {((formData.maternalGrandmotherMedicalHistory as string[]) || []).includes("Other") && (
                      <FormField label="Specify other condition">
                        <Input placeholder="Enter condition" value={formData.maternalGrandmotherMedicalHistoryOther || ""} onChange={(e) => updateField("maternalGrandmotherMedicalHistoryOther", e.target.value)} data-testid="input-maternal-grandmother-other" />
                      </FormField>
                    )}
                  </>
                )}
              </div>
              
              {/* Maternal Grandfather */}
              <div className="pl-4 border-l-2 border-amber-300 space-y-3">
                <h5 className="font-medium text-amber-700 dark:text-amber-400">Maternal Grandfather</h5>
                <FormField label="Is he alive?">
                  <Select value={formData.maternalGrandfatherAlive || ""} onValueChange={(v) => updateField("maternalGrandfatherAlive", v)}>
                    <SelectTrigger data-testid="select-maternal-grandfather-alive"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                {formData.maternalGrandfatherAlive === "No" && (
                  <FormField label="Cause and time of death">
                    <Input placeholder="e.g., Heart disease, 15 years ago" value={formData.maternalGrandfatherCauseOfDeath || ""} onChange={(e) => updateField("maternalGrandfatherCauseOfDeath", e.target.value)} data-testid="input-maternal-grandfather-death" />
                  </FormField>
                )}
                {formData.maternalGrandfatherAlive === "Yes" && (
                  <>
                    <MultiSelectGroup label="Medical conditions" field="maternalGrandfatherMedicalHistory" options={medicalConditionOptions} />
                    {((formData.maternalGrandfatherMedicalHistory as string[]) || []).includes("Other") && (
                      <FormField label="Specify other condition">
                        <Input placeholder="Enter condition" value={formData.maternalGrandfatherMedicalHistoryOther || ""} onChange={(e) => updateField("maternalGrandfatherMedicalHistoryOther", e.target.value)} data-testid="input-maternal-grandfather-other" />
                      </FormField>
                    )}
                  </>
                )}
              </div>
              
              {/* Paternal Grandmother */}
              <div className="pl-4 border-l-2 border-amber-300 space-y-3">
                <h5 className="font-medium text-amber-700 dark:text-amber-400">Paternal Grandmother</h5>
                <FormField label="Is she alive?">
                  <Select value={formData.paternalGrandmotherAlive || ""} onValueChange={(v) => updateField("paternalGrandmotherAlive", v)}>
                    <SelectTrigger data-testid="select-paternal-grandmother-alive"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                {formData.paternalGrandmotherAlive === "No" && (
                  <FormField label="Cause and time of death">
                    <Input placeholder="e.g., Stroke, 8 years ago" value={formData.paternalGrandmotherCauseOfDeath || ""} onChange={(e) => updateField("paternalGrandmotherCauseOfDeath", e.target.value)} data-testid="input-paternal-grandmother-death" />
                  </FormField>
                )}
                {formData.paternalGrandmotherAlive === "Yes" && (
                  <>
                    <MultiSelectGroup label="Medical conditions" field="paternalGrandmotherMedicalHistory" options={medicalConditionOptions} />
                    {((formData.paternalGrandmotherMedicalHistory as string[]) || []).includes("Other") && (
                      <FormField label="Specify other condition">
                        <Input placeholder="Enter condition" value={formData.paternalGrandmotherMedicalHistoryOther || ""} onChange={(e) => updateField("paternalGrandmotherMedicalHistoryOther", e.target.value)} data-testid="input-paternal-grandmother-other" />
                      </FormField>
                    )}
                  </>
                )}
              </div>
              
              {/* Paternal Grandfather */}
              <div className="pl-4 border-l-2 border-amber-300 space-y-3">
                <h5 className="font-medium text-amber-700 dark:text-amber-400">Paternal Grandfather</h5>
                <FormField label="Is he alive?">
                  <Select value={formData.paternalGrandfatherAlive || ""} onValueChange={(v) => updateField("paternalGrandfatherAlive", v)}>
                    <SelectTrigger data-testid="select-paternal-grandfather-alive"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                {formData.paternalGrandfatherAlive === "No" && (
                  <FormField label="Cause and time of death">
                    <Input placeholder="e.g., Diabetes complications, 12 years ago" value={formData.paternalGrandfatherCauseOfDeath || ""} onChange={(e) => updateField("paternalGrandfatherCauseOfDeath", e.target.value)} data-testid="input-paternal-grandfather-death" />
                  </FormField>
                )}
                {formData.paternalGrandfatherAlive === "Yes" && (
                  <>
                    <MultiSelectGroup label="Medical conditions" field="paternalGrandfatherMedicalHistory" options={medicalConditionOptions} />
                    {((formData.paternalGrandfatherMedicalHistory as string[]) || []).includes("Other") && (
                      <FormField label="Specify other condition">
                        <Input placeholder="Enter condition" value={formData.paternalGrandfatherMedicalHistoryOther || ""} onChange={(e) => updateField("paternalGrandfatherMedicalHistoryOther", e.target.value)} data-testid="input-paternal-grandfather-other" />
                      </FormField>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Uncles */}
            <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg space-y-4">
              <h4 className="font-medium text-teal-800 dark:text-teal-300">Uncles</h4>
              
              {/* Maternal Uncles */}
              <div className="pl-4 border-l-2 border-teal-300 space-y-3">
                <h5 className="font-medium text-teal-700 dark:text-teal-400">Maternal Uncles</h5>
                <FormField label="Number of maternal uncles">
                  <Input type="number" min="0" placeholder="0" value={formData.maternalUnclesCount || ""} onChange={(e) => updateField("maternalUnclesCount", parseInt(e.target.value) || 0)} data-testid="input-maternal-uncles-count" />
                </FormField>
                {(formData.maternalUnclesCount || 0) > 0 && (
                  <>
                    <MultiSelectGroup label="Medical conditions" field="maternalUnclesMedicalHistory" options={medicalConditionOptions} />
                    {((formData.maternalUnclesMedicalHistory as string[]) || []).includes("Other") && (
                      <FormField label="Specify other condition">
                        <Input placeholder="Enter condition" value={formData.maternalUnclesMedicalHistoryOther || ""} onChange={(e) => updateField("maternalUnclesMedicalHistoryOther", e.target.value)} data-testid="input-maternal-uncles-other" />
                      </FormField>
                    )}
                  </>
                )}
              </div>
              
              {/* Paternal Uncles */}
              <div className="pl-4 border-l-2 border-teal-300 space-y-3">
                <h5 className="font-medium text-teal-700 dark:text-teal-400">Paternal Uncles</h5>
                <FormField label="Number of paternal uncles">
                  <Input type="number" min="0" placeholder="0" value={formData.paternalUnclesCount || ""} onChange={(e) => updateField("paternalUnclesCount", parseInt(e.target.value) || 0)} data-testid="input-paternal-uncles-count" />
                </FormField>
                {(formData.paternalUnclesCount || 0) > 0 && (
                  <>
                    <MultiSelectGroup label="Medical conditions" field="paternalUnclesMedicalHistory" options={medicalConditionOptions} />
                    {((formData.paternalUnclesMedicalHistory as string[]) || []).includes("Other") && (
                      <FormField label="Specify other condition">
                        <Input placeholder="Enter condition" value={formData.paternalUnclesMedicalHistoryOther || ""} onChange={(e) => updateField("paternalUnclesMedicalHistoryOther", e.target.value)} data-testid="input-paternal-uncles-other" />
                      </FormField>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Aunts */}
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg space-y-4">
              <h4 className="font-medium text-rose-800 dark:text-rose-300">Aunts</h4>
              
              {/* Maternal Aunts */}
              <div className="pl-4 border-l-2 border-rose-300 space-y-3">
                <h5 className="font-medium text-rose-700 dark:text-rose-400">Maternal Aunts</h5>
                <FormField label="Number of maternal aunts">
                  <Input type="number" min="0" placeholder="0" value={formData.maternalAuntsCount || ""} onChange={(e) => updateField("maternalAuntsCount", parseInt(e.target.value) || 0)} data-testid="input-maternal-aunts-count" />
                </FormField>
                {(formData.maternalAuntsCount || 0) > 0 && (
                  <>
                    <MultiSelectGroup label="Medical conditions" field="maternalAuntsMedicalHistory" options={medicalConditionOptions} />
                    {((formData.maternalAuntsMedicalHistory as string[]) || []).includes("Other") && (
                      <FormField label="Specify other condition">
                        <Input placeholder="Enter condition" value={formData.maternalAuntsMedicalHistoryOther || ""} onChange={(e) => updateField("maternalAuntsMedicalHistoryOther", e.target.value)} data-testid="input-maternal-aunts-other" />
                      </FormField>
                    )}
                  </>
                )}
              </div>
              
              {/* Paternal Aunts */}
              <div className="pl-4 border-l-2 border-rose-300 space-y-3">
                <h5 className="font-medium text-rose-700 dark:text-rose-400">Paternal Aunts</h5>
                <FormField label="Number of paternal aunts">
                  <Input type="number" min="0" placeholder="0" value={formData.paternalAuntsCount || ""} onChange={(e) => updateField("paternalAuntsCount", parseInt(e.target.value) || 0)} data-testid="input-paternal-aunts-count" />
                </FormField>
                {(formData.paternalAuntsCount || 0) > 0 && (
                  <>
                    <MultiSelectGroup label="Medical conditions" field="paternalAuntsMedicalHistory" options={medicalConditionOptions} />
                    {((formData.paternalAuntsMedicalHistory as string[]) || []).includes("Other") && (
                      <FormField label="Specify other condition">
                        <Input placeholder="Enter condition" value={formData.paternalAuntsMedicalHistoryOther || ""} onChange={(e) => updateField("paternalAuntsMedicalHistoryOther", e.target.value)} data-testid="input-paternal-aunts-other" />
                      </FormField>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Cousins */}
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg space-y-4">
              <h4 className="font-medium text-indigo-800 dark:text-indigo-300">Cousins</h4>
              
              {/* Maternal Cousins */}
              <div className="pl-4 border-l-2 border-indigo-300 space-y-3">
                <h5 className="font-medium text-indigo-700 dark:text-indigo-400">Maternal Cousins</h5>
                <FormField label="Number of maternal cousins">
                  <Input type="number" min="0" placeholder="0" value={formData.maternalCousinsCount || ""} onChange={(e) => updateField("maternalCousinsCount", parseInt(e.target.value) || 0)} data-testid="input-maternal-cousins-count" />
                </FormField>
                {(formData.maternalCousinsCount || 0) > 0 && (
                  <>
                    <MultiSelectGroup label="Medical conditions" field="maternalCousinsMedicalHistory" options={medicalConditionOptions} />
                    {((formData.maternalCousinsMedicalHistory as string[]) || []).includes("Other") && (
                      <FormField label="Specify other condition">
                        <Input placeholder="Enter condition" value={formData.maternalCousinsMedicalHistoryOther || ""} onChange={(e) => updateField("maternalCousinsMedicalHistoryOther", e.target.value)} data-testid="input-maternal-cousins-other" />
                      </FormField>
                    )}
                  </>
                )}
              </div>
              
              {/* Paternal Cousins */}
              <div className="pl-4 border-l-2 border-indigo-300 space-y-3">
                <h5 className="font-medium text-indigo-700 dark:text-indigo-400">Paternal Cousins</h5>
                <FormField label="Number of paternal cousins">
                  <Input type="number" min="0" placeholder="0" value={formData.paternalCousinsCount || ""} onChange={(e) => updateField("paternalCousinsCount", parseInt(e.target.value) || 0)} data-testid="input-paternal-cousins-count" />
                </FormField>
                {(formData.paternalCousinsCount || 0) > 0 && (
                  <>
                    <MultiSelectGroup label="Medical conditions" field="paternalCousinsMedicalHistory" options={medicalConditionOptions} />
                    {((formData.paternalCousinsMedicalHistory as string[]) || []).includes("Other") && (
                      <FormField label="Specify other condition">
                        <Input placeholder="Enter condition" value={formData.paternalCousinsMedicalHistoryOther || ""} onChange={(e) => updateField("paternalCousinsMedicalHistoryOther", e.target.value)} data-testid="input-paternal-cousins-other" />
                      </FormField>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Spouse & In-laws */}
            <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg space-y-4">
              <h4 className="font-medium text-cyan-800 dark:text-cyan-300">Spouse & In-laws</h4>
              
              <FormField label="Do you have a spouse?">
                <Select value={formData.hasSpouse || ""} onValueChange={(v) => updateField("hasSpouse", v)}>
                  <SelectTrigger data-testid="select-has-spouse"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              
              {formData.hasSpouse === "Yes" && (
                <>
                  <FormField label="Is your spouse alive?">
                    <Select value={formData.spouseAlive || ""} onValueChange={(v) => updateField("spouseAlive", v)}>
                      <SelectTrigger data-testid="select-spouse-alive"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  
                  {formData.spouseAlive === "No" && (
                    <FormField label="Cause and time of death">
                      <Input placeholder="e.g., Accident, 2 years ago" value={formData.spouseCauseOfDeath || ""} onChange={(e) => updateField("spouseCauseOfDeath", e.target.value)} data-testid="input-spouse-death" />
                    </FormField>
                  )}
                  
                  {formData.spouseAlive === "Yes" && (
                    <>
                      <MultiSelectGroup label="Spouse's medical conditions" field="spouseMedicalHistory" options={medicalConditionOptions} />
                      {((formData.spouseMedicalHistory as string[]) || []).includes("Other") && (
                        <FormField label="Specify other condition">
                          <Input placeholder="Enter condition" value={formData.spouseMedicalHistoryOther || ""} onChange={(e) => updateField("spouseMedicalHistoryOther", e.target.value)} data-testid="input-spouse-other" />
                        </FormField>
                      )}
                    </>
                  )}
                  
                  <FormField label="Do your in-laws have any significant medical history?">
                    <Select value={formData.inLawsSignificantHistory || ""} onValueChange={(v) => updateField("inLawsSignificantHistory", v)}>
                      <SelectTrigger data-testid="select-inlaws-significant"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  
                  {formData.inLawsSignificantHistory === "Yes" && (
                    <>
                      <MultiSelectGroup label="In-laws' medical conditions" field="inLawsMedicalHistory" options={medicalConditionOptions} />
                      {((formData.inLawsMedicalHistory as string[]) || []).includes("Other") && (
                        <FormField label="Specify other condition">
                          <Input placeholder="Enter condition" value={formData.inLawsMedicalHistoryOther || ""} onChange={(e) => updateField("inLawsMedicalHistoryOther", e.target.value)} data-testid="input-inlaws-other" />
                        </FormField>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Other Family History */}
            <div className="space-y-4">
              <FormField label="Any history of psychiatric illness in family?">
                <Select value={formData.familyPsychiatricHistory || ""} onValueChange={(v) => updateField("familyPsychiatricHistory", v)}>
                  <SelectTrigger data-testid="select-family-psychiatric"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              
              <FormField label="Any history of untimely death in family?">
                <Select value={formData.familyUntimelyDeath || ""} onValueChange={(v) => updateField("familyUntimelyDeath", v)}>
                  <SelectTrigger data-testid="select-family-untimely"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              
              {formData.familyUntimelyDeath === "Yes" && (
                <FormField label="Type of death">
                  <Select value={formData.familyDeathType || ""} onValueChange={(v) => updateField("familyDeathType", v)}>
                    <SelectTrigger data-testid="select-family-death-type"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Accidental", "Natural", "Suicidal", "Unknown"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Obstetric & Gynecology History Section */}
      <Card className="overflow-hidden border-0 shadow-md">
        <SectionHeader title="Obstetric & Gynecology History" section="obstetric" icon={Baby} />
        {expandedSections.obstetric && (
          <CardContent className="p-5 space-y-6 bg-white dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">This section is applicable for females.</p>
            
            {/* Menstrual History */}
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg space-y-4">
              <h4 className="font-medium text-rose-800 dark:text-rose-300">Menstrual History</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField label="Age at Menarche (First period)">
                  <Input 
                    type="number" 
                    min="8"
                    max="20"
                    placeholder="Age in years" 
                    value={formData.menarcheAge || ""} 
                    onChange={(e) => updateField("menarcheAge", parseInt(e.target.value) || undefined)}
                    data-testid="input-menarche-age"
                  />
                </FormField>
                
                <FormField label="Menstrual Cycle Type">
                  <Select value={formData.menstrualCycleType || ""} onValueChange={(v) => updateField("menstrualCycleType", v)}>
                    <SelectTrigger data-testid="select-cycle-type"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Regular", "Irregular"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="Cycle Length (days)">
                  <Input 
                    type="number" 
                    min="21"
                    max="45"
                    placeholder="Days between periods" 
                    value={formData.cycleLength || ""} 
                    onChange={(e) => updateField("cycleLength", parseInt(e.target.value) || undefined)}
                    data-testid="input-cycle-length"
                  />
                </FormField>
                
                <FormField label="Menstruation Duration (days)">
                  <Input 
                    type="number" 
                    min="1"
                    max="10"
                    placeholder="How many days" 
                    value={formData.menstruationDuration || ""} 
                    onChange={(e) => updateField("menstruationDuration", parseInt(e.target.value) || undefined)}
                    data-testid="input-period-duration"
                  />
                </FormField>
                
                <FormField label="Menstrual Flow">
                  <Select value={formData.menstrualFlow || ""} onValueChange={(v) => updateField("menstrualFlow", v)}>
                    <SelectTrigger data-testid="select-flow"><SelectValue placeholder="Pads per day" /></SelectTrigger>
                    <SelectContent>
                      {["Light (1-2 pads)", "Normal (3-4 pads)", "Heavy (5+ pads)"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="Premenstrual Syndrome">
                  <Select value={formData.premenstrualSyndrome || ""} onValueChange={(v) => updateField("premenstrualSyndrome", v)}>
                    <SelectTrigger data-testid="select-pms"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["No", "Yes, routine not disturbed", "Yes, disturbs routine"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="Dysmenorrhea (Severe cramps)">
                  <Select value={formData.dysmenorrhea || ""} onValueChange={(v) => updateField("dysmenorrhea", v)}>
                    <SelectTrigger data-testid="select-dysmenorrhea"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["No", "Yes, mild", "Yes, affects routine", "Yes, miss work/school"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="Do you experience Mittelschmerz pain (Ovulation pain)?">
                  <Select value={formData.mittelschmerzPain || ""} onValueChange={(v) => updateField("mittelschmerzPain", v)}>
                    <SelectTrigger data-testid="select-mittelschmerz"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Yes", "No", "I am not aware of it"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="Do you take any medication for menstrual issues?">
                  <Select value={formData.ayurvedicMedication || ""} onValueChange={(v) => updateField("ayurvedicMedication", v)}>
                    <SelectTrigger data-testid="select-ayurvedic"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              
              {formData.ayurvedicMedication === "Yes" && (
                <div className="mt-4 p-3 bg-rose-100 dark:bg-rose-900/30 rounded-lg space-y-3">
                  <FormField label="What type of medication do you take?">
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {["Allopathic medicine", "Ayurvedic malt/syrup", "Homemade preparations"].map(option => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={`ayurvedic-type-${option}`}
                            checked={((formData.ayurvedicMedicationType as string[]) || []).includes(option)}
                            onCheckedChange={() => toggleMultiSelect("ayurvedicMedicationType", option)}
                            data-testid={`checkbox-ayurvedic-${option}`}
                          />
                          <label htmlFor={`ayurvedic-type-${option}`} className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </FormField>
                  <FormField label="Please mention the medicine name">
                    <Input 
                      placeholder="Enter medicine name" 
                      value={formData.ayurvedicMedicineName || ""} 
                      onChange={(e) => updateField("ayurvedicMedicineName", e.target.value)}
                      data-testid="input-ayurvedic-name"
                    />
                  </FormField>
                </div>
              )}
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Since Menarche, have you noticed any change in pattern of your menstrual cycle?">
                  <Select value={formData.menstrualPatternChange || ""} onValueChange={(v) => updateField("menstrualPatternChange", v)}>
                    <SelectTrigger data-testid="select-pattern-change"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                {formData.menstrualPatternChange === "Yes" && (
                  <>
                    <FormField label="What change did you notice?">
                      <Input 
                        placeholder="e.g., Heavier flow, irregular periods, shorter cycles" 
                        value={formData.menstrualPatternChangeWhat || ""} 
                        onChange={(e) => updateField("menstrualPatternChangeWhat", e.target.value)}
                        data-testid="input-pattern-change-what"
                      />
                    </FormField>
                    <FormField label="When did you notice the change?">
                      <Input 
                        placeholder="e.g., 2 years ago, after pregnancy" 
                        value={formData.menstrualPatternChangeWhen || ""} 
                        onChange={(e) => updateField("menstrualPatternChangeWhen", e.target.value)}
                        data-testid="input-pattern-change-when"
                      />
                    </FormField>
                    <FormField label="Did you consult any gynaecologist, doctor or health worker?">
                      <Select value={formData.consultedGynaecologist || ""} onValueChange={(v) => updateField("consultedGynaecologist", v)}>
                        <SelectTrigger data-testid="select-consulted-gynaecologist"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </>
                )}
              </div>
            </div>

            {/* Menopause */}
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg space-y-4">
              <h4 className="font-medium text-amber-800 dark:text-amber-300">Menopause</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Age at Menopause (if applicable)">
                  <Input 
                    type="number" 
                    min="40"
                    max="60"
                    placeholder="Age in years" 
                    value={formData.menopauseAge || ""} 
                    onChange={(e) => updateField("menopauseAge", parseInt(e.target.value) || undefined)}
                    data-testid="input-menopause-age"
                  />
                </FormField>
                
                <FormField label="Post-menopausal bleeding?">
                  <Select value={formData.postMenopauseBleeding || ""} onValueChange={(v) => updateField("postMenopauseBleeding", v)}>
                    <SelectTrigger data-testid="select-post-menopause"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              
              <MultiSelectGroup 
                label="Menopause symptoms experienced" 
                field="menopauseSymptoms" 
                options={["Hot flashes", "Vaginal dryness", "Sleep problems", "Dry skin", "Mood changes", "Knee joint pain", "Difficulty walking", "Heart issues", "None"]} 
              />
            </div>

            {/* Obstetric History */}
            <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg space-y-4">
              <h4 className="font-medium text-teal-800 dark:text-teal-300">Obstetric History</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField label="Age at Marriage">
                  <Input 
                    type="number" 
                    min="15"
                    max="60"
                    placeholder="Age in years" 
                    value={formData.ageAtMarriage || ""} 
                    onChange={(e) => updateField("ageAtMarriage", parseInt(e.target.value) || undefined)}
                    data-testid="input-marriage-age"
                  />
                </FormField>
                
                <FormField label="Have you ever been pregnant?">
                  <Select value={formData.everPregnant || ""} onValueChange={(v) => updateField("everPregnant", v)}>
                    <SelectTrigger data-testid="select-pregnant"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                {formData.everPregnant === "Yes" && (
                  <>
                    <FormField label="Number of pregnancies">
                      <Input 
                        type="number" 
                        min="1"
                        placeholder="Total" 
                        value={formData.pregnancyCount || ""} 
                        onChange={(e) => updateField("pregnancyCount", parseInt(e.target.value) || undefined)}
                        data-testid="input-pregnancy-count"
                      />
                    </FormField>
                    
                    <FormField label="Live births">
                      <Input 
                        type="number" 
                        min="0"
                        max="10"
                        placeholder="Number" 
                        value={formData.liveBirths || ""} 
                        onChange={(e) => updateField("liveBirths", parseInt(e.target.value) || undefined)}
                        data-testid="input-live-births"
                      />
                    </FormField>
                  </>
                )}
                
                {/* Live Birth Details */}
                {(formData.liveBirths || 0) >= 1 && (
                  <div className="col-span-full mt-4 space-y-4">
                    {/* First Live Birth */}
                    <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg space-y-4">
                      <h5 className="font-medium text-purple-800 dark:text-purple-300">First Live Birth Details</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField label="Gender">
                          <Select value={formData.firstBirthGender || ""} onValueChange={(v) => updateField("firstBirthGender", v)}>
                            <SelectTrigger data-testid="select-first-birth-gender"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {["Male", "Female", "Other"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormField>
                        <FormField label="Birth weight (kgs)">
                          <Input placeholder="e.g., 3.2" value={formData.firstBirthWeight || ""} onChange={(e) => updateField("firstBirthWeight", e.target.value)} data-testid="input-first-birth-weight" />
                        </FormField>
                        <FormField label="Type of delivery">
                          <Select value={formData.firstBirthDeliveryType || ""} onValueChange={(v) => updateField("firstBirthDeliveryType", v)}>
                            <SelectTrigger data-testid="select-first-birth-delivery"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {["Normal", "LSCS (C-section)", "Assisted Vaginal Birth (Forceps/vacuum)", "Water birth", "Medicated birth (Epidural)"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormField>
                        {(formData.firstBirthDeliveryType === "LSCS (C-section)" || formData.firstBirthDeliveryType === "Assisted Vaginal Birth (Forceps/vacuum)") && (
                          <FormField label="Indication for LSCS/Assisted delivery">
                            <Input 
                              placeholder="e.g., Fetal distress, Prolonged labor" 
                              value={formData.firstBirthDeliveryIndication || ""} 
                              onChange={(e) => updateField("firstBirthDeliveryIndication", e.target.value)}
                              data-testid="input-first-birth-delivery-indication"
                            />
                          </FormField>
                        )}
                        <FormField label="Fetal gestational age at birth">
                          <Select value={formData.firstBirthGestationalAge || ""} onValueChange={(v) => updateField("firstBirthGestationalAge", v)}>
                            <SelectTrigger data-testid="select-first-birth-gestational"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {["Term", "Pre-term", "Post-term"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormField>
                        <FormField label="Did the baby cry soon after birth?">
                          <Select value={formData.firstBirthCriedAfter || ""} onValueChange={(v) => updateField("firstBirthCriedAfter", v)}>
                            <SelectTrigger data-testid="select-first-birth-cried"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormField>
                        <FormField label="Was there any requirement for NICU care?">
                          <Select value={formData.firstBirthNICU || ""} onValueChange={(v) => updateField("firstBirthNICU", v)}>
                            <SelectTrigger data-testid="select-first-birth-nicu"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormField>
                        {formData.firstBirthNICU === "Yes" && (
                          <>
                            <FormField label="For how many days?">
                              <Input type="number" min="1" placeholder="Days" value={formData.firstBirthNICUDays || ""} onChange={(e) => updateField("firstBirthNICUDays", parseInt(e.target.value) || undefined)} data-testid="input-first-birth-nicu-days" />
                            </FormField>
                            <FormField label="Cause of hospitalization">
                              <Input placeholder="Enter cause" value={formData.firstBirthNICUCause || ""} onChange={(e) => updateField("firstBirthNICUCause", e.target.value)} data-testid="input-first-birth-nicu-cause" />
                            </FormField>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Second Live Birth */}
                    {(formData.liveBirths || 0) >= 2 && (
                      <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg space-y-4">
                        <h5 className="font-medium text-purple-800 dark:text-purple-300">Second Live Birth Details</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <FormField label="Gender">
                            <Select value={formData.secondBirthGender || ""} onValueChange={(v) => updateField("secondBirthGender", v)}>
                              <SelectTrigger data-testid="select-second-birth-gender"><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {["Male", "Female", "Other"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormField>
                          <FormField label="Birth weight (kgs)">
                            <Input placeholder="e.g., 3.2" value={formData.secondBirthWeight || ""} onChange={(e) => updateField("secondBirthWeight", e.target.value)} data-testid="input-second-birth-weight" />
                          </FormField>
                          <FormField label="Type of delivery">
                            <Select value={formData.secondBirthDeliveryType || ""} onValueChange={(v) => updateField("secondBirthDeliveryType", v)}>
                              <SelectTrigger data-testid="select-second-birth-delivery"><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {["Normal", "LSCS (C-section)", "Assisted Vaginal Birth (Forceps/vacuum)", "Water birth", "Medicated birth (Epidural)"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormField>
                          {(formData.secondBirthDeliveryType === "LSCS (C-section)" || formData.secondBirthDeliveryType === "Assisted Vaginal Birth (Forceps/vacuum)") && (
                            <FormField label="Indication for LSCS/Assisted delivery">
                              <Input 
                                placeholder="e.g., Fetal distress, Prolonged labor" 
                                value={formData.secondBirthDeliveryIndication || ""} 
                                onChange={(e) => updateField("secondBirthDeliveryIndication", e.target.value)}
                                data-testid="input-second-birth-delivery-indication"
                              />
                            </FormField>
                          )}
                          <FormField label="Fetal gestational age at birth">
                            <Select value={formData.secondBirthGestationalAge || ""} onValueChange={(v) => updateField("secondBirthGestationalAge", v)}>
                              <SelectTrigger data-testid="select-second-birth-gestational"><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {["Term", "Pre-term", "Post-term"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormField>
                          <FormField label="Did the baby cry soon after birth?">
                            <Select value={formData.secondBirthCriedAfter || ""} onValueChange={(v) => updateField("secondBirthCriedAfter", v)}>
                              <SelectTrigger data-testid="select-second-birth-cried"><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormField>
                          <FormField label="Was there any requirement for NICU care?">
                            <Select value={formData.secondBirthNICU || ""} onValueChange={(v) => updateField("secondBirthNICU", v)}>
                              <SelectTrigger data-testid="select-second-birth-nicu"><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormField>
                          {formData.secondBirthNICU === "Yes" && (
                            <>
                              <FormField label="For how many days?">
                                <Input type="number" min="1" placeholder="Days" value={formData.secondBirthNICUDays || ""} onChange={(e) => updateField("secondBirthNICUDays", parseInt(e.target.value) || undefined)} data-testid="input-second-birth-nicu-days" />
                              </FormField>
                              <FormField label="Cause of hospitalization">
                                <Input placeholder="Enter cause" value={formData.secondBirthNICUCause || ""} onChange={(e) => updateField("secondBirthNICUCause", e.target.value)} data-testid="input-second-birth-nicu-cause" />
                              </FormField>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Third Live Birth */}
                    {(formData.liveBirths || 0) >= 3 && (
                      <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg space-y-4">
                        <h5 className="font-medium text-purple-800 dark:text-purple-300">Third Live Birth Details</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <FormField label="Gender">
                            <Select value={formData.thirdBirthGender || ""} onValueChange={(v) => updateField("thirdBirthGender", v)}>
                              <SelectTrigger data-testid="select-third-birth-gender"><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {["Male", "Female", "Other"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormField>
                          <FormField label="Birth weight (kgs)">
                            <Input placeholder="e.g., 3.2" value={formData.thirdBirthWeight || ""} onChange={(e) => updateField("thirdBirthWeight", e.target.value)} data-testid="input-third-birth-weight" />
                          </FormField>
                          <FormField label="Type of delivery">
                            <Select value={formData.thirdBirthDeliveryType || ""} onValueChange={(v) => updateField("thirdBirthDeliveryType", v)}>
                              <SelectTrigger data-testid="select-third-birth-delivery"><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {["Normal", "LSCS (C-section)", "Assisted Vaginal Birth (Forceps/vacuum)", "Water birth", "Medicated birth (Epidural)"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormField>
                          {(formData.thirdBirthDeliveryType === "LSCS (C-section)" || formData.thirdBirthDeliveryType === "Assisted Vaginal Birth (Forceps/vacuum)") && (
                            <FormField label="Indication for LSCS/Assisted delivery">
                              <Input 
                                placeholder="e.g., Fetal distress, Prolonged labor" 
                                value={formData.thirdBirthDeliveryIndication || ""} 
                                onChange={(e) => updateField("thirdBirthDeliveryIndication", e.target.value)}
                                data-testid="input-third-birth-delivery-indication"
                              />
                            </FormField>
                          )}
                          <FormField label="Fetal gestational age at birth">
                            <Select value={formData.thirdBirthGestationalAge || ""} onValueChange={(v) => updateField("thirdBirthGestationalAge", v)}>
                              <SelectTrigger data-testid="select-third-birth-gestational"><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {["Term", "Pre-term", "Post-term"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormField>
                          <FormField label="Did the baby cry soon after birth?">
                            <Select value={formData.thirdBirthCriedAfter || ""} onValueChange={(v) => updateField("thirdBirthCriedAfter", v)}>
                              <SelectTrigger data-testid="select-third-birth-cried"><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormField>
                          <FormField label="Was there any requirement for NICU care?">
                            <Select value={formData.thirdBirthNICU || ""} onValueChange={(v) => updateField("thirdBirthNICU", v)}>
                              <SelectTrigger data-testid="select-third-birth-nicu"><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormField>
                          {formData.thirdBirthNICU === "Yes" && (
                            <>
                              <FormField label="For how many days?">
                                <Input type="number" min="1" placeholder="Days" value={formData.thirdBirthNICUDays || ""} onChange={(e) => updateField("thirdBirthNICUDays", parseInt(e.target.value) || undefined)} data-testid="input-third-birth-nicu-days" />
                              </FormField>
                              <FormField label="Cause of hospitalization">
                                <Input placeholder="Enter cause" value={formData.thirdBirthNICUCause || ""} onChange={(e) => updateField("thirdBirthNICUCause", e.target.value)} data-testid="input-third-birth-nicu-cause" />
                              </FormField>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {formData.everPregnant === "Yes" && (
                  <>
                    <FormField label="Miscarriages">
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="Number" 
                        value={formData.miscarriages || ""} 
                        onChange={(e) => updateField("miscarriages", parseInt(e.target.value) || undefined)}
                        data-testid="input-miscarriages"
                      />
                    </FormField>
                    
                    <FormField label="Induced abortions">
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="Number" 
                        value={formData.inducedAbortions || ""} 
                        onChange={(e) => updateField("inducedAbortions", parseInt(e.target.value) || undefined)}
                        data-testid="input-abortions"
                      />
                    </FormField>
                    
                    <FormField label="Stillbirths">
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="Number" 
                        value={formData.stillbirths || ""} 
                        onChange={(e) => updateField("stillbirths", parseInt(e.target.value) || undefined)}
                        data-testid="input-stillbirths"
                      />
                    </FormField>
                    
                    <FormField label="Type of delivery">
                      <Select value={formData.deliveryType || ""} onValueChange={(v) => updateField("deliveryType", v)}>
                        <SelectTrigger data-testid="select-delivery"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {["Normal vaginal", "LSCS (C-section)", "Assisted (Forceps/vacuum)", "Water birth", "Medicated (Epidural)"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormField>
                    {(formData.deliveryType === "LSCS (C-section)" || formData.deliveryType === "Assisted (Forceps/vacuum)") && (
                      <FormField label="Indication for LSCS/Assisted delivery">
                        <Input 
                          placeholder="e.g., Fetal distress, Prolonged labor" 
                          value={formData.deliveryIndication || ""} 
                          onChange={(e) => updateField("deliveryIndication", e.target.value)}
                          data-testid="input-delivery-indication"
                        />
                      </FormField>
                    )}
                  </>
                )}
                
                <FormField label="Contraceptive use">
                  <Select value={formData.contraceptiveUse || ""} onValueChange={(v) => updateField("contraceptiveUse", v)}>
                    <SelectTrigger data-testid="select-contraceptive"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["None", "Oral pills", "Condoms", "IUD/Copper-T", "Injection", "Natural methods", "Sterilization", "Other"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                {formData.contraceptiveUse === "Other" && (
                  <FormField label="Specify contraceptive method">
                    <Input 
                      placeholder="Enter contraceptive method" 
                      value={formData.contraceptiveOther || ""} 
                      onChange={(e) => updateField("contraceptiveOther", e.target.value)}
                      data-testid="input-contraceptive-other"
                    />
                  </FormField>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Environmental History Section */}
      <Card className="overflow-hidden border-0 shadow-md">
        <SectionHeader title="Environmental History" section="environmental" icon={TreePine} />
        {expandedSections.environmental && (
          <CardContent className="p-5 space-y-6 bg-white dark:bg-slate-800">
            {/* Living Conditions */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg space-y-4">
              <h4 className="font-medium text-emerald-800 dark:text-emerald-300">Living Conditions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField label="Where do you live?">
                  <Select value={formData.livingArea || ""} onValueChange={(v) => updateField("livingArea", v)}>
                    <SelectTrigger data-testid="select-living-area"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Urban (City/Town)", "Semi-urban (Small town)", "Rural (Village)"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="Years living here">
                  <Input 
                    type="number" 
                    min="0"
                    placeholder="Years" 
                    value={formData.livingYears || ""} 
                    onChange={(e) => updateField("livingYears", parseInt(e.target.value) || undefined)}
                    data-testid="input-living-years"
                  />
                </FormField>
                
                <FormField label="Type of house">
                  <Select value={formData.houseType || ""} onValueChange={(v) => updateField("houseType", v)}>
                    <SelectTrigger data-testid="select-house-type"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Concrete/Pucca", "Semi-pucca", "Kutcha (Mud/Temporary)", "Apartment/Flat"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="People in household">
                  <Input 
                    type="number" 
                    min="1"
                    placeholder="Number" 
                    value={formData.householdSize || ""} 
                    onChange={(e) => updateField("householdSize", parseInt(e.target.value) || undefined)}
                    data-testid="input-household-size"
                  />
                </FormField>
                
                <FormField label="Overcrowding?">
                  <Select value={formData.overcrowding || ""} onValueChange={(v) => updateField("overcrowding", v)}>
                    <SelectTrigger data-testid="select-overcrowding"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {yesNoNotSureOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </div>

            {/* Water & Sanitation */}
            <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg space-y-4">
              <h4 className="font-medium text-cyan-800 dark:text-cyan-300">Water & Sanitation</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Drinking water source">
                  <Select value={formData.drinkingWaterSource || ""} onValueChange={(v) => updateField("drinkingWaterSource", v)}>
                    <SelectTrigger data-testid="select-water-source"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Municipal/Tap water", "Borewell/Hand pump", "Well water", "Tanker water", "Bottled/Packaged water"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="Water treatment">
                  <Select value={formData.waterTreatment || ""} onValueChange={(v) => updateField("waterTreatment", v)}>
                    <SelectTrigger data-testid="select-water-treatment"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["No treatment", "Boiling", "Water filter/Purifier", "Chlorination"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="Toilet facility">
                  <Select value={formData.toiletFacility || ""} onValueChange={(v) => updateField("toiletFacility", v)}>
                    <SelectTrigger data-testid="select-toilet"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Flush toilet", "Pit latrine", "Community toilet", "Open defecation"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="Waste disposal">
                  <Select value={formData.wasteDisposal || ""} onValueChange={(v) => updateField("wasteDisposal", v)}>
                    <SelectTrigger data-testid="select-waste"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Municipal collection", "Burned", "Open dumping", "Composting"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </div>

            {/* Kitchen & Pollution */}
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg space-y-4">
              <h4 className="font-medium text-orange-800 dark:text-orange-300">Kitchen & Air Quality</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Cooking fuel">
                  <Select value={formData.cookingFuel || ""} onValueChange={(v) => updateField("cookingFuel", v)}>
                    <SelectTrigger data-testid="select-cooking-fuel"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["LPG/PNG (Gas stove)", "Electricity", "Kerosene", "Firewood/Coal/Cow dung"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="Kitchen ventilation">
                  <Select value={formData.kitchenVentilation || ""} onValueChange={(v) => updateField("kitchenVentilation", v)}>
                    <SelectTrigger data-testid="select-ventilation"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {yesNoNotSureOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              
              <MultiSelectGroup 
                label="Indoor smoke exposure" 
                field="indoorSmokeExposure" 
                options={["None", "From cooking", "From family smoking", "Other"]} 
              />
              
              {((formData.indoorSmokeExposure as string[]) || []).includes("Other") && (
                <FormField label="Specify other indoor smoke exposure">
                  <Input 
                    placeholder="Enter details" 
                    value={formData.indoorSmokeExposureOther || ""} 
                    onChange={(e) => updateField("indoorSmokeExposureOther", e.target.value)}
                    data-testid="input-indoor-smoke-other"
                  />
                </FormField>
              )}
              
              <MultiSelectGroup 
                label="Nearby pollution sources" 
                field="nearbyPollution" 
                options={["None", "Factory/Industrial area", "Heavy traffic road", "Construction site", "Other"]} 
              />
              
              {((formData.nearbyPollution as string[]) || []).includes("Other") && (
                <FormField label="Specify other pollution source">
                  <Input 
                    placeholder="Enter details" 
                    value={formData.nearbyPollutionOther || ""} 
                    onChange={(e) => updateField("nearbyPollutionOther", e.target.value)}
                    data-testid="input-nearby-pollution-other"
                  />
                </FormField>
              )}
              
              <FormField label="Pesticides/chemicals used near home?">
                <Select value={formData.pesticidesExposure || ""} onValueChange={(v) => updateField("pesticidesExposure", v)}>
                  <SelectTrigger data-testid="select-pesticides"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["No", "Yes, in farming areas", "Yes, at home (mosquito sprays/coils)"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              
              <MultiSelectGroup 
                label="Pets or animals at home/nearby" 
                field="petsAtHome" 
                options={["None", "Dogs", "Cats", "Cattle/Poultry", "Other animals"]} 
              />
            </div>

            {/* Health Problems */}
            <MultiSelectGroup 
              label="Environment-related health problems" 
              field="environmentHealthProblems" 
              options={["None", "Frequent cough/breathing problems", "Recurrent infections", "Skin allergies/rashes", "Stomach problems", "Headaches/dizziness"]} 
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Are you exposed to outdoor pollution? (Pollution – dirty air, smoke, dust)">
                <Select value={formData.outdoorPollutionExposure || ""} onValueChange={(v) => updateField("outdoorPollutionExposure", v)}>
                  <SelectTrigger data-testid="select-outdoor-pollution"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["No", "Yes, regularly", "Occasionally"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              
              <FormField label="Stagnant water nearby?">
                <Select value={formData.stagnantWater || ""} onValueChange={(v) => updateField("stagnantWater", v)}>
                  <SelectTrigger data-testid="select-stagnant-water"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            
            <MultiSelectGroup 
              label="History of mosquito-borne diseases" 
              field="mosquitoBorneDiseases" 
              options={["None", "Malaria", "Dengue", "Chikungunya", "Other"]} 
            />
            
            {((formData.mosquitoBorneDiseases as string[]) || []).includes("Other") && (
              <FormField label="Specify other mosquito-borne disease">
                <Input 
                  placeholder="Enter details" 
                  value={formData.mosquitoDiseasesOther || ""} 
                  onChange={(e) => updateField("mosquitoDiseasesOther", e.target.value)}
                  data-testid="input-mosquito-diseases-other"
                />
              </FormField>
            )}
          </CardContent>
        )}
      </Card>

      {/* Vaccination History Section */}
      <Card className="overflow-hidden border-0 shadow-md">
        <SectionHeader title="Vaccination History" section="vaccination" icon={Syringe} />
        {expandedSections.vaccination && (
          <CardContent className="p-5 space-y-4 bg-white dark:bg-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Have you received vaccinations?">
                <Select value={formData.everVaccinated || ""} onValueChange={(v) => updateField("everVaccinated", v)}>
                  <SelectTrigger data-testid="select-vaccinated"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {yesNoNotSureOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              
              <FormField label="Do you have vaccination records?">
                <Select value={formData.vaccinationCard || ""} onValueChange={(v) => updateField("vaccinationCard", v)}>
                  <SelectTrigger data-testid="select-vax-records"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Yes, I have records", "No records available"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <MultiSelectGroup 
              label="Childhood vaccines received" 
              field="childhoodVaccines" 
              options={["Not sure", "BCG (Tuberculosis)", "Polio (OPV/IPV)", "DPT/Pentavalent", "Measles/MMR", "Hepatitis B"]} 
            />
            
            <MultiSelectGroup 
              label="Adult vaccines received" 
              field="adultVaccines" 
              options={["None", "Tetanus/TT/Td", "COVID-19", "Influenza (Flu)", "Hepatitis B", "Hepatitis A", "Typhoid", "Pneumococcal", "Rabies", "HPV", "Japanese Encephalitis", "Other"]} 
            />
            
            {((formData.adultVaccines as string[]) || []).includes("Other") && (
              <FormField label="Specify other vaccine">
                <Input 
                  placeholder="Enter vaccine name" 
                  value={formData.adultVaccinesOther || ""} 
                  onChange={(e) => updateField("adultVaccinesOther", e.target.value)}
                  data-testid="input-adult-vaccine-other"
                />
              </FormField>
            )}
            
            {/* Per-vaccine details */}
            {((formData.adultVaccines as string[]) || []).filter(v => v !== "None" && v !== "Other").length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Vaccine Details</label>
                {((formData.adultVaccines as string[]) || []).filter(v => v !== "None" && v !== "Other").map(vaccine => {
                  const vaccineDetails = (formData.vaccineDetails as Record<string, any>) || {};
                  const details = vaccineDetails[vaccine] || {};
                  
                  const updateVaccineDetail = (field: string, value: string) => {
                    const newDetails = { ...vaccineDetails };
                    if (!newDetails[vaccine]) {
                      newDetails[vaccine] = {};
                    }
                    newDetails[vaccine] = { ...newDetails[vaccine], [field]: value };
                    updateField("vaccineDetails", newDetails);
                  };
                  
                  return (
                    <div key={vaccine} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-3 border border-blue-200 dark:border-blue-700">
                      <h5 className="font-medium text-blue-700 dark:text-blue-400">{vaccine}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormField label="Date taken (approximate)">
                          <Input 
                            type="date" 
                            value={details.date || ""} 
                            onChange={(e) => updateVaccineDetail("date", e.target.value)}
                            data-testid={`input-vaccine-${vaccine.toLowerCase().replace(/[\s\/()]+/g, '-')}-date`}
                          />
                        </FormField>
                        
                        <FormField label="Number of doses">
                          <Select value={details.doses || ""} onValueChange={(v) => updateVaccineDetail("doses", v)}>
                            <SelectTrigger data-testid={`select-vaccine-${vaccine.toLowerCase().replace(/[\s\/()]+/g, '-')}-doses`}><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {["1 dose", "2 doses", "3 doses", "Booster", "Not sure"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormField>
                      </div>
                      
                      <FormField label="Any reaction after this vaccine?">
                        <Select value={details.reaction || ""} onValueChange={(v) => updateVaccineDetail("reaction", v)}>
                          <SelectTrigger data-testid={`select-vaccine-${vaccine.toLowerCase().replace(/[\s\/()]+/g, '-')}-reaction`}><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {["No", "Yes, mild (fever, pain)", "Yes, severe"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormField>
                      
                      {(details.reaction === "Yes, mild (fever, pain)" || details.reaction === "Yes, severe") && (
                        <FormField label="Describe the reaction">
                          <Input 
                            placeholder="e.g., High fever for 2 days, swelling at injection site" 
                            value={details.reactionDetails || ""} 
                            onChange={(e) => updateVaccineDetail("reactionDetails", e.target.value)}
                            data-testid={`input-vaccine-${vaccine.toLowerCase().replace(/[\s\/()]+/g, '-')}-reaction-details`}
                          />
                        </FormField>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Last vaccination date">
                <Input 
                  type="date" 
                  value={formData.lastVaccinationDate || ""} 
                  onChange={(e) => updateField("lastVaccinationDate", e.target.value)}
                  data-testid="input-last-vax-date"
                />
              </FormField>
              
              <FormField label="Completed all recommended doses?">
                <Select value={formData.completedAllDoses || ""} onValueChange={(v) => updateField("completedAllDoses", v)}>
                  <SelectTrigger data-testid="select-completed-doses"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {yesNoNotSureOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              
              <FormField label="Have you ever missed or delayed a scheduled vaccine?">
                <Select value={formData.missedDelayedVaccine || ""} onValueChange={(v) => updateField("missedDelayedVaccine", v)}>
                  <SelectTrigger data-testid="select-missed-vaccine"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {yesNoNotSureOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              
              <FormField label="Are you vaccinated for your work or travel needs?">
                <Select value={formData.workTravelVaccinated || ""} onValueChange={(v) => updateField("workTravelVaccinated", v)}>
                  <SelectTrigger data-testid="select-work-travel-vaccine"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["No", "Yes, for healthcare work", "Yes, for travel", "Yes, both"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            
            {(formData.workTravelVaccinated === "Yes, for healthcare work" || formData.workTravelVaccinated === "Yes, for travel" || formData.workTravelVaccinated === "Yes, both") && (
              <FormField label="Name of vaccine(s) taken for work/travel">
                <Input 
                  placeholder="Enter vaccine name(s)" 
                  value={formData.workTravelVaccineName || ""} 
                  onChange={(e) => updateField("workTravelVaccineName", e.target.value)}
                  data-testid="input-work-travel-vaccine-name"
                />
              </FormField>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Any reaction after vaccination?">
                <Select value={formData.vaccineReaction || ""} onValueChange={(v) => updateField("vaccineReaction", v)}>
                  <SelectTrigger data-testid="select-vax-reaction"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            
            {formData.vaccineReaction === "Yes" && (
              <>
                <MultiSelectGroup 
                  label="Type of reaction" 
                  field="vaccineReactionType" 
                  options={["Fever", "Pain/swelling at site", "Rash", "Breathing difficulty", "Other"]} 
                />
                
                {((formData.vaccineReactionType as string[]) || []).includes("Other") && (
                  <FormField label="Specify other reaction">
                    <Input 
                      placeholder="Describe the reaction" 
                      value={formData.vaccineReactionOther || ""} 
                      onChange={(e) => updateField("vaccineReactionOther", e.target.value)}
                      data-testid="input-vaccine-reaction-other"
                    />
                  </FormField>
                )}
              </>
            )}
          </CardContent>
        )}
      </Card>

      {/* Travel History Section */}
      <Card className="overflow-hidden border-0 shadow-md">
        <SectionHeader title="Travel History" section="travel" icon={Plane} />
        {expandedSections.travel && (
          <CardContent className="p-5 space-y-4 bg-white dark:bg-slate-800">
            <FormField label="Have you travelled recently?">
              <Select value={formData.recentTravel || ""} onValueChange={(v) => updateField("recentTravel", v)}>
                <SelectTrigger data-testid="select-recent-travel"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            
            {formData.recentTravel === "Yes" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField label="When was your travel?">
                    <Select value={formData.travelTiming || ""} onValueChange={(v) => updateField("travelTiming", v)}>
                      <SelectTrigger data-testid="select-travel-timing"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {["Within last 14 days", "Within last 1 month", "Within last 3 months", "More than 3 months ago"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  
                  <FormField label="Location visited">
                    <Input 
                      placeholder="City/State/Country" 
                      value={formData.travelLocation || ""} 
                      onChange={(e) => updateField("travelLocation", e.target.value)}
                      data-testid="input-travel-location"
                    />
                  </FormField>
                  
                  <FormField label="Purpose of travel">
                    <Select value={formData.travelPurpose || ""} onValueChange={(v) => updateField("travelPurpose", v)}>
                      <SelectTrigger data-testid="select-travel-purpose"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {["Work/Job", "Education", "Tourism/Vacation", "Family visit", "Medical treatment", "Religious/Pilgrimage", "Other"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  
                  {formData.travelPurpose === "Other" && (
                    <FormField label="Specify travel purpose">
                      <Input 
                        placeholder="Enter travel purpose" 
                        value={formData.travelPurposeOther || ""} 
                        onChange={(e) => updateField("travelPurposeOther", e.target.value)}
                        data-testid="input-travel-purpose-other"
                      />
                    </FormField>
                  )}
                  
                  <FormField label="Duration of stay">
                    <Select value={formData.travelDuration || ""} onValueChange={(v) => updateField("travelDuration", v)}>
                      <SelectTrigger data-testid="select-travel-duration"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {["Less than 1 week", "1-2 weeks", "More than 2 weeks"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  
                  <FormField label="Type of area visited">
                    <Select value={formData.travelAreaType || ""} onValueChange={(v) => updateField("travelAreaType", v)}>
                      <SelectTrigger data-testid="select-travel-area"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {["Urban (City/Town)", "Rural (Village)", "Forest/Hilly area", "Coastal area"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  
                  <FormField label="Accommodation type">
                    <Select value={formData.travelAccommodation || ""} onValueChange={(v) => updateField("travelAccommodation", v)}>
                      <SelectTrigger data-testid="select-travel-accommodation"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {["Hotel", "Hostel/Lodge", "Relative's home", "Camp/Temporary shelter"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
                
                <MultiSelectGroup 
                  label="Food/Water consumed during travel" 
                  field="travelFoodWater" 
                  options={["None unsafe", "Street food", "Untreated water (tap/well/river)"]} 
                />
                
                <FormField label="Exposed to mosquitoes during travel?">
                  <Select value={formData.travelMosquitoExposure || ""} onValueChange={(v) => updateField("travelMosquitoExposure", v)}>
                    <SelectTrigger data-testid="select-travel-mosquito"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {yesNoNotSureOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="Did you have close contact with sick people during travel?">
                  <Select value={formData.travelSickContact || ""} onValueChange={(v) => updateField("travelSickContact", v)}>
                    <SelectTrigger data-testid="select-travel-sick-contact"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {yesNoNotSureOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="Did you develop any illness during or after travel?">
                  <Select value={formData.travelIllness || ""} onValueChange={(v) => updateField("travelIllness", v)}>
                    <SelectTrigger data-testid="select-travel-illness"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                {formData.travelIllness === "Yes" && (
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg space-y-4">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-300">Select symptoms experienced (Before / During / After travel)</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm text-orange-700 dark:text-orange-400">Before Travel</h5>
                        <div className="space-y-1">
                          {["Fever", "Chills", "Cough/Cold", "Loose stools/Diarrhea", "Vomiting", "Body pain/Joint pain", "Skin rash", "Jaundice (yellowing of eyes)", "Headache", "Heartburn", "Flatulence", "Constipation"].map(symptom => (
                            <div key={symptom} className="flex items-center space-x-2">
                              <Checkbox
                                id={`before-${symptom}`}
                                checked={((formData.travelIllnessSymptomsBefore as string[]) || []).includes(symptom)}
                                onCheckedChange={() => toggleMultiSelect("travelIllnessSymptomsBefore", symptom)}
                                data-testid={`checkbox-before-${symptom}`}
                              />
                              <label htmlFor={`before-${symptom}`} className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">{symptom}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm text-orange-700 dark:text-orange-400">During Travel</h5>
                        <div className="space-y-1">
                          {["Fever", "Chills", "Cough/Cold", "Loose stools/Diarrhea", "Vomiting", "Body pain/Joint pain", "Skin rash", "Jaundice (yellowing of eyes)", "Headache", "Heartburn", "Flatulence", "Constipation"].map(symptom => (
                            <div key={symptom} className="flex items-center space-x-2">
                              <Checkbox
                                id={`during-${symptom}`}
                                checked={((formData.travelIllnessSymptomsDuring as string[]) || []).includes(symptom)}
                                onCheckedChange={() => toggleMultiSelect("travelIllnessSymptomsDuring", symptom)}
                                data-testid={`checkbox-during-${symptom}`}
                              />
                              <label htmlFor={`during-${symptom}`} className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">{symptom}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm text-orange-700 dark:text-orange-400">After Travel</h5>
                        <div className="space-y-1">
                          {["Fever", "Chills", "Cough/Cold", "Loose stools/Diarrhea", "Vomiting", "Body pain/Joint pain", "Skin rash", "Jaundice (yellowing of eyes)", "Headache", "Heartburn", "Flatulence", "Constipation"].map(symptom => (
                            <div key={symptom} className="flex items-center space-x-2">
                              <Checkbox
                                id={`after-${symptom}`}
                                checked={((formData.travelIllnessSymptomsAfter as string[]) || []).includes(symptom)}
                                onCheckedChange={() => toggleMultiSelect("travelIllnessSymptomsAfter", symptom)}
                                data-testid={`checkbox-after-${symptom}`}
                              />
                              <label htmlFor={`after-${symptom}`} className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">{symptom}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <MultiSelectGroup 
                  label="Travelled to endemic areas for:" 
                  field="endemicAreaTravel" 
                  options={["None", "Malaria", "Dengue", "Chikungunya", "Typhoid", "COVID-19", "Hepatitis"]} 
                />
                
                <FormField label="Did you take any preventive medicines or vaccines before travel?">
                  <Select value={formData.travelPreventiveMeds || ""} onValueChange={(v) => updateField("travelPreventiveMeds", v)}>
                    <SelectTrigger data-testid="select-preventive-meds"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                {formData.travelPreventiveMeds === "Yes" && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg space-y-3">
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">Select preventive medicines/vaccines taken:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {["Malaria prevention tablets", "Typhoid vaccine", "Yellow fever vaccine", "COVID-19 vaccine"].map(option => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={`preventive-${option}`}
                            checked={((formData.travelPreventiveMedsTypes as string[]) || []).includes(option)}
                            onCheckedChange={() => toggleMultiSelect("travelPreventiveMedsTypes", option)}
                            data-testid={`checkbox-preventive-${option}`}
                          />
                          <label htmlFor={`preventive-${option}`} className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">{option}</label>
                        </div>
                      ))}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="preventive-other"
                          checked={((formData.travelPreventiveMedsTypes as string[]) || []).includes("Other")}
                          onCheckedChange={() => toggleMultiSelect("travelPreventiveMedsTypes", "Other")}
                          data-testid="checkbox-preventive-other"
                        />
                        <label htmlFor="preventive-other" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">Other</label>
                      </div>
                    </div>
                    {((formData.travelPreventiveMedsTypes as string[]) || []).includes("Other") && (
                      <FormField label="Specify other preventive medicine/vaccine">
                        <Input 
                          placeholder="Enter medicine/vaccine name" 
                          value={formData.travelPreventiveMedsOther || ""} 
                          onChange={(e) => updateField("travelPreventiveMedsOther", e.target.value)}
                          data-testid="input-preventive-other"
                        />
                      </FormField>
                    )}
                  </div>
                )}
                
                <FormField label="International travel?">
                  <Select value={formData.internationalTravel || ""} onValueChange={(v) => updateField("internationalTravel", v)}>
                    <SelectTrigger data-testid="select-international-travel"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                {formData.internationalTravel === "Yes" && (
                  <FormField label="Country visited">
                    <Input 
                      placeholder="Country name" 
                      value={formData.travelCountry || ""} 
                      onChange={(e) => updateField("travelCountry", e.target.value)}
                      data-testid="input-travel-country"
                    />
                  </FormField>
                )}
              </>
            )}
          </CardContent>
        )}
      </Card>

      {/* Psychosocial History Section */}
      <Card className="overflow-hidden border-0 shadow-md">
        <SectionHeader title="Psychosocial History" section="psychosocial" icon={Brain} />
        {expandedSections.psychosocial && (
          <CardContent className="p-5 space-y-6 bg-white dark:bg-slate-800">
            {/* Mood */}
            <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg space-y-4">
              <h4 className="font-medium text-violet-800 dark:text-violet-300">Mood Assessment</h4>
              <p className="text-xs text-slate-500">Scale: 0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day</p>
              <div className="grid grid-cols-1 gap-4">
                <FormField label="How often have you felt decreased interest or pleasure in doing things?">
                  <Select value={String(formData.moodInterestLoss ?? "")} onValueChange={(v) => updateField("moodInterestLoss", parseInt(v))}>
                    <SelectTrigger data-testid="select-mood-interest"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {[{v: 0, l: "0 - Not at all"}, {v: 1, l: "1 - Several days"}, {v: 2, l: "2 - More than half days"}, {v: 3, l: "3 - Nearly every day"}].map(o => <SelectItem key={o.v} value={String(o.v)}>{o.l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="How often have you felt down, depressed, or hopeless?">
                  <Select value={String(formData.moodDepressed ?? "")} onValueChange={(v) => updateField("moodDepressed", parseInt(v))}>
                    <SelectTrigger data-testid="select-mood-depressed"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {[{v: 0, l: "0 - Not at all"}, {v: 1, l: "1 - Several days"}, {v: 2, l: "2 - More than half days"}, {v: 3, l: "3 - Nearly every day"}].map(o => <SelectItem key={o.v} value={String(o.v)}>{o.l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="How often have you felt tired or had very little energy?">
                  <Select value={String(formData.moodTired ?? "")} onValueChange={(v) => updateField("moodTired", parseInt(v))}>
                    <SelectTrigger data-testid="select-mood-tired"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {[{v: 0, l: "0 - Not at all"}, {v: 1, l: "1 - Several days"}, {v: 2, l: "2 - More than half days"}, {v: 3, l: "3 - Nearly every day"}].map(o => <SelectItem key={o.v} value={String(o.v)}>{o.l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </div>

            {/* Anxiety */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg space-y-4">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-300">Anxiety Assessment</h4>
              <div className="grid grid-cols-1 gap-4">
                <FormField label="How often have you felt nervous, anxious, or on edge?">
                  <Select value={String(formData.anxietyNervous ?? "")} onValueChange={(v) => updateField("anxietyNervous", parseInt(v))}>
                    <SelectTrigger data-testid="select-anxiety-nervous"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {[{v: 0, l: "0 - Not at all"}, {v: 1, l: "1 - Several days"}, {v: 2, l: "2 - More than half days"}, {v: 3, l: "3 - Nearly every day"}].map(o => <SelectItem key={o.v} value={String(o.v)}>{o.l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="How often have you found it difficult to stop or control worrying?">
                  <Select value={String(formData.anxietyWorrying ?? "")} onValueChange={(v) => updateField("anxietyWorrying", parseInt(v))}>
                    <SelectTrigger data-testid="select-anxiety-worrying"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {[{v: 0, l: "0 - Not at all"}, {v: 1, l: "1 - Several days"}, {v: 2, l: "2 - More than half days"}, {v: 3, l: "3 - Nearly every day"}].map(o => <SelectItem key={o.v} value={String(o.v)}>{o.l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="How often has anxiety interfered with your daily activities?">
                  <Select value={String(formData.anxietyInterference ?? "")} onValueChange={(v) => updateField("anxietyInterference", parseInt(v))}>
                    <SelectTrigger data-testid="select-anxiety-interference"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {[{v: 0, l: "0 - Not at all"}, {v: 1, l: "1 - Several days"}, {v: 2, l: "2 - More than half days"}, {v: 3, l: "3 - Nearly every day"}].map(o => <SelectItem key={o.v} value={String(o.v)}>{o.l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </div>

            {/* Stress Assessment */}
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg space-y-4">
              <h4 className="font-medium text-orange-800 dark:text-orange-300">Stress Assessment</h4>
              <div className="grid grid-cols-1 gap-4">
                <FormField label="Over the past two weeks, how often have you felt overwhelmed by daily responsibilities, experienced difficulty concentrating, or felt unable to cope with the demands in your life?">
                  <Select value={formData.stressLevel || ""} onValueChange={(v) => updateField("stressLevel", v)}>
                    <SelectTrigger data-testid="select-stress-level"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {[
                        "Never (0-1 days) - Minimal stress",
                        "Rarely (2-3 days) - Low stress",
                        "Sometimes (4-7 days) - Moderate stress",
                        "Often (8-10 days) - High stress",
                        "Very often/Daily (11-14 days) - Severe stress"
                      ].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </div>

            {/* Safety Assessment */}
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg space-y-4">
              <h4 className="font-medium text-red-800 dark:text-red-300">Safety Assessment</h4>
              <div className="grid grid-cols-1 gap-4">
                <FormField label="Have you had thoughts of harming yourself?">
                  <Select value={String(formData.suicidalThoughts ?? "")} onValueChange={(v) => updateField("suicidalThoughts", parseInt(v))}>
                    <SelectTrigger data-testid="select-suicidal"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {[{v: 0, l: "0 - Not at all"}, {v: 1, l: "1 - Several days"}, {v: 2, l: "2 - More than half days"}, {v: 3, l: "3 - Nearly every day"}].map(o => <SelectItem key={o.v} value={String(o.v)}>{o.l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="Have you had thoughts about ending your life?">
                  <Select value={formData.suicidalActive || ""} onValueChange={(v) => updateField("suicidalActive", v)}>
                    <SelectTrigger data-testid="select-suicidal-active"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["No", "Yes, passive", "Yes, active"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="Do you currently feel unsafe being alone with these thoughts?">
                  <Select value={formData.feelingUnsafe || ""} onValueChange={(v) => updateField("feelingUnsafe", v)}>
                    <SelectTrigger data-testid="select-feeling-unsafe"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["No", "Not sure", "Yes"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </div>

            {/* Sleep */}
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg space-y-4">
              <h4 className="font-medium text-indigo-800 dark:text-indigo-300">Sleep</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Difficulty with sleep?">
                  <Select value={formData.sleepDifficulty || ""} onValueChange={(v) => updateField("sleepDifficulty", v)}>
                    <SelectTrigger data-testid="select-sleep-difficulty"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["None", "Mild", "Moderate", "Severe"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField label="Average hours of sleep per night">
                  <Select value={formData.sleepDuration || ""} onValueChange={(v) => updateField("sleepDuration", v)}>
                    <SelectTrigger data-testid="select-sleep-hours"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Less than 4 hours", "4-5 hours", "6-7 hours", "8 or more hours"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </div>

            {/* Other */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Periods of unusual energy or less sleep needed?">
                <Select value={formData.bipolarEnergy || ""} onValueChange={(v) => updateField("bipolarEnergy", v)}>
                  <SelectTrigger data-testid="select-bipolar"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              
              <FormField label="Ever heard voices or seen things others couldn't?">
                <Select value={formData.psychosisVoices || ""} onValueChange={(v) => updateField("psychosisVoices", v)}>
                  <SelectTrigger data-testid="select-psychosis"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              
              <FormField label="Use substances to cope with stress?">
                <Select value={formData.substanceCoping || ""} onValueChange={(v) => updateField("substanceCoping", v)}>
                  <SelectTrigger data-testid="select-substance-coping"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Never", "Occasionally", "Weekly", "Daily"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              
              <FormField label="Overall impact on daily functioning">
                <Select value={formData.overallFunctioningImpact || ""} onValueChange={(v) => updateField("overallFunctioningImpact", v)}>
                  <SelectTrigger data-testid="select-functioning"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["None", "Mild", "Moderate", "Severe"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Vision History Section */}
      <Card className="overflow-hidden border-0 shadow-md">
        <SectionHeader title="Vision History" section="vision" icon={Eye} />
        {expandedSections.vision && (
          <CardContent className="p-5 space-y-4 bg-white dark:bg-slate-800">
            <FormField label="Do you have any problem with your vision?">
              <Select value={formData.visionProblem || ""} onValueChange={(v) => updateField("visionProblem", v)}>
                <SelectTrigger data-testid="select-vision-problem"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            
            {formData.visionProblem === "Yes" && (
              <>
                <MultiSelectGroup 
                  label="Type of vision problem" 
                  field="visionProblemTypes" 
                  options={["Blurred vision", "Difficulty seeing far", "Difficulty seeing near", "Night vision problem", "Double vision", "Loss of vision", "Eye pain/redness", "Watering/discharge", "Headache from eye strain"]} 
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Since when?">
                    <Input 
                      placeholder="e.g., 2 years, since childhood" 
                      value={formData.visionProblemDuration || ""} 
                      onChange={(e) => updateField("visionProblemDuration", e.target.value)}
                      data-testid="input-vision-duration"
                    />
                  </FormField>
                  
                  <FormField label="Affected eyes">
                    <Select value={formData.visionAffectedEyes || ""} onValueChange={(v) => updateField("visionAffectedEyes", v)}>
                      <SelectTrigger data-testid="select-affected-eyes"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {["Left eye", "Right eye", "Both eyes"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Use spectacles or contact lenses?">
                <Select value={formData.usesGlasses || ""} onValueChange={(v) => updateField("usesGlasses", v)}>
                  <SelectTrigger data-testid="select-glasses"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              
              {formData.usesGlasses === "Yes" && (
                <>
                  <FormField label="For what purpose?">
                    <Select value={formData.glassesType || ""} onValueChange={(v) => updateField("glassesType", v)}>
                      <SelectTrigger data-testid="select-glasses-type"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {["For distance", "For reading (near)", "For both"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="What is your spectacle power?">
                    <Input 
                      placeholder="e.g., -2.5 Left, -3.0 Right" 
                      value={formData.spectaclePower || ""} 
                      onChange={(e) => updateField("spectaclePower", e.target.value)}
                      data-testid="input-spectacle-power"
                    />
                  </FormField>
                </>
              )}
              
              <FormField label="Last eye check-up">
                <Select value={formData.lastEyeCheckup || ""} onValueChange={(v) => updateField("lastEyeCheckup", v)}>
                  <SelectTrigger data-testid="select-eye-checkup"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Within last 1 year", "1-3 years ago", "More than 3 years ago", "Never"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <MultiSelectGroup 
              label="Diagnosed eye diseases" 
              field="eyeDiseases" 
              options={["None", "Cataract", "Glaucoma", "Diabetic eye disease", "Macular degeneration", "Night blindness", "Dry eye disease", "Eye infection"]} 
            />
            
            <MultiSelectGroup 
              label="Long-term illness affecting eyesight" 
              field="eyeRelatedIllness" 
              options={["None", "Diabetes", "High blood pressure", "Thyroid disease", "Kidney disease", "Vitamin deficiency", "Other"]} 
            />
            
            {((formData.eyeRelatedIllness as string[]) || []).includes("Other") && (
              <FormField label="Specify other illness">
                <Input 
                  placeholder="Enter illness details" 
                  value={formData.eyeRelatedIllnessOther || ""} 
                  onChange={(e) => updateField("eyeRelatedIllnessOther", e.target.value)}
                  data-testid="input-eye-illness-other"
                />
              </FormField>
            )}

            <FormField label="Any eye surgery or injury?">
              <Select value={formData.eyeSurgeryOrInjury || ""} onValueChange={(v) => updateField("eyeSurgeryOrInjury", v)}>
                <SelectTrigger data-testid="select-eye-surgery"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            
            {formData.eyeSurgeryOrInjury === "Yes" && (
              <>
                <FormField label="Details of surgery/injury">
                  <Input 
                    placeholder="Describe the surgery or injury" 
                    value={formData.eyeSurgeryDetails || ""} 
                    onChange={(e) => updateField("eyeSurgeryDetails", e.target.value)}
                    data-testid="input-eye-surgery-details"
                  />
                </FormField>
                <FormField label="How much time has passed since the surgery/injury?">
                  <Input 
                    placeholder="e.g., 2 years ago, 6 months ago" 
                    value={formData.eyeSurgeryTimePassed || ""} 
                    onChange={(e) => updateField("eyeSurgeryTimePassed", e.target.value)}
                    data-testid="input-eye-surgery-time"
                  />
                </FormField>
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Daily screen time (mobile/computer)">
                <Select value={formData.screenTimePerDay || ""} onValueChange={(v) => updateField("screenTimePerDay", v)}>
                  <SelectTrigger data-testid="select-screen-time"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Less than 2 hours", "2-6 hours", "More than 6 hours"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              
              <FormField label="Eye strain after screen use?">
                <Select value={formData.eyeStrainAfterScreen || ""} onValueChange={(v) => updateField("eyeStrainAfterScreen", v)}>
                  <SelectTrigger data-testid="select-eye-strain"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <FormField label="Family history of eye diseases?">
              <Select value={formData.familyEyeDisease || ""} onValueChange={(v) => updateField("familyEyeDisease", v)}>
                <SelectTrigger data-testid="select-family-eye"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            
            {formData.familyEyeDisease === "Yes" && (
              <>
                <MultiSelectGroup 
                  label="Family eye diseases" 
                  field="familyEyeDiseaseTypes" 
                  options={["Cataract", "Glaucoma", "Diabetic eye disease", "Other"]} 
                />
                
                {((formData.familyEyeDiseaseTypes as string[]) || []).includes("Other") && (
                  <FormField label="Specify other eye disease">
                    <Input 
                      placeholder="Enter eye disease name" 
                      value={formData.familyEyeDiseaseOther || ""} 
                      onChange={(e) => updateField("familyEyeDiseaseOther", e.target.value)}
                      data-testid="input-family-eye-other"
                    />
                  </FormField>
                )}
              </>
            )}

            <FormField label="Taking medicines that may affect vision?">
              <Select value={formData.medicinesAffectingVision || ""} onValueChange={(v) => updateField("medicinesAffectingVision", v)}>
                <SelectTrigger data-testid="select-vision-meds"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {yesNoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            
            {formData.medicinesAffectingVision === "Yes" && (
              <FormField label="Medicine names">
                <Input 
                  placeholder="e.g., steroids, chloroquine" 
                  value={formData.medicinesAffectingVisionDetails || ""} 
                  onChange={(e) => updateField("medicinesAffectingVisionDetails", e.target.value)}
                  data-testid="input-vision-meds"
                />
              </FormField>
            )}
          </CardContent>
        )}
      </Card>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t shadow-lg">
        <Button 
          className="w-full py-6 text-lg font-semibold"
          onClick={handleSave}
          disabled={isSaving}
          data-testid="button-save-history"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Save Medical History
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
