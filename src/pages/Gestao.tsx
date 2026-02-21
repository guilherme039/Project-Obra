import { useState, useMemo } from "react";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAuth } from "@/contexts/AuthContext";
import { usersService, obrasService, financeiroExecutivoService } from "@/services/api";
import { User, Obra } from "@/types/erp";
import Layout from "@/components/Layout";
import {
    Settings, Users, Briefcase, DollarSign, Plus, Mail, Shield, Trash2, Building2
} from "lucide-react";
import { toast } from "sonner";
import {
    Avatar, AvatarFallback, AvatarImage
} from "@/components/ui/avatar";

export default function Gestao() {
    const { user } = useAuth();
    const companyId = user?.companyId || "";
    const [activeTab, setActiveTab] = useState<"users" | "settings" | "financial">("users");

    return (
        <Layout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Settings className="h-6 w-6 text-primary" /> Gestão Corporativa
                    </h1>
                    <p className="text-muted-foreground">Administre usuários, configurações e visualize o financeiro global.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-border mb-6">
                <TabButton active={activeTab === "users"} onClick={() => setActiveTab("users")} icon={Users} label="Usuários e Acesso" />
                <TabButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon={Building2} label="Dados da Empresa" />
                <TabButton active={activeTab === "financial"} onClick={() => setActiveTab("financial")} icon={DollarSign} label="Financeiro Global" />
            </div>

            {/* Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === "users" && <UsersTab companyId={companyId} />}
                {activeTab === "settings" && <SettingsTab companyId={companyId} />}
                {activeTab === "financial" && <FinancialTab companyId={companyId} />}
            </div>
        </Layout>
    );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
        >
            <Icon className="h-4 w-4" /> {label}
        </button>
    );
}

// --- Sub-components ---

function UsersTab({ companyId }: { companyId: string }) {
    const [refreshKey, setRefreshKey] = useState(0);
    const { data: users = [] } = useAsyncData(() => usersService.getAll(companyId), [companyId, refreshKey]);
    const [showInvite, setShowInvite] = useState(false);

    const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const data = Object.fromEntries(fd);
        try {
            await usersService.create({ ...data, companyId, password: "123", role: "user" }); // Default password for MVP
            toast.success("Usuário convidado com sucesso!");
            setShowInvite(false);
            setRefreshKey(k => k + 1);
        } catch {
            toast.error("Erro ao convidar usuário.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-foreground">Equipe Registrada</h3>
                <button
                    onClick={() => setShowInvite(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                >
                    <Plus className="h-4 w-4" /> Convidar Membro
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((u) => (
                    <div key={u.id} className="glass-card p-4 flex items-center gap-4">
                        <Avatar className="h-12 w-12 border border-primary/20">
                            <AvatarImage src={`https://ui-avatars.com/api/?name=${u.name}&background=random`} />
                            <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-foreground truncate">{u.name}</h4>
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {u.email}
                            </p>
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded mt-1 uppercase">
                                <Shield className="h-3 w-3" /> {u.role}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {showInvite && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass-card w-full max-w-sm p-6">
                        <h3 className="font-bold text-foreground mb-4">Convidar Novo Usuário</h3>
                        <form onSubmit={handleInvite} className="space-y-3">
                            <input name="name" placeholder="Nome Completo" required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm" />
                            <input name="email" type="email" placeholder="Email Corporativo" required className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm" />
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowInvite(false)} className="flex-1 py-2 bg-secondary text-secondary-foreground rounded-md text-sm">Cancelar</button>
                                <button type="submit" className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm">Enviar Convite</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function SettingsTab({ companyId }: { companyId: string }) {
    return (
        <div className="glass-card p-6 max-w-2xl">
            <h3 className="font-bold text-foreground mb-6">Configurações da Empresa</h3>
            <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Nome Fantasia</label>
                        <input defaultValue="Minha Construtora" className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">CNPJ</label>
                        <input defaultValue="00.000.000/0001-00" className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Endereço Comercial</label>
                    <input defaultValue="Av. Paulista, 1000 - São Paulo, SP" className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground" />
                </div>
                <div className="pt-4 flex justify-end">
                    <button type="button" className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90">
                        Salvar Alterações
                    </button>
                </div>
            </form>
        </div>
    );
}

function FinancialTab({ companyId }: { companyId: string }) {
    const { data: obras = [] } = useAsyncData(() => obrasService.getAll(companyId), [companyId]);

    const globalStats = useMemo(() => {
        return obras.reduce((acc, obra) => {
            return {
                totalOrcado: acc.totalOrcado + (obra.totalCost || 0),
                totalExecutado: acc.totalExecutado + ((obra.totalCost || 0) * (obra.progress / 100)),
                obrasAtivas: acc.obrasAtivas + (obra.status === "Em andamento" ? 1 : 0)
            };
        }, { totalOrcado: 0, totalExecutado: 0, obrasAtivas: 0 });
    }, [obras]);

    const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 border-l-4 border-l-primary">
                    <p className="text-sm text-muted-foreground">Volume Total de Obras</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(globalStats.totalOrcado)}</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-l-success">
                    <p className="text-sm text-muted-foreground">Valor Executado (Estimado)</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(globalStats.totalExecutado)}</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-l-blue-500">
                    <p className="text-sm text-muted-foreground">Obras em Andamento</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{globalStats.obrasAtivas} obras</p>
                </div>
            </div>

            <div className="glass-card p-6">
                <h3 className="font-bold text-foreground mb-4">Desempenho por Obra</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-muted-foreground text-left">
                                <th className="pb-3 pl-2">Obra</th>
                                <th className="pb-3">Orçamento</th>
                                <th className="pb-3">Progresso</th>
                                <th className="pb-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {obras.map(o => (
                                <tr key={o.id}>
                                    <td className="py-3 pl-2 font-medium">{o.name}</td>
                                    <td className="py-3">{formatCurrency(o.totalCost || 0)}</td>
                                    <td className="py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                                                <div className="h-full bg-primary" style={{ width: `${o.progress}%` }} />
                                            </div>
                                            <span className="text-xs">{o.progress}%</span>
                                        </div>
                                    </td>
                                    <td className="py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs bg-secondary ${o.status === "Em andamento" ? "text-primary" : "text-muted-foreground"}`}>
                                            {o.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
