import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, User, LogOut, List, ChevronDown, ChevronRight, Stethoscope, Briefcase, Heart, DollarSign, Crown, Lock, PanelLeftClose, PanelLeft, Menu, Calendar, Sun, Moon, Archive, Brain, Trophy, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTORS, Sector } from "@/lib/mock-data";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NotificationsBell } from "./NotificationsBell";

const sectorIcons: Record<Sector, React.ElementType> = {
  tecnico: Stethoscope,
  esocial: FileCheck,
  comercial: Briefcase,
  saude: Heart,
  financeiro: DollarSign,
  psicossocial: Brain,
  diretoria: Crown,
};

const sectorNeonStyles: Record<Sector, { active: string; hover: string; border: string; text: string }> = {
  tecnico: {
    active: "dark:shadow-[0_0_12px_rgba(34,211,238,0.4)] bg-cyan-400/10",
    hover: "dark:hover:shadow-[0_0_10px_rgba(34,211,238,0.25)] hover:bg-cyan-400/10 dark:hover:bg-cyan-400/5",
    border: "border-l-cyan-600 dark:border-l-cyan-400",
    text: "text-cyan-950 dark:text-cyan-400",
  },
  esocial: {
    active: "dark:shadow-[0_0_12px_rgba(59,130,246,0.4)] bg-blue-400/10",
    hover: "dark:hover:shadow-[0_0_10px_rgba(59,130,246,0.25)] hover:bg-blue-400/10 dark:hover:bg-blue-400/5",
    border: "border-l-blue-700 dark:border-l-blue-400",
    text: "text-blue-950 dark:text-blue-400",
  },
  comercial: {
    active: "dark:shadow-[0_0_12px_rgba(251,191,36,0.4)] bg-amber-400/10",
    hover: "dark:hover:shadow-[0_0_10px_rgba(251,191,36,0.25)] hover:bg-amber-400/10 dark:hover:bg-amber-400/5",
    border: "border-l-amber-700 dark:border-l-amber-400",
    text: "text-amber-950 dark:text-amber-400",
  },
  saude: {
    active: "dark:shadow-[0_0_12px_rgba(244,114,182,0.4)] bg-pink-400/10",
    hover: "dark:hover:shadow-[0_0_10px_rgba(244,114,182,0.25)] hover:bg-pink-400/10 dark:hover:bg-pink-400/5",
    border: "border-l-pink-700 dark:border-l-pink-400",
    text: "text-pink-950 dark:text-pink-400",
  },
  financeiro: {
    active: "dark:shadow-[0_0_12px_rgba(52,211,153,0.4)] bg-emerald-400/10",
    hover: "dark:hover:shadow-[0_0_10px_rgba(52,211,153,0.25)] hover:bg-emerald-400/10 dark:hover:bg-emerald-400/5",
    border: "border-l-emerald-700 dark:border-l-emerald-400",
    text: "text-emerald-950 dark:text-emerald-400",
  },
  psicossocial: {
    active: "dark:shadow-[0_0_12px_rgba(168,85,247,0.4)] bg-purple-400/10",
    hover: "dark:hover:shadow-[0_0_10px_rgba(168,85,247,0.25)] hover:bg-purple-400/10 dark:hover:bg-purple-400/5",
    border: "border-l-purple-700 dark:border-l-purple-400",
    text: "text-purple-950 dark:text-purple-400",
  },
  diretoria: {
    active: "dark:shadow-[0_0_12px_rgba(167,139,250,0.4)] bg-violet-400/10",
    hover: "dark:hover:shadow-[0_0_10px_rgba(167,139,250,0.25)] hover:bg-violet-400/10 dark:hover:bg-violet-400/5",
    border: "border-l-violet-700 dark:border-l-violet-400",
    text: "text-violet-950 dark:text-violet-400",
  },
};

const STORAGE_KEY = "medwork-sidebar-collapsed";
const THEME_KEY = "medwork-theme";

