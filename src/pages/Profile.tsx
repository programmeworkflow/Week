import { useState, useEffect } from "react";
import { useProjects } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { AppSidebar } from "@/components/AppSidebar";
import { AddMemberModal } from "@/components/AddMemberModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, Target, CheckCircle2, Clock, TrendingUp, Medal, AlertCircle, Pencil, Trash2, UserCog, Star, Award, Zap, Crown, Lock } from "lucide-react";
import { User, SECTORS } from "@/lib/mock-data";

const Profile = () => {
  const { projects, tecnicoProjects } = useProjects();
  const { user, allUsers: users, updateProfile, deleteUser, updateUser } = useAuth();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [editingSelf, setEditingSelf] = useState(false);
  const [selfForm, setSelfForm] = useState({ full_name: "", email: "", password: "" });
  const [myPoints, setMyPoints] = useState(0);
  const [myProjectsDone, setMyProjectsDone] = useState(0);

  // Load personal points from Supabase
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Search by user_id OR user_name (responsável name)
      const { data } = await supabase.from("medwork_premiacao").select("*")
        .or(`user_id.eq.${user.id},user_name.eq.${user.full_name}`);
      if (data) {
        setMyPoints(data.reduce((sum, e) => sum + (e.points || 0), 0));
        setMyProjectsDone(data.length);
      }
    };
    load();
  }, [user]);

  // Personal project stats (projects where user is responsible)
  const myProjects = user ? projects.filter((p) => p.responsible_ids?.includes(user.id)) : [];
  const myTecnico = user ? tecnicoProjects.filter((tp) => tp.responsavel === user.full_name) : [];
  const notAuth = myProjects.filter((p) => p.status === "not_authenticated").length + myTecnico.filter(t => t.status_tecnico === "Não cadastradas no ESO").length;
  const notStarted = myProjects.filter((p) => p.status === "not_started").length + myTecnico.filter(t => t.status_tecnico === "Não iniciadas" || t.status_tecnico === "Zona de espera").length;
  const pending = myProjects.filter((p) => p.status === "pending" || p.status === "doc_pending" || p.status === "review").length + myTecnico.filter(t => ["Visita pendente", "Documentação pendente", "Revisão"].includes(t.status_tecnico)).length;
  const done = myProjectsDone;

  const medals = Math.floor(myPoints / 1000);

  const getLevel = () => {
    if (myPoints >= 4500) return { name: "MEDWORKINO OFICIAL", icon: Crown, color: "text-yellow-400", bg: "bg-yellow-400/10", progress: 100 };
    if (myPoints >= 2500) return { name: "Destaque MedWork", icon: Zap, color: "text-red-400", bg: "bg-red-400/10", progress: Math.round(((myPoints - 2500) / 2000) * 100) };
    if (myPoints >= 1500) return { name: "Especialista", icon: Award, color: "text-purple-400", bg: "bg-purple-400/10", progress: Math.round(((myPoints - 1500) / 1000) * 100) };
    if (myPoints >= 750) return { name: "Profissional", icon: Star, color: "text-cyan-400", bg: "bg-cyan-400/10", progress: Math.round(((myPoints - 750) / 750) * 100) };
    return { name: "Iniciante", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10", progress: Math.round((myPoints / 750) * 100) };
  };

  const level = getLevel();
  const LevelIcon = level.icon;

  const getFeedback = () => {
    if (done > notStarted + pending) return { msg: "Excelente! Você está concluindo mais do que planejando. Continue assim!", type: "success" as const };
    if (pending > done) return { msg: "Muitos projetos pendentes. Foque em concluí-los antes de iniciar novos.", type: "warning" as const };
    return { msg: "Equilíbrio saudável entre planejamento e execução. Bom trabalho!", type: "neutral" as const };
  };

  const feedback = getFeedback();

  const stats = [
    { label: "Não Atribuídos", value: notAuth, icon: AlertCircle, color: "text-status-not-authenticated", bg: "bg-status-not-authenticated-bg" },
    { label: "Não Iniciados", value: notStarted, icon: Clock, color: "text-status-not-started", bg: "bg-status-not-started-bg" },
    { label: "Pendentes", value: pending, icon: TrendingUp, color: "text-status-pending", bg: "bg-status-pending-bg" },
    { label: "Concluídos", value: done, icon: CheckCircle2, color: "text-status-done", bg: "bg-status-done-bg" },
  ];

  const handleDelete = () => {
    if (deletingUser) {
      deleteUser(deletingUser.id);
      setDeletingUser(null);
    }
  };

  const openEditSelf = () => {
    if (!user) return;
    setSelfForm({ full_name: user.full_name, email: user.email, password: "" });
    setEditingSelf(true);
  };

  const handleSaveSelf = () => {
    if (!user) return;
    const updates: Partial<User> = {};
    if (selfForm.full_name && selfForm.full_name !== user.full_name) updates.full_name = selfForm.full_name;
    if (selfForm.email && selfForm.email !== user.email) updates.email = selfForm.email;
    if (selfForm.password) updates.password = selfForm.password;
    if (Object.keys(updates).length > 0) {
      updateProfile(updates);
      updateUser(user.id, updates);
    }
    setEditingSelf(false);
  };

  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <main className="flex-1 ml-60 sidebar-collapsed:ml-16 p-6 md:p-8 transition-all duration-200">
        <div className="max-w-4xl animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Perfil & Desempenho</h1>
              <p className="text-muted-foreground text-sm mt-1">Métricas e gestão da equipe</p>
            </div>
            {user?.is_admin && <AddMemberModal />}
          </div>

          {/* User info */}
          <Card className="mb-6 border-border shadow-card rounded-[12px] overflow-hidden">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-[12px] bg-primary flex items-center justify-center text-base font-medium text-primary-foreground">
                {user?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-foreground">{user?.full_name}</h2>
                <p className="text-muted-foreground text-[13px]">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-[11px] font-medium rounded-full status-concluido">
                  {user?.is_admin ? "Administrador" : "Colaborador"}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={openEditSelf}
                className="gap-2 rounded-[10px] text-[13px] hover:bg-muted transition-all duration-200 h-9"
              >
                <UserCog className="w-4 h-4" />
                Editar Perfil
              </Button>
            </CardContent>
          </Card>

          {/* Gamification */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="border-border shadow-card rounded-[12px]">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-accent flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-accent-foreground stroke-[1.5]" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-foreground">{myPoints}</div>
                  <div className="text-[13px] text-muted-foreground">Pontos</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border shadow-card rounded-[12px]">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-accent flex items-center justify-center">
                  <Medal className="w-4 h-4 text-accent-foreground stroke-[1.5]" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-foreground">{medals}</div>
                  <div className="text-[13px] text-muted-foreground">Medalhas</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border shadow-card rounded-[12px]">
              <CardContent className="p-5 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-[10px] ${level.bg} flex items-center justify-center`}>
                  <LevelIcon className={`w-4 h-4 ${level.color} stroke-[1.5]`} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{level.name}</div>
                  <div className="text-[11px] text-muted-foreground">Nível</div>
                  <div className="w-16 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${level.progress}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {stats.map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label} className="border-border shadow-card rounded-[12px] hover:shadow-card-hover transition-all duration-200">
                <CardContent className="p-4 text-center">
                  <div className={`w-8 h-8 rounded-[10px] ${bg} flex items-center justify-center mx-auto mb-2`}>
                    <Icon className={`w-4 h-4 ${color} stroke-[1.5]`} />
                  </div>
                  <div className="text-xl font-semibold text-foreground">{value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feedback */}
          <Card className={`border-border shadow-card rounded-xl ${feedback.type === "success" ? "border-l-2 border-l-status-done" : feedback.type === "warning" ? "border-l-2 border-l-status-not-started" : ""}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Feedback Inteligente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">{feedback.msg}</p>
            </CardContent>
          </Card>

          {user?.is_admin && (
            <>
              <h3 className="text-base font-semibold text-foreground mt-8 mb-4 neon-text">Equipe ({users.length})</h3>
              <div className="grid grid-cols-2 gap-3">
                {users.map((u) => (
                  <Card key={u.id} className="border-border shadow-card rounded-xl hover:shadow-card-hover transition-all duration-150 group neon-card">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">
                        {u.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-foreground truncate">{u.full_name}</span>
                          {u.is_admin && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-400/15 text-violet-400 font-semibold border border-violet-400/20">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {u.sectors.map((s) => (
                            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground font-medium">
                              {SECTORS.find((sec) => sec.id === s)?.label || s}
                            </span>
                          ))}
                        </div>
                      </div>
                      {u.id !== user.id && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-lg hover:bg-muted"
                            onClick={() => setEditingUser(u)}
                          >
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-lg hover:bg-destructive/10"
                            onClick={() => setDeletingUser(u)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Edit Member Modal */}
          {editingUser && (
            <AddMemberModal editingUser={editingUser} onClose={() => setEditingUser(null)} />
          )}

          {/* Edit Self Dialog */}
          <Dialog open={editingSelf} onOpenChange={(v) => !v && setEditingSelf(false)}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-primary" />
                  Editar Perfil
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={selfForm.full_name}
                    onChange={(e) => setSelfForm({ ...selfForm, full_name: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={selfForm.email}
                    onChange={(e) => setSelfForm({ ...selfForm, email: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    Trocar Senha
                  </Label>
                  <Input
                    type="password"
                    value={selfForm.password}
                    onChange={(e) => setSelfForm({ ...selfForm, password: e.target.value })}
                    placeholder="Digite a nova senha"
                    className="rounded-xl"
                  />
                  <p className="text-[11px] text-muted-foreground">Deixe em branco para manter a senha atual</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 rounded-lg" onClick={() => setEditingSelf(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveSelf} className="flex-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={!!deletingUser} onOpenChange={(v) => !v && setDeletingUser(null)}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Excluir Responsável</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja excluir <strong>{deletingUser?.full_name}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeletingUser(null)}>
                  Cancelar
                </Button>
                <Button variant="destructive" className="flex-1 rounded-xl btn-3d" onClick={handleDelete}>
                  Excluir
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};

export default Profile;
