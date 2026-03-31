import { useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Project, User } from "@/lib/mock-data";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface KanbanCardProps {
  project: Project;
  users: User[];
  index: number;
  locked?: boolean;
  onCardClick?: (project: Project) => void;
  renderExtra?: () => React.ReactNode;
}

export const KanbanCard = ({ project, users, index, locked, onCardClick, renderExtra }: KanbanCardProps) => {
  const navigate = useNavigate();
  const responsibles = users.filter((u) => project.responsible_ids.includes(u.id));
  const isOverdue = new Date(project.due_date) < new Date() && project.status !== "done";

  const touchRef = useRef<{ startX: number; startY: number; el: HTMLElement | null; clone: HTMLElement | null; dragging: boolean }>({
    startX: 0, startY: 0, el: null, clone: null, dragging: false,
  });

  const scrollIntervalRef = useRef<number | null>(null);

  const startAutoScroll = () => {
    const handler = (e: DragEvent) => {
      const threshold = 80;
      const speed = 15;
      const y = e.clientY;
      const h = window.innerHeight;
      if (y < threshold) {
        window.scrollBy(0, -speed);
      } else if (y > h - threshold) {
        window.scrollBy(0, speed);
      }
    };
    document.addEventListener("dragover", handler);
    return handler;
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("projectId", project.id);
    e.currentTarget.classList.add("opacity-40");
    const handler = startAutoScroll();
    (e.currentTarget as any)._autoScrollHandler = handler;
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("opacity-40");
    const handler = (e.currentTarget as any)._autoScrollHandler;
    if (handler) {
      document.removeEventListener("dragover", handler);
      delete (e.currentTarget as any)._autoScrollHandler;
    }
  };

  const handleClick = () => {
    if (locked) return;
    if (touchRef.current.dragging) return;
    if (onCardClick) { onCardClick(project); }
    else { navigate(`/projeto/${project.id}`); }
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (locked) return;
    const touch = e.touches[0];
    const el = e.currentTarget as HTMLElement;
    touchRef.current = { startX: touch.clientX, startY: touch.clientY, el, clone: null, dragging: false };
  }, [locked]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (locked) return;
    const touch = e.touches[0];
    const ref = touchRef.current;
    const dx = Math.abs(touch.clientX - ref.startX);
    if (!ref.dragging && dx > 10) {
      ref.dragging = true;
      if (ref.el) {
        const clone = ref.el.cloneNode(true) as HTMLElement;
        clone.style.position = "fixed";
        clone.style.zIndex = "9999";
        clone.style.width = `${ref.el.offsetWidth}px`;
        clone.style.pointerEvents = "none";
        clone.style.opacity = "0.9";
        clone.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";
        document.body.appendChild(clone);
        ref.clone = clone;
        ref.el.style.opacity = "0.3";
      }
    }
    if (ref.dragging && ref.clone) {
      e.preventDefault();
      ref.clone.style.left = `${touch.clientX - ref.clone.offsetWidth / 2}px`;
      ref.clone.style.top = `${touch.clientY - 20}px`;
    }
  }, [locked]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const ref = touchRef.current;
    if (ref.clone) { ref.clone.remove(); ref.clone = null; }
    if (ref.el) { ref.el.style.opacity = "1"; }
    if (ref.dragging) {
      const touch = e.changedTouches[0];
      const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
      const column = elements.find(el => el.hasAttribute("data-kanban-column"));
      if (column) {
        const status = column.getAttribute("data-kanban-status");
        if (status) {
          column.dispatchEvent(new CustomEvent("kanban-touch-drop", { detail: { projectId: project.id, status }, bubbles: true }));
        }
      }
      setTimeout(() => { ref.dragging = false; }, 100);
    }
  }, [project.id]);

  const truncatedDesc = project.description
    ? project.description.length > 100 ? project.description.slice(0, 100) + "…" : project.description
    : undefined;

  return (
    <div
      draggable={!locked}
      onDragStart={locked ? undefined : handleDragStart}
      onDragEnd={locked ? undefined : handleDragEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      className={`bg-card rounded-[12px] p-[12px] shadow-card hover:shadow-elevated hover:-translate-y-[3px] transition-all duration-300 border border-border animate-fade-in group min-h-[90px] gradient-hover neon-hover ${locked ? "cursor-default" : "cursor-grab active:cursor-grabbing"} touch-manipulation`}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <h4 className="font-medium text-foreground text-[13px] mb-1 group-hover:text-primary transition-colors line-clamp-2">{project.project_name}</h4>
      {truncatedDesc && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{truncatedDesc}</p>
      )}
      <div className="flex items-center justify-between mt-auto">
        <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
          <Calendar className="w-3.5 h-3.5 stroke-[1.5]" />
          <span>{format(new Date(project.due_date), "dd MMM", { locale: ptBR })}</span>
        </div>
        <div className="flex -space-x-1.5">
          {responsibles.slice(0, 3).map((u) => (
            <div
              key={u.id}
              className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-medium text-primary-foreground border-2 border-card"
              title={u.full_name}
            >
              {u.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
          ))}
        </div>
      </div>
      {renderExtra && renderExtra()}
    </div>
  );
};
