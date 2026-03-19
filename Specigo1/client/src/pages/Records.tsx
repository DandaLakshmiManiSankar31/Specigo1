import { useParams, Link } from "wouter";
import { useMedicalRecords, useDeleteRecord, useDeleteRecordsByDate } from "@/hooks/use-medical";
import { Loader2, ArrowLeft, Calendar, ChevronRight, MessageSquare, Trash2 } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Records() {
  const { userId } = useParams();
  const { toast } = useToast();
  const { data: records, isLoading } = useMedicalRecords(userId ? parseInt(userId) : undefined);
  const deleteRecord = useDeleteRecord();
  const deleteRecordsByDate = useDeleteRecordsByDate();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this medical record?")) return;
    
    try {
      await deleteRecord.mutateAsync(id);
      toast({
        title: "Record deleted",
        description: "The medical consultation record has been removed.",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "There was an error deleting the record.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDateGroup = async (date: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete all records for ${format(new Date(date), "MMMM d, yyyy")}? This cannot be undone.`)) return;
    
    try {
      if (!userId) return;
      await deleteRecordsByDate.mutateAsync({ userId: parseInt(userId), date });
      setSelectedDate(null);
      toast({
        title: "Date history deleted",
        description: `All records for ${format(new Date(date), "MMMM d, yyyy")} have been removed.`,
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "There was an error deleting the date history.",
        variant: "destructive",
      });
    }
  };

  // Only show AI conversational records (not symptom checks)
  const conversationRecords = records?.filter(
    (r) => Array.isArray(r.fullConversation)
  );

  // Group records by date
  const groupedRecords = conversationRecords?.reduce((groups: Record<string, any[]>, record) => {
    const date = format(new Date(record.createdAt || ""), "yyyy-MM-dd");
    if (!groups[date]) groups[date] = [];
    groups[date].push(record);
    return groups;
  }, {});

  const dates = groupedRecords ? Object.keys(groupedRecords).sort((a, b) => b.localeCompare(a)) : [];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center gap-4">
          <Link href="/assistant" className="p-2 hover:bg-white rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-display text-slate-900">Medical History</h1>
            <p className="text-slate-500">Consultations grouped by date</p>
          </div>
        </header>

        <div className="grid gap-3">
          {!dates.length ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Calendar className="w-8 h-8" />
              </div>
              <p className="text-slate-500">No records found for this patient.</p>
            </div>
          ) : (
            dates.map((date) => (
              <motion.div
                key={date}
                layout
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
              >
                <div 
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setSelectedDate(selectedDate === date ? null : date)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {format(new Date(date), "MMMM d, yyyy")}
                      </h2>
                      <p className="text-sm text-slate-400">
                        {groupedRecords?.[date].length} consultation(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-slate-300 hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDeleteDateGroup(date, e)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                    <ChevronRight className={`w-6 h-6 text-slate-300 transition-transform duration-300 ${selectedDate === date ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                <AnimatePresence>
                  {selectedDate === date && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-50"
                    >
                      <div className="p-5 space-y-8 bg-slate-50/50">
                        {groupedRecords?.[date].map((record, idx) => (
                          <div key={record.id} className="space-y-4 relative group">
                            <div className="flex items-center gap-2">
                              <div className="h-px flex-1 bg-slate-200" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                                Session {idx + 1} • {format(new Date(record.createdAt || ""), "p")}
                              </span>
                              <div className="h-px flex-1 bg-slate-200" />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-300 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => handleDelete(record.id, e)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>

                            <div className="space-y-3">
                              {Array.isArray(record.fullConversation) ? (
                                (record.fullConversation as any[]).map((msg, i) => (
                                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
                                      msg.role === 'user'
                                        ? 'bg-primary text-white rounded-br-none'
                                        : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
                                    }`}>
                                      <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold mb-1 opacity-70">
                                          {msg.role === 'user' ? 'You' : 'SpeciGO'}
                                        </span>
                                        {msg.text}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (record.fullConversation as any)?.type === 'symptom_check' ? (
                                <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                                  <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                                    <span className="font-semibold">Symptom:</span> {record.symptom}
                                  </span>
                                  <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                                    <span className="font-semibold">Severity:</span> {(record.fullConversation as any).severity}
                                  </span>
                                  <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                                    <span className="font-semibold">Onset:</span> {(record.fullConversation as any).onset}
                                  </span>
                                  {((record.fullConversation as any).selectedRelated || []).map((s: string) => (
                                    <span key={s} className="bg-slate-100 px-2.5 py-1 rounded-full">{s}</span>
                                  ))}
                                </div>
                              ) : null}
                            </div>

                            {record.diagnosis && (
                              <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl mt-4">
                                <h3 className="text-[10px] font-bold text-primary uppercase mb-2 tracking-wider">Session Summary</h3>
                                <p className="text-sm text-slate-700 leading-relaxed">{record.diagnosis}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
