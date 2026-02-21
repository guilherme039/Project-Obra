import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { gerarAlertas } from "../services/alertas";

const router = Router();
router.use(authMiddleware);

// GET /api/alertas?obraId=xxx
router.get("/", async (req: Request, res: Response) => {
    try {
        const alertas = await gerarAlertas(req.query.obraId as string, req.auth!.companyId);
        res.json(alertas);
    } catch { res.status(500).json({ error: "Erro ao gerar alertas." }); }
});

export default router;
