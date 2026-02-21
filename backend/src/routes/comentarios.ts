import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { authMiddleware } from "../middlewares/auth";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: Request, res: Response) => {
    try {
        const where: any = { companyId: req.auth!.companyId };
        if (req.query.obraId) where.obraId = req.query.obraId as string;
        if (req.query.includeHidden !== "true") where.oculto = false;
        const comentarios = await prisma.comentarioObra.findMany({ where, orderBy: { dataCriacao: "desc" } });
        res.json(comentarios);
    } catch { res.status(500).json({ error: "Erro ao buscar comentários." }); }
});

router.post("/", async (req: Request, res: Response) => {
    try {
        const companyId = req.auth!.companyId;
        const comentario = await prisma.comentarioObra.create({
            data: {
                ...req.body,
                companyId,
                dataCriacao: new Date().toISOString(),
                oculto: false,
            },
        });
        res.status(201).json(comentario);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao criar comentário." }); }
});

// POST /api/comentarios/:id/ocultar — soft delete
router.post("/:id/ocultar", async (req: Request, res: Response) => {
    try {
        const updated = await prisma.comentarioObra.update({ where: { id: req.params.id }, data: { oculto: true } });
        res.json(updated);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao ocultar." }); }
});

router.delete("/:id", async (req: Request, res: Response) => {
    try {
        await prisma.comentarioObra.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao excluir." }); }
});

export default router;
