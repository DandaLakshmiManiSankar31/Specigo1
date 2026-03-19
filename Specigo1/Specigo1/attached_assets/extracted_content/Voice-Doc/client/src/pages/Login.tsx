import { useState } from "react";
import { useLocation } from "wouter";
import { useLoginUser } from "@/hooks/use-users";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { motion } from "framer-motion";
import { Stethoscope, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [, setLocation] = useLocation();
  const { mutate, isPending } = useLoginUser();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 3) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid number to continue.",
        variant: "destructive",
      });
      return;
    }

    mutate(phoneNumber, {
      onSuccess: (user) => {
        // Save user to local storage for persistence across reloads in this simple MVP
        localStorage.setItem("med_user", JSON.stringify(user));
        toast({
          title: "Welcome back",
          description: "Logged in successfully.",
        });
        setLocation("/assistant");
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Could not log in. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-primary/5 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-primary/10 border border-white p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary">
              <Stethoscope className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 font-display">MedVoice</h1>
            <p className="text-slate-500 mt-2">Your AI Medical Assistant</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="Phone Number"
              placeholder="+1 (555) 000-0000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="font-mono text-lg tracking-wide"
              autoFocus
            />

            <Button 
              type="submit" 
              className="w-full group" 
              isLoading={isPending}
            >
              <span>Continue</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Secure • Private • AI-Powered
          </p>
        </div>
      </motion.div>
    </div>
  );
}
