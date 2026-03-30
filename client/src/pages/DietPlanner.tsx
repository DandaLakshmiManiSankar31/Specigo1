import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { useUserById, useUpdateUser } from "@/hooks/use-users";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Salad, Loader2, Pencil, Check, X,
  Paperclip, Sparkles, FlaskConical, Settings
} from "lucide-react";
import { api } from "@shared/routes";
import { buildPatientContext } from "@/lib/patient-context";

// ─── Types ───────────────────────────────────────────────────────────────────
interface WizardData {
  mealsPerDay: number;
  mealTimings: { name: string; time: string }[];
  fitnessGoal: string;
  medicalGoals: string[];
  cuisineStyle: string;
  dietaryPreference: string;
  dailyCalories: number;
  mealVariety: string;
}
interface LabParam { name: string; value: string; unit: string; range: string; status: "Normal" | "Low" | "High"; }
interface UploadedReport { name: string; text: string; params: LabParam[]; paramSummary: string; }
interface ParsedMealMacros { protein: number; carbs: number; fat: number; kcal: number; }
interface ParsedMeal { name: string; timing?: string; macroLine: string; items: string[]; rawText: string; macroGrams: ParsedMealMacros | null; }
interface DayPlan { day: number; whyThisPlan: string; meals: ParsedMeal[]; foodsToAvoid: string[]; macroGrams: ParsedMealMacros | null; rawText: string; }
interface UserData { id: number; name?: string; age?: number; weight?: string; height?: string; gender?: string; bloodGroup?: string; medicalHistory?: string; patientMedicalHistory?: Record<string, unknown> | null; }

// ─── Constants ───────────────────────────────────────────────────────────────
const MEAL_DEFAULTS: Record<number, { name: string; time: string }[]> = {
  2: [{ name: "Lunch", time: "13:00" }, { name: "Dinner", time: "20:00" }],
  3: [{ name: "Breakfast", time: "07:30" }, { name: "Lunch", time: "13:00" }, { name: "Dinner", time: "20:00" }],
  4: [{ name: "Breakfast", time: "07:30" }, { name: "Lunch", time: "13:00" }, { name: "Evening Snack", time: "16:30" }, { name: "Dinner", time: "20:00" }],
  5: [{ name: "Breakfast", time: "07:30" }, { name: "Mid-Morning", time: "10:30" }, { name: "Lunch", time: "13:00" }, { name: "Evening Snack", time: "16:30" }, { name: "Dinner", time: "20:00" }],
};
const MEAL_EMOJI: Record<string, string> = { breakfast: "🌅", "mid-morning": "🍎", snack: "🍎", lunch: "🍽️", evening: "🌆", dinner: "🌙" };
function getMealEmoji(name: string) { const lc = name.toLowerCase(); return Object.entries(MEAL_EMOJI).find(([k]) => lc.includes(k))?.[1] ?? "🥗"; }

const DURATION_OPTIONS = [{ label: "Today", days: 1 }, { label: "3 Days", days: 3 }, { label: "7 Days", days: 7 }, { label: "15 Days", days: 15 }];

const FITNESS_GOALS = [
  { id: "Lose Weight", label: "Lose Weight", sub: "Caloric deficit, lean muscle", icon: "🔥" },
  { id: "Maintain Weight", label: "Maintain Weight", sub: "Balanced energy intake", icon: "⚖️" },
  { id: "Gain Muscle", label: "Gain Muscle", sub: "Caloric surplus, high protein", icon: "💪" },
  { id: "Build Endurance", label: "Build Endurance", sub: "High-carb, sustained energy", icon: "🏃" },
  { id: "General Wellness", label: "General Wellness", sub: "Balanced nutrition", icon: "🌿" },
];
const MEDICAL_GOALS = [
  { id: "No specific condition", label: "No specific condition", icon: "✅" },
  { id: "Diabetes / Blood Sugar", label: "Diabetes / Blood Sugar", icon: "🩸" },
  { id: "High Cholesterol", label: "High Cholesterol", icon: "❤️" },
  { id: "Blood Pressure", label: "Blood Pressure", icon: "🩺" },
  { id: "Thyroid", label: "Thyroid", icon: "🦋" },
  { id: "Digestive Issues / IBS", label: "Digestive Issues / IBS", icon: "🌿" },
  { id: "PCOS / Hormonal", label: "PCOS / Hormonal", icon: "💜" },
];
const CUISINE_STYLES = [
  { id: "Indian", label: "Indian", icon: "🇮🇳" },
  { id: "Mediterranean", label: "Mediterranean", icon: "🫒" },
  { id: "Asian", label: "Asian", icon: "🥢" },
  { id: "Mexican", label: "Mexican", icon: "🌮" },
  { id: "Continental", label: "Continental", icon: "🍴" },
  { id: "Middle Eastern", label: "Middle Eastern", icon: "🌯" },
];
const DIETARY_PREFS = [
  { id: "Vegetarian", label: "Vegetarian", icon: "🥦" },
  { id: "Vegan", label: "Vegan", icon: "🌱" },
  { id: "Non-Vegetarian", label: "Non-Vegetarian", icon: "🍗" },
  { id: "Eggetarian", label: "Eggetarian", icon: "🥚" },
];
const CALORIE_PRESETS = [1200, 1500, 1800, 2000, 2500, 3000];
const MEAL_VARIETY_OPTIONS = [
  { id: "Same meals every day", label: "Same meals every day", sub: "Simple, consistent routine", icon: "📋" },
  { id: "Different meals every day", label: "Different meals every day", sub: "Variety keeps it interesting", icon: "✨" },
  { id: "Weekly rotation", label: "Weekly rotation", sub: "Same plan repeats each week", icon: "📅" },
];
const WIZARD_STEPS = [
  { title: "Meals & Timing", subtitle: "How many meals do you have each day, and when?" },
  { title: "Fitness Goal", subtitle: "What are you working towards?" },
  { title: "Medical Goals", subtitle: "Any health conditions to optimise for? Select all that apply." },
  { title: "Diet Style", subtitle: "Your cuisine preference and dietary type." },
  { title: "Daily Calories", subtitle: "How many kilocalories per day is your target?" },
  { title: "Meal Variety", subtitle: "How often should your meal plan change?" },
];

