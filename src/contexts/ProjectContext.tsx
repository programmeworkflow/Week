import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Project, User, ProjectMessage, ProjectAttachment, Sector, TecnicoProject, KanbanVariavelCard, RenovacaoCard, RenovacaoStatus } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface ProjectContextType {
  projects: Project[];
  users: User[];
  messages: ProjectMessage[];
  tecnicoProjects: TecnicoProject[];
  kanbanVariavelCards: KanbanVariavelCard[];
  addProject: (project: Omit<Project, "id" | "created_at">) => void;
  updateProject: (id: string, data: Partial<Omit<Project, "id">>) => void;
  updateProjectStatus: (id: string, status: Project["status"]) => void;
  deleteProject: (id: string) => void;
  addUser: (user: Omit<User, "id">) => void;
  updateUser: (id: string, data: Partial<Omit<User, "id">>) => void;
  deleteUser: (id: string) => void;
  addMessage: (msg: Omit<ProjectMessage, "id" | "criado_em">) => void;
  getProjectMessages: (projectId: string) => ProjectMessage[];
  getPoints: () => number;
  getMedals: () => number;
  getProjectsBySector: (sector: Sector) => Project[];
  addTecnicoProject: (project: Omit<TecnicoProject, "id">) => void;
  updateTecnicoProject: (id: string, data: Partial<Omit<TecnicoProject, "id">>) => void;
  deleteTecnicoProject: (id: string) => void;
  addProjectAttachment: (projectId: string, attachment: Omit<ProjectAttachment, "id">) => void;
  removeProjectAttachment: (projectId: string, attachmentId: string) => void;
  addTecnicoAttachment: (projectId: string, attachment: Omit<ProjectAttachment, "id">) => void;
  removeTecnicoAttachment: (projectId: string, attachmentId: string) => void;
  addMessageAttachment: (messageContent: Omit<ProjectMessage, "id" | "criado_em">) => void;
  addKanbanVariavelCard: (card: Omit<KanbanVariavelCard, "id">) => void;
  updateKanbanVariavelCard: (id: string, data: Partial<Omit<KanbanVariavelCard, "id">>) => void;
  deleteKanbanVariavelCard: (id: string) => void;
  updateKanbanVariavelStatus: (id: string, status: Project["status"]) => void;
  transferTecnicoToSector: (tecnicoId: string, newSector: Sector, description: string, userId: string) => void;
  // Renovação
  renovacaoCards: RenovacaoCard[];
  addRenovacaoCard: (card: Omit<RenovacaoCard, "id">) => void;
  updateRenovacaoCard: (id: string, data: Partial<Omit<RenovacaoCard, "id">>) => void;
  deleteRenovacaoCard: (id: string) => void;
  updateRenovacaoStatus: (id: string, status: RenovacaoStatus) => void;
  // Treinamento rows (Cremonese, Engetins)
  treinamentoRows: { id: string; grupo: string; treinamento: string; data: string; aluno: string; instrutor: string }[];
  addTreinamentoRow: (row: Omit<{ id: string; grupo: string; treinamento: string; data: string; aluno: string; instrutor: string }, "id">) => void;
  updateTreinamentoRow: (id: string, data: Partial<{ treinamento: string; data: string; aluno: string; instrutor: string }>) => void;
  deleteTreinamentoRow: (id: string) => void;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export const useProjects = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjects must be inside ProjectProvider");
  return ctx;
};

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const { allUsers: users, addUser, updateUser, deleteUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<ProjectMessage[]>(() => {
    try { return JSON.parse(localStorage.getItem("medwork_messages") || "[]"); } catch { return []; }
  });
  const [tecnicoProjects, setTecnicoProjects] = useState<TecnicoProject[]>([]);
  const [kanbanVariavelCards, setKanbanVariavelCards] = useState<KanbanVariavelCard[]>([]);
  const [renovacaoCards, setRenovacaoCards] = useState<RenovacaoCard[]>([]);
  const [treinamentoRows, setTreinamentoRows] = useState<{ id: string; grupo: string; treinamento: string; data: string; aluno: string; instrutor: string }[]>([]);

  // Fetch all data from Supabase on mount
  useEffect(() => {
    const load = async () => {
      const [projRes, tecRes, kvRes, renRes] = await Promise.all([
        supabase.from("medwork_projects").select("*"),
        supabase.from("medwork_tecnico_projects").select("*"),
        supabase.from("medwork_kanban_variavel").select("*"),
        supabase.from("medwork_renovacao").select("*"),
      ]);
      if (projRes.data) setProjects(projRes.data.map((p: any) => ({ ...p, responsible_ids: p.responsible_ids || [] })));
      if (tecRes.data) setTecnicoProjects(tecRes.data);
      if (kvRes.data) setKanbanVariavelCards(kvRes.data.map((k: any) => ({ ...k, createdAt: k.created_at || k.createdAt || "" })));
      if (renRes.data) setRenovacaoCards(renRes.data.map((r: any) => ({ ...r, createdAt: r.created_at || "" })));
      const treiRes = await supabase.from("medwork_treinamento_rows").select("*");
      if (treiRes.data) setTreinamentoRows(treiRes.data);
    };
    load();
  }, []);

  // --- Projects ---
  const addProject = async (project: Omit<Project, "id" | "created_at">) => {
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();
    const newProject = { ...project, id, created_at };
    setProjects((prev) => [...prev, newProject as Project]);
    const dbRow = {
      id,
      company_id: (project as any).company_id || "1",
      project_name: (project as any).project_name || "",
      description: (project as any).description || "",
      cnpj: (project as any).cnpj || "",
      due_date: (project as any).due_date || "",
      start_date: (project as any).start_date || "",
      status: (project as any).status || "not_authenticated",
      sector: (project as any).sector || "tecnico",
      responsible_ids: (project as any).responsible_ids || [],
      created_at,
      is_renovation: (project as any).is_renovation || false,
      contato_nome: (project as any).contato_nome || "",
      contato_telefone: (project as any).contato_telefone || "",
      contato_email: (project as any).contato_email || "",
      dados_extras: (project as any).dados_extras || "",
    };
    const { error } = await supabase.from("medwork_projects").insert(dbRow);
    if (error) console.error("addProject error:", error);
  };

  const updateProject = async (id: string, data: Partial<Omit<Project, "id">>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    await supabase.from("medwork_projects").update(data).eq("id", id);
  };

  const updateProjectStatus = async (id: string, status: Project["status"]) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    await supabase.from("medwork_projects").update({ status }).eq("id", id);
  };

  const deleteProject = async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setMessages((prev) => {
      const updated = prev.filter((m) => m.projeto_id !== id);
      localStorage.setItem("medwork_messages", JSON.stringify(updated));
      return updated;
    });
    await supabase.from("medwork_projects").delete().eq("id", id);
  };

  // Users come from AuthContext (addUser, updateUser, deleteUser passed through)

  // --- Messages ---
  const addMessage = async (msg: Omit<ProjectMessage, "id" | "criado_em">) => {
    const id = crypto.randomUUID();
    const criado_em = new Date().toISOString();
    const newMsg = { ...msg, id, criado_em };
    setMessages((prev) => {
      const updated = [...prev, newMsg];
      localStorage.setItem("medwork_messages", JSON.stringify(updated));
      return updated;
    });
  };

  const getProjectMessages = (projectId: string) => {
    return messages.filter((m) => m.projeto_id === projectId).sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime());
  };

  const getPoints = () => projects.filter((p) => p.status === "done").length * 100;
  const getMedals = () => Math.floor(getPoints() / 300);
  const getProjectsBySector = (sector: Sector) => projects.filter((p) => p.sector === sector);

  // --- Tecnico Projects ---
  const addTecnicoProject = async (project: Omit<TecnicoProject, "id">) => {
    const id = crypto.randomUUID();
    const newProject = { ...project, id };
    setTecnicoProjects((prev) => [...prev, newProject as TecnicoProject]);
    await supabase.from("medwork_tecnico_projects").insert(newProject);
  };

  const updateTecnicoProject = async (id: string, data: Partial<Omit<TecnicoProject, "id">>) => {
    setTecnicoProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    await supabase.from("medwork_tecnico_projects").update(data).eq("id", id);
  };

  const deleteTecnicoProject = async (id: string) => {
    setTecnicoProjects((prev) => prev.filter((p) => p.id !== id));
    await supabase.from("medwork_tecnico_projects").delete().eq("id", id);
  };

  // --- Attachments (local only for now, stored in project objects) ---
  const addProjectAttachment = (projectId: string, attachment: Omit<ProjectAttachment, "id">) => {
    const newAttachment = { ...attachment, id: crypto.randomUUID() };
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, attachments: [...(p.attachments || []), newAttachment] } : p));
  };

  const removeProjectAttachment = (projectId: string, attachmentId: string) => {
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, attachments: (p.attachments || []).filter(a => a.id !== attachmentId) } : p));
  };

  const addTecnicoAttachment = (projectId: string, attachment: Omit<ProjectAttachment, "id">) => {
    const newAttachment = { ...attachment, id: crypto.randomUUID() };
    setTecnicoProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, attachments: [...(p.attachments || []), newAttachment] } : p));
  };

  const removeTecnicoAttachment = (projectId: string, attachmentId: string) => {
    setTecnicoProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, attachments: (p.attachments || []).filter(a => a.id !== attachmentId) } : p));
  };

  const addMessageAttachment = async (msg: Omit<ProjectMessage, "id" | "criado_em">) => {
    const id = crypto.randomUUID();
    const criado_em = new Date().toISOString();
    const newMsg = { ...msg, id, criado_em };
    setMessages((prev) => {
      const updated = [...prev, newMsg];
      localStorage.setItem("medwork_messages", JSON.stringify(updated));
      return updated;
    });
  };

  // --- Kanban Variáveis ---
  const addKanbanVariavelCard = async (card: Omit<KanbanVariavelCard, "id">) => {
    const id = crypto.randomUUID();
    const newCard = { ...card, id };
    setKanbanVariavelCards((prev) => [...prev, newCard as KanbanVariavelCard]);
    await supabase.from("medwork_kanban_variavel").insert({
      id, title: card.title, description: card.description || "", status: card.status,
      prioridade: card.prioridade, created_at: card.createdAt || new Date().toISOString(),
      empresa: (card as any).empresa || "", cnpj: (card as any).cnpj || "",
      responsavel: (card as any).responsavel || "", regiao: (card as any).regiao || "",
      data: (card as any).data || "", status_tecnico: (card as any).status_tecnico || "",
      contato_nome: (card as any).contato_nome || "", contato_telefone: (card as any).contato_telefone || "",
      contato_email: (card as any).contato_email || "", dados_extras: (card as any).dados_extras || "",
    });
  };

  const updateKanbanVariavelCard = async (id: string, data: Partial<Omit<KanbanVariavelCard, "id">>) => {
    setKanbanVariavelCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    const dbData: any = { ...data };
    if (dbData.createdAt) { dbData.created_at = dbData.createdAt; delete dbData.createdAt; }
    await supabase.from("medwork_kanban_variavel").update(dbData).eq("id", id);
  };

  const deleteKanbanVariavelCard = async (id: string) => {
    setKanbanVariavelCards((prev) => prev.filter((c) => c.id !== id));
    await supabase.from("medwork_kanban_variavel").delete().eq("id", id);
  };

  const updateKanbanVariavelStatus = async (id: string, status: Project["status"]) => {
    setKanbanVariavelCards((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    await supabase.from("medwork_kanban_variavel").update({ status }).eq("id", id);
  };

  // --- Renovação ---
  const addRenovacaoCard = async (card: Omit<RenovacaoCard, "id">) => {
    const id = crypto.randomUUID();
    const newCard = { ...card, id };
    setRenovacaoCards((prev) => [...prev, newCard as RenovacaoCard]);
    await supabase.from("medwork_renovacao").insert({
      id, title: card.title || card.empresa || "", description: card.description || "",
      status: card.status || "doc_vencidos", empresa: card.empresa || "", cnpj: card.cnpj || "",
      responsavel: card.responsavel || "", regiao: card.regiao || "", prioridade: card.prioridade || "Baixa",
      data: card.data || "", contato_nome: card.contato_nome || "", contato_telefone: card.contato_telefone || "",
      contato_email: card.contato_email || "", dados_extras: card.dados_extras || "",
      created_at: card.createdAt || new Date().toISOString(),
    });
  };

  const updateRenovacaoCard = async (id: string, data: Partial<Omit<RenovacaoCard, "id">>) => {
    setRenovacaoCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    const dbData: any = { ...data };
    if (dbData.createdAt) { dbData.created_at = dbData.createdAt; delete dbData.createdAt; }
    await supabase.from("medwork_renovacao").update(dbData).eq("id", id);
  };

  const deleteRenovacaoCard = async (id: string) => {
    setRenovacaoCards((prev) => prev.filter((c) => c.id !== id));
    await supabase.from("medwork_renovacao").delete().eq("id", id);
  };

  const updateRenovacaoStatus = async (id: string, status: RenovacaoStatus) => {
    setRenovacaoCards((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    await supabase.from("medwork_renovacao").update({ status }).eq("id", id);
  };

  // --- Treinamento Rows ---
  const addTreinamentoRow = async (row: Omit<{ id: string; grupo: string; treinamento: string; data: string; aluno: string; instrutor: string }, "id">) => {
    const id = crypto.randomUUID();
    const newRow = { ...row, id };
    setTreinamentoRows((prev) => [...prev, newRow]);
    await supabase.from("medwork_treinamento_rows").insert(newRow);
  };

  const updateTreinamentoRow = async (id: string, data: Partial<{ treinamento: string; data: string; aluno: string; instrutor: string }>) => {
    setTreinamentoRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
    await supabase.from("medwork_treinamento_rows").update(data).eq("id", id);
  };

  const deleteTreinamentoRow = async (id: string) => {
    setTreinamentoRows((prev) => prev.filter((r) => r.id !== id));
    await supabase.from("medwork_treinamento_rows").delete().eq("id", id);
  };

  // --- Transfer ---
  const transferTecnicoToSector = async (tecnicoId: string, newSector: Sector, description: string, userId: string) => {
    const tp = tecnicoProjects.find(t => t.id === tecnicoId);
    if (!tp) return;

    const statusMap: Record<string, Project["status"]> = {
      "Não cadastradas no ESO": "not_authenticated",
      "Não iniciadas": "not_started",
      "Visita pendente": "pending",
      "Documentação pendente": "doc_pending",
      "Revisão": "review",
      "Finalizada": "done",
    };

    const newProject: any = {
      id: tp.id,
      company_id: "1",
      project_name: tp.empresa,
      description: tp.dados_extras || "",
      cnpj: tp.cnpj,
      due_date: tp.data ? (() => { const parts = tp.data.split("/"); return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : "2026-12-31"; })() : "2026-12-31",
      status: statusMap[tp.status_tecnico] || "not_started",
      sector: newSector,
      responsible_ids: [],
      created_at: new Date().toISOString(),
      transferred: true,
      from_sector: "Setor Técnico",
    };

    // Reset notification dismissal for target sector
    localStorage.removeItem(`transfer_notif_dismissed_${newSector}`);

    setProjects(prev => [...prev, newProject]);
    await supabase.from("medwork_projects").insert(newProject);

    const sectorLabel = ({ tecnico: "Setor Técnico", comercial: "Comercial", saude: "Saúde", financeiro: "Financeiro", diretoria: "Diretoria" } as Record<string, string>)[newSector] || newSector;
    const msgId = crypto.randomUUID();
    const msg = {
      id: msgId,
      projeto_id: tp.id,
      usuario_id: userId,
      conteudo: `📦 Projeto transferido de Setor Técnico para ${sectorLabel}. Motivo: ${description}`,
      criado_em: new Date().toISOString(),
    };
    setMessages(prev => {
      const updated = [...prev, msg];
      localStorage.setItem("medwork_messages", JSON.stringify(updated));
      return updated;
    });

    setTecnicoProjects(prev => prev.filter(t => t.id !== tecnicoId));
    await supabase.from("medwork_tecnico_projects").delete().eq("id", tecnicoId);
  };

  return (
    <ProjectContext.Provider value={{
      projects, users, messages, tecnicoProjects, kanbanVariavelCards,
      addProject, updateProject, updateProjectStatus, deleteProject,
      addUser, updateUser, deleteUser,
      addMessage, getProjectMessages, getPoints, getMedals, getProjectsBySector,
      addTecnicoProject, updateTecnicoProject, deleteTecnicoProject,
      addProjectAttachment, removeProjectAttachment,
      addTecnicoAttachment, removeTecnicoAttachment,
      addMessageAttachment,
      addKanbanVariavelCard, updateKanbanVariavelCard, deleteKanbanVariavelCard, updateKanbanVariavelStatus,
      renovacaoCards, addRenovacaoCard, updateRenovacaoCard, deleteRenovacaoCard, updateRenovacaoStatus,
      treinamentoRows, addTreinamentoRow, updateTreinamentoRow, deleteTreinamentoRow,
      transferTecnicoToSector,
    }}>
      {children}
    </ProjectContext.Provider>
  );
};
