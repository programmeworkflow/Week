import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import Index from "./pages/Index.tsx";
// Register removed - users created via "Adicionar Responsável" in Profile
import Dashboard from "./pages/Dashboard.tsx";
import Profile from "./pages/Profile.tsx";
import ProjectDetail from "./pages/ProjectDetail.tsx";
import ProjectList from "./pages/ProjectList.tsx";
import NotFound from "./pages/NotFound.tsx";
import CalendarioTecnico from "./pages/CalendarioTecnico.tsx";
import Arquivados from "./pages/Arquivados.tsx";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ProjectProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* Register route removed */}
              <Route path="/dashboard/projects" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/projects/:sector" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/projetos" element={<ProtectedRoute><ProjectList /></ProtectedRoute>} />
              <Route path="/projetos/:sector" element={<ProtectedRoute><ProjectList /></ProtectedRoute>} />
              <Route path="/projeto/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/calendario/:sector" element={<ProtectedRoute><CalendarioTecnico /></ProtectedRoute>} />
              <Route path="/arquivados/:sector" element={<ProtectedRoute><Arquivados /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ProjectProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
