import prisma from "../prisma.js";

// 7️⃣ SECURITY: Block delete if cotação aprovada or despesas exist
export async function validateFornecedorDelete(fornecedorId: string, companyId: string): Promise<void> {
    const cotCount = await prisma.cotacao.count({ where: { fornecedorId, companyId, status: "Aprovado" } });
    if (cotCount > 0) throw new Error(`Não é possível excluir. Fornecedor possui ${cotCount} cotação(ões) aprovada(s).`);

    const lancCount = await prisma.lancamento.count({ where: { fornecedorId, companyId } });
    if (lancCount > 0) throw new Error(`Não é possível excluir. Fornecedor possui ${lancCount} despesa(s) vinculada(s).`);
}
