import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Send, Paperclip, Salad, User, X, Loader2,
  ChevronDown, ChevronUp, Utensils, FlaskConical
} from "lucide-react";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "@shared/routes";
import { buildPatientContext } from "@/lib/patient-context";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  macros?: { protein: number; carbs: number; fat: number };
}

interface LabParam {
  name: string;
  value: string;
  unit: string;
  range: string;
  status: "Normal" | "Low" | "High";
}

interface UploadedReport {
  name: string;
  text: string;
  params: LabParam[];
  paramSummary: string;
}

interface UserData {
  id: number;
  name?: string;
  age?: number;
  weight?: string;
  height?: string;
  gender?: string;
  bloodGroup?: string;
  medicalHistory?: string;
  patientMedicalHistory?: Record<string, unknown> | null;
}

const MEAL_ICONS: Record<string, string> = {
  "breakfast": "🌅",
  "mid-morning": "🍎",
  "lunch": "🍽️",
  "evening": "🌆",
  "dinner": "🌙",
  "foods to avoid": "⚠️",
  "why this plan": "💡",
};

const MACRO_COLORS = ["#14b8a6", "#f59e0b", "#6366f1"];

const STATUS_STYLE: Record<string, string> = {
  High: "bg-red-100 text-red-700 border border-red-200",
  Low: "bg-blue-100 text-blue-700 border border-blue-200",
  Normal: "bg-green-100 text-green-700 border border-green-200",
};

function parseMacros(text: string): { protein: number; carbs: number; fat: number } | null {
  const m = text.match(/\[MACROS:\s*Protein\s*(\d+)%,\s*Carbs\s*(\d+)%,\s*Fat\s*(\d+)%\]/i);
  if (!m) return null;
  return { protein: parseInt(m[1]), carbs: parseInt(m[2]), fat: parseInt(m[3]) };
}

function stripMacroTag(text: string): string {
  return text.replace(/\[MACROS:.*?\]/gi, "").trim();
}

function formatMessage(text: string) {
  const lines = text.split("\n");
  const elements: JSX.Element[] = [];
  let key = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { elements.push(<div key={key++} className="h-2" />); continue; }

    if (/^#{1,3}\s/.test(trimmed)) {
      const content = trimmed.replace(/^#{1,3}\s/, "");
      const lc = content.toLowerCase();
      const icon = Object.entries(MEAL_ICONS).find(([k]) => lc.includes(k))?.[1] ?? "";
      elements.push(
        <div key={key++} className="mt-3 mb-1 font-semibold text-teal-700 flex items-center gap-1">
          {icon && <span>{icon}</span>}
          <span>{content.replace(/^[🌅🍎🍽️🌆🌙⚠️💡]\s*/, "")}</span>
        </div>
      );
      continue;
    }
    if (/^\*\*(.+)\*\*/.test(trimmed)) {
      elements.push(<p key={key++} className="font-semibold text-slate-800">{trimmed.replace(/\*\*(.+)\*\*/, "$1")}</p>);
      continue;
    }
    if (/^[-•*]\s/.test(trimmed)) {
      elements.push(
        <li key={key++} className="ml-4 text-slate-700 list-disc text-sm leading-relaxed">
          {trimmed.replace(/^[-•*]\s/, "").replace(/\*\*(.+?)\*\*/g, "$1")}
        </li>
      );
      continue;
    }
    elements.push(
      <p key={key++} className="text-slate-700 text-sm leading-relaxed">
        {trimmed.replace(/\*\*(.+?)\*\*/g, "$1")}
      </p>
    );
  }
  return <div className="space-y-0.5">{elements}</div>;
}

