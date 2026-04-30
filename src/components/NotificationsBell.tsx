import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellOff, MessageCircle, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SECTORS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type NotifType = "urgent" | "responsible" | "transfer";

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  projectId: string;
  sector: string;
  read: boolean;
  createdAt: string;
}

const STORAGE_NOTIFS = "medwork_notifications";
const STORAGE_URGENT_DISMISSED = "medwork_urgent_dismissed";
const STORAGE_ENABLED = "medwork_notifs_enabled";

// Admin full_names that should receive notifications filtered to specific sectors
const ADMIN_SECTORS: Record<string, string[]> = {
  "Caio Vinicius": ["tecnico"],
  "Samuel Rodrigues": ["tecnico", "comercial"],
  "Arthur Fogolin": ["financeiro"],
};

export const NotificationsBell = ({ collapsed }: { collapsed?: boolean }) => {
  const { user } = useAuth();
  const { projects } = useProjects();
  const navigate = useNavigate();

  const [notifs, setNotifs] = useState<Notif[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_NOTIFS) || "[]"); } catch { return []; }
  });
  const [urgentDismissed, setUrgentDismissed] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_URGENT_DISMISSED) || "[]"); } catch { return []; }
  });
  const [enabled, setEnabled] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_ENABLED) !== "false";
  });

  // Derive new notifications from transferred projects in the user's sectors.
  useEffect(() => {
    if (!user || !enabled) return;

    let userSectors: string[];
    if (user.is_admin && ADMIN_SECTORS[user.full_name]) {
      userSectors = ADMIN_SECTORS[user.full_name];
    } else {
      userSectors = (user.sectors as string[]) || [];
    }

    const transferred = projects.filter(
      (p: any) => p.transferred && userSectors.includes(p.sector) && p.status !== "archived",
    );
    const existingProjectIds = new Set(notifs.map((n) => n.projectId));

    const newOnes: Notif[] = [];
    for (const p of transferred) {
      if (existingProjectIds.has(p.id)) continue;
      const isResponsible = (p.responsible_ids || []).includes(user.id);
      const due = p.due_date ? new Date(p.due_date + "T12:00:00") : null;
      const days = due ? Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 999;
      const urgent = days <= 3;
      const fromSector = (p as any).from_sector || "outro setor";
      const sectorLabel = SECTORS.find((s) => s.id === p.sector)?.label || p.sector;

      let type: NotifType = "transfer";
      let title = "Projeto transferido";
      let message = `${fromSector} enviou "${p.project_name}" para ${sectorLabel}`;

      if (urgent && isResponsible) {
        type = "urgent";
        title = "URGENTE - Demanda para você!";
        message = `${fromSector} enviou "${p.project_name}" com prazo de ${days <= 0 ? "HOJE" : `${days} dia(s)`}. Você é responsável!`;
      } else if (isResponsible) {
        type = "responsible";
        title = "Demanda atribuída a você";
        message = `${fromSector} enviou "${p.project_name}" e você foi designado como responsável`;
      } else if (urgent) {
        type = "urgent";
        title = "Demanda urgente!";
        message = `${fromSector} enviou "${p.project_name}" com prazo de ${days <= 0 ? "HOJE" : `${days} dia(s)`}`;
      }

      newOnes.push({
        id: `notif-${p.id}`,
        type, title, message,
        projectId: p.id,
        sector: p.sector,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    if (newOnes.length > 0) {
      setNotifs((prev) => {
        const merged = [...newOnes, ...prev];
        localStorage.setItem(STORAGE_NOTIFS, JSON.stringify(merged));
        return merged;
      });
    }
  }, [projects.length, user?.id, enabled]);

  const unreadCount = enabled ? notifs.filter((n) => !n.read).length : 0;

  // Update PWA badge count
  useEffect(() => {
    if ("setAppBadge" in navigator) {
      if (unreadCount > 0) (navigator as any).setAppBadge(unreadCount);
      else (navigator as any).clearAppBadge?.();
    }
  }, [unreadCount]);

  const urgentToasts = useMemo(
    () => enabled
      ? notifs.filter((n) => (n.type === "urgent" || n.type === "responsible") && !n.read && !urgentDismissed.includes(n.id))
      : [],
    [notifs, urgentDismissed, enabled],
  );

  const markRead = (id: string) => {
    setNotifs((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem(STORAGE_NOTIFS, JSON.stringify(next));
      return next;
    });
  };

  const markAllRead = () => {
    setNotifs((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem(STORAGE_NOTIFS, JSON.stringify(next));
      return next;
    });
  };

  const dismissToast = (id: string) => {
    setUrgentDismissed((prev) => {
      const next = [...prev, id];
      localStorage.setItem(STORAGE_URGENT_DISMISSED, JSON.stringify(next));
      return next;
    });
  };

  const forwardViaWhatsApp = (n: Notif) => {
    const raw = prompt("Número do WhatsApp (com DDD, ex: 63999999999):");
    if (!raw) return;
    const digits = raw.replace(/\D/g, "");
    const phone = digits.length <= 11 ? `55${digits}` : digits;
    const sectorLabel = SECTORS.find((s) => s.id === n.sector)?.label || n.sector;
    const msg = encodeURIComponent(
      `Olá! Você recebeu uma demanda no sistema Week MedWork.\n\n📋 *${n.title}*\n${n.message}\n\n🔗 Setor: ${sectorLabel}\n\nAcesse: https://week.medworkto.com`,
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const toggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem(STORAGE_ENABLED, String(next));
  };

  const goToProject = (n: Notif) => {
    markRead(n.id);
    navigate(`/projeto/${n.projectId}`);
  };

  const typeColors: Record<NotifType, string> = {
    urgent: "border-l-destructive bg-destructive/5",
    responsible: "border-l-amber-500 bg-amber-500/5",
    transfer: "border-l-primary bg-primary/5",
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "relative flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] transition-all text-foreground hover:bg-muted w-full",
              collapsed && "justify-center px-2",
            )}
            title={enabled ? "Notificações" : "Notificações OFF"}
          >
            {enabled ? (
              <Bell className="w-[18px] h-[18px] flex-shrink-0 stroke-[1.5] text-primary" />
            ) : (
              <BellOff className="w-[18px] h-[18px] flex-shrink-0 stroke-[1.5] text-muted-foreground" />
            )}
            {!collapsed && <span>Notificações</span>}
            {unreadCount > 0 && (
              <span className={cn(
                "absolute min-w-[18px] h-[18px] rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center px-1",
                collapsed ? "top-0 right-0" : "right-2 top-1/2 -translate-y-1/2",
              )}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" side="right" className="w-80 p-0">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Notificações</span>
            <div className="flex items-center gap-1">
              <Button
                size="sm" variant="ghost" onClick={toggleEnabled}
                className="h-7 text-[11px] gap-1"
                title={enabled ? "Desativar notificações" : "Ativar notificações"}
              >
                {enabled ? <><Bell className="w-3 h-3" /> ON</> : <><BellOff className="w-3 h-3" /> OFF</>}
              </Button>
              {unreadCount > 0 && (
                <Button size="sm" variant="ghost" onClick={markAllRead} className="h-7 text-[11px] gap-1">
                  <Check className="w-3 h-3" /> Marcar todas
                </Button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                Nenhuma notificação.
              </div>
            ) : (
              notifs.slice(0, 40).map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "px-3 py-2.5 border-l-2 border-b border-border/50 cursor-pointer hover:bg-muted/30 transition-colors",
                    typeColors[n.type],
                    n.read && "opacity-60",
                  )}
                  onClick={() => goToProject(n)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />}
                        <span className="text-[12px] font-semibold text-foreground">{n.title}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-3">{n.message}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); forwardViaWhatsApp(n); }}
                      className="flex-shrink-0 p-1 rounded hover:bg-green-500/10 text-green-600"
                      title="Encaminhar via WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Urgent toasts stack (bottom-right) */}
      {urgentToasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-xs">
          {urgentToasts.slice(0, 3).map((n) => (
            <div
              key={n.id}
              className={cn(
                "bg-card border-l-4 shadow-lg rounded-lg px-3 py-2.5 animate-fade-in",
                n.type === "urgent" ? "border-l-destructive" : "border-l-amber-500",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => { markRead(n.id); navigate(`/projeto/${n.projectId}`); }}
                >
                  <span className="text-[12px] font-bold text-foreground">{n.title}</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{n.message}</p>
                </div>
                <button
                  onClick={() => dismissToast(n.id)}
                  className="flex-shrink-0 p-0.5 rounded hover:bg-muted text-muted-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
