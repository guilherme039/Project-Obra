import { useState, useMemo, useRef } from "react";
import { Plus, Search, MapPin, Calendar, DollarSign, Users, Trash2, Edit2, X, ChevronRight, Building2, HardHat, TrendingUp, Upload, UserPlus, MoreVertical, Eye } from "lucide-react";
import { useAsyncData } from "@/hooks/useAsyncData";
import { obrasService, lancamentosService, usersService, canDelete } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Obra, User, UserObra } from "@/types/erp";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Layout from "@/components/Layout";

// --- Components ---

function UserFormModal({ obraId, onClose, onSave }: { obraId: string; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, role: "client", obraId });
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-foreground">Novo Usuário (Cliente)</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input autoFocus placeholder="Nome Completo" className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input type="email" placeholder="Email (Login)" className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <input type="password" placeholder="Senha de Acesso" className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          <button type="submit" className="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium mt-2 hover:opacity-90">Cadastrar Usuário</button>
        </form>
      </div>
    </div>
  );
}

function ObraFormModal({ obra, onClose, onSave }: { obra?: Obra; onClose: () => void; onSave: (data: Partial<Obra>) => void }) {
  const [form, setForm] = useState<Partial<Obra>>(
    obra || {
      name: "",
      client: "",
      address: "",
      cep: "",
      number: "",
      complement: "",
      startDate: "",
      endDate: "",
      materialsCost: 0,
      laborCost: 0,
      progress: 0,
      status: "Em andamento",
      description: "",
      imageUrl: "",
    }
  );
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalCost = (form.materialsCost || 0) + (form.laborCost || 0);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Imagem muito grande (max 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalCost < 0) setError("Orçamento total não pode ser negativo.");
    else onSave({ ...form, totalCost });
  };

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto p-0 flex flex-col md:flex-row overflow-hidden rounded-xl animate-in fade-in zoom-in-95">

        {/* Left Side (Image for Desktop) / Top for Mobile */}
        <div className="w-full md:w-1/3 bg-secondary/30 border-r border-border/50 p-6 flex flex-col items-center justify-center relative group">
          <div
            className="relative w-full aspect-video md:aspect-[3/4] bg-card/50 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {form.imageUrl ? (
              <>
                <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="h-8 w-8 text-white mb-2" />
                  <span className="text-white text-xs font-medium">Alterar Imagem</span>
                </div>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 mb-2 opacity-50" />
                <span className="text-xs font-medium">Carregar Imagem da Obra</span>
                <span className="text-[10px] opacity-70 mt-1">JPG, PNG (Max 5MB)</span>
              </>
            )}
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />

          {obra && (
            <div className="mt-auto pt-6 w-full">
              <button type="button" onClick={() => onSave({ _delete: true } as any)} className="w-full flex items-center justify-center gap-2 py-2.5 bg-destructive/10 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors">
                <Trash2 className="h-4 w-4" /> Excluir Obra
              </button>
            </div>
          )}
        </div>

        {/* Right Side (Form) */}
        <div className="w-full md:w-2/3 p-6 flex flex-col h-full overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">{obra ? "Editar Obra" : "Nova Obra"}</h2>
              <p className="text-sm text-muted-foreground">Preencha os detalhes do projeto.</p>
            </div>
            <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground hover:text-foreground" /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 flex-1">

            {/* Basic Info */}
            <div className="grid gap-4">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Nome do Projeto</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Residencial Alphaville" className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary/50 outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Cliente</label>
                  <input value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} placeholder="Nome do Cliente" className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary/50 outline-none" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Localização</label>
                  <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Cidade/Estado" className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary/50 outline-none" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Início</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary/50 outline-none" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Previsão</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary/50 outline-none" required />
                </div>
              </div>
            </div>

            {/* Orçamento */}
            <div className="p-4 bg-secondary/20 rounded-lg border border-border/50 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Orçamento da Obra</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Materiais e Serviços</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-muted-foreground">R$</span>
                    <input type="number" min={0} step={0.01} value={form.materialsCost} onChange={e => setForm({ ...form, materialsCost: Number(e.target.value) })} className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded text-sm focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Empreiteira</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-muted-foreground">R$</span>
                    <input type="number" min={0} step={0.01} value={form.laborCost} onChange={e => setForm({ ...form, laborCost: Number(e.target.value) })} className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded text-sm focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border/30">
                <span className="text-sm font-medium">Total Orçado:</span>
                <span className="text-base font-bold text-primary">{formatCurrency(totalCost)}</span>
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="font-medium text-foreground">Progresso (%)</span>
                <span>{form.progress}%</span>
              </div>
              <input type="range" min="0" max="100" value={form.progress} onChange={e => setForm({ ...form, progress: Number(e.target.value) })} className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary" />
            </div>

            {/* Descricao */}
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Descrição</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Detalhes adicionais..." className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary/50 outline-none resize-none" />
            </div>

            {error && <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{error}</p>}

            <div className="flex gap-3 pt-2 mt-auto">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 shadow-lg shadow-primary/20">{obra ? "Atualizar Obra" : "Criar Obra"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ObraDetailModal({ obra, onClose }: { obra: Obra; onClose: () => void }) {
  const { user } = useAuth();
  const companyId = user?.companyId || "";
  const [showUserForm, setShowUserForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch Lancamentos
  const { data: lancamentos = [] } = useAsyncData(() => lancamentosService.getAll(companyId).then(all => all.filter(l => l.obraId === obra.id)), [companyId, obra.id]);
  const receitas = lancamentos.filter((l) => l.tipo === "Receita").reduce((a, l) => a + l.valor, 0);
  const despesas = lancamentos.filter((l) => l.tipo === "Despesa").reduce((a, l) => a + l.valor, 0);

  // Fetch Users
  const { data: users = [], reload: reloadUsers } = useAsyncData(() => usersService.getByObra(obra.id, companyId), [companyId, obra.id, refreshKey]);

  const handleCreateUser = async (data: any) => {
    try {
      await usersService.create({ ...data, companyId });
      toast.success("Usuário criado com sucesso!");
      setShowUserForm(false);
      setRefreshKey(k => k + 1);
    } catch (e) {
      toast.error("Erro ao criar usuário.");
    }
  };

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-border shadow-2xl animate-in fade-in zoom-in-95 flex flex-col">

        {/* Header with Image Background */}
        <div className="h-48 relative bg-secondary">
          {obra.imageUrl ? (
            <>
              <img src={obra.imageUrl} className="w-full h-full object-cover opacity-60" alt={obra.name} />
              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent"></div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary"><Building2 className="h-16 w-16 text-primary/30" /></div>
          )}
          <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-colors"><X className="h-5 w-5" /></button>
          <div className="absolute bottom-6 left-6">
            <h2 className="text-3xl font-bold text-white drop-shadow-md">{obra.name}</h2>
            <p className="text-white/80 flex items-center gap-2 mt-1 drop-shadow-md"><MapPin className="h-4 w-4" /> {obra.address}</p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content (Left 2/3) */}
          <div className="lg:col-span-2 space-y-8">

            {/* Description */}
            {obra.description && (
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sobre o Projeto</h3>
                <p className="text-foreground leading-relaxed">{obra.description}</p>
              </div>
            )}

            {/* Financial Overview */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Financeiro</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-secondary/30 rounded-lg text-center border border-border/50">
                  <span className="text-[10px] uppercase text-muted-foreground font-bold">Orçamento</span>
                  <p className="text-lg font-bold text-foreground mt-1">{formatCurrency(obra.totalCost)}</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg text-center border border-border/50">
                  <span className="text-[10px] uppercase text-muted-foreground font-bold">Executado</span>
                  <p className="text-lg font-bold text-destructive mt-1">{formatCurrency(despesas)}</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg text-center border border-border/50">
                  <span className="text-[10px] uppercase text-muted-foreground font-bold">Saldo</span>
                  <p className={`text-lg font-bold mt-1 ${obra.totalCost - despesas >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(obra.totalCost - despesas)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso Financeiro</span>
                  <span className="text-foreground font-medium">{Math.min(100, Math.round((despesas / (obra.totalCost || 1)) * 100))}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, (despesas / (obra.totalCost || 1)) * 100)}%` }}></div>
                </div>
              </div>
            </div>

            {/* Users Section (New) */}
            <div className="glass-card p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Usuários da Obra ({users.length})</h3>
                <button onClick={() => setShowUserForm(true)} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1">
                  <UserPlus className="h-3 w-3" /> Adicionar Cliente
                </button>
              </div>

              <div className="space-y-3">
                {users.map((u: any) => (
                  <div key={u.id} className="p-3 rounded-lg border border-border/50 bg-secondary/10 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
                        {u.name.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border capitalize">{u.role}</span>
                      <p className="text-[10px] text-muted-foreground mt-1">Cadastrado em {new Date(u.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {users.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário vinculado.</p>}
              </div>
            </div>

          </div>

          {/* Sidebar (Right 1/3) */}
          <div className="space-y-6">
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Status</h3>

              <div className="space-y-4">
                <div>
                  <span className="text-xs text-muted-foreground">Status Atual</span>
                  <div className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${obra.status === "Em andamento" ? "bg-primary/10 text-primary border-primary/20" : "bg-secondary text-muted-foreground border-border"}`}>
                    {obra.status}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Progresso Físico</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-foreground">{obra.progress}%</span>
                    <TrendingUp className="h-4 w-4 text-success" />
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-success" style={{ width: `${obra.progress}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Prazos</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 bg-secondary rounded text-muted-foreground"><Calendar className="h-4 w-4" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Início</p>
                    <p className="font-medium text-foreground">{new Date(obra.startDate || "").toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 bg-secondary rounded text-muted-foreground"><Calendar className="h-4 w-4" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Previsão</p>
                    <p className="font-medium text-foreground">{new Date(obra.endDate || "").toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
      {showUserForm && <UserFormModal obraId={obra.id} onClose={() => setShowUserForm(false)} onSave={handleCreateUser} />}
    </div>
  );
}

export default function Obras() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editObra, setEditObra] = useState<Obra | undefined>();
  const [detailObra, setDetailObra] = useState<Obra | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: allObras = [] } = useAsyncData(() => obrasService.getAll(user?.companyId || ""), [user?.companyId, refreshKey]);

  const obras = useMemo(() => {
    if (!search) return allObras;
    const s = search.toLowerCase();
    return allObras.filter((o) => o.name.toLowerCase().includes(s));
  }, [allObras, search]);

  const handleSave = async (data: any) => {
    try {
      if (data._delete && editObra) {
        if (!canDelete(user?.role || "")) return toast.error("Sem permissão.");
        await obrasService.deleteWithValidation(editObra.id, user!.companyId);
        toast.success("Obra excluída.");
      } else if (editObra) {
        await obrasService.update(editObra.id, user!.companyId, data);
        toast.success("Obra atualizada.");
      } else {
        await obrasService.create({ ...data, companyId: user!.companyId } as any);
        toast.success("Obra criada.");
      }
      setShowForm(false);
      setEditObra(undefined);
      setRefreshKey(k => k + 1);
    } catch (e: any) {
      const msg = e.response?.data?.error || e.message || "Erro ao salvar.";
      console.error(e);
      toast.error(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete(user?.role || "")) return toast.error("Sem permissão.");
    if (confirm("Excluir obra?")) {
      await obrasService.deleteWithValidation(id, user!.companyId);
      toast.success("Obra excluída.");
      setRefreshKey(k => k + 1);
    }
  };

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Layout>
      <div className="min-h-screen bg-background text-white font-sans -m-6">

        {/* Hero Section */}
        <div className="relative w-full h-[400px] overflow-hidden bg-gradient-to-r from-[#000d33] to-[#000510] flex items-center">
          {/* Background Image/Gradient Overlay */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>

          <div className="container mx-auto px-6 relative z-10 flex flex-col justify-center h-full">
            <h1 className="text-5xl md:text-6xl font-bold max-w-2xl leading-tight mb-4 tracking-tight">
              Tenha controle total sobre as obras da sua construtora.
            </h1>
            <button className="w-fit mt-4 px-8 py-3 bg-transparent border border-white/30 text-white rounded hover:bg-white/10 transition-colors uppercase text-sm tracking-widest font-medium">
              Começar Agora
            </button>
          </div>
        </div>

        <div className="container mx-auto px-6 -mt-8 relative z-20 pb-20">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar obras ou clientes..."
                className="w-full pl-10 pr-4 py-3 bg-card border border-white/10 rounded-lg text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <button onClick={() => { setEditObra(undefined); setShowForm(true); }} className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Nova Obra
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
            {obras.map(obra => (
              <div key={obra.id} className="bg-card border border-white/10 rounded-xl overflow-hidden hover:border-primary/50 transition-all group">
                {/* Card Header Image */}
                <div className="h-48 w-full relative bg-secondary/50 overflow-hidden">
                  {obra.imageUrl ? (
                    <img src={obra.imageUrl} alt={obra.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary">
                      <Building2 className="h-12 w-12 text-white/10" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${obra.status === "Em andamento" ? "bg-primary text-white" :
                      obra.status === "Concluida" ? "bg-success text-white" :
                        "bg-secondary text-white"
                      }`}>
                      {obra.status}
                    </span>
                  </div>
                  {/* Client Logo Overlay (Mockup for now, using text if no logo) */}
                  <div className="absolute bottom-4 left-4">
                    {/* If we had client logo it would go here. For now text shadow? */}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{obra.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {obra.address}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Início: {new Date(obra.startDate || "").toLocaleDateString()}
                    </p>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="text-white font-bold">{obra.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${obra.progress}%` }} />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between py-3 border-y border-white/5">
                    <div>
                      <span className="text-xs text-muted-foreground block">Orçamento Total</span>
                      <span className="text-sm font-semibold text-white">{formatCurrency(obra.totalCost)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block">Cliente</span>
                      <span className="text-sm font-semibold text-white max-w-[150px] truncate block">{obra.client}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setEditObra(obra); setShowForm(true); }} className="flex-1 py-2 border border-white/10 rounded-lg text-sm font-medium text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                      <Edit2 className="h-4 w-4" /> Editar
                    </button>
                    <button onClick={() => { setDetailObra(obra); }} className="flex-1 py-2 border border-white/10 rounded-lg text-sm font-medium text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                      <Users className="h-4 w-4" /> Usuários
                    </button>
                    <button onClick={() => handleDelete(obra.id)} className="p-2 border border-white/10 rounded-lg text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {obras.length === 0 && (
              <div className="col-span-full text-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-xl bg-card/50">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Nenhuma obra encontrada.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {showForm && <ObraFormModal obra={editObra} onClose={() => setShowForm(false)} onSave={handleSave} />}
      {detailObra && <ObraDetailModal obra={detailObra} onClose={() => setDetailObra(undefined)} />}
    </Layout>
  );
}
