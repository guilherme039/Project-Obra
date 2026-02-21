import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { authMiddleware } from "../middlewares/auth";
import { pagarMedicao } from "../services/medicoes";

const router = Router();
router.use(authMiddleware);

// GET /api/medicoes?obraId=xxx
router.get("/", async (req: Request, res: Response) => {
    try {
        const { obraId } = req.query;
        const where: any = { companyId: req.auth!.companyId };
        if (obraId) where.obraId = obraId as string;
        const medicoes = await prisma.medicao.findMany({ where, orderBy: { dataMedicao: "desc" } });
        res.json(medicoes);
    } catch { res.status(500).json({ error: "Erro ao buscar medições." }); }
});

// POST /api/medicoes
router.post("/", async (req: Request, res: Response) => {
    try {
        const companyId = req.auth!.companyId;
        const medicao = await prisma.medicao.create({ data: { ...req.body, companyId } });
        res.status(201).json(medicao);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao criar medição." }); }
});

// PUT /api/medicoes/:id
router.put("/:id", async (req: Request, res: Response) => {
    try {
        const companyId = req.auth!.companyId;
        const existing = await prisma.medicao.findFirst({ where: { id: req.params.id, companyId } });
        if (!existing) { res.status(404).json({ error: "Medição não encontrada." }); return; }
        const updated = await prisma.medicao.update({ where: { id: req.params.id }, data: req.body });
        res.json(updated);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao atualizar medição." }); }
});

// POST /api/medicoes/:id/aprovar
router.post("/:id/aprovar", async (req: Request, res: Response) => {
    try {
        const companyId = req.auth!.companyId;
        const updated = await prisma.medicao.update({ where: { id: req.params.id }, data: { status: "Aprovado" } });
        res.json(updated);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao aprovar medição." }); }
});

// POST /api/medicoes/:id/pagar
router.post("/:id/pagar", async (req: Request, res: Response) => {
    try {
        const result = await pagarMedicao(req.params.id, req.auth!.companyId);
        if (!result) { res.status(400).json({ error: "Medição já paga ou não encontrada." }); return; }
        res.json(result);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao pagar medição." }); }
});

// DELETE /api/medicoes/:id
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        await prisma.medicao.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao excluir medição." }); }
});

export default router;
