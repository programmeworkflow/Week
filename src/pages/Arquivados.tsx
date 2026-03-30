import { AppSidebar } from "@/components/AppSidebar";
import { useProjects } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useParams } from "react-router-dom";
import { getSectorTitle } from "@/lib/sectors";
import { Sector } from "@/lib/mock-data";
import { Archive, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Arquivados = () => {
  const { user, canAccessSector } = useAuth();
  const { tecnicoProjects, updateTecnicoProject, kanbanVariavelCards, updateKanbanVariavelStatus } = useProjects();

  const { sector: sectorParam } = useParams<{ sector: string }>();
  const currentSector = (sectorParam || "tecnico") as Sector;

  if (!user) return <Navigate to="/" replace />;
  if (!canAccessSector(currentSector) && !user.is_admin) return <Navigate to="/dashboard/projects" replace />;

  // Archived tecnico projects (status_tecnico === "Arquivado")
  const archivedTecnico = tecnicoProjects.filter((tp) => (tp as any).status_tecnico === "Arquivado");

  // Archived variavel cards
  const archivedVariavel = kanbanVariavelCards.filter((c) => c.status === "archived");

  const handleRestoreTecnico = (id: string) => {
    updateTecnicoProject(id, { status_tecnico: "Não iniciadas", archived_at: null } as any);
  };

  const handleRestoreVariavel = (id: string) => {
    updateKanbanVariavelStatus(id, "not_started");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-60 sidebar-collapsed:ml-16 max-md:ml-0 transition-all duration-200">
        <div className="p-6 max-md:p-4 max-md:pt-16">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-foreground neon-text flex items-center gap-2">
              <Archive className="w-5 h-5 text-orange-400" />
              Arquivados — {getSectorTitle(currentSector)}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Projetos e demandas arquivados</p>
          </div>

          {/* Empresas arquivadas */}
          <div className="mb-8">
            <h2 className="text-[15px] font-semibold text-foreground mb-3">Empresas Arquivadas ({archivedTecnico.length})</h2>
            {archivedTecnico.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">Nenhuma empresa arquivada.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {archivedTecnico.map((tp) => (
                  <div key={tp.id} className="bg-card rounded-xl border border-border p-4 neon-card transition-all duration-200 hover:shadow-card-hover">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground truncate">{tp.empresa}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{tp.responsavel || "—"} • {tp.regiao || "—"}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{tp.data || "—"}</p>
                        {(tp as any).archived_by && (
                          <p className="text-[10px] text-orange-400 mt-1">Arquivado por: {(tp as any).archived_by}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestoreTecnico(tp.id)}
                        className="h-7 text-xs gap-1 text-primary hover:text-primary/80 neon-hover"
                      >
                        <RefreshCw className="w-3 h-3" /> Restaurar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Demandas avulsas arquivadas */}
          <div>
            <h2 className="text-[15px] font-semibold text-foreground mb-3">Demandas Avulsas Arquivadas ({archivedVariavel.length})</h2>
            {archivedVariavel.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">Nenhuma demanda avulsa arquivada.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {archivedVariavel.map((c) => (
                  <div key={c.id} className="bg-card rounded-xl border border-border p-4 neon-card transition-all duration-200 hover:shadow-card-hover">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground truncate">{c.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{c.description || "—"}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-400/10 text-orange-400 font-medium mt-1 inline-block">Arquivado</span>
                        {(c as any).archived_by && (
                          <p className="text-[10px] text-orange-400 mt-1">Arquivado por: {(c as any).archived_by}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestoreVariavel(c.id)}
                        className="h-7 text-xs gap-1 text-primary hover:text-primary/80 neon-hover"
                      >
                        <RefreshCw className="w-3 h-3" /> Restaurar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Arquivados;
