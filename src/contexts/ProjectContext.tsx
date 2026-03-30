import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Project, User, ProjectMessage, ProjectAttachment, Sector, TecnicoProject, KanbanVariavelCard } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";

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
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export const useProjects = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjects must be inside ProjectProvider");
  return ctx;
};

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [tecnicoProjects, setTecnicoProjects] = useState<TecnicoProject[]>([]);
  const [kanbanVariavelCards, setKanbanVariavelCards] = useState<KanbanVariavelCard[]>([]);

  // Fetch all data from Supabase on mount
  useEffect(() => {
    const load = async () => {
      const [usersRes, projRes, tecRes, kvRes, msgRes] = await Promise.all([
        supabase.from("medwork_users").select("*"),
        supabase.from("medwork_projects").select("*"),
        supabase.from("medwork_tecnico_projects").select("*"),
        supabase.from("medwork_kanban_variavel").select("*"),
        supabase.from("medwork_messages").select("*"),
      ]);
      if (usersRes.data) setUsers(usersRes.data.map((u: any) => ({ ...u, sectors: u.sectors || [] })));
      if (projRes.data) setProjects(projRes.data.map((p: any) => ({ ...p, responsible_ids: p.responsible_ids || [] })));
      if (tecRes.data) setTecnicoProjects(tecRes.data);
      if (kvRes.data) setKanbanVariavelCards(kvRes.data.map((k: any) => ({ ...k, createdAt: k.created_at || k.createdAt || "" })));
      if (msgRes.data) setMessages(msgRes.data.map((m: any) => ({ ...m, criado_em: m.criado_em || "" })));
    };
    load();
  }, []);

  // --- Projects ---
  const addProject = async (project: Omit<Project, "id" | "created_at">) => {
    const id = String(Date.now());
    const created_at = new Date().toISOString();
    const newProject = { ...project, id, created_at };
    setProjects((prev) => [...prev, newProject as Project]);
    await supabase.from("medwork_projects").insert({ ...newProject, responsible_ids: (project as any).responsible_ids || [] });
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
    setMessages((prev) => prev.filter((m) => m.projeto_id !== id));
    await supabase.from("medwork_projects").delete().eq("id", id);
    await supabase.from("medwork_messages").delete().eq("projeto_id", id);
  };

  // --- Users (kept for backward compat, auth manages users primarily) ---
  const addUser = async (user: Omit<User, "id">) => {
    const id = String(Date.now());
    setUsers((prev) => [...prev, { ...user, id }]);
    await supabase.from("medwork_users").insert({ ...user, id });
  };

  const updateUser = async (id: string, data: Partial<Omit<User, "id">>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)));
    await supabase.from("medwork_users").update(data).eq("id", id);
  };

  const deleteUser = async (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    await supabase.from("medwork_users").delete().eq("id", id);
  };

  // --- Messages ---
  const addMessage = async (msg: Omit<ProjectMessage, "id" | "criado_em">) => {
    const id = String(Date.now());
    const criado_em = new Date().toISOString();
    const newMsg = { ...msg, id, criado_em };
    setMessages((prev) => [...prev, newMsg]);
    await supabase.from("medwork_messages").insert(newMsg);
  };

  const getProjectMessages = (projectId: string) => {
    return messages.filter((m) => m.projeto_id === projectId).sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime());
  };

  const getPoints = () => projects.filter((p) => p.status === "done").length * 100;
  const getMedals = () => Math.floor(getPoints() / 300);
  const getProjectsBySector = (sector: Sector) => projects.filter((p) => p.sector === sector);

  // --- Tecnico Projects ---
  const addTecnicoProject = async (project: Omit<TecnicoProject, "id">) => {
    const id = String(Date.now());
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
    const newAttachment = { ...attachment, id: String(Date.now()) };
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, attachments: [...(p.attachments || []), newAttachment] } : p));
  };

  const removeProjectAttachment = (projectId: string, attachmentId: string) => {
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, attachments: (p.attachments || []).filter(a => a.id !== attachmentId) } : p));
  };

  const addTecnicoAttachment = (projectId: string, attachment: Omit<ProjectAttachment, "id">) => {
    const newAttachment = { ...attachment, id: String(Date.now()) };
    setTecnicoProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, attachments: [...(p.attachments || []), newAttachment] } : p));
  };

  const removeTecnicoAttachment = (projectId: string, attachmentId: string) => {
    setTecnicoProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, attachments: (p.attachments || []).filter(a => a.id !== attachmentId) } : p));
  };

  const addMessageAttachment = async (msg: Omit<ProjectMessage, "id" | "criado_em">) => {
    const id = String(Date.now());
    const criado_em = new Date().toISOString();
    const newMsg = { ...msg, id, criado_em };
    setMessages((prev) => [...prev, newMsg]);
    await supabase.from("medwork_messages").insert({ id, projeto_id: msg.projeto_id, usuario_id: msg.usuario_id, conteudo: msg.conteudo, criado_em });
  };

  // --- Kanban Variáveis ---
  const addKanbanVariavelCard = async (card: Omit<KanbanVariavelCard, "id">) => {
    const id = String(Date.now());
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
    };

    setProjects(prev => [...prev, newProject]);
    await supabase.from("medwork_projects").insert(newProject);

    const sectorLabel = ({ tecnico: "Setor Técnico", comercial: "Comercial", saude: "Saúde", financeiro: "Financeiro", diretoria: "Diretoria" } as Record<string, string>)[newSector] || newSector;
    const msgId = String(Date.now());
    const msg = {
      id: msgId,
      projeto_id: tp.id,
      usuario_id: userId,
      conteudo: `📦 Projeto transferido de Setor Técnico para ${sectorLabel}. Motivo: ${description}`,
      criado_em: new Date().toISOString(),
    };
    setMessages(prev => [...prev, msg]);
    await supabase.from("medwork_messages").insert(msg);

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
      transferTecnicoToSector,
    }}>
      {children}
    </ProjectContext.Provider>
  );
};
