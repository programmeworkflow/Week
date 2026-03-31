import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useParams } from "react-router-dom";
import { getSectorTitle } from "@/lib/sectors";
import { Sector } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Plus, ChevronLeft, ChevronRight, Pencil, Trash2, X, Calendar as CalendarIcon, Car, Monitor, User as UserIcon } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface Compromisso {
  id: string;
  data: Date;
  horaInicio: string;
  horaFim: string;
  usarCarro: boolean;
  tipoCarro?: "mobi" | "alugado";
  usarDataShow: boolean;
  tipo: "treinamento" | "visita" | "reuniao" | "compromisso";
  criadoPor: string;
  instrutor?: string;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const CalendarioTecnico = () => {
  const { sector: sectorParam } = useParams<{ sector: string }>();
  const currentSector = (sectorParam || "tecnico") as Sector;
  const { user, canAccessSector } = useAuth();
  const [baseMonth, setBaseMonth] = useState(new Date());
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Load compromissos from Supabase
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("medwork_compromissos").select("*").eq("sector", currentSector);
      if (data) {
        setCompromissos(data.map((c: any) => ({
          id: c.id,
          data: new Date(c.data),
          horaInicio: c.hora_inicio || "",
          horaFim: c.hora_fim || "",
          usarCarro: c.usar_carro || false,
          tipoCarro: c.tipo_carro || undefined,
          usarDataShow: c.usar_data_show || false,
          tipo: c.tipo || "treinamento",
          criadoPor: c.criado_por || "",
          instrutor: c.instrutor || "",
        })));
      }
    };
    load();
  }, [currentSector]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Compromisso | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const isTecnico = currentSector === "tecnico";

  // Form state
  const [formData, setFormData] = useState({
    data: "",
    horaInicio: "",
    horaFim: "",
    usarCarro: false,
    tipoCarro: "" as "" | "mobi" | "alugado",
    usarDataShow: false,
    tipo: "" as "" | "treinamento" | "visita" | "reuniao" | "compromisso",
  });

  if (!user) return <Navigate to="/" replace />;
  if (!canAccessSector(currentSector) && !user.is_admin) return <Navigate to="/dashboard/projects" replace />;

  const resetForm = () => {
    setFormData({ data: "", horaInicio: "", horaFim: "", usarCarro: false, tipoCarro: "", usarDataShow: false, tipo: "" });
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (c: Compromisso) => {
    setFormData({
      data: format(c.data, "yyyy-MM-dd"),
      horaInicio: c.horaInicio,
      horaFim: c.horaFim,
      usarCarro: c.usarCarro,
      tipoCarro: c.tipoCarro || "",
      usarDataShow: c.usarDataShow,
      tipo: c.tipo,
    });
    setEditingId(c.id);
    setSelectedEvent(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.data || !formData.horaInicio || !formData.tipo) return;

    const id = editingId || crypto.randomUUID();
    const compromisso: Compromisso = {
      id,
      data: new Date(formData.data + "T12:00:00"),
      horaInicio: formData.horaInicio,
      horaFim: formData.horaFim,
      usarCarro: formData.usarCarro,
      tipoCarro: formData.usarCarro ? (formData.tipoCarro as "mobi" | "alugado") : undefined,
      usarDataShow: formData.usarDataShow,
      tipo: formData.tipo as any,
      criadoPor: user.full_name,
    };

    const dbRow = {
      id, sector: currentSector, data: formData.data,
      hora_inicio: formData.horaInicio, hora_fim: formData.horaFim,
      tipo: formData.tipo, usar_carro: formData.usarCarro,
      tipo_carro: formData.tipoCarro || "", usar_data_show: formData.usarDataShow,
      criado_por: user.full_name, instrutor: "", origem: "manual",
    };

    if (editingId) {
      setCompromissos((prev) => prev.map((c) => (c.id === editingId ? compromisso : c)));
      await supabase.from("medwork_compromissos").update(dbRow).eq("id", editingId);
    } else {
      setCompromissos((prev) => [...prev, compromisso]);
      await supabase.from("medwork_compromissos").insert(dbRow);
    }
    setModalOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    setCompromissos((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirm(null);
    setSelectedEvent(null);
    await supabase.from("medwork_compromissos").delete().eq("id", id);
  };

  // Render 4 months: previous, current, next, next+1
  const months = [subMonths(baseMonth, 1), baseMonth, addMonths(baseMonth, 1), addMonths(baseMonth, 2)];

  const getEventsForDay = (day: Date) => compromissos.filter((c) => isSameDay(c.data, day));

  const getTipoColor = (tipo: string) => {
    if (tipo === "reuniao") return "bg-red-500";
    if (tipo === "visita") return "bg-purple-400";
    if (tipo === "treinamento") return "bg-[hsl(var(--status-andamento-text))]";
    return "bg-orange-500"; // visita
  };

  const getTipoLabel = (tipo: string) => {
    if (tipo === "reuniao") return "Reunião";
    if (tipo === "visita") return "Visita Técnica";
    if (tipo === "treinamento") return "Treinamento";
    return "Visita Técnica";
  };

  const renderMonth = (monthDate: Date) => {
    const start = startOfWeek(startOfMonth(monthDate));
    const end = endOfWeek(endOfMonth(monthDate));
    const days: Date[] = [];
    let current = start;
    while (current <= end) {
      days.push(current);
      current = addDays(current, 1);
    }

    return (
      <div key={monthDate.toISOString()} className="bg-card rounded-xl border border-border p-4 neon-card">
        <h3 className="text-sm font-semibold text-foreground mb-3 capitalize neon-text">
          {format(monthDate, "MMMM yyyy", { locale: ptBR })}
        </h3>
        <div className="grid grid-cols-7 gap-px">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-[10px] font-medium text-muted-foreground text-center py-1">
              {d}
            </div>
          ))}
          {days.map((day, i) => {
            const events = getEventsForDay(day);
            const inMonth = isSameMonth(day, monthDate);
            return (
              <button
                key={i}
                onClick={() => {
                  if (events.length > 0) setSelectedEvent(events[0]);
                }}
                className={cn(
                  "relative h-14 text-xs rounded-lg transition-all duration-200",
                  inMonth ? "text-foreground hover:bg-muted" : "text-muted-foreground/30",
                  isToday(day) && "bg-primary/10 font-semibold text-primary",
                  events.length > 0 && "cursor-pointer neon-hover"
                )}
              >
                <span className="block">{format(day, "d")}</span>
                {events.length > 0 && (
                  <div className="flex justify-center items-center gap-0.5 mt-0.5">
                    {events.map((ev) => (
                      <div key={ev.id} className="flex items-center gap-[2px]">
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            getTipoColor(ev.tipo)
                          )}
                        />
                        {isTecnico && ev.usarCarro && <Car className="w-2.5 h-2.5 text-cyan-400" />}
                        {isTecnico && ev.usarDataShow && <Monitor className="w-2.5 h-2.5 text-violet-400" />}
                      </div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border">
          {isTecnico ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-andamento-text))]" />
                <span className="text-[10px] text-muted-foreground">Treinamento</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-[10px] text-muted-foreground">Visita Técnica</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Car className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] text-muted-foreground">Carro</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Monitor className="w-3 h-3 text-violet-400" />
                <span className="text-[10px] text-muted-foreground">Data Show</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[10px] text-muted-foreground">Reunião</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-[10px] text-muted-foreground">Visita Técnica</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-60 sidebar-collapsed:ml-16 max-md:ml-0 transition-all duration-200">
        <div className="p-6 max-md:p-4 max-md:pt-16">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-foreground neon-text">Calendário — {getSectorTitle(currentSector)}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Gerencie treinamentos e visitas técnicas</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg btn-3d neon-hover" onClick={() => setBaseMonth((m) => subMonths(m, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs btn-3d neon-hover" onClick={() => setBaseMonth(new Date())}>
                Hoje
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg btn-3d neon-hover" onClick={() => setBaseMonth((m) => addMonths(m, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button onClick={openCreate} className="h-8 rounded-lg text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 btn-3d neon-hover animate-float">
                <Plus className="w-3.5 h-3.5" />
                Novo compromisso
              </Button>
            </div>
          </div>

          {/* 4-month grid */}
          <div className="grid grid-cols-2 max-md:grid-cols-1 gap-4">
            {months.map(renderMonth)}
          </div>

          {/* Upcoming events */}
          {compromissos.length > 0 && (
            <div className="mt-6 bg-card rounded-xl border border-border p-4 neon-card">
              <h3 className="text-sm font-semibold text-foreground mb-3 neon-text">Próximos compromissos</h3>
              <div className="space-y-2">
                {compromissos
                  .sort((a, b) => a.data.getTime() - b.data.getTime())
                  .slice(0, 10)
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedEvent(c)}
                      className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-muted transition-all duration-300 text-left neon-hover gradient-hover"
                    >
                      <span
                        className={cn(
                          "w-2.5 h-2.5 rounded-full flex-shrink-0",
                          getTipoColor(c.tipo)
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-foreground capitalize">{getTipoLabel(c.tipo)}</span>
                        <span className="text-[11px] text-muted-foreground ml-2">
                          {format(c.data, "dd/MM/yyyy", { locale: ptBR })} • {c.horaInicio} - {c.horaFim}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isTecnico && c.usarCarro && <Car className="w-3.5 h-3.5 text-cyan-400" />}
                        {isTecnico && c.usarDataShow && <Monitor className="w-3.5 h-3.5 text-violet-400" />}
                      </div>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        {c.criadoPor}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) { setModalOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <CalendarIcon className="w-4 h-4 text-primary" />
              {editingId ? "Editar compromisso" : "Novo compromisso"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Data</Label>
              <Input type="date" value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} className="h-9 rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Hora início</Label>
                <Input type="time" value={formData.horaInicio} onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })} className="h-9 rounded-lg text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Hora fim</Label>
                <Input type="time" value={formData.horaFim} onChange={(e) => setFormData({ ...formData, horaFim: e.target.value })} className="h-9 rounded-lg text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              {isTecnico ? (
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v as any })}>
                  <SelectTrigger className="h-9 rounded-lg text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="treinamento">Treinamento</SelectItem>
                    <SelectItem value="visita">Visita Técnica</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v as any })}>
                  <SelectTrigger className="h-9 rounded-lg text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reuniao">Reunião</SelectItem>
                    <SelectItem value="visita">Visita Técnica</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            {isTecnico && (
              <>
                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-cyan-400" /> Vai usar carro?</Label>
                  <Switch checked={formData.usarCarro} onCheckedChange={(v) => setFormData({ ...formData, usarCarro: v, tipoCarro: v ? formData.tipoCarro : "" })} />
                </div>
                {formData.usarCarro && (
                  <div className="space-y-1.5 animate-fade-in">
                    <Label className="text-xs">Tipo de carro</Label>
                    <Select value={formData.tipoCarro} onValueChange={(v) => setFormData({ ...formData, tipoCarro: v as "mobi" | "alugado" })}>
                      <SelectTrigger className="h-9 rounded-lg text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mobi">Mobi</SelectItem>
                        <SelectItem value="alugado">Alugado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5 text-violet-400" /> Vai usar Data Show?</Label>
                  <Switch checked={formData.usarDataShow} onCheckedChange={(v) => setFormData({ ...formData, usarDataShow: v })} />
                </div>
              </>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => { setModalOpen(false); resetForm(); }} className="flex-1 h-9 rounded-lg text-xs btn-3d neon-hover animate-float">
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.data || !formData.horaInicio || !formData.tipo}
                className="flex-1 h-9 rounded-lg text-xs bg-primary text-primary-foreground hover:bg-primary/90 btn-3d neon-hover animate-float"
                style={{ animationDelay: "0.15s" }}
              >
                {editingId ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => { if (!open) setSelectedEvent(null); }}>
        <DialogContent className="sm:max-w-sm">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <span className={cn("w-3 h-3 rounded-full", getTipoColor(selectedEvent.tipo))} />
                  {getTipoLabel(selectedEvent.tipo)}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data</span>
                  <span className="font-medium">{format(selectedEvent.data, "dd/MM/yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horário</span>
                  <span className="font-medium">{selectedEvent.horaInicio} - {selectedEvent.horaFim}</span>
                </div>

                {/* Carro and Data Show - only for técnico */}
                {isTecnico && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-cyan-400" /> Carro
                      </span>
                      {selectedEvent.usarCarro ? (
                        <span className="font-medium flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-cyan-400/10 text-cyan-400 text-xs">
                          <Car className="w-3.5 h-3.5" />
                          {selectedEvent.tipoCarro === "mobi" ? "Mobi" : "Alugado"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Não</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Monitor className="w-4 h-4 text-violet-400" /> Data Show
                      </span>
                      {selectedEvent.usarDataShow ? (
                        <span className="font-medium flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-violet-400/10 text-violet-400 text-xs">
                          <Monitor className="w-3.5 h-3.5" />
                          Sim
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Não</span>
                      )}
                    </div>
                  </>
                )}

                {/* Instrutor (if from planilha) */}
                {selectedEvent.instrutor && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Instrutor</span>
                    <span className="font-medium text-cyan-400 text-xs px-2 py-0.5 rounded-lg bg-cyan-400/10">
                      {selectedEvent.instrutor}
                    </span>
                  </div>
                )}

                {/* Criado por */}
                <div className="flex justify-between items-center pt-1 border-t border-border">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-primary" /> Criado por
                  </span>
                  <span className="font-medium text-primary text-xs px-2 py-0.5 rounded-lg bg-primary/10">
                    {selectedEvent.criadoPor}
                  </span>
                </div>

                <div className="flex gap-2 pt-3 border-t border-border">
                  <Button variant="outline" onClick={() => openEdit(selectedEvent)} className="flex-1 h-8 rounded-lg text-xs gap-1 btn-3d neon-hover animate-float">
                    <Pencil className="w-3 h-3" /> Editar
                  </Button>
                  {deleteConfirm === selectedEvent.id ? (
                    <div className="flex gap-1 flex-1">
                      <Button variant="destructive" onClick={() => handleDelete(selectedEvent.id)} className="flex-1 h-8 rounded-lg text-xs btn-3d neon-hover">
                        Confirmar
                      </Button>
                      <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="h-8 rounded-lg text-xs px-2 btn-3d neon-hover">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={() => setDeleteConfirm(selectedEvent.id)} className="flex-1 h-8 rounded-lg text-xs gap-1 text-destructive hover:text-destructive btn-3d neon-hover animate-float" style={{ animationDelay: "0.15s" }}>
                      <Trash2 className="w-3 h-3" /> Excluir
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarioTecnico;
