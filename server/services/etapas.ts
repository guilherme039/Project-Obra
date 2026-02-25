import prisma from "../prisma.js";

// 1️⃣ AUTO PROGRESS: Weighted average + auto status transitions
export async function recalcularProgressoObra(obraId: string, companyId: string): Promise<void> {
    const etapas = await prisma.etapa.findMany({ where: { obraId, companyId }, orderBy: { ordem: "asc" } });
    const obra = await prisma.obra.findFirst({ where: { id: obraId, companyId } });
    if (!obra) return;

    const today = new Date().toISOString().split("T")[0];

    if (etapas.length === 0) {
        await prisma.obra.update({ where: { id: obraId }, data: { progress: 0 } });
        return;
    }

    const somaPrevisto = etapas.reduce((s, e) => s + e.percentualPrevisto, 0);
    const progressoPonderado = somaPrevisto > 0
        ? etapas.reduce((sum, e) => sum + (e.percentualPrevisto / somaPrevisto) * e.percentualExecutado, 0)
        : 0;
    const progress = Math.round(progressoPonderado);

    const todasConcluidas = etapas.every((e) => e.percentualExecutado >= 100);
    let status = obra.status;
    if (todasConcluidas && progress >= 100) {
        status = "Concluida";
    } else if (obra.endDate && obra.endDate < today && progress < 100 && status !== "Pausada" && status !== "Cancelada") {
        status = "Atrasada";
    } else if (status === "Concluida" && progress < 100) {
        status = "Em andamento";
    } else if (status === "Atrasada" && obra.endDate && obra.endDate >= today) {
        status = "Em andamento";
    }

    await prisma.obra.update({ where: { id: obraId }, data: { progress, status } });
}

// 2️⃣ Etapa validation
export async function validateEtapaPercentual(obraId: string, companyId: string, percentualPrevisto: number, excludeId?: string): Promise<void> {
    const etapas = await prisma.etapa.findMany({ where: { obraId, companyId, ...(excludeId ? { NOT: { id: excludeId } } : {}) } });
    const somaAtual = etapas.reduce((sum, e) => sum + e.percentualPrevisto, 0);
    if (somaAtual + percentualPrevisto > 100) {
        throw new Error(`Soma dos percentuais previstos excede 100%. Disponível: ${100 - somaAtual}%`);
    }
}

// 7️⃣ Delete validation for etapa — block if medição linked
export async function validateEtapaDelete(etapaId: string, companyId: string): Promise<void> {
    const count = await prisma.medicao.count({ where: { etapaId, companyId } });
    if (count > 0) throw new Error(`Não é possível excluir. Etapa possui ${count} medição(ões) vinculada(s).`);
}

export async function getEtapasAtrasadas(obraId: string, companyId: string) {
    const today = new Date().toISOString().split("T")[0];
    return prisma.etapa.findMany({
        where: { obraId, companyId, dataFim: { lt: today }, percentualExecutado: { lt: 100 } }
    });
}
