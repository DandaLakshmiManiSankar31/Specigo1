import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useUser, useUpdateUser } from "@/hooks/use-users";
import { useAiChat, useCreateRecord } from "@/hooks/use-medical";
import { useSpeech } from "@/hooks/use-speech";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Waveform } from "@/components/Waveform";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, User, Activity, LogOut, ChevronRight, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User as UserType } from "@shared/schema";

// Helper to get user from local storage
const getStoredUser = () => {
  const stored = localStorage.getItem("med_user");
  return stored ? JSON.parse(stored) as UserType : null;
};

// Onboarding Steps
const STEPS = ["name", "age", "bloodGroup", "height", "weight"] as const;
type Step = typeof STEPS[number];

export default function Assistant() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State
  const [currentUser, setCurrentUser] = useState<UserType | null>(getStoredUser());
  const [onboardingStep, setOnboardingStep] = useState<Step | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Hooks
  const { data: refreshedUser } = useUser(currentUser?.phoneNumber ?? null);
  const updateUser = useUpdateUser();
  const aiChat = useAiChat();
  const createRecord = useCreateRecord();
  
  // Voice Hook
  const { 
    transcript, 
    listening, 
    startListening, 
    stopListening, 
    resetTranscript, 
    speak, 
    isSpeaking,
    browserSupportsSpeechRecognition 
  } = useSpeech();

  // Scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update local user when refreshed from API
  useEffect(() => {
    if (refreshedUser) {
      setCurrentUser(refreshedUser);
      localStorage.setItem("med_user", JSON.stringify(refreshedUser));
    }
  }, [refreshedUser]);

  // Check Onboarding Status
  useEffect(() => {
    if (!currentUser) {
      setLocation("/");
      return;
    }

    if (!currentUser.name) {
      setOnboardingStep("name");
      speak("Welcome. I need to set up your profile first. What is your full name?");
    } else if (!currentUser.age) {
      setOnboardingStep("age");
      speak(`Nice to meet you ${currentUser.name}. How old are you?`);
    } else if (!currentUser.bloodGroup) {
      setOnboardingStep("bloodGroup");
      speak("What is your blood group?");
    } else if (!currentUser.height) {
      setOnboardingStep("height");
      speak("What is your height?");
    } else if (!currentUser.weight) {
      setOnboardingStep("weight");
      speak("Finally, what is your weight?");
    } else {
      setOnboardingStep(null);
      // Only welcome if we haven't started chatting yet
      if (messages.length === 0) {
        const welcome = `Hello ${currentUser.name}. I'm ready to help. How are you feeling today?`;
        speak(welcome);
        setMessages([{ role: 'assistant', text: welcome }]);
      }
    }
  }, [currentUser, speak, setLocation, messages.length]);

  // Handle Transcript Updates
  useEffect(() => {
    if (transcript && !listening) {
      // Small delay to ensure user finished speaking
      const timeout = setTimeout(() => {
        handleInputSubmit(transcript);
        resetTranscript();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [transcript, listening]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-start listening when assistant finishes speaking
  useEffect(() => {
    // Only auto-listen after assistant message in normal chat (not onboarding)
    if (onboardingStep || isProcessing) return;
    
    if (messages.length > 0 && !listening && !isSpeaking) {
      const lastMessage = messages[messages.length - 1];
      // Auto-start listening after assistant speaks
      if (lastMessage.role === 'assistant') {
        const timeout = setTimeout(() => {
          startListening();
        }, 500);
        return () => clearTimeout(timeout);
      }
    }
  }, [messages, isSpeaking, listening, onboardingStep, isProcessing, startListening]);

  const handleInputSubmit = async (text: string) => {
    if (!text.trim() || !currentUser) return;
    setInputValue("");
    setIsProcessing(true);

    // --- ONBOARDING LOGIC ---
    if (onboardingStep) {
      // Add user message to UI temporarily for feedback (optional) or just process it
      
      const updates: any = {};
      
      if (onboardingStep === "name") updates.name = text;
      else if (onboardingStep === "age") updates.age = parseInt(text.replace(/\D/g, '')) || 0;
      else if (onboardingStep === "bloodGroup") updates.bloodGroup = text;
      else if (onboardingStep === "height") updates.height = text;
      else if (onboardingStep === "weight") updates.weight = text;

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
    // 1. Add User Message
    const newMessages = [...messages, { role: 'user' as const, text }];
    setMessages(newMessages);

    // 2. Send to AI
    try {
      const context = `User Profile: Name ${currentUser.name}, Age ${currentUser.age}, Blood ${currentUser.bloodGroup}, History: ${currentUser.medicalHistory || 'None'}`;
      
      const { response } = await aiChat.mutateAsync({ 
        message: text, 
        context,
        userId: currentUser.id
      });

      // 3. Add AI Response
      setMessages([...newMessages, { role: 'assistant', text: response }]);
      speak(response);

      // 4. Save Record (fire and forget)
      createRecord.mutate({
        userId: currentUser.id,
        symptom: text,
        diagnosis: response,
        fullConversation: newMessages
      });

    } catch (error) {
      const errText = "I'm having trouble connecting to the medical database right now.";
      setMessages([...newMessages, { role: 'assistant', text: errText }]);
      speak(errText);
    } finally {
      setIsProcessing(false);
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

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col overflow-hidden">
      {/* Mobile Header */}
      <header className="relative z-10 px-4 py-3 flex items-center justify-between bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Activity className="w-4 h-4" />
          </div>
          <h1 className="font-bold text-base text-slate-900">MedVoice</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" data-testid="button-logout">
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col max-w-3xl mx-auto w-full">
        
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
                    {onboardingStep === "bloodGroup" && "What is your blood group?"}
                    {onboardingStep === "height" && "What is your height?"}
                    {onboardingStep === "weight" && "What is your weight?"}
                  </p>
                </div>
                
                {/* Manual Input Fallback */}
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Area - Mobile Optimized */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 scrollbar-hide pb-40">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] p-3 sm:p-4 rounded-lg text-sm sm:text-base leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-500 text-white rounded-br-none' 
                    : 'bg-slate-100 text-slate-900 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-slate-100 px-3 py-2 sm:px-4 sm:py-3 rounded-lg rounded-bl-none flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Voice Controls - Mobile Footer */}
        <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-slate-50 via-slate-50 to-transparent p-4 sm:p-6 z-20">
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            <Waveform active={listening} />
            
            {!browserSupportsSpeechRecognition ? (
              <p className="text-destructive text-center text-sm bg-white p-3 rounded-lg border border-destructive/20 w-full">
                Browser does not support voice. Use Chrome or Edge.
              </p>
            ) : (
              <>
                <button
                  onClick={toggleListening}
                  className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl flex-shrink-0 ${
                    listening 
                      ? 'bg-red-500 text-white scale-110 shadow-red-500/40' 
                      : 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-500/40 active:scale-95'
                  }`}
                  data-testid="button-mic-toggle"
                >
                  {listening && <div className="absolute inset-0 rounded-full animate-pulse border-4 border-red-500 opacity-50" />}
                  {listening ? <MicOff className="w-10 h-10 sm:w-12 sm:h-12" /> : <Mic className="w-10 h-10 sm:w-12 sm:h-12" />}
                </button>
                
                <p className="text-xs sm:text-sm text-slate-600 font-medium text-center">
                  {listening ? "🎤 Listening..." : "Tap to speak"}
                </p>
              </>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
