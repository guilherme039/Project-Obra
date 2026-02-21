import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("admin@erp.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-5 w-5 text-primary animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    try {
      const success = await login(email.trim(), password);
      if (success) {
        navigate("/dashboard");
      } else {
        setError("E-mail ou senha incorretos. Cadastre-se primeiro se ainda não tiver conta.");
      }
    } catch {
      setError("Erro ao realizar login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            ERP Construtora
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Acesse sua conta para continuar
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg bg-card p-8 space-y-5 border border-border"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
        >
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={loading}
              className="w-full px-3 bg-secondary text-sm text-foreground placeholder:text-muted-foreground/50 rounded-md border border-border transition-colors duration-150 focus:outline-none focus:border-primary disabled:opacity-50"
              style={{ height: '44px' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              disabled={loading}
              className="w-full px-3 bg-secondary text-sm text-foreground placeholder:text-muted-foreground/50 rounded-md border border-border transition-colors duration-150 focus:outline-none focus:border-primary disabled:opacity-50"
              style={{ height: '44px' }}
            />
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <button
            type="submit"
            className="w-full h-11 rounded-md text-sm font-medium bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 mt-2"
          >
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div className="text-center mt-4">
            <span className="text-xs text-muted-foreground">
              Não tem uma conta?
            </span>
            <Link
              to="/register"
              className="text-xs text-primary hover:underline ml-1"
            >
              Criar Nova Conta
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
