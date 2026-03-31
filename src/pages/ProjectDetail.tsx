import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useProjects } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Trash2, Send, Edit2, Copy, Mic, Square, Play, Pause, ArrowRightLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Project, SECTORS, Sector, ProjectAttachment, TecnicoProject, KanbanVariavelCard, TECNICO_RESPONSAVEIS, TECNICO_PRIORIDADES, TECNICO_STATUS_OPTIONS } from "@/lib/mock-data";
import { formatTelefone, formatCNPJ as fmtCNPJ2, formatDate as fmtDate2 } from "@/lib/formatters";
import { TransferSectorModal } from "@/components/TransferSectorModal";
import { AchievementToast } from "@/components/AchievementToast";
import { FileAttachmentButton, FileAttachmentList } from "@/components/FileAttachment";

const statusLabels: Record<Project["status"], string> = {
  not_authenticated: "Não Autenticado",
  not_started: "Não Iniciado",
  pending: "Pendente",
  doc_pending: "Doc. Pendente",
  review: "Revisão",
  done: "Concluído",
};

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

// Audio message component
const AudioMessage = ({ audioUrl }: { audioUrl: string }) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); } else { audioRef.current.play(); }
    setPlaying(!playing);
  };

  return (
    <div className="flex items-center gap-2 ml-8 mt-1">
      <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} />
      <button onClick={toggle} className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-all">
        {playing ? <Pause className="w-3 h-3 text-primary" /> : <Play className="w-3 h-3 text-primary" />}
      </button>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary/40 rounded-full w-1/2" />
      </div>
      <span className="text-[10px] text-muted-foreground">Áudio</span>
    </div>
  );
};

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    projects, users, updateProject, deleteProject, addProject,
    addMessage, getProjectMessages, addProjectAttachment, removeProjectAttachment,
    tecnicoProjects, updateTecnicoProject, addTecnicoProject, deleteTecnicoProject,
    addTecnicoAttachment, removeTecnicoAttachment,
    kanbanVariavelCards, updateKanbanVariavelCard, addKanbanVariavelCard, deleteKanbanVariavelCard,
    transferTecnicoToSector,
  } = useProjects();

  const projectType = searchParams.get("type"); // "tecnico" | "variavel" | null (regular)

  // Find the entity based on type
  const regularProject = projects.find((p) => p.id === id);
  const tecnicoProject = tecnicoProjects.find((t) => t.id === id);
  const variavelCard = kanbanVariavelCards.find((c) => c.id === id);

  const isTecnico = projectType === "tecnico" && !!tecnicoProject;
  const isVariavel = projectType === "variavel" && !!variavelCard;
  const isRegular = !isTecnico && !isVariavel && !!regularProject;

  const entityExists = isTecnico || isVariavel || isRegular;

  const [isEditing, setIsEditing] = useState(searchParams.get("edit") === "true");
  const [msgInput, setMsgInput] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioMessages, setAudioMessages] = useState<{ id: string; userId: string; url: string; timestamp: string }[]>([]);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementName, setAchievementName] = useState("");
  const [chatAttachments, setChatAttachments] = useState<Omit<ProjectAttachment, "id">[]>([]);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferSector, setTransferSector] = useState<Sector | "">("");
  const [transferDescription, setTransferDescription] = useState("");
  const [transferResponsaveis, setTransferResponsaveis] = useState<string[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Unified form state
  const [form, setForm] = useState(() => {
    if (tecnicoProject && projectType === "tecnico") {
      return {
        // Técnico fields
        empresa: tecnicoProject.empresa,
        cnpj: tecnicoProject.cnpj,
        responsavel: tecnicoProject.responsavel,
        regiao: tecnicoProject.regiao,
        prioridade: tecnicoProject.prioridade,
        data: tecnicoProject.data,
        status_tecnico: tecnicoProject.status_tecnico,
        contato_nome: tecnicoProject.contato_nome,
        contato_telefone: tecnicoProject.contato_telefone,
        contato_email: tecnicoProject.contato_email,
        dados_extras: tecnicoProject.dados_extras,
      };
    }
    if (variavelCard && projectType === "variavel") {
      return {
        title: variavelCard.title,
        empresa: variavelCard.empresa || variavelCard.title,
        cnpj: variavelCard.cnpj || "",
        responsavel: variavelCard.responsavel || "",
        regiao: variavelCard.regiao || "",
        prioridade: variavelCard.prioridade,
        data: variavelCard.data || "",
        status_tecnico: variavelCard.status_tecnico || "Não iniciadas",
        contato_nome: variavelCard.contato_nome || "",
        contato_telefone: variavelCard.contato_telefone || "",
        contato_email: variavelCard.contato_email || "",
        dados_extras: variavelCard.dados_extras || variavelCard.description || "",
        description: variavelCard.description,
        status: variavelCard.status,
      };
    }
    if (regularProject) {
      return {
        project_name: regularProject.project_name,
        description: regularProject.description || "",
        cnpj: regularProject.cnpj || "",
        start_date: regularProject.start_date || "",
        due_date: regularProject.due_date,
        status: regularProject.status,
        sector: regularProject.sector,
        responsible_ids: regularProject.responsible_ids || [],
        contato_nome: (regularProject as any)?.contato_nome || "",
        contato_telefone: (regularProject as any)?.contato_telefone || "",
        contato_email: (regularProject as any)?.contato_email || "",
        dados_extras: (regularProject as any)?.dados_extras || "",
      };
    }
    return {};
  });

  const projectId = id || "";
  const projectName = isTecnico ? tecnicoProject!.empresa : isVariavel ? (variavelCard!.empresa || variavelCard!.title) : regularProject?.project_name || "";

  // Filter users for mentions
  const sectorUsers = users.filter(u => {
    if (isTecnico) return u.sectors?.includes("tecnico");
    if (regularProject) return u.sectors?.includes(regularProject.sector);
    return true;
  });

  const filteredMentionUsers = sectorUsers.filter(u =>
    u.full_name.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [projectId]);

  if (!entityExists) {
    return (
      <div className="min-h-screen flex">
        <AppSidebar />
        <main className="flex-1 ml-60 sidebar-collapsed:ml-16 p-6 md:p-8 flex items-center justify-center transition-all duration-200">
          <p className="text-muted-foreground">Projeto não encontrado.</p>
        </main>
      </div>
    );
  }

  const messages = getProjectMessages(projectId);

  // === SAVE ===
  const handleSave = () => {
    if (isTecnico) {
      const f = form as any;
      if (f.status_tecnico === "Finalizada" && tecnicoProject!.status_tecnico !== "Finalizada") {
        setAchievementName(f.empresa);
        setShowAchievement(true);
      }
      updateTecnicoProject(projectId, {
        empresa: f.empresa, cnpj: f.cnpj, responsavel: f.responsavel, regiao: f.regiao,
        prioridade: f.prioridade, data: f.data, status_tecnico: f.status_tecnico,
        contato_nome: f.contato_nome, contato_telefone: f.contato_telefone,
        contato_email: f.contato_email, dados_extras: f.dados_extras,
      });
    } else if (isVariavel) {
      const f = form as any;
      updateKanbanVariavelCard(projectId, {
        title: f.empresa || f.title, empresa: f.empresa, cnpj: f.cnpj, responsavel: f.responsavel,
        regiao: f.regiao, prioridade: f.prioridade, data: f.data, status_tecnico: f.status_tecnico,
        contato_nome: f.contato_nome, contato_telefone: f.contato_telefone, contato_email: f.contato_email,
        dados_extras: f.dados_extras, description: f.dados_extras || f.description, status: f.status,
      });
    } else {
      const f = form as any;
      if (f.status === "done" && regularProject!.status !== "done") {
        setAchievementName(f.project_name);
        setShowAchievement(true);
      }
      updateProject(projectId, f);
    }
    setIsEditing(false);
  };

  // === DELETE ===
  const handleDelete = () => {
    if (isTecnico) deleteTecnicoProject(projectId);
    else if (isVariavel) deleteKanbanVariavelCard(projectId);
    else deleteProject(projectId);
    navigate(-1);
  };

  // === DUPLICATE ===
  const handleDuplicate = () => {
    if (isTecnico) {
      const { id: _id, ...rest } = tecnicoProject!;
      addTecnicoProject({ ...rest, empresa: `${rest.empresa} (cópia)` });
    } else if (isVariavel) {
      const { id: _id, ...rest } = variavelCard!;
      addKanbanVariavelCard({ ...rest, title: `${rest.title} (cópia)` });
    } else {
      addProject({ ...regularProject!, project_name: `${regularProject!.project_name} (cópia)`, status: "not_started" });
    }
    navigate(-1);
  };

  // === TRANSFER ===
  const handleTransferSector = (newSector: Sector, description: string, newResponsaveis: string[]) => {
    if (isTecnico) {
      transferTecnicoToSector(projectId, newSector, description, user?.id || "1");
      // Update responsible_ids on the new project
      setTimeout(() => {
        const newProj = projects.find(p => p.project_name === tecnicoProject?.empresa && p.sector === newSector);
        if (newProj && newResponsaveis.length) updateProject(newProj.id, { responsible_ids: newResponsaveis } as any);
      }, 500);
      navigate(-1);
    } else if (isRegular) {
      addMessage({
        projeto_id: projectId,
        usuario_id: user?.id || "1",
        conteudo: `Projeto transferido para ${SECTORS.find(s => s.id === newSector)?.label}. Motivo: ${description}`,
      });
      updateProject(projectId, { sector: newSector, responsible_ids: newResponsaveis.length ? newResponsaveis : regularProject!.responsible_ids } as any);
    }
  };

  const handleTransferSubmit = () => {
    if (!transferSector || !transferDescription.trim()) return;
    handleTransferSector(transferSector as Sector, transferDescription.trim(), transferResponsaveis);
    setTransferOpen(false);
    setTransferSector("");
    setTransferDescription("");
    setTransferResponsaveis([]);
  };

  // === CHAT ===
  const handleSendMessage = () => {
    const trimmed = msgInput.trim();
    if ((!trimmed && chatAttachments.length === 0) || !user) return;
    const attachments = chatAttachments.map((a, i) => ({ ...a, id: String(Date.now() + i) }));
    addMessage({
      projeto_id: projectId,
      usuario_id: user.id || "1",
      conteudo: trimmed || (attachments.length > 0 ? `📎 ${attachments.map(a => a.name).join(", ")}` : ""),
      attachments,
    });
    setMsgInput("");
    setChatAttachments([]);
    setShowMentions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const handleInputChange = (val: string) => {
    setMsgInput(val.slice(0, 500));
    const lastAt = val.lastIndexOf("@");
    if (lastAt !== -1 && (lastAt === 0 || val[lastAt - 1] === " ")) {
      const query = val.slice(lastAt + 1);
      if (!query.includes(" ")) { setShowMentions(true); setMentionFilter(query); return; }
    }
    setShowMentions(false);
  };

  const insertMention = (name: string) => {
    const lastAt = msgInput.lastIndexOf("@");
    const before = msgInput.slice(0, lastAt);
    setMsgInput(`${before}@${name} `);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  // Audio recording
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

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); };

  const toggleResponsible = (uid: string) => {
    setForm((prev: any) => ({
      ...prev,
      responsible_ids: prev.responsible_ids?.includes(uid)
        ? prev.responsible_ids.filter((r: string) => r !== uid)
        : [...(prev.responsible_ids || []), uid],
    }));
  };

  const renderContent = (text: string) => {
    const parts = text.split(/(@\w+(?:\s\w+)?)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) return <span key={i} className="text-primary font-medium bg-primary/10 px-1 rounded">{part}</span>;
      return <span key={i}>{part}</span>;
    });
  };

  const handleProjectAttach = (attachment: Omit<ProjectAttachment, "id">) => {
    if (isTecnico) addTecnicoAttachment(projectId, attachment);
    else if (isRegular) addProjectAttachment(projectId, attachment);
  };

  const handleChatAttach = (attachment: Omit<ProjectAttachment, "id">) => {
    setChatAttachments(prev => [...prev, attachment]);
  };

  const currentAttachments = isTecnico ? (tecnicoProject!.attachments || []) : (regularProject?.attachments || []);

  // Available sectors for transfer
  const currentSector = isTecnico ? "tecnico" : regularProject?.sector || "tecnico";
  const availableSectors = SECTORS.filter(s => s.id !== currentSector);

  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <AchievementToast show={showAchievement} projectName={achievementName} onClose={() => setShowAchievement(false)} />
      <main className="flex-1 ml-60 sidebar-collapsed:ml-16 p-4 md:p-8 transition-all duration-200">
        <div className="flex items-center gap-3 mb-6 animate-fade-in">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-[10px] hover:bg-muted">
            <ArrowLeft className="w-5 h-5 stroke-[1.5]" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground flex-1">
            {isEditing ? "Editar Projeto" : projectName}
          </h1>
          <div className="flex gap-2 flex-wrap">
            {!isEditing && (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2 rounded-[10px] h-9 text-[13px] btn-3d neon-hover animate-float">
                  <Edit2 className="w-4 h-4 stroke-[1.5]" /> Editar
                </Button>
                <Button variant="outline" onClick={handleDuplicate} className="gap-2 rounded-[10px] h-9 text-[13px] btn-3d neon-hover animate-float" style={{ animationDelay: "0.15s" }}>
                  <Copy className="w-4 h-4 stroke-[1.5]" /> Duplicar
                </Button>
                {!isVariavel && (
                  <Button variant="outline" onClick={() => setTransferOpen(true)} className="gap-2 rounded-[10px] h-9 text-[13px] btn-3d neon-hover animate-float" style={{ animationDelay: "0.3s" }}>
                    <ArrowRightLeft className="w-4 h-4 stroke-[1.5]" /> Enviar para outro setor
                  </Button>
                )}
              </>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2 rounded-[10px] h-9 text-[13px] btn-3d neon-hover animate-float" style={{ animationDelay: "0.45s" }}>
                  <Trash2 className="w-4 h-4 stroke-[1.5]" /> Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Essa ação não pode ser desfeita. O projeto "{projectName}" será removido permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-[10px]">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="rounded-[10px]">Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Project Info */}
          <div className="lg:col-span-2 bg-card rounded-[12px] border border-border p-6 animate-fade-in shadow-card">
            {isEditing ? (
              <>
                {isTecnico && (() => {
                  const f = form as any;
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Empresa</Label>
                          <Input value={f.empresa} onChange={(e) => setForm((p: any) => ({ ...p, empresa: e.target.value }))} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>CNPJ</Label>
                          <Input value={f.cnpj} onChange={(e) => setForm((p: any) => ({ ...p, cnpj: formatCNPJ(e.target.value) }))} placeholder="00.000.000/0000-00" className="rounded-xl" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Responsável</Label>
                          <Select value={f.responsavel} onValueChange={(v) => setForm((p: any) => ({ ...p, responsavel: v }))}>
                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>{[...users.filter(u => u.sectors?.includes("tecnico" as any)).map(u => u.full_name), "Zona de espera"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Região</Label>
                          <Input value={f.regiao} onChange={(e) => setForm((p: any) => ({ ...p, regiao: e.target.value }))} className="rounded-xl" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label>Prioridade</Label>
                          <Select value={f.prioridade} onValueChange={(v) => setForm((p: any) => ({ ...p, prioridade: v }))}>
                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>{TECNICO_PRIORIDADES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Data</Label>
                          <Input value={f.data} onChange={(e) => setForm((p: any) => ({ ...p, data: formatDateInput(e.target.value) }))} placeholder="dd/mm/aaaa" className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select value={f.status_tecnico} onValueChange={(v) => setForm((p: any) => ({ ...p, status_tecnico: v }))}>
                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>{TECNICO_STATUS_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <hr className="border-border" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados de Contato</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label>Nome do Contato</Label>
                          <Input value={f.contato_nome} onChange={(e) => setForm((p: any) => ({ ...p, contato_nome: e.target.value }))} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Telefone</Label>
                          <Input value={f.contato_telefone} onChange={(e) => setForm((p: any) => ({ ...p, contato_telefone: formatTelefone(e.target.value) }))} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input type="email" value={f.contato_email} onChange={(e) => setForm((p: any) => ({ ...p, contato_email: e.target.value }))} placeholder="email@exemplo.com" className="rounded-xl" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Dados Extras</Label>
                        <Textarea value={f.dados_extras} onChange={(e) => setForm((p: any) => ({ ...p, dados_extras: e.target.value }))} rows={2} className="rounded-xl" />
                      </div>
                      {/* Attachments */}
                      <hr className="border-border" />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Arquivos Anexados</Label>
                          <FileAttachmentButton onAttach={handleProjectAttach} userId={user?.id || "1"} />
                        </div>
                        <FileAttachmentList
                          attachments={currentAttachments}
                          onRemove={(attId) => removeTecnicoAttachment(projectId, attId)}
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-[10px] h-10">Salvar</Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-[10px] h-10">Cancelar</Button>
                      </div>
                    </div>
                  );
                })()}

                {isVariavel && (() => {
                  const f = form as any;
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Empresa</Label>
                          <Input value={f.empresa} onChange={(e) => setForm((p: any) => ({ ...p, empresa: e.target.value }))} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>CNPJ</Label>
                          <Input value={f.cnpj} onChange={(e) => setForm((p: any) => ({ ...p, cnpj: formatCNPJ(e.target.value) }))} placeholder="00.000.000/0000-00" className="rounded-xl" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Responsável</Label>
                          <Select value={f.responsavel} onValueChange={(v) => setForm((p: any) => ({ ...p, responsavel: v }))}>
                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>{[...users.filter(u => u.sectors?.includes("tecnico" as any)).map(u => u.full_name), "Zona de espera"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Região</Label>
                          <Input value={f.regiao} onChange={(e) => setForm((p: any) => ({ ...p, regiao: e.target.value }))} className="rounded-xl" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label>Prioridade</Label>
                          <Select value={f.prioridade} onValueChange={(v) => setForm((p: any) => ({ ...p, prioridade: v }))}>
                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>{TECNICO_PRIORIDADES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Data</Label>
                          <Input value={f.data} onChange={(e) => setForm((p: any) => ({ ...p, data: formatDateInput(e.target.value) }))} placeholder="dd/mm/aaaa" className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select value={f.status_tecnico} onValueChange={(v) => setForm((p: any) => ({ ...p, status_tecnico: v }))}>
                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>{TECNICO_STATUS_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <hr className="border-border" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados de Contato</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label>Nome do Contato</Label>
                          <Input value={f.contato_nome} onChange={(e) => setForm((p: any) => ({ ...p, contato_nome: e.target.value }))} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Telefone</Label>
                          <Input value={f.contato_telefone} onChange={(e) => setForm((p: any) => ({ ...p, contato_telefone: formatTelefone(e.target.value) }))} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input type="email" value={f.contato_email} onChange={(e) => setForm((p: any) => ({ ...p, contato_email: e.target.value }))} placeholder="email@exemplo.com" className="rounded-xl" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Dados Extras</Label>
                        <Textarea value={f.dados_extras} onChange={(e) => setForm((p: any) => ({ ...p, dados_extras: e.target.value }))} rows={2} className="rounded-xl" />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-[10px] h-10">Salvar</Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-[10px] h-10">Cancelar</Button>
                      </div>
                    </div>
                  );
                })()}

                {isRegular && (() => {
                  const f = form as any;
                  return (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nome do Projeto</Label>
                        <Input value={f.project_name} onChange={(e) => setForm((p: any) => ({ ...p, project_name: e.target.value }))} className="rounded-xl" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea value={f.description} onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))} rows={3} maxLength={500} className="rounded-xl" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>CNPJ</Label>
                          <Input value={f.cnpj} onChange={(e) => setForm((p: any) => ({ ...p, cnpj: formatCNPJ(e.target.value) }))} placeholder="00.000.000/0000-00" className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Setor</Label>
                          <Select value={f.sector} onValueChange={(v) => setForm((p: any) => ({ ...p, sector: v }))}>
                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {SECTORS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={f.status} onValueChange={(v) => setForm((p: any) => ({ ...p, status: v }))}>
                          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Data de Início</Label>
                          <Input type="date" value={f.start_date} onChange={(e) => setForm((p: any) => ({ ...p, start_date: e.target.value }))} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Data Limite</Label>
                          <Input type="date" value={f.due_date} onChange={(e) => setForm((p: any) => ({ ...p, due_date: e.target.value }))} className="rounded-xl" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Responsáveis</Label>
                        <div className="flex flex-wrap gap-2">
                          {users.filter((u) => !regularProject?.sector || u.sectors?.includes(regularProject.sector as any)).map((u) => (
                            <button key={u.id} type="button" onClick={() => toggleResponsible(u.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 ${
                                f.responsible_ids?.includes(u.id) ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                              }`}>
                              {u.full_name}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Attachments */}
                      <hr className="border-border" />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Arquivos Anexados</Label>
                          <FileAttachmentButton onAttach={handleProjectAttach} userId={user?.id || "1"} />
                        </div>
                        <FileAttachmentList attachments={regularProject!.attachments || []} onRemove={(attId) => removeProjectAttachment(projectId, attId)} />
                      </div>
                      <hr className="border-border" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados de Contato</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label>Nome do Contato</Label>
                          <Input value={f.contato_nome} onChange={(e) => setForm((p: any) => ({ ...p, contato_nome: e.target.value }))} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Telefone</Label>
                          <Input value={f.contato_telefone} onChange={(e) => setForm((p: any) => ({ ...p, contato_telefone: formatTelefone(e.target.value) }))} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input type="email" value={f.contato_email} onChange={(e) => setForm((p: any) => ({ ...p, contato_email: e.target.value }))} placeholder="email@exemplo.com" className="rounded-xl" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Dados Extras</Label>
                        <Textarea value={f.dados_extras} onChange={(e) => setForm((p: any) => ({ ...p, dados_extras: e.target.value }))} rows={2} className="rounded-xl" />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-[10px] h-10">Salvar</Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-[10px] h-10">Cancelar</Button>
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <>
                {/* VIEW MODE */}
                {isTecnico && (() => {
                  const tp = tecnicoProject!;
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div><span className="text-xs font-medium text-muted-foreground">Empresa</span><p className="text-sm font-semibold text-foreground">{tp.empresa}</p></div>
                        <div><span className="text-xs font-medium text-muted-foreground">CNPJ</span><p className="text-sm text-foreground">{tp.cnpj || "—"}</p></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><span className="text-xs font-medium text-muted-foreground">Responsável</span><p className="text-sm text-foreground">{tp.responsavel}</p></div>
                        <div><span className="text-xs font-medium text-muted-foreground">Região</span><p className="text-sm text-foreground">{tp.regiao || "—"}</p></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div><span className="text-xs font-medium text-muted-foreground">Prioridade</span><p className="text-sm text-foreground">{tp.prioridade}</p></div>
                        <div><span className="text-xs font-medium text-muted-foreground">Data</span><p className="text-sm text-foreground">{tp.data || "—"}</p></div>
                        <div><span className="text-xs font-medium text-muted-foreground">Status</span><p className="text-sm text-foreground">{tp.status_tecnico}</p></div>
                      </div>
                      {(tp.contato_nome || tp.contato_telefone || tp.contato_email) && (
                        <>
                          <hr className="border-border" />
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</p>
                          <div className="grid grid-cols-3 gap-4">
                            <div><span className="text-xs font-medium text-muted-foreground">Nome</span><p className="text-sm text-foreground">{tp.contato_nome || "—"}</p></div>
                            <div><span className="text-xs font-medium text-muted-foreground">Telefone</span><p className="text-sm text-foreground">{tp.contato_telefone || "—"}</p></div>
                            <div><span className="text-xs font-medium text-muted-foreground">Email</span><p className="text-sm text-foreground">{tp.contato_email || "—"}</p></div>
                          </div>
                        </>
                      )}
                      {tp.dados_extras && (
                        <div><span className="text-xs font-medium text-muted-foreground">Dados Extras</span><p className="text-sm text-foreground">{tp.dados_extras}</p></div>
                      )}
                      {currentAttachments.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Arquivos Anexados</span>
                          <div className="mt-1"><FileAttachmentList attachments={currentAttachments} /></div>
                        </div>
                      )}
                      <FileAttachmentButton onAttach={handleProjectAttach} userId={user?.id || "1"} />
                    </div>
                  );
                })()}

                {isVariavel && (() => {
                  const vc = variavelCard!;
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div><span className="text-xs font-medium text-muted-foreground">Empresa</span><p className="text-sm font-semibold text-foreground">{vc.empresa || vc.title}</p></div>
                        <div><span className="text-xs font-medium text-muted-foreground">CNPJ</span><p className="text-sm text-foreground">{vc.cnpj || "—"}</p></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><span className="text-xs font-medium text-muted-foreground">Responsável</span><p className="text-sm text-foreground">{vc.responsavel || "—"}</p></div>
                        <div><span className="text-xs font-medium text-muted-foreground">Região</span><p className="text-sm text-foreground">{vc.regiao || "—"}</p></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div><span className="text-xs font-medium text-muted-foreground">Prioridade</span><p className="text-sm text-foreground">{vc.prioridade}</p></div>
                        <div><span className="text-xs font-medium text-muted-foreground">Data</span><p className="text-sm text-foreground">{vc.data || "—"}</p></div>
                        <div><span className="text-xs font-medium text-muted-foreground">Status</span><p className="text-sm text-foreground">{vc.status_tecnico || statusLabels[vc.status]}</p></div>
                      </div>
                      {(vc.contato_nome || vc.contato_telefone || vc.contato_email) && (
                        <>
                          <hr className="border-border" />
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</p>
                          <div className="grid grid-cols-3 gap-4">
                            <div><span className="text-xs font-medium text-muted-foreground">Nome</span><p className="text-sm text-foreground">{vc.contato_nome || "—"}</p></div>
                            <div><span className="text-xs font-medium text-muted-foreground">Telefone</span><p className="text-sm text-foreground">{vc.contato_telefone || "—"}</p></div>
                            <div><span className="text-xs font-medium text-muted-foreground">Email</span><p className="text-sm text-foreground">{vc.contato_email || "—"}</p></div>
                          </div>
                        </>
                      )}
                      {vc.dados_extras && (
                        <div><span className="text-xs font-medium text-muted-foreground">Dados Extras</span><p className="text-sm text-foreground">{vc.dados_extras}</p></div>
                      )}
                      {(vc.attachments || []).length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Arquivos Anexados</span>
                          <div className="mt-1"><FileAttachmentList attachments={vc.attachments || []} /></div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {isRegular && (() => {
                  const p = regularProject!;
                  return (
                    <div className="space-y-4">
                      <div><span className="text-xs font-medium text-muted-foreground">Status</span><p className="text-sm font-semibold text-foreground">{statusLabels[p.status]}</p></div>
                      {p.description && <div><span className="text-xs font-medium text-muted-foreground">Descrição</span><p className="text-sm text-foreground">{p.description}</p></div>}
                      {p.cnpj && <div><span className="text-xs font-medium text-muted-foreground">CNPJ</span><p className="text-sm text-foreground">{p.cnpj}</p></div>}
                      <div><span className="text-xs font-medium text-muted-foreground">Setor</span><p className="text-sm text-foreground">{SECTORS.find(s => s.id === p.sector)?.label}</p></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><span className="text-xs font-medium text-muted-foreground">Data de Início</span><p className="text-sm text-foreground">{p.start_date ? format(new Date(p.start_date), "dd/MM/yyyy") : "—"}</p></div>
                        <div><span className="text-xs font-medium text-muted-foreground">Data Limite</span><p className="text-sm text-foreground">{format(new Date(p.due_date), "dd/MM/yyyy")}</p></div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Responsáveis</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {users.filter(u => p.responsible_ids.includes(u.id)).map(u => (
                            <span key={u.id} className="px-3 py-1 rounded-xl text-xs font-medium bg-accent text-accent-foreground">{u.full_name}</span>
                          ))}
                        </div>
                      </div>
                      {(p.attachments && p.attachments.length > 0) && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Arquivos Anexados</span>
                          <div className="mt-1"><FileAttachmentList attachments={p.attachments} /></div>
                        </div>
                      )}
                      <FileAttachmentButton onAttach={handleProjectAttach} userId={user?.id || "1"} />
                      {((p as any).contato_nome || (p as any).contato_telefone || (p as any).contato_email) && (
                        <>
                          <hr className="border-border" />
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</p>
                          <div className="grid grid-cols-3 gap-4">
                            <div><span className="text-xs font-medium text-muted-foreground">Nome</span><p className="text-sm text-foreground">{(p as any).contato_nome || "—"}</p></div>
                            <div><span className="text-xs font-medium text-muted-foreground">Telefone</span><p className="text-sm text-foreground">{(p as any).contato_telefone || "—"}</p></div>
                            <div><span className="text-xs font-medium text-muted-foreground">Email</span><p className="text-sm text-foreground">{(p as any).contato_email || "—"}</p></div>
                          </div>
                        </>
                      )}
                      {(p as any).dados_extras && (
                        <div><span className="text-xs font-medium text-muted-foreground">Dados Extras</span><p className="text-sm text-foreground">{(p as any).dados_extras}</p></div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </div>

          {/* Chat */}
          <div className="bg-card rounded-[12px] border border-border flex flex-col h-[500px] animate-fade-in shadow-card">
            <div className="p-4 border-b border-border bg-muted/30 rounded-t-[12px]">
              <h3 className="font-medium text-foreground text-[13px]">Chat do Projeto</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && audioMessages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">Nenhuma mensagem ainda.</p>
              )}
              {messages.map((msg) => {
                const msgUser = users.find((u) => u.id === msg.usuario_id);
                return (
                  <div key={msg.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[9px] font-medium text-primary-foreground">
                        {msgUser?.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className="text-xs font-medium text-foreground">{msgUser?.full_name}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {format(new Date(msg.criado_em), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-xs text-foreground ml-8">{renderContent(msg.conteudo)}</p>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="ml-8 mt-1"><FileAttachmentList attachments={msg.attachments} compact /></div>
                    )}
                  </div>
                );
              })}
              {audioMessages.map((audio) => {
                const audioUser = users.find((u) => u.id === audio.userId);
                return (
                  <div key={audio.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[9px] font-medium text-primary-foreground">
                        {audioUser?.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className="text-xs font-medium text-foreground">{audioUser?.full_name}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {format(new Date(audio.timestamp), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <AudioMessage audioUrl={audio.url} />
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {chatAttachments.length > 0 && (
              <div className="px-3 pt-2 border-t border-border/50">
                <div className="flex flex-wrap gap-1">
                  {chatAttachments.map((att, i) => (
                    <div key={i} className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-lg text-[10px] text-primary">
                      <span className="truncate max-w-[100px]">{att.name}</span>
                      <button onClick={() => setChatAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive hover:text-destructive/80">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="relative">
              {showMentions && filteredMentionUsers.length > 0 && (
                <div className="absolute bottom-0 left-3 right-3 bg-card border border-border rounded-lg shadow-md max-h-32 overflow-y-auto z-10">
                  {filteredMentionUsers.map(u => (
                    <button key={u.id} onClick={() => insertMention(u.full_name)} className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[8px] font-medium text-primary-foreground">
                        {u.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      {u.full_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <Input ref={inputRef} value={msgInput} onChange={(e) => handleInputChange(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Escreva uma mensagem... use @ para mencionar" className="text-xs rounded-xl" maxLength={500} />
              <FileAttachmentButton onAttach={handleChatAttach} userId={user?.id || "1"} compact />
              <Button size="icon" variant={isRecording ? "destructive" : "outline"} onClick={isRecording ? stopRecording : startRecording} className="shrink-0 rounded-xl" title={isRecording ? "Parar gravação" : "Gravar áudio"}>
                {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button size="icon" onClick={handleSendMessage} disabled={!msgInput.trim() && chatAttachments.length === 0} className="shrink-0 bg-primary text-primary-foreground rounded-xl">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Transfer Sector Dialog */}
        <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-primary" />
                Transferir Projeto
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Setor destino</Label>
                <Select value={transferSector} onValueChange={(v) => setTransferSector(v as Sector)}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                  <SelectContent>
                    {availableSectors.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descrição da transferência <span className="text-destructive">*</span></Label>
                <Textarea value={transferDescription} onChange={(e) => setTransferDescription(e.target.value)} placeholder="Descreva o motivo da transferência..." rows={3} className="rounded-xl" />
              </div>
              {transferSector && (
                <div className="space-y-2">
                  <Label>Responsáveis no novo setor</Label>
                  <div className="flex flex-wrap gap-2">
                    {users.filter(u => u.sectors?.includes(transferSector as any)).map(u => (
                      <button key={u.id} type="button"
                        onClick={() => setTransferResponsaveis(prev => prev.includes(u.id) ? prev.filter(r => r !== u.id) : [...prev, u.id])}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 ${
                          transferResponsaveis.includes(u.id) ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                        }`}>
                        {u.full_name}
                      </button>
                    ))}
                    {users.filter(u => u.sectors?.includes(transferSector as any)).length === 0 && (
                      <span className="text-xs text-muted-foreground">Nenhum membro neste setor</span>
                    )}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setTransferOpen(false)} className="flex-1 rounded-[10px]">Cancelar</Button>
                <Button onClick={handleTransferSubmit} disabled={!transferSector || !transferDescription.trim()} className="flex-1 rounded-[10px] bg-primary text-primary-foreground hover:bg-primary/90">Transferir</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default ProjectDetail;
