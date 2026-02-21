import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { authMiddleware } from "../middlewares/auth";
import { validateFornecedorDelete } from "../services/fornecedores";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: Request, res: Response) => {
    try {
        const fornecedores = await prisma.fornecedor.findMany({ where: { companyId: req.auth!.companyId }, orderBy: { nome: "asc" } });
        res.json(fornecedores);
    } catch { res.status(500).json({ error: "Erro ao buscar fornecedores." }); }
});

router.post("/", async (req: Request, res: Response) => {
    try {
        const fornecedor = await prisma.fornecedor.create({ data: { ...req.body, companyId: req.auth!.companyId } });
        res.status(201).json(fornecedor);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao criar fornecedor." }); }
});

router.put("/:id", async (req: Request, res: Response) => {
    try {
        const existing = await prisma.fornecedor.findFirst({ where: { id: req.params.id, companyId: req.auth!.companyId } });
        if (!existing) { res.status(404).json({ error: "Fornecedor não encontrado." }); return; }
        const updated = await prisma.fornecedor.update({ where: { id: req.params.id }, data: req.body });
        res.json(updated);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao atualizar." }); }
});

router.delete("/:id", async (req: Request, res: Response) => {
    try {
        await validateFornecedorDelete(req.params.id, req.auth!.companyId);
        await prisma.fornecedor.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao excluir." }); }
});

export default router;
