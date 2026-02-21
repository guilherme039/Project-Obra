import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "@/services/api";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Token de verificação inválido.");
            return;
        }

        const verify = async () => {
            try {
                await api.post("/auth/verify-email", { token });
                setStatus("success");
            } catch (err: any) {
                setStatus("error");
                setMessage(err.response?.data?.error || "Erro ao verificar email. O link pode ter expirado.");
            }
        };

        verify();
    }, [token]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-[400px] text-center bg-card p-8 rounded-lg border border-border shadow-lg">
                {status === "loading" && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                        <p className="text-muted-foreground">Verificando seu email...</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center">
                        <CheckCircle2 className="h-10 w-10 text-green-500 mb-4" />
                        <h1 className="text-xl font-semibold text-foreground mb-2">Email Confirmado!</h1>
                        <p className="text-muted-foreground mb-6">
                            Sua conta foi ativada com sucesso.
                        </p>
                        <Link
                            to="/login"
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            Ir para Login
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center">
                        <XCircle className="h-10 w-10 text-destructive mb-4" />
                        <h1 className="text-xl font-semibold text-foreground mb-2">Falha na Verificação</h1>
                        <p className="text-muted-foreground mb-6">{message}</p>
                        <Link
                            to="/login"
                            className="text-primary hover:underline text-sm"
                        >
                            Voltar para Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
