import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index.tsx";

// Lazy-load todas as páginas autenticadas — reduz bundle inicial
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail.tsx"));
const ProjectList = lazy(() => import("./pages/ProjectList.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const CalendarioTecnico = lazy(() => import("./pages/CalendarioTecnico.tsx"));
const Arquivados = lazy(() => import("./pages/Arquivados.tsx"));
const Premiacao = lazy(() => import("./pages/Premiacao.tsx"));
const Procuracao = lazy(() => import("./pages/Procuracao.tsx"));
const S2220 = lazy(() => import("./pages/S2220.tsx"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
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
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard/projects" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/dashboard/projects/:sector" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/projetos" element={<ProtectedRoute><ProjectList /></ProtectedRoute>} />
                  <Route path="/projetos/:sector" element={<ProtectedRoute><ProjectList /></ProtectedRoute>} />
                  <Route path="/projeto/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/calendario/:sector" element={<ProtectedRoute><CalendarioTecnico /></ProtectedRoute>} />
                  <Route path="/arquivados/:sector" element={<ProtectedRoute><Arquivados /></ProtectedRoute>} />
                  <Route path="/premiacao" element={<ProtectedRoute><Premiacao /></ProtectedRoute>} />
                  <Route path="/esocial/procuracao" element={<ProtectedRoute><Procuracao /></ProtectedRoute>} />
                  <Route path="/esocial/s2220" element={<ProtectedRoute><S2220 /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </ProjectProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
