import { Link } from "wouter";
import { useUserById, useUpdateUser } from "@/hooks/use-users";
import { Loader2, ArrowLeft, User, Phone, Calendar, Droplet, Ruler, Weight, Activity, Edit2, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { toast } = useToast();
  
  const getStoredUser = () => {
    const stored = localStorage.getItem("med_user");
    return stored ? JSON.parse(stored) : null;
  };

  const [storedUser] = useState(getStoredUser());
  const { data: user, isLoading } = useUserById(storedUser?.id ?? null);
  const updateUser = useUpdateUser();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleEdit = (field: string, value: any) => {
    setEditingField(field);
    setEditValue(value?.toString() || "");
  };

  const handleSave = async (field: string) => {
    if (!user) return;
    
    try {
      const updates: any = {};
      if (field === 'age') {
        updates[field] = parseInt(editValue) || 0;
      } else {
        updates[field] = editValue;
      }

      await updateUser.mutateAsync({
        id: user.id,
        updates,
        phoneNumber: user.phoneNumber
      });

      toast({
        title: "Profile updated",
        description: `${field.charAt(0).toUpperCase() + field.slice(1)} has been updated.`,
      });
      setEditingField(null);
    } catch (error) {
      toast({
        title: "Update failed",
        description: "There was an error updating your profile.",
        variant: "destructive",
      });
    }
  };

  const detailItems = user ? [
    { id: "phoneNumber", label: "Phone Number", value: user.phoneNumber, icon: Phone, editable: false },
    { id: "name", label: "Name", value: user.name || "Not set", icon: User, editable: true },
    { id: "age", label: "Age", value: user.age ? `${user.age} years` : "Not set", icon: Calendar, editable: true },
    { id: "gender", label: "Gender", value: user.gender || "Not set", icon: User, editable: true },
    { id: "bloodGroup", label: "Blood Group", value: user.bloodGroup || "Not set", icon: Droplet, editable: true },
    { id: "height", label: "Height", value: user.height || "Not set", icon: Ruler, editable: true },
    { id: "weight", label: "Weight", value: user.weight || "Not set", icon: Weight, editable: true },
    { id: "place", label: "Place", value: user.place || "Not set", icon: Activity, editable: true },
    { id: "occupation", label: "Occupation", value: user.occupation || "Not set", icon: Activity, editable: true },
    { id: "qualification", label: "Qualification", value: user.qualification || "Not set", icon: Activity, editable: true },
    { id: "medicalHistory", label: "Medical History", value: user.medicalHistory || "No significant history", icon: Activity, editable: true },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 flex items-center gap-4">
          <Link href="/assistant" className="p-2 hover:bg-white rounded-full transition-colors" data-testid="link-back">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-display text-slate-900">Personal Details</h1>
            <p className="text-slate-500">Your profile information</p>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
              <User className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{user?.name || "Patient"}</h2>
          </div>

          <div className="grid gap-4">
            {detailItems.map((item) => (
              <div key={item.id} className="group relative flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-50 transition-all hover:bg-slate-50" data-testid={`detail-${item.id}`}>
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                  <item.icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                  
                  {editingField === item.id ? (
                    <div className="flex gap-2 items-center mt-1">
                      {item.id === "gender" || item.id === "bloodGroup" ? (
                        <select
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-8 py-0 px-2 border rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary"
                          autoFocus
                          data-testid={`select-edit-${item.id}`}
                        >
                          <option value="">Select {item.label}</option>
                          {item.id === "gender" ? (
                            <>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </>
                          ) : (
                            <>
                              <option value="A+">A+</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="B-">B-</option>
                              <option value="O+">O+</option>
                              <option value="O-">O-</option>
                              <option value="AB+">AB+</option>
                              <option value="AB-">AB-</option>
                            </>
                          )}
                        </select>
                      ) : (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-8 py-0 px-2"
                          autoFocus
                          data-testid={`input-edit-${item.id}`}
                        />
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleSave(item.id)} data-testid={`button-save-${item.id}`}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setEditingField(null)} data-testid={`button-cancel-${item.id}`}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-slate-900 font-medium">
                      {item.id === 'age' && user?.[item.id] ? `${user[item.id]} years` : String(user?.[item.id as keyof typeof user] || "Not set")}
                    </p>
                  )}
                </div>

                {item.editable && editingField !== item.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    onClick={() => handleEdit(item.id, user?.[item.id as keyof typeof user])}
                    data-testid={`button-edit-${item.id}`}
                  >
                    <Edit2 className="w-4 h-4 text-slate-400" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
