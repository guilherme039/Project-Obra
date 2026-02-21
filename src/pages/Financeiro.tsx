import { useState, useMemo, useEffect } from "react";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAuth } from "@/contexts/AuthContext";
import { lancamentosService, obrasService, fornecedoresService, autoUpdateOverdueStatus, canDelete } from "@/services/api";
import { Lancamento } from "@/types/erp";
import { addLog } from "@/services/activityLog";
import { validatePositiveValue } from "@/services/validators";
import Layout from "@/components/Layout";
import { Plus, X, Search, DollarSign, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

function LancamentoFormModal({
  lancamento,
  companyId,
  obras,
  fornecedores,
  onSave,
  onClose,
}: {
  lancamento?: Lancamento;
  companyId: string;
  obras: any[];
  fornecedores: any[];
  onSave: (data: any) => void;
  onClose: () => void;
}) {

  const [form, setForm] = useState({
    tipo: lancamento?.tipo || ("Despesa" as Lancamento["tipo"]),
    obraId: lancamento?.obraId || "",
    fornecedorId: lancamento?.fornecedorId || "",
    descricao: lancamento?.descricao || "",
    valor: lancamento?.valor || 0,
    dataVencimento: lancamento?.dataVencimento || "",
    status: lancamento?.status || ("Pendente" as Lancamento["status"]),
    categoria: lancamento?.categoria || "",
    parcelado: false,
    numParcelas: 2,
  });
  const [formError, setFormError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!validatePositiveValue(form.valor)) {
      setFormError("Valor deve ser maior que zero.");
      return;
    }
    const obraNome = obras.find((o) => o.id === form.obraId)?.name || "";
    const fornecedorNome = fornecedores.find((f) => f.id === form.fornecedorId)?.nome || "";

    if (form.parcelado && !lancamento && form.numParcelas > 1) {
      const valorParcela = Math.round((form.valor / form.numParcelas) * 100) / 100;
      for (let i = 0; i < form.numParcelas; i++) {
        const vencDate = new Date(form.dataVencimento);
        vencDate.setMonth(vencDate.getMonth() + i);
        onSave({
          tipo: form.tipo,
          obraId: form.obraId,
          obraNome,
          fornecedorId: form.fornecedorId,
          fornecedorNome,
          descricao: `${form.descricao} (${i + 1}/${form.numParcelas})`,
          valor: valorParcela,
          dataVencimento: vencDate.toISOString().split("T")[0],
          status: form.status,
          categoria: form.categoria,
          parcela: i + 1,
          totalParcelas: form.numParcelas,
          companyId,
          _batch: i < form.numParcelas - 1,
        });
      }
    } else {
      onSave({
        tipo: form.tipo,
        obraId: form.obraId,
        obraNome,
        fornecedorId: form.fornecedorId,
        fornecedorNome,
        descricao: form.descricao,
        valor: form.valor,
        dataVencimento: form.dataVencimento,
        status: form.status,
        categoria: form.categoria,
        companyId,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">{lancamento ? "Editar Lancamento" : "Novo Lancamento"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as any })} className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option>Receita</option>
                <option>Despesa</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Obra</label>
              <select value={form.obraId} onChange={(e) => setForm({ ...form, obraId: e.target.value })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">Selecione</option>
                {obras.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          </div>
          {form.tipo === "Despesa" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Fornecedor</label>
                <select value={form.fornecedorId} onChange={(e) => setForm({ ...form, fornecedorId: e.target.value })} className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Selecione</option>
                  {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Categoria</label>
                <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Selecione</option>
                  <option>Material</option>
                  <option>Mao de Obra</option>
                  <option>Equipamento</option>
                  <option>Transporte</option>
                  <option>Outros</option>
                </select>
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Descricao</label>
            <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Valor (R$)</label>
              <input type="number" min={0.01} step={0.01} value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Vencimento</label>
              <input type="date" value={form.dataVencimento} onChange={(e) => setForm({ ...form, dataVencimento: e.target.value })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option>Pendente</option>
              <option>Pago</option>
              <option>Atrasado</option>
            </select>
          </div>
          {!lancamento && (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={form.parcelado} onChange={(e) => setForm({ ...form, parcelado: e.target.checked })} className="accent-primary" />
                Parcelado
              </label>
              {form.parcelado && (
                <input type="number" min={2} max={48} value={form.numParcelas} onChange={(e) => setForm({ ...form, numParcelas: Number(e.target.value) })} className="w-20 px-3 py-1 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              )}
            </div>
          )}
          {formError && <p className="text-xs text-destructive">{formError}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:opacity-80 transition-opacity">Cancelar</button>
            <button type="submit" className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">{lancamento ? "Atualizar" : "Cadastrar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Financeiro() {
  const { user } = useAuth();
  const companyId = user?.companyId || "";
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("Todos");
  const [filterObra, setFilterObra] = useState<string>("Todas");
  const [filterStatus, setFilterStatus] = useState<string>("Todos");
  const [showForm, setShowForm] = useState(false);
  const [editLanc, setEditLanc] = useState<Lancamento | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-update overdue status
  useEffect(() => {
    if (companyId) autoUpdateOverdueStatus(companyId);
  }, [companyId]);

  const { data: obras = [] } = useAsyncData(() => obrasService.getAll(companyId), [companyId, refreshKey]);
  const { data: fornecedores = [] } = useAsyncData(() => fornecedoresService.getAll(companyId), [companyId, refreshKey]);
  const { data: allLancamentos = [] } = useAsyncData(() => lancamentosService.getAll(companyId), [companyId, refreshKey]);

  const lancamentos = useMemo(() => {
    let filtered = allLancamentos;
    if (filterTipo !== "Todos") filtered = filtered.filter((l) => l.tipo === filterTipo);
    if (filterObra !== "Todas") filtered = filtered.filter((l) => l.obraId === filterObra);
    if (filterStatus !== "Todos") filtered = filtered.filter((l) => l.status === filterStatus);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((l) => l.descricao.toLowerCase().includes(s) || (l.fornecedorNome || "").toLowerCase().includes(s));
    }
    return filtered;
  }, [allLancamentos, filterTipo, filterObra, filterStatus, search]);

  const totalPago = allLancamentos.filter((l) => l.status === "Pago").reduce((a, l) => a + l.valor, 0);
  const totalPendente = allLancamentos.filter((l) => l.status === "Pendente").reduce((a, l) => a + l.valor, 0);
  const totalAtrasado = allLancamentos.filter((l) => l.status === "Atrasado").reduce((a, l) => a + l.valor, 0);

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleSave = async (data: any) => {
    try {
      const { _batch, ...lancData } = data;
      if (editLanc) {
        await lancamentosService.update(editLanc.id, companyId, lancData);
        addLog({ userId: user!.id, userName: user!.name, companyId, action: "update", entity: "Lançamento", entityId: editLanc.id, entityName: lancData.descricao || editLanc.descricao });
        if (!_batch) toast.success("Lançamento atualizado com sucesso.");
      } else {
        const created = await lancamentosService.create(lancData as any);
        addLog({ userId: user!.id, userName: user!.name, companyId, action: "create", entity: "Lançamento", entityId: created.id, entityName: lancData.descricao });
        if (!_batch) toast.success("Lançamento cadastrado com sucesso.");
      }
      if (!_batch) {
        setShowForm(false);
        setEditLanc(undefined);
      }
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error("Erro ao salvar lançamento.");
    }
  };

  const handleStatusChange = async (lanc: Lancamento, newStatus: Lancamento["status"]) => {
    try {
      const updates: Partial<Lancamento> = { status: newStatus };
      if (newStatus === "Pago") updates.dataPagamento = new Date().toISOString().split("T")[0];
      await lancamentosService.update(lanc.id, companyId, updates);
      addLog({ userId: user!.id, userName: user!.name, companyId, action: "update", entity: "Lançamento", entityId: lanc.id, entityName: `${lanc.descricao} → ${newStatus}` });
      toast.success(`Status alterado para "${newStatus}".`);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error("Erro ao alterar status.");
    }
  };

  const handleDelete = async (id: string, descricao: string) => {
    try {
      if (!canDelete(user?.role || "")) {
        toast.error("Sem permissão. Apenas administradores podem excluir registros.");
        return;
      }
      await lancamentosService.delete(id, companyId);
      addLog({ userId: user!.id, userName: user!.name, companyId, action: "delete", entity: "Lançamento", entityId: id, entityName: descricao });
      toast.success("Lançamento excluído com sucesso.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error("Erro ao excluir lançamento.");
    }
  };

  const stats = [
    { label: "Total Pago", value: formatCurrency(totalPago), icon: CheckCircle, color: "text-success" },
    { label: "Pendente", value: formatCurrency(totalPendente), icon: Clock, color: "text-warning" },
    { label: "Atrasado", value: formatCurrency(totalAtrasado), icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Controle Financeiro</h1>
          <p className="text-sm text-muted-foreground">Controle de receitas e despesas</p>
        </div>
        <button onClick={() => { setEditLanc(undefined); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Novo Lancamento
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar lancamentos..." className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className="px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option>Todos</option>
          <option>Receita</option>
          <option>Despesa</option>
        </select>
        <select value={filterObra} onChange={(e) => setFilterObra(e.target.value)} className="px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="Todas">Todas as obras</option>
          {obras.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option>Todos</option>
          <option>Pendente</option>
          <option>Pago</option>
          <option>Atrasado</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Lista de Lancamentos</h3>
          <p className="text-xs text-muted-foreground">{lancamentos.length} encontrados</p>
        </div>
        {lancamentos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Descricao</th>
                  <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Tipo</th>
                  <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Obra</th>
                  <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Fornecedor</th>
                  <th className="text-right px-4 py-2 text-xs text-muted-foreground font-medium">Valor</th>
                  <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Status</th>
                  <th className="text-right px-4 py-2 text-xs text-muted-foreground font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {lancamentos.map((l) => (
                  <tr key={l.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-2 text-foreground">{l.descricao}</td>
                    <td className="px-4 py-2"><span className={l.tipo === "Receita" ? "text-success" : "text-destructive"}>{l.tipo}</span></td>
                    <td className="px-4 py-2 text-muted-foreground">{l.obraNome || "-"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{l.fornecedorNome || "-"}</td>
                    <td className="px-4 py-2 text-right text-foreground">{formatCurrency(l.valor)}</td>
                    <td className="px-4 py-2">
                      <select value={l.status} onChange={(e) => handleStatusChange(l, e.target.value as any)} className={`px-2 py-0.5 rounded text-xs font-medium border-0 cursor-pointer ${l.status === "Pago" ? "bg-success/20 text-success" : l.status === "Atrasado" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"}`}>
                        <option>Pendente</option>
                        <option>Pago</option>
                        <option>Atrasado</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => { setEditLanc(l); setShowForm(true); }} className="text-primary hover:underline text-xs mr-2">Editar</button>
                      <button onClick={() => handleDelete(l.id, l.descricao)} className="text-destructive hover:underline text-xs">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <DollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum lancamento encontrado</p>
          </div>
        )}
      </div>

      {showForm && <LancamentoFormModal lancamento={editLanc} companyId={companyId} obras={obras} fornecedores={fornecedores} onSave={handleSave} onClose={() => { setShowForm(false); setEditLanc(undefined); }} />}
    </Layout>
  );
}
