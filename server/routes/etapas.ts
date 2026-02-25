import { Router, Request, Response } from "express";
import prisma from "../prisma.js";
import { authMiddleware } from "../middlewares/auth.js";
import { recalcularProgressoObra, validateEtapaPercentual, validateEtapaDelete } from "../services/etapas.js";

const router = Router();
router.use(authMiddleware);

// GET /api/etapas?obraId=xxx
router.get("/", async (req: Request, res: Response) => {
    try {
        const { obraId } = req.query;
        const where: any = { companyId: req.auth!.companyId };
        if (obraId) where.obraId = obraId as string;
        const etapas = await prisma.etapa.findMany({ where, orderBy: { ordem: "asc" } });
        res.json(etapas);
    } catch { res.status(500).json({ error: "Erro ao buscar etapas." }); }
});

// POST /api/etapas — createWithValidation
router.post("/", async (req: Request, res: Response) => {
    try {
        const companyId = req.auth!.companyId;
        const data = { ...req.body, companyId };
        await validateEtapaPercentual(data.obraId, companyId, data.percentualPrevisto || 0);
        const etapa = await prisma.etapa.create({ data });
        await recalcularProgressoObra(data.obraId, companyId);
        res.status(201).json(etapa);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao criar etapa." }); }
});

// PUT /api/etapas/:id — updateWithValidation
router.put("/:id", async (req: Request, res: Response) => {
    try {
        const companyId = req.auth!.companyId;
        const existing = await prisma.etapa.findFirst({ where: { id: req.params.id, companyId } });
        if (!existing) { res.status(404).json({ error: "Etapa não encontrada." }); return; }
        if (req.body.percentualPrevisto !== undefined) {
            await validateEtapaPercentual(existing.obraId, companyId, req.body.percentualPrevisto, req.params.id);
        }
        const updated = await prisma.etapa.update({ where: { id: req.params.id }, data: req.body });
        await recalcularProgressoObra(existing.obraId, companyId);
        res.json(updated);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao atualizar etapa." }); }
});

// DELETE /api/etapas/:id — deleteWithValidation
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const companyId = req.auth!.companyId;
        await validateEtapaDelete(req.params.id, companyId);
        const existing = await prisma.etapa.findFirst({ where: { id: req.params.id, companyId } });
        await prisma.etapa.delete({ where: { id: req.params.id } });
        if (existing) await recalcularProgressoObra(existing.obraId, companyId);
        res.json({ success: true });
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao excluir etapa." }); }
});

// GET /api/etapas/soma-percentual?obraId=xxx
router.get("/soma-percentual", async (req: Request, res: Response) => {
    try {
        const { obraId, excludeId } = req.query;
        const companyId = req.auth!.companyId;
        const etapas = await prisma.etapa.findMany({
            where: { obraId: obraId as string, companyId, ...(excludeId ? { NOT: { id: excludeId as string } } : {}) }
        });
        const soma = etapas.reduce((sum, e) => sum + e.percentualPrevisto, 0);
        res.json({ soma });
    } catch { res.status(500).json({ error: "Erro ao calcular soma." }); }
});

export default router;
