import prisma from "../prisma";
import { Obra } from "@prisma/client";

// Mapper: DB (Portuguese) -> Client (English)
export const mapObraToClient = (obra: Obra) => ({
    id: obra.id,
    companyId: obra.companyId,
    name: obra.nome,
    client: obra.cliente,
    clientId: obra.clienteId,
    address: obra.endereco,
    cep: obra.cep,
    number: obra.numero,
    complement: obra.complemento,
    startDate: obra.dataInicio,
    endDate: obra.dataPrevisaoTermino,
    totalCost: obra.orcamentoTotal,
    materialsCost: obra.orcamentoMateriais,
    laborCost: obra.orcamentoEmpreiteira,
    progress: obra.progresso,
    status: obra.status,
    description: obra.descricao,
    imageUrl: obra.imagemUrl,
    createdAt: obra.createdAt?.toISOString(),
    updatedAt: obra.updatedAt?.toISOString(),
});

// Mapper: Client (English) -> DB (Portuguese)
export const mapObraToDb = (data: any) => ({
    nome: data.name,
    cliente: data.client,
    endereco: data.address,
    cep: data.cep,
    numero: data.number,
    complemento: data.complement,
    dataInicio: data.startDate,
    dataPrevisaoTermino: data.endDate,
    orcamentoTotal: data.totalCost,
    orcamentoMateriais: data.materialsCost,
    orcamentoEmpreiteira: data.laborCost,
    progresso: data.progress,
    status: data.status,
    descricao: data.description,
    imagemUrl: data.imageUrl,
});

// 7️⃣ SECURITY: Block delete if obra has lancamentos, etapas, or medições
export async function validateObraDelete(obraId: string, companyId: string): Promise<void> {
    const lancCount = await prisma.lancamento.count({ where: { obraId, companyId } });
    if (lancCount > 0) throw new Error(`Não é possível excluir. Obra possui ${lancCount} lançamento(s) financeiro(s).`);

    const etapaCount = await prisma.etapa.count({ where: { obraId, companyId } });
    if (etapaCount > 0) throw new Error(`Não é possível excluir. Obra possui ${etapaCount} etapa(s) cadastrada(s).`);

    const medCount = await prisma.medicao.count({ where: { obraId, companyId } });
    if (medCount > 0) throw new Error(`Não é possível excluir. Obra possui ${medCount} medição(ões).`);
}
