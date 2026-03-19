import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "@/pages/Login";
import Assistant from "@/pages/Assistant";
import Records from "@/pages/Records";
import Profile from "@/pages/Profile";
import MedicalReports from "@/pages/MedicalReports";
import MedicalHistory from "@/pages/MedicalHistory";
import SymptomCheck from "@/pages/SymptomCheck";
import DietPlanner from "@/pages/DietPlanner";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/assistant" component={Assistant} />
      <Route path="/records/:userId" component={Records} />
      <Route path="/profile/:userId" component={Profile} />
      <Route path="/reports/:userId" component={MedicalReports} />
      <Route path="/medical-history/:userId" component={MedicalHistory} />
      <Route path="/symptom-check" component={SymptomCheck} />
      <Route path="/diet-planner" component={DietPlanner} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
