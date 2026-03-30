import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Sparkles, ArrowRight, Shield } from "lucide-react";
import medworkLogo from "@/assets/medwork-logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      navigate("/dashboard/projects");
    } else {
      setError("Credenciais inválidas. Verifique email e senha.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative overflow-hidden">
      {/* Animated neon background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-primary/15 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/8 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "3s" }} />
        <div className="absolute top-[20%] right-[20%] w-[200px] h-[200px] bg-[hsl(200,80%,50%)]/8 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-[30%] left-[10%] w-[250px] h-[250px] bg-[hsl(270,60%,50%)]/6 rounded-full blur-[90px] animate-pulse" style={{ animationDelay: "4s" }} />

        {/* Floating particles */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/40 rounded-full animate-float"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-[420px] animate-fade-in relative z-10">
        {/* Logo floating above card */}
        <div className="flex justify-center mb-6">
          <div className="relative animate-float">
            <img src={medworkLogo} alt="MedWork" className="h-28 object-contain relative z-10 drop-shadow-[0_0_20px_hsl(var(--primary)/0.4)]" />
            <div className="absolute inset-0 bg-primary/25 blur-3xl rounded-full scale-150" />
          </div>
        </div>

        {/* Main card */}
        <div className="relative">
          {/* Neon border glow behind card */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40 rounded-2xl blur-sm" />

          <div className="relative bg-card rounded-2xl border border-primary/20 p-8 shadow-[0_0_40px_hsl(var(--primary)/0.1)]">
            {/* Header */}
            <div className="text-center mb-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-medium text-primary">Acesso Seguro</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground neon-text">
                Bem-vindo de volta
              </h2>
              <p className="text-sm text-muted-foreground mt-2">Entre com suas credenciais para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</Label>
                <div className={`relative group rounded-xl transition-all duration-300 ${focused === "email" ? "shadow-[0_0_20px_hsl(var(--primary)/0.25)]" : ""}`}>
                  <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${focused === "email" ? "bg-primary/20" : "bg-muted"}`}>
                    <Mail className={`w-4 h-4 transition-colors duration-300 ${focused === "email" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@medwork.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    className="pl-14 h-12 rounded-xl border-border/50 bg-muted/30 focus:bg-card text-foreground"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Senha</Label>
                <div className={`relative group rounded-xl transition-all duration-300 ${focused === "password" ? "shadow-[0_0_20px_hsl(var(--primary)/0.25)]" : ""}`}>
                  <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${focused === "password" ? "bg-primary/20" : "bg-muted"}`}>
                    <Lock className={`w-4 h-4 transition-colors duration-300 ${focused === "password" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                    className="pl-14 h-12 rounded-xl border-border/50 bg-muted/30 focus:bg-card text-foreground"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 animate-fade-in">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full h-13 text-sm font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 btn-3d animate-float group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Entrar
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                {/* Button inner glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-7 pt-5 border-t border-border/50 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <p className="text-xs text-muted-foreground">MedWork • Medicina e Segurança do Trabalho</p>
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.5s" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
