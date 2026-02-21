import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { authMiddleware } from "../middlewares/auth";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: Request, res: Response) => {
    try {
        const where: any = { companyId: req.auth!.companyId };
        if (req.query.obraId) where.obraId = req.query.obraId as string;
        const nfs = await prisma.notaFiscal.findMany({ where, orderBy: { dataEmissao: "desc" } });
        res.json(nfs);
    } catch { res.status(500).json({ error: "Erro ao buscar notas fiscais." }); }
});

// POST — createWithValidation (lancamentoId mandatory)
router.post("/", async (req: Request, res: Response) => {
    try {
        if (!req.body.lancamentoId) {
            res.status(400).json({ error: "Nota Fiscal deve ser vinculada a um lançamento financeiro." });
            return;
        }
        const nf = await prisma.notaFiscal.create({ data: { ...req.body, companyId: req.auth!.companyId } });
        res.status(201).json(nf);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao criar NF." }); }
});

router.put("/:id", async (req: Request, res: Response) => {
    try {
        const existing = await prisma.notaFiscal.findFirst({ where: { id: req.params.id, companyId: req.auth!.companyId } });
        if (!existing) { res.status(404).json({ error: "NF não encontrada." }); return; }
        const updated = await prisma.notaFiscal.update({ where: { id: req.params.id }, data: req.body });
        res.json(updated);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao atualizar." }); }
});

router.delete("/:id", async (req: Request, res: Response) => {
    try {
        await prisma.notaFiscal.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao excluir." }); }
});

export default router;
