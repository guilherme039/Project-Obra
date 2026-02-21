import { useNavigate } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";

interface ComingSoonProps {
    title?: string;
    description?: string;
}

export default function ComingSoon({
    title = "Em Desenvolvimento",
    description = "Estamos trabalhando duro para trazer esta funcionalidade para você em breve."
}: ComingSoonProps) {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">

                {/* Icon Container */}
                <div className="mx-auto w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-2xl shadow-primary/20 relative group">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <Construction className="h-10 w-10 text-primary relative z-10" />
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                        {title}
                    </h1>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                        {description}
                    </p>
                </div>

                {/* Action Button */}
                <button
                    onClick={() => navigate("/dashboard")}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium transition-all hover:scale-105 active:scale-95 group"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Voltar para o Dashboard
                </button>

            </div>

            {/* Footer Branding */}
            <div className="absolute bottom-8 text-white/20 text-xs font-medium tracking-widest uppercase">
                Cottu System
            </div>
        </div>
    );
}
