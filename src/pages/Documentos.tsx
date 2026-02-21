import { useState, useEffect, useMemo } from "react";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAuth } from "@/contexts/AuthContext";
import { notasFiscaisService, obrasService, fornecedoresService, lancamentosService } from "@/services/api";
import { NotaFiscal, Obra, Fornecedor, Lancamento } from "@/types/erp";
import Layout from "@/components/Layout";
import {
    Receipt, Plus, Search, Calendar, Building2, Filter, XCircle, CheckCircle
} from "lucide-react";
import { toast } from "sonner";

export default function Documentos() {
    const { user } = useAuth();
    const companyId = user?.companyId || "";
    const [refreshKey, setRefreshKey] = useState(0);
    const [filterObra, setFilterObra] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [showForm, setShowForm] = useState(false);

    // Fetch Data
    const { data: notas = [] } = useAsyncData(() => notasFiscaisService.getByObra("", companyId), [companyId, refreshKey]);
    const { data: obras = [] } = useAsyncData(() => obrasService.getAll(companyId), [companyId]);
    const { data: fornecedores = [] } = useAsyncData(() => fornecedoresService.getAll(companyId), [companyId]);

    const refresh = () => setRefreshKey(k => k + 1);

    const filteredNotas = useMemo(() => {
        return notas.filter(n => {
            const matchesObra = filterObra === "all" || n.obraId === filterObra;
            const matchesSearch = n.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                n.fornecedorNome?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesObra && matchesSearch;
        });
    }, [notas, filterObra, searchTerm]);

    const handleSave = async (data: any) => {
        try {
            const f = fornecedores.find(x => x.id === data.fornecedorId);
            await notasFiscaisService.createWithValidation({
                ...data,
                companyId,
                fornecedorNome: f?.nome || "",
                arquivoURL: ""
            });
            toast.success("Nota Fiscal registrada com sucesso.");
            setShowForm(false);
            refresh();
        } catch (error) {
            toast.error("Erro ao registrar Nota Fiscal.");
        }
    };

    const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    return (
        <Layout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Receipt className="h-6 w-6 text-primary" /> Central de Notas Fiscais
                    </h1>
                    <p className="text-muted-foreground">Gerencie todos os documentos fiscais emitidos para suas obras.</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/20"
                >
                    <Plus className="h-4 w-4" /> Registrar Nota
                </button>
            </div>

            {/* Filters */}
            <div className="glass-card p-4 mb-6 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        placeholder="Buscar por número ou fornecedor..."
                        className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-auto">
                    <select
                        className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        value={filterObra}
                        onChange={(e) => setFilterObra(e.target.value)}
                    >
                        <option value="all">Todas as Obras</option>
                        {obras.map(o => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-secondary/30">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Número</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Emissão</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fornecedor</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Obra</th>
                                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
                                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Vínculo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredNotas.length > 0 ? (
                                filteredNotas.map((n) => (
                                    <tr key={n.id} className="hover:bg-secondary/20 transition-colors">
                                        <td className="px-4 py-3 font-medium text-foreground">{n.numero}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {new Date(n.dataEmissao).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-foreground">{n.fornecedorNome || n.fornecedorId}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 className="h-3.5 w-3.5" />
                                                {n.obra?.name || "—"}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(n.valor)}</td>
                                        <td className="px-4 py-3 text-center">
                                            {n.lancamentoId ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                                                    <CheckCircle className="h-3 w-3" /> Financeiro OK
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                        <Receipt className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                        <p>Nenhuma nota fiscal encontrada</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showForm && (
                <GlobalNFFormModal
                    obras={obras}
                    fornecedores={fornecedores}
                    companyId={companyId}
                    onSave={handleSave}
                    onClose={() => setShowForm(false)}
                />
            )}
        </Layout>
    );
}

function GlobalNFFormModal({ obras, fornecedores, companyId, onSave, onClose }: { obras: Obra[]; fornecedores: Fornecedor[]; companyId: string; onSave: (data: any) => void; onClose: () => void }) {
    const [form, setForm] = useState({ obraId: "", fornecedorId: "", numero: "", valor: 0, dataEmissao: "", lancamentoId: "" });
    const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
    const [loadingLancamentos, setLoadingLancamentos] = useState(false);

    // Fetch Lancamentos when Obra changes
    useEffect(() => {
        if (form.obraId) {
            setLoadingLancamentos(true);
            lancamentosService.getAll(companyId).then(all => {
                const filtered = all.filter(l => l.obraId === form.obraId);
                setLancamentos(filtered);
                setLoadingLancamentos(false);
            });
        } else {
            setLancamentos([]);
        }
    }, [form.obraId, companyId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.obraId) { toast.error("Selecione uma obra."); return; }
        if (!form.lancamentoId) { toast.error("Vincule a um lançamento financeiro."); return; }
        if (form.valor <= 0) { toast.error("Valor inválido."); return; }
        onSave(form);
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-lg p-6 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-foreground">Registrar Nota Fiscal</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <XCircle className="h-5 w-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Número NF</label>
                            <input
                                value={form.numero}
                                onChange={(e) => setForm({ ...form, numero: e.target.value })}
                                required
                                placeholder="000.000"
                                className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Emissão</label>
                            <input
                                type="date"
                                value={form.dataEmissao}
                                onChange={(e) => setForm({ ...form, dataEmissao: e.target.value })}
                                required
                                className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Obra</label>
                        <select
                            value={form.obraId}
                            onChange={(e) => setForm({ ...form, obraId: e.target.value, lancamentoId: "" })}
                            required
                            className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="">— Selecione a Obra —</option>
                            {obras.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
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
                        <label className="block text-xs font-medium text-foreground mb-1">Valor Total (R$)</label>
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

                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1">
                            Vincular a Lançamento Financeiro <span className="text-destructive">*</span>
                        </label>
                        <select
                            value={form.lancamentoId}
                            onChange={(e) => setForm({ ...form, lancamentoId: e.target.value })}
                            required
                            disabled={!form.obraId || loadingLancamentos}
                            className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                        >
                            <option value="">
                                {loadingLancamentos ? "Carregando..." : !form.obraId ? "Selecione a obra primeiro" : "— Selecione o Lançamento —"}
                            </option>
                            {lancamentos.map(l => (
                                <option key={l.id} value={l.id}>
                                    {l.descricao} — R$ {l.valor.toFixed(2)} ({l.status})
                                </option>
                            ))}
                        </select>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            A Nota Fiscal deve corresponder a uma despesa lançada no sistema.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:opacity-80 transition-opacity">
                            Cancelar
                        </button>
                        <button type="submit" className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
                            Registrar Nota
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
