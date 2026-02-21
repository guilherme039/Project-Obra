import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { authMiddleware } from "../middlewares/auth";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: Request, res: Response) => {
    try {
        const where: any = { companyId: req.auth!.companyId };
        if (req.query.obraId) where.obraId = req.query.obraId as string;
        const relatorios = await prisma.relatorioSemanal.findMany({ where, orderBy: { semanaInicio: "desc" } });
        // Parse fotos JSON string back to array
        const parsed = relatorios.map((r) => ({ ...r, fotos: JSON.parse(r.fotos || "[]") }));
        res.json(parsed);
    } catch { res.status(500).json({ error: "Erro ao buscar relatórios." }); }
});

// POST — createWithValidation (week conflict check)
router.post("/", async (req: Request, res: Response) => {
    try {
        const companyId = req.auth!.companyId;
        const { obraId, semanaInicio, semanaFim } = req.body;
        // Check for week overlap
        const conflict = await prisma.relatorioSemanal.findFirst({
            where: { obraId, companyId, semanaInicio: { lte: semanaFim }, semanaFim: { gte: semanaInicio } }
        });
        if (conflict) {
            res.status(400).json({ error: "Já existe um relatório para este período nesta obra." });
            return;
        }
        const data = { ...req.body, companyId, fotos: JSON.stringify(req.body.fotos || []) };
        const relatorio = await prisma.relatorioSemanal.create({ data });
        res.status(201).json({ ...relatorio, fotos: JSON.parse(relatorio.fotos) });
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao criar relatório." }); }
});

router.put("/:id", async (req: Request, res: Response) => {
    try {
        const existing = await prisma.relatorioSemanal.findFirst({ where: { id: req.params.id, companyId: req.auth!.companyId } });
        if (!existing) { res.status(404).json({ error: "Relatório não encontrado." }); return; }
        const data = { ...req.body };
        if (data.fotos) data.fotos = JSON.stringify(data.fotos);
        const updated = await prisma.relatorioSemanal.update({ where: { id: req.params.id }, data });
        res.json({ ...updated, fotos: JSON.parse(updated.fotos) });
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao atualizar." }); }
});

router.delete("/:id", async (req: Request, res: Response) => {
    try {
        await prisma.relatorioSemanal.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao excluir." }); }
});

export default router;
