import { Router, Request, Response } from "express";
import prisma from "../prisma.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: Request, res: Response) => {
    try {
        const where: any = { companyId: req.auth!.companyId };
        if (req.query.obraId) where.obraId = req.query.obraId as string;
        const items = await prisma.listaCompra.findMany({ where, orderBy: { dataPrevista: "asc" } });
        res.json(items);
    } catch { res.status(500).json({ error: "Erro ao buscar lista de compras." }); }
});

router.post("/", async (req: Request, res: Response) => {
    try {
        const item = await prisma.listaCompra.create({ data: { ...req.body, companyId: req.auth!.companyId } });
        res.status(201).json(item);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao criar item." }); }
});

router.put("/:id", async (req: Request, res: Response) => {
    try {
        const existing = await prisma.listaCompra.findFirst({ where: { id: req.params.id, companyId: req.auth!.companyId } });
        if (!existing) { res.status(404).json({ error: "Item não encontrado." }); return; }
        const updated = await prisma.listaCompra.update({ where: { id: req.params.id }, data: req.body });
        res.json(updated);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao atualizar." }); }
});

// POST /api/lista-compras/:id/comprado
router.post("/:id/comprado", async (req: Request, res: Response) => {
    try {
        const updated = await prisma.listaCompra.update({ where: { id: req.params.id }, data: { status: "Comprado" } });
        res.json(updated);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao marcar como comprado." }); }
});

// GET /api/lista-compras/projecao?obraId=xxx
router.get("/projecao", async (req: Request, res: Response) => {
    try {
        const companyId = req.auth!.companyId;
        const obraId = req.query.obraId as string;
        const compras = await prisma.listaCompra.findMany({ where: { obraId, companyId } });
        const totalPlanejado = compras.filter((c) => c.status === "Planejado").reduce((s, c) => s + c.valorPrevisto, 0);
        const totalComprado = compras.filter((c) => c.status === "Comprado").reduce((s, c) => s + c.valorPrevisto, 0);
        res.json({ totalPlanejado, totalComprado, total: totalPlanejado + totalComprado });
    } catch { res.status(500).json({ error: "Erro ao calcular projeção." }); }
});

router.delete("/:id", async (req: Request, res: Response) => {
    try {
        await prisma.listaCompra.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao excluir." }); }
});

export default router;