function NutritionChart({ macros }: { macros: { protein: number; carbs: number; fat: number } }) {
  const data = [
    { name: "Protein", value: macros.protein },
    { name: "Carbs", value: macros.carbs },
    { name: "Fat", value: macros.fat },
  ];
  return (
    <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
        <Utensils className="w-3 h-3" /> Macro Breakdown
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
            {data.map((_, index) => (
              <Cell key={index} fill={MACRO_COLORS[index]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => `${v}%`} />
          <Legend iconType="circle" iconSize={8} formatter={(v, e) => `${v}: ${(e as any).payload.value}%`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function LabParamTable({ params }: { params: LabParam[] }) {
  const [expanded, setExpanded] = useState(true);
  if (params.length === 0) return null;

  const abnormal = params.filter(p => p.status !== "Normal");
  const normal = params.filter(p => p.status === "Normal");

  return (
    <div className="mx-4 mb-2 bg-white border border-amber-200 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-amber-50 hover:bg-amber-100 transition-colors"
        data-testid="button-toggle-lab-params"
      >
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-800">
            Lab Parameters — {params.length} extracted
          </span>
          {abnormal.length > 0 && (
            <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
              {abnormal.length} abnormal
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-amber-600" /> : <ChevronDown className="w-4 h-4 text-amber-600" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 py-2 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-100">
                    <th className="text-left py-1.5 pr-3 font-medium">Parameter</th>
                    <th className="text-right py-1.5 pr-3 font-medium">Value</th>
                    <th className="text-right py-1.5 pr-3 font-medium">Reference</th>
                    <th className="text-center py-1.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...abnormal, ...normal].map((p, i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0">
                      <td className="py-1.5 pr-3 text-slate-800 font-medium">{p.name}</td>
                      <td className="py-1.5 pr-3 text-right text-slate-700">{p.value}{p.unit ? ` ${p.unit}` : ""}</td>
                      <td className="py-1.5 pr-3 text-right text-slate-500">{p.range}</td>
                      <td className="py-1.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[p.status] || ""}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-slate-400 mt-2 italic">These values are used by the AI to personalise your diet plan.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const QUICK_PROMPTS = [
  "Give me a weight loss diet plan",
  "I want a muscle gain diet",
  "Diet for low hemoglobin",
  "Diabetic-friendly meal plan",
  "High blood pressure diet",
  "Diet for kidney health",
];

export default function DietPlanner() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedReport, setUploadedReport] = useState<UploadedReport | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showProfile, setShowProfile] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionStarted = useRef(false);

  const storedUser: UserData | null = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("med_user") || "null"); } catch { return null; }
  }, []);

  const { data: freshUser } = useQuery<UserData>({
    queryKey: ["/api/users/id", storedUser?.id],
    enabled: !!storedUser?.id,
  });

  const user: UserData | null = useMemo(() => {
    if (!storedUser) return null;
    return freshUser ? { ...storedUser, ...freshUser } : storedUser;
  }, [storedUser, freshUser]);

  const buildContext = () => {
    if (!user) return "";
    return buildPatientContext(user as any);
  };

  const buildReportContext = () => {
    if (!uploadedReport) return undefined;
    if (uploadedReport.params.length > 0) {
      return `Lab Report: ${uploadedReport.name}\n\nEXTRACTED LAB PARAMETERS (Deterministically Classified — DO NOT override these statuses):\n${uploadedReport.paramSummary}`;
    }
    return `Lab Report (${uploadedReport.name}):\n${uploadedReport.text}`;
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !user) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setIsLoading(true);

    try {
      const body = {
        message: text,
        context: buildContext(),
        reportContext: buildReportContext(),
        userId: user.id,
        mode: "diet-planner" as const,
        isFirstMessage: !sessionStarted.current,
      };
      sessionStarted.current = true;

      const res = await fetch(api.ai.chat.path, {
        method: api.ai.chat.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const rawReply: string = data.response || "";
      const macros = parseMacros(rawReply);
      const cleanReply = stripMacroTag(rawReply);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: cleanReply, macros: macros ?? undefined },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, I couldn't connect to the AI. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/diet/parse-pdf", { method: "POST", body: form, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      setUploadedReport({
        name: data.fileName || file.name,
        text: data.text || "",
        params: data.params || [],
        paramSummary: data.paramSummary || "",
      });
      // Reset session so the new report context is used
      sessionStarted.current = false;
    } catch (e: any) {
      alert(e?.message || "Failed to parse the uploaded file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeReport = () => {
    setUploadedReport(null);
    sessionStarted.current = false;
  };

  const profilePills = [
    { label: "Age", value: user?.age ? `${user.age} yrs` : null },
    { label: "Weight", value: user?.weight || null },
    { label: "Height", value: user?.height || null },
    { label: "Gender", value: user?.gender || null },
    { label: "Blood", value: user?.bloodGroup || null },
  ].filter((p) => p.value);

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
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button
          onClick={() => setLocation("/assistant")}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          data-testid="button-diet-back"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
            <Salad className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-900 text-sm">AI Diet Planner</h1>
            <p className="text-xs text-slate-500">Personalized • Medically Aware</p>
          </div>
        </div>
        <button
          onClick={() => setShowProfile(v => !v)}
          className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
          data-testid="button-toggle-profile"
        >
          {showProfile ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Profile strip */}
      <AnimatePresence>
        {showProfile && profilePills.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-teal-50 border-b border-teal-100 overflow-hidden"
          >
            <div className="px-4 py-2 flex items-center gap-2 flex-wrap">
              <User className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
              <span className="text-xs text-teal-700 font-medium">{user.name || "Patient"}</span>
              {profilePills.map((p) => (
                <span key={p.label} className="text-xs bg-white border border-teal-200 text-teal-700 px-2 py-0.5 rounded-full">
                  {p.label}: {p.value}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded report chip */}
      {uploadedReport && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs text-amber-700 font-medium truncate max-w-[200px]">{uploadedReport.name}</span>
            {uploadedReport.params.length > 0 ? (
              <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
                {uploadedReport.params.length} params extracted
              </span>
            ) : (
              <span className="text-xs text-amber-500">attached</span>
            )}
          </div>
          <button onClick={removeReport} className="text-amber-500 hover:text-amber-700" data-testid="button-remove-report">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pb-36">

        {/* Lab parameter table shown above chat */}
        {uploadedReport && uploadedReport.params.length > 0 && (
          <LabParamTable params={uploadedReport.params} />
        )}

        {messages.length === 0 && (
          <div className="text-center py-6 px-4">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Salad className="w-8 h-8 text-teal-600" />
            </div>
            <h2 className="font-semibold text-slate-800 mb-1">AI Diet Planner</h2>
            <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
              {uploadedReport && uploadedReport.params.length > 0
                ? `${uploadedReport.params.filter(p => p.status !== "Normal").length} abnormal values found. Tell me your health goal and I'll build a plan around them.`
                : "Tell me your health goal and I'll create a personalised meal plan."}
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-xs bg-white border border-teal-200 text-teal-700 px-3 py-2.5 rounded-xl hover:bg-teal-50 transition-colors leading-snug"
                  data-testid={`button-quick-${prompt.slice(0, 10)}`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex px-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1 mr-2">
                <Salad className="w-3.5 h-3.5 text-teal-600" />
              </div>
            )}
            <div className={`max-w-[85%] ${msg.role === "user" ? "max-w-[75%]" : ""}`}>
              <div
                className={`rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-teal-600 text-white text-sm"
                    : "bg-white border border-slate-200 shadow-sm"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="text-sm">{msg.text}</p>
                ) : (
                  formatMessage(msg.text)
                )}
              </div>
              {msg.role === "assistant" && msg.macros && (
                <NutritionChart macros={msg.macros} />
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start px-4">
            <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1 mr-2">
              <Salad className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
                <span className="text-sm">Building your personalised plan…</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white border-t border-slate-200 px-4 py-3 z-20">
        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 flex-shrink-0 transition-colors disabled:opacity-50"
            data-testid="button-upload-report"
            title="Upload lab report (PDF)"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
            }}
            placeholder={uploadedReport?.params.length ? "Ask for a diet plan based on your report…" : "e.g. 'Weight loss plan for me'"}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent max-h-28 overflow-y-auto"
            data-testid="input-diet-message"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-40 flex-shrink-0 transition-colors"
            data-testid="button-send-diet"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">
          AI-generated plans are for guidance only. Consult your doctor.
        </p>
      </div>
    </div>
  );
}
