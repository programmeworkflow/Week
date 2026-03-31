import { useState } from "react";
import { useProjects } from "@/contexts/ProjectContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Layers, PinOff, RefreshCw, Crown } from "lucide-react";
import { SECTORS, Sector } from "@/lib/mock-data";
import { formatCNPJ, formatTelefone } from "@/lib/formatters";


interface NewProjectModalProps {
  defaultSector?: Sector;
}

export const NewProjectModal = ({ defaultSector }: NewProjectModalProps) => {
  const { addProject, addKanbanVariavelCard, addRenovacaoCard, users } = useProjects();
  const [open, setOpen] = useState(false);
  const [quadroTipo, setQuadroTipo] = useState<"fixo" | "variavel" | "renovacao">("fixo");
  const [form, setForm] = useState({
    project_name: "",
    description: "",
    cnpj: "",
    start_date: "",
    due_date: "",
    sector: defaultSector || ("tecnico" as Sector),
    responsible_ids: [] as string[],
    contato_nome: "",
    contato_telefone: "",
    contato_email: "",
    dados_extras: "",
    prioridade: "Média" as "Baixa" | "Média" | "Alta" | "Crítica",
  });

  const isTecnico = form.sector === "tecnico";
  const isComercial = form.sector === "comercial";
  const isDiretoria = form.sector === "diretoria";
  const [comercialQuadro, setComercialQuadro] = useState<"treinamento" | "comercial">("treinamento");
  const [diretoriaQuadro, setDiretoriaQuadro] = useState<"samuel" | "fernando">("samuel");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isTecnico && quadroTipo === "variavel") {
      addKanbanVariavelCard({
        title: form.project_name,
        description: form.description,
        status: "not_started",
        prioridade: form.prioridade,
        createdAt: new Date().toISOString(),
        empresa: form.project_name,
        cnpj: form.cnpj,
        responsavel: users.find((u) => form.responsible_ids[0] === u.id)?.full_name || "",
        regiao: "",
        data: form.due_date ? new Date(form.due_date).toLocaleDateString("pt-BR") : "",
        status_tecnico: "Não iniciadas",
        contato_nome: form.contato_nome,
        contato_telefone: form.contato_telefone,
        contato_email: form.contato_email,
        dados_extras: form.dados_extras,
      });
    } else if (isTecnico && quadroTipo === "renovacao") {
      addRenovacaoCard({
        title: form.project_name,
        description: form.description,
        status: "doc_vencidos",
        empresa: form.project_name,
        cnpj: form.cnpj,
        responsavel: users.find((u) => form.responsible_ids[0] === u.id)?.full_name || "",
        prioridade: form.prioridade,
        data: form.due_date ? new Date(form.due_date).toLocaleDateString("pt-BR") : "",
        contato_nome: form.contato_nome,
        contato_telefone: form.contato_telefone,
        contato_email: form.contato_email,
        dados_extras: form.dados_extras,
        createdAt: new Date().toISOString(),
      });
    } else {
      addProject({
        ...form,
        company_id: "1",
        status: "not_authenticated",
        is_renovation: (isComercial && comercialQuadro === "comercial") || (isDiretoria && diretoriaQuadro === "fernando"),
      });
    }

    setForm({
      project_name: "", description: "", cnpj: "", start_date: "", due_date: "",
      sector: defaultSector || "tecnico", responsible_ids: [],
      contato_nome: "", contato_telefone: "", contato_email: "", dados_extras: "",
      prioridade: "Média",
    });
    setQuadroTipo("fixo");
    setOpen(false);
  };

  const toggleResponsible = (id: string) => {
    setForm((prev) => ({
      ...prev,
      responsible_ids: prev.responsible_ids.includes(id)
        ? prev.responsible_ids.filter((r) => r !== id)
        : [...prev.responsible_ids, id],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 rounded-[10px] font-medium h-10 transition-all duration-300 btn-3d neon-hover animate-float">
          <Plus className="w-4 h-4 stroke-[1.5]" />
          Novo Projeto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Criar Novo Projeto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Nome do Projeto</Label>
            <Input
              value={form.project_name}
              onChange={(e) => setForm((p) => ({ ...p, project_name: e.target.value }))}
              placeholder="Ex: PPRA - Empresa ABC"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Descreva o escopo do projeto..."
              rows={3}
              maxLength={500}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input
                value={form.cnpj}
                onChange={(e) => setForm((p) => ({ ...p, cnpj: formatCNPJ(e.target.value) }))}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="space-y-2">
              <Label>Setor</Label>
              <Select value={form.sector} onValueChange={(v) => setForm((p) => ({ ...p, sector: v as Sector }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SECTORS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quadro type selector - only for Técnico */}
          {isTecnico && (
            <div className="space-y-2 animate-fade-in">
              <Label>Tipo de Quadro</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setQuadroTipo("fixo")}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all duration-300 text-left ${
                    quadroTipo === "fixo"
                      ? "border-primary bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                      : "border-border hover:border-primary/30 hover:bg-muted/50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${quadroTipo === "fixo" ? "bg-primary/20" : "bg-muted"}`}>
                    <Layers className={`w-4 h-4 ${quadroTipo === "fixo" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <span className={`text-sm font-medium block ${quadroTipo === "fixo" ? "text-primary" : "text-foreground"}`}>Empresas</span>
                    <span className="text-[10px] text-muted-foreground">Clientes fixos da empresa</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setQuadroTipo("variavel")}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all duration-300 text-left ${
                    quadroTipo === "variavel"
                      ? "border-cyan-400 bg-cyan-400/10 shadow-[0_0_12px_rgba(34,211,238,0.3)]"
                      : "border-border hover:border-cyan-400/30 hover:bg-muted/50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${quadroTipo === "variavel" ? "bg-cyan-400/20" : "bg-muted"}`}>
                    <PinOff className={`w-4 h-4 ${quadroTipo === "variavel" ? "text-cyan-400" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <span className={`text-sm font-medium block ${quadroTipo === "variavel" ? "text-cyan-400" : "text-foreground"}`}>Demanda Avulsa</span>
                    <span className="text-[10px] text-muted-foreground">Demandas avulsas</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setQuadroTipo("renovacao")}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all duration-300 text-left ${
                    quadroTipo === "renovacao"
                      ? "border-orange-400 bg-orange-400/10 shadow-[0_0_12px_rgba(251,146,60,0.3)]"
                      : "border-border hover:border-orange-400/30 hover:bg-muted/50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${quadroTipo === "renovacao" ? "bg-orange-400/20" : "bg-muted"}`}>
                    <RefreshCw className={`w-4 h-4 ${quadroTipo === "renovacao" ? "text-orange-400" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <span className={`text-sm font-medium block ${quadroTipo === "renovacao" ? "text-orange-400" : "text-foreground"}`}>Renovação</span>
                    <span className="text-[10px] text-muted-foreground">Renovações e pendências</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Quadro selector - Comercial */}
          {isComercial && (
            <div className="space-y-2 animate-fade-in">
              <Label className="text-xs font-medium">Quadro</Label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button"
                  onClick={() => setComercialQuadro("treinamento")}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all ${
                    comercialQuadro === "treinamento" ? "border-amber-400 bg-amber-400/10" : "border-border hover:border-amber-400/40"
                  }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${comercialQuadro === "treinamento" ? "bg-amber-400/20" : "bg-muted"}`}>
                    <Layers className={`w-4 h-4 ${comercialQuadro === "treinamento" ? "text-amber-400" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <span className={`text-sm font-medium block ${comercialQuadro === "treinamento" ? "text-amber-500" : "text-foreground"}`}>Treinamentos</span>
                  </div>
                </button>
                <button type="button"
                  onClick={() => setComercialQuadro("comercial")}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all ${
                    comercialQuadro === "comercial" ? "border-blue-400 bg-blue-400/10" : "border-border hover:border-blue-400/40"
                  }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${comercialQuadro === "comercial" ? "bg-blue-400/20" : "bg-muted"}`}>
                    <Layers className={`w-4 h-4 ${comercialQuadro === "comercial" ? "text-blue-400" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <span className={`text-sm font-medium block ${comercialQuadro === "comercial" ? "text-blue-500" : "text-foreground"}`}>Comercial</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Quadro selector - Diretoria */}
          {isDiretoria && (
            <div className="space-y-2 animate-fade-in">
              <Label className="text-xs font-medium">Quadro</Label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button"
                  onClick={() => setDiretoriaQuadro("samuel")}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all ${
                    diretoriaQuadro === "samuel" ? "border-violet-400 bg-violet-400/10" : "border-border hover:border-violet-400/40"
                  }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${diretoriaQuadro === "samuel" ? "bg-violet-400/20" : "bg-muted"}`}>
                    <Crown className={`w-4 h-4 ${diretoriaQuadro === "samuel" ? "text-violet-400" : "text-muted-foreground"}`} />
                  </div>
                  <span className={`text-sm font-medium ${diretoriaQuadro === "samuel" ? "text-violet-500" : "text-foreground"}`}>Quadro Samuel</span>
                </button>
                <button type="button"
                  onClick={() => setDiretoriaQuadro("fernando")}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all ${
                    diretoriaQuadro === "fernando" ? "border-violet-400 bg-violet-400/10" : "border-border hover:border-violet-400/40"
                  }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${diretoriaQuadro === "fernando" ? "bg-violet-400/20" : "bg-muted"}`}>
                    <Crown className={`w-4 h-4 ${diretoriaQuadro === "fernando" ? "text-violet-400" : "text-muted-foreground"}`} />
                  </div>
                  <span className={`text-sm font-medium ${diretoriaQuadro === "fernando" ? "text-violet-500" : "text-foreground"}`}>Quadro Fernando</span>
                </button>
              </div>
            </div>
          )}

          {/* Priority - show for variavel */}
          {isTecnico && quadroTipo === "variavel" && (
            <div className="space-y-2 animate-fade-in">
              <Label>Prioridade</Label>
              <Select value={form.prioridade} onValueChange={(v) => setForm((p) => ({ ...p, prioridade: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Crítica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{isTecnico && quadroTipo === "variavel" ? "Data" : "Data de Início"}</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Data Limite</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Responsáveis</Label>
            <div className="flex flex-wrap gap-2">
              {users.filter((u) => !form.sector || u.sectors?.includes(form.sector as any)).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleResponsible(u.id)}
                    className={`px-3 py-1.5 rounded-[10px] text-xs font-medium border transition-all duration-200 ${
                      form.responsible_ids.includes(u.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:border-primary/40 hover:bg-accent"
                    }`}
                  >
                    {u.full_name}
                  </button>
              ))}
            </div>
          </div>

          {/* Contact fields */}
          <hr className="border-border" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados de Contato</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Nome do Contato</Label>
              <Input
                value={form.contato_nome}
                onChange={(e) => setForm((p) => ({ ...p, contato_nome: e.target.value }))}
                placeholder="Nome"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={form.contato_telefone}
                onChange={(e) => setForm((p) => ({ ...p, contato_telefone: formatTelefone(e.target.value) }))}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={form.contato_email}
                onChange={(e) => setForm((p) => ({ ...p, contato_email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Dados Extras</Label>
            <Textarea
              value={form.dados_extras}
              onChange={(e) => setForm((p) => ({ ...p, dados_extras: e.target.value }))}
              placeholder="Informações adicionais..."
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-[10px] font-medium h-10 transition-all duration-200 btn-3d neon-hover">
            {isTecnico && quadroTipo === "variavel" ? "Criar em Demanda Avulsa" : isTecnico && quadroTipo === "renovacao" ? "Criar em Renovação" : "Salvar Projeto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
