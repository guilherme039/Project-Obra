import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { register as doRegister } from "@/services/api";

export default function Register() {
    const [formData, setFormData] = useState({
        companyName: "",
        companyCnpj: "",
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }

        if (!formData.name || !formData.email || !formData.password) {
            setError("Preencha nome, e-mail e senha.");
            return;
        }

        setLoading(true);
        try {
            const result = await doRegister({
                companyName: formData.companyName,
                companyCnpj: formData.companyCnpj,
                name: formData.name,
                email: formData.email,
                password: formData.password
            });
            if (result.ok) {
                navigate("/login", { replace: true });
            } else {
                setError(result.error || "Erro ao realizar cadastro.");
            }
        } catch {
            setError("Erro ao realizar cadastro.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-[400px]">
                <div className="text-center mb-8">
                    <h1 className="text-xl font-semibold text-foreground tracking-tight">
                        Criar Nova Conta
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1.5">
                        Cadastre sua empresa e comece a usar
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="rounded-lg bg-card p-8 space-y-4 border border-border"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                >
                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">
                            Nome da Empresa
                        </label>
                        <input
                            type="text"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            placeholder="Minha Construtora"
                            disabled={loading}
                            className="w-full px-3 h-11 bg-secondary text-sm text-foreground placeholder:text-muted-foreground/50 rounded-md border border-border focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">
                            Seu Nome
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Seu Nome Completo"
                            disabled={loading}
                            className="w-full px-3 h-11 bg-secondary text-sm text-foreground placeholder:text-muted-foreground/50 rounded-md border border-border focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="seu@email.com"
                            disabled={loading}
                            className="w-full px-3 h-11 bg-secondary text-sm text-foreground placeholder:text-muted-foreground/50 rounded-md border border-border focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">
                            Senha
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Criar uma senha"
                            disabled={loading}
                            className="w-full px-3 h-11 bg-secondary text-sm text-foreground placeholder:text-muted-foreground/50 rounded-md border border-border focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">
                            Confirmar Senha
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Repita a senha"
                            disabled={loading}
                            className="w-full px-3 h-11 bg-secondary text-sm text-foreground placeholder:text-muted-foreground/50 rounded-md border border-border focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    {error && (
                        <p className="text-xs text-destructive">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 rounded-md text-sm font-medium bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 mt-2"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {loading ? "Criando conta..." : "Criar Conta"}
                    </button>

                    <div className="text-center mt-4">
                        <span className="text-xs text-muted-foreground">Já tem uma conta? </span>
                        <Link to="/login" className="text-xs text-primary hover:underline">
                            Fazer Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
