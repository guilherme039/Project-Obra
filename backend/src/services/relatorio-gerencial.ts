import prisma from "../prisma";
import { calcularResumo, calcularDesvio, calcularFluxoCaixaFuturo } from "./financeiro";
import { gerarAlertas } from "./alertas";

// 8️⃣ Consolidated management report
export async function gerarRelatorio(obraId: string, companyId: string) {
    const obra = await prisma.obra.findFirst({ where: { id: obraId, companyId } });
    if (!obra) return null;

    const resumoFinanceiro = await calcularResumo(obraId, companyId);
    const desvio = await calcularDesvio(obraId, companyId);
    const fluxo = await calcularFluxoCaixaFuturo(obraId, companyId);
    const etapas = await prisma.etapa.findMany({ where: { obraId, companyId } });
    const medicoes = await prisma.medicao.findMany({ where: { obraId, companyId } });
    const totalMedido = medicoes.reduce((s, m) => s + m.valorMedido, 0);
    const compras = await prisma.listaCompra.findMany({ where: { obraId, companyId, status: "Planejado" } });
    const comprasFuturas = compras.reduce((s, c) => s + c.valorPrevisto, 0);
    const alertas = await gerarAlertas(obraId, companyId);
    const today = new Date().toISOString().split("T")[0];

    return {
        obraId,
        obraNome: obra.nome,
        progressoFisico: obra.progresso,
        progressoFinanceiro: resumoFinanceiro.percentualExecutado,
        desvioOrcamentario: desvio.desvio,
        desvioPercent: desvio.desvioPercent,
        classificacaoDesvio: desvio.classificacao,
        totalOrcado: resumoFinanceiro.totalOrcado,
        totalMedido,
        totalPago: resumoFinanceiro.totalPago,
        totalPendente: resumoFinanceiro.totalAPagar,
        comprasFuturas,
        projecaoFluxo: fluxo.projecaoTotal,
        riscoFinanceiro: fluxo.risco,
        totalEtapas: etapas.length,
        etapasAtrasadas: etapas.filter((e) => e.dataFim < today && e.percentualExecutado < 100).length,
        statusGeral: obra.status,
        totalAlertas: alertas.length,
        alertasCriticos: alertas.filter((a) => a.severidade === "critical").length,
    };
}
