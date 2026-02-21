import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../prisma";
import { generateToken, authMiddleware } from "../middlewares/auth";
import crypto from "crypto";

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
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

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
                emailConfirmed: false,
                verificationToken,
                verificationTokenExpiresAt,
            },
        });

        // TODO: Send actual email
        console.log(`📧 SENDING EMAIL TO ${email}`);
        console.log(`🔗 VERIFICATION LINK: http://localhost:5173/verify-email?token=${verificationToken}`);

        res.status(201).json({
            message: "Cadastro realizado com sucesso! Verifique seu email para ativar a conta.",
        });
    } catch (err: any) {
        console.error("Register error:", err);
        res.status(500).json({ error: "Erro ao registrar." });
    }
});

// POST /auth/verify-email
router.post("/verify-email", async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        if (!token) {
            res.status(400).json({ error: "Token inválido." });
            return;
        }

        const user = await prisma.user.findFirst({
            where: { verificationToken: token },
        });

        if (!user) {
            res.status(400).json({ error: "Token inválido ou expirado." });
            return;
        }

        if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt < new Date()) {
            res.status(400).json({ error: "Token expirado. Solicite um novo email de verificação." });
            return;
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailConfirmed: true,
                verificationToken: null,
                verificationTokenExpiresAt: null,
            },
        });

        res.json({ message: "Email verificado com sucesso! Você já pode fazer login." });
    } catch (err: any) {
        console.error("Verification error:", err);
        res.status(500).json({ error: "Erro ao verificar email." });
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

        if (!user.emailConfirmed) {
            console.log("❌ Email not confirmed");
            res.status(403).json({ error: "Por favor, verifique seu email antes de fazer login." });
            return;
        }

        console.log(`✅ User found: ${user.email} (ID: ${user.id})`);
        console.log(`🔐 Verifying password...`);

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
