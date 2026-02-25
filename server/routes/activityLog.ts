import { Router, Request, Response } from "express";
import prisma from "../prisma.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
router.use(authMiddleware);

// GET /api/activity-log
router.get("/", async (req: Request, res: Response) => {
    try {
        const logs = await prisma.activityLog.findMany({
            where: { companyId: req.auth!.companyId },
            orderBy: { timestamp: "desc" },
            take: 1000,
        });
        res.json(logs);
    } catch { res.status(500).json({ error: "Erro ao buscar logs." }); }
});

// POST /api/activity-log
router.post("/", async (req: Request, res: Response) => {
    try {
        const log = await prisma.activityLog.create({
            data: { ...req.body, companyId: req.auth!.companyId },
        });
        res.status(201).json(log);
    } catch (err: any) { res.status(400).json({ error: err.message || "Erro ao criar log." }); }
});

export default router;
