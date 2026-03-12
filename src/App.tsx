import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route,Navigate  } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SyncStatus } from "./components/SyncStatus";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Observation from "./pages/Observation";
import { useEffect } from "react";

import { syncOperations } from "./offline/sync";
import { syncMediaUploads } from "./offline/syncMedia";
import { syncNarTrans } from "./offline/syncNarTrans";
import { syncAI } from "./offline/syncAI";

import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import ObservationDetail from "./pages/ObservationDetail";


import Audiotranscribepage from './pages/Audiotranscribepage';
import Transcriberesultpage from './pages/Transcriberesultpage_v1';


const queryClient = new QueryClient();




// ─── Protected Route Guard ───────────────────────────────────────────────────
// Redirects to "/" (Login) if no access_token is found in localStorage.
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};
// ─────────────────────────────────────────────────────────────────────────────
const App = () => (
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const runSync = async () => {
    // 1️⃣ First: must finish
    await syncOperations(token);
    // 2️⃣ Run these two in parallel
    // console.log("Narrative trnaslation started")
      await syncNarTrans(token);
      await syncMediaUploads(token);


    // 3️⃣ Run last
    console.log("🔥 Starting syncAI");

    await syncAI(token);
  };

  runSync();

  window.addEventListener("online", runSync);

  return () => {
    window.removeEventListener("online", runSync);
  };
}, []),
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ThemeToggle />
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Index />} />

                      {/* ── Protected routes (login required) ── */}

          <Route path="/observation" element={
                <ProtectedRoute>
                  <Observation />
                </ProtectedRoute>
              } />
          <Route path="/dashboard" element={  <ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/observation/:id" element={<ObservationDetail />} />
        // Inside your routes:
<Route path="/transcribe" element={<Audiotranscribepage />} />
<Route path="/transcribe/result" element={<Transcriberesultpage />} />
        
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
         
        </Routes>
        
      {/* 🔔 Global sync status (renders on all pages) */}
      <SyncStatus />
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
