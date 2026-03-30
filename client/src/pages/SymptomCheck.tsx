import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Clock, Activity, Loader2, ChevronRight, Stethoscope, AlertTriangle, Home, Pill, Eye, RefreshCw, ClipboardList, TestTube, Ban, UtensilsCrossed, Plus, MessageCircle, Send, UserRound, Check, History, ChevronDown, ChevronUp, Trash2, TriangleAlert } from "lucide-react";
import type { User as UserType, MedicalRecord } from "@shared/schema";
import { api, buildUrl } from "@shared/routes";
import { useCreateRecord, useMedicalRecords, useDeleteRecord } from "@/hooks/use-medical";
import { useUserById } from "@/hooks/use-users";
import { buildPatientContext } from "@/lib/patient-context";

const getStoredUser = () => {
  const stored = localStorage.getItem("med_user");
  return stored ? JSON.parse(stored) as UserType : null;
};

type CheckStep = "symptom" | "related" | "onset" | "severity" | "loading" | "results";
type ChatMessage = { role: "user" | "assistant"; text: string };

const ONSET_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "2-3 days ago", value: "2-3 days ago" },
  { label: "Last week", value: "last week" },
  { label: "Longer than a week", value: "longer than a week" },
  { label: "More than 14 days", value: "more than 14 days" },
  { label: "More than a month", value: "more than a month" },
];

const SEVERITY_OPTIONS = [
  { label: "Mild", value: "mild", description: "Noticeable but doesn't affect daily activities", color: "bg-green-50 border-green-200 text-green-800" },
  { label: "Moderate", value: "moderate", description: "Somewhat affects daily activities", color: "bg-yellow-50 border-yellow-200 text-yellow-800" },
  { label: "Severe", value: "severe", description: "Significantly limits daily activities", color: "bg-orange-50 border-orange-200 text-orange-800" },
  { label: "Very Severe", value: "very severe", description: "Unable to perform daily activities", color: "bg-red-50 border-red-200 text-red-800" },
];

const RESULT_TABS = [
  { id: "overview", label: "Overview" },
  { id: "actions", label: "Actions" },
  { id: "worry", label: "When to Worry" },
  { id: "doctor", label: "Doctor Prep" },
  { id: "chat", label: "Chat" },
];

const SECTION_MAP: Record<string, string[]> = {
  overview: [
    "What could this be?",
    "Should I be worried?",
    "How urgent is this?",
  ],
  actions: [
    "What can I do right now at home?",
    "What should I avoid?",
    "What should I eat or drink?",
    "Can I take any medicine on my own?",
  ],
  worry: [
    "Do I need to go to a hospital right now?",
    "What symptoms should I watch out for?",
    "Is this related to something I already have?",
  ],
  doctor: [
    "What will the doctor likely ask me?",
    "What tests might the doctor suggest?",
  ],
};

const SECTION_ICONS: Record<string, React.ReactNode> = {
  "What could this be?": <Search className="w-5 h-5 text-teal-600" />,
  "To which doctor should I refer?": <UserRound className="w-5 h-5 text-blue-600" />,
  "Should I be worried?": <AlertTriangle className="w-5 h-5 text-amber-500" />,
  "How urgent is this?": <Clock className="w-5 h-5 text-blue-600" />,
  "What can I do right now at home?": <Home className="w-5 h-5 text-green-600" />,
  "What should I avoid?": <Ban className="w-5 h-5 text-red-500" />,
  "What should I eat or drink?": <UtensilsCrossed className="w-5 h-5 text-orange-500" />,
  "Can I take any medicine on my own?": <Pill className="w-5 h-5 text-purple-600" />,
  "Do I need to go to a hospital right now?": <Activity className="w-5 h-5 text-red-600" />,
  "What symptoms should I watch out for?": <Eye className="w-5 h-5 text-amber-600" />,
  "Is this related to something I already have?": <RefreshCw className="w-5 h-5 text-indigo-500" />,
  "What will the doctor likely ask me?": <ClipboardList className="w-5 h-5 text-slate-600" />,
  "What tests might the doctor suggest?": <TestTube className="w-5 h-5 text-cyan-600" />,
};

const SECTION_EMOJIS: Record<string, string> = {
  "What could this be?": "🔍",
  "To which doctor should I refer?": "🩺",
  "Should I be worried?": "⚠️",
  "How urgent is this?": "⏱️",
  "What can I do right now at home?": "🏠",
  "What should I avoid?": "🚫",
  "What should I eat or drink?": "🍽️",
  "Can I take any medicine on my own?": "💊",
  "Do I need to go to a hospital right now?": "🏥",
  "What symptoms should I watch out for?": "👀",
  "Is this related to something I already have?": "🔁",
  "What will the doctor likely ask me?": "📋",
  "What tests might the doctor suggest?": "🧪",
};

