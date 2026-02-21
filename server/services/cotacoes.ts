import prisma from "../prisma";

// 5️⃣ MODULE INTEGRATION: Approve → Lancamento + ListaCompra
export async function aprovarCotacao(id: string, companyId: string) {
    const cotacao = await prisma.cotacao.findFirst({ where: { id, companyId } });
    if (!cotacao) return null;

    const obra = await prisma.obra.findFirst({ where: { id: cotacao.obraId, companyId } });
    const obraNome = obra?.nome || "";

    const lancamento = await prisma.lancamento.create({
        data: {
            companyId,
            obraId: cotacao.obraId,
            obraNome,
            tipo: "Despesa",
            fornecedorId: cotacao.fornecedorId,
            fornecedorNome: cotacao.fornecedorNome || "",
            descricao: `Cotação aprovada: ${cotacao.descricao}`,
            valor: cotacao.valor,
            dataVencimento: new Date().toISOString().split("T")[0],
            status: "Pendente",
            categoria: "Cotação",
        },
    });

    const compra = await prisma.listaCompra.create({
        data: {
            companyId,
            obraId: cotacao.obraId,
            descricao: `Cotação: ${cotacao.descricao} (${cotacao.fornecedorNome || ""})`,
            valorPrevisto: cotacao.valor,
            dataPrevista: new Date().toISOString().split("T")[0],
            status: "Comprado",
        },
    });

    const updated = await prisma.cotacao.update({ where: { id }, data: { status: "Aprovado" } });

    return { cotacao: updated, lancamento, compra };
}
