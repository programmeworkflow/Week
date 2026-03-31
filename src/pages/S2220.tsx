import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, FileCheck, ClipboardCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface S2220Item {
  id: string;
  mes: number;
  ano: number;
  tipo: "verificacao" | "erro";
  conteudo: string;
}

const meses = [
  "Mês 01 - Janeiro", "Mês 02 - Fevereiro", "Mês 03 - Março",
  "Mês 04 - Abril", "Mês 05 - Maio", "Mês 06 - Junho",
  "Mês 07 - Julho", "Mês 08 - Agosto", "Mês 09 - Setembro",
  "Mês 10 - Outubro", "Mês 11 - Novembro", "Mês 12 - Dezembro",
];

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
    };
    setItems(prev => [...prev, item]);
    await supabase.from("medwork_s2220_items").insert(item);
    if (tipo === "verificacao") setNewVerificacao("");
    else setNewErro("");
  };

  const deleteItem = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from("medwork_s2220_items").delete().eq("id", id);
  };

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
              <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-blue-500/5 to-blue-500/10">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-blue-500" />
                  Verificação Diária do 2220
                </h3>
              </div>
              <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
                {verificacoes.map((item, i) => (
                  <div key={item.id} className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors",
                    i % 2 === 0 ? "bg-muted/30" : "bg-muted/10"
                  )}>
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] font-bold text-blue-500 shrink-0">{i + 1}</span>
                    <span className="flex-1 text-foreground">{item.conteudo}</span>
                    <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)} className="h-5 w-5 rounded shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
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
              <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-red-500/5 to-red-500/10">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Erros de Envio
                </h3>
              </div>
              <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
                {erros.map((item, i) => (
                  <div key={item.id} className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors",
                    i % 2 === 0 ? "bg-muted/30" : "bg-muted/10"
                  )}>
                    <span className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center text-[10px] font-bold text-red-500 shrink-0">{i + 1}</span>
                    <span className="flex-1 text-foreground">{item.conteudo}</span>
                    <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)} className="h-5 w-5 rounded shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
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
