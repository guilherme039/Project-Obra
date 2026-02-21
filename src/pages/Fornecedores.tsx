import { useState, useMemo } from "react";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAuth } from "@/contexts/AuthContext";
import { fornecedoresService, lancamentosService, canDelete } from "@/services/api";
import { Fornecedor } from "@/types/erp";
import { addLog } from "@/services/activityLog";
import { validateCNPJ } from "@/services/validators";
import Layout from "@/components/Layout";
import { Plus, X, Search, Truck, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

function FornecedorFormModal({ fornecedor, onSave, onClose }: { fornecedor?: Fornecedor; onSave: (data: Partial<Fornecedor>) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    nome: fornecedor?.nome || "",
    cnpj: fornecedor?.cnpj || "",
    telefone: fornecedor?.telefone || "",
    email: fornecedor?.email || "",
  });
  const [formError, setFormError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const cleanedCnpj = form.cnpj.replace(/\D/g, "");
    if (cleanedCnpj.length > 0 && !validateCNPJ(form.cnpj)) {
      setFormError("CNPJ inválido. Verifique os dígitos.");
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">{fornecedor ? "Editar Fornecedor" : "Novo Fornecedor"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Nome</label>
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">CNPJ</label>
            <input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Telefone</label>
            <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          {formError && <p className="text-xs text-destructive">{formError}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:opacity-80 transition-opacity">Cancelar</button>
            <button type="submit" className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">{fornecedor ? "Atualizar" : "Cadastrar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Fornecedores() {
  const { user } = useAuth();
  const companyId = user?.companyId || "";
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editFornecedor, setEditFornecedor] = useState<Fornecedor | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: allFornecedores = [], reload: reloadFornecedores } = useAsyncData(() => fornecedoresService.getAll(companyId), [companyId, refreshKey]);

  const fornecedores = useMemo(() => {
    if (!search) return allFornecedores;
    const s = search.toLowerCase();
    return allFornecedores.filter((f) => f.nome.toLowerCase().includes(s) || f.cnpj.includes(s));
  }, [allFornecedores, search]);

  const { data: lancamentos = [] } = useAsyncData(() => lancamentosService.getAll(companyId), [companyId, refreshKey]);

  const getDespesasCount = (fornecedorId: string) => lancamentos.filter((l) => l.fornecedorId === fornecedorId).length;

  const handleSave = async (data: any) => {
    try {
      if (editFornecedor) {
        await fornecedoresService.update(editFornecedor.id, companyId, data);
        addLog({ userId: user!.id, userName: user!.name, companyId, action: "update", entity: "Fornecedor", entityId: editFornecedor.id, entityName: data.nome || editFornecedor.nome });
        toast.success("Fornecedor atualizado com sucesso.");
      } else {
        const created = await fornecedoresService.create({ ...data, companyId } as any);
        addLog({ userId: user!.id, userName: user!.name, companyId, action: "create", entity: "Fornecedor", entityId: created.id, entityName: data.nome });
        toast.success("Fornecedor cadastrado com sucesso.");
      }
      setShowForm(false);
      setEditFornecedor(undefined);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error("Erro ao salvar fornecedor.");
    }
  };

  const handleDelete = (id: string, nome: string) => {
    try {
      if (!canDelete(user?.role || "")) {
        toast.error("Sem permissão. Apenas administradores podem excluir registros.");
        return;
      }
      fornecedoresService.deleteWithValidation(id, companyId);
      addLog({ userId: user!.id, userName: user!.name, companyId, action: "delete", entity: "Fornecedor", entityId: id, entityName: nome });
      toast.success("Fornecedor excluído com sucesso.");
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir fornecedor.");
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Fornecedores</h1>
          <p className="text-sm text-muted-foreground">Gerencie os fornecedores da construtora</p>
        </div>
        <button onClick={() => { setEditFornecedor(undefined); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Novo Fornecedor
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar fornecedores..." className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      {fornecedores.length > 0 ? (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Nome</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">CNPJ</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Telefone</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Email</th>
                <th className="text-center px-4 py-3 text-xs text-muted-foreground font-medium">Despesas</th>
                <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {fornecedores.map((f) => (
                <tr key={f.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-foreground font-medium">{f.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.cnpj}</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.telefone}</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.email}</td>
                  <td className="px-4 py-3 text-center"><span className="inline-flex px-2 py-0.5 rounded bg-warning/20 text-warning text-xs font-medium">{getDespesasCount(f.id)}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setEditFornecedor(f); setShowForm(true); }} className="text-primary hover:underline text-xs mr-2"><Pencil className="h-3 w-3 inline mr-0.5" />Editar</button>
                    <button onClick={() => handleDelete(f.id, f.nome)} className="text-destructive hover:underline text-xs"><Trash2 className="h-3 w-3 inline mr-0.5" />Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <Truck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum fornecedor cadastrado</p>
          <button onClick={() => setShowForm(true)} className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">Cadastrar Primeiro Fornecedor</button>
        </div>
      )}

      {showForm && <FornecedorFormModal fornecedor={editFornecedor} onSave={handleSave} onClose={() => { setShowForm(false); setEditFornecedor(undefined); }} />}
    </Layout>
  );
}
