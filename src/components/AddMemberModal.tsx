import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UserPlus, Shield } from "lucide-react";
import { Sector, SECTORS, User } from "@/lib/mock-data";

interface AddMemberModalProps {
  editingUser?: User | null;
  onClose?: () => void;
}

export const AddMemberModal = ({ editingUser, onClose }: AddMemberModalProps) => {
  const { addUser, updateUser } = useAuth();
  const [open, setOpen] = useState(false);
  const isEditing = !!editingUser;
  const isControlled = editingUser !== undefined;

  const [form, setForm] = useState({
    full_name: "",
    cpf: "",
    email: "",
    password: "",
    sectors: [] as Sector[],
    is_admin: false,
  });

  useEffect(() => {
    if (editingUser) {
      setForm({
        full_name: editingUser.full_name,
        cpf: editingUser.cpf,
        email: editingUser.email,
        password: editingUser.password,
        sectors: editingUser.sectors,
        is_admin: editingUser.is_admin,
      });
    }
  }, [editingUser]);

  const toggleSector = (sector: Sector) => {
    setForm((p) => ({
      ...p,
      sectors: p.sectors.includes(sector)
        ? p.sectors.filter((s) => s !== sector)
        : [...p.sectors, sector],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.sectors.length === 0) return;

    if (isEditing && editingUser) {
      updateUser(editingUser.id, {
        full_name: form.full_name,
        cpf: form.cpf,
        email: form.email,
        password: form.password,
        sectors: form.sectors,
        is_admin: form.is_admin,
      });
    } else {
      addUser({
        full_name: form.full_name,
        cpf: form.cpf,
        email: form.email,
        password: form.password,
        sectors: form.is_admin ? ["diretoria", "tecnico", "comercial", "saude", "financeiro"] : form.sectors,
        is_admin: form.is_admin,
        company_id: "1",
      });
    }
    setForm({ full_name: "", cpf: "", email: "", password: "", sectors: [], is_admin: false });
    if (onClose) onClose();
    setOpen(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      if (onClose) onClose();
      setForm({ full_name: "", cpf: "", email: "", password: "", sectors: [], is_admin: false });
    }
    setOpen(v);
  };

  const dialogOpen = isControlled ? !!editingUser : open;

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button className="gap-2 btn-3d neon-hover animate-float text-primary-foreground rounded-xl font-semibold transition-all duration-300">
            <UserPlus className="w-4 h-4" />
            Adicionar Membro
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Membro" : "Cadastrar Novo Membro"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Nome Completo</Label>
            <Input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>CPF</Label>
            <Input value={form.cpf} onChange={(e) => setForm((p) => ({ ...p, cpf: e.target.value }))} placeholder="000.000.000-00" required />
          </div>
          <div className="space-y-2">
            <Label>Email Profissional</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>Senha</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="••••••••" required />
          </div>

          {/* Admin toggle */}
          <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/40 border border-border">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-400" />
              <div>
                <Label className="text-sm font-medium">Administrador</Label>
                <p className="text-[11px] text-muted-foreground">Acesso total a todos os setores</p>
              </div>
            </div>
            <Switch checked={form.is_admin} onCheckedChange={(v) => setForm((p) => ({ ...p, is_admin: v, sectors: v ? ["diretoria", "tecnico", "comercial", "saude", "financeiro"] as Sector[] : p.sectors }))} />
          </div>

          {/* Sectors - only show if not admin */}
          {!form.is_admin && (
            <div className="space-y-2 animate-fade-in">
              <Label>Setores *</Label>
              <div className="flex flex-wrap gap-2">
                {SECTORS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSector(s.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 ${
                      form.sectors.includes(s.id)
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted text-muted-foreground border-border hover:border-primary/50 hover:bg-accent"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {form.sectors.length === 0 && (
                <p className="text-xs text-destructive">Selecione ao menos um setor</p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full btn-3d neon-hover text-primary-foreground rounded-xl font-semibold">
            {isEditing ? "Salvar Alterações" : "Cadastrar Membro"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