// ─── Parsing ─────────────────────────────────────────────────────────────────
function parseMacroGrams(text: string): ParsedMealMacros | null {
  const kcalM = text.match(/~?(\d+(?:\.\d+)?)\s*kcal/i);
  const kcal = kcalM ? Math.round(parseFloat(kcalM[1])) : 0;
  // Labeled: "Protein 25g | Carbs 70g | Fat 20g"
  const labeled = text.match(/Protein\s*(\d+)\s*g[^]*?Carbs\s*(\d+)\s*g[^]*?Fat\s*(\d+)\s*g/i);
  if (labeled) return { protein: parseInt(labeled[1]), carbs: parseInt(labeled[2]), fat: parseInt(labeled[3]), kcal };
  // Positional fallback: "~600 kcal | 90 g | 100 g | 30 g" — 3 numbers after kcal, each followed by g
  const positional = text.match(/kcal[^|]*\|\s*(\d+)\s*g\s*\|\s*(\d+)\s*g\s*\|\s*(\d+)\s*g/i);
  if (positional) return { protein: parseInt(positional[1]), carbs: parseInt(positional[2]), fat: parseInt(positional[3]), kcal };
  if (kcal > 0) return { protein: 0, carbs: 0, fat: 0, kcal };
  return null;
}

function parseDayPlan(rawText: string, day: number, mealTimings: Record<string, string>): DayPlan {
  const clean = rawText.replace(/\[MACROS:.*?\]/gi, "").trim();
  const sections = clean.split(/\n(?=##\s)/);
  let whyThisPlan = "";
  const meals: ParsedMeal[] = [];
  const foodsToAvoid: string[] = [];
  let totalP = 0, totalC = 0, totalF = 0, totalK = 0;

  for (const section of sections) {
    const lines = section.split("\n").map(l => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    // Skip any section that does not start with a markdown heading (intro text, disclaimers, etc.)
    if (!lines[0].startsWith("#")) continue;
    const header = lines[0].replace(/^#+\s*/, "").replace(/^[🌅🍎🍽️🌆🌙⚠️💡📋✨]\s*/, "").trim();
    // Strip macro info that AI sometimes puts in the header
    const headerClean = header.replace(/\(~?\d+\s*kcal[^)]*\)/gi, "").trim();
    const lc = headerClean.toLowerCase();
    const body = lines.slice(1);

    if (lc.includes("why this plan") || lc.includes("why this")) {
      whyThisPlan = body.join(" ");
    } else if (lc.includes("foods to avoid") || lc.includes("avoid")) {
      body.forEach(l => { const item = l.replace(/^[-•*]\s*/, "").trim(); if (item) foodsToAvoid.push(item); });
    } else if (lc.includes("breakfast") || lc.includes("lunch") || lc.includes("dinner") || lc.includes("snack") || lc.includes("mid-morning") || lc.includes("evening") || lc.includes("meal")) {
      // Detect if the AI put macros inside the header line e.g. "Breakfast (~550 kcal | Protein 25g | …)"
      const headerHasMacros = /\d+\s*kcal/i.test(header) || /Protein\s*\d+/i.test(header);
      // Prefer the bold meal-total line (**~XXX kcal...**) — NOT per-item food lines which also contain kcal
      const bodyMacroLine =
        body.find(l => /^\*\*~?\d+\s*kcal/i.test(l)) ||
        body.find(l => /\*\*.*\d+\s*kcal.*Protein/i.test(l)) ||
        body.find(l => /\d+\s*kcal.*Protein\s*\d+/i.test(l) && !/^[-•*]\s*[A-Za-z]/.test(l)) || "";
      const macroLine = bodyMacroLine || (headerHasMacros ? header : "");

      // Clean meal name from headerClean (macro info already stripped)
      let cleanName = headerClean
        .replace(/[\(\|][\s\S]*$/, "")           // strip any remaining parens or pipes
        .replace(/~?\d+\s*kcal[\s\S]*/i, "")    // strip "~450 kcal..." if any remains
        .trim();
      const knownName = cleanName.match(/^(Breakfast|Lunch|Dinner|Mid-Morning Snack|Morning Snack|Evening Snack|Snack)/i);
      if (knownName) cleanName = knownName[0];

      // Items: exclude meal-total macro lines (bold **~XXX kcal...** or bare macro bullets)
      // but KEEP food items that contain per-item macros in parentheses e.g. "- Rice, 1 cup (~200kcal | P5g | C40g | F2g)"
      const isMacroLine = (l: string) =>
        l === bodyMacroLine ||
        // Bold meal-total line: **~600 kcal | Protein 25g | ...**
        /^\*\*~?\d+\s*kcal/i.test(l) ||
        // Bare macro-only bullet: "- ~600kcal | Protein..." or "* ~600kcal | Protein..." (no food name before it)
        /^[*-]\s*~?\d+\s*kcal/i.test(l);
      const items = body
        .filter(l => !isMacroLine(l))
        .filter(l => /^[-•*]/.test(l) || (l.length > 15 && !/^#+/.test(l)))
        .map(l => l.replace(/^[-•*]\s*/, "").replace(/\*\*/g, "").trim())
        .filter(l => !/^~?\d+\s*kcal/i.test(l))
        .filter(Boolean);

      const timing = mealTimings[`Meal ${meals.length + 1}`] || "";
      let mg = parseMacroGrams(macroLine);

      // Recalculate meal kcal from individual item calorie counts to catch AI math errors
      // Items like: "Rice, 1 cup (~200kcal | P5g | C40g | F2g)"
      const itemKcals = items.map(item => {
        const m = item.match(/\(~?(\d+)\s*kcal/i) || item.match(/[-–]\s*~?(\d+)\s*kcal/i);
        return m ? parseInt(m[1], 10) : 0;
      });
      const computedKcal = itemKcals.reduce((a, b) => a + b, 0);
      if (computedKcal > 0 && mg) {
        // Use computed sum from items as the authoritative meal kcal
        mg = { ...mg, kcal: computedKcal };
      } else if (computedKcal > 0 && !mg) {
        mg = { kcal: computedKcal, protein: 0, carbs: 0, fat: 0 };
      }

      if (mg) { totalP += mg.protein; totalC += mg.carbs; totalF += mg.fat; totalK += mg.kcal; }
      meals.push({ name: cleanName, timing, macroLine: macroLine.replace(/\*\*/g, ""), items, rawText: section, macroGrams: mg });
    }
  }

  const macroGrams = totalP > 0 ? { protein: totalP, carbs: totalC, fat: totalF, kcal: totalK } : null;
  return { day, whyThisPlan, meals, foodsToAvoid, macroGrams, rawText };
}

// ─── Wizard Steps ─────────────────────────────────────────────────────────────
function StepMealsTiming({ data, onChange }: { data: WizardData; onChange: (d: WizardData) => void }) {
  const updateCount = (n: number) => onChange({ ...data, mealsPerDay: n, mealTimings: MEAL_DEFAULTS[n] || MEAL_DEFAULTS[3] });
  const updateTime = (idx: number, time: string) => { const t = [...data.mealTimings]; t[idx] = { ...t[idx], time }; onChange({ ...data, mealTimings: t }); };
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">MEALS PER DAY</p>
        <div className="flex gap-2 flex-wrap">
          {[2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => updateCount(n)}
              className={`px-5 py-2 rounded-full text-sm font-medium border transition-all ${data.mealsPerDay === n ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-700 border-slate-200 hover:border-teal-300"}`}>
              {n} meals
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">MEAL TIMINGS</p>
        <div className="space-y-2">
          {data.mealTimings.map((m, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getMealEmoji(m.name)}</span>
                <span className="text-sm font-medium text-slate-700">{m.name}</span>
              </div>
              <input type="time" value={m.time} onChange={e => updateTime(i, e.target.value)}
                className="text-sm font-semibold text-teal-600 bg-transparent border-none outline-none cursor-pointer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepFitnessGoal({ data, onChange }: { data: WizardData; onChange: (d: WizardData) => void }) {
  return (
    <div className="space-y-2">
      {FITNESS_GOALS.map(g => (
        <button key={g.id} onClick={() => onChange({ ...data, fitnessGoal: g.id })}
          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all text-left ${data.fitnessGoal === g.id ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-700 border-slate-200 hover:border-teal-200"}`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">{g.icon}</span>
            <div>
              <p className="font-semibold text-sm">{g.label}</p>
              <p className={`text-xs ${data.fitnessGoal === g.id ? "text-teal-100" : "text-slate-400"}`}>{g.sub}</p>
            </div>
          </div>
          {data.fitnessGoal === g.id && <Check className="w-4 h-4 flex-shrink-0" />}
        </button>
      ))}
    </div>
  );
}

function StepMedicalGoals({ data, onChange }: { data: WizardData; onChange: (d: WizardData) => void }) {
  const toggle = (id: string) => {
    if (id === "No specific condition") { onChange({ ...data, medicalGoals: ["No specific condition"] }); return; }
    const cur = data.medicalGoals.filter(g => g !== "No specific condition");
    const next = cur.includes(id) ? cur.filter(g => g !== id) : [...cur, id];
    onChange({ ...data, medicalGoals: next.length ? next : ["No specific condition"] });
  };
  return (
    <div className="grid grid-cols-2 gap-2">
      {MEDICAL_GOALS.map(g => {
        const sel = data.medicalGoals.includes(g.id);
        return (
          <button key={g.id} onClick={() => toggle(g.id)}
            className={`flex items-center gap-2 px-3 py-3 rounded-xl border transition-all text-left ${sel ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-700 border-slate-200 hover:border-teal-200"}`}>
            <span className="text-base">{g.icon}</span>
            <span className="text-xs font-medium leading-tight flex-1">{g.label}</span>
            {sel && <Check className="w-3 h-3 flex-shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

function StepDietStyle({ data, onChange }: { data: WizardData; onChange: (d: WizardData) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">CUISINE STYLE</p>
        <div className="flex flex-wrap gap-2">
          {CUISINE_STYLES.map(c => (
            <button key={c.id} onClick={() => onChange({ ...data, cuisineStyle: c.id })}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-all ${data.cuisineStyle === c.id ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-700 border-slate-200 hover:border-teal-200"}`}>
              <span>{c.icon}</span>{c.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">DIETARY PREFERENCE</p>
        <div className="grid grid-cols-2 gap-2">
          {DIETARY_PREFS.map(d => (
            <button key={d.id} onClick={() => onChange({ ...data, dietaryPreference: d.id })}
              className={`flex items-center gap-2 px-4 py-3.5 rounded-xl border transition-all ${data.dietaryPreference === d.id ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-700 border-slate-200 hover:border-teal-200"}`}>
              <span className="text-xl">{d.icon}</span>
              <span className="text-sm font-medium flex-1 text-left">{d.label}</span>
              {data.dietaryPreference === d.id && <Check className="w-4 h-4 flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepCalories({ data, onChange }: { data: WizardData; onChange: (d: WizardData) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center py-2">
        <p className="text-5xl font-bold text-teal-600">{data.dailyCalories.toLocaleString()}</p>
        <p className="text-slate-400 text-sm mt-1">kcal / day</p>
      </div>
      <div className="px-2">
        <input type="range" min={800} max={4000} step={50} value={data.dailyCalories}
          onChange={e => onChange({ ...data, dailyCalories: parseInt(e.target.value) })}
          className="w-full accent-teal-600 h-2" />
        <div className="flex justify-between text-xs text-slate-400 mt-1.5">
          <span>800 kcal</span><span>4000 kcal</span>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">QUICK PRESETS</p>
        <div className="flex flex-wrap gap-2">
          {CALORIE_PRESETS.map(cal => (
            <button key={cal} onClick={() => onChange({ ...data, dailyCalories: cal })}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${data.dailyCalories === cal ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-700 border-slate-200 hover:border-teal-200"}`}>
              {cal.toLocaleString()} kcal
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepMealVariety({ data, onChange }: { data: WizardData; onChange: (d: WizardData) => void }) {
  return (
    <div className="space-y-2">
      {MEAL_VARIETY_OPTIONS.map(v => (
        <button key={v.id} onClick={() => onChange({ ...data, mealVariety: v.id })}
          className={`w-full flex items-center justify-between px-4 py-4 rounded-xl border transition-all text-left ${data.mealVariety === v.id ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-700 border-slate-200 hover:border-teal-200"}`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">{v.icon}</span>
            <div>
              <p className="font-semibold text-sm">{v.label}</p>
              <p className={`text-xs ${data.mealVariety === v.id ? "text-teal-100" : "text-slate-400"}`}>{v.sub}</p>
            </div>
          </div>
          {data.mealVariety === v.id && <Check className="w-4 h-4 flex-shrink-0" />}
        </button>
      ))}
    </div>
  );
}

// ─── Wizard Container ─────────────────────────────────────────────────────────
function WizardView({ data, onChange, onGenerate, isSaving }: { data: WizardData; onChange: (d: WizardData) => void; onGenerate: () => void; isSaving: boolean; }) {
  const [step, setStep] = useState(0);
  const isLast = step === WIZARD_STEPS.length - 1;

  const canContinue = () => {
    if (step === 0) return data.mealsPerDay > 0;
    if (step === 1) return !!data.fitnessGoal;
    if (step === 2) return data.medicalGoals.length > 0;
    if (step === 3) return !!data.cuisineStyle && !!data.dietaryPreference;
    if (step === 4) return data.dailyCalories > 0;
    if (step === 5) return !!data.mealVariety;
    return true;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 font-medium">Step {step + 1} of {WIZARD_STEPS.length}</span>
          <span className="text-xs font-semibold text-teal-600">{WIZARD_STEPS[step].title}</span>
        </div>
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-teal-600 rounded-full transition-all duration-300" style={{ width: `${((step + 1) / WIZARD_STEPS.length) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">{WIZARD_STEPS[step].title}</h2>
        <p className="text-sm text-slate-500 mb-6">{WIZARD_STEPS[step].subtitle}</p>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.18 }}>
            {step === 0 && <StepMealsTiming data={data} onChange={onChange} />}
            {step === 1 && <StepFitnessGoal data={data} onChange={onChange} />}
            {step === 2 && <StepMedicalGoals data={data} onChange={onChange} />}
            {step === 3 && <StepDietStyle data={data} onChange={onChange} />}
            {step === 4 && <StepCalories data={data} onChange={onChange} />}
            {step === 5 && <StepMealVariety data={data} onChange={onChange} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-5 py-4 border-t border-slate-100 bg-white flex items-center gap-3">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            className="px-5 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            ← Back
          </button>
        )}
        {isLast ? (
          <button onClick={onGenerate} disabled={!canContinue() || isSaving}
            className="flex-1 bg-teal-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-teal-700 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isSaving ? "Saving preferences…" : "Generate My Plan ✨"}
          </button>
        ) : (
          <button onClick={() => setStep(s => s + 1)} disabled={!canContinue()}
            className="flex-1 bg-teal-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-teal-700 disabled:opacity-40 transition-colors">
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Edit Meal Panel ──────────────────────────────────────────────────────────
function EditMealPanel({ meal, onSave, onCancel, isLoading }: { meal: ParsedMeal; onSave: (t: string) => void; onCancel: () => void; isLoading: boolean; }) {
  const [text, setText] = useState("");
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
      className="bg-white rounded-2xl border border-teal-200 shadow-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
          <span>{getMealEmoji(meal.name)}</span> Edit {meal.name}
        </p>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-4 h-4" /></button>
      </div>
      <p className="text-xs text-slate-400">Describe what you'd like to eat. The AI will calculate exact calories and macros.</p>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
        placeholder="e.g. 2 eggs, 1 cup oats, 1 banana..."
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
      <div className="flex gap-2">
        <button onClick={() => onSave(text)} disabled={isLoading || !text.trim()}
          className="flex-1 bg-teal-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-teal-700 disabled:opacity-40 flex items-center justify-center gap-1.5 transition-colors">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {isLoading ? "Updating…" : "Update Meal"}
        </button>
        <button onClick={onCancel} className="px-4 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
      </div>
    </motion.div>
  );
}

// ─── Meal Card ────────────────────────────────────────────────────────────────
function MealCard({ meal, mealIdx, dayIdx, onEdit }: { meal: ParsedMeal; mealIdx: number; dayIdx: number; onEdit: (dayIdx: number, mealIdx: number) => void; }) {
  const [expanded, setExpanded] = useState(false);
  const mg = meal.macroGrams;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button className="w-full flex items-center gap-3 px-4 py-4" onClick={() => setExpanded(v => !v)}>
        <span className="text-2xl">{getMealEmoji(meal.name)}</span>
        <div className="flex-1 text-left">
          <p className="font-semibold text-slate-800 text-sm">{meal.name}</p>
          {meal.timing && <p className="text-xs text-slate-400 mt-0.5">{meal.timing}</p>}
        </div>
        <div className="flex items-center gap-2">
          {mg?.kcal ? <span className="text-sm font-bold text-teal-600">{mg.kcal} kcal</span> : null}
          <button
            onClick={e => { e.stopPropagation(); onEdit(dayIdx, mealIdx); }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-medium transition-colors">
            <Pencil className="w-3 h-3" /> Change
          </button>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 border-t border-slate-50 pt-3 space-y-3">
              {meal.items.length > 0 && (
                <ul className="space-y-1.5">
                  {meal.items.map((item, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="text-teal-500 mt-0.5 flex-shrink-0 font-bold">•</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {mg && (
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs bg-teal-50 text-teal-700 font-semibold px-2.5 py-1 rounded-full">Protein: {mg.protein}g</span>
                  <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-full">Carbs: {mg.carbs}g</span>
                  <span className="text-xs bg-purple-50 text-purple-700 font-semibold px-2.5 py-1 rounded-full">Fat: {mg.fat}g</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Macro Bars ───────────────────────────────────────────────────────────────
function MacroBars({ macroGrams, dayOffset, targetKcal }: { macroGrams: ParsedMealMacros | null; dayOffset: number; targetKcal?: number }) {
  const kcal = targetKcal || macroGrams?.kcal || 0;
  const p = macroGrams?.protein || 0;
  const c = macroGrams?.carbs || 0;
  const f = macroGrams?.fat || 0;
  const maxG = Math.max(p, c, f, 1);
  const today = new Date();
  today.setDate(today.getDate() + dayOffset);
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const label = dayOffset === 0 ? "TODAY" : dayOffset === 1 ? "TOMORROW" : `DAY ${dayOffset + 1}`;

  return (
    <div className="bg-teal-700 rounded-2xl p-5 text-white">
      <p className="text-xs text-teal-300 font-medium mb-3">{label} · {dayNames[today.getDay()]}</p>
      <div className="flex items-start justify-between mb-5">
        <div>
          {kcal ? (
            <><span className="text-4xl font-bold">{kcal.toLocaleString()}</span><span className="text-teal-300 text-sm ml-1.5">kcal</span></>
          ) : (
            <span className="text-teal-300 text-sm">Calories calculating…</span>
          )}
        </div>
        <div className="flex gap-5 text-right">
          <div><p className="text-xs text-teal-300 mb-0.5">Protein</p><p className="font-bold">{p}g</p></div>
          <div><p className="text-xs text-teal-300 mb-0.5">Carbs</p><p className="font-bold text-amber-300">{c}g</p></div>
          <div><p className="text-xs text-teal-300 mb-0.5">Fat</p><p className="font-bold text-purple-300">{f}g</p></div>
        </div>
      </div>
      <div className="space-y-2.5">
        {[{ label: "Protein", val: p, color: "bg-teal-400" }, { label: "Carbohydrates", val: c, color: "bg-amber-400" }, { label: "Fat", val: f, color: "bg-purple-400" }].map(bar => (
          <div key={bar.label}>
            <div className="flex justify-between text-xs text-teal-300 mb-1"><span>{bar.label}</span><span>{bar.val}g</span></div>
            <div className="h-1.5 bg-teal-900 rounded-full overflow-hidden">
              <div className={`h-full ${bar.color} rounded-full transition-all duration-500`} style={{ width: `${(bar.val / maxG) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function makeDefaultWizard(): WizardData {
  return { mealsPerDay: 3, mealTimings: MEAL_DEFAULTS[3], fitnessGoal: "", medicalGoals: ["No specific condition"], cuisineStyle: "Indian", dietaryPreference: "", dailyCalories: 2000, mealVariety: "Different meals every day" };
}

function wizardFromHistory(h: Record<string, any>): WizardData {
  const count = parseInt(h.mealsPerDay || "") || 3;
  return {
    mealsPerDay: count,
    mealTimings: MEAL_DEFAULTS[count] || MEAL_DEFAULTS[3],
    fitnessGoal: h.fitnessGoal?.split("/")?.[0]?.trim() || "",
    medicalGoals: Array.isArray(h.medicalDietType) && h.medicalDietType.length ? h.medicalDietType : ["No specific condition"],
    cuisineStyle: h.dietCuisinePreference || "Indian",
    dietaryPreference: h.dietTypePreference || "",
    dailyCalories: parseInt(h.dailyCalorieTarget || "") || 2000,
    mealVariety: h.dietRevisionDays === "Same meal everyday" ? "Same meals every day" : "Different meals every day",
  };
}

export default function DietPlanner() {
  const [, setLocation] = useLocation();
  const updateUser = useUpdateUser();
  const fileRef = useRef<HTMLInputElement>(null);

  const storedUser: UserData | null = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("med_user") || "null"); } catch { return null; }
  }, []);

  const { data: freshUser } = useUserById(storedUser?.id ?? null);
  const user: UserData | null = useMemo(() => {
    if (!storedUser) return null;
    return freshUser ? { ...storedUser, ...(freshUser as object) } : storedUser;
  }, [storedUser, freshUser]);

  const dietHistory = useMemo((): Record<string, any> | null => {
    const h = user?.patientMedicalHistory as Record<string, any> | null;
    return h && (h.mealsPerDay || h.fitnessGoal || h.dietTypePreference) ? h : null;
  }, [user]);

  const [wizardData, setWizardData] = useState<WizardData>(makeDefaultWizard);
  const [showWizard, setShowWizard] = useState(true);
  const [currentPrefs, setCurrentPrefs] = useState<WizardData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dayPlans, setDayPlans] = useState<(DayPlan | null)[]>([]);
  const [planCache, setPlanCache] = useState<Record<number, DayPlan[]>>({});
  const [generatingDay, setGeneratingDay] = useState<number | null>(null);
  const [activeDuration, setActiveDuration] = useState(DURATION_OPTIONS[0]);
  const [activeDay, setActiveDay] = useState(0);
  const [editingMeal, setEditingMeal] = useState<{ dayIdx: number; mealIdx: number } | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [uploadedReport, setUploadedReport] = useState<UploadedReport | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const sessionRef = useRef<boolean>(false);

  // Pre-fill wizard from existing history, but always show wizard on entry
  useEffect(() => {
    if (dietHistory) {
      setWizardData(wizardFromHistory(dietHistory));
    }
  }, [!!dietHistory]);

  const buildReportContext = useCallback(() => {
    if (!uploadedReport) return undefined;
    if (uploadedReport.params.length > 0) return `Lab Report: ${uploadedReport.name}\n\n${uploadedReport.paramSummary}`;
    return `Lab Report (${uploadedReport.name}):\n${uploadedReport.text}`;
  }, [uploadedReport]);

  const buildContextUser = useCallback((wiz: WizardData) => {
    return {
      ...user,
      patientMedicalHistory: {
        ...(user?.patientMedicalHistory || {}),
        mealsPerDay: String(wiz.mealsPerDay),
        mealTimings: wiz.mealTimings.map((m, i) => `Meal ${i + 1}: ${m.time}`).join(" | "),
        fitnessGoal: wiz.fitnessGoal,
        medicalDietType: wiz.medicalGoals,
        dietCuisinePreference: wiz.cuisineStyle,
        dietTypePreference: wiz.dietaryPreference,
        dailyCalorieTarget: String(wiz.dailyCalories),
        dietRevisionDays: wiz.mealVariety === "Same meals every day" ? "Same meal everyday" : "Different meal everyday",
      }
    };
  }, [user]);

  const buildMealTimingsRecord = (wiz: WizardData): Record<string, string> => {
    const r: Record<string, string> = {};
    wiz.mealTimings.forEach((m, i) => { r[`Meal ${i + 1}`] = `${m.name} ${m.time}`; });
    return r;
  };

  const generateDay = useCallback(async (dayNum: number, isFirst: boolean, wiz: WizardData): Promise<DayPlan | null> => {
    if (!user) return null;
    setGeneratingDay(dayNum);
    try {
      const sameEveryday = wiz.mealVariety === "Same meals every day";
      const dayNote = !isFirst && !sameEveryday ? " Generate DIFFERENT meals from previous days — vary foods, cooking methods, and ingredients." : "";

      // Compute exact per-meal kcal targets so the AI has hard numbers, not percentages
      const mealPcts = wiz.mealTimings.map(m => {
        const n = m.name.toLowerCase();
        if (n.includes("breakfast")) return 0.22;
        if (n.includes("lunch")) return 0.30;
        if (n.includes("dinner")) return 0.28;
        return 0.10; // snacks
      });
      const pctSum = mealPcts.reduce((a, b) => a + b, 0);
      let mealKcals = mealPcts.map(p => Math.round((p / pctSum) * wiz.dailyCalories));
      // Fix rounding so sum equals dailyCalories exactly
      const diff = wiz.dailyCalories - mealKcals.reduce((a, b) => a + b, 0);
      if (diff !== 0) mealKcals[mealKcals.length - 1] += diff;
      const mealTargetStr = wiz.mealTimings.map((m, i) => `${m.name}=${mealKcals[i]}kcal`).join(", ");
      const calorieDirective = `\n\n!!! CALORIE RULE #1 PRIORITY: Generate a diet plan totaling EXACTLY ${wiz.dailyCalories} kcal. Target per meal: ${mealTargetStr}. The sum of all meal kcal MUST equal ${wiz.dailyCalories}. !!!`;

      const baseRequest = dayNum === 1
        ? `Generate my personalized diet plan for EXACTLY ${wiz.dailyCalories} kcal daily`
        : `Generate Day ${dayNum} diet plan for EXACTLY ${wiz.dailyCalories} kcal daily.${dayNote}`;
      const message = baseRequest + calorieDirective;

      const res = await fetch(api.ai.chat.path, {
        method: api.ai.chat.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          context: buildPatientContext(buildContextUser(wiz) as any),
          reportContext: buildReportContext(),
          userId: user.id,
          mode: "diet-planner",
          isFirstMessage: isFirst,
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      return parseDayPlan(data.response || "", dayNum, buildMealTimingsRecord(wiz));
    } catch {
      return null;
    } finally {
      setGeneratingDay(null);
    }
  }, [user, buildContextUser, buildReportContext]);

  const generateAllDays = useCallback(async (dur: number, wiz: WizardData) => {
    sessionRef.current = false;
    setDayPlans(Array(dur).fill(null));
    setActiveDay(0);
    const sameEveryday = wiz.mealVariety === "Same meals every day";
    let finalPlans: (DayPlan | null)[] = [];

    if (sameEveryday) {
      const day1 = await generateDay(1, true, wiz);
      finalPlans = Array(dur).fill(day1).map((p, i) => p ? { ...p, day: i + 1 } : null);
      setDayPlans(finalPlans);
    } else {
      const results: (DayPlan | null)[] = [];
      for (let d = 1; d <= dur; d++) {
        const plan = await generateDay(d, d === 1, wiz);
        results.push(plan);
        setDayPlans([...results, ...Array(dur - d).fill(null)]);
      }
      finalPlans = results;
    }

    const completed = finalPlans.filter(Boolean) as DayPlan[];
    if (completed.length > 0) {
      setPlanCache(prev => {
        const next = { ...prev, [dur]: completed };
        // Always keep a "Today" (1-day) cache from the first day of any plan
        if (!next[1] && completed[0]) next[1] = [completed[0]];
        return next;
      });
    }
  }, [generateDay]);

  const handleGenerate = useCallback(async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const timingsStr = wizardData.mealTimings.map((m, i) => `Meal ${i + 1}: ${m.time}`).join(" | ");
      await updateUser.mutateAsync({
        id: user.id,
        updates: {
          patientMedicalHistory: {
            ...(user.patientMedicalHistory || {}),
            mealsPerDay: String(wizardData.mealsPerDay),
            mealTimings: timingsStr,
            fitnessGoal: wizardData.fitnessGoal,
            medicalDietType: wizardData.medicalGoals,
            dietCuisinePreference: wizardData.cuisineStyle,
            dietTypePreference: wizardData.dietaryPreference,
            dailyCalorieTarget: String(wizardData.dailyCalories),
            dietRevisionDays: wizardData.mealVariety === "Same meals every day" ? "Same meal everyday" : "Different meal everyday",
          }
        }
      });
    } catch {}
    setIsSaving(false);
    setCurrentPrefs(wizardData);
    setActiveDuration(DURATION_OPTIONS[0]);
    setPlanCache({});
    setShowWizard(false);
    await generateAllDays(1, wizardData);
  }, [user, wizardData, updateUser, generateAllDays]);

  const handleDurationChange = useCallback(async (opt: typeof DURATION_OPTIONS[0]) => {
    if (generatingDay !== null) return;
    setActiveDuration(opt);
    setActiveDay(0);
    const cached = planCache[opt.days];
    if (cached && cached.length === opt.days) {
      setDayPlans(cached);
      return;
    }
    // "Today" fallback: use day 1 from any cached multi-day plan to avoid re-generating
    if (opt.days === 1) {
      const anyFirst = Object.values(planCache).find(c => c.length > 0)?.[0];
      if (anyFirst) {
        const todayPlan = [anyFirst];
        setDayPlans(todayPlan);
        setPlanCache(prev => ({ ...prev, [1]: todayPlan }));
        return;
      }
    }
    const wiz = currentPrefs || wizardData;
    await generateAllDays(opt.days, wiz);
  }, [generatingDay, currentPrefs, wizardData, generateAllDays, planCache]);

  const editMeal = useCallback(async (dayIdx: number, mealIdx: number, newText: string) => {
    if (!user) return;
    setEditLoading(true);
    try {
      const plan = dayPlans[dayIdx];
      if (!plan) return;
      const meal = plan.meals[mealIdx];
      const wiz = currentPrefs || wizardData;
      const stripEmoji = (s: string) => s.replace(/[\uD800-\uDFFF]/g, "").replace(/[^\u0000-\uFFFF]/g, "");
      const mealKcalTarget = meal.macroGrams?.kcal || Math.round(wiz.dailyCalories / (plan.meals.length || 4));
      const currentFoods = meal.items.length > 0 ? meal.items.map(i => `- ${i}`).join("\n") : "(no items listed)";
      const otherMeals = plan.meals
        .filter((_, idx) => idx !== mealIdx)
        .map(m => `${m.name}: ${m.macroGrams?.kcal || 0} kcal`)
        .join(", ");
      const msg = stripEmoji(
        `MEAL REPLACEMENT REQUEST — follow these instructions exactly.\n\n` +
        `*** OVERRIDE ALL PREVIOUS RESTRICTIONS: The user has explicitly chosen specific foods. You MUST use the user's requested foods without question. Do NOT refuse, substitute, or question any food item the user has specified — regardless of cuisine rules, diet restrictions, or any prior instructions. The user's food choice is FINAL. ***\n\n` +
        `*** CALORIE RULE: The new ${meal.name} MUST total EXACTLY ${mealKcalTarget} kcal (sum of all items). The user's full-day calorie budget is ${wiz.dailyCalories} kcal — do NOT exceed the per-meal target. ***\n\n` +
        `DAILY CALORIE BUDGET: ${wiz.dailyCalories} kcal total (all meals combined).\n` +
        `OTHER MEALS TODAY: ${otherMeals}.\n` +
        `MEAL: ${meal.name} — EXACTLY ${mealKcalTarget} kcal\n\n` +
        `USER'S REQUESTED FOODS: ${newText}\n\n` +
        `INSTRUCTIONS:\n` +
        `1. Include the user's requested foods above. Do NOT replace or refuse them.\n` +
        `2. FIRST try adjusting portion sizes of the requested foods so they sum to EXACTLY ${mealKcalTarget} kcal. Do NOT add extra items if you can hit ${mealKcalTarget} kcal by adjusting portions alone.\n` +
        `3. ONLY IF the requested foods cannot possibly reach ${mealKcalTarget} kcal even at maximum realistic portions (e.g. a single small item), add ONE small side item to fill the remaining gap. Do not add more than one extra item.\n` +
        `4. The sum of ALL item kcal values MUST equal EXACTLY ${mealKcalTarget} kcal — no more, no less.\n` +
        `5. Do NOT carry over any previous meal items.\n` +
        `6. Do NOT ask any questions. Do NOT refuse. Just output the meal section.\n` +
        `7. Each food item MUST have: (~XXXkcal | Pg | Cg | Fg).\n\n` +
        `Return ONLY (no intro, no questions, nothing else):\n` +
        `## ${meal.name}\n` +
        `**~${mealKcalTarget} kcal | Protein Xg | Carbs Yg | Fat Zg**\n` +
        `- Food Name, portion (~XXXkcal | Pg | Cg | Fg)\n` +
        `- Food Name, portion (~XXXkcal | Pg | Cg | Fg)`
      );

      const res = await fetch(api.ai.chat.path, {
        method: api.ai.chat.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, userId: user.id, mode: "meal-edit", isFirstMessage: true }),
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const lines = (data.response || "").replace(/\[MACROS:.*?\]/gi, "").trim().split("\n").map((l: string) => l.trim()).filter(Boolean);
      // Prefer the bold meal-total line (**~XXX kcal | ...**) over per-item macro lines
      const macroLine = lines.find((l: string) => /^\*\*~?\d+\s*kcal/i.test(l)) ||
        lines.find((l: string) => /\*\*.*\d+\s*kcal.*Protein/i.test(l)) ||
        lines.find((l: string) => /\d+\s*kcal.*Protein\s*\d+/i.test(l) && !/^[-•*]\s*[A-Za-z]/.test(l)) || "";
      const isEditMacroLine = (l: string) =>
        l === macroLine ||
        /^\*\*~?\d+\s*kcal/i.test(l) ||
        /^[*-]\s*~?\d+\s*kcal/i.test(l);
      const items = lines
        .filter((l: string) => /^[-•*]/.test(l) && !isEditMacroLine(l))
        .map((l: string) => l.replace(/^[-•*]\s*/, "").replace(/\*\*/g, "").trim())
        .filter((l: string) => !/^~?\d+\s*kcal/i.test(l))
        .filter(Boolean);
      let mg = parseMacroGrams(macroLine);
      // Recalculate kcal from individual item calories to ensure consistency
      const editItemKcals = items.map((item: string) => {
        const m = item.match(/\(~?(\d+)\s*kcal/i) || item.match(/[-–]\s*~?(\d+)\s*kcal/i);
        return m ? parseInt(m[1], 10) : 0;
      });
      const editComputedKcal = editItemKcals.reduce((a: number, b: number) => a + b, 0);
      if (mg) mg = { ...mg, kcal: mealKcalTarget };
      else if (editComputedKcal > 0) mg = { kcal: mealKcalTarget, protein: 0, carbs: 0, fat: 0 };
      else mg = { kcal: mealKcalTarget, protein: 0, carbs: 0, fat: 0 };

      setDayPlans(prev => prev.map((p, i) => {
        if (i !== dayIdx || !p) return p;
        const meals = [...p.meals];
        meals[mealIdx] = { ...meal, macroLine: macroLine.replace(/\*\*/g, ""), items: items.length ? items : [newText], macroGrams: mg, rawText: data.response };
        return { ...p, meals };
      }));
      setEditingMeal(null);
    } catch {
      alert("Failed to update meal. Please try again.");
    } finally {
      setEditLoading(false);
    }
  }, [user, dayPlans, currentPrefs, wizardData]);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/diet/parse-pdf", { method: "POST", body: form, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      setUploadedReport({ name: data.fileName || file.name, text: data.text || "", params: data.params || [], paramSummary: data.paramSummary || "" });
      sessionRef.current = false;
    } catch (e: any) {
      alert(e?.message || "Failed to parse file.");
    } finally {
      setIsUploading(false);
    }
  };

  const prefPills = useMemo(() => {
    const w = currentPrefs;
    if (!w) return [];
    const pills: string[] = [];
    if (w.fitnessGoal) pills.push(w.fitnessGoal);
    if (w.cuisineStyle) pills.push(w.cuisineStyle);
    if (w.dietaryPreference) pills.push(w.dietaryPreference);
    if (w.dailyCalories) pills.push(`${w.dailyCalories.toLocaleString()} kcal/day`);
    if (w.mealsPerDay) pills.push(`${w.mealsPerDay} meals/day`);
    return pills;
  }, [currentPrefs]);

  const activePlan = dayPlans[activeDay] ?? null;
  const isGenerating = generatingDay !== null;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Please log in to use the AI Diet Planner.</p>
          <button onClick={() => setLocation("/")} className="text-teal-600 font-medium">Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-2xl mx-auto">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => setLocation("/assistant")} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-wide leading-none">SPECIGO · DIET PLANNER</p>
          <h1 className="font-bold text-slate-900 text-sm">{showWizard ? "Set Your Preferences" : "Your Meal Plan"}</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <input ref={fileRef} type="file" accept=".pdf,.txt" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
          <button onClick={() => fileRef.current?.click()} disabled={isUploading}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 disabled:opacity-40 transition-colors" title="Upload lab report">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          </button>
          {!showWizard && (
            <button
              onClick={() => { setCurrentPrefs(null); setWizardData(dietHistory ? wizardFromHistory(dietHistory) : makeDefaultWizard()); setShowWizard(true); setDayPlans([]); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors">
              <Sparkles className="w-3 h-3" /> New Plan
            </button>
          )}
        </div>
      </div>

      {showWizard ? (
        <WizardView data={wizardData} onChange={setWizardData} onGenerate={handleGenerate} isSaving={isSaving} />
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Preference pills */}
          {prefPills.length > 0 && (
            <div className="bg-white border-b border-slate-100 px-4 py-3">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {prefPills.map((p, i) => (
                  <span key={i} className="text-xs bg-teal-50 text-teal-700 font-medium px-2.5 py-1 rounded-full border border-teal-100 whitespace-nowrap">{p}</span>
                ))}
              </div>
              <button
                onClick={() => { setWizardData(currentPrefs || (dietHistory ? wizardFromHistory(dietHistory) : makeDefaultWizard())); setShowWizard(true); }}
                className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1 font-medium transition-colors">
                <Settings className="w-3 h-3" /> Edit Preferences
              </button>
            </div>
          )}

          {/* Duration tabs */}
          <div className="bg-white border-b border-slate-100 px-4 flex gap-0">
            {DURATION_OPTIONS.map(opt => (
              <button key={opt.days} onClick={() => handleDurationChange(opt)} disabled={isGenerating}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-all disabled:opacity-50 ${activeDuration.days === opt.days ? "border-teal-600 text-teal-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Day sub-tabs for multi-day */}
          {dayPlans.length > 1 && (
            <div className="bg-white border-b border-slate-100 px-4 py-2.5 flex gap-2 overflow-x-auto">
              {dayPlans.map((_, i) => (
                <button key={i} onClick={() => setActiveDay(i)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${activeDay === i ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"}`}>
                  Day {i + 1}
                </button>
              ))}
            </div>
          )}

          {/* Plan content */}
          <div className="p-4 space-y-3">
            {isGenerating && !activePlan ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-9 h-9 text-teal-600 animate-spin" />
                <p className="text-slate-700 font-semibold">Generating Day {generatingDay} plan…</p>
                <p className="text-xs text-slate-400">Personalizing based on your preferences</p>
              </div>
            ) : activePlan ? (
              <>
                <MacroBars macroGrams={activePlan.macroGrams} dayOffset={activeDay} targetKcal={currentPrefs?.dailyCalories || wizardData.dailyCalories} />

                {activePlan.meals.map((meal, mealIdx) => (
                  <div key={mealIdx}>
                    <AnimatePresence mode="wait">
                      {editingMeal?.dayIdx === activeDay && editingMeal?.mealIdx === mealIdx ? (
                        <EditMealPanel key="edit" meal={meal} onSave={t => editMeal(activeDay, mealIdx, t)} onCancel={() => setEditingMeal(null)} isLoading={editLoading} />
                      ) : (
                        <MealCard key="card" meal={meal} mealIdx={mealIdx} dayIdx={activeDay} onEdit={(d, m) => setEditingMeal({ dayIdx: d, mealIdx: m })} />
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                {activePlan.whyThisPlan && (
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                    <p className="text-xs font-semibold text-amber-700 mb-1.5">💡 Why This Plan</p>
                    <p className="text-xs text-amber-900 leading-relaxed">{activePlan.whyThisPlan}</p>
                  </div>
                )}

                {activePlan.foodsToAvoid.length > 0 && (
                  <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                    <p className="text-xs font-semibold text-red-700 mb-2">⚠️ Foods to Avoid</p>
                    <ul className="space-y-1">
                      {activePlan.foodsToAvoid.map((f, i) => (
                        <li key={i} className="text-xs text-red-800 flex items-start gap-1.5">
                          <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {uploadedReport && (
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-blue-700">Lab Report Included</p>
                      <p className="text-xs text-blue-500">{uploadedReport.name}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <Salad className="w-12 h-12 text-teal-300" />
                <p className="text-slate-600 font-medium">Ready to Generate</p>
                <p className="text-xs text-slate-400 text-center max-w-xs">Select a duration above to generate your personalized meal plan.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
