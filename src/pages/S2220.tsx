import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, FileCheck, ClipboardCheck, AlertTriangle, Check, Edit2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface S2220Item {
  id: string;
  mes: number;
  ano: number;
  tipo: "verificacao" | "erro";
  conteudo: string;
  concluido: boolean;
}

const meses = [
  "Mês 01 - Janeiro", "Mês 02 - Fevereiro", "Mês 03 - Março",
  "Mês 04 - Abril", "Mês 05 - Maio", "Mês 06 - Junho",
  "Mês 07 - Julho", "Mês 08 - Agosto", "Mês 09 - Setembro",
  "Mês 10 - Outubro", "Mês 11 - Novembro", "Mês 12 - Dezembro",
];

const ItemRow = ({ item, onUpdate, onDelete }: { item: S2220Item; onUpdate: (id: string, data: Partial<S2220Item>) => void; onDelete: (id: string) => void }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.conteudo);
  const isErro = item.tipo === "erro";

  const saveEdit = () => {
    if (editValue.trim()) {
      onUpdate(item.id, { conteudo: editValue.trim() });
    }
    setEditing(false);
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all group",
      item.concluido ? "bg-green-500/5 opacity-60" : "bg-muted/20 hover:bg-muted/40"
    )}>
      {/* Concluir */}
      <button
        onClick={() => onUpdate(item.id, { concluido: !item.concluido })}
        className={cn(
          "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
          item.concluido
            ? "bg-green-500 border-green-500 text-white"
            : isErro ? "border-red-300 dark:border-red-700 hover:border-red-500" : "border-blue-300 dark:border-blue-700 hover:border-blue-500"
        )}
      >
        {item.concluido && <Check className="w-3 h-3" />}
      </button>

      {/* Conteudo */}
      {editing ? (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(false); }}
          className="h-6 text-xs rounded flex-1"
          autoFocus
        />
      ) : (
        <span className={cn("flex-1 text-foreground", item.concluido && "line-through text-muted-foreground")}>{item.conteudo}</span>
      )}

      {/* Actions */}
      <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {editing ? (
          <>
            <Button variant="ghost" size="icon" onClick={saveEdit} className="h-5 w-5 rounded text-green-500 hover:bg-green-500/10"><Check className="w-3 h-3" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setEditing(false)} className="h-5 w-5 rounded text-muted-foreground hover:bg-muted"><X className="w-3 h-3" /></Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="icon" onClick={() => { setEditValue(item.conteudo); setEditing(true); }} className="h-5 w-5 rounded text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"><Edit2 className="w-3 h-3" /></Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} className="h-5 w-5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-3 h-3" /></Button>
          </>
        )}
      </div>
    </div>
  );
};

const S2220 = () => {
  const { user, canAccessSector } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth() + 1);
  const [selectedAno, setSelectedAno] = useState(currentYear);
  const [items, setItems] = useState<S2220Item[]>([]);
  const [newVerificacao, setNewVerificacao] = useState("");
  const [newErro, setNewErro] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("medwork_s2220_items").select("*")
        .eq("mes", selectedMes).eq("ano", selectedAno);
      if (data) setItems(data as S2220Item[]);
    };
    load();
  }, [selectedMes, selectedAno]);

  if (!user) return <Navigate to="/" replace />;
  if (!canAccessSector("esocial" as any) && !user.is_admin) return <Navigate to="/profile" replace />;

  const verificacoes = items.filter(i => i.tipo === "verificacao");
  const erros = items.filter(i => i.tipo === "erro");

  const addItem = async (tipo: "verificacao" | "erro", conteudo: string) => {
    if (!conteudo.trim()) return;
    const item: S2220Item = {
      id: String(Date.now()),
      mes: selectedMes,
      ano: selectedAno,
      tipo,
      conteudo: conteudo.trim(),
      concluido: false,
    };
    setItems(prev => [...prev, item]);
    await supabase.from("medwork_s2220_items").insert(item);
    if (tipo === "verificacao") setNewVerificacao("");
    else setNewErro("");
  };

  const updateItem = async (id: string, data: Partial<S2220Item>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
    await supabase.from("medwork_s2220_items").update(data).eq("id", id);
  };

  const deleteItem = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from("medwork_s2220_items").delete().eq("id", id);
  };

  const vConcluidas = verificacoes.filter(i => i.concluido).length;
  const eConcluidos = erros.filter(i => i.concluido).length;

  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <main className="flex-1 ml-60 sidebar-collapsed:ml-16 p-6 md:p-8 bg-background transition-all duration-200">
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileCheck className="w-6 h-6 text-blue-500" />
              S-2220 - eSocial
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Verificação diária e erros de envio</p>
          </div>
        </div>

        {/* Quadro eSocial */}
        <div className="bg-card rounded-2xl border border-border p-6 neon-card">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-[15px] font-semibold text-foreground">Quadro eSocial</h2>
            <div className="flex gap-2 ml-auto">
              <Select value={String(selectedMes)} onValueChange={(v) => setSelectedMes(Number(v))}>
                <SelectTrigger className="w-52 h-9 rounded-lg text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {meses.map((m, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(selectedAno)} onValueChange={(v) => setSelectedAno(Number(v))}>
                <SelectTrigger className="w-24 h-9 rounded-lg text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[currentYear - 1, currentYear, currentYear + 1].map(a => (
                    <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left - Verificação Diária */}
            <div className="rounded-xl border border-border bg-background/50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-blue-500/5 to-blue-500/10 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-blue-500" />
                  Verificação Diária do 2220
                </h3>
                {verificacoes.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">{vConcluidas}/{verificacoes.length} concluídas</span>
                )}
              </div>
              <div className="p-3 space-y-1.5 max-h-[500px] overflow-y-auto">
                {verificacoes.map((item) => (
                  <ItemRow key={item.id} item={item} onUpdate={updateItem} onDelete={deleteItem} />
                ))}
                {verificacoes.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">Nenhuma verificação neste mês.</p>
                )}
              </div>
              <div className="p-3 border-t border-border flex gap-2">
                <Input
                  value={newVerificacao}
                  onChange={(e) => setNewVerificacao(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addItem("verificacao", newVerificacao)}
                  placeholder="Adicionar verificação..."
                  className="h-8 text-xs rounded-lg"
                />
                <Button size="sm" onClick={() => addItem("verificacao", newVerificacao)} className="h-8 px-3 rounded-lg text-xs bg-blue-500 hover:bg-blue-600 text-white shrink-0">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Right - Erros de envio */}
            <div className="rounded-xl border border-border bg-background/50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-red-500/5 to-red-500/10 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Erros de Envio
                </h3>
                {erros.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">{eConcluidos}/{erros.length} resolvidos</span>
                )}
              </div>
              <div className="p-3 space-y-1.5 max-h-[500px] overflow-y-auto">
                {erros.map((item) => (
                  <ItemRow key={item.id} item={item} onUpdate={updateItem} onDelete={deleteItem} />
                ))}
                {erros.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">Nenhum erro neste mês.</p>
                )}
              </div>
              <div className="p-3 border-t border-border flex gap-2">
                <Input
                  value={newErro}
                  onChange={(e) => setNewErro(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addItem("erro", newErro)}
                  placeholder="Adicionar erro..."
                  className="h-8 text-xs rounded-lg"
                />
                <Button size="sm" onClick={() => addItem("erro", newErro)} className="h-8 px-3 rounded-lg text-xs bg-red-500 hover:bg-red-600 text-white shrink-0">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default S2220;
