import prisma from "../prisma.js";

// 7️⃣ SECURITY: Block delete if obra has lancamentos, etapas, or medições
export async function validateObraDelete(obraId: string, companyId: string): Promise<void> {
    const lancCount = await prisma.lancamento.count({ where: { obraId, companyId } });
    if (lancCount > 0) throw new Error(`Não é possível excluir. Obra possui ${lancCount} lançamento(s) financeiro(s).`);

    const etapaCount = await prisma.etapa.count({ where: { obraId, companyId } });
    if (etapaCount > 0) throw new Error(`Não é possível excluir. Obra possui ${etapaCount} etapa(s) cadastrada(s).`);

    const medCount = await prisma.medicao.count({ where: { obraId, companyId } });
    if (medCount > 0) throw new Error(`Não é possível excluir. Obra possui ${medCount} medição(ões).`);
}
