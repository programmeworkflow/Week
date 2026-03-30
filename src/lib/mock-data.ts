export type Sector = "tecnico" | "comercial" | "saude" | "financeiro" | "diretoria";

export const SECTORS: { id: Sector; label: string }[] = [
  { id: "tecnico", label: "Setor Técnico" },
  { id: "comercial", label: "Comercial" },
  { id: "saude", label: "Saúde" },
  { id: "financeiro", label: "Financeiro" },
  { id: "diretoria", label: "Diretoria" },
];

export interface User {
  id: string;
  full_name: string;
  cpf: string;
  email: string;
  password: string;
  is_admin: boolean;
  company_id: string;
  sectors: Sector[];
}

export type TecnicoResponsavel = "Caio" | "Anielson" | "Pedro" | "Aline" | "Samuel" | "Fernando" | "Zona de Espera";
export type TecnicoPrioridade = "Baixa" | "Média" | "Alta" | "Crítica";
export type TecnicoStatus = "Não cadastradas no ESO" | "Não iniciadas" | "Visita pendente" | "Documentação pendente" | "Revisão" | "Finalizada";

export const TECNICO_RESPONSAVEIS: TecnicoResponsavel[] = ["Caio", "Anielson", "Pedro", "Aline", "Samuel", "Fernando", "Zona de Espera"];
export const TECNICO_PRIORIDADES: TecnicoPrioridade[] = ["Baixa", "Média", "Alta", "Crítica"];
export const TECNICO_STATUS_OPTIONS: TecnicoStatus[] = ["Não cadastradas no ESO", "Não iniciadas", "Visita pendente", "Documentação pendente", "Revisão", "Finalizada"];

export interface ProjectAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface TecnicoProject {
  id: string;
  empresa: string;
  cnpj: string;
  responsavel: TecnicoResponsavel;
  regiao: string;
  prioridade: TecnicoPrioridade;
  data: string;
  status_tecnico: TecnicoStatus;
  contato_nome: string;
  contato_telefone: string;
  contato_email: string;
  dados_extras: string;
  sector: "tecnico";
  attachments?: ProjectAttachment[];
}

export interface Project {
  id: string;
  company_id: string;
  project_name: string;
  description?: string;
  cnpj?: string;
  start_date?: string;
  due_date: string;
  status: "not_authenticated" | "not_started" | "pending" | "doc_pending" | "review" | "done" | "archived";
  archived_at?: string;
  sector: Sector;
  is_renovation?: boolean;
  responsible_ids: string[];
  created_at: string;
  attachments?: ProjectAttachment[];
}

export interface ProjectMessage {
  id: string;
  projeto_id: string;
  usuario_id: string;
  conteudo: string;
  criado_em: string;
  attachments?: ProjectAttachment[];
}

// Kanban Variáveis - independent cards not linked to projects
export interface KanbanVariavelCard {
  id: string;
  title: string;
  description: string;
  status: Project["status"];
  prioridade: TecnicoPrioridade;
  createdAt: string;
  empresa?: string;
  cnpj?: string;
  responsavel?: string;
  regiao?: string;
  data?: string;
  status_tecnico?: string;
  contato_nome?: string;
  contato_telefone?: string;
  contato_email?: string;
  dados_extras?: string;
  attachments?: ProjectAttachment[];
}

// Renovação cards
export type RenovacaoStatus = "doc_vencidos" | "revisitar" | "medicoes_pendentes" | "em_andamento" | "finalizada";

export interface RenovacaoCard {
  id: string;
  title: string;
  description: string;
  status: RenovacaoStatus;
  empresa?: string;
  cnpj?: string;
  responsavel?: string;
  regiao?: string;
  prioridade?: TecnicoPrioridade;
  data?: string;
  contato_nome?: string;
  contato_telefone?: string;
  contato_email?: string;
  dados_extras?: string;
  createdAt?: string;
}