export const AppSidebar = () => {
  const { user, logout, canAccessSector } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedSectors, setExpandedSectors] = useState<Sector[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "true"; } catch { return false; }
  });
  const [darkMode, setDarkMode] = useState(() => {
    try { const saved = localStorage.getItem(THEME_KEY); return saved ? saved === "dark" : true; } catch { return true; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    try { localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light"); } catch {}
  }, [darkMode]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(collapsed)); } catch {}
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    return () => { document.body.classList.remove("sidebar-collapsed"); };
  }, [collapsed]);

  const toggleSector = (sector: Sector) => {
    setExpandedSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    );
  };

  const topLinks = [
    { to: "/profile", label: "Perfil", icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2.5 rounded-[12px] bg-card border border-border shadow-card text-foreground"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-foreground/10 backdrop-blur-sm transition-all" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        "h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0 z-50 transition-all duration-200",
        collapsed ? "w-16" : "w-60",
        "max-md:w-60",
        mobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"
      )}>
        {/* Logo */}
        <div className={cn("px-4 py-4 flex items-center border-b border-border", collapsed ? "flex-col gap-2 px-2" : "justify-between")}>
          <Link to="/dashboard/projects" className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
            <div className={cn("rounded-[10px] overflow-hidden", collapsed ? "w-9 h-9" : "w-12 h-12")}>
              <img src="/week-icon-512.png" alt="Week" className="w-full h-full object-contain" />
            </div>
            {!collapsed && (
              <div>
                <span className="font-semibold text-foreground text-[13px]">Week MedWork</span>
                <span className="block text-[10px] text-muted-foreground leading-none">Medicina e Segurança</span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(prev => !prev)}
            className="p-1.5 rounded-lg hover:bg-muted transition-all duration-200 text-muted-foreground hover:text-foreground"
          >
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Top nav */}
        <nav className="px-3 pt-3 space-y-1">
          {topLinks.map(({ to, label, icon: Icon }) => (
            <Tooltip key={to}>
              <TooltipTrigger asChild>
                <Link
                  to={to}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] transition-all duration-300",
                    isActive(to)
                      ? "font-medium text-primary dark:shadow-[0_0_12px_rgba(34,197,94,0.4)] bg-primary/10"
                      : "text-foreground hover:text-foreground dark:text-primary/70 dark:opacity-80 dark:hover:opacity-100 dark:hover:shadow-[0_0_10px_rgba(34,197,94,0.25)] hover:bg-muted dark:hover:bg-primary/5",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <Icon className="w-[18px] h-[18px] flex-shrink-0 stroke-[1.5] text-primary" />
                  {!collapsed && <span>{label}</span>}
                </Link>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right"><p className="text-xs">{label}</p></TooltipContent>}
            </Tooltip>
          ))}
          <NotificationsBell collapsed={collapsed} />
        </nav>

        {/* Divider */}
        <div className={cn("px-4 py-3", collapsed && "px-2")}>
          <div className="h-px bg-border" />
          {!collapsed && (
            <span className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-3 mb-1 px-1">Setores</span>
          )}
        </div>

        {/* Sectors */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
          {SECTORS.map(({ id, label }) => {
            const Icon = sectorIcons[id];
            const isExpanded = expandedSectors.includes(id);
            const sectorDashPath = `/dashboard/projects/${id}`;
            const sectorListPath = `/projetos/${id}`;
            const isSectorActive = location.pathname.includes(id);
            const hasAccess = canAccessSector(id);
            const neon = sectorNeonStyles[id];

            return (
              <div key={id}>
                {hasAccess ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          if (collapsed) {
                            navigate(id === "esocial" ? "/esocial/procuracao" : sectorDashPath);
                          } else {
                            toggleSector(id);
                          }
                        }}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] transition-all duration-300 w-full text-left",
                          isSectorActive
                            ? `font-medium ${neon.active} ${neon.text}`
                            : `${neon.hover} ${neon.text} opacity-70 hover:opacity-100`,
                          collapsed && "justify-center px-2"
                        )}
                      >
                        <Icon className={cn("w-[18px] h-[18px] flex-shrink-0 stroke-[1.5]", neon.text)} />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{label}</span>
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                          </>
                        )}
                      </button>
                    </TooltipTrigger>
                    {collapsed && <TooltipContent side="right"><p className="text-xs">{label}</p></TooltipContent>}
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] text-muted-foreground/40 cursor-not-allowed w-full",
                        collapsed && "justify-center px-2"
                      )}>
                        <Icon className="w-[18px] h-[18px] flex-shrink-0 stroke-[1.5]" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{label}</span>
                            <Lock className="w-3 h-3" />
                          </>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right"><p className="text-xs">Sem acesso</p></TooltipContent>
                  </Tooltip>
                )}

                {isExpanded && hasAccess && !collapsed && (
                  <div className={cn("ml-5 mt-0.5 space-y-0.5 border-l-2 pl-3 animate-fade-in", neon.border)}>
                    {id === "esocial" ? (
                      <>
                      <Link
                        to="/esocial/procuracao"
                        className={cn(
                          "flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-xs transition-all duration-300",
                          isActive("/esocial/procuracao")
                            ? `font-medium ${neon.active} ${neon.text}`
                            : `text-muted-foreground ${neon.hover} hover:text-foreground`
                        )}
                      >
                        <FileCheck className="w-3.5 h-3.5 stroke-[1.5]" />
                        Procuração
                      </Link>
                      <Link
                        to="/esocial/s2220"
                        className={cn(
                          "flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-xs transition-all duration-300",
                          isActive("/esocial/s2220")
                            ? `font-medium ${neon.active} ${neon.text}`
                            : `text-muted-foreground ${neon.hover} hover:text-foreground`
                        )}
                      >
                        <List className="w-3.5 h-3.5 stroke-[1.5]" />
                        S-2220
                      </Link>
                      </>
                    ) : (
                    <>
                    <Link
                      to={sectorDashPath}
                      className={cn(
                        "flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-xs transition-all duration-300",
                        isActive(sectorDashPath)
                          ? `font-medium ${neon.active} ${neon.text}`
                          : `text-muted-foreground ${neon.hover} hover:text-foreground`
                      )}
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 stroke-[1.5]" />
                      Quadro
                    </Link>
                    <Link
                      to={sectorListPath}
                      className={cn(
                        "flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-xs transition-all duration-300",
                        isActive(sectorListPath)
                          ? `font-medium ${neon.active} ${neon.text}`
                          : `text-muted-foreground ${neon.hover} hover:text-foreground`
                      )}
                    >
                      <List className="w-3.5 h-3.5 stroke-[1.5]" />
                      {id === "comercial" ? "Treinamentos" : id === "financeiro" ? "Arquivadas" : "Projetos"}
                    </Link>
                    {(id === "tecnico" || id === "psicossocial" || id === "saude") && (
                      <>
                        <Link
                          to={`/calendario/${id}`}
                          className={cn(
                            "flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-xs transition-all duration-300",
                            isActive(`/calendario/${id}`)
                              ? `font-medium ${neon.active} ${neon.text}`
                              : `text-muted-foreground ${neon.hover} hover:text-foreground`
                          )}
                        >
                          <Calendar className="w-3.5 h-3.5 stroke-[1.5]" />
                          Calendário
                        </Link>
                        <Link
                          to={`/arquivados/${id}`}
                          className={cn(
                            "flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-xs transition-all duration-300",
                            isActive(`/arquivados/${id}`)
                              ? `font-medium ${neon.active} ${neon.text}`
                              : `text-muted-foreground ${neon.hover} hover:text-foreground`
                          )}
                        >
                          <Archive className="w-3.5 h-3.5 stroke-[1.5]" />
                          Arquivados
                        </Link>
                      </>
                    )}
                    </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-border space-y-2">
          {/* Premiação button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/premiacao"
                className={cn(
                  "flex items-center gap-2.5 text-[13px] w-full px-3 py-2 rounded-[10px] transition-all duration-300",
                  location.pathname === "/premiacao"
                    ? "bg-yellow-400/10 text-yellow-950 dark:text-yellow-400 dark:shadow-[0_0_12px_rgba(250,204,21,0.3)]"
                    : "text-yellow-950 dark:text-yellow-400/70 hover:bg-yellow-400/10 dark:hover:shadow-[0_0_10px_rgba(250,204,21,0.25)] dark:hover:bg-yellow-400/5",
                  collapsed && "justify-center px-2"
                )}
              >
                <Trophy className="w-[18px] h-[18px] flex-shrink-0 stroke-[1.5] text-yellow-950 dark:text-yellow-400" />
                {!collapsed && <span>Premiação</span>}
              </Link>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right"><p className="text-xs">Premiação</p></TooltipContent>}
          </Tooltip>

          {/* Theme toggle - acima da foto do usuário */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setDarkMode(prev => !prev)}
                className={cn(
                  "flex items-center gap-2.5 text-[13px] w-full px-3 py-2 rounded-[10px] transition-all duration-300",
                  "bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 text-muted-foreground hover:text-foreground neon-hover btn-3d",
                  collapsed && "justify-center px-2"
                )}
              >
                <div className="relative w-[18px] h-[18px] flex-shrink-0">
                  <Sun className={cn("w-[18px] h-[18px] stroke-[1.5] absolute inset-0 transition-all duration-300", darkMode ? "opacity-100 rotate-0" : "opacity-0 -rotate-90")} />
                  <Moon className={cn("w-[18px] h-[18px] stroke-[1.5] absolute inset-0 transition-all duration-300", darkMode ? "opacity-0 rotate-90" : "opacity-100 rotate-0")} />
                </div>
                {!collapsed && <span>{darkMode ? "Modo Claro" : "Modo Escuro"}</span>}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right"><p className="text-xs">{darkMode ? "Modo Claro" : "Modo Escuro"}</p></TooltipContent>}
          </Tooltip>

          <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[11px] font-medium text-primary-foreground flex-shrink-0">
              {user?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-foreground truncate">{user?.full_name}</div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {user?.is_admin ? "Admin" : user?.sectors.map(s => SECTORS.find(sec => sec.id === s)?.label).filter(Boolean).join(", ")}
                </div>
              </div>
            )}
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={logout}
                className={cn(
                  "flex items-center gap-2 text-[13px] text-muted-foreground hover:text-destructive transition-all duration-200 w-full px-3 py-1.5 rounded-[8px] hover:bg-muted",
                  collapsed && "justify-center px-2"
                )}
              >
                <LogOut className="w-4 h-4 flex-shrink-0 stroke-[1.5]" />
                {!collapsed && "Sair"}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right"><p className="text-xs">Sair</p></TooltipContent>}
          </Tooltip>
        </div>
      </aside>
    </>
  );
};
