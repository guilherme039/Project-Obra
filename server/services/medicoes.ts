import prisma from "../prisma";

// 5️⃣ Medição → Pagar → gera lançamento automático
export async function pagarMedicao(id: string, companyId: string) {
    const medicao = await prisma.medicao.findFirst({ where: { id, companyId } });
    if (!medicao || medicao.status === "Pago") return null;

    const obra = await prisma.obra.findFirst({ where: { id: medicao.obraId, companyId } });
    const obraNome = obra?.nome || "";

    const lancamento = await prisma.lancamento.create({
        data: {
            companyId,
            obraId: medicao.obraId,
            obraNome,
            tipo: "Despesa",
            descricao: `Medição: ${medicao.descricao}`,
            valor: medicao.valorMedido,
            dataVencimento: medicao.dataMedicao,
            dataPagamento: new Date().toISOString().split("T")[0],
            status: "Pago",
            categoria: "Medição",
        },
    });

    const updated = await prisma.medicao.update({
        where: { id },
        data: { status: "Pago", lancamentoGeradoId: lancamento.id },
    });

    return { medicao: updated, lancamento };
}
