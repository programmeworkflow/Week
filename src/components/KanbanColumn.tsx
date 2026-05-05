import { useEffect, useRef, useState, useCallback } from "react";
import { Project, User } from "@/lib/mock-data";
import { KanbanCard } from "./KanbanCard";
import { cn } from "@/lib/utils";
import { Pencil, Check, X } from "lucide-react";

interface KanbanColumnProps {
  title: string;
  status: Project["status"];
  projects: Project[];
  users: User[];
  onDrop: (projectId: string, status: Project["status"]) => void;
  count: number;
  locked?: boolean;
  onCardClick?: (project: Project) => void;
  renderCardExtra?: (project: Project) => React.ReactNode;
  /** Optional: when provided, the column title becomes inline-editable.
   *  Returns the number of projects whose status_tecnico got renamed in cascade. */
  onTitleSave?: (newTitle: string) => Promise<{ updatedProjects: number }>;
}

export type { KanbanColumnProps };

const statusDotColors: Record<Project["status"], string> = {
  not_authenticated: "bg-[hsl(var(--status-critico-text))]",
  not_started: "bg-[hsl(var(--status-nao-iniciado-text))]",
  pending: "bg-[hsl(var(--status-andamento-text))]",
  doc_pending: "bg-[hsl(var(--status-pendente-text))]",
  review: "bg-[hsl(var(--status-revisao-text))]",
  done: "bg-[hsl(var(--status-concluido-text))]",
};

const statusBadgeColors: Record<Project["status"], string> = {
  not_authenticated: "status-critico",
  not_started: "status-nao-iniciado",
  pending: "status-andamento",
  doc_pending: "status-pendente",
  review: "status-revisao",
  done: "status-concluido",
};

export const KanbanColumn = ({ title, status, projects, users, onDrop, count, locked, onCardClick, renderCardExtra, onTitleSave }: KanbanColumnProps) => {
  const colRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [saving, setSaving] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);
  const [tecnicoCount, setTecnicoCount] = useState<number>(count);

  // Mantém draft em sync se o título externo mudar
  useEffect(() => { if (!editing) setDraft(title); }, [title, editing]);
  useEffect(() => { setTecnicoCount(count); }, [count]);

  useEffect(() => {
    if (editing) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [editing]);

  const cancelEdit = useCallback(() => {
    setDraft(title);
    setEditing(false);
  }, [title]);

  const saveEdit = useCallback(async () => {
    if (!onTitleSave) return;
    const trimmed = draft.trim();
    if (!trimmed || trimmed === title) { cancelEdit(); return; }
    setSaving(true);
    try {
      await onTitleSave(trimmed);
      setEditing(false);
      setSavedPulse(true);
      setTimeout(() => setSavedPulse(false), 1200);
    } finally {
      setSaving(false);
    }
  }, [draft, title, onTitleSave, cancelEdit]);

  useEffect(() => {
    const el = colRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.projectId && detail?.status) {
        onDrop(detail.projectId, detail.status as Project["status"]);
      }
    };
    el.addEventListener("kanban-touch-drop", handler);
    return () => el.removeEventListener("kanban-touch-drop", handler);
  }, [onDrop]);

  const handleDragOver = (e: React.DragEvent) => {
    if (locked) return;
    e.preventDefault();
    e.currentTarget.classList.add("ring-1", "ring-primary/20");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (locked) return;
    e.currentTarget.classList.remove("ring-1", "ring-primary/20");
  };

  const handleDrop = (e: React.DragEvent) => {
    if (locked) return;
    e.preventDefault();
    e.currentTarget.classList.remove("ring-1", "ring-primary/20");
    const projectId = e.dataTransfer.getData("projectId");
    if (projectId) onDrop(projectId, status);
  };

  return (
    <div
      ref={colRef}
      data-kanban-column="true"
      data-kanban-status={status}
      className="flex-1 min-w-[240px] md:min-w-[280px] max-w-[340px] rounded-[12px] bg-muted/40 p-4 transition-all duration-300 neon-column"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-2 mb-4 group/header">
        <div className={cn(
          "w-2 h-2 rounded-full transition-all",
          statusDotColors[status],
          savedPulse && "ring-2 ring-primary/70 scale-125"
        )} />

        {!editing && (
          <>
            <h3 className={cn(
              "font-medium text-foreground text-[13px] flex items-center gap-1.5",
              savedPulse && "text-primary transition-colors"
            )}>
              {title}
              {onTitleSave && !locked && (
                <button
                  onClick={() => setEditing(true)}
                  className="opacity-0 group-hover/header:opacity-100 transition-opacity p-0.5 rounded hover:bg-primary/15 text-muted-foreground hover:text-primary"
                  title="Renomear coluna"
                  aria-label="Renomear coluna"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </h3>
            <span className={cn("ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full", statusBadgeColors[status])}>
              {count}
            </span>
          </>
        )}

        {editing && (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); saveEdit(); }
                if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
              }}
              maxLength={40}
              disabled={saving}
              className="flex-1 min-w-0 text-[13px] font-medium bg-background border border-primary/40 rounded px-1.5 py-0.5 text-foreground outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.18)] transition-shadow disabled:opacity-50"
            />
            <button
              onClick={saveEdit}
              disabled={saving || !draft.trim()}
              className="p-1 rounded bg-primary/15 hover:bg-primary/25 text-primary disabled:opacity-50 transition-colors"
              title="Salvar (Enter)"
              aria-label="Salvar"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={cancelEdit}
              disabled={saving}
              className="p-1 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors"
              title="Cancelar (Esc)"
              aria-label="Cancelar"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      {editing && tecnicoCount > 0 && (
        <p className="-mt-2 mb-3 text-[10px] text-muted-foreground italic font-mono tracking-wide">
          → {tecnicoCount} {tecnicoCount === 1 ? "projeto será atualizado" : "projetos serão atualizados"}
        </p>
      )}
      <div className="space-y-3">
        {projects.map((project, i) => (
          <KanbanCard key={project.id} project={project} users={users} index={i} locked={locked} onCardClick={onCardClick} renderExtra={renderCardExtra ? () => renderCardExtra(project) : undefined} />
        ))}
      </div>
    </div>
  );
};
