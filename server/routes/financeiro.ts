import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { calcularResumo, calcularDesvio, calcularFluxoCaixaFuturo, filtrarPorPeriodo } from "../services/financeiro.js";

const router = Router();
router.use(authMiddleware);

// GET /api/financeiro/resumo?obraId=xxx
router.get("/resumo", async (req: Request, res: Response) => {
    try {
        const result = await calcularResumo(req.query.obraId as string, req.auth!.companyId);
        res.json(result);
    } catch { res.status(500).json({ error: "Erro ao calcular resumo." }); }
});

// GET /api/financeiro/desvio?obraId=xxx
router.get("/desvio", async (req: Request, res: Response) => {
    try {
        const result = await calcularDesvio(req.query.obraId as string, req.auth!.companyId);
        res.json(result);
    } catch { res.status(500).json({ error: "Erro ao calcular desvio." }); }
});

// GET /api/financeiro/fluxo-caixa?obraId=xxx
router.get("/fluxo-caixa", async (req: Request, res: Response) => {
    try {
        const result = await calcularFluxoCaixaFuturo(req.query.obraId as string, req.auth!.companyId);
        res.json(result);
    } catch { res.status(500).json({ error: "Erro ao calcular fluxo de caixa." }); }
});

// GET /api/financeiro/periodo?obraId=xxx&inicio=YY&fim=YY
router.get("/periodo", async (req: Request, res: Response) => {
    try {
        const result = await filtrarPorPeriodo(
            req.query.obraId as string, req.auth!.companyId,
            req.query.inicio as string, req.query.fim as string
        );
        res.json(result);
    } catch { res.status(500).json({ error: "Erro ao filtrar por período." }); }
});

export default router;
