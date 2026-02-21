import { useMemo } from "react";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAuth } from "@/contexts/AuthContext";
import { obrasService, lancamentosService } from "@/services/api";
import Layout from "@/components/Layout";
import {
  Building2,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CHART_COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(280, 65%, 60%)",
  "hsl(190, 80%, 50%)",
];

export default function Dashboard() {
  const { user } = useAuth();
  const companyId = user?.companyId || "";

  const { data: obras = [] } = useAsyncData(() => obrasService.getAll(companyId), [companyId]);
  const { data: lancamentos = [] } = useAsyncData(() => lancamentosService.getAll(companyId), [companyId]);

  const obrasAtivas = obras.filter((o) => o.status === "Em andamento").length;
  const receitaTotal = lancamentos
    .filter((l) => l.tipo === "Receita")
    .reduce((acc, l) => acc + l.valor, 0);
  const custoTotal = lancamentos
    .filter((l) => l.tipo === "Despesa")
    .reduce((acc, l) => acc + l.valor, 0);
  const resultado = receitaTotal - custoTotal;

  const monthlyData = useMemo(() => {
    const months: Record<string, { receita: number; despesa: number }> = {};
    lancamentos.forEach((l) => {
      const month = (l.dataVencimento || "").substring(0, 7);
      if (!month) return;
      if (!months[month]) months[month] = { receita: 0, despesa: 0 };
      if (l.tipo === "Receita") months[month].receita += l.valor ?? 0;
      else months[month].despesa += l.valor ?? 0;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month: month.split("-").reverse().join("/"),
        Receita: data.receita,
        Despesa: data.despesa,
      }));
  }, [lancamentos]);

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    lancamentos
      .filter((l) => l.tipo === "Despesa")
      .forEach((l) => {
        const cat = l.categoria || "Outros";
        cats[cat] = (cats[cat] || 0) + l.valor;
      });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [lancamentos]);

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const stats = [
    { label: "Obras Ativas", value: obrasAtivas, icon: Building2, color: "text-primary" },
    { label: "Receita Total", value: formatCurrency(receitaTotal), icon: TrendingUp, color: "text-success" },
    { label: "Custo Total", value: formatCurrency(custoTotal), icon: TrendingDown, color: "text-warning" },
    { label: "Resultado", value: formatCurrency(resultado), icon: DollarSign, color: resultado >= 0 ? "text-success" : "text-destructive" },
  ];

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visao geral da sua construtora</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Receitas vs Despesas</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 20%)" />
                <XAxis dataKey="month" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 50%, 4%)",
                    border: "1px solid hsl(222, 30%, 12%)",
                    borderRadius: 8,
                    color: "hsl(210, 20%, 95%)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="Receita" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesa" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
              Nenhum lancamento registrado
            </div>
          )}
        </div>

        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Despesas por Categoria</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name }) => name}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220, 18%, 13%)",
                    border: "1px solid hsl(220, 13%, 20%)",
                    borderRadius: 8,
                    color: "hsl(210, 20%, 95%)",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
              Nenhuma despesa registrada
            </div>
          )}
        </div>
      </div>

      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Ultimas Obras</h3>
        {obras.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Nome</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Cliente</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Status</th>
                  <th className="text-right py-2 text-xs text-muted-foreground font-medium">Orcamento</th>
                  <th className="text-right py-2 text-xs text-muted-foreground font-medium">Progresso</th>
                </tr>
              </thead>
              <tbody>
                {obras.slice(0, 5).map((obra) => (
                  <tr key={obra.id} className="border-b border-border/50">
                    <td className="py-2 text-foreground">{obra.name}</td>
                    <td className="py-2 text-muted-foreground">{obra.client ?? "—"}</td>
                    <td className="py-2">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${obra.status === "Em andamento" ? "bg-primary/20 text-primary" :
                        obra.status === "Concluida" ? "bg-success/20 text-success" :
                          obra.status === "Pausada" ? "bg-warning/20 text-warning" :
                            "bg-destructive/20 text-destructive"
                        }`}>
                        {obra.status}
                      </span>
                    </td>
                    <td className="py-2 text-right text-foreground">{formatCurrency(obra.totalCost ?? 0)}</td>
                    <td className="py-2 text-right text-muted-foreground">{obra.progress ?? 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma obra cadastrada</p>
        )}
      </div>
    </Layout>
  );
}
