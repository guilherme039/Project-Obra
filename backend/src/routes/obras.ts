import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { authMiddleware } from "../middlewares/auth";
import { validateObraDelete, mapObraToClient, mapObraToDb } from "../services/obras";

const router = Router();
router.use(authMiddleware);

// GET /api/obras
router.get("/", async (req: Request, res: Response) => {
    try {
        const companyId = req.auth!.companyId;
        const obras = await prisma.obra.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } });
        res.json(obras.map(mapObraToClient));
    } catch { res.status(500).json({ error: "Erro ao buscar obras." }); }
});

// GET /api/obras/:id
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const obra = await prisma.obra.findFirst({ where: { id: req.params.id, companyId: req.auth!.companyId } });
        if (!obra) { res.status(404).json({ error: "Obra não encontrada." }); return; }
        res.json(mapObraToClient(obra));
    } catch { res.status(500).json({ error: "Erro ao buscar obra." }); }
});

import * as fs from 'fs';
import * as path from 'path';

// ... imports

// POST /api/obras
router.post("/", async (req: Request, res: Response) => {
    try {
        const logPath = path.join(__dirname, '../../debug_obras.txt');
        const logData = `\n[${new Date().toISOString()}] POST /api/obras\nBody: ${JSON.stringify(req.body, null, 2)}\n`;
        fs.appendFileSync(logPath, logData);

        const companyId = req.auth!.companyId;
        const dbData = mapObraToDb(req.body);

        fs.appendFileSync(logPath, `Mapped: ${JSON.stringify(dbData, null, 2)}\n`);

        const obra = await prisma.obra.create({ data: { ...dbData, companyId } });
        res.status(201).json(mapObraToClient(obra));
    } catch (err: any) {
        const logPath = path.join(__dirname, '../../debug_obras.txt'); // Redefine if scope issue, but ok here
        fs.appendFileSync(logPath, `Error: ${err.message}\nStack: ${err.stack}\n`);

        console.error("Error creating obra:", err);
        res.status(400).json({ error: err.message || "Erro ao criar obra." });
    }
});

// PUT /api/obras/:id
router.put("/:id", async (req: Request, res: Response) => {
    try {
        const obra = await prisma.obra.findFirst({ where: { id: req.params.id, companyId: req.auth!.companyId } });
        if (!obra) { res.status(404).json({ error: "Obra não encontrada." }); return; }
        const dbData = mapObraToDb(req.body);
        const updated = await prisma.obra.update({ where: { id: req.params.id }, data: dbData });
        res.json(mapObraToClient(updated));
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
