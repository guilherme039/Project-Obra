import { useState, useMemo } from "react";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAuth } from "@/contexts/AuthContext";
import { clientesService, obrasService, canDelete } from "@/services/api";
import { Cliente } from "@/types/erp";
import { addLog } from "@/services/activityLog";
import { validateCPFOrCNPJ } from "@/services/validators";
import Layout from "@/components/Layout";
import { Plus, X, Search, Users, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

function ClienteFormModal({ cliente, onSave, onClose }: { cliente?: Cliente; onSave: (data: Partial<Cliente>) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    nome: cliente?.nome || "",
    cpfCnpj: cliente?.cpfCnpj || "",
    telefone: cliente?.telefone || "",
    email: cliente?.email || "",
  });
  const [formError, setFormError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const validation = validateCPFOrCNPJ(form.cpfCnpj);
    if (!validation.valid) {
      setFormError(validation.message);
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">{cliente ? "Editar Cliente" : "Novo Cliente"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Nome</label>
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">CPF/CNPJ</label>
            <input value={form.cpfCnpj} onChange={(e) => setForm({ ...form, cpfCnpj: e.target.value })} required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
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
            <button type="submit" className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">{cliente ? "Atualizar" : "Cadastrar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Clientes() {
  const { user } = useAuth();
  const companyId = user?.companyId || "";
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editCliente, setEditCliente] = useState<Cliente | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: allClientes = [] } = useAsyncData(() => clientesService.getAll(companyId), [companyId, refreshKey]);

  const clientes = useMemo(() => {
    if (!search) return allClientes;
    const s = search.toLowerCase();
    return allClientes.filter((c) => c.nome.toLowerCase().includes(s) || c.cpfCnpj.includes(s));
  }, [allClientes, search]);

  const { data: obras = [] } = useAsyncData(() => obrasService.getAll(companyId), [companyId, refreshKey]);

  const getObrasCount = (clienteNome: string) => obras.filter((o) => (o.client ?? "") === clienteNome).length;

  const handleSave = async (data: any) => {
    try {
      if (editCliente) {
        await clientesService.update(editCliente.id, companyId, data);
        addLog({ userId: user!.id, userName: user!.name, companyId, action: "update", entity: "Cliente", entityId: editCliente.id, entityName: data.nome || editCliente.nome });
        toast.success("Cliente atualizado com sucesso.");
      } else {
        const created = await clientesService.create({ ...data, companyId } as any);
        addLog({ userId: user!.id, userName: user!.name, companyId, action: "create", entity: "Cliente", entityId: created.id, entityName: data.nome });
        toast.success("Cliente cadastrado com sucesso.");
      }
      setShowForm(false);
      setEditCliente(undefined);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error("Erro ao salvar cliente.");
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    try {
      if (!canDelete(user?.role || "")) {
        toast.error("Sem permissão. Apenas administradores podem excluir registros.");
        return;
      }
      const obrasVinculadas = obras.filter((o) => (o.client ?? "") === nome);
      if (obrasVinculadas.length > 0) {
        toast.error(`Não é possível excluir. Este cliente possui ${obrasVinculadas.length} obra(s) vinculada(s).`);
        return;
      }
      await clientesService.delete(id, companyId);
      addLog({ userId: user!.id, userName: user!.name, companyId, action: "delete", entity: "Cliente", entityId: id, entityName: nome });
      toast.success("Cliente excluído com sucesso.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error("Erro ao excluir cliente.");
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">Gerencie os clientes da construtora</p>
        </div>
        <button onClick={() => { setEditCliente(undefined); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Novo Cliente
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar clientes..." className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      {clientes.length > 0 ? (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Nome</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">CPF/CNPJ</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Telefone</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Email</th>
                <th className="text-center px-4 py-3 text-xs text-muted-foreground font-medium">Obras</th>
                <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-foreground font-medium">{c.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.cpfCnpj}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.telefone}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3 text-center"><span className="inline-flex px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-medium">{getObrasCount(c.nome)}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setEditCliente(c); setShowForm(true); }} className="text-primary hover:underline text-xs mr-2"><Pencil className="h-3 w-3 inline mr-0.5" />Editar</button>
                    <button onClick={() => handleDelete(c.id, c.nome)} className="text-destructive hover:underline text-xs"><Trash2 className="h-3 w-3 inline mr-0.5" />Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado</p>
          <button onClick={() => setShowForm(true)} className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">Cadastrar Primeiro Cliente</button>
        </div>
      )}

      {showForm && <ClienteFormModal cliente={editCliente} onSave={handleSave} onClose={() => { setShowForm(false); setEditCliente(undefined); }} />}
    </Layout>
  );
}
