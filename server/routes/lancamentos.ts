import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { authMiddleware } from "../middlewares/auth";
import { autoUpdateOverdueStatus } from "../services/financeiro";

const router = Router();
router.use(authMiddleware);

// GET /api/lancamentos?obraId=xxx
router.get("/", async (req: Request, res: Response) => {
    try {
        const companyId = req.auth!.companyId;
        // Auto-update overdue on every fetch
        await autoUpdateOverdueStatus(companyId);
        const where: any = { companyId };
        if (req.query.obraId) where.obraId = req.query.obraId as string;
        const lancamentos = await prisma.lancamento.findMany({ where, orderBy: { dataVencimento: "desc" } });
        res.json(lancamentos);
    } catch { res.status(500).json({ error: "Erro ao buscar lançamentos." }); }
});

// POST /api/lancamentos
router.post("/", async (req: Request, res: Response) => {
    try {
        const companyId = req.auth!.companyId;
        const lancamento = await prisma.lancamento.create({ data: { ...req.body, companyId } });
        res.status(201).json(lancamento);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao criar lançamento." }); }
});

// PUT /api/lancamentos/:id
router.put("/:id", async (req: Request, res: Response) => {
    try {
        const companyId = req.auth!.companyId;
        const existing = await prisma.lancamento.findFirst({ where: { id: req.params.id, companyId } });
        if (!existing) { res.status(404).json({ error: "Lançamento não encontrado." }); return; }
        const updated = await prisma.lancamento.update({ where: { id: req.params.id }, data: req.body });
        res.json(updated);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao atualizar." }); }
});

// DELETE /api/lancamentos/:id
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        await prisma.lancamento.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao excluir." }); }
});

export default router;
