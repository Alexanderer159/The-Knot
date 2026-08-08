import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AnimatePresence } from "framer-motion";
import { useLocation, Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { LocalUserProvider, useLocalUser } from "@/hooks/useLocalUser";
import Auth from "@/pages/Auth";
import KnotSetup from "@/pages/KnotSetup";
import Grupo from "@/pages/Grupo";
import MapaPage from "@/pages/MapaPage";
import Insumos from "@/pages/Insumos";
import ActivityHistory from "@/pages/ActivityHistory";
import Vault from "@/pages/Vault";
import Config from "@/pages/Config";
import NotFound from "@/pages/NotFound";
import { SyncProvider } from "@/hooks/useSyncQueue";

const queryClient = new QueryClient();

function Gate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isSetup, loading: userLoading } = useLocalUser();

  if (authLoading || userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary font-heading text-xl">THE_KNOT_</div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!isSetup) return <Navigate to="/setup" replace />;
  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/setup" element={<PageTransition><KnotSetup /></PageTransition>} />
        <Route element={<Gate><AppLayout /></Gate>}>
          <Route path="/" element={<PageTransition><Grupo /></PageTransition>} />
          <Route path="/map" element={<PageTransition><MapaPage /></PageTransition>} />
          <Route path="/supplies" element={<PageTransition><Insumos /></PageTransition>} />
          <Route path="/activity" element={<PageTransition><ActivityHistory /></PageTransition>} />
          <Route path="/vault" element={<PageTransition><Vault /></PageTransition>} />
          <Route path="/config" element={<PageTransition><Config /></PageTransition>} />
        </Route>
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <LocalUserProvider>
          <SyncProvider>
            <BrowserRouter>
              <AnimatedRoutes />
            </BrowserRouter>
          </SyncProvider>
        </LocalUserProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;