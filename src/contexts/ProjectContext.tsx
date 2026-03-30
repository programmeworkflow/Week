import { createContext, useContext, useState, ReactNode } from "react";
import { Project, User, ProjectMessage, ProjectAttachment, Sector, TecnicoProject, KanbanVariavelCard, mockProjects, mockUsers, mockMessages, mockTecnicoProjects, mockKanbanVariavelCards } from "@/lib/mock-data";

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
  // Attachments
  addProjectAttachment: (projectId: string, attachment: Omit<ProjectAttachment, "id">) => void;
  removeProjectAttachment: (projectId: string, attachmentId: string) => void;
  addTecnicoAttachment: (projectId: string, attachment: Omit<ProjectAttachment, "id">) => void;
  removeTecnicoAttachment: (projectId: string, attachmentId: string) => void;
  addMessageAttachment: (messageContent: Omit<ProjectMessage, "id" | "criado_em">) => void;
  // Kanban Variáveis
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
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem("medwork-users");
      if (saved) return JSON.parse(saved);
    } catch {}
    return mockUsers;
  });
  const [messages, setMessages] = useState<ProjectMessage[]>(mockMessages);
  const [tecnicoProjects, setTecnicoProjects] = useState<TecnicoProject[]>(mockTecnicoProjects);
  const [kanbanVariavelCards, setKanbanVariavelCards] = useState<KanbanVariavelCard[]>(mockKanbanVariavelCards);

  const addProject = (project: Omit<Project, "id" | "created_at">) => {
    setProjects((prev) => [...prev, { ...project, id: String(Date.now()), created_at: new Date().toISOString() }]);
  };

  const updateProject = (id: string, data: Partial<Omit<Project, "id">>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  };

  const updateProjectStatus = (id: string, status: Project["status"]) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setMessages((prev) => prev.filter((m) => m.projeto_id !== id));
  };

  const addUser = (user: Omit<User, "id">) => {
    setUsers((prev) => [...prev, { ...user, id: String(Date.now()) }]);
  };

  const updateUser = (id: string, data: Partial<Omit<User, "id">>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)));
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const addMessage = (msg: Omit<ProjectMessage, "id" | "criado_em">) => {
    setMessages((prev) => [...prev, { ...msg, id: String(Date.now()), criado_em: new Date().toISOString() }]);
  };

  const getProjectMessages = (projectId: string) => {
    return messages.filter((m) => m.projeto_id === projectId).sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime());
  };

  const getPoints = () => projects.filter((p) => p.status === "done").length * 100;
  const getMedals = () => Math.floor(getPoints() / 300);
  const getProjectsBySector = (sector: Sector) => projects.filter((p) => p.sector === sector);

  const addTecnicoProject = (project: Omit<TecnicoProject, "id">) => {
    setTecnicoProjects((prev) => [...prev, { ...project, id: String(Date.now()) }]);
  };

  const updateTecnicoProject = (id: string, data: Partial<Omit<TecnicoProject, "id">>) => {
    setTecnicoProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  };

  const deleteTecnicoProject = (id: string) => {
    setTecnicoProjects((prev) => prev.filter((p) => p.id !== id));
  };

  // Attachments
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

  const addMessageAttachment = (msg: Omit<ProjectMessage, "id" | "criado_em">) => {
    setMessages((prev) => [...prev, { ...msg, id: String(Date.now()), criado_em: new Date().toISOString() }]);
  };

  // Kanban Variáveis
  const addKanbanVariavelCard = (card: Omit<KanbanVariavelCard, "id">) => {
    setKanbanVariavelCards((prev) => [...prev, { ...card, id: String(Date.now()) }]);
  };

  const updateKanbanVariavelCard = (id: string, data: Partial<Omit<KanbanVariavelCard, "id">>) => {
    setKanbanVariavelCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  };

  const deleteKanbanVariavelCard = (id: string) => {
    setKanbanVariavelCards((prev) => prev.filter((c) => c.id !== id));
  };

  const updateKanbanVariavelStatus = (id: string, status: Project["status"]) => {
    setKanbanVariavelCards((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  const transferTecnicoToSector = (tecnicoId: string, newSector: Sector, description: string, userId: string) => {
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

    // Create new project in target sector, keeping the same ID so messages follow
    const newProject: Project = {
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
      attachments: tp.attachments,
      contato_nome: tp.contato_nome,
      contato_telefone: tp.contato_telefone,
      contato_email: tp.contato_email,
      dados_extras: tp.dados_extras,
    } as any;

    setProjects(prev => [...prev, newProject]);
    
    // Add transfer message - messages already linked by projeto_id which stays the same
    const sectorLabel = ({ tecnico: "Setor Técnico", comercial: "Comercial", saude: "Saúde", financeiro: "Financeiro", diretoria: "Diretoria" } as Record<string, string>)[newSector] || newSector;
    setMessages(prev => [...prev, {
      id: String(Date.now()),
      projeto_id: tp.id,
      usuario_id: userId,
      conteudo: `📦 Projeto transferido de Setor Técnico para ${sectorLabel}. Motivo: ${description}`,
      criado_em: new Date().toISOString(),
    }]);

    // Remove from técnico
    setTecnicoProjects(prev => prev.filter(t => t.id !== tecnicoId));
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
