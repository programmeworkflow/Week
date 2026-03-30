import { useEffect, useRef } from "react";
import { Project, User } from "@/lib/mock-data";
import { KanbanCard } from "./KanbanCard";
import { cn } from "@/lib/utils";

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

export const KanbanColumn = ({ title, status, projects, users, onDrop, count, locked, onCardClick, renderCardExtra }: KanbanColumnProps) => {
  const colRef = useRef<HTMLDivElement>(null);

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
      <div className="flex items-center gap-2 mb-4">
        <div className={cn("w-2 h-2 rounded-full", statusDotColors[status])} />
        <h3 className="font-medium text-foreground text-[13px]">{title}</h3>
        <span className={cn("ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full", statusBadgeColors[status])}>
          {count}
        </span>
      </div>
      <div className="space-y-3">
        {projects.map((project, i) => (
          <KanbanCard key={project.id} project={project} users={users} index={i} locked={locked} onCardClick={onCardClick} renderExtra={renderCardExtra ? () => renderCardExtra(project) : undefined} />
        ))}
      </div>
    </div>
  );
};
