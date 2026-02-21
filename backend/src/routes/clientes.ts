import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { authMiddleware } from "../middlewares/auth";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: Request, res: Response) => {
    try {
        const clientes = await prisma.cliente.findMany({ where: { companyId: req.auth!.companyId }, orderBy: { nome: "asc" } });
        res.json(clientes);
    } catch { res.status(500).json({ error: "Erro ao buscar clientes." }); }
});

router.post("/", async (req: Request, res: Response) => {
    try {
        const cliente = await prisma.cliente.create({ data: { ...req.body, companyId: req.auth!.companyId } });
        res.status(201).json(cliente);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao criar cliente." }); }
});

router.put("/:id", async (req: Request, res: Response) => {
    try {
        const existing = await prisma.cliente.findFirst({ where: { id: req.params.id, companyId: req.auth!.companyId } });
        if (!existing) { res.status(404).json({ error: "Cliente não encontrado." }); return; }
        const updated = await prisma.cliente.update({ where: { id: req.params.id }, data: req.body });
        res.json(updated);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao atualizar." }); }
});

router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const existing = await prisma.cliente.findFirst({ where: { id: req.params.id, companyId: req.auth!.companyId } });
        if (!existing) { res.status(404).json({ error: "Cliente não encontrado." }); return; }
        await prisma.cliente.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao excluir." }); }
});

export default router;
