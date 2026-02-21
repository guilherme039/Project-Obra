import { useState, useMemo } from "react";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAuth } from "@/contexts/AuthContext";
import { cotacoesService, obrasService, fornecedoresService } from "@/services/api";
import { Cotacao, Obra, Fornecedor } from "@/types/erp";
import Layout from "@/components/Layout";
import {
    Plus, Search, Filter, FileSearch, CheckCircle, XCircle, DollarSign,
    MoreVertical, ArrowUpRight, Building2, Calendar
} from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Cotacoes() {
    const { user } = useAuth();
    const companyId = user?.companyId || "";
    const [refreshKey, setRefreshKey] = useState(0);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterObra, setFilterObra] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [showForm, setShowForm] = useState(false);

    // Fetch Data
    const { data: cotacoes = [], loading } = useAsyncData(async () => {
        // Backend doesn't support global get yet? 
        // Wait, crudService getAll does "GET /api/basePath".
        // backend/src/routes/cotacoes.ts GET / handles companyId filter automatically.
        // So getAll() matches GET /.
        return cotacoesService.getAll(companyId);
    }, [companyId, refreshKey]);

    const { data: obras = [] } = useAsyncData(() => obrasService.getAll(companyId), [companyId]);
    const { data: fornecedores = [] } = useAsyncData(() => fornecedoresService.getAll(companyId), [companyId]);

    const refresh = () => setRefreshKey(k => k + 1);

    // Filtering
    const filteredCotacoes = useMemo(() => {
        return cotacoes.filter(c => {
            const matchesStatus = filterStatus === "all" || c.status === filterStatus;
            const matchesObra = filterObra === "all" || c.obraId === filterObra;
            const matchesSearch = c.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.fornecedorNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.obra?.name?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesObra && matchesSearch;
        });
    }, [cotacoes, filterStatus, filterObra, searchTerm]);

    // Actions
    const handleAprovar = async (id: string) => {
        const promise = cotacoesService.aprovarCotacao(id, companyId);
        toast.promise(promise, {
            loading: "Aprovando cotação...",
            success: "Cotação aprovada e lançada no financeiro!",
            error: "Erro ao aprovar cotação."
        });
        await promise;
        refresh();
    };

    const handleRejeitar = async (id: string) => {
        await cotacoesService.rejeitarCotacao(id, companyId);
        toast.success("Cotação rejeitada.");
        refresh();
    };

    const handleReceber = async (id: string) => {
        const v = prompt("Informe o valor final recebido (R$):");
        if (!v) return;
        const valor = parseFloat(v.replace(",", "."));
        if (isNaN(valor) || valor <= 0) {
            toast.error("Valor inválido.");
            return;
        }
        await cotacoesService.receberCotacao(id, companyId, valor);
        toast.success("Cotação atualizada para Recebido.");
        refresh();
    };

    const handleSave = async (data: any) => {
        try {
            const f = fornecedores.find(x => x.id === data.fornecedorId);
            await cotacoesService.create({
                ...data,
                companyId,
                fornecedorNome: f?.nome || "",
                status: "Solicitado",
                criadoEm: new Date().toISOString()
            });
            toast.success("Cotação solicitada com sucesso.");
            setShowForm(false);
            refresh();
        } catch (error) {
            toast.error("Erro ao criar cotação.");
        }
    };

    const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    // Status Colors
    const statusColor = (s: string) => {
        switch (s) {
            case "Solicitado": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case "Recebido": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
            case "Aprovado": return "bg-green-500/10 text-green-500 border-green-500/20";
            case "Rejeitado": return "bg-red-500/10 text-red-500 border-red-500/20";
            default: return "bg-secondary text-muted-foreground border-border";
        }
    };

    return (
        <Layout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <FileSearch className="h-6 w-6 text-primary" /> Gestão de Cotações
                    </h1>
                    <p className="text-muted-foreground">Gerencie todas as solicitações de compra e orçamentos.</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/20"
                >
                    <Plus className="h-4 w-4" /> Nova Cotação
                </button>
            </div>

            {/* Filters */}
            <div className="glass-card p-4 mb-6 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        placeholder="Buscar por descrição, fornecedor ou obra..."
                        className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <select
                        className="px-3 py-2 bg-secondary/50 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">Todos os Status</option>
                        <option value="Solicitado">Solicitado</option>
                        <option value="Recebido">Recebido</option>
                        <option value="Aprovado">Aprovado</option>
                        <option value="Rejeitado">Rejeitado</option>
                    </select>
                    <select
                        className="px-3 py-2 bg-secondary/50 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 max-w-[200px]"
                        value={filterObra}
                        onChange={(e) => setFilterObra(e.target.value)}
                    >
                        <option value="all">Todas as Obras</option>
                        {obras.map(o => (
                            <option key={o.id} value={o.id}>{o.name || (o as any).nome}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-secondary/30">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Obra</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fornecedor</th>
                                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
                                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredCotacoes.length > 0 ? (
                                filteredCotacoes.map((c) => (
                                    <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-foreground">{c.descricao}</div>
                                            <div className="text-xs text-muted-foreground">{new Date(c.criadoEm || c.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 className="h-3.5 w-3.5" />
                                                {c.obra?.name || "—"}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{c.fornecedorNome || c.fornecedorId || "—"}</td>
                                        <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(c.valor)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColor(c.status)}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger className="p-1 hover:bg-secondary rounded-md transition-colors">
                                                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {c.status === "Solicitado" && (
                                                        <DropdownMenuItem onClick={() => handleReceber(c.id)}>
                                                            <DollarSign className="mr-2 h-4 w-4" /> Informar Valor Recebido
                                                        </DropdownMenuItem>
                                                    )}
                                                    {c.status === "Recebido" && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => handleAprovar(c.id)} className="text-green-500 focus:text-green-500">
                                                                <CheckCircle className="mr-2 h-4 w-4" /> Aprovar Orçamento
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleRejeitar(c.id)} className="text-red-500 focus:text-red-500">
                                                                <XCircle className="mr-2 h-4 w-4" /> Rejeitar
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    {c.status !== "Solicitado" && c.status !== "Recebido" && (
                                                        <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
                                                            Nenhuma ação disponível
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                        <FileSearch className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                        <p>Nenhuma cotação encontrada</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showForm && (
                <GlobalCotacaoFormModal
                    obras={obras}
                    fornecedores={fornecedores}
                    onSave={handleSave}
                    onClose={() => setShowForm(false)}
                />
            )}
        </Layout>
    );
}

function GlobalCotacaoFormModal({ obras, fornecedores, onSave, onClose }: { obras: Obra[]; fornecedores: Fornecedor[]; onSave: (data: any) => void; onClose: () => void }) {
    const [form, setForm] = useState({ obraId: "", fornecedorId: "", descricao: "", valor: 0 });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.obraId) { toast.error("Selecione uma obra."); return; }
        if (!form.fornecedorId) { toast.error("Selecione um fornecedor."); return; }
        if (form.valor <= 0) { toast.error("Valor deve ser maior que zero."); return; }
        onSave(form);
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-lg p-6 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-foreground">Nova Cotação Global</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <XCircle className="h-5 w-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Obra</label>
                        <select
                            value={form.obraId}
                            onChange={(e) => setForm({ ...form, obraId: e.target.value })}
                            required
                            className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="">— Selecione a Obra —</option>
                            {obras.map(o => <option key={o.id} value={o.id}>{o.name || (o as any).nome}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Fornecedor</label>
                        <select
                            value={form.fornecedorId}
                            onChange={(e) => setForm({ ...form, fornecedorId: e.target.value })}
                            required
                            className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="">— Selecione o Fornecedor —</option>
                            {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Descrição / Material</label>
                        <input
                            value={form.descricao}
                            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                            required
                            placeholder="Ex: Cimento CP-II 50kg"
                            className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Valor Estimado (R$)</label>
                        <input
                            type="number"
                            min={0.01}
                            step={0.01}
                            value={form.valor}
                            onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })}
                            required
                            className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:opacity-80 transition-opacity">
                            Cancelar
                        </button>
                        <button type="submit" className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
                            Criar Cotação
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
