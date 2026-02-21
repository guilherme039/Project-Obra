import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { gerarRelatorio } from "../services/relatorio-gerencial";

const router = Router();
router.use(authMiddleware);

// GET /api/relatorio-gerencial?obraId=xxx
router.get("/", async (req: Request, res: Response) => {
    try {
        const result = await gerarRelatorio(req.query.obraId as string, req.auth!.companyId);
        if (!result) { res.status(404).json({ error: "Obra não encontrada." }); return; }
        res.json(result);
    } catch { res.status(500).json({ error: "Erro ao gerar relatório." }); }
});

export default router;
