import { useState, useRef, useEffect } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useProjects } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/AppSidebar";
import { KanbanColumn } from "@/components/KanbanColumn";
import { NewProjectModal } from "@/components/NewProjectModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Project, Sector, TecnicoProject, KanbanVariavelCard, RenovacaoCard, RenovacaoStatus, ProjectAttachment, TECNICO_RESPONSAVEIS, TECNICO_PRIORIDADES, TECNICO_STATUS_OPTIONS } from "@/lib/mock-data";
import { getBoardTitle } from "@/lib/sectors";
import { cn } from "@/lib/utils";
import { Download, RefreshCw, Crown, Filter, Copy, ArrowRightLeft, Plus, Layers, PinOff, Edit2, Trash2, X, Send, Mic, Square, Play, Pause, Paperclip, Archive } from "lucide-react";
import { AchievementToast } from "@/components/AchievementToast";
import { FileAttachmentButton, FileAttachmentList } from "@/components/FileAttachment";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const mainColumns: { title: string; status: Project["status"] }[] = [
  { title: "Não atribuído", status: "not_authenticated" },
  { title: "Não iniciados", status: "not_started" },
  { title: "Pendentes", status: "pending" },
  { title: "Revisando", status: "review" },
  { title: "Concluídos", status: "done" },
];

const tecnicoColumns: { title: string; status: Project["status"] }[] = [
  { title: "Não cadastradas no ESO", status: "not_authenticated" },
  { title: "Zona de espera", status: "not_started" },
  { title: "Visita pendente", status: "pending" },
  { title: "Documentação pendente", status: "doc_pending" },
  { title: "Revisão", status: "review" },
  { title: "Finalizadas", status: "done" },
];

const variavelColumns: { title: string; status: Project["status"] }[] = [
  { title: "Em aberto", status: "not_started" },
  { title: "Em andamento", status: "pending" },
  { title: "Revisão", status: "review" },
  { title: "Finalizada", status: "done" },
];

const diretoriaColumns: { title: string; status: Project["status"] }[] = [
  { title: "Demanda não iniciada", status: "not_authenticated" },
  { title: "Demanda verificada", status: "not_started" },
  { title: "Demanda pendente", status: "pending" },
  { title: "Demanda concluída", status: "done" },
];

const tecnicoColumnColors: Record<string, string> = {
  not_authenticated: "border-t-2 border-t-[hsl(var(--status-critico-text))]",
  not_started: "border-t-2 border-t-[hsl(var(--status-nao-iniciado-text))]",
  pending: "border-t-2 border-t-[hsl(var(--status-andamento-text))]",
  doc_pending: "border-t-2 border-t-[hsl(var(--status-pendente-text))]",
  review: "border-t-2 border-t-[hsl(var(--status-revisao-text))]",
  done: "border-t-2 border-t-[hsl(var(--status-concluido-text))]",
};

const variavelColumnColors: Record<string, string> = {
  not_started: "border-t-2 border-t-cyan-400 shadow-[0_-2px_10px_rgba(34,211,238,0.3)]",
  pending: "border-t-2 border-t-amber-400 shadow-[0_-2px_10px_rgba(251,191,36,0.3)]",
  review: "border-t-2 border-t-violet-400 shadow-[0_-2px_10px_rgba(167,139,250,0.3)]",
  done: "border-t-2 border-t-emerald-400 shadow-[0_-2px_10px_rgba(52,211,153,0.3)]",
};

const renovacaoColumns: { title: string; status: RenovacaoStatus }[] = [
  { title: "Documentos vencidos", status: "doc_vencidos" },
  { title: "Revisitar", status: "revisitar" },
  { title: "Medições pendentes", status: "medicoes_pendentes" },
  { title: "Em andamento", status: "em_andamento" },
  { title: "Finalizadas", status: "finalizada" },
];

const renovacaoColumnColors: Record<string, string> = {
  doc_vencidos: "border-t-2 border-t-red-400 shadow-[0_-2px_10px_rgba(248,113,113,0.3)]",
  revisitar: "border-t-2 border-t-orange-400 shadow-[0_-2px_10px_rgba(251,146,60,0.3)]",
  medicoes_pendentes: "border-t-2 border-t-yellow-400 shadow-[0_-2px_10px_rgba(250,204,21,0.3)]",
  em_andamento: "border-t-2 border-t-blue-400 shadow-[0_-2px_10px_rgba(96,165,250,0.3)]",
  finalizada: "border-t-2 border-t-emerald-400 shadow-[0_-2px_10px_rgba(52,211,153,0.3)]",
};

const psicossocialColumns: { title: string; status: Project["status"] }[] = [
  { title: "Não foi iniciado", status: "not_authenticated" },
  { title: "Diagnóstico inicial", status: "not_started" },
  { title: "Enviar proposta comercial", status: "pending" },
  { title: "Dar devolutiva", status: "review" },
  { title: "Finalizada", status: "done" },
];

const sectorNeonColors: Record<string, string> = {
  tecnico: "shadow-[0_0_15px_rgba(34,211,238,0.15)] border-cyan-400/20",
  comercial: "shadow-[0_0_15px_rgba(251,191,36,0.15)] border-amber-400/20",
  saude: "shadow-[0_0_15px_rgba(244,114,182,0.15)] border-pink-400/20",
  financeiro: "shadow-[0_0_15px_rgba(52,211,153,0.15)] border-emerald-400/20",
  psicossocial: "shadow-[0_0_15px_rgba(168,85,247,0.15)] border-purple-400/20",
  diretoria: "shadow-[0_0_15px_rgba(167,139,250,0.15)] border-violet-400/20",
};

