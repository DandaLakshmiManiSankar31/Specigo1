import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useUserById, useUpdateUser } from "@/hooks/use-users";
import { Loader2, ArrowLeft, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import MedicalHistoryForm from "@/components/MedicalHistoryForm";
import type { PatientMedicalHistory } from "@shared/schema";

export default function MedicalHistory() {
  const { toast } = useToast();
  const { userId } = useParams();
  const [, setLocation] = useLocation();
  
  const getStoredUser = () => {
    const stored = localStorage.getItem("med_user");
    return stored ? JSON.parse(stored) : null;
  };

  const [storedUser] = useState(getStoredUser());
  const targetUserId = userId ? parseInt(userId) : storedUser?.id;
  const { data: user, isLoading } = useUserById(targetUserId ?? null);
  const updateUser = useUpdateUser();
  const [isSaving, setIsSaving] = useState(false);
  
  const isValidUser = !isLoading && user && targetUserId;
  
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/");
    }
  }, [isLoading, user, setLocation]);

  const handleSave = async (data: PatientMedicalHistory) => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateUser.mutateAsync({
        id: user.id,
        updates: { patientMedicalHistory: data },
        phoneNumber: user.phoneNumber
      });
      toast({
        title: "Medical history saved",
        description: "Your comprehensive medical history has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "There was an error saving your medical history.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !isValidUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 flex items-center gap-4">
          <Link href="/assistant" className="p-2 hover:bg-white rounded-full transition-colors" data-testid="link-back">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Patient Medical History</h1>
              <p className="text-slate-500">Comprehensive health profile for {user?.name || "Patient"}</p>
            </div>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <MedicalHistoryForm
            initialData={(user?.patientMedicalHistory as PatientMedicalHistory) || {}}
            onSave={handleSave}
            isSaving={isSaving}
            user={user}
          />
        </motion.div>
      </div>
    </div>
  );
}
