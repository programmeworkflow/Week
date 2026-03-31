import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Trophy, Medal, Crown, Flame, Star, TrendingUp, Zap, Award, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiacaoEntry {
  id: string;
  user_name: string;
  user_id: string;
  project_name: string;
  sector: string;
  points: number;
  completed_at: string;
}

interface UserStats {
  name: string;
  id: string;
  totalPoints: number;
  totalProjects: number;
  streak: number;
  sectors: Record<string, number>;
}

const rankColors = [
  "from-yellow-400 to-amber-500", // 1st
  "from-gray-300 to-gray-400",    // 2nd
  "from-orange-400 to-orange-600", // 3rd
];

const rankIcons = [Crown, Medal, Award];

const getLevelInfo = (points: number) => {
  if (points >= 4500) return { name: "MEDWORKINO OFICIAL", icon: Crown, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30" };
  if (points >= 2500) return { name: "Destaque MedWork", icon: Flame, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30" };
  if (points >= 1500) return { name: "Especialista", icon: Zap, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/30" };
  if (points >= 750) return { name: "Profissional", icon: Star, color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/30" };
  if (points >= 100) return { name: "Iniciante", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30" };
  return { name: "Novato", icon: Target, color: "text-muted-foreground", bg: "bg-muted", border: "border-border" };
};

const Premiacao = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<PremiacaoEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("medwork_premiacao").select("*").order("completed_at", { ascending: false });
      if (data) setEntries(data);
      setLoading(false);
    };
    load();
  }, []);

  if (!user) return <Navigate to="/" replace />;

  // Aggregate stats per user
  const userStatsMap: Record<string, UserStats> = {};
  entries.forEach((e) => {
    if (!userStatsMap[e.user_id]) {
      userStatsMap[e.user_id] = { name: e.user_name, id: e.user_id, totalPoints: 0, totalProjects: 0, streak: 0, sectors: {} };
    }
    const s = userStatsMap[e.user_id];
    s.totalPoints += e.points;
    s.totalProjects += 1;
    s.sectors[e.sector] = (s.sectors[e.sector] || 0) + 1;
  });

  // Calculate streaks (consecutive days with completions)
  Object.values(userStatsMap).forEach((s) => {
    const userEntries = entries.filter((e) => e.user_id === s.id).map((e) => e.completed_at.split("T")[0]);
    const uniqueDays = [...new Set(userEntries)].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    for (let i = 0; i < uniqueDays.length; i++) {
      const expected = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
      if (uniqueDays[i] === expected || (i === 0 && uniqueDays[0] === today)) {
        streak++;
      } else break;
    }
    s.streak = streak;
  });

  const ranking = Object.values(userStatsMap).sort((a, b) => b.totalPoints - a.totalPoints);
  const recentEntries = entries.slice(0, 15);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-60 sidebar-collapsed:ml-16 max-md:ml-0 transition-all duration-200">
        <div className="p-6 max-md:p-4 max-md:pt-16">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground neon-text flex items-center gap-3">
              <Trophy className="w-7 h-7 text-yellow-400" />
              Premiação
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Ranking de desempenho da equipe MedWork</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : ranking.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center neon-card">
              <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum projeto finalizado ainda</h3>
              <p className="text-sm text-muted-foreground">Quando projetos forem movidos para "Finalizada", os pontos aparecerão aqui!</p>
            </div>
          ) : (
            <>
              {/* Top 3 Podium */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[1, 0, 2].map((idx) => {
                  const person = ranking[idx];
                  if (!person) return <div key={idx} />;
                  const level = getLevelInfo(person.totalPoints);
                  const LevelIcon = level.icon;
                  const RankIcon = rankIcons[idx] || Award;
                  const isFirst = idx === 0;

                  return (
                    <div
                      key={person.id}
                      className={cn(
                        "relative bg-card rounded-2xl border p-6 text-center transition-all duration-300 neon-card",
                        isFirst ? "scale-105 shadow-[0_0_30px_rgba(250,204,21,0.2)] border-yellow-400/30 -mt-4" : "border-border",
                        isFirst && "animate-neon-pulse"
                      )}
                    >
                      {/* Rank badge */}
                      <div className={cn(
                        "absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br shadow-lg",
                        rankColors[idx] || "from-gray-500 to-gray-600"
                      )}>
                        {idx + 1}
                      </div>

                      {/* Avatar */}
                      <div className={cn(
                        "w-16 h-16 rounded-2xl mx-auto mt-2 mb-3 flex items-center justify-center text-xl font-bold text-primary-foreground bg-gradient-to-br",
                        isFirst ? "from-yellow-400 to-amber-500" : "from-primary to-primary/80"
                      )}>
                        {person.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>

                      <h3 className="text-sm font-bold text-foreground">{person.name}</h3>

                      {/* Level */}
                      <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full mt-1 text-[10px] font-medium border", level.bg, level.color, level.border)}>
                        <LevelIcon className="w-3 h-3" />
                        {level.name}
                      </div>

                      {/* Points */}
                      <div className="mt-3">
                        <span className="text-2xl font-black text-foreground">{person.totalPoints.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground ml-1">pts</span>
                      </div>

                      {/* Stats */}
                      <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-primary" /> {person.totalProjects}</span>
                        {person.streak > 0 && <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> {person.streak}d</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Full ranking table */}
              <div className="bg-card rounded-2xl border border-border overflow-hidden neon-card mb-8">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Ranking Completo
                  </h3>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left text-[10px] font-bold text-muted-foreground px-5 py-2.5 uppercase w-12">#</th>
                      <th className="text-left text-[10px] font-bold text-muted-foreground py-2.5 uppercase">Membro</th>
                      <th className="text-left text-[10px] font-bold text-muted-foreground py-2.5 uppercase">Nível</th>
                      <th className="text-center text-[10px] font-bold text-muted-foreground py-2.5 uppercase">Projetos</th>
                      <th className="text-center text-[10px] font-bold text-muted-foreground py-2.5 uppercase">Sequência</th>
                      <th className="text-right text-[10px] font-bold text-muted-foreground px-5 py-2.5 uppercase">Pontos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((person, i) => {
                      const level = getLevelInfo(person.totalPoints);
                      const LevelIcon = level.icon;
                      return (
                        <tr key={person.id} className={cn("border-b border-border/50 hover:bg-accent/20 transition-colors", i < 3 && "bg-primary/5")}>
                          <td className="px-5 py-3">
                            <span className={cn("text-sm font-bold", i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-400" : i === 2 ? "text-orange-400" : "text-muted-foreground")}>
                              {i + 1}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {person.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                              </div>
                              <span className="text-sm font-medium text-foreground">{person.name}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border", level.bg, level.color, level.border)}>
                              <LevelIcon className="w-3 h-3" /> {level.name}
                            </span>
                          </td>
                          <td className="py-3 text-center text-sm text-foreground">{person.totalProjects}</td>
                          <td className="py-3 text-center">
                            {person.streak > 0 ? (
                              <span className="text-sm text-orange-400 font-medium flex items-center justify-center gap-1">
                                <Flame className="w-3.5 h-3.5" /> {person.streak}d
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="text-sm font-bold text-foreground">{person.totalPoints.toLocaleString()}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Recent activity */}
              <div className="bg-card rounded-2xl border border-border overflow-hidden neon-card">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    Atividade Recente
                  </h3>
                </div>
                <div className="divide-y divide-border/50">
                  {recentEntries.map((e) => (
                    <div key={e.id} className="px-5 py-3 flex items-center gap-3 hover:bg-accent/10 transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {e.user_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-foreground">{e.user_name}</span>
                        <span className="text-xs text-muted-foreground"> finalizou </span>
                        <span className="text-xs font-medium text-primary truncate">"{e.project_name}"</span>
                      </div>
                      <span className="text-[10px] text-primary font-bold">+{e.points} pts</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(e.completed_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Premiacao;
