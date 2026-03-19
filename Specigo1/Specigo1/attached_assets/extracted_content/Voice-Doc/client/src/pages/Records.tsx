import { useParams, Link } from "wouter";
import { useMedicalRecords } from "@/hooks/use-medical";
import { Loader2, ArrowLeft, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function Records() {
  const { userId } = useParams();
  const { data: records, isLoading } = useMedicalRecords(userId ? parseInt(userId) : undefined);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center gap-4">
          <Link href="/assistant" className="p-2 hover:bg-white rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-display text-slate-900">Medical Records</h1>
            <p className="text-slate-500">History for Patient ID: {userId}</p>
          </div>
        </header>

        <div className="grid gap-4">
          {records?.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-slate-500">No records found for this patient.</p>
            </div>
          ) : (
            records?.map((record, i) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar className="w-4 h-4" />
                    {record.createdAt && format(new Date(record.createdAt), "PPP p")}
                  </div>
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                    Consultation
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Symptom</h3>
                    <p className="text-lg text-slate-900 font-medium">{record.symptom}</p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary"></span>
                      AI Diagnosis
                    </h3>
                    <p className="text-slate-700 leading-relaxed">{record.diagnosis}</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Icon component needed for empty state
function FileText({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
      <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
      <path d="M10 9H8"/>
      <path d="M16 13H8"/>
      <path d="M16 17H8"/>
    </svg>
  );
}
