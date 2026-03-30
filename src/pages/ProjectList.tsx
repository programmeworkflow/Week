import { useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useProjects } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/AppSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Project, Sector, TecnicoProject, TECNICO_RESPONSAVEIS, TECNICO_PRIORIDADES, TECNICO_STATUS_OPTIONS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { getSectorTitle } from "@/lib/sectors";
import { ImportSpreadsheetModal } from "@/components/ImportSpreadsheetModal";
import { Plus, Trash2, Save, Edit2, Eye, Filter, X } from "lucide-react";

const statusLabels: Record<Project["status"], string> = {
  not_authenticated: "Não Autenticado",
  not_started: "Não Iniciado",
  pending: "Pendente",
  doc_pending: "Doc. Pendente",
  review: "Revisão",
  done: "Concluído",
};

const statusDotColors: Record<Project["status"], string> = {
  not_authenticated: "bg-[hsl(var(--status-critico-text))]",
  not_started: "bg-[hsl(var(--status-nao-iniciado-text))]",
  pending: "bg-[hsl(var(--status-andamento-text))]",
  doc_pending: "bg-[hsl(var(--status-pendente-text))]",
  review: "bg-[hsl(var(--status-revisao-text))]",
  done: "bg-[hsl(var(--status-concluido-text))]",
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

// CNPJ mask: 00.000.000/0000-00
const formatCNPJ = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

// Date mask: DD/MM/AAAA (only digits)
const formatDateInput = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const isValidDate = (dateStr: string): boolean => {
  if (dateStr.length !== 10) return false;
  const parts = dateStr.split("/");
  if (parts.length !== 3) return false;
  const [dd, mm, yyyy] = parts.map(Number);
  const date = new Date(yyyy, mm - 1, dd);
  return date.getFullYear() === yyyy && date.getMonth() === mm - 1 && date.getDate() === dd;
};

// Tecnico spreadsheet view
const TecnicoSpreadsheet = () => {
  const { tecnicoProjects, addTecnicoProject, updateTecnicoProject, deleteTecnicoProject } = useProjects();
  const [newRow, setNewRow] = useState<Omit<TecnicoProject, "id" | "sector"> | null>(null);
  const [editingProject, setEditingProject] = useState<TecnicoProject | null>(null);
  const [viewingProject, setViewingProject] = useState<TecnicoProject | null>(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterEmpresa, setFilterEmpresa] = useState("");
  const [filterCnpj, setFilterCnpj] = useState("");
  const [filterResponsavel, setFilterResponsavel] = useState("all");
  const [filterRegiao, setFilterRegiao] = useState("");
  const [filterPrioridade, setFilterPrioridade] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDataDe, setFilterDataDe] = useState("");
  const [filterDataAte, setFilterDataAte] = useState("");

  const hasActiveFilters = filterEmpresa || filterCnpj || filterResponsavel !== "all" || filterRegiao || filterPrioridade !== "all" || filterStatus !== "all" || filterDataDe || filterDataAte;

  const clearFilters = () => {
    setFilterEmpresa(""); setFilterCnpj(""); setFilterResponsavel("all");
    setFilterRegiao(""); setFilterPrioridade("all"); setFilterStatus("all");
    setFilterDataDe(""); setFilterDataAte("");
  };

  // Apply filters
  let filteredProjects = tecnicoProjects;
  if (filterEmpresa) filteredProjects = filteredProjects.filter(p => p.empresa.toLowerCase().includes(filterEmpresa.toLowerCase()));
  if (filterCnpj) filteredProjects = filteredProjects.filter(p => p.cnpj.includes(filterCnpj));
  if (filterResponsavel !== "all") filteredProjects = filteredProjects.filter(p => p.responsavel === filterResponsavel);
  if (filterRegiao) filteredProjects = filteredProjects.filter(p => p.regiao.toLowerCase().includes(filterRegiao.toLowerCase()));
  if (filterPrioridade !== "all") filteredProjects = filteredProjects.filter(p => p.prioridade === filterPrioridade);
  if (filterStatus !== "all") filteredProjects = filteredProjects.filter(p => p.status_tecnico === filterStatus);
  if (filterDataDe) {
    filteredProjects = filteredProjects.filter(p => {
      if (!p.data || !isValidDate(p.data)) return false;
      const [dd, mm, yyyy] = p.data.split("/").map(Number);
      const [ddd, mmd, yyyyd] = filterDataDe.split("/").map(Number);
      return new Date(yyyy, mm - 1, dd) >= new Date(yyyyd, mmd - 1, ddd);
    });
  }
  if (filterDataAte) {
    filteredProjects = filteredProjects.filter(p => {
      if (!p.data || !isValidDate(p.data)) return false;
      const [dd, mm, yyyy] = p.data.split("/").map(Number);
      const [dda, mma, yyyya] = filterDataAte.split("/").map(Number);
      return new Date(yyyy, mm - 1, dd) <= new Date(yyyya, mma - 1, dda);
    });
  }

  const handleAddRow = () => {
    setNewRow({
      empresa: "", cnpj: "", responsavel: "Caio", regiao: "", prioridade: "Baixa",
      data: "", status_tecnico: "Não cadastradas no ESO",
      contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "",
    });
  };

  const handleSaveNewRow = () => {
    if (!newRow || !newRow.empresa.trim()) return;
    if (newRow.data && !isValidDate(newRow.data)) return;
    addTecnicoProject({ ...newRow, sector: "tecnico" });
    setNewRow(null);
  };

  const handleCancelNewRow = () => setNewRow(null);

  const handleSaveEdit = () => {
    if (!editingProject) return;
    updateTecnicoProject(editingProject.id, editingProject);
    setEditingProject(null);
  };

  return (
    <>
      {/* Filter Bar */}
      <div className="mb-4 flex items-center gap-2">
        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
          className={`gap-2 rounded-lg transition-all text-sm ${showFilters ? "bg-primary text-primary-foreground" : ""}`}
        >
          <Filter className="w-4 h-4" />
          Filtros
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs text-muted-foreground hover:text-destructive">
            <X className="w-3 h-3" /> Limpar filtros
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="mb-6 p-4 bg-card rounded-xl border border-border shadow-card animate-fade-in">
          <h3 className="text-sm font-semibold text-foreground mb-3">Filtros</h3>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Empresa</label>
              <Input value={filterEmpresa} onChange={(e) => setFilterEmpresa(e.target.value)} placeholder="Buscar..." className="h-8 text-xs rounded-lg" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">CNPJ</label>
              <Input value={filterCnpj} onChange={(e) => setFilterCnpj(e.target.value)} placeholder="Buscar CNPJ..." className="h-8 text-xs rounded-lg" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Responsável</label>
              <Select value={filterResponsavel} onValueChange={setFilterResponsavel}>
                <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {TECNICO_RESPONSAVEIS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Região</label>
              <Input value={filterRegiao} onChange={(e) => setFilterRegiao(e.target.value)} placeholder="Buscar..." className="h-8 text-xs rounded-lg" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Prioridade</label>
              <Select value={filterPrioridade} onValueChange={setFilterPrioridade}>
                <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {TECNICO_PRIORIDADES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {TECNICO_STATUS_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Data De</label>
              <Input value={filterDataDe} onChange={(e) => setFilterDataDe(formatDateInput(e.target.value))} placeholder="dd/mm/aaaa" className="h-8 text-xs rounded-lg" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Data Até</label>
              <Input value={filterDataAte} onChange={(e) => setFilterDataAte(formatDateInput(e.target.value))} placeholder="dd/mm/aaaa" className="h-8 text-xs rounded-lg" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-[12px] border border-border overflow-hidden animate-fade-in shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left text-[11px] font-bold text-foreground px-3 py-3 uppercase tracking-wider">Empresa</th>
                <th className="text-left text-[11px] font-bold text-foreground px-3 py-3 uppercase tracking-wider">CNPJ</th>
                <th className="text-left text-[11px] font-bold text-foreground px-3 py-3 uppercase tracking-wider">Responsável</th>
                <th className="text-left text-[11px] font-bold text-foreground px-3 py-3 uppercase tracking-wider">Região</th>
                <th className="text-left text-[11px] font-bold text-foreground px-3 py-3 uppercase tracking-wider">Prioridade</th>
                <th className="text-left text-[11px] font-bold text-foreground px-3 py-3 uppercase tracking-wider">Data</th>
                <th className="text-left text-[11px] font-bold text-foreground px-3 py-3 uppercase tracking-wider">Status</th>
                <th className="text-center text-[11px] font-bold text-foreground px-3 py-3 uppercase tracking-wider w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((p, idx) => (
                <tr key={p.id} className={cn("border-b border-border/50 hover:bg-accent/20 transition-colors", idx % 2 === 0 ? "bg-card" : "bg-muted/20")}>
                  <td className="px-3 py-2">
                    <Input
                      value={p.empresa}
                      onChange={(e) => updateTecnicoProject(p.id, { empresa: e.target.value })}
                      className="h-8 text-xs rounded-lg border-border/50 bg-transparent hover:bg-background focus:bg-background transition-colors"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={p.cnpj}
                      onChange={(e) => updateTecnicoProject(p.id, { cnpj: formatCNPJ(e.target.value) })}
                      placeholder="00.000.000/0000-00"
                      className="h-8 text-xs rounded-lg border-border/50 bg-transparent hover:bg-background focus:bg-background transition-colors w-[160px]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Select value={p.responsavel} onValueChange={(v) => updateTecnicoProject(p.id, { responsavel: v as any })}>
                      <SelectTrigger className="h-8 text-xs rounded-lg border-border/50"><SelectValue /></SelectTrigger>
                      <SelectContent>{TECNICO_RESPONSAVEIS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={p.regiao}
                      onChange={(e) => updateTecnicoProject(p.id, { regiao: e.target.value })}
                      className="h-8 text-xs rounded-lg border-border/50 bg-transparent hover:bg-background focus:bg-background transition-colors"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Select value={p.prioridade} onValueChange={(v) => updateTecnicoProject(p.id, { prioridade: v as any })}>
                      <SelectTrigger className={cn("h-8 text-xs rounded-lg border-0 font-medium", prioridadeColors[p.prioridade])}><SelectValue /></SelectTrigger>
                      <SelectContent>{TECNICO_PRIORIDADES.map((r) => <SelectItem key={r} value={r}><span className={cn("px-1.5 py-0.5 rounded text-xs", prioridadeColors[r])}>{r}</span></SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={p.data}
                      onChange={(e) => updateTecnicoProject(p.id, { data: formatDateInput(e.target.value) })}
                      placeholder="dd/mm/aaaa"
                      className={cn("h-8 text-xs rounded-lg border-border/50 bg-transparent hover:bg-background focus:bg-background transition-colors w-28", p.data && !isValidDate(p.data) && p.data.length === 10 ? "border-destructive" : "")}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Select value={p.status_tecnico} onValueChange={(v) => updateTecnicoProject(p.id, { status_tecnico: v as any })}>
                      <SelectTrigger className={cn("h-8 text-[11px] rounded-lg border-0 font-medium", statusTecnicoColors[p.status_tecnico])}><SelectValue /></SelectTrigger>
                      <SelectContent>{TECNICO_STATUS_OPTIONS.map((r) => <SelectItem key={r} value={r}><span className={cn("px-1.5 py-0.5 rounded text-xs", statusTecnicoColors[r])}>{r}</span></SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex gap-1 justify-center">
                      <Button variant="ghost" size="icon" onClick={() => setViewingProject(p)} className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditingProject({ ...p })} className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteTecnicoProject(p.id)} className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* New row being added */}
              {newRow && (
                <tr className="border-b border-primary/30 bg-primary/5">
                  <td className="px-3 py-2">
                    <Input value={newRow.empresa} onChange={(e) => setNewRow({ ...newRow, empresa: e.target.value })} placeholder="Nome da empresa" className="h-8 text-xs rounded-lg" autoFocus />
                  </td>
                  <td className="px-3 py-2">
                    <Input value={newRow.cnpj} onChange={(e) => setNewRow({ ...newRow, cnpj: formatCNPJ(e.target.value) })} placeholder="00.000.000/0000-00" className="h-8 text-xs rounded-lg w-[160px]" />
                  </td>
                  <td className="px-3 py-2">
                    <Select value={newRow.responsavel} onValueChange={(v) => setNewRow({ ...newRow, responsavel: v as any })}>
                      <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>{TECNICO_RESPONSAVEIS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Input value={newRow.regiao} onChange={(e) => setNewRow({ ...newRow, regiao: e.target.value })} placeholder="Região" className="h-8 text-xs rounded-lg" />
                  </td>
                  <td className="px-3 py-2">
                    <Select value={newRow.prioridade} onValueChange={(v) => setNewRow({ ...newRow, prioridade: v as any })}>
                      <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>{TECNICO_PRIORIDADES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Input value={newRow.data} onChange={(e) => setNewRow({ ...newRow, data: formatDateInput(e.target.value) })} placeholder="dd/mm/aaaa" className="h-8 text-xs rounded-lg w-28" />
                  </td>
                  <td className="px-3 py-2">
                    <Select value={newRow.status_tecnico} onValueChange={(v) => setNewRow({ ...newRow, status_tecnico: v as any })}>
                      <SelectTrigger className="h-8 text-[11px] rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>{TECNICO_STATUS_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex gap-1 justify-center">
                      <Button size="icon" onClick={handleSaveNewRow} disabled={!newRow.empresa.trim()} className="h-7 w-7 rounded-lg gradient-primary text-primary-foreground">
                        <Save className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={handleCancelNewRow} className="h-7 w-7 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )}

              {filteredProjects.length === 0 && !newRow && (
                <tr><td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">Nenhum projeto encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add row button */}
        {!newRow && (
          <div className="p-3 border-t border-border bg-muted/20">
            <Button onClick={handleAddRow} variant="outline" className="gap-2 text-xs rounded-xl btn-3d hover:shadow-3d-hover transition-all border-dashed border-primary/30 text-primary hover:text-primary">
              <Plus className="w-3.5 h-3.5" />
              Adicionar Projeto
            </Button>
          </div>
        )}
      </div>

      {/* View project details modal */}
      <Dialog open={!!viewingProject} onOpenChange={(v) => !v && setViewingProject(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewingProject?.empresa}</DialogTitle>
          </DialogHeader>
          {viewingProject && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground text-xs">CNPJ:</span><p className="font-medium">{viewingProject.cnpj || "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">Responsável:</span><p className="font-medium">{viewingProject.responsavel}</p></div>
                <div><span className="text-muted-foreground text-xs">Região:</span><p className="font-medium">{viewingProject.regiao || "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">Prioridade:</span><p><span className={cn("px-2 py-0.5 rounded text-xs font-medium", prioridadeColors[viewingProject.prioridade])}>{viewingProject.prioridade}</span></p></div>
                <div><span className="text-muted-foreground text-xs">Data:</span><p className="font-medium">{viewingProject.data || "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">Status:</span><p><span className={cn("px-2 py-0.5 rounded text-xs font-medium", statusTecnicoColors[viewingProject.status_tecnico])}>{viewingProject.status_tecnico}</span></p></div>
              </div>
              <hr className="border-border" />
              <div><span className="text-muted-foreground text-xs">Contato:</span><p className="font-medium">{viewingProject.contato_nome || "—"}</p></div>
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground text-xs">Telefone:</span><p className="font-medium">{viewingProject.contato_telefone || "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">Email:</span><p className="font-medium">{viewingProject.contato_email || "—"}</p></div>
              </div>
              {viewingProject.dados_extras && (
                <div><span className="text-muted-foreground text-xs">Dados extras:</span><p className="font-medium">{viewingProject.dados_extras}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit project modal */}
      <Dialog open={!!editingProject} onOpenChange={(v) => !v && setEditingProject(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Projeto</DialogTitle>
          </DialogHeader>
          {editingProject && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Empresa</Label>
                  <Input value={editingProject.empresa} onChange={(e) => setEditingProject({ ...editingProject, empresa: e.target.value })} className="h-9 text-sm rounded-lg" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">CNPJ</Label>
                  <Input value={editingProject.cnpj} onChange={(e) => setEditingProject({ ...editingProject, cnpj: formatCNPJ(e.target.value) })} placeholder="00.000.000/0000-00" className="h-9 text-sm rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Responsável</Label>
                  <Select value={editingProject.responsavel} onValueChange={(v) => setEditingProject({ ...editingProject, responsavel: v as any })}>
                    <SelectTrigger className="h-9 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>{TECNICO_RESPONSAVEIS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Região</Label>
                  <Input value={editingProject.regiao} onChange={(e) => setEditingProject({ ...editingProject, regiao: e.target.value })} className="h-9 text-sm rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Prioridade</Label>
                  <Select value={editingProject.prioridade} onValueChange={(v) => setEditingProject({ ...editingProject, prioridade: v as any })}>
                    <SelectTrigger className="h-9 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>{TECNICO_PRIORIDADES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Data</Label>
                  <Input value={editingProject.data} onChange={(e) => setEditingProject({ ...editingProject, data: formatDateInput(e.target.value) })} placeholder="dd/mm/aaaa" className="h-9 text-sm rounded-lg" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select value={editingProject.status_tecnico} onValueChange={(v) => setEditingProject({ ...editingProject, status_tecnico: v as any })}>
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
                  <Input value={editingProject.contato_nome} onChange={(e) => setEditingProject({ ...editingProject, contato_nome: e.target.value })} className="h-9 text-sm rounded-lg" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Telefone</Label>
                  <Input value={editingProject.contato_telefone} onChange={(e) => setEditingProject({ ...editingProject, contato_telefone: e.target.value })} className="h-9 text-sm rounded-lg" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input value={editingProject.contato_email} onChange={(e) => setEditingProject({ ...editingProject, contato_email: e.target.value })} className="h-9 text-sm rounded-lg" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Dados extras</Label>
                <Textarea value={editingProject.dados_extras} onChange={(e) => setEditingProject({ ...editingProject, dados_extras: e.target.value })} rows={2} className="text-sm rounded-lg" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveEdit} className="btn-3d gradient-primary text-primary-foreground rounded-xl flex-1">Salvar</Button>
                <Button variant="outline" onClick={() => setEditingProject(null)} className="rounded-xl">Cancelar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

// Default list for non-tecnico sectors
const DefaultProjectList = ({ sector }: { sector?: string }) => {
  const { projects, users } = useProjects();
  const navigate = useNavigate();

  const sectorProjects = sector ? projects.filter((p) => p.sector === sector) : projects;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden animate-fade-in shadow-card">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
            <th className="text-left text-[11px] font-bold text-foreground px-4 py-3 uppercase tracking-wider">Nome</th>
            <th className="text-left text-[11px] font-bold text-foreground px-4 py-3 uppercase tracking-wider">Status</th>
            <th className="text-left text-[11px] font-bold text-foreground px-4 py-3 uppercase tracking-wider">Responsáveis</th>
            <th className="text-left text-[11px] font-bold text-foreground px-4 py-3 uppercase tracking-wider">Criação</th>
            <th className="text-left text-[11px] font-bold text-foreground px-4 py-3 uppercase tracking-wider">Data Limite</th>
          </tr>
        </thead>
        <tbody>
          {sectorProjects.map((p, idx) => (
            <tr
              key={p.id}
              onClick={() => navigate(`/projeto/${p.id}`)}
              className={cn("border-b border-border/50 hover:bg-accent/30 cursor-pointer transition-colors", idx % 2 === 0 ? "" : "bg-muted/20")}
            >
              <td className="px-4 py-3 text-sm font-medium text-foreground">{p.project_name}</td>
              <td className="px-4 py-3">
                <span className="flex items-center gap-1.5">
                  <span className={cn("w-2 h-2 rounded-full", statusDotColors[p.status])} />
                  <span className="text-xs text-foreground">{statusLabels[p.status]}</span>
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex -space-x-1">
                  {users.filter((u) => p.responsible_ids.includes(u.id)).slice(0, 3).map((u) => (
                    <div key={u.id} className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground border-2 border-card" title={u.full_name}>
                      {u.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(p.created_at), "dd/MM/yyyy")}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(p.due_date), "dd/MM/yyyy")}</td>
            </tr>
          ))}
          {sectorProjects.length === 0 && (
            <tr><td colSpan={5} className="text-center py-8 text-sm text-muted-foreground">Nenhum projeto encontrado.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const ProjectList = () => {
  const { sector } = useParams<{ sector?: string }>();
  const { canAccessSector } = useAuth();
  const title = sector ? `Projetos - ${getSectorTitle(sector)}` : "Todos os Projetos";
  const isTecnico = sector === "tecnico";

  if (sector && !canAccessSector(sector as Sector)) {
    return <Navigate to="/dashboard/projects" replace />;
  }

  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <main className="flex-1 ml-60 sidebar-collapsed:ml-16 p-6 md:p-8 bg-background transition-all duration-200">
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isTecnico ? "Planilha editável do setor técnico" : "Lista de projetos do setor"}
            </p>
          </div>
          <div className="flex gap-2">
            {isTecnico && <ImportSpreadsheetModal />}
          </div>
        </div>

        {isTecnico ? <TecnicoSpreadsheet /> : <DefaultProjectList sector={sector} />}
      </main>
    </div>
  );
};

export default ProjectList;
