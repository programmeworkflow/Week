import { useState, useEffect, useCallback } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { supabase } from "@/lib/supabase";
import { isGoogleConnected, initGoogleAuth, disconnectGoogle, createGoogleEvent, updateGoogleEvent, deleteGoogleEvent, getGoogleEmail } from "@/lib/googleCalendar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/contexts/ProjectContext";
import { toast } from "sonner";
import { Navigate, useParams } from "react-router-dom";
import { getSectorTitle } from "@/lib/sectors";
import { Sector } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Plus, ChevronLeft, ChevronRight, Pencil, Trash2, X, Calendar as CalendarIcon, Car, Monitor, User as UserIcon } from "lucide-react";
import { Carro, fetchCarrosAtivos, findCarroConflito } from "@/lib/carros";
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
  tipoCarro?: "mobi" | "alugado"; // legado — não usar pra novos
  carroId?: string | null;
  carroNome?: string;
  usarDataShow: boolean;
  tipo: "treinamento" | "visita" | "reuniao" | "compromisso";
  sector?: Sector; // origem do compromisso (em modo linked)
  criadoPor: string;
  instrutor?: string;
  empresa?: string;
  localizacao?: string;
  observacoes?: string;
  responsavel?: string;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const CalendarioTecnico = () => {
  const { sector: sectorParam } = useParams<{ sector: string }>();
  const currentSector = (sectorParam || "tecnico") as Sector;
  const { user, canAccessSector } = useAuth();
  const { users } = useProjects();
  const [baseMonth, setBaseMonth] = useState(new Date());
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [carros, setCarros] = useState<Carro[]>([]);

  // Setores linkados: técnico, psicossocial e saúde compartilham o mesmo calendário
  // Reservas de carro são cross-sector (se psicossocial reserva, técnico vê e vice-versa)
  const LINKED_SECTORS: Sector[] = ["tecnico", "psicossocial", "saude"];
  const isLinkedSector = LINKED_SECTORS.includes(currentSector);

  // Load compromissos + carros from Supabase
  useEffect(() => {
    const load = async () => {
      const compQuery = isLinkedSector
        ? supabase.from("medwork_compromissos").select("*").in("sector", LINKED_SECTORS)
        : supabase.from("medwork_compromissos").select("*").eq("sector", currentSector);
      const [compRes, carrosList] = await Promise.all([
        compQuery,
        fetchCarrosAtivos(),
      ]);
      setCarros(carrosList);
      const carroMap = new Map(carrosList.map(c => [c.id, c.nome]));
      if (compRes.data) {
        setCompromissos(compRes.data.map((c: any) => ({
          id: c.id,
          data: new Date(c.data + "T12:00:00"),
          horaInicio: c.hora_inicio || "",
          horaFim: c.hora_fim || "",
          usarCarro: c.usar_carro || false,
          tipoCarro: c.tipo_carro || undefined,
          carroId: c.carro_id || null,
          carroNome: c.carro_id ? carroMap.get(c.carro_id) : undefined,
          usarDataShow: c.usar_data_show || false,
          tipo: c.tipo || "treinamento",
          sector: c.sector as Sector | undefined,
          criadoPor: c.criado_por || "",
          instrutor: c.instrutor || "",
          empresa: c.empresa || "",
          localizacao: c.localizacao || "",
          observacoes: c.observacoes || "",
          responsavel: c.responsavel || "",
        })));
      }
    };
    load();
  }, [currentSector]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Compromisso | null>(null);
  // Quando o dia tem 2+ compromissos, abre uma lista pra escolher qual ver
  const [dayEvents, setDayEvents] = useState<{ date: Date; events: Compromisso[] } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const isTecnico = currentSector === "tecnico";
  const [googleConnected, setGoogleConnected] = useState(isGoogleConnected());

  const handleConnectGoogle = async () => {
    try {
      await initGoogleAuth();
      setGoogleConnected(true);
      // Save Google email only for calendar notifications (NOT login email)
      const googleEmail = await getGoogleEmail();
      if (googleEmail && user) {
        await supabase.from("medwork_users").update({ google_email: googleEmail }).eq("id", user.id);
        toast.success(`Google Calendar conectado! (${googleEmail})`);
      }
    } catch (err) {
      console.error("Erro ao conectar Google:", err);
    }
  };

  const handleDisconnectGoogle = () => {
    disconnectGoogle();
    setGoogleConnected(false);
  };

  // Form state
  const [formData, setFormData] = useState({
    data: "",
    horaInicio: "",
    horaFim: "",
    usarCarro: false,
    carroId: "" as string,
    usarDataShow: false,
    tipo: "" as "" | "treinamento" | "visita" | "reuniao" | "compromisso",
    paraEmail: "",
    paraNome: "",
    empresa: "",
    localizacao: "",
    observacoes: "",
    responsavel: "",
  });

  if (!user) return <Navigate to="/" replace />;
  if (!canAccessSector(currentSector) && !user.is_admin) return <Navigate to="/dashboard/projects" replace />;

  const resetForm = () => {
    setFormData({ data: "", horaInicio: "", horaFim: "", usarCarro: false, carroId: "", usarDataShow: false, tipo: "", paraEmail: "", paraNome: "", empresa: "", localizacao: "", observacoes: "", responsavel: "" });
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (c: Compromisso & { paraEmail?: string; paraNome?: string }) => {
    setFormData({
      data: format(c.data, "yyyy-MM-dd"),
      horaInicio: c.horaInicio,
      horaFim: c.horaFim,
      usarCarro: c.usarCarro,
      carroId: c.carroId || "",
      usarDataShow: c.usarDataShow,
      tipo: c.tipo,
      paraEmail: c.paraEmail || "",
      paraNome: c.paraNome || "",
      empresa: c.empresa || "",
      localizacao: c.localizacao || "",
      observacoes: c.observacoes || "",
      responsavel: c.responsavel || "",
    });
    setEditingId(c.id);
    setSelectedEvent(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.data || !formData.horaInicio || !formData.tipo) return;

    // Conflict check: carro já reservado naquele intervalo?
    if (formData.usarCarro && formData.carroId) {
      const dataObj = new Date(formData.data + "T12:00:00");
      const conflito = findCarroConflito(
        formData.carroId, dataObj, formData.horaInicio, formData.horaFim,
        compromissos.map(c => ({ id: c.id, carroId: c.carroId, data: c.data, horaInicio: c.horaInicio, horaFim: c.horaFim })),
        editingId || undefined
      );
      if (conflito) {
        const carroNome = carros.find(c => c.id === formData.carroId)?.nome || "esse carro";
        toast.error(`${carroNome} já está reservado de ${conflito.horaInicio} às ${conflito.horaFim} nesse dia`);
        return;
      }
    }

    const id = editingId || crypto.randomUUID();
    const carroSelecionado = carros.find(c => c.id === formData.carroId);
    const compromisso: Compromisso = {
      id,
      data: new Date(formData.data + "T12:00:00"),
      horaInicio: formData.horaInicio,
      horaFim: formData.horaFim,
      usarCarro: formData.usarCarro,
      carroId: formData.usarCarro ? formData.carroId : null,
      carroNome: carroSelecionado?.nome,
      usarDataShow: formData.usarDataShow,
      tipo: formData.tipo as any,
      criadoPor: user.full_name,
      empresa: formData.empresa,
      localizacao: formData.localizacao,
      observacoes: formData.observacoes,
      responsavel: formData.responsavel,
    };

    const dbRow = {
      id, sector: currentSector, data: formData.data,
      hora_inicio: formData.horaInicio, hora_fim: formData.horaFim,
      tipo: formData.tipo, usar_carro: formData.usarCarro,
      tipo_carro: "", carro_id: formData.usarCarro ? formData.carroId || null : null,
      usar_data_show: formData.usarDataShow,
      criado_por: user.full_name, instrutor: "", origem: "manual",
      para_email: formData.paraEmail, para_nome: formData.paraNome,
      empresa: formData.empresa,
      localizacao: formData.localizacao,
      observacoes: formData.observacoes,
      responsavel: formData.responsavel,
    };

    // Google Calendar sync
    const attendees = formData.paraEmail ? [formData.paraEmail] : [];
    const gcalEvent = {
      summary: `${getTipoLabel(formData.tipo as any)}${formData.paraNome ? ` - ${formData.paraNome}` : ""}`,
      date: formData.data,
      startTime: formData.horaInicio,
      endTime: formData.horaFim,
      description: `Criado por: ${user.full_name}${formData.paraNome ? `\nPara: ${formData.paraNome}` : ""}\nOrigem: Week MedWork`,
      attendees,
    };

    if (editingId) {
      setCompromissos((prev) => prev.map((c) => (c.id === editingId ? compromisso : c)));
      await supabase.from("medwork_compromissos").update(dbRow).eq("id", editingId);
      // Update Google Calendar event if connected
      if (googleConnected) {
        try {
          const { data: existing } = await supabase.from("medwork_compromissos").select("google_event_id").eq("id", editingId).single();
          if (existing?.google_event_id) {
            await updateGoogleEvent(existing.google_event_id, gcalEvent);
          }
        } catch (e) { console.error("Erro ao atualizar Google Calendar:", e); }
      }
    } else {
      setCompromissos((prev) => [...prev, compromisso]);
      await supabase.from("medwork_compromissos").insert(dbRow);
      // Create Google Calendar event if connected
      if (googleConnected) {
        try {
          const googleEventId = await createGoogleEvent(gcalEvent);
          if (googleEventId) {
            await supabase.from("medwork_compromissos").update({ google_event_id: googleEventId }).eq("id", id);
          }
        } catch (e) { console.error("Erro ao criar Google Calendar:", e); }
      }
    }
    setModalOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    // Delete from Google Calendar if connected
    if (googleConnected) {
      try {
        const { data: existing } = await supabase.from("medwork_compromissos").select("google_event_id").eq("id", id).single();
        if (existing?.google_event_id) {
          await deleteGoogleEvent(existing.google_event_id);
        }
      } catch (e) { console.error("Erro ao excluir do Google Calendar:", e); }
    }
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
                  if (events.length === 1) setSelectedEvent(events[0]);
                  else if (events.length > 1) setDayEvents({ date: day, events });
                }}
                className={cn(
                  "relative h-14 max-md:h-16 text-xs rounded-xl transition-all duration-200",
                  inMonth ? "text-foreground hover:bg-muted" : "text-muted-foreground/30",
                  isToday(day) && !events.length && "bg-primary/10 font-semibold text-primary",
                  events.length > 0 && "cursor-pointer ring-2 ring-primary/50 bg-primary/15 font-bold text-primary dark:shadow-[0_0_12px_rgba(34,197,94,0.3)]",
                  events.length > 0 && isToday(day) && "ring-primary bg-primary/25"
                )}
              >
                <span className="block text-[13px]">{format(day, "d")}</span>
                {events.length > 0 && (
                  <div className="flex justify-center items-center gap-0.5 mt-0.5">
                    {events.map((ev) => (
                      <div key={ev.id} className="flex items-center gap-[2px]">
                        <span
                          className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            getTipoColor(ev.tipo)
                          )}
                        />
                        {isLinkedSector && ev.usarCarro && <Car className="w-2.5 h-2.5 text-cyan-400" />}
                        {isLinkedSector && ev.usarDataShow && <Monitor className="w-2.5 h-2.5 text-violet-400" />}
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
          {isLinkedSector ? (
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
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[10px] text-muted-foreground">Reunião</span>
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
          <div className="flex items-start justify-between mb-6 gap-3 max-md:flex-col">
            <div>
              <h1 className="text-xl font-semibold text-foreground neon-text">Calendário — {getSectorTitle(currentSector)}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Gerencie treinamentos e visitas técnicas</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap max-md:w-full">
              <Button variant="outline" size="icon" aria-label="Mês anterior" className="h-8 w-8 rounded-lg btn-3d neon-hover" onClick={() => setBaseMonth((m) => subMonths(m, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs btn-3d neon-hover" onClick={() => setBaseMonth(new Date())}>
                Hoje
              </Button>
              <Button variant="outline" size="icon" aria-label="Próximo mês" className="h-8 w-8 rounded-lg btn-3d neon-hover" onClick={() => setBaseMonth((m) => addMonths(m, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button onClick={openCreate} className="h-8 rounded-lg text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 btn-3d neon-hover animate-float">
                <Plus className="w-3.5 h-3.5" />
                Novo compromisso
              </Button>
              {googleConnected ? (
                <Button variant="outline" onClick={handleDisconnectGoogle} className="h-8 rounded-lg text-xs gap-1.5 border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10">
                  <CalendarIcon className="w-3.5 h-3.5" /> Google conectado
                </Button>
              ) : (
                <Button variant="outline" onClick={handleConnectGoogle} className="h-8 rounded-lg text-xs gap-1.5 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10">
                  <CalendarIcon className="w-3.5 h-3.5" /> Conectar Google
                </Button>
              )}
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
                        {isLinkedSector && c.usarCarro && <Car className="w-3.5 h-3.5 text-cyan-400" />}
                        {isLinkedSector && c.usarDataShow && <Monitor className="w-3.5 h-3.5 text-violet-400" />}
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
              {isLinkedSector ? (
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v as any })}>
                  <SelectTrigger className="h-9 rounded-lg text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="treinamento">Treinamento</SelectItem>
                    <SelectItem value="visita">Visita Técnica</SelectItem>
                    <SelectItem value="reuniao">Reunião</SelectItem>
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
            {isLinkedSector && (
              <>
                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-cyan-400" /> Vai usar carro?</Label>
                  <Switch checked={formData.usarCarro} onCheckedChange={(v) => setFormData({ ...formData, usarCarro: v, carroId: v ? formData.carroId : "" })} />
                </div>
                {formData.usarCarro && (() => {
                  const dataObj = formData.data ? new Date(formData.data + "T12:00:00") : null;
                  const checkable = dataObj && formData.horaInicio && formData.horaFim;
                  const carrosComStatus = carros.map(c => {
                    if (!checkable) return { ...c, conflito: null as ReturnType<typeof findCarroConflito> };
                    const conflito = findCarroConflito(
                      c.id, dataObj!, formData.horaInicio, formData.horaFim,
                      compromissos.map(co => ({ id: co.id, carroId: co.carroId, data: co.data, horaInicio: co.horaInicio, horaFim: co.horaFim })),
                      editingId || undefined
                    );
                    return { ...c, conflito };
                  });
                  return (
                    <div className="space-y-1.5 animate-fade-in">
                      <Label className="text-xs">Qual carro?</Label>
                      {carros.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground">Nenhum carro cadastrado. Pede pra um admin adicionar em Perfil → Carros.</p>
                      ) : (
                        <Select value={formData.carroId} onValueChange={(v) => setFormData({ ...formData, carroId: v })}>
                          <SelectTrigger className="h-9 rounded-lg text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {carrosComStatus.map(c => (
                              <SelectItem key={c.id} value={c.id} disabled={!!c.conflito}>
                                {c.nome}{c.placa ? ` (${c.placa})` : ""}
                                {c.conflito && <span className="text-destructive text-[10px] ml-2">— ocupado {c.conflito.horaInicio}-{c.conflito.horaFim}</span>}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {!checkable && carros.length > 0 && (
                        <p className="text-[11px] text-muted-foreground">Preenche a data + horários pra ver quais estão livres.</p>
                      )}
                    </div>
                  );
                })()}
                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5 text-violet-400" /> Vai usar Data Show?</Label>
                  <Switch checked={formData.usarDataShow} onCheckedChange={(v) => setFormData({ ...formData, usarDataShow: v })} />
                </div>
              </>
            )}
            {/* Para quem (convidado Google Calendar) */}
            <div className="space-y-1.5">
              <Label className="text-xs">Para quem? (notificação no Google)</Label>
              <Select value={formData.paraNome || "ninguem"} onValueChange={async (v) => {
                if (v === "ninguem") {
                  setFormData({ ...formData, paraNome: "", paraEmail: "" });
                } else {
                  // Fetch google_email from DB
                  const u = users.find(u => u.full_name === v);
                  let gEmail = "";
                  if (u) {
                    const { data } = await supabase.from("medwork_users").select("google_email").eq("id", u.id).single();
                    gEmail = data?.google_email || u.email;
                  }
                  setFormData({ ...formData, paraNome: v, paraEmail: gEmail });
                }
              }}>
                <SelectTrigger className="h-9 rounded-lg text-xs"><SelectValue placeholder="Selecione a pessoa" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguem">Ninguém (só eu)</SelectItem>
                  {users.map(u => <SelectItem key={u.id} value={u.full_name}>{u.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Empresa / Localização / Observações / Responsável */}
            <div className="space-y-1.5">
              <Label className="text-xs">Empresa</Label>
              <Input value={formData.empresa} onChange={(e) => setFormData({ ...formData, empresa: e.target.value })} placeholder="Nome da empresa" className="h-9 rounded-lg text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Localização</Label>
              <Input
                value={formData.localizacao}
                onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                placeholder="Endereço ou URL do Maps"
                className="h-9 rounded-lg text-sm"
              />
              <p className="text-[10px] text-muted-foreground">Pode colar um endereço ou um link direto do Google Maps.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Responsável</Label>
              <Select
                value={formData.responsavel || "nenhum"}
                onValueChange={(v) => setFormData({ ...formData, responsavel: v === "nenhum" ? "" : v })}
              >
                <SelectTrigger className="h-9 rounded-lg text-xs"><SelectValue placeholder="Selecione o responsável" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Nenhum</SelectItem>
                  {users
                    .filter((u) => u.sectors?.some((s: any) => ["tecnico", "psicossocial", "saude"].includes(s)))
                    .map((u) => (
                      <SelectItem key={u.id} value={u.full_name}>{u.full_name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Observações</Label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Notas adicionais…"
                rows={2}
                className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2"
              />
            </div>

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

      {/* Day Events List (quando dia tem 2+ eventos) */}
      <Dialog open={!!dayEvents} onOpenChange={(open) => { if (!open) setDayEvents(null); }}>
        <DialogContent className="sm:max-w-sm">
          {dayEvents && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  {format(dayEvents.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">{dayEvents.events.length} compromissos neste dia</p>
              </DialogHeader>
              <div className="space-y-2 pt-2">
                {dayEvents.events
                  .sort((a, b) => (a.horaInicio || "").localeCompare(b.horaInicio || ""))
                  .map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => { setSelectedEvent(ev); setDayEvents(null); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/50 transition-all text-left"
                    >
                      <span className={cn("w-3 h-3 rounded-full flex-shrink-0", getTipoColor(ev.tipo))} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">{getTipoLabel(ev.tipo)}</span>
                          <span className="text-[11px] text-muted-foreground">{ev.horaInicio} - {ev.horaFim}</span>
                        </div>
                        {ev.empresa && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{ev.empresa}</p>}
                        <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <UserIcon className="w-2.5 h-2.5" />
                          {ev.criadoPor}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isLinkedSector && ev.usarCarro && <Car className="w-3.5 h-3.5 text-cyan-400" />}
                        {isLinkedSector && ev.usarDataShow && <Monitor className="w-3.5 h-3.5 text-violet-400" />}
                      </div>
                    </button>
                  ))}
              </div>
            </>
          )}
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

                {/* Carro and Data Show — Tecnico, Psicossocial, Saúde */}
                {isLinkedSector && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-cyan-400" /> Carro
                      </span>
                      {selectedEvent.usarCarro ? (
                        <span className="font-medium flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-cyan-400/10 text-cyan-400 text-xs">
                          <Car className="w-3.5 h-3.5" />
                          {selectedEvent.carroNome || (selectedEvent.tipoCarro === "mobi" ? "Mobi" : selectedEvent.tipoCarro === "alugado" ? "Alugado" : "—")}
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

                {/* Empresa / Responsável / Localização / Observações */}
                {selectedEvent.empresa && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">Empresa</span>
                    <span className="font-medium text-xs">{selectedEvent.empresa}</span>
                  </div>
                )}
                {selectedEvent.responsavel && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">Responsável</span>
                    <span className="font-medium text-xs">{selectedEvent.responsavel}</span>
                  </div>
                )}
                {selectedEvent.localizacao && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-muted-foreground text-xs">Localização</span>
                    <a
                      href={
                        selectedEvent.localizacao.startsWith("http")
                          ? selectedEvent.localizacao
                          : `https://www.google.com/maps/search/${encodeURIComponent(selectedEvent.localizacao)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary text-xs hover:underline max-w-[180px] truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      📍 {selectedEvent.localizacao.startsWith("http") ? "Abrir no Maps" : selectedEvent.localizacao}
                    </a>
                  </div>
                )}
                {selectedEvent.observacoes && (
                  <div>
                    <span className="text-muted-foreground text-xs block mb-1">Observações</span>
                    <p className="text-xs text-foreground bg-muted/50 rounded-lg p-2">{selectedEvent.observacoes}</p>
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

                {/* Google Calendar */}
                {googleConnected ? (
                  <Button
                    variant="outline"
                    className="w-full h-8 rounded-lg text-xs gap-1.5 border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10"
                    onClick={async () => {
                      const ev = selectedEvent;
                      const dateStr = format(ev.data, "yyyy-MM-dd");
                      try {
                        const googleEventId = await createGoogleEvent({
                          summary: `${getTipoLabel(ev.tipo)}${ev.instrutor ? ` - ${ev.instrutor}` : ""}`,
                          date: dateStr,
                          startTime: ev.horaInicio,
                          endTime: ev.horaFim,
                          description: `Criado por: ${ev.criadoPor}${ev.instrutor ? `\nInstrutor: ${ev.instrutor}` : ""}\nOrigem: Week MedWork`,
                        });
                        if (googleEventId) {
                          await supabase.from("medwork_compromissos").update({ google_event_id: googleEventId }).eq("id", ev.id);
                        }
                        alert("Agendado no Google Calendar!");
                      } catch (e: any) {
                        alert(e.message || "Erro ao agendar");
                      }
                    }}
                  >
                    <CalendarIcon className="w-3 h-3" /> Agendar no Google
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-8 rounded-lg text-xs gap-1.5 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                    onClick={() => {
                      const ev = selectedEvent;
                      const dateStr = format(ev.data, "yyyyMMdd");
                      const start = ev.horaInicio && ev.horaInicio !== "A confirmar" ? ev.horaInicio.replace(":", "") + "00" : "080000";
                      const end = ev.horaFim ? ev.horaFim.replace(":", "") + "00" : "120000";
                      const title = encodeURIComponent(`${getTipoLabel(ev.tipo)}${ev.instrutor ? ` - ${ev.instrutor}` : ""}`);
                      const details = encodeURIComponent(`Criado por: ${ev.criadoPor}${ev.instrutor ? `\nInstrutor: ${ev.instrutor}` : ""}\nOrigem: Week MedWork`);
                      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}T${start}/${dateStr}T${end}&details=${details}`;
                      window.open(url, "_blank");
                    }}
                  >
                    <CalendarIcon className="w-3 h-3" /> Adicionar manualmente
                  </Button>
                )}

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