export const mockUsers: User[] = [
  { id: "1", full_name: "Arthur Fogolin", cpf: "000.000.000-00", email: "admin@medwork.com", password: "admin123", is_admin: true, company_id: "1", sectors: ["diretoria", "tecnico", "comercial", "saude", "financeiro"] },
  { id: "2", full_name: "Carlos Mendes", cpf: "987.654.321-00", email: "carlos@medwork.com", password: "123456", is_admin: false, company_id: "1", sectors: ["tecnico"] },
  { id: "3", full_name: "Beatriz Costa", cpf: "456.789.123-00", email: "beatriz@medwork.com", password: "123456", is_admin: false, company_id: "1", sectors: ["saude"] },
  { id: "4", full_name: "Diego Ferreira", cpf: "321.654.987-00", email: "diego@medwork.com", password: "123456", is_admin: false, company_id: "1", sectors: ["comercial"] },
];

export const mockProjects: Project[] = [
  { id: "1", company_id: "1", project_name: "PPRA - Empresa ABC", description: "Programa de prevenção de riscos ambientais", due_date: "2026-04-15", status: "not_started", sector: "tecnico", responsible_ids: ["1", "2"], created_at: "2026-03-01", start_date: "2026-03-05" },
  { id: "2", company_id: "1", project_name: "ASO - Colaboradores XYZ", description: "Atestados de saúde ocupacional", due_date: "2026-05-01", status: "not_authenticated", sector: "saude", responsible_ids: ["3"], created_at: "2026-03-10" },
  { id: "3", company_id: "1", project_name: "Proposta Comercial - Ind. Beta", description: "Elaboração de proposta comercial", due_date: "2026-03-30", status: "pending", sector: "comercial", responsible_ids: ["2", "4"], created_at: "2026-02-20", start_date: "2026-02-25" },
  { id: "4", company_id: "1", project_name: "Relatório Fiscal Q1", description: "Relatório fiscal do primeiro trimestre", due_date: "2026-04-20", status: "not_authenticated", sector: "financeiro", responsible_ids: ["1"], created_at: "2026-03-15" },
  { id: "5", company_id: "1", project_name: "PCMSO - Empresa Delta", description: "Programa de controle médico", due_date: "2026-03-25", status: "done", sector: "tecnico", responsible_ids: ["4"], created_at: "2026-01-10", start_date: "2026-01-15" },
  { id: "6", company_id: "1", project_name: "Reunião Diretoria", description: "Planejamento estratégico anual", due_date: "2026-03-20", status: "done", sector: "diretoria", responsible_ids: ["2", "3"], created_at: "2026-02-01", start_date: "2026-02-05" },
  { id: "7", company_id: "1", project_name: "Renovação PPRA - Empresa Gama", description: "Renovação anual do programa", due_date: "2026-06-01", status: "pending", sector: "tecnico", is_renovation: true, responsible_ids: ["1"], created_at: "2026-03-20" },
];

export const mockMessages: ProjectMessage[] = [
  { id: "1", projeto_id: "1", usuario_id: "1", conteudo: "Iniciando o PPRA. Visita técnica agendada!", criado_em: "2026-03-05T10:00:00Z" },
  { id: "2", projeto_id: "1", usuario_id: "2", conteudo: "Ótimo! Vou preparar os instrumentos de medição.", criado_em: "2026-03-05T14:30:00Z" },
  { id: "3", projeto_id: "3", usuario_id: "4", conteudo: "Proposta em fase de elaboração. Previsão de entrega sexta.", criado_em: "2026-02-25T09:00:00Z" },
];

