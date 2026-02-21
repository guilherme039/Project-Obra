import prisma from "../prisma";
import { calcularDesvio, calcularFluxoCaixaFuturo } from "./financeiro";

interface Alerta {
    tipo: string;
    titulo: string;
    descricao: string;
    severidade: "info" | "warning" | "critical";
}

// 6️⃣ SMART ALERTS: 7 conditions
export async function gerarAlertas(obraId: string, companyId: string): Promise<Alerta[]> {
    const alertas: Alerta[] = [];
    const today = new Date().toISOString().split("T")[0];
    const nowMs = Date.now();

    const etapas = await prisma.etapa.findMany({ where: { obraId, companyId }, orderBy: { ordem: "asc" } });

    // 1. Próxima etapa a iniciar
    const proximaEtapa = etapas.find((e) => e.dataInicio >= today && e.percentualExecutado === 0);
    if (proximaEtapa) {
        const diasAte = Math.ceil((new Date(proximaEtapa.dataInicio).getTime() - nowMs) / 86400000);
        alertas.push({
            tipo: "etapa", titulo: `Próxima etapa: ${proximaEtapa.nome}`,
            descricao: diasAte <= 0 ? "Deveria ter iniciado hoje" : `Inicia em ${diasAte} dia(s) — ${proximaEtapa.dataInicio}`,
            severidade: diasAte <= 3 ? "warning" : "info",
        });
    }

    // 2. Etapas atrasadas
    const atrasadas = etapas.filter((e) => e.dataFim < today && e.percentualExecutado < 100);
    atrasadas.forEach((e) => {
        const diasAtraso = Math.ceil((nowMs - new Date(e.dataFim).getTime()) / 86400000);
        alertas.push({
            tipo: "atraso", titulo: `Etapa atrasada: ${e.nome}`,
            descricao: `Prazo: ${e.dataFim} | Atraso: ${diasAtraso} dia(s) | Executado: ${e.percentualExecutado}%`,
            severidade: "critical",
        });
    });

    // 3. Obra globalmente atrasada
    const obra = await prisma.obra.findFirst({ where: { id: obraId, companyId } });
    if (obra && obra.dataPrevisaoTermino < today && obra.progresso < 100 && obra.status !== "Cancelada" && obra.status !== "Pausada") {
        const diasAtraso = Math.ceil((nowMs - new Date(obra.dataPrevisaoTermino).getTime()) / 86400000);
        alertas.push({
            tipo: "obra", titulo: `Obra atrasada: ${diasAtraso} dia(s) além do prazo`,
            descricao: `Previsão: ${obra.dataPrevisaoTermino} | Progresso: ${obra.progresso}%`,
            severidade: "critical",
        });
    }

    // 4. Compras urgentes (próximos 3 dias) + previstas (7 dias)
    const comprasFuturas = await prisma.listaCompra.findMany({
        where: { obraId, companyId, status: "Planejado", dataPrevista: { gte: today } }
    });
    comprasFuturas.forEach((c) => {
        const diff = Math.ceil((new Date(c.dataPrevista).getTime() - nowMs) / 86400000);
        if (diff <= 3 && diff >= 0) {
            alertas.push({ tipo: "compra", titulo: `Compra urgente: ${c.descricao}`, descricao: `Data: ${c.dataPrevista} | Valor: R$ ${c.valorPrevisto.toFixed(2)}`, severidade: diff <= 1 ? "critical" : "warning" });
        } else if (diff <= 7 && diff > 3) {
            alertas.push({ tipo: "compra", titulo: `Compra prevista: ${c.descricao}`, descricao: `Data: ${c.dataPrevista} | Valor: R$ ${c.valorPrevisto.toFixed(2)}`, severidade: "info" });
        }
    });

    // 5. Medições pendentes há mais de 15 dias
    const medicoes = await prisma.medicao.findMany({ where: { obraId, companyId, status: { in: ["Pendente", "Aprovado"] } } });
    medicoes.forEach((m) => {
        const diasPendente = Math.ceil((nowMs - new Date(m.dataMedicao).getTime()) / 86400000);
        if (diasPendente > 15) {
            alertas.push({ tipo: "medicao", titulo: `Medição pendente: ${m.descricao}`, descricao: `Há ${diasPendente} dias sem pagamento | Valor: R$ ${m.valorMedido.toFixed(2)} | Status: ${m.status}`, severidade: diasPendente > 30 ? "critical" : "warning" });
        }
    });

    // 6. Desvio financeiro
    const desvio = await calcularDesvio(obraId, companyId);
    if (desvio.classificacao === "Acima do orçamento") {
        alertas.push({ tipo: "desvio", titulo: `Desvio financeiro: +${desvio.desvioPercent}%`, descricao: `Orçado: R$ ${(desvio.totalRealizado - desvio.desvio).toFixed(2)} | Realizado: R$ ${desvio.totalRealizado.toFixed(2)}`, severidade: desvio.desvioPercent > 25 ? "critical" : "warning" });
    }

    // 7. Cash flow risk
    const fluxo = await calcularFluxoCaixaFuturo(obraId, companyId);
    if (fluxo.risco === "Alto") {
        alertas.push({ tipo: "desvio", titulo: `Risco financeiro ALTO`, descricao: `Projeção total: R$ ${fluxo.projecaoTotal.toFixed(2)} (${Math.round((fluxo.projecaoTotal / ((obra?.orcamentoTotal || 1))) * 100)}% do orçamento)`, severidade: "critical" });
    }

    return alertas;
}