export default function SymptomCheck() {
  const [, setLocation] = useLocation();
  const [currentUser] = useState<UserType | null>(getStoredUser());
  const { data: refreshedUser } = useUserById(currentUser?.id ?? null);
  const activeUser = (refreshedUser ?? currentUser) as UserType | null;
  const [step, setStep] = useState<CheckStep>("symptom");
  const [symptomText, setSymptomText] = useState("");
  const [suggestedSymptoms, setSuggestedSymptoms] = useState<string[]>([]);
  const [selectedRelated, setSelectedRelated] = useState<string[]>([]);
  const [onset, setOnset] = useState("");
  const [severity, setSeverity] = useState("");
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [resultText, setResultText] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [parsedSections, setParsedSections] = useState<Record<string, string>>({});
  const [additionalSymptom, setAdditionalSymptom] = useState("");
  const [showAddSymptom, setShowAddSymptom] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showForgottenSymptom, setShowForgottenSymptom] = useState(false);
  const [forgottenSymptom, setForgottenSymptom] = useState("");
  const [selectedForgottenSuggestions, setSelectedForgottenSuggestions] = useState<string[]>([]);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [forgottenSuggestions, setForgottenSuggestions] = useState<string[]>([]);
  const [loadingForgottenSuggestions, setLoadingForgottenSuggestions] = useState(false);
  const [forgottenSuggestionsFetched, setForgottenSuggestionsFetched] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [showSavedChecks, setShowSavedChecks] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MedicalRecord | null>(null);
  const [deleteReason, setDeleteReason] = useState<"severity" | "urgency" | "both" | "moderate_urgency" | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const createRecord = useCreateRecord();
  const deleteRecord = useDeleteRecord();
  const { data: allRecords = [] } = useMedicalRecords(currentUser?.id);
  const savedSymptomChecks = allRecords.filter((r: MedicalRecord) => {
    const fc = r.fullConversation as any;
    return fc && fc.type === 'symptom_check';
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (!currentUser) {
      setLocation("/");
    }
  }, [currentUser, setLocation]);

  const fetchSuggestions = async () => {
    if (!symptomText.trim()) return;
    setLoadingSuggestions(true);
    try {
      const res = await fetch(api.ai.suggestSymptoms.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptom: symptomText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestedSymptoms(data.suggestions || []);
      }
    } catch (e) {
      console.error("Failed to fetch suggestions:", e);
      setSuggestedSymptoms(["Fever", "Headache", "Nausea", "Fatigue", "Body Pain", "Chills"]);
    }
    setLoadingSuggestions(false);
    setStep("related");
  };

  const toggleRelatedSymptom = (symptom: string) => {
    setSelectedRelated(prev =>
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const getFreshContext = async (): Promise<string | undefined> => {
    const userId = currentUser?.id;
    if (!userId) return activeUser ? buildPatientContext(activeUser) : undefined;
    try {
      const url = buildUrl(api.users.getById.path, { id: userId });
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const freshUser = await res.json() as UserType;
        return buildPatientContext(freshUser);
      }
    } catch {}
    return activeUser ? buildPatientContext(activeUser) : undefined;
  };

  const submitCheck = async () => {
    setStep("loading");
    try {
      const ctx = await getFreshContext();
      const res = await fetch(api.ai.symptomCheck.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id || 0,
          symptom: symptomText.trim(),
          relatedSymptoms: selectedRelated,
          onset,
          severity,
          context: ctx,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setResultText(data.response);
      parseResults(data.response);
      setStep("results");
      if (currentUser?.id) {
        createRecord.mutate({
          userId: currentUser.id,
          symptom: symptomText.trim(),
          diagnosis: data.response,
          fullConversation: {
            type: 'symptom_check',
            selectedRelated,
            onset,
            severity,
          } as any,
        });
      }
    } catch (e) {
      console.error("Symptom check failed:", e);
      setStep("severity");
    }
  };

  const loadSavedCheck = (record: MedicalRecord) => {
    const fc = record.fullConversation as any;
    setSymptomText(record.symptom);
    setSelectedRelated(fc?.selectedRelated || []);
    setOnset(fc?.onset || "");
    setSeverity(fc?.severity || "");
    setResultText(record.diagnosis || "");
    parseResults(record.diagnosis || "");
    setChatMessages([]);
    setFollowUpQuestions([]);
    setActiveTab("overview");
    setStep("results");
  };

  const getUrgencyText = (diagnosis: string): string => {
    const urgencyPattern = /(?:#{1,3}\s*)?(?:⏱️)?\s*(?:\d+\.?\s*)?How urgent is this\??/i;
    const match = diagnosis.search(urgencyPattern);
    if (match === -1) return "";
    const headingMatch = diagnosis.substring(match).match(urgencyPattern);
    if (!headingMatch) return "";
    const afterHeading = diagnosis.substring(match + headingMatch[0].length);
    // Stop at the next numbered section or markdown heading — not a fixed char limit
    const nextSectionPattern = /\n\s*(?:\d+\s*\.|\#{1,3}|🔍|🩺|⚠️|🏥|🏠|🚫|🍽️|💊|👀|🔁|📋|🧪)/;
    const nextSectionIdx = afterHeading.search(nextSectionPattern);
    const snippet = nextSectionIdx !== -1
      ? afterHeading.substring(0, nextSectionIdx)
      : afterHeading.substring(0, 250);
    return snippet.replace(/^[:\-–—\s\*•]+/, "").trim().toLowerCase();
  };

  const isUrgentDiagnosis = (diagnosis: string): boolean => {
    const urgencyText = getUrgencyText(diagnosis);
    if (!urgencyText) return false;
    const urgentPhrases = [
      "see a doctor today",
      "visit a doctor today",
      "go to the doctor today",
      "see a doctor immediately",
      "visit a doctor immediately",
      "ideally today",
      "soonest possible",
      "see a doctor as soon as possible",
      "immediately",
      "right away",
      "right now",
      "within a day",
      "within 24 hours",
      "within the day",
      "within 1 day",
      "within one day",
      "as soon as possible",
      "asap",
      "emergency room",
      "go to the er",
      "go now",
      "without delay",
      "do not wait",
      "don't wait",
      " today",
    ];
    return urgentPhrases.some(phrase => urgencyText.includes(phrase));
  };

  const isModerateUrgencyDiagnosis = (diagnosis: string): boolean => {
    const urgencyText = getUrgencyText(diagnosis);
    if (!urgencyText) return false;
    const moderatePhrases = [
      "within 2 days", "within 3 days", "within 4 days", "within 5 days",
      "within two days", "within three days", "within four days", "within five days",
      "within 2-3 days", "within 3-4 days", "within 3 to", "within 2 to",
      "within a few days", "within a week", "within 7 days",
      "in the next few days", "in a few days", "in 2-3 days", "in 3 days",
      "this week", "schedule an appointment",
      "see a doctor within", "visit a doctor within",
    ];
    return moderatePhrases.some(phrase => urgencyText.includes(phrase));
  };

  const handleDeleteCheck = (e: React.MouseEvent, record: MedicalRecord) => {
    e.stopPropagation();
    const fc = record.fullConversation as any;
    const sev = (fc?.severity || "").toLowerCase();
    const highSeverity = sev === "severe" || sev === "very severe";
    const highUrgency = isUrgentDiagnosis(record.diagnosis || "");
    const moderateUrgency = !highUrgency && isModerateUrgencyDiagnosis(record.diagnosis || "");
    if (highSeverity && highUrgency) {
      setDeleteReason("both");
      setDeleteTarget(record);
    } else if (highSeverity) {
      setDeleteReason("severity");
      setDeleteTarget(record);
    } else if (highUrgency) {
      setDeleteReason("urgency");
      setDeleteTarget(record);
    } else if (moderateUrgency) {
      setDeleteReason("moderate_urgency");
      setDeleteTarget(record);
    } else {
      deleteRecord.mutate(record.id);
    }
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteRecord.mutate(deleteTarget.id);
      setDeleteTarget(null);
      setDeleteReason(null);
    }
  };

  const fetchForgottenSuggestions = async () => {
    setLoadingForgottenSuggestions(true);
    const causes = parsedSections["What could this be?"] || "";
    const allSelected = [symptomText.trim().toLowerCase(), ...selectedRelated.map(s => s.toLowerCase())];
    try {
      const res = await fetch(api.ai.suggestSymptoms.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptom: `${symptomText}. Probable causes: ${causes.substring(0, 300)}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const filtered = (data.suggestions || []).filter(
          (s: string) => !allSelected.includes(s.toLowerCase())
        );
        setForgottenSuggestions(filtered.slice(0, 6));
      }
    } catch (e) {
      console.error("Failed to fetch forgotten suggestions:", e);
      const CAUSE_SYMPTOM_MAP: Record<string, string[]> = {
        "viral": ["Runny Nose", "Sore Throat", "Sneezing", "Watery Eyes", "Loss of Appetite", "Mild Cough"],
        "infection": ["Fever", "Chills", "Sweating", "Swollen Lymph Nodes", "Loss of Appetite", "Weakness"],
        "gastritis": ["Heartburn", "Nausea", "Bloating", "Loss of Appetite", "Acid Reflux", "Burping"],
        "migraine": ["Sensitivity to Light", "Nausea", "Visual Aura", "Throbbing Pain", "Neck Stiffness", "Dizziness"],
        "flu": ["Runny Nose", "Sore Throat", "Muscle Aches", "Chills", "Sneezing", "Dry Cough"],
        "dengue": ["High Fever", "Eye Pain", "Rash", "Joint Pain", "Nausea", "Bleeding Gums"],
        "typhoid": ["High Fever", "Stomach Pain", "Constipation", "Loss of Appetite", "Weakness", "Rash"],
        "anemia": ["Pale Skin", "Shortness of Breath", "Dizziness", "Cold Hands", "Brittle Nails", "Fast Heartbeat"],
        "diabetes": ["Frequent Urination", "Excessive Thirst", "Blurred Vision", "Slow Healing", "Tingling", "Weight Loss"],
        "thyroid": ["Weight Changes", "Hair Loss", "Dry Skin", "Mood Changes", "Fatigue", "Sensitivity to Cold"],
        "anxiety": ["Racing Heart", "Trembling", "Sweating", "Shortness of Breath", "Insomnia", "Restlessness"],
      };
      const causesLower = causes.toLowerCase();
      let suggestions: string[] = [];
      for (const [cause, syms] of Object.entries(CAUSE_SYMPTOM_MAP)) {
        if (causesLower.includes(cause)) {
          suggestions.push(...syms.filter(s => !allSelected.includes(s.toLowerCase())));
        }
      }
      const unique = [...new Set(suggestions)];
      setForgottenSuggestions(unique.slice(0, 6));
    }
    setLoadingForgottenSuggestions(false);
    setForgottenSuggestionsFetched(true);
  };

  const selectForgottenSuggestion = (symptom: string) => {
    setSelectedForgottenSuggestions(prev => {
      if (prev.includes(symptom)) {
        return prev.filter(s => s !== symptom);
      }
      return [...prev, symptom];
    });
  };

  const reanalyzeWithForgottenSymptom = async () => {
    const allNew: string[] = [...selectedForgottenSuggestions];
    if (forgottenSymptom.trim()) {
      allNew.push(forgottenSymptom.trim());
    }
    if (allNew.length === 0) return;
    setReanalyzing(true);
    const updatedRelated = [...selectedRelated];
    for (const s of allNew) {
      if (!updatedRelated.includes(s)) {
        updatedRelated.push(s);
      }
    }
    setSelectedRelated(updatedRelated);
    try {
      const ctx = await getFreshContext();
      const res = await fetch(api.ai.symptomCheck.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id || 0,
          symptom: symptomText.trim(),
          relatedSymptoms: updatedRelated,
          onset,
          severity,
          context: ctx,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setResultText(data.response);
      parseResults(data.response);
      setForgottenSymptom("");
      setSelectedForgottenSuggestions([]);
      setShowForgottenSymptom(false);
      setChatMessages([]);
      setActiveTab("overview");
    } catch (e) {
      console.error("Re-analysis failed:", e);
    }
    setReanalyzing(false);
  };

  const parseResults = (text: string) => {
    const sections: Record<string, string> = {};
    const sectionKeys = [
      "What could this be?",
      "To which doctor should I refer?",
      "Should I be worried?",
      "Do I need to go to a hospital right now?",
      "How urgent is this?",
      "What can I do right now at home?",
      "What should I avoid?",
      "What should I eat or drink?",
      "Can I take any medicine on my own?",
      "What symptoms should I watch out for?",
      "Is this related to something I already have?",
      "What will the doctor likely ask me?",
      "What tests might the doctor suggest?",
    ];

    const alternativePatterns: Record<string, string[]> = {
      "To which doctor should I refer?": [
        "To which doctor should I refer\\??",
        "To whom should I refer\\??",
        "Which doctor should I (?:see|visit|consult)\\??",
        "Doctor referral",
        "Specialist recommendation",
      ],
    };

    const buildPattern = (key: string) => {
      const emojiGroup = `(?:🔍|🩺|⚠️|🏥|⏱️|🏠|🚫|🍽️|💊|👀|🔁|📋|🧪)?`;
      const alts = alternativePatterns[key];
      if (alts) {
        const altGroup = alts.join("|");
        return new RegExp(
          `(?:#{1,3}\\s*)?${emojiGroup}\\s*(?:\\d+\\.?\\s*)?(?:${altGroup})`,
          'i'
        );
      }
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(
        `(?:#{1,3}\\s*)?${emojiGroup}\\s*(?:\\d+\\.?\\s*)?${escapedKey}`,
        'i'
      );
    };

    for (let i = 0; i < sectionKeys.length; i++) {
      const key = sectionKeys[i];
      const pattern = buildPattern(key);
      const match = text.search(pattern);
      if (match !== -1) {
        let endIndex = text.length;
        for (let j = i + 1; j < sectionKeys.length; j++) {
          const nextPattern = buildPattern(sectionKeys[j]);
          const nextMatch = text.substring(match + 1).search(nextPattern);
          if (nextMatch !== -1) {
            endIndex = match + 1 + nextMatch;
            break;
          }
        }
        let content = text.substring(match, endIndex).trim();
        content = content.replace(pattern, '').trim();
        content = content.replace(/^[:\-–—]\s*/, '').trim();
        sections[key] = content;
      }
    }
    setParsedSections(sections);
  };

  const addMoreSymptom = () => {
    if (!additionalSymptom.trim()) return;
    if (!selectedRelated.includes(additionalSymptom.trim())) {
      setSelectedRelated(prev => [...prev, additionalSymptom.trim()]);
    }
    setAdditionalSymptom("");
    setShowAddSymptom(false);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setFollowUpQuestions([]);
    setChatMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setChatLoading(true);
    try {
      const symptomContext = `SYMPTOM CHECK RESULTS CONTEXT:
Patient's symptoms: ${symptomText}${selectedRelated.length > 0 ? `, ${selectedRelated.join(", ")}` : ""}.
Duration: ${onset}. Severity: ${severity}.

FULL ANALYSIS ALREADY PROVIDED TO PATIENT:
${resultText}

The patient has already received the above analysis. Now they are asking follow-up questions about their specific symptoms, causes, and the analysis results. Answer DIRECTLY based on the symptoms and analysis above. Do NOT start a new triage interview. Do NOT ask what kind of symptoms they have - you already know. Give clear, helpful answers grounded in the analysis context above.`;
      const res = await fetch(api.ai.chat.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          context: symptomContext,
          userId: currentUser?.id || 0,
          isFirstMessage: chatMessages.length === 0,
          mode: "symptom-followup",
        }),
      });
      if (!res.ok) throw new Error("Chat failed");
      const data = await res.json();
      const responseText = data.response;
      setChatMessages(prev => [...prev, { role: "assistant", text: responseText }]);
      setFollowUpQuestions(data.followUpQuestions || []);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: "assistant", text: "Sorry, I couldn't process your question right now. Please try again." }]);
      setFollowUpQuestions([]);
    }
    setChatLoading(false);
  };


  const sendFollowUpQuestion = (question: string) => {
    setChatInput(question);
    setFollowUpQuestions([]);
    setTimeout(() => {
      setChatInput("");
      const fakeEvent = { role: "user" as const, text: question };
      setChatMessages(prev => [...prev, fakeEvent]);
      setChatLoading(true);
      fetch(api.ai.chat.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          context: `SYMPTOM CHECK RESULTS CONTEXT:\nPatient's symptoms: ${symptomText}${selectedRelated.length > 0 ? `, ${selectedRelated.join(", ")}` : ""}.\nDuration: ${onset}. Severity: ${severity}.\n\nFULL ANALYSIS ALREADY PROVIDED TO PATIENT:\n${resultText}\n\nThe patient has already received the above analysis. Now they are asking follow-up questions. Answer DIRECTLY. Do NOT start a new triage interview.`,
          userId: currentUser?.id || 0,
          isFirstMessage: false,
          mode: "symptom-followup",
        }),
      })
        .then(r => r.json())
        .then(data => {
          setChatMessages(prev => [...prev, { role: "assistant", text: data.response }]);
          setFollowUpQuestions(data.followUpQuestions || []);
        })
        .catch(() => {
          setChatMessages(prev => [...prev, { role: "assistant", text: "Sorry, I couldn't process your question right now." }]);
          setFollowUpQuestions([]);
        })
        .finally(() => setChatLoading(false));
    }, 0);
  };

  const isPromptInstruction = (line: string): boolean => {
    const instructionPatterns = [
      /^\*?\s*Give a clear YES\s*\/\s*NO\s*\/\s*MAYBE/i,
      /^\*?\s*Choose ONE\s*:/i,
      /^\*?\s*List probable causes/i,
      /^\*?\s*List red flag symptoms/i,
      /^\*?\s*Give immediate actionable steps/i,
      /^\*?\s*List foods,?\s*activities/i,
      /^\*?\s*Give specific dietary guidance/i,
      /^\*?\s*List common investigations/i,
      /^\*?\s*List urgent steps/i,
      /^\*?\s*If NO\s*[-—–]\s*say it confidently/i,
      /^\*?\s*If YES\s*[-—–]\s*say exactly why/i,
      /^\*?\s*Use non-alarming language/i,
      /^\*?\s*Be specific to the symptoms/i,
      /^\*?\s*Explain briefly/i,
      /^\*?\s*See a doctor today\s*\/\s*within/i,
      /^\*?\s*Based on the symptoms,?\s*recommend/i,
      /^\*?\s*Always start with General Physician/i,
      /^\d+\.\s*$/,
    ];
    return instructionPatterns.some(p => p.test(line));
  };

  const renderSectionContent = (content: string, sectionTitle?: string) => {
    if (!content) return <p className="text-slate-400 italic">No information available for this section.</p>;
    const lines = content.split('\n').filter(l => l.trim());
    const showDisclaimer = sectionTitle === "Can I take any medicine on my own?";
    return (
      <div className="space-y-2">
        {lines.map((line, i) => {
          let cleaned = line.replace(/^\s*[-*•]\s*/, '').replace(/\*\*/g, '').trim();
          if (!cleaned) return null;
          if (isPromptInstruction(cleaned)) return null;

          const boldMatch = cleaned.match(/^([^:]+):\s*(.*)/);
          if (boldMatch && boldMatch[1].length < 50) {
            return (
              <p key={i} className="text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-900">{boldMatch[1]}:</span> {boldMatch[2]}
              </p>
            );
          }
          return <p key={i} className="text-slate-700 leading-relaxed">{cleaned}</p>;
        })}
        {showDisclaimer && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm font-medium">
              ⚠️ Disclaimer: Do not self-medicate. Please consult a General Physician before taking any medication.
            </p>
          </div>
        )}
      </div>
    );
  };

  const currentTabSections = SECTION_MAP[activeTab] || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="px-4 py-3 flex items-center gap-3 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <button
          onClick={() => setLocation("/assistant")}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          data-testid="button-back-check"
        >
          <ArrowLeft className="w-5 h-5 text-teal-600" />
        </button>
        <div className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-teal-600" />
          <h1 className="font-bold text-lg text-slate-900" data-testid="text-check-title">Check</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {step === "symptom" && (
            <motion.div
              key="symptom"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-slate-900" data-testid="text-symptom-heading">What are you experiencing?</h2>
                <p className="text-slate-500 mt-1">Describe your symptoms in your own words</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Tell me what's bothering you</label>
                <textarea
                  value={symptomText}
                  onChange={(e) => setSymptomText(e.target.value)}
                  placeholder="I have fever since yesterday with body pain and headache..."
                  className="w-full p-4 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none h-32"
                  data-testid="input-symptom"
                />
              </div>

              <button
                onClick={fetchSuggestions}
                disabled={!symptomText.trim() || loadingSuggestions}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                data-testid="button-continue-symptom"
              >
                {loadingSuggestions ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Finding related symptoms...
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {savedSymptomChecks.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => setShowSavedChecks(!showSavedChecks)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                    data-testid="button-toggle-saved-checks"
                  >
                    <div className="flex items-center gap-2 text-slate-700">
                      <History className="w-5 h-5 text-teal-600" />
                      <span className="font-medium">Saved Symptom Checks</span>
                      <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold">{savedSymptomChecks.length}</span>
                    </div>
                    {showSavedChecks ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  <AnimatePresence>
                    {showSavedChecks && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 space-y-2">
                          {savedSymptomChecks.map((record: MedicalRecord) => {
                            const fc = record.fullConversation as any;
                            const recSeverity = fc?.severity || "";
                            const onset = fc?.onset || "";
                            const related = fc?.selectedRelated as string[] || [];
                            const date = record.createdAt ? new Date(record.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
                            const severityColor: Record<string, string> = {
                              mild: "bg-green-100 text-green-700",
                              moderate: "bg-yellow-100 text-yellow-700",
                              severe: "bg-orange-100 text-orange-700",
                              "very severe": "bg-red-100 text-red-700",
                            };
                            return (
                              <div
                                key={record.id}
                                className="flex items-stretch rounded-xl border border-slate-200 bg-white hover:border-teal-200 transition-all overflow-hidden"
                                data-testid={`saved-check-${record.id}`}
                              >
                                <button
                                  onClick={() => loadSavedCheck(record)}
                                  className="flex-1 text-left p-4 hover:bg-teal-50 transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <p className="text-sm font-semibold text-slate-800 line-clamp-2 flex-1">{record.symptom}</p>
                                    <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">{date}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {recSeverity && (
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColor[recSeverity] || "bg-slate-100 text-slate-600"}`}>
                                        {recSeverity.charAt(0).toUpperCase() + recSeverity.slice(1)}
                                      </span>
                                    )}
                                    {onset && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{onset}</span>
                                    )}
                                    {related.slice(0, 2).map((s, i) => (
                                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{s}</span>
                                    ))}
                                    {related.length > 2 && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">+{related.length - 2} more</span>
                                    )}
                                  </div>
                                </button>
                                <button
                                  onClick={(e) => handleDeleteCheck(e, record)}
                                  disabled={deleteRecord.isPending}
                                  className="flex items-center justify-center w-12 flex-shrink-0 border-l border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                  data-testid={`button-delete-check-${record.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {step === "related" && (
            <motion.div
              key="related"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-slate-900" data-testid="text-related-heading">Common symptoms</h2>
                <p className="text-slate-500 mt-1">Select any additional symptoms you're also experiencing</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {suggestedSymptoms.map((sym) => (
                  <button
                    key={sym}
                    onClick={() => toggleRelatedSymptom(sym)}
                    className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      selectedRelated.includes(sym)
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                    data-testid={`button-symptom-${sym.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {sym}
                  </button>
                ))}
                {selectedRelated.filter(s => !suggestedSymptoms.includes(s)).map((sym) => (
                  <button
                    key={sym}
                    onClick={() => toggleRelatedSymptom(sym)}
                    className="px-4 py-3 rounded-xl border-2 text-sm font-medium border-teal-500 bg-teal-50 text-teal-700 transition-all"
                    data-testid={`button-symptom-custom-${sym.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {sym}
                  </button>
                ))}
              </div>

              {showAddSymptom ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={additionalSymptom}
                    onChange={(e) => setAdditionalSymptom(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addMoreSymptom()}
                    placeholder="Type your symptom..."
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    data-testid="input-add-symptom"
                    autoFocus
                  />
                  <button
                    onClick={addMoreSymptom}
                    disabled={!additionalSymptom.trim()}
                    className="px-4 py-3 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
                    data-testid="button-confirm-add-symptom"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddSymptom(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-teal-400 hover:text-teal-600 transition-colors text-sm"
                  data-testid="button-add-symptom"
                >
                  <Plus className="w-4 h-4" />
                  Add more symptoms
                </button>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("symptom")}
                  className="flex-1 py-3 px-6 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                  data-testid="button-back-related"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep("onset")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors"
                  data-testid="button-continue-related"
                >
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === "onset" && (
            <motion.div
              key="onset"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-slate-900" data-testid="text-onset-heading">When did this start?</h2>
                <p className="text-slate-500 mt-1">Select when you first noticed the symptoms</p>
              </div>

              <div className="space-y-3">
                {ONSET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setOnset(opt.value)}
                    className={`w-full px-5 py-4 rounded-xl border-2 text-left font-medium transition-all ${
                      onset === opt.value
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                    data-testid={`button-onset-${opt.value.replace(/\s+/g, '-')}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("related")}
                  className="flex-1 py-3 px-6 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                  data-testid="button-back-onset"
                >
                  Back
                </button>
                <button
                  onClick={() => onset && setStep("severity")}
                  disabled={!onset}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  data-testid="button-continue-onset"
                >
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === "severity" && (
            <motion.div
              key="severity"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-slate-900" data-testid="text-severity-heading">How severe is it?</h2>
                <p className="text-slate-500 mt-1">Rate the intensity of your symptoms</p>
              </div>

              <div className="space-y-3">
                {SEVERITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSeverity(opt.value)}
                    className={`w-full px-5 py-4 rounded-xl border-2 text-left transition-all ${
                      severity === opt.value
                        ? "border-teal-500 bg-teal-50"
                        : `border-slate-200 bg-white hover:border-slate-300`
                    }`}
                    data-testid={`button-severity-${opt.value.replace(/\s+/g, '-')}`}
                  >
                    <span className={`font-semibold ${severity === opt.value ? "text-teal-700" : "text-slate-700"}`}>{opt.label}</span>
                    <p className={`text-sm mt-0.5 ${severity === opt.value ? "text-teal-600" : "text-slate-400"}`}>{opt.description}</p>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("onset")}
                  className="flex-1 py-3 px-6 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                  data-testid="button-back-severity"
                >
                  Back
                </button>
                <button
                  onClick={submitCheck}
                  disabled={!severity}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  data-testid="button-submit-check"
                >
                  Get Results
                  <Stethoscope className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 space-y-6"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center">
                  <Stethoscope className="w-10 h-10 text-teal-600 animate-pulse" />
                </div>
                <Loader2 className="w-24 h-24 text-teal-400 animate-spin absolute -top-2 -left-2" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-800">Analyzing your symptoms...</h3>
                <p className="text-slate-500 mt-1">This may take a moment</p>
              </div>
            </motion.div>
          )}

          {step === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                <p className="text-sm text-teal-600 font-medium">Based on what you've shared:</p>
                <p className="text-teal-800 mt-1">
                  {symptomText}
                  {selectedRelated.length > 0 && `, ${selectedRelated.join(", ")}`}
                  {" "}for {onset}
                  {" "}({severity})
                </p>
              </div>

              {parsedSections["To which doctor should I refer?"] && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{SECTION_EMOJIS["To which doctor should I refer?"]}</span>
                    {SECTION_ICONS["To which doctor should I refer?"]}
                    <h3 className="font-semibold text-slate-900 text-sm">To which doctor should I refer?</h3>
                  </div>
                  {renderSectionContent(parsedSections["To which doctor should I refer?"])}
                </div>
              )}

              <div className="flex gap-1 overflow-x-auto pb-2 border-b border-slate-200">
                {RESULT_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors ${
                      activeTab === tab.id
                        ? "text-teal-700 border-b-2 border-teal-600 bg-teal-50"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                    data-testid={`tab-${tab.id}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "chat" ? (
                <div className="space-y-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm min-h-[300px] max-h-[400px] overflow-y-auto">
                    {chatMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <MessageCircle className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">Chat about your symptoms</p>
                        <p className="text-slate-400 text-sm mt-1">Ask follow-up questions about your current symptoms</p>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-teal-600 text-white rounded-br-md"
                            : "bg-slate-100 text-slate-800 rounded-bl-md"
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start mb-3">
                        <div className="bg-slate-100 px-4 py-2.5 rounded-2xl rounded-bl-md">
                          <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                        </div>
                      </div>
                    )}
                    {!chatLoading && followUpQuestions.length > 0 && chatMessages.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-medium text-slate-400 px-1">Follow-ups</p>
                        {followUpQuestions.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => sendFollowUpQuestion(q)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-left transition-colors"
                            data-testid={`button-followup-${i}`}
                          >
                            <span className="flex-1 text-sm text-slate-600">{q}</span>
                            <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                      placeholder="Ask about your symptoms..."
                      className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      data-testid="input-chat"
                      disabled={chatLoading}
                    />
                    <button
                      onClick={sendChatMessage}
                      disabled={!chatInput.trim() || chatLoading}
                      className="px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors"
                      data-testid="button-send-chat"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentTabSections.map((sectionTitle) => {
                    const content = parsedSections[sectionTitle];
                    return (
                      <div key={sectionTitle} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">{SECTION_EMOJIS[sectionTitle]}</span>
                          {SECTION_ICONS[sectionTitle]}
                          <h3 className="font-semibold text-slate-900 text-sm">{sectionTitle}</h3>
                        </div>
                        {renderSectionContent(content || "", sectionTitle)}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 space-y-3">
                {!showForgottenSymptom ? (
                  <button
                    onClick={() => { setShowForgottenSymptom(true); fetchForgottenSuggestions(); }}
                    className="w-full py-3 px-6 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors"
                    data-testid="button-add-forgotten"
                  >
                    Add Forgotten Symptom
                  </button>
                ) : (
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-medium text-teal-800">Add a symptom you forgot to mention</p>
                    <input
                      type="text"
                      value={forgottenSymptom}
                      onChange={(e) => setForgottenSymptom(e.target.value)}
                      placeholder="e.g. mild headache, nausea..."
                      className="w-full px-4 py-2.5 border border-teal-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                      data-testid="input-forgotten-symptom"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") reanalyzeWithForgottenSymptom(); }}
                    />
                    {(loadingForgottenSuggestions || forgottenSuggestionsFetched) && (
                      <div className="space-y-2">
                        <p className="text-xs text-teal-600 font-medium">Related symptoms you might have</p>
                        {loadingForgottenSuggestions ? (
                          <div className="flex items-center gap-2 text-teal-500 text-sm">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Finding related symptoms...</span>
                          </div>
                        ) : forgottenSuggestions.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {forgottenSuggestions.map((sug) => {
                              const isSelected = selectedForgottenSuggestions.includes(sug);
                              return (
                                <button
                                  key={sug}
                                  onClick={() => selectForgottenSuggestion(sug)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    isSelected
                                      ? "bg-teal-600 text-white"
                                      : "bg-white border border-teal-200 text-teal-700"
                                  }`}
                                  data-testid={`button-forgotten-suggestion-${sug.toLowerCase().replace(/\s+/g, '-')}`}
                                >
                                  {isSelected && <Check className="w-3 h-3" />}
                                  {sug}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">No additional related symptoms found. Type your own above.</p>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowForgottenSymptom(false); setForgottenSymptom(""); setSelectedForgottenSuggestions([]); setForgottenSuggestions([]); setForgottenSuggestionsFetched(false); }}
                        className="flex-1 py-2 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-white text-sm transition-colors"
                        data-testid="button-cancel-forgotten"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={reanalyzeWithForgottenSymptom}
                        disabled={(!forgottenSymptom.trim() && selectedForgottenSuggestions.length === 0) || reanalyzing}
                        className="flex-1 py-2 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 disabled:opacity-50 text-sm transition-colors"
                        data-testid="button-reanalyze"
                      >
                        {reanalyzing ? "Re-analyzing..." : `Re-analyze${selectedForgottenSuggestions.length + (forgottenSymptom.trim() ? 1 : 0) > 1 ? ` (${selectedForgottenSuggestions.length + (forgottenSymptom.trim() ? 1 : 0)})` : ""}`}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setStep("symptom");
                    setSymptomText("");
                    setSuggestedSymptoms([]);
                    setSelectedRelated([]);
                    setOnset("");
                    setSeverity("");
                    setResultText("");
                    setParsedSections({});
                    setActiveTab("overview");
                    setChatMessages([]);
                    setChatInput("");
                    setShowAddSymptom(false);
                    setAdditionalSymptom("");
                    setShowForgottenSymptom(false);
                    setForgottenSymptom("");
                    setShowSavedChecks(true);
                  }}
                  className="w-full py-3 px-6 border-2 border-teal-200 text-teal-700 font-semibold rounded-xl hover:bg-teal-50 transition-colors"
                  data-testid="button-check-again"
                >
                  Check Another Symptom
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-6 sm:pb-0"
            onClick={() => { setDeleteTarget(null); setDeleteReason(null); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-xl"
            >
              {deleteReason === "moderate_urgency" ? (
                <>
                  <div className="bg-yellow-50 px-6 pt-6 pb-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                        <TriangleAlert className="w-5 h-5 text-yellow-500" />
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                        Heads-up Before You Delete
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-600">Reminder:</span>
                        <span className="text-xs font-bold text-yellow-800 bg-yellow-200 px-2.5 py-0.5 rounded-full">
                          Doctor visit recommended soon
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-5">
                    <p className="text-sm font-medium text-slate-700 leading-relaxed mb-5">
                      The analysis suggests scheduling a doctor visit within the next few days. Deleting this will remove that reminder. Are you sure?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setDeleteTarget(null); setDeleteReason(null); }}
                        className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
                        data-testid="button-cancel-delete"
                      >
                        Keep it
                      </button>
                      <button
                        onClick={confirmDelete}
                        className="flex-1 py-2.5 rounded-xl bg-yellow-500 text-white font-bold text-sm hover:bg-yellow-600 transition-colors"
                        data-testid="button-confirm-delete"
                      >
                        Yes, Delete
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-red-50 px-6 pt-6 pb-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <TriangleAlert className="w-5 h-5 text-red-600" />
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                        {deleteReason === "urgency" ? "Urgent Care Warning" : "High Severity Warning"}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {(deleteReason === "severity" || deleteReason === "both") && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-600">Severity:</span>
                          <span className="text-xs font-bold text-white bg-red-500 px-2.5 py-0.5 rounded-full capitalize">
                            {(deleteTarget.fullConversation as any)?.severity}
                          </span>
                        </div>
                      )}
                      {(deleteReason === "urgency" || deleteReason === "both") && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-600">Urgency:</span>
                          <span className="text-xs font-bold text-white bg-orange-500 px-2.5 py-0.5 rounded-full">
                            Needs prompt attention
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-6 py-5">
                    <p className="text-sm font-medium text-slate-700 leading-relaxed mb-5">
                      {deleteReason === "urgency"
                        ? "The analysis for this check suggests seeing a doctor very soon. Deleting it means you'll permanently lose this advice. Are you sure?"
                        : deleteReason === "both"
                        ? "This check has a high severity level and the analysis recommends prompt medical attention. Deleting it means you'll permanently lose this record. Are you sure?"
                        : "This check is marked as high severity. Deleting it means you'll permanently lose this analysis. Are you sure?"}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setDeleteTarget(null); setDeleteReason(null); }}
                        className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
                        data-testid="button-cancel-delete"
                      >
                        Keep it
                      </button>
                      <button
                        onClick={confirmDelete}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors"
                        data-testid="button-confirm-delete"
                      >
                        Yes, Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
