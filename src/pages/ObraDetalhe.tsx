import { useState, useMemo } from "react";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
    obrasService,
    lancamentosService,
    relatoriosService,
    medicoesService,
    comentariosService,
    financeiroExecutivoService,
    etapasService,
    listaComprasService,
    cotacoesService,
    notasFiscaisService,
    alertasService,
    fornecedoresService,
    relatorioGerencialService,
} from "@/services/api";
import { Alerta } from "@/services/api";
import { exportRelatorioSemanalCSV } from "@/services/exportData";
import { RelatorioSemanal, Medicao, ComentarioObra, Lancamento, Etapa, ListaCompra, Cotacao, NotaFiscal } from "@/types/erp";
import Layout from "@/components/Layout";
import {
    ArrowLeft, Eye, FileText, Ruler, DollarSign, MessageSquare,
    Plus, X, Download, Calendar, MapPin, CheckCircle, Clock,
    AlertTriangle, Send, Trash2, ChevronRight, ListChecks,
    ShoppingCart, FileSearch, Receipt, Bell, BarChart3, Pencil,
} from "lucide-react";
import { toast } from "sonner";

const TABS = [
    { id: "geral", label: "Visão Geral", icon: Eye },
    { id: "etapas", label: "Etapas", icon: ListChecks },
    { id: "relatorios", label: "Relatórios", icon: FileText },
    { id: "medicoes", label: "Medições", icon: Ruler },
    { id: "financeiro", label: "Financeiro", icon: DollarSign },
    { id: "compras", label: "Compras", icon: ShoppingCart },
    { id: "cotacoes", label: "Cotações", icon: FileSearch },
    { id: "notas", label: "Notas Fiscais", icon: Receipt },
    { id: "comentarios", label: "Comentários", icon: MessageSquare },
    { id: "alertas", label: "Alertas", icon: Bell },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ObraDetalhe() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const companyId = user?.companyId || "";
    const [activeTab, setActiveTab] = useState<TabId>("geral");
    const [refreshKey, setRefreshKey] = useState(0);

    const { data: obra, loading } = useAsyncData(() => obrasService.getById(id || "", companyId), [id, companyId, refreshKey]);

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground text-sm">Carregando detalhes da obra...</p>
                </div>
            </Layout>
        );
    }

    if (!obra) {
        return (
            <Layout>
                <div className="text-center py-20">
                    <p className="text-muted-foreground">Obra não encontrada.</p>
                    <button onClick={() => navigate("/obras")} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
                        Voltar para Obras
                    </button>
                </div>
            </Layout>
        );
    }

    const refresh = () => setRefreshKey((k) => k + 1);
    const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    return (
        <Layout>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate("/obras")} className="p-2 rounded-md hover:bg-secondary transition-colors">
                    <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-foreground">{obra.name}</h1>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {obra.address}
                    </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${obra.status === "Em andamento" ? "bg-primary/20 text-primary" :
                    obra.status === "Concluida" ? "bg-success/20 text-success" :
                        obra.status === "Pausada" ? "bg-warning/20 text-warning" :
                            obra.status === "Atrasada" ? "bg-orange-500/20 text-orange-400" :
                                "bg-destructive/20 text-destructive"
                    }`}>
                    {obra.status}
                </span>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <tab.icon className="h-3.5 w-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "geral" && <TabVisaoGeral obra={obra} companyId={companyId} formatCurrency={formatCurrency} />}
            {activeTab === "etapas" && <TabEtapas obraId={obra.id} companyId={companyId} refreshKey={refreshKey} onRefresh={refresh} />}
            {activeTab === "relatorios" && <TabRelatorios obraId={obra.id} obraNome={obra.name} companyId={companyId} userId={user!.id} userName={user!.name} refreshKey={refreshKey} onRefresh={refresh} />}
            {activeTab === "medicoes" && <TabMedicoes obraId={obra.id} companyId={companyId} refreshKey={refreshKey} onRefresh={refresh} />}
            {activeTab === "financeiro" && <TabFinanceiro obraId={obra.id} companyId={companyId} refreshKey={refreshKey} formatCurrency={formatCurrency} />}
            {activeTab === "compras" && <TabCompras obraId={obra.id} companyId={companyId} refreshKey={refreshKey} onRefresh={refresh} />}
            {activeTab === "cotacoes" && <TabCotacoes obraId={obra.id} companyId={companyId} refreshKey={refreshKey} onRefresh={refresh} />}
            {activeTab === "notas" && <TabNotasFiscais obraId={obra.id} companyId={companyId} refreshKey={refreshKey} onRefresh={refresh} />}
            {activeTab === "comentarios" && <TabComentarios obraId={obra.id} companyId={companyId} userId={user!.id} userName={user!.name} refreshKey={refreshKey} onRefresh={refresh} />}
            {activeTab === "alertas" && <TabAlertas obraId={obra.id} companyId={companyId} refreshKey={refreshKey} />}
        </Layout>
    );
}

/* ━━━ TAB: Visão Geral + Relatório Gerencial ━━━━━━━━━━━━━━━━━━━ */
function TabVisaoGeral({ obra, companyId, formatCurrency }: { obra: any; companyId: string; formatCurrency: (v: number) => string }) {
    const { data: resumo = { totalPago: 0, totalAPagar: 0, saldoRestante: 0, totalOrcado: 0, percentualExecutado: 0 } } = useAsyncData(() => financeiroExecutivoService.calcularResumo(obra.id, companyId), [obra.id, companyId]);
    const { data: desvio = { percentualDesvio: 0, classificacao: "Dentro do orçamento" } } = useAsyncData(() => financeiroExecutivoService.calcularDesvio(obra.id, companyId), [obra.id, companyId]);
    const { data: fluxo = { risco: "Baixo", itens: [] } } = useAsyncData(() => financeiroExecutivoService.calcularFluxoCaixaFuturo(obra.id, companyId), [obra.id, companyId]);
    const { data: relatorio } = useAsyncData(() => relatorioGerencialService.gerarRelatorio(obra.id, companyId), [obra.id, companyId]);

    const stats = [
        { label: "Orçamento Total", value: formatCurrency(obra.totalCost), color: "text-primary" },
        { label: "Total Pago", value: formatCurrency(resumo.totalPago), color: "text-success" },
        { label: "A Pagar", value: formatCurrency(resumo.totalAPagar), color: "text-warning" },
        { label: "Saldo Restante", value: formatCurrency(resumo.saldoRestante), color: resumo.saldoRestante >= 0 ? "text-success" : "text-destructive" },
    ];

    const desvioColor = desvio.classificacao === "Dentro do orçamento" ? "text-success" : desvio.classificacao === "Acima do orçamento" ? "text-destructive" : "text-blue-400";
    const riscoColor = fluxo.risco === "Baixo" ? "bg-success/20 text-success" : fluxo.risco === "Médio" ? "bg-warning/20 text-warning" : "bg-destructive/20 text-destructive";

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s) => (
                    <div key={s.label} className="stat-card">
                        <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                        <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="glass-card p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Informações da Obra</h3>
                    <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Cliente:</span> <span className="text-foreground ml-1">{obra.client}</span></p>
                        <p><span className="text-muted-foreground">Endereço:</span> <span className="text-foreground ml-1">{obra.address}{obra.number ? `, ${obra.number}` : ""}{obra.complement ? ` - ${obra.complement}` : ""}</span></p>
                        {obra.cep && <p><span className="text-muted-foreground">CEP:</span> <span className="text-foreground ml-1">{obra.cep}</span></p>}
                        <p><span className="text-muted-foreground">Início:</span> <span className="text-foreground ml-1">{obra.startDate}</span></p>
                        <p><span className="text-muted-foreground">Previsão Término:</span> <span className="text-foreground ml-1">{obra.endDate}</span></p>
                        {obra.description && <p><span className="text-muted-foreground">Descrição:</span> <span className="text-foreground ml-1">{obra.description}</span></p>}
                    </div>
                </div>

                <div className="glass-card p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Progresso</h3>
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Físico (automático)</span>
                        <span className="text-foreground font-bold">{obra.progress}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                        <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${obra.progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-sm mt-3 mb-1">
                        <span className="text-muted-foreground">Financeiro</span>
                        <span className="text-foreground font-bold">{resumo.percentualExecutado}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                        <div className="bg-success h-3 rounded-full transition-all" style={{ width: `${Math.min(resumo.percentualExecutado, 100)}%` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div>
                            <p className="text-xs text-muted-foreground">Materiais</p>
                            <p className="text-sm font-bold text-foreground">{formatCurrency(obra.materialsCost || 0)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Empreiteira</p>
                            <p className="text-sm font-bold text-foreground">{formatCurrency(obra.laborCost || 0)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3️⃣ Desvio Orçamentário */}
            <div className="glass-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Desvio Orçamentário</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground">Total Realizado</p>
                        <p className="text-sm font-bold text-foreground">{formatCurrency(desvio.totalRealizado)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Desvio (R$)</p>
                        <p className={`text-sm font-bold ${desvioColor}`}>{desvio.desvio >= 0 ? "+" : ""}{formatCurrency(desvio.desvio)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Desvio (%)</p>
                        <p className={`text-sm font-bold ${desvioColor}`}>{desvio.desvioPercent >= 0 ? "+" : ""}{desvio.desvioPercent}%</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Classificação</p>
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${desvio.classificacao === "Dentro do orçamento" ? "bg-success/20 text-success" : desvio.classificacao === "Acima do orçamento" ? "bg-destructive/20 text-destructive" : "bg-blue-500/20 text-blue-400"}`}>{desvio.classificacao}</span>
                    </div>
                </div>
            </div>

            {/* 4️⃣ Fluxo de Caixa Futuro */}
            <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Fluxo de Caixa Futuro</h3>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${riscoColor}`}>Risco: {fluxo.risco}</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground">Lançamentos Pendentes</p>
                        <p className="text-sm font-bold text-foreground">{formatCurrency(fluxo.totalAPagar)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Compras Planejadas</p>
                        <p className="text-sm font-bold text-foreground">{formatCurrency(fluxo.comprasPlanejadas)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Medições Pendentes</p>
                        <p className="text-sm font-bold text-foreground">{formatCurrency(fluxo.medicoesPendentes)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Projeção Total</p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(fluxo.projecaoTotal)}</p>
                    </div>
                </div>
            </div>

            {/* 8️⃣ Relatório Gerencial Consolidado */}
            {relatorio && (
                <div className="glass-card p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Relatório Gerencial Consolidado</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="stat-card text-center"><p className="text-xs text-muted-foreground">Progresso Físico</p><p className="text-lg font-bold text-primary">{relatorio.progressoFisico}%</p></div>
                        <div className="stat-card text-center"><p className="text-xs text-muted-foreground">Progresso Financeiro</p><p className="text-lg font-bold text-success">{relatorio.progressoFinanceiro}%</p></div>
                        <div className="stat-card text-center"><p className="text-xs text-muted-foreground">Desvio Orçam.</p><p className={`text-lg font-bold ${relatorio.desvioPercent > 5 ? "text-destructive" : relatorio.desvioPercent < -5 ? "text-blue-400" : "text-success"}`}>{relatorio.desvioPercent >= 0 ? "+" : ""}{relatorio.desvioPercent}%</p></div>
                        <div className="stat-card text-center"><p className="text-xs text-muted-foreground">Total Medido</p><p className="text-lg font-bold text-foreground">{formatCurrency(relatorio.totalMedido)}</p></div>
                        <div className="stat-card text-center"><p className="text-xs text-muted-foreground">Total Pago</p><p className="text-lg font-bold text-success">{formatCurrency(relatorio.totalPago)}</p></div>
                        <div className="stat-card text-center"><p className="text-xs text-muted-foreground">Total Pendente</p><p className="text-lg font-bold text-warning">{formatCurrency(relatorio.totalPendente)}</p></div>
                        <div className="stat-card text-center"><p className="text-xs text-muted-foreground">Compras Futuras</p><p className="text-lg font-bold text-foreground">{formatCurrency(relatorio.comprasFuturas)}</p></div>
                        <div className="stat-card text-center"><p className="text-xs text-muted-foreground">Status Geral</p><span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${relatorio.statusGeral === "Concluida" ? "bg-success/20 text-success" : relatorio.statusGeral === "Atrasada" ? "bg-orange-500/20 text-orange-400" : relatorio.statusGeral === "Em andamento" ? "bg-primary/20 text-primary" : "bg-warning/20 text-warning"}`}>{relatorio.statusGeral}</span></div>
                    </div>
                    {relatorio.totalAlertas > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                            <Bell className="h-3.5 w-3.5" /> {relatorio.totalAlertas} alerta(s) ativos • {relatorio.alertasCriticos} crítico(s) • {relatorio.etapasAtrasadas} etapa(s) atrasada(s)
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ━━━ TAB: Relatórios Semanais ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function TabRelatorios({ obraId, obraNome, companyId, userId, userName, refreshKey, onRefresh }: {
    obraId: string; obraNome: string; companyId: string; userId: string; userName: string; refreshKey: number; onRefresh: () => void;
}) {
    const [showForm, setShowForm] = useState(false);
    const { data: relatorios = [] } = useAsyncData(() => relatoriosService.getByObra(obraId, companyId), [obraId, companyId, refreshKey]);

    const handleSave = async (data: Partial<RelatorioSemanal>) => {
        try {
            await relatoriosService.createWithValidation({
                obraId,
                companyId,
                semanaInicio: data.semanaInicio!,
                semanaFim: data.semanaFim!,
                descricaoAtividades: data.descricaoAtividades!,
                fotos: data.fotos || [],
                observacoesTecnicas: data.observacoesTecnicas || "",
                criadoPor: userId,
                criadoPorNome: userName,
            } as Omit<RelatorioSemanal, "id" | "createdAt">);
            toast.success("Relatório semanal criado com sucesso.");
            setShowForm(false);
            onRefresh();
        } catch (e: any) {
            toast.error(e.message || "Erro ao criar relatório.");
        }
    };

    const handleExport = () => {
        try {
            if (relatorios.length === 0) { toast.error("Nenhum relatório para exportar."); return; }
            exportRelatorioSemanalCSV(relatorios, obraNome);
            toast.success("Relatórios exportados em CSV.");
        } catch { toast.error("Erro ao exportar."); }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">{relatorios.length} relatório(s) registrado(s)</h3>
                <div className="flex gap-2">
                    <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 bg-secondary border border-border rounded-md text-xs text-foreground hover:bg-muted transition-colors">
                        <Download className="h-3.5 w-3.5" /> Exportar CSV
                    </button>
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:opacity-90 transition-opacity">
                        <Plus className="h-3.5 w-3.5" /> Novo Relatório
                    </button>
                </div>
            </div>

            {relatorios.length > 0 ? (
                <div className="space-y-3">
                    {relatorios.map((r) => (
                        <div key={r.id} className="glass-card p-4">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium text-foreground">{r.semanaInicio} → {r.semanaFim}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{r.criadoPorNome}</span>
                            </div>
                            <p className="text-sm text-foreground mb-2">{r.descricaoAtividades}</p>
                            {r.observacoesTecnicas && <p className="text-xs text-muted-foreground italic">Obs: {r.observacoesTecnicas}</p>}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhum relatório semanal registrado</p>
                </div>
            )}

            {showForm && <RelatorioFormModal onSave={handleSave} onClose={() => setShowForm(false)} />}
        </div>
    );
}

function RelatorioFormModal({ onSave, onClose }: { onSave: (data: Partial<RelatorioSemanal>) => void; onClose: () => void }) {
    const [form, setForm] = useState({ semanaInicio: "", semanaFim: "", descricaoAtividades: "", observacoesTecnicas: "" });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (form.semanaInicio > form.semanaFim) { toast.error("Data de início deve ser anterior ao fim."); return; }
        onSave(form);
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-foreground">Novo Relatório Semanal</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Semana Início</label>
                            <input type="date" value={form.semanaInicio} onChange={(e) => setForm({ ...form, semanaInicio: e.target.value })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Semana Fim</label>
                            <input type="date" value={form.semanaFim} onChange={(e) => setForm({ ...form, semanaFim: e.target.value })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Descrição das Atividades</label>
                        <textarea value={form.descricaoAtividades} onChange={(e) => setForm({ ...form, descricaoAtividades: e.target.value })} required rows={4} className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Observações Técnicas</label>
                        <textarea value={form.observacoesTecnicas} onChange={(e) => setForm({ ...form, observacoesTecnicas: e.target.value })} rows={2} className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:opacity-80 transition-opacity">Cancelar</button>
                        <button type="submit" className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">Criar Relatório</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ━━━ TAB: Medições ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function TabMedicoes({ obraId, companyId, refreshKey, onRefresh }: { obraId: string; companyId: string; refreshKey: number; onRefresh: () => void }) {
    const [showForm, setShowForm] = useState(false);
    const { data: medicoes = [] } = useAsyncData(() => medicoesService.getByObra(obraId, companyId), [obraId, companyId, refreshKey]);

    const handleSave = async (data: Partial<Medicao>) => {
        try {
            await medicoesService.create({
                obraId,
                companyId,
                descricao: data.descricao!,
                percentualExecutado: data.percentualExecutado!,
                valorMedido: data.valorMedido!,
                dataMedicao: data.dataMedicao!,
                status: "Pendente",
            } as Omit<Medicao, "id" | "createdAt">);
            toast.success("Medição criada com sucesso.");
            setShowForm(false);
            onRefresh();
        } catch { toast.error("Erro ao criar medição."); }
    };

    const handleAprovar = async (id: string) => {
        await medicoesService.aprovarMedicao(id, companyId);
        toast.success("Medição aprovada.");
        onRefresh();
    };

    const handlePagar = async (id: string) => {
        try {
            const result = await medicoesService.pagarMedicao(id, companyId);
            if (result) {
                toast.success("Medição paga. Lançamento financeiro gerado automaticamente.");
            } else {
                toast.error("Erro ao processar pagamento.");
            }
            onRefresh();
        } catch { toast.error("Erro ao processar pagamento."); }
    };

    const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">{medicoes.length} medição(ões) registrada(s)</h3>
                <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:opacity-90 transition-opacity">
                    <Plus className="h-3.5 w-3.5" /> Nova Medição
                </button>
            </div>

            {medicoes.length > 0 ? (
                <div className="glass-card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Descrição</th>
                                <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Data</th>
                                <th className="text-right px-4 py-2 text-xs text-muted-foreground font-medium">% Exec.</th>
                                <th className="text-right px-4 py-2 text-xs text-muted-foreground font-medium">Valor</th>
                                <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Status</th>
                                <th className="text-right px-4 py-2 text-xs text-muted-foreground font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {medicoes.map((m) => (
                                <tr key={m.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                                    <td className="px-4 py-2 text-foreground">{m.descricao}</td>
                                    <td className="px-4 py-2 text-muted-foreground">{m.dataMedicao}</td>
                                    <td className="px-4 py-2 text-right text-foreground">{m.percentualExecutado}%</td>
                                    <td className="px-4 py-2 text-right text-foreground">{formatCurrency(m.valorMedido)}</td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${m.status === "Pago" ? "bg-success/20 text-success" :
                                            m.status === "Aprovado" ? "bg-primary/20 text-primary" :
                                                "bg-warning/20 text-warning"
                                            }`}>{m.status}</span>
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        {m.status === "Pendente" && (
                                            <button onClick={() => handleAprovar(m.id)} className="text-primary hover:underline text-xs mr-2">Aprovar</button>
                                        )}
                                        {m.status === "Aprovado" && (
                                            <button onClick={() => handlePagar(m.id)} className="text-success hover:underline text-xs">Pagar</button>
                                        )}
                                        {m.status === "Pago" && (
                                            <span className="text-xs text-muted-foreground flex items-center justify-end gap-1"><CheckCircle className="h-3 w-3" /> Concluído</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <Ruler className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhuma medição registrada</p>
                </div>
            )}

            {showForm && <MedicaoFormModal onSave={handleSave} onClose={() => setShowForm(false)} />}
        </div>
    );
}

function MedicaoFormModal({ onSave, onClose }: { onSave: (data: Partial<Medicao>) => void; onClose: () => void }) {
    const [form, setForm] = useState({ descricao: "", percentualExecutado: 0, valorMedido: 0, dataMedicao: "" });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (form.valorMedido <= 0) { toast.error("Valor deve ser maior que zero."); return; }
        onSave(form);
    };

    const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-foreground">Nova Medição</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Descrição</label>
                        <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required placeholder="Ex: Fundação - Etapa 1" className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-foreground mb-1">% Executado</label>
                            <input type="number" min={0} max={100} value={form.percentualExecutado} onChange={(e) => setForm({ ...form, percentualExecutado: Number(e.target.value) })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Valor Medido (R$)</label>
                            <input type="number" min={0.01} step={0.01} value={form.valorMedido} onChange={(e) => setForm({ ...form, valorMedido: Number(e.target.value) })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Data da Medição</label>
                        <input type="date" value={form.dataMedicao} onChange={(e) => setForm({ ...form, dataMedicao: e.target.value })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:opacity-80 transition-opacity">Cancelar</button>
                        <button type="submit" className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">Criar Medição</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ━━━ TAB: Financeiro Executivo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function TabFinanceiro({ obraId, companyId, refreshKey, formatCurrency }: { obraId: string; companyId: string; refreshKey: number; formatCurrency: (v: number) => string }) {
    const [periodoTipo, setPeriodoTipo] = useState<"semana" | "mes" | "custom">("mes");
    const [customInicio, setCustomInicio] = useState("");
    const [customFim, setCustomFim] = useState("");

    const { data: resumo = { totalPago: 0, totalAPagar: 0, saldoRestante: 0, totalOrcado: 0, percentualExecutado: 0 } } = useAsyncData(() => financeiroExecutivoService.calcularResumo(obraId, companyId), [obraId, companyId, refreshKey]);

    const { inicio, fim } = useMemo(() => {
        const today = new Date();
        if (periodoTipo === "semana") {
            const dayOfWeek = today.getDay();
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - dayOfWeek);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            return { inicio: startDate.toISOString().split("T")[0], fim: endDate.toISOString().split("T")[0] };
        } else if (periodoTipo === "mes") {
            const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            return { inicio: startDate.toISOString().split("T")[0], fim: endDate.toISOString().split("T")[0] };
        }
        return { inicio: customInicio, fim: customFim };
    }, [periodoTipo, customInicio, customFim]);

    const { data: lancamentos = [] } = useAsyncData(() => {
        if (!inicio || !fim) return Promise.resolve([]);
        return financeiroExecutivoService.filtrarPorPeriodo(obraId, companyId, inicio, fim);
    }, [obraId, companyId, inicio, fim, refreshKey]);

    const stats = [
        { label: "Total Orçado", value: formatCurrency(resumo.totalOrcado), icon: DollarSign, color: "text-primary" },
        { label: "Total Pago", value: formatCurrency(resumo.totalPago), icon: CheckCircle, color: "text-success" },
        { label: "A Pagar", value: formatCurrency(resumo.totalAPagar), icon: Clock, color: "text-warning" },
        { label: "Saldo Restante", value: formatCurrency(resumo.saldoRestante), icon: AlertTriangle, color: resumo.saldoRestante >= 0 ? "text-success" : "text-destructive" },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s) => (
                    <div key={s.label} className="stat-card">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">{s.label}</span>
                            <s.icon className={`h-4 w-4 ${s.color}`} />
                        </div>
                        <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="stat-card">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">% Financeiro Executado</span>
                    <span className="text-sm font-bold text-primary">{resumo.percentualExecutado}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2.5 mt-2">
                    <div className="bg-primary h-2.5 rounded-full transition-all" style={{ width: `${Math.min(resumo.percentualExecutado, 100)}%` }} />
                </div>
            </div>

            {/* Period filter */}
            <div className="glass-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Lançamentos por Período</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                    {([["semana", "Semana"], ["mes", "Mês"], ["custom", "Personalizado"]] as const).map(([key, label]) => (
                        <button key={key} onClick={() => setPeriodoTipo(key)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${periodoTipo === key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                            {label}
                        </button>
                    ))}
                </div>
                {periodoTipo === "custom" && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <input type="date" value={customInicio} onChange={(e) => setCustomInicio(e.target.value)} className="px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        <input type="date" value={customFim} onChange={(e) => setCustomFim(e.target.value)} className="px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>
                )}
                {inicio && fim && <p className="text-xs text-muted-foreground mb-3">Período: {inicio} a {fim}</p>}

                {lancamentos.length > 0 ? (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-2 text-xs text-muted-foreground font-medium">Descrição</th>
                                <th className="text-left py-2 text-xs text-muted-foreground font-medium">Tipo</th>
                                <th className="text-left py-2 text-xs text-muted-foreground font-medium">Vencimento</th>
                                <th className="text-right py-2 text-xs text-muted-foreground font-medium">Valor</th>
                                <th className="text-left py-2 text-xs text-muted-foreground font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lancamentos.map((l) => (
                                <tr key={l.id} className="border-b border-border/50">
                                    <td className="py-2 text-foreground">{l.descricao}</td>
                                    <td className="py-2"><span className={l.tipo === "Receita" ? "text-success" : "text-destructive"}>{l.tipo}</span></td>
                                    <td className="py-2 text-muted-foreground">{l.dataVencimento}</td>
                                    <td className="py-2 text-right text-foreground">{formatCurrency(l.valor)}</td>
                                    <td className="py-2"><span className={`px-2 py-0.5 rounded text-xs font-medium ${l.status === "Pago" ? "bg-success/20 text-success" : l.status === "Atrasado" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"}`}>{l.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">Nenhum lançamento neste período</p>
                )}
            </div>
        </div>
    );
}

/* ━━━ TAB: Comentários Internos ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function TabComentarios({ obraId, companyId, userId, userName, refreshKey, onRefresh }: {
    obraId: string; companyId: string; userId: string; userName: string; refreshKey: number; onRefresh: () => void;
}) {
    const [novoComentario, setNovoComentario] = useState("");
    const { data: comentarios = [] } = useAsyncData(() => comentariosService.getByObra(obraId, companyId), [obraId, companyId, refreshKey]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novoComentario.trim()) return;
        try {
            await comentariosService.createComment({
                obraId,
                companyId,
                usuarioId: userId,
                usuarioNome: userName,
                comentario: novoComentario.trim(),
            });
            toast.success("Comentário adicionado.");
            setNovoComentario("");
            onRefresh();
        } catch { toast.error("Erro ao adicionar comentário."); }
    };

    const handleOcultar = async (id: string) => {
        await comentariosService.softDelete(id, companyId);
        toast.success("Comentário ocultado.");
        onRefresh();
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit} className="glass-card p-4 flex gap-3">
                <input
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                    placeholder="Escreva um comentário interno..."
                    className="flex-1 px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button type="submit" className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
                    <Send className="h-3.5 w-3.5" /> Enviar
                </button>
            </form>

            {comentarios.length > 0 ? (
                <div className="space-y-3">
                    {comentarios.map((c) => (
                        <div key={c.id} className="glass-card p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-foreground">{c.usuarioNome}</span>
                                        <span className="text-xs text-muted-foreground">{new Date(c.dataCriacao).toLocaleString("pt-BR")}</span>
                                    </div>
                                    <p className="text-sm text-foreground">{c.comentario}</p>
                                </div>
                                <button onClick={() => handleOcultar(c.id)} className="text-muted-foreground hover:text-destructive transition-colors ml-2" title="Ocultar comentário">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhum comentário registrado</p>
                </div>
            )}
        </div>
    );
}

/* ━━━ TAB: Etapas / Cronograma ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function TabEtapas({ obraId, companyId, refreshKey, onRefresh }: { obraId: string; companyId: string; refreshKey: number; onRefresh: () => void }) {
    const [showForm, setShowForm] = useState(false);
    const [editEtapa, setEditEtapa] = useState<Etapa | undefined>();
    const { data: etapas = [] } = useAsyncData(() => etapasService.getByObra(obraId, companyId), [obraId, companyId, refreshKey]);
    const { data: somaPercPrevisto = 0 } = useAsyncData(() => etapasService.somaPercentualPrevisto(obraId, companyId), [obraId, companyId, refreshKey]);
    const { data: atrasadas = [] } = useAsyncData(() => etapasService.verificarAtraso(obraId, companyId), [obraId, companyId, refreshKey]);

    const handleSave = async (data: Partial<Etapa>) => {
        try {
            if (editEtapa) {
                await etapasService.updateWithValidation(editEtapa.id, companyId, data);
                toast.success("Etapa atualizada.");
            } else {
                await etapasService.createWithValidation({
                    obraId, companyId,
                    nome: data.nome!, descricao: data.descricao || "",
                    dataInicio: data.dataInicio!, dataFim: data.dataFim!,
                    percentualPrevisto: data.percentualPrevisto!,
                    percentualExecutado: data.percentualExecutado || 0,
                    ordem: etapas.length + 1,
                } as Omit<Etapa, "id" | "createdAt">);
                toast.success("Etapa criada. Progresso da obra recalculado.");
            }
            setShowForm(false); setEditEtapa(undefined); onRefresh();
        } catch (e: any) { toast.error(e.message || "Erro ao salvar etapa."); }
    };

    const handleDelete = async (id: string) => {
        try {
            await etapasService.deleteWithValidation(id, companyId);
            toast.success("Etapa excluída. Progresso recalculado.");
            onRefresh();
        } catch (e: any) { toast.error(e.message || "Erro ao excluir etapa."); }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">{etapas.length} etapa(s)</h3>
                    <p className="text-xs text-muted-foreground">Previsto alocado: <span className={somaPercPrevisto > 100 ? "text-destructive font-bold" : "text-primary font-bold"}>{somaPercPrevisto}%</span> / 100%</p>
                </div>
                <button onClick={() => { setEditEtapa(undefined); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:opacity-90 transition-opacity">
                    <Plus className="h-3.5 w-3.5" /> Nova Etapa
                </button>
            </div>

            {atrasadas.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3">
                    <p className="text-xs font-medium text-destructive flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> {atrasadas.length} etapa(s) atrasada(s)</p>
                </div>
            )}

            {etapas.length > 0 ? (
                <div className="space-y-2">
                    {etapas.map((e) => {
                        const isAtrasada = atrasadas.some((a) => a.id === e.id);
                        return (
                            <div key={e.id} className={`glass-card p-4 ${isAtrasada ? "border border-destructive/40" : ""}`}>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-foreground">{e.ordem}. {e.nome}</span>
                                            {isAtrasada && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-destructive/20 text-destructive">ATRASADA</span>}
                                        </div>
                                        {e.descricao && <p className="text-xs text-muted-foreground mt-0.5">{e.descricao}</p>}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => { setEditEtapa(e); setShowForm(true); }} className="p-1 text-muted-foreground hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
                                        <button onClick={() => handleDelete(e.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs mb-2">
                                    <div><span className="text-muted-foreground">Início:</span> <span className="text-foreground ml-1">{e.dataInicio}</span></div>
                                    <div><span className="text-muted-foreground">Fim:</span> <span className="text-foreground ml-1">{e.dataFim}</span></div>
                                    <div><span className="text-muted-foreground">Peso:</span> <span className="text-primary font-bold ml-1">{e.percentualPrevisto}%</span></div>
                                    <div><span className="text-muted-foreground">Executado:</span> <span className="text-foreground font-bold ml-1">{e.percentualExecutado}%</span></div>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                    <div className={`h-2 rounded-full transition-all ${isAtrasada ? "bg-destructive" : "bg-primary"}`} style={{ width: `${e.percentualExecutado}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <ListChecks className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhuma etapa cadastrada</p>
                </div>
            )}

            {showForm && <EtapaFormModal etapa={editEtapa} disponivel={100 - somaPercPrevisto + (editEtapa?.percentualPrevisto || 0)} onSave={handleSave} onClose={() => { setShowForm(false); setEditEtapa(undefined); }} />}
        </div>
    );
}

function EtapaFormModal({ etapa, disponivel, onSave, onClose }: { etapa?: Etapa; disponivel: number; onSave: (data: Partial<Etapa>) => void; onClose: () => void }) {
    const [form, setForm] = useState({
        nome: etapa?.nome || "", descricao: etapa?.descricao || "",
        dataInicio: etapa?.dataInicio || "", dataFim: etapa?.dataFim || "",
        percentualPrevisto: etapa?.percentualPrevisto || 0, percentualExecutado: etapa?.percentualExecutado || 0,
    });
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (form.dataInicio > form.dataFim) { toast.error("Data de início deve ser anterior ao fim."); return; }
        if (form.percentualPrevisto > disponivel) { toast.error(`Percentual disponível: ${disponivel}%`); return; }
        onSave(form);
    };
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-foreground">{etapa ? "Editar" : "Nova"} Etapa</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Percentual disponível: <span className="text-primary font-bold">{disponivel}%</span></p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-xs font-medium text-foreground mb-1">Nome</label><input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required placeholder="Ex: Fundação" className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                    <div><label className="block text-xs font-medium text-foreground mb-1">Descrição</label><textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={2} className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-medium text-foreground mb-1">Início</label><input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                        <div><label className="block text-xs font-medium text-foreground mb-1">Fim</label><input type="date" value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-medium text-foreground mb-1">% Previsto</label><input type="number" min={0} max={disponivel} value={form.percentualPrevisto} onChange={(e) => setForm({ ...form, percentualPrevisto: Number(e.target.value) })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                        <div><label className="block text-xs font-medium text-foreground mb-1">% Executado</label><input type="number" min={0} max={100} value={form.percentualExecutado} onChange={(e) => setForm({ ...form, percentualExecutado: Number(e.target.value) })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:opacity-80 transition-opacity">Cancelar</button>
                        <button type="submit" className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">{etapa ? "Salvar" : "Criar Etapa"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ━━━ TAB: Lista de Compras ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function TabCompras({ obraId, companyId, refreshKey, onRefresh }: { obraId: string; companyId: string; refreshKey: number; onRefresh: () => void }) {
    const [showForm, setShowForm] = useState(false);
    const { data: compras = [] } = useAsyncData(() => listaComprasService.getByObra(obraId, companyId), [obraId, companyId, refreshKey]);
    const { data: projecao = { totalPlanejado: 0, totalComprado: 0, total: 0 } } = useAsyncData(() => listaComprasService.projecaoDesembolso(obraId, companyId), [obraId, companyId, refreshKey]);
    const { data: etapas = [] } = useAsyncData(() => etapasService.getByObra(obraId, companyId), [obraId, companyId, refreshKey]);
    const fmtC = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const handleSave = async (data: Partial<ListaCompra>) => {
        try {
            await listaComprasService.create({ obraId, companyId, etapaId: data.etapaId || undefined, descricao: data.descricao!, valorPrevisto: data.valorPrevisto!, dataPrevista: data.dataPrevista!, status: "Planejado" } as Omit<ListaCompra, "id" | "createdAt">);
            toast.success("Compra adicionada."); setShowForm(false); onRefresh();
        } catch { toast.error("Erro ao adicionar compra."); }
    };

    const handleMarcarComprado = async (id: string) => { await listaComprasService.marcarComprado(id, companyId); toast.success("Compra marcada como realizada."); onRefresh(); };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
                <div className="stat-card"><p className="text-xs text-muted-foreground mb-1">Planejado</p><p className="text-lg font-bold text-warning">{fmtC(projecao.totalPlanejado)}</p></div>
                <div className="stat-card"><p className="text-xs text-muted-foreground mb-1">Comprado</p><p className="text-lg font-bold text-success">{fmtC(projecao.totalComprado)}</p></div>
                <div className="stat-card"><p className="text-xs text-muted-foreground mb-1">Total</p><p className="text-lg font-bold text-primary">{fmtC(projecao.total)}</p></div>
            </div>
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">{compras.length} item(ns)</h3>
                <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:opacity-90 transition-opacity"><Plus className="h-3.5 w-3.5" /> Nova Compra</button>
            </div>
            {compras.length > 0 ? (
                <div className="glass-card overflow-hidden"><table className="w-full text-sm"><thead><tr className="border-b border-border">
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Descrição</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Etapa</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Data</th>
                    <th className="text-right px-4 py-2 text-xs text-muted-foreground font-medium">Valor</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Status</th>
                    <th className="text-right px-4 py-2 text-xs text-muted-foreground font-medium">Ações</th>
                </tr></thead><tbody>{compras.map((c) => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-2 text-foreground">{c.descricao}</td>
                        <td className="px-4 py-2 text-muted-foreground text-xs">{etapas.find((e) => e.id === c.etapaId)?.nome || "—"}</td>
                        <td className="px-4 py-2 text-muted-foreground">{c.dataPrevista}</td>
                        <td className="px-4 py-2 text-right text-foreground">{fmtC(c.valorPrevisto)}</td>
                        <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded text-xs font-medium ${c.status === "Comprado" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}`}>{c.status}</span></td>
                        <td className="px-4 py-2 text-right">
                            {c.status === "Planejado" && <button onClick={() => handleMarcarComprado(c.id)} className="text-primary hover:underline text-xs">Marcar Comprado</button>}
                            {c.status === "Comprado" && <span className="text-xs text-muted-foreground flex items-center justify-end gap-1"><CheckCircle className="h-3 w-3" /> OK</span>}
                        </td>
                    </tr>
                ))}</tbody></table></div>
            ) : (
                <div className="glass-card p-12 text-center"><ShoppingCart className="h-10 w-10 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">Nenhuma compra planejada</p></div>
            )}
            {showForm && <CompraFormModal etapas={etapas} onSave={handleSave} onClose={() => setShowForm(false)} />}
        </div>
    );
}

function CompraFormModal({ etapas, onSave, onClose }: { etapas: Etapa[]; onSave: (data: Partial<ListaCompra>) => void; onClose: () => void }) {
    const [form, setForm] = useState({ descricao: "", etapaId: "", valorPrevisto: 0, dataPrevista: "" });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (form.valorPrevisto <= 0) { toast.error("Valor deve ser maior que zero."); return; } onSave(form); };
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-lg p-6">
                <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-foreground">Nova Compra</h2><button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button></div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-xs font-medium text-foreground mb-1">Descrição</label><input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required placeholder="Ex: Cimento CP-II 50kg" className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                    <div><label className="block text-xs font-medium text-foreground mb-1">Etapa (opcional)</label><select value={form.etapaId} onChange={(e) => setForm({ ...form, etapaId: e.target.value })} className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"><option value="">— Nenhuma —</option>{etapas.map((et) => <option key={et.id} value={et.id}>{et.nome}</option>)}</select></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-medium text-foreground mb-1">Valor (R$)</label><input type="number" min={0.01} step={0.01} value={form.valorPrevisto} onChange={(e) => setForm({ ...form, valorPrevisto: Number(e.target.value) })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                        <div><label className="block text-xs font-medium text-foreground mb-1">Data Prevista</label><input type="date" value={form.dataPrevista} onChange={(e) => setForm({ ...form, dataPrevista: e.target.value })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:opacity-80 transition-opacity">Cancelar</button>
                        <button type="submit" className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">Adicionar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ━━━ TAB: Cotações ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function TabCotacoes({ obraId, companyId, refreshKey, onRefresh }: { obraId: string; companyId: string; refreshKey: number; onRefresh: () => void }) {
    const [showForm, setShowForm] = useState(false);
    const { data: cotacoes = [] } = useAsyncData(() => cotacoesService.getByObra(obraId, companyId), [obraId, companyId, refreshKey]);
    const { data: fornecedores = [] } = useAsyncData(() => fornecedoresService.getAll(companyId), [companyId]);
    const fmtC = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const handleSave = async (data: Partial<Cotacao>) => {
        try {
            const f = fornecedores.find((x) => x.id === data.fornecedorId);
            await cotacoesService.create({ obraId, companyId, fornecedorId: data.fornecedorId!, fornecedorNome: f?.nome || "", descricao: data.descricao!, valor: data.valor!, status: "Solicitado", criadoEm: new Date().toISOString() } as Omit<Cotacao, "id" | "createdAt">);
            toast.success("Cotação solicitada."); setShowForm(false); onRefresh();
        } catch { toast.error("Erro ao criar cotação."); }
    };

    const handleAprovar = async (id: string) => { const r = await cotacoesService.aprovarCotacao(id, companyId); if (r) toast.success("Aprovada. Lançamento gerado."); else toast.error("Erro."); onRefresh(); };
    const handleRejeitar = async (id: string) => { await cotacoesService.rejeitarCotacao(id, companyId); toast.success("Cotação rejeitada."); onRefresh(); };
    const handleReceber = async (id: string) => {
        const v = prompt("Valor recebido (R$):");
        if (!v) return;
        const valor = parseFloat(v);
        if (isNaN(valor) || valor <= 0) { toast.error("Valor inválido."); return; }
        await cotacoesService.receberCotacao(id, companyId, valor);
        toast.success("Cotação marcada como Recebido."); onRefresh();
    };

    const descricoes = [...new Set(cotacoes.map((c) => c.descricao))];
    const sc: Record<string, string> = { Solicitado: "bg-blue-500/20 text-blue-400", Recebido: "bg-warning/20 text-warning", Aprovado: "bg-success/20 text-success", Rejeitado: "bg-destructive/20 text-destructive" };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">{cotacoes.length} cotação(ões)</h3>
                <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:opacity-90 transition-opacity"><Plus className="h-3.5 w-3.5" /> Nova Cotação</button>
            </div>
            {descricoes.length > 0 ? (
                <div className="space-y-4">
                    {descricoes.map((desc) => {
                        const grupo = cotacoes.filter((c) => c.descricao === desc).sort((a, b) => a.valor - b.valor);
                        const menor = grupo.length > 0 ? grupo[0].valor : 0;
                        return (
                            <div key={desc} className="glass-card p-4">
                                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><FileSearch className="h-4 w-4 text-primary" /> {desc}<span className="text-xs text-muted-foreground ml-auto">{grupo.length} proposta(s)</span></h4>
                                <div className="space-y-2">{grupo.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-secondary/30">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-foreground">{c.fornecedorNome || c.fornecedorId}</span>
                                            <span className={`text-sm font-bold ${c.valor === menor && grupo.length > 1 ? "text-success" : "text-foreground"}`}>{fmtC(c.valor)}</span>
                                            {c.valor === menor && grupo.length > 1 && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-success/20 text-success">MENOR</span>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${sc[c.status] || ""}`}>{c.status}</span>
                                            {c.status === "Solicitado" && <button onClick={() => handleReceber(c.id)} className="text-primary hover:underline text-xs">Receber</button>}
                                            {c.status === "Recebido" && (<><button onClick={() => handleAprovar(c.id)} className="text-success hover:underline text-xs">Aprovar</button><button onClick={() => handleRejeitar(c.id)} className="text-destructive hover:underline text-xs">Rejeitar</button></>)}
                                        </div>
                                    </div>
                                ))}</div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="glass-card p-12 text-center"><FileSearch className="h-10 w-10 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">Nenhuma cotação registrada</p></div>
            )}
            {showForm && <CotacaoFormModal fornecedores={fornecedores} onSave={handleSave} onClose={() => setShowForm(false)} />}
        </div>
    );
}

function CotacaoFormModal({ fornecedores, onSave, onClose }: { fornecedores: any[]; onSave: (data: Partial<Cotacao>) => void; onClose: () => void }) {
    const [form, setForm] = useState({ fornecedorId: "", descricao: "", valor: 0 });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!form.fornecedorId) { toast.error("Selecione fornecedor."); return; } if (form.valor <= 0) { toast.error("Valor inválido."); return; } onSave(form); };
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-lg p-6">
                <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-foreground">Nova Cotação</h2><button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button></div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-xs font-medium text-foreground mb-1">Fornecedor</label><select value={form.fornecedorId} onChange={(e) => setForm({ ...form, fornecedorId: e.target.value })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"><option value="">— Selecione —</option>{fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}</select></div>
                    <div><label className="block text-xs font-medium text-foreground mb-1">Descrição / Material</label><input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required placeholder="Ex: Cimento CP-II" className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                    <div><label className="block text-xs font-medium text-foreground mb-1">Valor (R$)</label><input type="number" min={0.01} step={0.01} value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:opacity-80 transition-opacity">Cancelar</button>
                        <button type="submit" className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">Solicitar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ━━━ TAB: Notas Fiscais ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function TabNotasFiscais({ obraId, companyId, refreshKey, onRefresh }: { obraId: string; companyId: string; refreshKey: number; onRefresh: () => void }) {
    const [showForm, setShowForm] = useState(false);
    const [pI, setPI] = useState(""); const [pF, setPF] = useState("");
    const { data: fornecedores = [] } = useAsyncData(() => fornecedoresService.getAll(companyId), [companyId]);
    const { data: lancs = [] } = useAsyncData(() => lancamentosService.getAll(companyId).then(all => all.filter(l => l.obraId === obraId)), [obraId, companyId, refreshKey]);
    const fmtC = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const { data: notas = [] } = useAsyncData(() => (pI && pF) ? notasFiscaisService.filtrarPorPeriodo(obraId, companyId, pI, pF) : notasFiscaisService.getByObra(obraId, companyId), [obraId, companyId, refreshKey, pI, pF]);

    const handleSave = async (data: Partial<NotaFiscal>) => {
        try {
            const f = fornecedores.find((x) => x.id === data.fornecedorId);
            await notasFiscaisService.createWithValidation({ obraId, companyId, numero: data.numero!, fornecedorId: data.fornecedorId!, fornecedorNome: f?.nome || "", valor: data.valor!, dataEmissao: data.dataEmissao!, arquivoURL: "", lancamentoId: data.lancamentoId || "" } as Omit<NotaFiscal, "id" | "createdAt">);
            toast.success("NF registrada."); setShowForm(false); onRefresh();
        } catch (e: any) { toast.error(e.message || "Erro ao registrar NF."); }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">{notas.length} nota(s) fiscal(is)</h3>
                <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:opacity-90 transition-opacity"><Plus className="h-3.5 w-3.5" /> Registrar NF</button>
            </div>
            <div className="flex items-center gap-3">
                <input type="date" value={pI} onChange={(e) => setPI(e.target.value)} className="px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <span className="text-muted-foreground text-sm">a</span>
                <input type="date" value={pF} onChange={(e) => setPF(e.target.value)} className="px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                {(pI || pF) && <button onClick={() => { setPI(""); setPF(""); }} className="text-xs text-muted-foreground hover:text-foreground">Limpar</button>}
            </div>
            {notas.length > 0 ? (
                <div className="glass-card overflow-hidden"><table className="w-full text-sm"><thead><tr className="border-b border-border">
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Número</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Fornecedor</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Emissão</th>
                    <th className="text-right px-4 py-2 text-xs text-muted-foreground font-medium">Valor</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Lançamento</th>
                </tr></thead><tbody>{notas.map((n) => (
                    <tr key={n.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-2 text-foreground font-medium">{n.numero}</td>
                        <td className="px-4 py-2 text-foreground">{n.fornecedorNome || n.fornecedorId}</td>
                        <td className="px-4 py-2 text-muted-foreground">{n.dataEmissao}</td>
                        <td className="px-4 py-2 text-right text-foreground">{fmtC(n.valor)}</td>
                        <td className="px-4 py-2">{n.lancamentoId ? <span className="text-xs text-success flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Vinculado</span> : <span className="text-xs text-muted-foreground">—</span>}</td>
                    </tr>
                ))}</tbody></table></div>
            ) : (
                <div className="glass-card p-12 text-center"><Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">Nenhuma NF registrada</p></div>
            )}
            {showForm && <NFFormModal fornecedores={fornecedores} lancamentos={lancs} onSave={handleSave} onClose={() => setShowForm(false)} />}
        </div>
    );
}

function NFFormModal({ fornecedores, lancamentos, onSave, onClose }: { fornecedores: any[]; lancamentos: Lancamento[]; onSave: (data: Partial<NotaFiscal>) => void; onClose: () => void }) {
    const [form, setForm] = useState({ numero: "", fornecedorId: "", valor: 0, dataEmissao: "", lancamentoId: "" });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (form.valor <= 0) { toast.error("Valor inválido."); return; } onSave(form); };
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-lg p-6">
                <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-foreground">Registrar Nota Fiscal</h2><button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button></div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-medium text-foreground mb-1">Nº / NF</label><input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} required placeholder="NF-001" className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                        <div><label className="block text-xs font-medium text-foreground mb-1">Emissão</label><input type="date" value={form.dataEmissao} onChange={(e) => setForm({ ...form, dataEmissao: e.target.value })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                    </div>
                    <div><label className="block text-xs font-medium text-foreground mb-1">Fornecedor</label><select value={form.fornecedorId} onChange={(e) => setForm({ ...form, fornecedorId: e.target.value })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"><option value="">— Selecione —</option>{fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}</select></div>
                    <div><label className="block text-xs font-medium text-foreground mb-1">Valor (R$)</label><input type="number" min={0.01} step={0.01} value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                    <div><label className="block text-xs font-medium text-foreground mb-1">Vincular Lançamento <span className="text-destructive">*</span></label><select value={form.lancamentoId} onChange={(e) => setForm({ ...form, lancamentoId: e.target.value })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"><option value="">— Selecione o lançamento —</option>{lancamentos.map((l) => <option key={l.id} value={l.id}>{l.descricao} — R$ {l.valor.toFixed(2)}</option>)}</select><p className="text-[10px] text-muted-foreground mt-1">Obrigatório vincular a um lançamento financeiro.</p></div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:opacity-80 transition-opacity">Cancelar</button>
                        <button type="submit" className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">Registrar NF</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ━━━ TAB: Alertas / Inteligência Operacional ━━━━━━━━━━━━━━━━━ */
function TabAlertas({ obraId, companyId, refreshKey }: { obraId: string; companyId: string; refreshKey: number }) {
    const { data: alertas = [] } = useAsyncData(() => alertasService.gerarAlertas(obraId, companyId), [obraId, companyId, refreshKey]);
    const iconMap: Record<string, typeof AlertTriangle> = { etapa: Calendar, atraso: AlertTriangle, compra: ShoppingCart, desvio: BarChart3, medicao: Ruler, obra: AlertTriangle };
    const colorMap: Record<string, string> = { info: "border-blue-500/30 bg-blue-500/5", warning: "border-warning/30 bg-warning/5", critical: "border-destructive/30 bg-destructive/5" };
    const icMap: Record<string, string> = { info: "text-blue-400", warning: "text-warning", critical: "text-destructive" };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Inteligência Operacional</h3>
                {alertas.length > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-destructive/20 text-destructive">{alertas.length}</span>}
            </div>
            {alertas.length > 0 ? (
                <div className="space-y-3">
                    {alertas.map((a, i) => {
                        const Icon = iconMap[a.tipo] || AlertTriangle;
                        return (
                            <div key={i} className={`rounded-lg border p-4 ${colorMap[a.severidade] || ""}`}>
                                <div className="flex items-start gap-3">
                                    <Icon className={`h-5 w-5 mt-0.5 ${icMap[a.severidade] || ""}`} />
                                    <div><p className="text-sm font-medium text-foreground">{a.titulo}</p><p className="text-xs text-muted-foreground mt-0.5">{a.descricao}</p></div>
                                    <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-bold uppercase ${a.severidade === "critical" ? "bg-destructive/20 text-destructive" : a.severidade === "warning" ? "bg-warning/20 text-warning" : "bg-blue-500/20 text-blue-400"}`}>
                                        {a.severidade === "critical" ? "Crítico" : a.severidade === "warning" ? "Atenção" : "Info"}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <CheckCircle className="h-10 w-10 text-success mx-auto mb-3" />
                    <p className="text-sm font-medium text-success">Nenhum alerta — tudo operacional</p>
                    <p className="text-xs text-muted-foreground mt-1">Etapas em dia, sem desvios financeiros e sem compras pendentes.</p>
                </div>
            )}
        </div>
    );
}
