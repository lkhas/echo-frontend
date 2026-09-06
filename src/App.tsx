import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SyncStatus } from "./components/SyncStatus";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Observation from "./pages/Observation";
import { useEffect } from "react";

import { runFullSync } from "@/offline/syncmanage";

import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import ObservationDetail from "./pages/ObservationDetail";

// import Audiotranscribepage from './pages/Audiotranscribepage1';
import Transcriberesultpage from './pages/Transcriberesultpage_v1';
import { syncState } from "./offline/syncState";
import { resetStuckProcessingEvents } from "@/offline/purge"; // NEW
import TransectWalkDashboard from "@/pages/TransectWalkDashboard"; // NEW import



const queryClient = new QueryClient();

// ─── Protected Route Guard ───────────────────────────────────────────────────
// Redirects to "/" (Login) if no access_token is found in localStorage.
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("access_token");
  const offlineAccess =
    localStorage.getItem("offline_access_granted") === "true";

  // Normal authenticated session
  if (token) {
    return <>{children}</>;
  }

  // Previously authenticated device may enter field data offline.
  if (!navigator.onLine && offlineAccess) {
    return <>{children}</>;
  }

  return <Navigate to="/" replace />;
};
// ─────────────────────────────────────────────────────────────────────────────

const App = () => {
  useEffect(() => {
    const runSync = () => {
         if (!navigator.onLine) {
      syncState.setStatus("offline");
      return;
    }

      const token = localStorage.getItem("access_token");
        resetStuckProcessingEvents(token ?? undefined); // NEW — pass token for reconciliation

      if (!token) return;

      // runFullSync is locked internally, so this is safe to call here
      // even if Observation.tsx just kicked off the same sync after a
      // submit — they'll share the same in-flight run instead of racing.
      runFullSync(token).catch((err) => {
        console.error("Critical sync failure", err);
      });
    };

    runSync();
    window.addEventListener("online", runSync);

    return () => {
      window.removeEventListener("online", runSync);
    };
  }, []);

  return (
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
              <Route
                path="/observation"
                element={
                  <ProtectedRoute>
                    <Observation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/observation/:id" element={<ObservationDetail />} />

              {/* Transcription pages */}
              {/* <Route path="/transcribe" element={<Audiotranscribepage />} /> */}
              <Route path="/transcribe/result" element={<Transcriberesultpage />} />

       <Route
  path="/transect-walk"
  element={
    <ProtectedRoute>
      <TransectWalkDashboard />
    </ProtectedRoute>
  }
/>

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
};

export default App;