export const mockTecnicoProjects: TecnicoProject[] = [
  { id: "c1", empresa: "Hs De Deus", cnpj: "", responsavel: "Aline", regiao: "Palmas - Sul", prioridade: "Baixa", data: "27/11/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c2", empresa: "Ação Transportes e Serviços Automotivos - Grupo Posto Araguaia", cnpj: "", responsavel: "Caio", regiao: "", prioridade: "Baixa", data: "05/01/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c3", empresa: "AET - Quartetto Bertaville", cnpj: "", responsavel: "Caio", regiao: "Palmas - Sul", prioridade: "Baixa", data: "31/12/2024", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c4", empresa: "Ambienger", cnpj: "", responsavel: "Caio", regiao: "", prioridade: "Média", data: "01/06/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c5", empresa: "Ambmap", cnpj: "", responsavel: "Caio", regiao: "", prioridade: "Média", data: "01/06/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c6", empresa: "Blaster (medições reunião 17/06)", cnpj: "", responsavel: "Caio", regiao: "Palmas - Sul", prioridade: "Baixa", data: "16/06/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c7", empresa: "CEULP - Faculdade Ulbra", cnpj: "", responsavel: "Caio", regiao: "Palmas - Sul", prioridade: "Baixa", data: "14/10/2024", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c8", empresa: "Churrascaria Sarandi (13)", cnpj: "", responsavel: "Caio", regiao: "", prioridade: "Baixa", data: "11/08/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c9", empresa: "Corpo & Mente Comportamental Ltda", cnpj: "", responsavel: "Caio", regiao: "", prioridade: "Baixa", data: "26/01/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c10", empresa: "Cromo Serviços (16)", cnpj: "", responsavel: "Caio", regiao: "Palmas - Sul", prioridade: "Baixa", data: "04/11/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c11", empresa: "Dia Dia - Sampaio Serviços", cnpj: "", responsavel: "Caio", regiao: "Palmas - Sul", prioridade: "Baixa", data: "22/03/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c12", empresa: "EBS Agronegocios", cnpj: "", responsavel: "Caio", regiao: "", prioridade: "Média", data: "02/03/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c13", empresa: "Estimulos Unidade Ii", cnpj: "", responsavel: "Caio", regiao: "", prioridade: "Crítica", data: "26/01/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c14", empresa: "FM2C (apenas laudos)", cnpj: "", responsavel: "Caio", regiao: "Porto Nacional", prioridade: "Baixa", data: "04/11/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c15", empresa: "Igreja Batista Sião", cnpj: "", responsavel: "Caio", regiao: "", prioridade: "Baixa", data: "02/03/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c16", empresa: "Jp Corpo E Mente", cnpj: "", responsavel: "Caio", regiao: "", prioridade: "Baixa", data: "26/01/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c17", empresa: "Kairos Med Supply", cnpj: "", responsavel: "Caio", regiao: "Palmas - Sul", prioridade: "Baixa", data: "10/11/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c18", empresa: "Leticia Bringel Corpo & Mente Ltda", cnpj: "", responsavel: "Caio", regiao: "", prioridade: "Baixa", data: "26/01/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c19", empresa: "Master Prevenções / Master Extintores", cnpj: "", responsavel: "Caio", regiao: "Palmas - Norte", prioridade: "Baixa", data: "10/09/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c20", empresa: "Mc Engenharia", cnpj: "", responsavel: "Caio", regiao: "", prioridade: "Baixa", data: "08/01/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c21", empresa: "Med Coffee", cnpj: "", responsavel: "Caio", regiao: "", prioridade: "Baixa", data: "19/01/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c22", empresa: "Mercatto (programas 2026)", cnpj: "", responsavel: "Caio", regiao: "Palmas - Sul", prioridade: "Baixa", data: "23/06/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c23", empresa: "MINEBR (PGR, PCMSO e Projetos)", cnpj: "", responsavel: "Caio", regiao: "Monte Santo", prioridade: "Média", data: "16/02/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c24", empresa: "Mineração Cézar (Grupo Cézar)", cnpj: "", responsavel: "Caio", regiao: "Luzimangues", prioridade: "Baixa", data: "18/08/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c25", empresa: "Movi Connect Ltda", cnpj: "", responsavel: "Caio", regiao: "Palmas - Sul", prioridade: "Baixa", data: "06/11/2024", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c26", empresa: "Nossa Casa Restaurante", cnpj: "", responsavel: "Caio", regiao: "", prioridade: "Baixa", data: "02/04/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c27", empresa: "Quartetto (atualizar datas dos laudos)", cnpj: "", responsavel: "Caio", regiao: "Palmas - Sul", prioridade: "Baixa", data: "08/07/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c28", empresa: "Quartetto (Bertaville)", cnpj: "", responsavel: "Caio", regiao: "Taquaralto", prioridade: "Baixa", data: "15/10/2024", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c29", empresa: "Ricor Empreendimentos", cnpj: "", responsavel: "Caio", regiao: "", prioridade: "Baixa", data: "03/03/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c30", empresa: "Sarandi Delivery", cnpj: "", responsavel: "Caio", regiao: "", prioridade: "Baixa", data: "07/01/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c31", empresa: "Tavares Servicos", cnpj: "", responsavel: "Caio", regiao: "", prioridade: "Baixa", data: "25/02/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c32", empresa: "Vera Helena - Coopergemas (Mineradora)", cnpj: "", responsavel: "Caio", regiao: "Monte Santo", prioridade: "Média", data: "15/10/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c33", empresa: "WF Engenharia", cnpj: "", responsavel: "Caio", regiao: "Palmas - Sul", prioridade: "Baixa", data: "23/06/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c34", empresa: "Café no Ponto (Maria Rita)", cnpj: "", responsavel: "Anielson", regiao: "Miranorte - TO", prioridade: "Baixa", data: "20/10/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c35", empresa: "Cremonese (Grupo)", cnpj: "", responsavel: "Anielson", regiao: "Dois Irmãos", prioridade: "Baixa", data: "06/05/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c36", empresa: "Fazenda Planalto (Valmor Jose Martinazzo)", cnpj: "", responsavel: "Anielson", regiao: "Porto Nacional", prioridade: "Média", data: "17/11/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c37", empresa: "Frigorífico Jatobá (LOTO)", cnpj: "", responsavel: "Anielson", regiao: "Porto Nacional", prioridade: "Baixa", data: "07/07/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c38", empresa: "Frigorífico Jatobá (medições pendentes)", cnpj: "", responsavel: "Anielson", regiao: "Porto Nacional", prioridade: "Baixa", data: "05/11/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c39", empresa: "MCN Mineração (Pedreira Palmas)", cnpj: "", responsavel: "Anielson", regiao: "Palmas - Zona Rural", prioridade: "Média", data: "22/06/2023", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c40", empresa: "PRAJÁ (Verificar sobre repositor de frios e FLV)", cnpj: "", responsavel: "Anielson", regiao: "Palmas - Norte", prioridade: "Baixa", data: "02/10/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c41", empresa: "SUSPENSO - Agro Forte", cnpj: "", responsavel: "Anielson", regiao: "Palmas - Sul", prioridade: "Baixa", data: "05/11/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c42", empresa: "Altíssimo Engenharia", cnpj: "", responsavel: "Pedro", regiao: "Palmas - Sul", prioridade: "Baixa", data: "04/11/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c43", empresa: "Atacadao Campeao II", cnpj: "", responsavel: "Pedro", regiao: "", prioridade: "Baixa", data: "17/11/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c44", empresa: "Atacado Campeão (D S Vieira)", cnpj: "", responsavel: "Pedro", regiao: "", prioridade: "Baixa", data: "17/11/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c45", empresa: "Burrao Tratores", cnpj: "", responsavel: "Pedro", regiao: "", prioridade: "Baixa", data: "01/04/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c46", empresa: "Carletto's Sorvetes", cnpj: "", responsavel: "Pedro", regiao: "", prioridade: "Baixa", data: "27/01/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c47", empresa: "Cl. Eletrica", cnpj: "", responsavel: "Pedro", regiao: "", prioridade: "Baixa", data: "28/01/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c48", empresa: "Consilg", cnpj: "", responsavel: "Pedro", regiao: "Gurupi", prioridade: "Baixa", data: "15/09/2024", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c49", empresa: "Divulgae", cnpj: "", responsavel: "Pedro", regiao: "Porto Nacional", prioridade: "Baixa", data: "04/11/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c50", empresa: "Empresarial Embalagens", cnpj: "", responsavel: "Pedro", regiao: "", prioridade: "Baixa", data: "26/02/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c51", empresa: "Engetins (Medições)", cnpj: "", responsavel: "Pedro", regiao: "Taquaralto", prioridade: "Baixa", data: "04/11/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c52", empresa: "Extrinha Supermercado", cnpj: "", responsavel: "Pedro", regiao: "", prioridade: "Baixa", data: "10/11/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c53", empresa: "Fazenda Primavera (Pontal)", cnpj: "", responsavel: "Pedro", regiao: "Ponte Alta", prioridade: "Baixa", data: "18/11/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c54", empresa: "Fazenda Vitória (Diamar Taheshi)", cnpj: "", responsavel: "Pedro", regiao: "Cristalância TO", prioridade: "Baixa", data: "09/07/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c55", empresa: "Fidelite (GRUPO VELEIROS)", cnpj: "", responsavel: "Pedro", regiao: "", prioridade: "Baixa", data: "06/11/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c56", empresa: "Ideal (GRUPO VELEIROS)", cnpj: "", responsavel: "Pedro", regiao: "", prioridade: "Baixa", data: "06/11/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c57", empresa: "Instituto Marques", cnpj: "", responsavel: "Pedro", regiao: "Porto Nacional", prioridade: "Baixa", data: "22/02/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c58", empresa: "Intemerato (GRUPO VELEIROS)", cnpj: "", responsavel: "Pedro", regiao: "", prioridade: "Baixa", data: "06/11/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c59", empresa: "Layot Variedades", cnpj: "", responsavel: "Pedro", regiao: "", prioridade: "Baixa", data: "23/02/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c60", empresa: "Líder Sondagem (Meyer)", cnpj: "", responsavel: "Pedro", regiao: "Palmas - Sul", prioridade: "Baixa", data: "10/10/2023", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c61", empresa: "Logos (GRUPO VELEIROS)", cnpj: "", responsavel: "Pedro", regiao: "", prioridade: "Baixa", data: "06/11/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c62", empresa: "Marmoraria Stilus (55)", cnpj: "", responsavel: "Pedro", regiao: "Taquari", prioridade: "Baixa", data: "05/11/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c63", empresa: "Marmoraria Tocantins 01 (JC Marmoraria)", cnpj: "", responsavel: "Pedro", regiao: "Palmas - Norte", prioridade: "Baixa", data: "26/08/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c64", empresa: "Marmoraria Tocantins (06) De outro dono", cnpj: "", responsavel: "Pedro", regiao: "Porto Nacional", prioridade: "Baixa", data: "29/06/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c65", empresa: "Condominio You By Fama Residences", cnpj: "", responsavel: "Zona de espera", regiao: "", prioridade: "Baixa", data: "01/09/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c66", empresa: "Conta Mais Contabilidade", cnpj: "", responsavel: "Zona de espera", regiao: "", prioridade: "Baixa", data: "01/11/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c67", empresa: "Zagomax", cnpj: "", responsavel: "Zona de espera", regiao: "", prioridade: "Baixa", data: "01/06/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c68", empresa: "L2 Construtora e Maquinas Ltda", cnpj: "", responsavel: "Zona de espera", regiao: "", prioridade: "Baixa", data: "18/02/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c69", empresa: "Marmoraria Tocantins (16) Palmas", cnpj: "", responsavel: "Pedro", regiao: "Palmas - Norte", prioridade: "Baixa", data: "26/08/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c70", empresa: "Meurer Transportes E Logistica", cnpj: "", responsavel: "Pedro", regiao: "", prioridade: "Baixa", data: "26/02/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c71", empresa: "Motta Serviços e Locações de Máquinas", cnpj: "", responsavel: "Pedro", regiao: "Porto Nacional", prioridade: "Baixa", data: "12/10/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c72", empresa: "Ouro Verde (Revisitar)", cnpj: "", responsavel: "Pedro", regiao: "Taquarussu", prioridade: "Baixa", data: "12/10/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c73", empresa: "Plásticos Ferrara", cnpj: "", responsavel: "Pedro", regiao: "Palmas - Sul", prioridade: "Média", data: "23/09/2024", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c74", empresa: "Prates - Medições pendentes", cnpj: "", responsavel: "Pedro", regiao: "Porto Nacional", prioridade: "Baixa", data: "21/07/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c75", empresa: "Restaurante Espeto Do Domingao", cnpj: "", responsavel: "Pedro", regiao: "Porto Nacional", prioridade: "Baixa", data: "01/09/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c76", empresa: "SUSPENSO - Lar de Idosos", cnpj: "", responsavel: "Pedro", regiao: "Palmas - Norte", prioridade: "Baixa", data: "14/07/2024", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c77", empresa: "SUSPENSO - Marques & Martins Odontologia", cnpj: "", responsavel: "Pedro", regiao: "Palmas - Sul", prioridade: "Baixa", data: "03/09/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c78", empresa: "Viegas Bar e Petiscaria", cnpj: "", responsavel: "Pedro", regiao: "Palmas - Norte", prioridade: "Baixa", data: "27/03/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c79", empresa: "Braga & Torre Engenharia Ltda", cnpj: "", responsavel: "Zona de espera", regiao: "", prioridade: "Baixa", data: "16/03/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c80", empresa: "Hr Family Holding Patrimonial", cnpj: "", responsavel: "Zona de espera", regiao: "", prioridade: "Baixa", data: "19/03/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c81", empresa: "Fazenda Rio Vermelho", cnpj: "", responsavel: "Zona de espera", regiao: "", prioridade: "Baixa", data: "22/03/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c82", empresa: "Slopegeo Geotechnics", cnpj: "", responsavel: "Zona de espera", regiao: "", prioridade: "Baixa", data: "22/03/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c83", empresa: "Black Corporation", cnpj: "", responsavel: "Zona de espera", regiao: "", prioridade: "Baixa", data: "19/03/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c84", empresa: "Black Contabilidade & Compliance", cnpj: "", responsavel: "Zona de espera", regiao: "", prioridade: "Baixa", data: "19/03/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c85", empresa: "Trans Express", cnpj: "", responsavel: "Zona de espera", regiao: "", prioridade: "Baixa", data: "19/03/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c86", empresa: "T X - II Corporation", cnpj: "", responsavel: "Zona de espera", regiao: "", prioridade: "Baixa", data: "19/03/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c87", empresa: "Black Contabilidade & Compliance (2)", cnpj: "", responsavel: "Zona de espera", regiao: "", prioridade: "Baixa", data: "23/03/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c88", empresa: "Psi Engenharia Mecanica", cnpj: "", responsavel: "Zona de espera", regiao: "", prioridade: "Baixa", data: "11/02/2025", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c89", empresa: "Agronacional", cnpj: "", responsavel: "Zona de espera", regiao: "", prioridade: "Baixa", data: "24/03/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c90", empresa: "Delícias da Tiz", cnpj: "", responsavel: "Zona de espera", regiao: "", prioridade: "Baixa", data: "12/01/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
  { id: "c91", empresa: "Ab Servicos Integrados", cnpj: "", responsavel: "Zona de espera", regiao: "", prioridade: "Baixa", data: "26/03/2026", status_tecnico: "Não iniciadas", contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "", sector: "tecnico" },
];

export const mockKanbanVariavelCards: KanbanVariavelCard[] = [
  { id: "kv1", title: "Verificar documentação pendente", description: "Checar docs da empresa X", status: "not_started", prioridade: "Média", createdAt: new Date().toISOString() },
  { id: "kv2", title: "Agendar visita técnica", description: "Empresa Y precisa de visita", status: "pending", prioridade: "Alta", createdAt: new Date().toISOString() },
];

// Legacy exports for backward compatibility
export type TecnicoVisita = string;
export type TecnicoMedicao = string;
export type TecnicoDocumento = string;
export const TECNICO_VISITAS: string[] = [];
export const TECNICO_MEDICOES: string[] = [];
export const TECNICO_DOCUMENTOS: string[] = [];
