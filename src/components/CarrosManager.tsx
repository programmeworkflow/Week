import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Car, Plus, Trash2 } from "lucide-react";
import { Carro, fetchCarrosTodos, createCarro, updateCarro, deleteCarro } from "@/lib/carros";
import { toast } from "sonner";

export const CarrosManager = () => {
  const [carros, setCarros] = useState<Carro[]>([]);
  const [novoNome, setNovoNome] = useState("");
  const [novaPlaca, setNovaPlaca] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setCarros(await fetchCarrosTodos());
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const handleAdd = async () => {
    if (!novoNome.trim()) {
      toast.error("Dê um nome pro carro");
      return;
    }
    const novo = await createCarro(novoNome.trim(), novaPlaca.trim() || undefined);
    if (novo) {
      toast.success(`Carro "${novo.nome}" adicionado`);
      setNovoNome("");
      setNovaPlaca("");
      reload();
    } else {
      toast.error("Erro ao adicionar carro");
    }
  };

  const handleToggleAtivo = async (c: Carro) => {
    const ok = await updateCarro(c.id, { ativo: !c.ativo });
    if (ok) reload();
    else toast.error("Erro ao atualizar");
  };

  const handleDelete = async (c: Carro) => {
    if (!confirm(`Excluir o carro "${c.nome}"? Reservas existentes ficarão sem carro.`)) return;
    const ok = await deleteCarro(c.id);
    if (ok) {
      toast.success("Carro excluído");
      reload();
    } else {
      toast.error("Erro ao excluir");
    }
  };

  return (
    <Card className="border-border shadow-card rounded-xl mt-6">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Car className="w-4 h-4 text-cyan-400" />
          Carros disponíveis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-[11px] text-muted-foreground">Nome / modelo</label>
            <Input
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Ex: Onix prata, HB20 alugado..."
              className="h-9 text-sm"
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            />
          </div>
          <div className="w-32 space-y-1">
            <label className="text-[11px] text-muted-foreground">Placa (opcional)</label>
            <Input
              value={novaPlaca}
              onChange={(e) => setNovaPlaca(e.target.value.toUpperCase())}
              placeholder="ABC-1234"
              className="h-9 text-sm"
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            />
          </div>
          <Button size="sm" onClick={handleAdd} className="h-9 gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Adicionar
          </Button>
        </div>

        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando…</p>
        ) : carros.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum carro cadastrado ainda.</p>
        ) : (
          <div className="space-y-1.5 mt-2">
            {carros.map((c) => (
              <div
                key={c.id}
                className={`flex items-center gap-3 p-2.5 rounded-lg border border-border ${c.ativo ? "bg-card" : "bg-muted/30 opacity-60"}`}
              >
                <Car className={`w-4 h-4 ${c.ativo ? "text-cyan-400" : "text-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{c.nome}</div>
                  {c.placa && <div className="text-[11px] text-muted-foreground">{c.placa}</div>}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">{c.ativo ? "Ativo" : "Inativo"}</span>
                  <Switch checked={c.ativo} onCheckedChange={() => handleToggleAtivo(c)} />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(c)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">
          Carros inativos não aparecem na seleção de compromissos. Use isso quando devolver o carro alugado.
        </p>
      </CardContent>
    </Card>
  );
};
