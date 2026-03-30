import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft } from "lucide-react";
import { SECTORS, Sector } from "@/lib/mock-data";

interface TransferSectorModalProps {
  currentSector: Sector;
  onTransfer: (newSector: Sector, description: string) => void;
}

export const TransferSectorModal = ({ currentSector, onTransfer }: TransferSectorModalProps) => {
  const [open, setOpen] = useState(false);
  const [sector, setSector] = useState<Sector | "">("");
  const [description, setDescription] = useState("");

  const availableSectors = SECTORS.filter(s => s.id !== currentSector);

  const handleSubmit = () => {
    if (!sector || !description.trim()) return;
    onTransfer(sector as Sector, description.trim());
    setOpen(false);
    setSector("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 rounded-[10px] h-9 text-[13px] hover:bg-muted">
          <ArrowRightLeft className="w-4 h-4 stroke-[1.5]" />
          Enviar para outro setor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
            Transferir Projeto
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Setor destino</Label>
            <Select value={sector} onValueChange={(v) => setSector(v as Sector)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Selecione o setor" />
              </SelectTrigger>
              <SelectContent>
                {availableSectors.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Descrição da transferência <span className="text-destructive">*</span></Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o motivo da transferência..."
              rows={3}
              className="rounded-xl"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 rounded-[10px]">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!sector || !description.trim()}
              className="flex-1 rounded-[10px] bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Transferir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
