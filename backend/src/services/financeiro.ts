import prisma from "../prisma";

// 3️⃣ FINANCIAL DEVIATION
export async function calcularResumo(obraId: string, companyId: string) {
    const obra = await prisma.obra.findFirst({ where: { id: obraId, companyId } });
    const lancamentos = await prisma.lancamento.findMany({ where: { obraId, companyId } });

    const totalOrcado = obra?.totalCost || 0;
    const totalPago = lancamentos.filter((l) => l.status === "Pago").reduce((a, l) => a + l.valor, 0);
    const totalPendente = lancamentos.filter((l) => l.status === "Pendente" || l.status === "Atrasado").reduce((a, l) => a + l.valor, 0);
    const saldoRestante = totalOrcado - totalPago - totalPendente;
    const percentualExecutado = totalOrcado > 0 ? Math.round((totalPago / totalOrcado) * 100) : 0;

    return { totalOrcado, totalPago, totalAPagar: totalPendente, saldoRestante, percentualExecutado };
}

export async function calcularDesvio(obraId: string, companyId: string) {
    const resumo = await calcularResumo(obraId, companyId);
    const totalRealizado = resumo.totalPago + resumo.totalAPagar;
    const desvio = totalRealizado - resumo.totalOrcado;
    const desvioPercent = resumo.totalOrcado > 0 ? Math.round((desvio / resumo.totalOrcado) * 100) : 0;
    const classificacao = desvioPercent > 5 ? "Acima do orçamento" : desvioPercent < -5 ? "Abaixo do orçamento" : "Dentro do orçamento";
    return { desvio, desvioPercent, classificacao, totalRealizado };
}

// 4️⃣ FUTURE CASH FLOW
export async function calcularFluxoCaixaFuturo(obraId: string, companyId: string) {
    const lancamentos = await prisma.lancamento.findMany({ where: { obraId, companyId } });
    const totalAPagar = lancamentos.filter((l) => l.status === "Pendente" || l.status === "Atrasado").reduce((s, l) => s + l.valor, 0);

    const compras = await prisma.listaCompra.findMany({ where: { obraId, companyId, status: "Planejado" } });
    const comprasPlanejadas = compras.reduce((s, c) => s + c.valorPrevisto, 0);

    const medicoes = await prisma.medicao.findMany({ where: { obraId, companyId, status: { in: ["Pendente", "Aprovado"] } } });
    const medicoesPendentes = medicoes.reduce((s, m) => s + m.valorMedido, 0);

    const projecaoTotal = totalAPagar + comprasPlanejadas + medicoesPendentes;
    const obra = await prisma.obra.findFirst({ where: { id: obraId, companyId } });
    const orcamento = obra?.totalCost || 0;
    const risco = orcamento > 0
        ? (projecaoTotal / orcamento > 0.9 ? "Alto" : projecaoTotal / orcamento > 0.6 ? "Médio" : "Baixo")
        : "Baixo";

    return { totalAPagar, comprasPlanejadas, medicoesPendentes, projecaoTotal, risco };
}

export async function filtrarPorPeriodo(obraId: string, companyId: string, inicio: string, fim: string) {
    return prisma.lancamento.findMany({
        where: { obraId, companyId, dataVencimento: { gte: inicio, lte: fim } },
        orderBy: { dataVencimento: "desc" },
    });
}

// Auto-update overdue lancamentos
export async function autoUpdateOverdueStatus(companyId: string): Promise<void> {
    const today = new Date().toISOString().split("T")[0];
    await prisma.lancamento.updateMany({
        where: { companyId, status: "Pendente", dataVencimento: { lt: today } },
        data: { status: "Atrasado" },
    });
}
