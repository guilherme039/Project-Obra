import { Router, Request, Response } from "express";
import prisma from "../prisma.js";
import { authMiddleware } from "../middlewares/auth.js";
import { aprovarCotacao } from "../services/cotacoes.js";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: Request, res: Response) => {
    try {
        const where: any = { companyId: req.auth!.companyId };
        if (req.query.obraId) where.obraId = req.query.obraId as string;
        const cotacoes = await prisma.cotacao.findMany({ where, orderBy: { criadoEm: "desc" } });
        res.json(cotacoes);
    } catch { res.status(500).json({ error: "Erro ao buscar cotações." }); }
});

router.post("/", async (req: Request, res: Response) => {
    try {
        const cotacao = await prisma.cotacao.create({ data: { ...req.body, companyId: req.auth!.companyId } });
        res.status(201).json(cotacao);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao criar cotação." }); }
});

router.put("/:id", async (req: Request, res: Response) => {
    try {
        const existing = await prisma.cotacao.findFirst({ where: { id: req.params.id, companyId: req.auth!.companyId } });
        if (!existing) { res.status(404).json({ error: "Cotação não encontrada." }); return; }
        const updated = await prisma.cotacao.update({ where: { id: req.params.id }, data: req.body });
        res.json(updated);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao atualizar." }); }
});

// POST /api/cotacoes/:id/aprovar — triggers lançamento + lista compra
router.post("/:id/aprovar", async (req: Request, res: Response) => {
    try {
        const result = await aprovarCotacao(req.params.id, req.auth!.companyId);
        if (!result) { res.status(404).json({ error: "Cotação não encontrada." }); return; }
        res.json(result);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao aprovar." }); }
});

// POST /api/cotacoes/:id/rejeitar
router.post("/:id/rejeitar", async (req: Request, res: Response) => {
    try {
        const updated = await prisma.cotacao.update({ where: { id: req.params.id }, data: { status: "Rejeitado" } });
        res.json(updated);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao rejeitar." }); }
});

// POST /api/cotacoes/:id/receber
router.post("/:id/receber", async (req: Request, res: Response) => {
    try {
        const updated = await prisma.cotacao.update({ where: { id: req.params.id }, data: { status: "Recebido", valor: req.body.valor } });
        res.json(updated);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao receber." }); }
});

router.delete("/:id", async (req: Request, res: Response) => {
    try {
        await prisma.cotacao.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao excluir." }); }
});

export default router;
