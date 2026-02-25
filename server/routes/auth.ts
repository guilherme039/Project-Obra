import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../prisma.js";
import { generateToken, authMiddleware } from "../middlewares/auth.js";

const router = Router();

// POST /auth/register
router.post("/register", async (req: Request, res: Response) => {
    try {
        const { name, email, password, companyName, companyCnpj } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ error: "Nome, email e senha são obrigatórios." });
            return;
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: "Email já cadastrado." });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const company = await prisma.company.create({
            data: {
                name: companyName || "Minha Empresa",
                cnpj: companyCnpj || "",
            },
        });

        const user = await prisma.user.create({
            data: {
                companyId: company.id,
                name,
                email,
                password: hashedPassword,
                role: "admin",
            },
        });

        const token = generateToken({
            userId: user.id,
            companyId: company.id,
            email: user.email,
            role: user.role,
            name: user.name,
        });

        res.status(201).json({
            token,
            user: { id: user.id, companyId: user.companyId, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt.toISOString() },
        });
    } catch (err: any) {
        console.error("Register error:", err);
        res.status(500).json({ error: "Erro ao registrar." });
    }
});

// POST /auth/login
router.post("/login", async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        console.log(`🔑 Login attempt for: ${email}`);

        if (!email || !password) {
            console.log("❌ Missing email or password");
            res.status(400).json({ error: "Email e senha são obrigatórios." });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log("❌ User not found in DB");
            res.status(401).json({ error: "Credenciais inválidas." });
            return;
        }

        console.log(`✅ User found: ${user.email} (ID: ${user.id})`);
        // console.log(`🔐 Verifying password...`); 

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            console.log("❌ Password mismatch");
            res.status(401).json({ error: "Credenciais inválidas." });
            return;
        }

        console.log("✅ Password correct. Generating token...");

        const token = generateToken({
            userId: user.id,
            companyId: user.companyId,
            email: user.email,
            role: user.role,
            name: user.name,
        });

        res.json({
            token,
            user: { id: user.id, companyId: user.companyId, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt.toISOString() },
        });
    } catch (err: any) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Erro ao fazer login." });
    }
});

// GET /auth/me — get current user
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
        if (!user) { res.status(404).json({ error: "Usuário não encontrado." }); return; }
        res.json({ id: user.id, companyId: user.companyId, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt.toISOString() });
    } catch {
        res.status(500).json({ error: "Erro ao buscar usuário." });
    }
});

export default router;
