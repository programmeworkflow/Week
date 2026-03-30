import { useState, useEffect } from "react";
import { Trophy, PartyPopper, Star } from "lucide-react";

interface AchievementToastProps {
  show: boolean;
  projectName: string;
  onClose: () => void;
}

const confettiColors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

export const AchievementToast = ({ show, projectName, onClose }: AchievementToastProps) => {
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState<{ id: number; left: number; color: string; delay: number; size: number }[]>([]);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const newParticles = Array.from({ length: 16 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        delay: Math.random() * 0.8,
        size: 5 + Math.random() * 5,
      }));
      setParticles(newParticles);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 500);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show && !visible) return null;

  return (
    <div className={`fixed top-6 right-6 z-[100] transition-all duration-500 ${visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-4 scale-95"}`}>
      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-visible pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="confetti-particle"
            style={{
              left: `${p.left}%`,
              top: "-10px",
              backgroundColor: p.color,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            }}
          />
        ))}
      </div>

      {/* Toast card */}
      <div className="relative bg-card border-2 border-primary/40 rounded-2xl shadow-lg p-5 min-w-[340px] max-w-[400px] animate-celebration animate-neon-pulse">
        {/* Stars decorations */}
        <Star className="absolute -top-2 -left-2 w-5 h-5 text-yellow-400 fill-yellow-400 animate-float" style={{ animationDelay: "0s" }} />
        <Star className="absolute -top-1 -right-3 w-4 h-4 text-yellow-400 fill-yellow-400 animate-float" style={{ animationDelay: "0.5s" }} />

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/30 shrink-0">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <PartyPopper className="w-4 h-4 text-yellow-500 shrink-0" />
              <p className="text-sm font-bold text-foreground">Parabéns!</p>
              <PartyPopper className="w-4 h-4 text-yellow-500 -scale-x-100 shrink-0" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Você concluiu o projeto
            </p>
            <p className="text-xs font-semibold text-primary mt-0.5 truncate">"{projectName}"</p>
            <p className="text-[11px] text-primary/80 font-medium mt-1.5 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              +100 pontos • Continue assim!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
