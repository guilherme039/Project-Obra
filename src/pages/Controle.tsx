import { useState } from "react";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAuth } from "@/contexts/AuthContext";
import { etapasService, obrasService } from "@/services/api";
import { Etapa, Obra } from "@/types/erp";
import Layout from "@/components/Layout";
import {
    ListChecks, Calendar, AlertTriangle, CheckCircle, Clock,
    Building2, Search, ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Controle() {
    const { user } = useAuth();
    const companyId = user?.companyId || "";
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");

    const { data: etapas = [] } = useAsyncData(() => etapasService.getByObra("", companyId), [companyId]);
    const { data: obras = [] } = useAsyncData(() => obrasService.getAll(companyId), [companyId]);

    // Group items by Obra
    const obrasWithEtapas = obras.map(obra => {
        const obraEtapas = etapas.filter(e => e.obraId === obra.id);
        const lateSteps = obraEtapas.filter(e => {
            const today = new Date().toISOString().split("T")[0];
            return e.dataFim < today && e.percentualExecutado < 100;
        });
        return {
            ...obra,
            etapas: obraEtapas.sort((a, b) => a.ordem - b.ordem),
            lateCount: lateSteps.length
        };
    }).filter(o => {
        if (!searchTerm) return true;
        return o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.etapas.some(e => e.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    const isLate = (etapa: Etapa) => {
        const today = new Date().toISOString().split("T")[0];
        return etapa.dataFim < today && etapa.percentualExecutado < 100;
    };

    return (
        <Layout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <ListChecks className="h-6 w-6 text-primary" /> Controle de Etapas
                    </h1>
                    <p className="text-muted-foreground">Acompanhe o cronograma de todas as obras ativas.</p>
                </div>
            </div>

            {/* Filter */}
            <div className="glass-card p-4 mb-6 relative">
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    placeholder="Buscar por obra ou etapa..."
                    className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="space-y-6">
                {obrasWithEtapas.length > 0 ? (
                    obrasWithEtapas.map((obra) => (
                        <div key={obra.id} className="glass-card overflow-hidden">
                            {/* Obra Header */}
                            <div className="p-4 border-b border-border/50 bg-secondary/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-primary" />
                                    <span className="font-bold text-foreground">{obra.name}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${obra.status === "Em andamento" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                                        {obra.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    {obra.lateCount > 0 && (
                                        <span className="flex items-center gap-1.5 text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-md">
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                            {obra.lateCount} etapa(s) atrasada(s)
                                        </span>
                                    )}
                                    <button
                                        onClick={() => navigate(`/obras/${obra.id}`)}
                                        className="text-xs flex items-center gap-1 text-primary hover:underline"
                                    >
                                        Ver Detalhes <ArrowRight className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>

                            {/* Etapas List */}
                            <div className="divide-y divide-border/30">
                                {obra.etapas.length > 0 ? (
                                    obra.etapas.map((etapa) => {
                                        const delayed = isLate(etapa);
                                        const completed = etapa.percentualExecutado === 100;

                                        return (
                                            <div key={etapa.id} className={`p-4 flex items-center justify-between hover:bg-secondary/10 transition-colors ${delayed ? "bg-destructive/5" : ""}`}>
                                                <div className="flex-1 min-w-[200px]">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-medium text-foreground">{etapa.ordem}. {etapa.nome}</span>
                                                        {delayed && <span className="text-[10px] font-bold text-destructive px-1.5 rounded bg-destructive/20">ATRASO</span>}
                                                        {completed && <span className="text-[10px] font-bold text-success px-1.5 rounded bg-success/20">CONCLUÍDO</span>}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" /> {etapa.dataInicio} - {etapa.dataFim}
                                                        </span>
                                                        <span>Previsto: {etapa.percentualPrevisto}%</span>
                                                    </div>
                                                </div>

                                                <div className="flex-1 max-w-xs mx-4">
                                                    <div className="flex justify-between mb-1 text-xs">
                                                        <span className="text-muted-foreground">Executado</span>
                                                        <span className={`font-bold ${completed ? "text-success" : delayed ? "text-destructive" : "text-primary"}`}>
                                                            {etapa.percentualExecutado}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all ${completed ? "bg-success" : delayed ? "bg-destructive" : "bg-primary"}`}
                                                            style={{ width: `${etapa.percentualExecutado}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-8 text-center text-muted-foreground text-sm">
                                        Nenhuma etapa cadastrada para esta obra.
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="glass-card p-12 text-center text-muted-foreground">
                        <ListChecks className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p>Nenhuma obra ou etapa encontrada.</p>
                    </div>
                )}
            </div>
        </Layout>
    );
}