const prioridadeColors: Record<string, string> = {
  "Baixa": "bg-muted text-muted-foreground",
  "Média": "status-andamento",
  "Alta": "status-pendente",
  "Crítica": "status-critico",
};

const statusTecnicoColors: Record<string, string> = {
  "Não cadastradas no ESO": "status-critico",
  "Não iniciadas": "status-nao-iniciado",
  "Visita pendente": "status-andamento",
  "Documentação pendente": "status-pendente",
  "Revisão": "status-revisao",
  "Finalizada": "status-concluido",
};

const PRIORITY_ORDER: Record<string, number> = { "Crítica": 0, "Alta": 1, "Média": 2, "Baixa": 3 };
const MAX_CARDS_VARIAVEIS = 5;
const MAX_CARDS_FIXOS = 10;

const formatCNPJ = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

const formatDateInput = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

// Paginated Kanban Column wrapper with "Ver mais" / "Ver menos" / "Ver tudo" (modal)
const PaginatedKanbanColumn = ({
  col, projects, users, onDrop, locked, onCardClick, extraClass, maxCards, renderCardExtra, onViewAll,
}: {
  col: { title: string; status: Project["status"] };
  projects: Project[];
  users: any[];
  onDrop: (id: string, status: Project["status"]) => void;
  locked: boolean;
  onCardClick?: (project: Project) => void;
  extraClass?: string;
  maxCards: number;
  renderCardExtra?: (project: Project) => React.ReactNode;
  onViewAll?: (col: { title: string; status: Project["status"] }, projects: Project[]) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const total = projects.length;
  const displayed = expanded ? projects : projects.slice(0, maxCards);
  const hasMore = total > maxCards;

  return (
    <div className={extraClass || ""}>
      <KanbanColumn
        title={col.title}
        status={col.status}
        projects={displayed}
        users={users}
        onDrop={onDrop}
        count={total}
        locked={locked}
        onCardClick={locked ? () => {} : onCardClick}
        renderCardExtra={renderCardExtra}
      />
      {hasMore && (
        <div className="mt-2 flex gap-1 justify-center">
          {!expanded ? (
            <Button variant="ghost" size="sm" onClick={() => setExpanded(true)} className="text-xs text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg transition-all animate-float neon-hover">
              Ver mais ({total - maxCards})
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setExpanded(false)} className="text-xs text-muted-foreground hover:text-foreground rounded-lg transition-all animate-float neon-hover">
              Ver menos
            </Button>
          )}
          {onViewAll && total > maxCards && (
            <Button variant="ghost" size="sm" onClick={() => onViewAll(col, projects)} className="text-xs text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg transition-all animate-float neon-hover">
              Ver tudo
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// Audio message component for técnico chat
const AudioMessageInline = ({ audioUrl }: { audioUrl: string }) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); } else { audioRef.current.play(); }
    setPlaying(!playing);
  };
  return (
    <div className="flex items-center gap-2 mt-1">
      <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} />
      <button onClick={toggle} className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-all">
        {playing ? <Pause className="w-3 h-3 text-primary" /> : <Play className="w-3 h-3 text-primary" />}
      </button>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary/40 rounded-full w-1/2" /></div>
      <span className="text-[10px] text-muted-foreground">Áudio</span>
    </div>
  );
};
const DiretoriaBoard = ({
  name, columns, projects, users, onDrop, locked, onTransfer, onCardClick,
}: {
  name: string;
  columns: typeof diretoriaColumns;
  projects: Project[];
  users: any[];
  onDrop: (id: string, status: Project["status"]) => void;
  locked: boolean;
  onTransfer?: (projectId: string) => void;
  onCardClick?: (project: Project) => void;
}) => (
  <div className="animate-fade-in">
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-7 h-7 rounded-[10px] bg-accent flex items-center justify-center">
        <Crown className="w-3.5 h-3.5 text-accent-foreground stroke-[1.5]" />
      </div>
      <h2 className="text-[15px] font-semibold text-foreground">Quadro {name}</h2>
    </div>
    <div className="bg-card rounded-[12px] border border-border p-5">
      <div className="flex gap-5 overflow-x-auto pb-2">
        {columns.map((col) => {
          const colProjects = projects.filter((p) => p.status === col.status);
          return (
            <KanbanColumn
              key={`${name}-${col.status}`}
              title={col.title}
              status={col.status}
              projects={colProjects}
              users={users}
              onDrop={onDrop}
              count={colProjects.length}
              locked={locked}
              onCardClick={onCardClick}
              renderCardExtra={!locked && onTransfer ? (project) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onTransfer(project.id); }}
                  className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-primary mt-1 neon-hover animate-float"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  Transferir para {name === "Samuel" ? "Fernando" : "Samuel"}
                </Button>
              ) : undefined}
            />
          );
        })}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { sector } = useParams<{ sector?: string }>();
  const {
    projects, users, updateProjectStatus, updateProject,
    tecnicoProjects, updateTecnicoProject, addTecnicoProject, deleteTecnicoProject,
    kanbanVariavelCards, addKanbanVariavelCard, updateKanbanVariavelCard, updateKanbanVariavelStatus, deleteKanbanVariavelCard,
    renovacaoCards, addRenovacaoCard, updateRenovacaoStatus,
    addMessage, getProjectMessages, addTecnicoAttachment, removeTecnicoAttachment,
  } = useProjects();
  const { user, canAccessSector } = useAuth();
  const [filter, setFilter] = useState("all");
  const [tecnicoResponsavelFilter, setTecnicoResponsavelFilter] = useState("all");
  const [viewingTecnico, setViewingTecnico] = useState<TecnicoProject | null>(null);
  const [editingTecnico, setEditingTecnico] = useState<TecnicoProject | null>(null);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementName, setAchievementName] = useState("");
  const [addingVariavel, setAddingVariavel] = useState(false);
  const [newVariavel, setNewVariavel] = useState({ title: "", description: "", prioridade: "Média" as any });
  const [viewAllModal, setViewAllModal] = useState<{ title: string; projects: Project[] } | null>(null);
  const [editingVariavel, setEditingVariavel] = useState<KanbanVariavelCard | null>(null);
  const [viewingVariavel, setViewingVariavel] = useState<KanbanVariavelCard | null>(null);
  // Chat state for técnico edit dialog
  const [tecnicoChatInput, setTecnicoChatInput] = useState("");
  const [tecnicoChatAttachments, setTecnicoChatAttachments] = useState<Omit<ProjectAttachment, "id">[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioMessages, setAudioMessages] = useState<{ id: string; userId: string; url: string; timestamp: string }[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isGeneralDashboard = !sector;
  const isDiretoria = sector === "diretoria";
  const isTecnico = sector === "tecnico";
  const isPsicossocial = sector === "psicossocial";

  if (sector && !canAccessSector(sector as Sector)) {
    return <Navigate to="/dashboard/projects" replace />;
  }

  const getTecnicoKanbanProjects = (): Project[] => {
    const statusMap: Record<string, Project["status"]> = {
      "Não cadastradas no ESO": "not_authenticated",
      "Não iniciadas": "not_started",
      "Visita pendente": "pending",
      "Documentação pendente": "doc_pending",
      "Revisão": "review",
      "Finalizada": "done",
    };

    let filtered = tecnicoProjects.filter(tp => tp.status_tecnico !== "Arquivado");
    if (tecnicoResponsavelFilter !== "all") {
      filtered = filtered.filter(tp => tp.responsavel === tecnicoResponsavelFilter);
    }

    filtered = [...filtered].sort((a, b) => (PRIORITY_ORDER[a.prioridade] ?? 99) - (PRIORITY_ORDER[b.prioridade] ?? 99));

    return filtered.map(tp => ({
      id: tp.id,
      company_id: "1",
      project_name: tp.empresa,
      description: `${tp.responsavel} • ${tp.regiao}`,
      cnpj: tp.cnpj,
      due_date: tp.data ? (() => {
        const parts = tp.data.split("/");
        return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : "2026-12-31";
      })() : "2026-12-31",
      status: statusMap[tp.status_tecnico] || "not_started",
      sector: "tecnico" as Sector,
      responsible_ids: [],
      created_at: new Date().toISOString(),
    }));
  };

  // Kanban Variáveis → Project format for display
  const getVariavelProjects = (): Project[] => {
    return kanbanVariavelCards
      .sort((a, b) => (PRIORITY_ORDER[a.prioridade] ?? 99) - (PRIORITY_ORDER[b.prioridade] ?? 99))
      .map(c => ({
        id: c.id,
        company_id: "1",
        project_name: c.title,
        description: c.description,
        due_date: "2026-12-31",
        status: c.status,
        sector: "tecnico" as Sector,
        responsible_ids: [],
        created_at: c.createdAt,
      }));
  };

  const sectorProjects = isTecnico
    ? getTecnicoKanbanProjects()
    : sector
      ? projects.filter((p) => p.sector === sector)
      : projects;

  const filtered = filter === "all"
    ? sectorProjects
    : sectorProjects.filter((p) => p.responsible_ids.includes(filter));

  const mainProjects = filtered.filter((p) => !p.is_renovation && p.status !== "archived");
  const renovationProjects = filtered.filter((p) => p.is_renovation && p.status !== "archived");
  const variavelProjects = isTecnico ? getVariavelProjects().filter((p: any) => p.status !== "archived") : [];

  // Auto-archive: tecnico projects in "done"/"Finalizada" for 3+ days
  useEffect(() => {
    if (!isTecnico) return;
    const now = Date.now();
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

    // Check tecnico projects with status "done" and archived_at timestamp
    tecnicoProjects.forEach((tp) => {
      if (tp.status_tecnico === "Finalizada" && !((tp as any).archived_at)) {
        // Set archived_at timestamp if not set
        updateTecnicoProject(tp.id, { archived_at: new Date().toISOString() } as any);
      } else if (tp.status_tecnico === "Finalizada" && (tp as any).archived_at) {
        const archivedTime = new Date((tp as any).archived_at).getTime();
        if (now - archivedTime >= THREE_DAYS) {
          updateTecnicoProject(tp.id, { status_tecnico: "Arquivado" } as any);
        }
      }
    });
  }, [isTecnico, tecnicoProjects.length]);

  const getColumnsForSector = () => {
    if (isTecnico) return tecnicoColumns;
    if (isPsicossocial) return psicossocialColumns;
    if (isDiretoria) return diretoriaColumns;
    return mainColumns;
  };

  const columns = getColumnsForSector();

  const handleDrop = (projectId: string, newStatus: Project["status"]) => {
    if (newStatus === "done") {
      const p = sectorProjects.find(pr => pr.id === projectId);
      if (p && p.status !== "done") {
        setAchievementName(p.project_name);
        setShowAchievement(true);
      }
    }
    updateProjectStatus(projectId, newStatus);
  };

  const handleTecnicoDrop = (projectId: string, newStatus: Project["status"]) => {
    const reverseStatusMap: Record<Project["status"], string> = {
      not_authenticated: "Não cadastradas no ESO",
      not_started: "Não iniciadas",
      pending: "Visita pendente",
      doc_pending: "Documentação pendente",
      review: "Revisão",
      done: "Finalizada",
    };
    if (newStatus === "done") {
      const tp = tecnicoProjects.find(t => t.id === projectId);
      if (tp && tp.status_tecnico !== "Finalizada") {
        setAchievementName(tp.empresa);
        setShowAchievement(true);
      }
    }
    const tecnicoStatus = reverseStatusMap[newStatus];
    if (tecnicoStatus) {
      updateTecnicoProject(projectId, { status_tecnico: tecnicoStatus as any });
    }
  };

  const handleVariavelDrop = (cardId: string, newStatus: Project["status"]) => {
    if (newStatus === "done") {
      const card = kanbanVariavelCards.find((c) => c.id === cardId);
      if (card && card.status !== "done") {
        setAchievementName(card.title || card.empresa || "Projeto");
        setShowAchievement(true);
      }
    }
    updateKanbanVariavelStatus(cardId, newStatus);
  };

  const handleTecnicoCardClick = (project: Project) => {
    navigate(`/projeto/${project.id}?type=tecnico`);
  };

  const handleVariavelCardClick = (project: Project) => {
    navigate(`/projeto/${project.id}?type=variavel`);
  };

  const [archiveConfirm, setArchiveConfirm] = useState<{ id: string; name: string; type: "tecnico" | "variavel" } | null>(null);

  const confirmArchiveTecnico = (id: string, name: string) => {
    setArchiveConfirm({ id, name, type: "tecnico" });
  };

  const confirmArchiveVariavel = (id: string, name: string) => {
    setArchiveConfirm({ id, name, type: "variavel" });
  };

  const handleArchiveConfirmed = () => {
    if (!archiveConfirm || !user) return;
    if (archiveConfirm.type === "tecnico") {
      updateTecnicoProject(archiveConfirm.id, { status_tecnico: "Arquivado", archived_at: new Date().toISOString(), archived_by: user.full_name } as any);
    } else {
      updateKanbanVariavelCard(archiveConfirm.id, { status: "archived", archived_by: user.full_name } as any);
    }
    setArchiveConfirm(null);
  };

  const handleRenovacaoDrop = (cardId: string, newStatus: Project["status"]) => {
    updateRenovacaoStatus(cardId, newStatus as RenovacaoStatus);
  };

  // Convert renovacao cards to Project-like objects for KanbanColumn
  const renovacaoAsProjects = renovacaoCards.map((c): Project => ({
    id: c.id,
    company_id: "1",
    project_name: c.title || c.empresa || "",
    description: c.description || "",
    due_date: c.data || "",
    status: c.status as any,
    sector: "tecnico" as Sector,
    responsible_ids: [],
    created_at: c.createdAt || "",
  }));

  const handleSaveEditTecnico = () => {
    if (!editingTecnico) return;
    updateTecnicoProject(editingTecnico.id, editingTecnico);
    setEditingTecnico(null);
  };

  const handleDuplicateTecnico = () => {
    if (!editingTecnico) return;
    const { id, ...rest } = editingTecnico;
    addTecnicoProject({ ...rest, empresa: `${rest.empresa} (cópia)` });
    setEditingTecnico(null);
  };

  const handleDeleteTecnico = (id: string) => {
    deleteTecnicoProject(id);
    setViewingTecnico(null);
    setEditingTecnico(null);
  };

  const handleDuplicateVariavel = (card: KanbanVariavelCard) => {
    const { id, ...rest } = card;
    addKanbanVariavelCard({ ...rest, title: `${rest.title} (cópia)` });
  };

  const handleSaveEditVariavel = () => {
    if (!editingVariavel) return;
    updateKanbanVariavelCard(editingVariavel.id, editingVariavel);
    setEditingVariavel(null);
  };

  const handleViewAll = (col: { title: string; status: Project["status"] }, colProjects: Project[]) => {
    setViewAllModal({ title: col.title, projects: colProjects });
  };

  // Chat handlers for técnico
  const handleTecnicoChatSend = () => {
    if (!editingTecnico || (!tecnicoChatInput.trim() && tecnicoChatAttachments.length === 0) || !user) return;
    const attachments = tecnicoChatAttachments.map((a, i) => ({ ...a, id: String(Date.now() + i) }));
    addMessage({
      projeto_id: editingTecnico.id,
      usuario_id: user.id || "1",
      conteudo: tecnicoChatInput.trim() || (attachments.length > 0 ? `📎 ${attachments.map(a => a.name).join(", ")}` : ""),
      attachments,
    });
    setTecnicoChatInput("");
    setTecnicoChatAttachments([]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioMessages(prev => [...prev, { id: String(Date.now()), userId: user?.id || "1", url, timestamp: new Date().toISOString() }]);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch { console.error("Microfone não disponível"); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleAddVariavel = () => {
    if (!newVariavel.title.trim()) return;
    addKanbanVariavelCard({
      title: newVariavel.title,
      description: newVariavel.description,
      status: "not_started",
      prioridade: newVariavel.prioridade,
      createdAt: new Date().toISOString(),
    });
    setNewVariavel({ title: "", description: "", prioridade: "Média" });
    setAddingVariavel(false);
  };

  const handleExport = () => {
    const headers = ["Nome", "Status", "Setor", "Data Limite", "Responsáveis"];
    const rows = sectorProjects.map((p) => [
      p.project_name, p.status, p.sector, p.due_date,
      p.responsible_ids.map((id) => users.find((u) => u.id === id)?.full_name || id).join("; "),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `projetos-${sector || "geral"}.csv`;
    a.click();
  };

  const boardTitle = getBoardTitle(sector);

  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <AchievementToast show={showAchievement} projectName={achievementName} onClose={() => setShowAchievement(false)} />

      {/* Archive confirmation dialog */}
      <Dialog open={!!archiveConfirm} onOpenChange={(v) => !v && setArchiveConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-orange-400" />
              Arquivar projeto
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja arquivar <strong className="text-foreground">"{archiveConfirm?.name}"</strong>?
          </p>
          <p className="text-xs text-muted-foreground">O projeto será removido do quadro mas continuará visível em Projetos.</p>
          <div className="flex gap-2 pt-3">
            <Button variant="outline" onClick={() => setArchiveConfirm(null)} className="flex-1 rounded-lg btn-3d neon-hover">
              Cancelar
            </Button>
            <Button onClick={handleArchiveConfirmed} className="flex-1 rounded-lg bg-orange-500 text-white hover:bg-orange-600 btn-3d neon-hover">
              <Archive className="w-4 h-4 mr-1.5" /> Arquivar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <main className="flex-1 ml-60 sidebar-collapsed:ml-16 p-6 md:p-8 bg-background transition-all duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <h1 className="text-lg font-semibold text-foreground neon-text">{boardTitle}</h1>
          {!isGeneralDashboard && !isDiretoria && (
            <div className="flex items-center gap-2">
              {isTecnico ? (
                <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <Select value={tecnicoResponsavelFilter} onValueChange={setTecnicoResponsavelFilter}>
                    <SelectTrigger className="w-[160px] border-0 shadow-none h-8 text-sm">
                      <SelectValue placeholder="Filtrar responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {[...users.map(u => u.full_name), "Zona de espera"].map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[180px] bg-card border-border">
                    <SelectValue placeholder="Filtrar por responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button variant="outline" onClick={handleExport} className="gap-2 text-[13px] rounded-[10px] h-9 btn-3d neon-hover animate-float">
                <Download className="w-4 h-4" />
                Exportar
              </Button>
              <NewProjectModal defaultSector={sector as Sector | undefined} />
            </div>
          )}
        </div>

        {isDiretoria ? (
          <>
            <DiretoriaBoard name="Samuel" columns={diretoriaColumns} projects={mainProjects} users={users} onDrop={handleDrop} locked={isGeneralDashboard} onTransfer={(id) => updateProject(id, { is_renovation: true })} onCardClick={(p) => navigate(`/projeto/${p.id}`)} />
            <div className="mt-10">
              <DiretoriaBoard name="Fernando" columns={diretoriaColumns} projects={renovationProjects} users={users} onDrop={handleDrop} locked={isGeneralDashboard} onTransfer={(id) => updateProject(id, { is_renovation: false })} onCardClick={(p) => navigate(`/projeto/${p.id}`)} />
            </div>
          </>
        ) : (
          <>
            {/* Quadro Variáveis - Técnico only, independent */}
            {isTecnico && !isGeneralDashboard && (
              <div className="mb-10 animate-fade-in">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-[10px] bg-accent flex items-center justify-center">
                    <PinOff className="w-3.5 h-3.5 text-accent-foreground stroke-[1.5]" />
                  </div>
                  <h2 className="text-[15px] font-semibold text-foreground">Demanda Avulsa</h2>
                  <span className="text-[10px] text-muted-foreground">(demandas avulsas independentes)</span>
                  <Button variant="outline" size="sm" onClick={() => setAddingVariavel(true)} className="ml-auto gap-1.5 text-xs rounded-lg h-8 btn-3d neon-hover animate-float">
                    <Plus className="w-3.5 h-3.5" /> Novo card
                  </Button>
                </div>
                <div className={`bg-card rounded-[12px] border p-5 neon-card ${sectorNeonColors[sector as string] || ""}`}>
                  <div className="flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory md:snap-none">
                    {variavelColumns.map((col) => {
                      const colProjects = variavelProjects.filter((p) => p.status === col.status);
                      return (
                        <PaginatedKanbanColumn
                          key={`var-${col.status}`}
                          col={col}
                          projects={colProjects}
                          users={users}
                          onDrop={handleVariavelDrop}
                          locked={false}
                          onCardClick={handleVariavelCardClick}
                          extraClass={variavelColumnColors[col.status] || ""}
                          maxCards={MAX_CARDS_VARIAVEIS}
                          onViewAll={handleViewAll}
                          renderCardExtra={(project) => (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); confirmArchiveVariavel(project.id, project.project_name); }}
                              className="h-6 text-[10px] gap-1 text-muted-foreground hover:text-orange-400 mt-1 px-2"
                            >
                              <Archive className="w-3 h-3" /> Arquivar
                            </Button>
                          )}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Quadro Fixos (Main Board) */}
            {isTecnico && !isGeneralDashboard && (
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-[10px] bg-primary/10 flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5 text-primary stroke-[1.5]" />
                </div>
                <h2 className="text-[15px] font-semibold text-foreground">Empresas</h2>
                <span className="text-[10px] text-muted-foreground">(clientes fixos da empresa)</span>
              </div>
            )}

            <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none">
              {columns.map((col) => {
                const colProjects = mainProjects.filter((p) => p.status === col.status);
                return (
                  <PaginatedKanbanColumn
                    key={col.status}
                    col={col}
                    projects={colProjects}
                    users={users}
                    onDrop={isTecnico ? handleTecnicoDrop : handleDrop}
                    locked={isGeneralDashboard}
                    onCardClick={isTecnico ? handleTecnicoCardClick : undefined}
                    extraClass={isTecnico ? tecnicoColumnColors[col.status] || "" : ""}
                    maxCards={MAX_CARDS_FIXOS}
                    onViewAll={handleViewAll}
                    renderCardExtra={isTecnico ? (project) => (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); confirmArchiveTecnico(project.id, project.project_name); }}
                        className="h-6 text-[10px] gap-1 text-muted-foreground hover:text-orange-400 mt-1 px-2"
                      >
                        <Archive className="w-3 h-3" /> Arquivar
                      </Button>
                    ) : undefined}
                  />
                );
              })}
            </div>

            {/* Renovação Board - Técnico only */}
            {isTecnico && !isGeneralDashboard && (
              <div className="mt-10 animate-fade-in">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-[10px] bg-orange-400/10 flex items-center justify-center">
                    <RefreshCw className="w-3.5 h-3.5 text-orange-400 stroke-[1.5]" />
                  </div>
                  <h2 className="text-[15px] font-semibold text-foreground">Renovação</h2>
                  <span className="text-[10px] text-muted-foreground">(renovações e pendências)</span>
                </div>
                <div className={`bg-card rounded-[12px] border p-5 neon-card shadow-[0_0_15px_rgba(251,146,60,0.15)] border-orange-400/20`}>
                  <div className="flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory md:snap-none">
                    {renovacaoColumns.map((col) => {
                      const colCards = renovacaoAsProjects.filter((p) => p.status === col.status);
                      return (
                        <PaginatedKanbanColumn
                          key={`ren-${col.status}`}
                          col={{ title: col.title, status: col.status as any }}
                          projects={colCards}
                          users={users}
                          onDrop={handleRenovacaoDrop}
                          locked={false}
                          extraClass={renovacaoColumnColors[col.status] || ""}
                          maxCards={MAX_CARDS_VARIAVEIS}
                          onViewAll={handleViewAll}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Renovation Board - Other sectors */}
            {!isTecnico && (
              <div className="mt-10 animate-fade-in">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-[10px] status-revisao flex items-center justify-center">
                    <RefreshCw className="w-3.5 h-3.5 stroke-[1.5]" />
                  </div>
                  <h2 className="text-[15px] font-semibold text-foreground">Renovações</h2>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full status-revisao">
                    {renovationProjects.length}
                  </span>
                </div>
                <div className="bg-card rounded-[12px] border border-border p-5 min-h-[100px]">
                  {renovationProjects.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground text-center py-8">Nenhuma renovação neste setor.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {renovationProjects.map((project) => {
                        const responsibles = users.filter((u) => project.responsible_ids.includes(u.id));
                        return (
                          <div key={project.id} className={`bg-card rounded-[12px] p-4 shadow-card border border-border transition-all duration-300 min-h-[90px] gradient-hover neon-hover ${isGeneralDashboard ? "cursor-default" : "cursor-pointer hover:shadow-elevated hover:-translate-y-[3px]"}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground stroke-[1.5]" />
                              <h4 className="font-medium text-foreground text-[13px] truncate">{project.project_name}</h4>
                            </div>
                            {project.description && (
                              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
                            )}
                            <div className="flex -space-x-1.5">
                              {responsibles.slice(0, 3).map((u) => (
                                <div key={u.id} className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-medium text-primary-foreground border-2 border-card" title={u.full_name}>
                                  {u.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Tecnico View Detail Dialog */}
        <Dialog open={!!viewingTecnico} onOpenChange={(v) => !v && setViewingTecnico(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{viewingTecnico?.empresa}</DialogTitle>
            </DialogHeader>
            {viewingTecnico && (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground text-xs">CNPJ:</span><p className="font-medium">{viewingTecnico.cnpj || "—"}</p></div>
                  <div><span className="text-muted-foreground text-xs">Responsável:</span><p className="font-medium">{viewingTecnico.responsavel}</p></div>
                  <div><span className="text-muted-foreground text-xs">Região:</span><p className="font-medium">{viewingTecnico.regiao || "—"}</p></div>
                  <div><span className="text-muted-foreground text-xs">Prioridade:</span><p><span className={cn("px-2 py-0.5 rounded text-xs font-medium", prioridadeColors[viewingTecnico.prioridade])}>{viewingTecnico.prioridade}</span></p></div>
                  <div><span className="text-muted-foreground text-xs">Data:</span><p className="font-medium">{viewingTecnico.data || "—"}</p></div>
                  <div><span className="text-muted-foreground text-xs">Status:</span><p><span className={cn("px-2 py-0.5 rounded text-xs font-medium", statusTecnicoColors[viewingTecnico.status_tecnico])}>{viewingTecnico.status_tecnico}</span></p></div>
                </div>
                <hr className="border-border" />
                <div><span className="text-muted-foreground text-xs">Contato:</span><p className="font-medium">{viewingTecnico.contato_nome || "—"}</p></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground text-xs">Telefone:</span><p className="font-medium">{viewingTecnico.contato_telefone || "—"}</p></div>
                  <div><span className="text-muted-foreground text-xs">Email:</span><p className="font-medium">{viewingTecnico.contato_email || "—"}</p></div>
                </div>
                {viewingTecnico.dados_extras && (
                  <div><span className="text-muted-foreground text-xs">Dados extras:</span><p className="font-medium">{viewingTecnico.dados_extras}</p></div>
                )}
                {/* Attachments */}
                {viewingTecnico.attachments && viewingTecnico.attachments.length > 0 && (
                  <div>
                    <span className="text-muted-foreground text-xs">Arquivos:</span>
                    <div className="mt-1"><FileAttachmentList attachments={viewingTecnico.attachments} /></div>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => { setEditingTecnico({ ...viewingTecnico }); setViewingTecnico(null); }} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-[10px] flex-1 h-10 btn-3d neon-hover animate-float">
                    <Edit2 className="w-4 h-4 mr-1.5" /> Editar
                  </Button>
                  <Button variant="outline" onClick={() => { const { id, ...rest } = viewingTecnico; addTecnicoProject({ ...rest, empresa: `${rest.empresa} (cópia)` }); setViewingTecnico(null); }} className="rounded-[10px] gap-1.5 h-10 btn-3d neon-hover animate-float" style={{ animationDelay: "0.2s" }}>
                    <Copy className="w-3.5 h-3.5" /> Duplicar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="rounded-[10px] gap-1.5 h-10 btn-3d neon-hover animate-float" style={{ animationDelay: "0.4s" }}>
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
                        <AlertDialogDescription>O projeto "{viewingTecnico.empresa}" será removido permanentemente.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-[10px]">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteTecnico(viewingTecnico.id)} className="rounded-[10px]">Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Tecnico Edit Dialog - with chat on the right like other sectors */}
        <Dialog open={!!editingTecnico} onOpenChange={(v) => !v && setEditingTecnico(null)}>
          <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden p-0">
            <div className="flex h-[85vh]">
              {/* Left side - Form */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 border-r border-border">
                <DialogHeader>
                  <DialogTitle>Editar Projeto</DialogTitle>
                </DialogHeader>
                {editingTecnico && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Empresa</Label>
                        <Input value={editingTecnico.empresa} onChange={(e) => setEditingTecnico({ ...editingTecnico, empresa: e.target.value })} className="h-9 text-sm rounded-lg" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">CNPJ</Label>
                        <Input value={editingTecnico.cnpj} onChange={(e) => setEditingTecnico({ ...editingTecnico, cnpj: formatCNPJ(e.target.value) })} placeholder="00.000.000/0000-00" className="h-9 text-sm rounded-lg" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Responsável</Label>
                        <Select value={editingTecnico.responsavel} onValueChange={(v) => setEditingTecnico({ ...editingTecnico, responsavel: v as any })}>
                          <SelectTrigger className="h-9 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>{[...users.map(u => u.full_name), "Zona de espera"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Região</Label>
                        <Input value={editingTecnico.regiao} onChange={(e) => setEditingTecnico({ ...editingTecnico, regiao: e.target.value })} className="h-9 text-sm rounded-lg" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Prioridade</Label>
                        <Select value={editingTecnico.prioridade} onValueChange={(v) => setEditingTecnico({ ...editingTecnico, prioridade: v as any })}>
                          <SelectTrigger className="h-9 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>{TECNICO_PRIORIDADES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Data</Label>
                        <Input value={editingTecnico.data} onChange={(e) => setEditingTecnico({ ...editingTecnico, data: formatDateInput(e.target.value) })} placeholder="dd/mm/aaaa" className="h-9 text-sm rounded-lg" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Status</Label>
                        <Select value={editingTecnico.status_tecnico} onValueChange={(v) => setEditingTecnico({ ...editingTecnico, status_tecnico: v as any })}>
                          <SelectTrigger className="h-9 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>{TECNICO_STATUS_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <hr className="border-border" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Nome</Label>
                        <Input value={editingTecnico.contato_nome} onChange={(e) => setEditingTecnico({ ...editingTecnico, contato_nome: e.target.value })} className="h-9 text-sm rounded-lg" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Telefone</Label>
                        <Input value={editingTecnico.contato_telefone} onChange={(e) => setEditingTecnico({ ...editingTecnico, contato_telefone: e.target.value })} className="h-9 text-sm rounded-lg" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Email</Label>
                        <Input value={editingTecnico.contato_email} onChange={(e) => setEditingTecnico({ ...editingTecnico, contato_email: e.target.value })} className="h-9 text-sm rounded-lg" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Dados extras</Label>
                      <Textarea value={editingTecnico.dados_extras} onChange={(e) => setEditingTecnico({ ...editingTecnico, dados_extras: e.target.value })} rows={2} className="text-sm rounded-lg" />
                    </div>

                    {/* Attachments */}
                    <hr className="border-border" />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Arquivos Anexados</Label>
                        <FileAttachmentButton onAttach={(att) => addTecnicoAttachment(editingTecnico.id, att)} userId={user?.id || "1"} />
                      </div>
                      <FileAttachmentList
                        attachments={editingTecnico.attachments || []}
                        onRemove={(attId) => removeTecnicoAttachment(editingTecnico.id, attId)}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleSaveEditTecnico} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-[10px] flex-1 h-10 btn-3d neon-hover animate-float">Salvar</Button>
                      <Button variant="outline" onClick={handleDuplicateTecnico} className="rounded-[10px] gap-1.5 h-10 btn-3d neon-hover animate-float" style={{ animationDelay: "0.2s" }}>
                        <Copy className="w-3.5 h-3.5" /> Duplicar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="rounded-[10px] gap-1.5 h-10 btn-3d neon-hover animate-float" style={{ animationDelay: "0.4s" }}>
                            <Trash2 className="w-3.5 h-3.5" /> Excluir
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
                            <AlertDialogDescription>O projeto "{editingTecnico.empresa}" será removido permanentemente.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-[10px]">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTecnico(editingTecnico.id)} className="rounded-[10px]">Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button variant="outline" onClick={() => setEditingTecnico(null)} className="rounded-[10px] h-10 btn-3d neon-hover animate-float" style={{ animationDelay: "0.6s" }}>Cancelar</Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right side - Chat */}
              <div className="w-[340px] flex flex-col bg-muted/20">
                <div className="p-4 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Chat do Projeto</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {editingTecnico && (() => {
                    const msgs = getProjectMessages(editingTecnico.id);
                    if (msgs.length === 0 && audioMessages.length === 0) {
                      return <p className="text-[11px] text-muted-foreground text-center py-8">Nenhuma mensagem ainda.</p>;
                    }
                    return msgs.map(msg => {
                      const msgUser = users.find(u => u.id === msg.usuario_id);
                      return (
                        <div key={msg.id} className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[8px] font-medium text-primary-foreground">
                              {msgUser?.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </div>
                            <span className="text-[11px] font-medium text-foreground">{msgUser?.full_name}</span>
                            <span className="text-[9px] text-muted-foreground ml-auto">{format(new Date(msg.criado_em), "dd/MM HH:mm", { locale: ptBR })}</span>
                          </div>
                          <p className="text-[11px] text-foreground ml-6">{msg.conteudo}</p>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="ml-6 mt-0.5"><FileAttachmentList attachments={msg.attachments} compact /></div>
                          )}
                        </div>
                      );
                    });
                  })()}
                  {audioMessages.map(am => (
                    <div key={am.id}><AudioMessageInline audioUrl={am.url} /></div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                {/* Chat input */}
                <div className="p-3 border-t border-border space-y-2">
                  {tecnicoChatAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tecnicoChatAttachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded text-[10px] text-primary">
                          <span className="truncate max-w-[80px]">{att.name}</span>
                          <button onClick={() => setTecnicoChatAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    <Input
                      value={tecnicoChatInput}
                      onChange={(e) => setTecnicoChatInput(e.target.value.slice(0, 500))}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTecnicoChatSend(); } }}
                      placeholder="Mensagem..."
                      className="text-xs h-8 rounded-lg"
                      maxLength={500}
                    />
                    <FileAttachmentButton onAttach={(att) => setTecnicoChatAttachments(prev => [...prev, att])} userId={user?.id || "1"} compact />
                    <Button size="icon" variant={isRecording ? "destructive" : "outline"} onClick={isRecording ? stopRecording : startRecording} className="shrink-0 rounded-lg h-8 w-8">
                      {isRecording ? <Square className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                    </Button>
                    <Button size="icon" onClick={handleTecnicoChatSend} disabled={!tecnicoChatInput.trim() && tecnicoChatAttachments.length === 0} className="shrink-0 bg-primary text-primary-foreground rounded-lg h-8 w-8">
                      <Send className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Variável Card Dialog */}
        <Dialog open={!!editingVariavel} onOpenChange={(v) => !v && setEditingVariavel(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Card Variável</DialogTitle>
            </DialogHeader>
            {editingVariavel && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Título</Label>
                  <Input value={editingVariavel.title} onChange={(e) => setEditingVariavel({ ...editingVariavel, title: e.target.value })} className="h-9 text-sm rounded-lg" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Descrição</Label>
                  <Textarea value={editingVariavel.description} onChange={(e) => setEditingVariavel({ ...editingVariavel, description: e.target.value })} rows={2} className="text-sm rounded-lg" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Prioridade</Label>
                  <Select value={editingVariavel.prioridade} onValueChange={(v) => setEditingVariavel({ ...editingVariavel, prioridade: v as any })}>
                    <SelectTrigger className="h-9 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>{TECNICO_PRIORIDADES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveEditVariavel} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-[10px] flex-1 h-10 btn-3d neon-hover animate-float">Salvar</Button>
                  <Button variant="outline" onClick={() => setEditingVariavel(null)} className="rounded-[10px] h-10 btn-3d neon-hover animate-float" style={{ animationDelay: "0.2s" }}>Cancelar</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Ver Tudo Modal - overlay showing ALL projects of a column */}
        <Dialog open={!!viewAllModal} onOpenChange={(v) => !v && setViewAllModal(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewAllModal?.title} ({viewAllModal?.projects.length})</DialogTitle>
            </DialogHeader>
            {viewAllModal && (
              <div className="space-y-3">
                {viewAllModal.projects.map((project) => {
                  const responsibles = users.filter(u => project.responsible_ids.includes(u.id));
                  return (
                    <div
                      key={project.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer transition-all"
                      onClick={() => {
                        setViewAllModal(null);
                        if (isTecnico) {
                          const tp = tecnicoProjects.find(t => t.id === project.id);
                          if (tp) setViewingTecnico(tp);
                          else {
                            const card = kanbanVariavelCards.find(c => c.id === project.id);
                            if (card) setViewingVariavel(card);
                          }
                        } else {
                          navigate(`/projeto/${project.id}`);
                        }
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{project.project_name}</p>
                        {project.description && <p className="text-xs text-muted-foreground truncate">{project.description}</p>}
                      </div>
                      <div className="flex -space-x-1.5 shrink-0">
                        {responsibles.slice(0, 3).map((u) => (
                          <div key={u.id} className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-medium text-primary-foreground border-2 border-card" title={u.full_name}>
                            {u.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Dashboard;
