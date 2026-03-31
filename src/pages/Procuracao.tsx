import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, FileCheck, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCNPJ, formatTelefone } from "@/lib/formatters";
import * as XLSX from "xlsx";

interface ProcuracaoRow {
  id: string;
  empresa: string;
  cnpj_cpf: string;
  situacao: string;
  contrato: string;
  email: string;
  telefone: string;
  procuracao_vencimento: string;
  contabilidade: string;
}

const getSituacaoFromDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  if (parts.length !== 3) return "";
  const venc = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  if (isNaN(venc.getTime())) return "";
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (venc < now) return "Expirada";
  return "Ativa";
};

const getDaysToExpire = (dateStr: string): number | null => {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;
  const venc = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  if (isNaN(venc.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((venc.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const getProcuracaoColor = (dateStr: string) => {
  const days = getDaysToExpire(dateStr);
  if (days === null) return "";
  if (days < 0) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (days <= 30) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  return "";
};

const getSituacaoColor = (sit: string) => {
  if (sit === "Expirada") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (sit === "Ativa") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (sit === "Aguardando resposta") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  return "";
};

const formatDateInput = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const Procuracao = () => {
  const { user, canAccessSector } = useAuth();
  const [rows, setRows] = useState<ProcuracaoRow[]>([]);
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState<Omit<ProcuracaoRow, "id">>({
    empresa: "", cnpj_cpf: "", situacao: "", contrato: "", email: "", telefone: "", procuracao_vencimento: "", contabilidade: "",
  });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("medwork_procuracoes").select("*");
      if (data) setRows(data);
    };
    load();
  }, []);

  // Auto-update situacao based on procuracao date
  useEffect(() => {
    rows.forEach((r) => {
      if (!r.procuracao_vencimento) return;
      const autoSituacao = getSituacaoFromDate(r.procuracao_vencimento);
      if (autoSituacao && r.situacao !== autoSituacao && r.situacao !== "Aguardando resposta") {
        updateRow(r.id, { situacao: autoSituacao });
      }
    });
  }, [rows.map(r => r.procuracao_vencimento).join(",")]);

  const exportExcel = () => {
    const data = rows.map(r => ({
      "Empresa": r.empresa,
      "CNPJ/CPF": r.cnpj_cpf,
      "Situação": r.situacao || "Em branco",
      "Contrato": r.contrato,
      "E-mail": r.email,
      "Telefone": r.telefone,
      "Procuração (Vencimento)": r.procuracao_vencimento,
      "Contabilidade": r.contabilidade,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 18 }, { wch: 15 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Procurações");
    XLSX.writeFile(wb, "procuracoes_esocial.xlsx");
  };

  if (!user) return <Navigate to="/" replace />;
  if (!canAccessSector("esocial" as any) && !user.is_admin) return <Navigate to="/profile" replace />;

  const addRow = async () => {
    if (!newRow.empresa) return;
    const id = String(Date.now());
    const autoSit = newRow.procuracao_vencimento ? getSituacaoFromDate(newRow.procuracao_vencimento) : newRow.situacao;
    const row = { ...newRow, id, situacao: autoSit || newRow.situacao };
    setRows((prev) => [...prev, row]);
    await supabase.from("medwork_procuracoes").insert(row);
    setNewRow({ empresa: "", cnpj_cpf: "", situacao: "", contrato: "", email: "", telefone: "", procuracao_vencimento: "", contabilidade: "" });
    setAdding(false);
  };

  const updateRow = async (id: string, data: Partial<ProcuracaoRow>) => {
    // If procuracao_vencimento changed, auto-update situacao
    if (data.procuracao_vencimento) {
      const autoSit = getSituacaoFromDate(data.procuracao_vencimento);
      if (autoSit) data.situacao = autoSit;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
    await supabase.from("medwork_procuracoes").update(data).eq("id", id);
  };

  const deleteRow = async (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    await supabase.from("medwork_procuracoes").delete().eq("id", id);
  };

  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <main className="flex-1 ml-60 sidebar-collapsed:ml-16 p-6 md:p-8 bg-background transition-all duration-200">
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileCheck className="w-6 h-6 text-blue-500" />
              Procuração - eSocial
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Controle de procurações e situações</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportExcel} className="gap-1.5 text-xs rounded-lg h-9 btn-3d neon-hover animate-float">
              <Download className="w-3.5 h-3.5" /> Exportar Excel
            </Button>
            <Button onClick={() => setAdding(true)} className="gap-1.5 text-xs rounded-lg h-9 btn-3d neon-hover animate-float bg-primary text-primary-foreground">
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden neon-card overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-border bg-gradient-to-r from-blue-500/5 to-blue-500/10">
                <th className="text-left text-[10px] font-bold text-foreground px-3 py-2.5 uppercase tracking-wider">Empresa</th>
                <th className="text-left text-[10px] font-bold text-foreground px-3 py-2.5 uppercase tracking-wider w-40">CNPJ/CPF</th>
                <th className="text-left text-[10px] font-bold text-foreground px-3 py-2.5 uppercase tracking-wider w-36">Situação</th>
                <th className="text-left text-[10px] font-bold text-foreground px-3 py-2.5 uppercase tracking-wider w-28">Contrato</th>
                <th className="text-left text-[10px] font-bold text-foreground px-3 py-2.5 uppercase tracking-wider">E-mail</th>
                <th className="text-left text-[10px] font-bold text-foreground px-3 py-2.5 uppercase tracking-wider w-36">Telefone</th>
                <th className="text-left text-[10px] font-bold text-foreground px-3 py-2.5 uppercase tracking-wider w-32">Procuração</th>
                <th className="text-left text-[10px] font-bold text-foreground px-3 py-2.5 uppercase tracking-wider">Contabilidade</th>
                <th className="text-center text-[10px] font-bold text-foreground px-3 py-2.5 uppercase tracking-wider w-14">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={cn("border-b border-border/50 hover:bg-accent/30 transition-colors", i % 2 === 0 ? "" : "bg-muted/20")}>
                  <td className="px-3 py-1.5">
                    <Input value={r.empresa} onChange={(e) => updateRow(r.id, { empresa: e.target.value })} className="h-7 text-xs rounded-lg border-border/50 bg-transparent hover:bg-background focus:bg-background" />
                  </td>
                  <td className="px-3 py-1.5">
                    <Input value={r.cnpj_cpf} onChange={(e) => updateRow(r.id, { cnpj_cpf: formatCNPJ(e.target.value) })} placeholder="00.000.000/0000-00" className="h-7 text-xs rounded-lg border-border/50 bg-transparent hover:bg-background focus:bg-background" />
                  </td>
                  <td className="px-3 py-1.5">
                    <Select value={r.situacao || "vazio"} onValueChange={(v) => updateRow(r.id, { situacao: v === "vazio" ? "" : v })}>
                      <SelectTrigger className={cn("h-7 text-xs rounded-lg border-border/50", getSituacaoColor(r.situacao))}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vazio">Em branco</SelectItem>
                        <SelectItem value="Aguardando resposta">Aguardando resposta</SelectItem>
                        <SelectItem value="Expirada">Expirada</SelectItem>
                        <SelectItem value="Ativa">Ativa</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-1.5">
                    <Input value={r.contrato} onChange={(e) => updateRow(r.id, { contrato: e.target.value })} className="h-7 text-xs rounded-lg border-border/50 bg-transparent hover:bg-background focus:bg-background" />
                  </td>
                  <td className="px-3 py-1.5">
                    <Input type="email" value={r.email} onChange={(e) => updateRow(r.id, { email: e.target.value })} placeholder="email@exemplo.com" className="h-7 text-xs rounded-lg border-border/50 bg-transparent hover:bg-background focus:bg-background" />
                  </td>
                  <td className="px-3 py-1.5">
                    <Input value={r.telefone} onChange={(e) => updateRow(r.id, { telefone: formatTelefone(e.target.value) })} placeholder="(00) 00000-0000" className="h-7 text-xs rounded-lg border-border/50 bg-transparent hover:bg-background focus:bg-background" />
                  </td>
                  <td className="px-3 py-1.5">
                    <Input
                      value={r.procuracao_vencimento}
                      onChange={(e) => updateRow(r.id, { procuracao_vencimento: formatDateInput(e.target.value) })}
                      placeholder="dd/mm/aaaa"
                      className={cn("h-7 text-xs rounded-lg border-border/50 font-medium", getProcuracaoColor(r.procuracao_vencimento))}
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <Input value={r.contabilidade} onChange={(e) => updateRow(r.id, { contabilidade: e.target.value })} className="h-7 text-xs rounded-lg border-border/50 bg-transparent hover:bg-background focus:bg-background" />
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <Button variant="ghost" size="icon" onClick={() => deleteRow(r.id)} className="h-6 w-6 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              ))}
              {adding && (
                <tr className="border-b border-primary/20 bg-primary/5">
                  <td className="px-3 py-1.5"><Input value={newRow.empresa} onChange={(e) => setNewRow({ ...newRow, empresa: e.target.value })} placeholder="Nome da empresa" className="h-7 text-xs rounded-lg" autoFocus /></td>
                  <td className="px-3 py-1.5"><Input value={newRow.cnpj_cpf} onChange={(e) => setNewRow({ ...newRow, cnpj_cpf: formatCNPJ(e.target.value) })} placeholder="00.000.000/0000-00" className="h-7 text-xs rounded-lg" /></td>
                  <td className="px-3 py-1.5">
                    <Select value={newRow.situacao || "vazio"} onValueChange={(v) => setNewRow({ ...newRow, situacao: v === "vazio" ? "" : v })}>
                      <SelectTrigger className="h-7 text-xs rounded-lg"><SelectValue placeholder="Situação" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vazio">Em branco</SelectItem>
                        <SelectItem value="Aguardando resposta">Aguardando resposta</SelectItem>
                        <SelectItem value="Expirada">Expirada</SelectItem>
                        <SelectItem value="Ativa">Ativa</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-1.5"><Input value={newRow.contrato} onChange={(e) => setNewRow({ ...newRow, contrato: e.target.value })} placeholder="Contrato" className="h-7 text-xs rounded-lg" /></td>
                  <td className="px-3 py-1.5"><Input type="email" value={newRow.email} onChange={(e) => setNewRow({ ...newRow, email: e.target.value })} placeholder="email@exemplo.com" className="h-7 text-xs rounded-lg" /></td>
                  <td className="px-3 py-1.5"><Input value={newRow.telefone} onChange={(e) => setNewRow({ ...newRow, telefone: formatTelefone(e.target.value) })} placeholder="(00) 00000-0000" className="h-7 text-xs rounded-lg" /></td>
                  <td className="px-3 py-1.5"><Input value={newRow.procuracao_vencimento} onChange={(e) => setNewRow({ ...newRow, procuracao_vencimento: formatDateInput(e.target.value) })} placeholder="dd/mm/aaaa" className="h-7 text-xs rounded-lg" /></td>
                  <td className="px-3 py-1.5"><Input value={newRow.contabilidade} onChange={(e) => setNewRow({ ...newRow, contabilidade: e.target.value })} placeholder="Contabilidade" className="h-7 text-xs rounded-lg" /></td>
                  <td className="px-3 py-1.5 text-center">
                    <div className="flex gap-1 justify-center">
                      <Button size="sm" onClick={addRow} className="h-6 text-[10px] px-2 rounded-lg bg-primary text-primary-foreground">Salvar</Button>
                      <Button size="icon" variant="ghost" onClick={() => setAdding(false)} className="h-6 w-6 rounded-lg"><span className="text-xs">✕</span></Button>
                    </div>
                  </td>
                </tr>
              )}
              {rows.length === 0 && !adding && (
                <tr><td colSpan={9} className="text-center py-8 text-sm text-muted-foreground">Nenhuma procuração cadastrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700" /> Vencida</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700" /> Vence em 30 dias</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700" /> Ativa</span>
        </div>
      </main>
    </div>
  );
};

export default Procuracao;
