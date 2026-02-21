import { useMemo, useState } from "react";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAuth } from "@/contexts/AuthContext";
import { obrasService, lancamentosService, autoUpdateOverdueStatus } from "@/services/api";
import { exportToJSON, exportToCSV } from "@/services/exportData";
import Layout from "@/components/Layout";
import { FileBarChart, Download } from "lucide-react";
import { toast } from "sonner";

export default function Relatorios() {
  const { user } = useAuth();
  const companyId = user?.companyId || "";
  const [selectedObra, setSelectedObra] = useState<string>("geral");

  const { data: obras = [] } = useAsyncData(() => obrasService.getAll(companyId), [companyId]);
  const { data: allLancamentos = [] } = useAsyncData(() => lancamentosService.getAll(companyId), [companyId]);

  const lancamentos = useMemo(() => {
    if (selectedObra === "geral") return allLancamentos;
    return allLancamentos.filter((l) => l.obraId === selectedObra);
  }, [allLancamentos, selectedObra]);

  const receitas = lancamentos.filter((l) => l.tipo === "Receita").reduce((a, l) => a + l.valor, 0);
  const despesas = lancamentos.filter((l) => l.tipo === "Despesa").reduce((a, l) => a + l.valor, 0);
  const resultado = receitas - despesas;

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleExport = (format: "json" | "csv") => {
    try {
      if (lancamentos.length === 0) {
        toast.error("Nenhum dado para exportar.");
        return;
      }
      const data = lancamentos.map((l) => ({
        Descricao: l.descricao,
        Tipo: l.tipo,
        Obra: l.obraNome || "-",
        Fornecedor: l.fornecedorNome || "-",
        Valor: l.valor,
        Vencimento: l.dataVencimento,
        Pagamento: l.dataPagamento || "-",
        Status: l.status,
        Categoria: l.categoria || "-",
      }));
      const filename = `relatorio_${selectedObra === "geral" ? "geral" : "obra"}_${new Date().toISOString().split("T")[0]}`;
      if (format === "json") {
        exportToJSON(data, filename);
      } else {
        exportToCSV(data, filename);
      }
      toast.success(`Relatório exportado em ${format.toUpperCase()} com sucesso.`);
    } catch (e) {
      toast.error("Erro ao exportar relatório.");
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Relatorios</h1>
          <p className="text-sm text-muted-foreground">Relatorios financeiros da construtora</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedObra} onChange={(e) => setSelectedObra(e.target.value)} className="px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value="geral">Relatorio Geral</option>
            {obras.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <button onClick={() => handleExport("csv")} className="flex items-center gap-1.5 px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground hover:bg-muted transition-colors">
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button onClick={() => handleExport("json")} className="flex items-center gap-1.5 px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground hover:bg-muted transition-colors">
            <Download className="h-3.5 w-3.5" /> JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card text-center">
          <p className="text-xs text-muted-foreground mb-1">Total Receitas</p>
          <p className="text-lg font-bold text-success">{formatCurrency(receitas)}</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-xs text-muted-foreground mb-1">Total Despesas</p>
          <p className="text-lg font-bold text-destructive">{formatCurrency(despesas)}</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-xs text-muted-foreground mb-1">Resultado</p>
          <p className={`text-lg font-bold ${resultado >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(resultado)}</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Lancamentos Detalhados</h3>
          <p className="text-xs text-muted-foreground">{lancamentos.length} registros</p>
        </div>
        {lancamentos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Descricao</th>
                  <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Tipo</th>
                  <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Obra</th>
                  <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Vencimento</th>
                  <th className="text-right px-4 py-2 text-xs text-muted-foreground font-medium">Valor</th>
                  <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {lancamentos.map((l) => (
                  <tr key={l.id} className="border-b border-border/50">
                    <td className="px-4 py-2 text-foreground">{l.descricao}</td>
                    <td className="px-4 py-2"><span className={l.tipo === "Receita" ? "text-success" : "text-destructive"}>{l.tipo}</span></td>
                    <td className="px-4 py-2 text-muted-foreground">{l.obraNome || "-"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{l.dataVencimento}</td>
                    <td className="px-4 py-2 text-right text-foreground">{formatCurrency(l.valor)}</td>
                    <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded text-xs font-medium ${l.status === "Pago" ? "bg-success/20 text-success" : l.status === "Atrasado" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"}`}>{l.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileBarChart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum lancamento para exibir</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
