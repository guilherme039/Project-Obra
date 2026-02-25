import { Router, Request, Response } from "express";
import prisma from "../prisma.js";
import { authMiddleware } from "../middlewares/auth.js";
import { validateObraDelete } from "../services/obras.js";

const router = Router();
router.use(authMiddleware);

// GET /api/obras
router.get("/", async (req: Request, res: Response) => {
    try {
        const companyId = req.auth!.companyId;
        const obras = await prisma.obra.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } });
        res.json(obras);
    } catch { res.status(500).json({ error: "Erro ao buscar obras." }); }
});

// GET /api/obras/:id
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const obra = await prisma.obra.findFirst({ where: { id: req.params.id, companyId: req.auth!.companyId } });
        if (!obra) { res.status(404).json({ error: "Obra não encontrada." }); return; }
        res.json(obra);
    } catch { res.status(500).json({ error: "Erro ao buscar obra." }); }
});

// POST /api/obras
router.post("/", async (req: Request, res: Response) => {
    try {
        const companyId = req.auth!.companyId;
        console.log("📝 Creating Obra. Payload:", req.body);
        const obra = await prisma.obra.create({ data: { ...req.body, companyId } });
        console.log("✅ Obra created:", obra.id);
        res.status(201).json(obra);
    } catch (err: any) {
        console.error("❌ Error creating obra:", err);
        res.status(400).json({ error: err.message || "Erro ao criar obra." });
    }
});

// PUT /api/obras/:id
router.put("/:id", async (req: Request, res: Response) => {
    try {
        const obra = await prisma.obra.findFirst({ where: { id: req.params.id, companyId: req.auth!.companyId } });
        if (!obra) { res.status(404).json({ error: "Obra não encontrada." }); return; }
        const updated = await prisma.obra.update({ where: { id: req.params.id }, data: req.body });
        res.json(updated);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao atualizar obra." }); }
});

// DELETE /api/obras/:id
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const companyId = req.auth!.companyId;
        await validateObraDelete(req.params.id, companyId);
        await prisma.obra.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao excluir obra." }); }
});

export default router;
