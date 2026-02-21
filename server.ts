import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import path from "path";

const app = express();
const PORT = 3001;
const JWT_SECRET = "erp-secret-key-change-in-production";

// Initialize Prisma
const prisma = new PrismaClient({
    log: ['error', 'warn'],
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Auth middleware
interface AuthPayload {
    userId: string;
    companyId: string;
    email: string;
    name: string;
    role: string;
}

declare global {
    namespace Express {
        interface Request {
            auth?: AuthPayload;
        }
    }
}

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token não fornecido." });
    }

    try {
        const token = header.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
        req.auth = decoded;
        next();
    } catch {
        res.status(401).json({ error: "Token inválido." });
    }
}

// ============ AUTH ROUTES ============

app.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email e senha são obrigatórios." });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { company: true }
        });

        if (!user) {
            return res.status(401).json({ error: "Credenciais inválidas." });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Credenciais inválidas." });
        }

        const token = jwt.sign({
            userId: user.id,
            companyId: user.companyId,
            email: user.email,
            name: user.name,
            role: "admin"
        }, JWT_SECRET, { expiresIn: "8h" });

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                companyId: user.companyId,
                role: "admin"
            }
        });
    } catch {
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

app.post("/auth/register", async (req, res) => {
    try {
        const { companyName, companyCnpj, name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Nome, email e senha são obrigatórios." });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: "Email já cadastrado." });
        }

        // Find or create company
        let company = await prisma.company.findFirst();
        if (companyName) {
            company = await prisma.company.create({
                data: {
                    name: companyName.trim(),
                    cnpj: companyCnpj?.trim() || "00.000.000/0001-00"
                }
            });
        }

        if (!company) {
            company = await prisma.company.create({
                data: { name: "Default Company", cnpj: "00.000.000/0001-00" }
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: email.trim(),
                password: hashedPassword,
                companyId: company.id
            }
        });

        res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
            companyId: user.companyId
        });
    } catch (err: any) {
        console.error("Register error:", err);
        res.status(500).json({ error: "Erro ao registrar." });
    }
});

// ============ OBRAS ROUTES ============

app.get("/api/obras", authMiddleware, async (req, res) => {
    try {
        const obras = await prisma.obra.findMany({
            where: { companyId: req.auth!.companyId },
            orderBy: { createdAt: "desc" }
        });
        res.json(obras);
    } catch {
        res.status(500).json({ error: "Erro ao buscar obras." });
    }
});

app.get("/api/obras/:id", authMiddleware, async (req, res) => {
    try {
        const obra = await prisma.obra.findFirst({
            where: {
                id: req.params.id,
                companyId: req.auth!.companyId
            }
        });

        if (!obra) {
            return res.status(404).json({ error: "Obra não encontrada." });
        }

        res.json(obra);
    } catch {
        res.status(500).json({ error: "Erro ao buscar obra." });
    }
});

app.post("/api/obras", authMiddleware, async (req, res) => {
    try {
        const {
            name, materialsCost, laborCost, totalCost, progress,
            startDate, endDate, status, client, address,
            cep, number: num, complement, description, imageUrl
        } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Nome da obra é obrigatório." });
        }

        const obra = await prisma.obra.create({
            data: {
                name: name.trim(),
                materialsCost: parseFloat(materialsCost) || 0,
                laborCost: parseFloat(laborCost) || 0,
                totalCost: parseFloat(totalCost) || parseFloat(materialsCost || 0) + parseFloat(laborCost || 0),
                progress: parseInt(progress) || 0,
                startDate: startDate || null,
                endDate: endDate || null,
                status: status || "Em andamento",
                companyId: req.auth!.companyId,
                client: client || null,
                address: address || null,
                cep: cep || null,
                number: num || null,
                complement: complement || null,
                description: description || null,
                imageUrl: imageUrl || null
            }
        });

        res.status(201).json(obra);
    } catch (error) {
        console.error("Create obra error:", error);
        res.status(500).json({ error: "Erro ao criar obra." });
    }
});

app.put("/api/obras/:id", authMiddleware, async (req, res) => {
    try {
        const {
            name, materialsCost, laborCost, totalCost, progress,
            startDate, endDate, status, client, address,
            cep, number: num, complement, description, imageUrl
        } = req.body;

        const existing = await prisma.obra.findFirst({
            where: { id: req.params.id, companyId: req.auth!.companyId }
        });
        if (!existing) {
            return res.status(404).json({ error: "Obra não encontrada." });
        }

        const obra = await prisma.obra.update({
            where: { id: req.params.id },
            data: {
                ...(name !== undefined && { name: name.trim() }),
                ...(materialsCost !== undefined && { materialsCost: parseFloat(materialsCost) }),
                ...(laborCost !== undefined && { laborCost: parseFloat(laborCost) }),
                ...(totalCost !== undefined && { totalCost: parseFloat(totalCost) }),
                ...(progress !== undefined && { progress: parseInt(progress) }),
                ...(startDate !== undefined && { startDate }),
                ...(endDate !== undefined && { endDate }),
                ...(status !== undefined && { status }),
                ...(client !== undefined && { client }),
                ...(address !== undefined && { address }),
                ...(cep !== undefined && { cep }),
                ...(num !== undefined && { number: num }),
                ...(complement !== undefined && { complement }),
                ...(description !== undefined && { description }),
                ...(imageUrl !== undefined && { imageUrl }),
            }
        });

        res.json(obra);
    } catch {
        res.status(500).json({ error: "Erro ao atualizar obra." });
    }
});

app.delete("/api/obras/:id", authMiddleware, async (req, res) => {
    try {
        const existing = await prisma.obra.findFirst({
            where: { id: req.params.id, companyId: req.auth!.companyId }
        });
        if (!existing) {
            return res.status(404).json({ error: "Obra não encontrada." });
        }
        await prisma.obra.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao excluir obra." });
    }
});

// ============ USERS ROUTES ============

app.get("/api/users", authMiddleware, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { companyId: req.auth!.companyId },
            select: { id: true, name: true, email: true, role: true, companyId: true, obraId: true, createdAt: true }
        });
        res.json(users);
    } catch {
        res.status(500).json({ error: "Erro ao buscar usuários." });
    }
});

app.post("/api/users", authMiddleware, async (req, res) => {
    try {
        const { name, email, password, role, obraId } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Nome, email e senha devem ser preenchidos." });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: "Email já cadastrado." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                companyId: req.auth!.companyId,
                name,
                email,
                password: hashedPassword,
                role: role || "user",
                obraId: obraId || null
            }
        });

        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao criar usuário." });
    }
});

app.put("/api/users/:id", authMiddleware, async (req, res) => {
    try {
        const { name, email, role, obraId, password } = req.body;

        const data: any = { name, email, role, obraId };
        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id: req.params.id },
            data
        });

        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao atualizar usuário." });
    }
});

app.delete("/api/users/:id", authMiddleware, async (req, res) => {
    try {
        await prisma.user.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch {
        res.status(500).json({ error: "Erro ao excluir usuário." });
    }
});

// ============ CLIENTES ROUTES ============

app.get("/api/clientes", authMiddleware, async (req, res) => {
    try {
        const clientes = await prisma.cliente.findMany({
            where: { companyId: req.auth!.companyId },
            orderBy: { nome: "asc" }
        });
        res.json(clientes);
    } catch {
        res.status(500).json({ error: "Erro ao buscar clientes." });
    }
});

app.post("/api/clientes", authMiddleware, async (req, res) => {
    try {
        const { nome, cpfCnpj, telefone, email } = req.body;

        if (!nome || !cpfCnpj) {
            return res.status(400).json({ error: "Nome e CPF/CNPJ são obrigatórios." });
        }

        const cliente = await prisma.cliente.create({
            data: {
                nome: nome.trim(),
                cpfCnpj: cpfCnpj.trim(),
                telefone: telefone?.trim() || "",
                email: email?.trim() || "",
                companyId: req.auth!.companyId
            }
        });

        res.status(201).json(cliente);
    } catch {
        res.status(500).json({ error: "Erro ao criar cliente." });
    }
});

app.put("/api/clientes/:id", authMiddleware, async (req, res) => {
    try {
        const { nome, cpfCnpj, telefone, email } = req.body;

        const existing = await prisma.cliente.findFirst({
            where: { id: req.params.id, companyId: req.auth!.companyId }
        });
        if (!existing) {
            return res.status(404).json({ error: "Cliente não encontrado." });
        }

        const cliente = await prisma.cliente.update({
            where: { id: req.params.id },
            data: {
                ...(nome !== undefined && { nome: nome.trim() }),
                ...(cpfCnpj !== undefined && { cpfCnpj: cpfCnpj.trim() }),
                ...(telefone !== undefined && { telefone: telefone.trim() }),
                ...(email !== undefined && { email: email.trim() }),
            }
        });

        res.json(cliente);
    } catch {
        res.status(500).json({ error: "Erro ao atualizar cliente." });
    }
});

app.delete("/api/clientes/:id", authMiddleware, async (req, res) => {
    try {
        const existing = await prisma.cliente.findFirst({
            where: { id: req.params.id, companyId: req.auth!.companyId }
        });
        if (!existing) {
            return res.status(404).json({ error: "Cliente não encontrado." });
        }
        await prisma.cliente.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: "Erro ao excluir cliente." });
    }
});

// ============ FORNECEDORES ROUTES ============

app.get("/api/fornecedores", authMiddleware, async (req, res) => {
    try {
        const fornecedores = await prisma.fornecedor.findMany({
            where: { companyId: req.auth!.companyId },
            orderBy: { nome: "asc" }
        });
        res.json(fornecedores);
    } catch {
        res.status(500).json({ error: "Erro ao buscar fornecedores." });
    }
});

app.post("/api/fornecedores", authMiddleware, async (req, res) => {
    try {
        const fornecedor = await prisma.fornecedor.create({
            data: { ...req.body, companyId: req.auth!.companyId }
        });
        res.status(201).json(fornecedor);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao criar fornecedor." });
    }
});

app.put("/api/fornecedores/:id", authMiddleware, async (req, res) => {
    try {
        const existing = await prisma.fornecedor.findFirst({
            where: { id: req.params.id, companyId: req.auth!.companyId }
        });
        if (!existing) { return res.status(404).json({ error: "Fornecedor não encontrado." }); }
        const updated = await prisma.fornecedor.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(updated);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao atualizar." });
    }
});

app.delete("/api/fornecedores/:id", authMiddleware, async (req, res) => {
    try {
        const existing = await prisma.fornecedor.findFirst({
            where: { id: req.params.id, companyId: req.auth!.companyId }
        });
        if (!existing) { return res.status(404).json({ error: "Fornecedor não encontrado." }); }
        await prisma.fornecedor.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao excluir." });
    }
});

// ============ LANCAMENTOS ROUTES ============

app.get("/api/lancamentos", authMiddleware, async (req, res) => {
    try {
        const where: any = { companyId: req.auth!.companyId };
        if (req.query.obraId) where.obraId = req.query.obraId as string;
        const lancamentos = await prisma.lancamento.findMany({
            where,
            orderBy: { createdAt: "desc" }
        });
        res.json(lancamentos);
    } catch {
        res.status(500).json({ error: "Erro ao buscar lançamentos." });
    }
});

app.post("/api/lancamentos", authMiddleware, async (req, res) => {
    try {
        const lancamento = await prisma.lancamento.create({
            data: { ...req.body, companyId: req.auth!.companyId }
        });
        res.status(201).json(lancamento);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao criar lançamento." });
    }
});

app.put("/api/lancamentos/:id", authMiddleware, async (req, res) => {
    try {
        const existing = await prisma.lancamento.findFirst({
            where: { id: req.params.id, companyId: req.auth!.companyId }
        });
        if (!existing) { return res.status(404).json({ error: "Lançamento não encontrado." }); }
        const updated = await prisma.lancamento.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(updated);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao atualizar." });
    }
});

app.delete("/api/lancamentos/:id", authMiddleware, async (req, res) => {
    try {
        await prisma.lancamento.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao excluir." });
    }
});

// ============ ETAPAS ROUTES ============

app.get("/api/etapas", authMiddleware, async (req, res) => {
    try {
        const where: any = { companyId: req.auth!.companyId };
        if (req.query.obraId) where.obraId = req.query.obraId as string;
        const etapas = await prisma.etapa.findMany({
            where,
            orderBy: { ordem: "asc" }
        });
        res.json(etapas);
    } catch {
        res.status(500).json({ error: "Erro ao buscar etapas." });
    }
});

app.get("/api/etapas/soma-percentual", authMiddleware, async (req, res) => {
    try {
        const obraId = req.query.obraId as string;
        const excludeId = req.query.excludeId as string | undefined;
        const where: any = { obraId, companyId: req.auth!.companyId };
        if (excludeId) where.NOT = { id: excludeId };
        const result = await prisma.etapa.aggregate({
            where,
            _sum: { percentualPrevisto: true }
        });
        res.json({ soma: result._sum.percentualPrevisto || 0 });
    } catch {
        res.status(500).json({ error: "Erro ao calcular soma." });
    }
});

app.post("/api/etapas", authMiddleware, async (req, res) => {
    try {
        const etapa = await prisma.etapa.create({
            data: { ...req.body, companyId: req.auth!.companyId }
        });

        // Recalculate obra progress
        const etapas = await prisma.etapa.findMany({ where: { obraId: etapa.obraId } });
        if (etapas.length > 0) {
            const progress = Math.round(
                etapas.reduce((sum, e) => sum + (e.percentualExecutado * e.percentualPrevisto / 100), 0)
            );
            await prisma.obra.update({ where: { id: etapa.obraId }, data: { progress } });
        }

        res.status(201).json(etapa);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao criar etapa." });
    }
});

app.put("/api/etapas/:id", authMiddleware, async (req, res) => {
    try {
        const existing = await prisma.etapa.findFirst({
            where: { id: req.params.id, companyId: req.auth!.companyId }
        });
        if (!existing) { return res.status(404).json({ error: "Etapa não encontrada." }); }
        const updated = await prisma.etapa.update({
            where: { id: req.params.id },
            data: req.body
        });

        // Recalculate obra progress
        const etapas = await prisma.etapa.findMany({ where: { obraId: updated.obraId } });
        if (etapas.length > 0) {
            const progress = Math.round(
                etapas.reduce((sum, e) => sum + (e.percentualExecutado * e.percentualPrevisto / 100), 0)
            );
            await prisma.obra.update({ where: { id: updated.obraId }, data: { progress } });
        }

        res.json(updated);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao atualizar." });
    }
});

app.delete("/api/etapas/:id", authMiddleware, async (req, res) => {
    try {
        const existing = await prisma.etapa.findFirst({
            where: { id: req.params.id, companyId: req.auth!.companyId }
        });
        if (!existing) { return res.status(404).json({ error: "Etapa não encontrada." }); }
        await prisma.etapa.delete({ where: { id: req.params.id } });

        // Recalculate obra progress
        const etapas = await prisma.etapa.findMany({ where: { obraId: existing.obraId } });
        const progress = etapas.length > 0
            ? Math.round(etapas.reduce((sum, e) => sum + (e.percentualExecutado * e.percentualPrevisto / 100), 0))
            : 0;
        await prisma.obra.update({ where: { id: existing.obraId }, data: { progress } });

        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao excluir." });
    }
});

// ============ MEDICOES ROUTES ============

app.get("/api/medicoes", authMiddleware, async (req, res) => {
    try {
        const where: any = { companyId: req.auth!.companyId };
        if (req.query.obraId) where.obraId = req.query.obraId as string;
        const medicoes = await prisma.medicao.findMany({ where, orderBy: { createdAt: "desc" } });
        res.json(medicoes);
    } catch {
        res.status(500).json({ error: "Erro ao buscar medições." });
    }
});

app.post("/api/medicoes", authMiddleware, async (req, res) => {
    try {
        const medicao = await prisma.medicao.create({
            data: { ...req.body, companyId: req.auth!.companyId }
        });
        res.status(201).json(medicao);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao criar medição." });
    }
});

app.post("/api/medicoes/:id/aprovar", authMiddleware, async (req, res) => {
    try {
        const updated = await prisma.medicao.update({
            where: { id: req.params.id },
            data: { status: "Aprovado" }
        });
        res.json(updated);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao aprovar." });
    }
});

app.post("/api/medicoes/:id/pagar", authMiddleware, async (req, res) => {
    try {
        const medicao = await prisma.medicao.findFirst({
            where: { id: req.params.id, companyId: req.auth!.companyId }
        });
        if (!medicao) { return res.status(404).json({ error: "Medição não encontrada." }); }

        const obra = await prisma.obra.findFirst({ where: { id: medicao.obraId } });

        const lancamento = await prisma.lancamento.create({
            data: {
                obraId: medicao.obraId,
                companyId: req.auth!.companyId,
                obraNome: obra?.name || "",
                tipo: "Despesa",
                descricao: `Pagamento Medição: ${medicao.descricao}`,
                valor: medicao.valorMedido,
                dataVencimento: new Date().toISOString().split("T")[0],
                dataPagamento: new Date().toISOString().split("T")[0],
                status: "Pago"
            }
        });

        const updatedMedicao = await prisma.medicao.update({
            where: { id: req.params.id },
            data: { status: "Pago", lancamentoGeradoId: lancamento.id }
        });

        res.json({ medicao: updatedMedicao, lancamento });
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao pagar." });
    }
});

app.put("/api/medicoes/:id", authMiddleware, async (req, res) => {
    try {
        const updated = await prisma.medicao.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(updated);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao atualizar." });
    }
});

app.delete("/api/medicoes/:id", authMiddleware, async (req, res) => {
    try {
        await prisma.medicao.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao excluir." });
    }
});

// ============ COTACOES ROUTES ============

app.get("/api/cotacoes", authMiddleware, async (req, res) => {
    try {
        const where: any = { companyId: req.auth!.companyId };
        if (req.query.obraId) where.obraId = req.query.obraId as string;
        const cotacoes = await prisma.cotacao.findMany({
            where,
            orderBy: { criadoEm: "desc" },
            include: {
                obra: { select: { name: true } },
                fornecedor: { select: { nome: true } }
            }
        });
        // Map obra.name to obra.nome for frontend compatibility
        const mapped = cotacoes.map(c => ({
            ...c,
            obra: c.obra ? { name: c.obra.name } : null
        }));
        res.json(mapped);
    } catch {
        res.status(500).json({ error: "Erro ao buscar cotações." });
    }
});

app.post("/api/cotacoes", authMiddleware, async (req, res) => {
    try {
        const cotacao = await prisma.cotacao.create({
            data: { ...req.body, companyId: req.auth!.companyId }
        });
        res.status(201).json(cotacao);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao criar cotação." });
    }
});

app.put("/api/cotacoes/:id", authMiddleware, async (req, res) => {
    try {
        const existing = await prisma.cotacao.findFirst({
            where: { id: req.params.id, companyId: req.auth!.companyId }
        });
        if (!existing) { return res.status(404).json({ error: "Cotação não encontrada." }); }
        const updated = await prisma.cotacao.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(updated);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao atualizar." });
    }
});

app.post("/api/cotacoes/:id/aprovar", authMiddleware, async (req, res) => {
    try {
        const cotacao = await prisma.cotacao.findFirst({
            where: { id: req.params.id, companyId: req.auth!.companyId }
        });
        if (!cotacao) { return res.status(404).json({ error: "Cotação não encontrada." }); }

        const obra = await prisma.obra.findFirst({ where: { id: cotacao.obraId } });

        // Create lancamento
        const lancamento = await prisma.lancamento.create({
            data: {
                obraId: cotacao.obraId,
                companyId: req.auth!.companyId,
                obraNome: obra?.name || "",
                tipo: "Despesa",
                fornecedorId: cotacao.fornecedorId,
                fornecedorNome: cotacao.fornecedorNome || "",
                descricao: `Cotação aprovada: ${cotacao.descricao}`,
                valor: cotacao.valor,
                dataVencimento: new Date().toISOString().split("T")[0],
                status: "Pendente"
            }
        });

        // Create lista de compras item
        await prisma.listaCompra.create({
            data: {
                obraId: cotacao.obraId,
                companyId: req.auth!.companyId,
                descricao: cotacao.descricao,
                valorPrevisto: cotacao.valor,
                dataPrevista: new Date().toISOString().split("T")[0],
                status: "Planejado"
            }
        });

        // Update cotacao status
        const updated = await prisma.cotacao.update({
            where: { id: req.params.id },
            data: { status: "Aprovado" }
        });

        res.json({ cotacao: updated, lancamento });
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao aprovar." });
    }
});

app.post("/api/cotacoes/:id/rejeitar", authMiddleware, async (req, res) => {
    try {
        const updated = await prisma.cotacao.update({
            where: { id: req.params.id },
            data: { status: "Rejeitado" }
        });
        res.json(updated);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao rejeitar." });
    }
});

app.post("/api/cotacoes/:id/receber", authMiddleware, async (req, res) => {
    try {
        const updated = await prisma.cotacao.update({
            where: { id: req.params.id },
            data: { status: "Recebido", valor: req.body.valor }
        });
        res.json(updated);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao receber." });
    }
});

app.delete("/api/cotacoes/:id", authMiddleware, async (req, res) => {
    try {
        await prisma.cotacao.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao excluir." });
    }
});

// ============ LISTA DE COMPRAS ROUTES ============

app.get("/api/lista-compras", authMiddleware, async (req, res) => {
    try {
        const where: any = { companyId: req.auth!.companyId };
        if (req.query.obraId) where.obraId = req.query.obraId as string;
        const items = await prisma.listaCompra.findMany({ where, orderBy: { createdAt: "desc" } });
        res.json(items);
    } catch {
        res.status(500).json({ error: "Erro ao buscar lista de compras." });
    }
});

app.post("/api/lista-compras", authMiddleware, async (req, res) => {
    try {
        const item = await prisma.listaCompra.create({
            data: { ...req.body, companyId: req.auth!.companyId }
        });
        res.status(201).json(item);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao criar item." });
    }
});

app.put("/api/lista-compras/:id", authMiddleware, async (req, res) => {
    try {
        const updated = await prisma.listaCompra.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(updated);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao atualizar." });
    }
});

app.post("/api/lista-compras/:id/comprado", authMiddleware, async (req, res) => {
    try {
        const updated = await prisma.listaCompra.update({
            where: { id: req.params.id },
            data: { status: "Comprado" }
        });
        res.json(updated);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao marcar como comprado." });
    }
});

app.get("/api/lista-compras/projecao", authMiddleware, async (req, res) => {
    try {
        const obraId = req.query.obraId as string;
        const items = await prisma.listaCompra.findMany({
            where: { obraId, companyId: req.auth!.companyId, status: "Planejado" }
        });
        const total = items.reduce((sum, i) => sum + i.valorPrevisto, 0);
        res.json({ total, itens: items.length });
    } catch {
        res.status(500).json({ error: "Erro." });
    }
});

app.delete("/api/lista-compras/:id", authMiddleware, async (req, res) => {
    try {
        await prisma.listaCompra.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao excluir." });
    }
});

// ============ NOTAS FISCAIS ROUTES ============

app.get("/api/notas-fiscais", authMiddleware, async (req, res) => {
    try {
        const where: any = { companyId: req.auth!.companyId };
        if (req.query.obraId) where.obraId = req.query.obraId as string;
        const notas = await prisma.notaFiscal.findMany({ where, orderBy: { createdAt: "desc" } });
        res.json(notas);
    } catch {
        res.status(500).json({ error: "Erro ao buscar notas fiscais." });
    }
});

app.post("/api/notas-fiscais", authMiddleware, async (req, res) => {
    try {
        const nota = await prisma.notaFiscal.create({
            data: { ...req.body, companyId: req.auth!.companyId }
        });
        res.status(201).json(nota);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao criar nota fiscal." });
    }
});

app.put("/api/notas-fiscais/:id", authMiddleware, async (req, res) => {
    try {
        const updated = await prisma.notaFiscal.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(updated);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao atualizar." });
    }
});

app.delete("/api/notas-fiscais/:id", authMiddleware, async (req, res) => {
    try {
        await prisma.notaFiscal.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao excluir." });
    }
});

// ============ RELATORIOS SEMANAIS ROUTES ============

app.get("/api/relatorios", authMiddleware, async (req, res) => {
    try {
        const where: any = { companyId: req.auth!.companyId };
        if (req.query.obraId) where.obraId = req.query.obraId as string;
        const relatorios = await prisma.relatorioSemanal.findMany({ where, orderBy: { createdAt: "desc" } });
        res.json(relatorios);
    } catch {
        res.status(500).json({ error: "Erro ao buscar relatórios." });
    }
});

app.post("/api/relatorios", authMiddleware, async (req, res) => {
    try {
        const data = { ...req.body, companyId: req.auth!.companyId };
        if (Array.isArray(data.fotos)) data.fotos = JSON.stringify(data.fotos);
        const relatorio = await prisma.relatorioSemanal.create({ data });
        res.status(201).json(relatorio);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao criar relatório." });
    }
});

app.put("/api/relatorios/:id", authMiddleware, async (req, res) => {
    try {
        const updated = await prisma.relatorioSemanal.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(updated);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao atualizar." });
    }
});

app.delete("/api/relatorios/:id", authMiddleware, async (req, res) => {
    try {
        await prisma.relatorioSemanal.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao excluir." });
    }
});

// ============ COMENTARIOS ROUTES ============

app.get("/api/comentarios", authMiddleware, async (req, res) => {
    try {
        const where: any = { companyId: req.auth!.companyId, oculto: false };
        if (req.query.obraId) where.obraId = req.query.obraId as string;
        if (req.query.includeHidden === "true") delete where.oculto;
        const comentarios = await prisma.comentarioObra.findMany({ where, orderBy: { createdAt: "desc" } });
        res.json(comentarios);
    } catch {
        res.status(500).json({ error: "Erro ao buscar comentários." });
    }
});

app.post("/api/comentarios", authMiddleware, async (req, res) => {
    try {
        const comentario = await prisma.comentarioObra.create({
            data: {
                ...req.body,
                companyId: req.auth!.companyId,
                dataCriacao: req.body.dataCriacao || new Date().toISOString()
            }
        });
        res.status(201).json(comentario);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao criar comentário." });
    }
});

app.post("/api/comentarios/:id/ocultar", authMiddleware, async (req, res) => {
    try {
        const updated = await prisma.comentarioObra.update({
            where: { id: req.params.id },
            data: { oculto: true }
        });
        res.json(updated);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao ocultar." });
    }
});

app.put("/api/comentarios/:id", authMiddleware, async (req, res) => {
    try {
        const updated = await prisma.comentarioObra.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(updated);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao atualizar." });
    }
});

app.delete("/api/comentarios/:id", authMiddleware, async (req, res) => {
    try {
        await prisma.comentarioObra.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao excluir." });
    }
});

// ============ FINANCEIRO ROUTES ============

app.get("/api/financeiro/resumo", authMiddleware, async (req, res) => {
    try {
        const obraId = req.query.obraId as string;
        const companyId = req.auth!.companyId;

        const obra = await prisma.obra.findFirst({ where: { id: obraId, companyId } });
        const lancamentos = await prisma.lancamento.findMany({ where: { obraId, companyId } });

        const totalPago = lancamentos
            .filter(l => l.status === "Pago" && l.tipo === "Despesa")
            .reduce((sum, l) => sum + l.valor, 0);
        const totalAPagar = lancamentos
            .filter(l => l.status === "Pendente" && l.tipo === "Despesa")
            .reduce((sum, l) => sum + l.valor, 0);
        const totalOrcado = obra?.totalCost || 0;
        const saldoRestante = totalOrcado - totalPago;
        const percentualExecutado = totalOrcado > 0 ? Math.round((totalPago / totalOrcado) * 100) : 0;

        res.json({ totalPago, totalAPagar, saldoRestante, totalOrcado, percentualExecutado });
    } catch {
        res.status(500).json({ error: "Erro ao calcular resumo." });
    }
});

app.get("/api/financeiro/periodo", authMiddleware, async (req, res) => {
    try {
        const obraId = req.query.obraId as string;
        const inicio = req.query.inicio as string;
        const fim = req.query.fim as string;
        const companyId = req.auth!.companyId;

        const lancamentos = await prisma.lancamento.findMany({
            where: { obraId, companyId }
        });

        const filtered = lancamentos.filter(l => {
            return l.dataVencimento >= inicio && l.dataVencimento <= fim;
        });

        res.json(filtered);
    } catch {
        res.status(500).json({ error: "Erro." });
    }
});

app.get("/api/financeiro/desvio", authMiddleware, async (req, res) => {
    try {
        const obraId = req.query.obraId as string;
        const companyId = req.auth!.companyId;

        const obra = await prisma.obra.findFirst({ where: { id: obraId, companyId } });
        const lancamentos = await prisma.lancamento.findMany({ where: { obraId, companyId } });

        const totalOrcado = obra?.totalCost || 0;
        const totalRealizado = lancamentos
            .filter(l => l.tipo === "Despesa")
            .reduce((sum, l) => sum + l.valor, 0);
        const desvio = totalRealizado - totalOrcado;
        const desvioPercent = totalOrcado > 0 ? Math.round((desvio / totalOrcado) * 100) : 0;
        const classificacao = desvioPercent > 5 ? "Acima do orçamento" : desvioPercent < -5 ? "Abaixo do orçamento" : "Dentro do orçamento";

        res.json({ totalRealizado, desvio, desvioPercent, percentualDesvio: desvioPercent, classificacao });
    } catch {
        res.status(500).json({ error: "Erro." });
    }
});

app.get("/api/financeiro/fluxo-caixa", authMiddleware, async (req, res) => {
    try {
        const obraId = req.query.obraId as string;
        const companyId = req.auth!.companyId;

        const lancamentos = await prisma.lancamento.findMany({
            where: { obraId, companyId, status: "Pendente" }
        });
        const compras = await prisma.listaCompra.findMany({
            where: { obraId, companyId, status: "Planejado" }
        });
        const medicoes = await prisma.medicao.findMany({
            where: { obraId, companyId, status: "Pendente" }
        });

        const totalAPagar = lancamentos.reduce((sum, l) => sum + l.valor, 0);
        const comprasPlanejadas = compras.reduce((sum, c) => sum + c.valorPrevisto, 0);
        const medicoesPendentes = medicoes.reduce((sum, m) => sum + m.valorMedido, 0);
        const projecaoTotal = totalAPagar + comprasPlanejadas + medicoesPendentes;

        const risco = projecaoTotal > 100000 ? "Alto" : projecaoTotal > 50000 ? "Médio" : "Baixo";

        res.json({
            totalAPagar, comprasPlanejadas, medicoesPendentes, projecaoTotal, risco,
            itens: lancamentos.map(l => ({ descricao: l.descricao, valor: l.valor, tipo: l.tipo }))
        });
    } catch {
        res.status(500).json({ error: "Erro." });
    }
});

// ============ ALERTAS ROUTES ============

app.get("/api/alertas", authMiddleware, async (req, res) => {
    try {
        const obraId = req.query.obraId as string;
        const companyId = req.auth!.companyId;
        const alertas: any[] = [];

        // Check delayed etapas
        const today = new Date().toISOString().split("T")[0];
        const etapas = await prisma.etapa.findMany({ where: { obraId, companyId } });
        etapas.filter(e => e.dataFim < today && e.percentualExecutado < 100).forEach(e => {
            alertas.push({
                tipo: "etapa",
                titulo: `Etapa atrasada: ${e.nome}`,
                descricao: `Prazo final: ${e.dataFim}, Progresso: ${e.percentualExecutado}%`,
                severidade: "critical"
            });
        });

        // Check pending lancamentos
        const lancamentos = await prisma.lancamento.findMany({
            where: { obraId, companyId, status: "Pendente" }
        });
        lancamentos.filter(l => l.dataVencimento < today).forEach(l => {
            alertas.push({
                tipo: "atraso",
                titulo: `Lançamento atrasado: ${l.descricao}`,
                descricao: `Vencimento: ${l.dataVencimento}, Valor: R$ ${l.valor.toFixed(2)}`,
                severidade: "warning"
            });
        });

        // Check budget deviation
        const obra = await prisma.obra.findFirst({ where: { id: obraId, companyId } });
        const totalGasto = (await prisma.lancamento.findMany({ where: { obraId, companyId, tipo: "Despesa" } }))
            .reduce((sum, l) => sum + l.valor, 0);
        if (obra && totalGasto > obra.totalCost * 0.9 && obra.totalCost > 0) {
            alertas.push({
                tipo: "desvio",
                titulo: "Orçamento quase excedido",
                descricao: `Gasto: R$ ${totalGasto.toFixed(2)} / Orçamento: R$ ${obra.totalCost.toFixed(2)}`,
                severidade: totalGasto > obra.totalCost ? "critical" : "warning"
            });
        }

        res.json(alertas);
    } catch {
        res.status(500).json({ error: "Erro ao gerar alertas." });
    }
});

// ============ RELATORIO GERENCIAL ROUTES ============

app.get("/api/relatorio-gerencial", authMiddleware, async (req, res) => {
    try {
        const obraId = req.query.obraId as string;
        const companyId = req.auth!.companyId;

        const obra = await prisma.obra.findFirst({ where: { id: obraId, companyId } });
        if (!obra) { return res.status(404).json({ error: "Obra não encontrada." }); }

        const lancamentos = await prisma.lancamento.findMany({ where: { obraId, companyId } });
        const medicoes = await prisma.medicao.findMany({ where: { obraId, companyId } });
        const etapas = await prisma.etapa.findMany({ where: { obraId, companyId } });
        const compras = await prisma.listaCompra.findMany({ where: { obraId, companyId, status: "Planejado" } });
        const today = new Date().toISOString().split("T")[0];

        const totalPago = lancamentos.filter(l => l.status === "Pago" && l.tipo === "Despesa").reduce((s, l) => s + l.valor, 0);
        const totalPendente = lancamentos.filter(l => l.status === "Pendente").reduce((s, l) => s + l.valor, 0);
        const totalMedido = medicoes.reduce((s, m) => s + m.valorMedido, 0);
        const comprasFuturas = compras.reduce((s, c) => s + c.valorPrevisto, 0);
        const totalOrcado = obra.totalCost || 0;
        const progressoFinanceiro = totalOrcado > 0 ? Math.round((totalPago / totalOrcado) * 100) : 0;
        const desvioPercent = totalOrcado > 0 ? Math.round(((totalPago - totalOrcado) / totalOrcado) * 100) : 0;
        const etapasAtrasadas = etapas.filter(e => e.dataFim < today && e.percentualExecutado < 100).length;
        const alertasCriticos = etapasAtrasadas;
        const totalAlertas = etapasAtrasadas + lancamentos.filter(l => l.status === "Pendente" && l.dataVencimento < today).length;

        res.json({
            progressoFisico: obra.progress,
            progressoFinanceiro,
            desvioPercent,
            totalMedido,
            totalPago,
            totalPendente,
            comprasFuturas,
            statusGeral: obra.status,
            totalAlertas,
            alertasCriticos,
            etapasAtrasadas
        });
    } catch {
        res.status(500).json({ error: "Erro ao gerar relatório." });
    }
});

// ============ ACTIVITY LOG ROUTES ============

app.get("/api/activity-log", authMiddleware, async (req, res) => {
    try {
        const logs = await prisma.activityLog.findMany({
            where: { companyId: req.auth!.companyId },
            orderBy: { timestamp: "desc" },
            take: 100
        });
        res.json(logs);
    } catch {
        res.status(500).json({ error: "Erro ao buscar logs." });
    }
});

app.post("/api/activity-log", authMiddleware, async (req, res) => {
    try {
        const log = await prisma.activityLog.create({
            data: { ...req.body, companyId: req.auth!.companyId }
        });
        res.status(201).json(log);
    } catch (err: any) {
        res.status(400).json({ error: err.message || "Erro ao criar log." });
    }
});

// ============ HEALTH CHECK ============

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "connected"
    });
});

// ============ STATIC FILES (PRODUCTION) ============

if (process.env.NODE_ENV === "production") {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));

    app.get("*", (req, res) => {
        if (req.path.startsWith("/api") || req.path.startsWith("/auth")) {
            return res.status(404).json({ error: "Not found" });
        }
        res.sendFile(path.resolve(distPath, "index.html"));
    });
}

// ============ DATABASE INITIALIZATION ============

async function initializeDatabase() {
    try {
        console.log("🔄 Initializing database...");

        // Test database connection
        await prisma.$connect();
        console.log("✅ Database connected successfully");

        // Create default company if it doesn't exist
        let company = await prisma.company.findFirst();
        if (!company) {
            company = await prisma.company.create({
                data: {
                    name: "Construtora Principal",
                    cnpj: "00.000.000/0001-00"
                }
            });
            console.log("✅ Default company created:", company.name);
        } else {
            console.log("✅ Company exists:", company.name);
        }

        // Create default admin user if it doesn't exist
        const adminEmail = "admin@erp.com";
        let user = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (!user) {
            const hashedPassword = await bcrypt.hash("admin123", 10);
            user = await prisma.user.create({
                data: {
                    name: "Administrador",
                    email: adminEmail,
                    password: hashedPassword,
                    companyId: company.id
                }
            });
            console.log("✅ Default admin user created:");
            console.log("   📧 Email: admin@erp.com");
            console.log("   🔑 Password: admin123");
        } else {
            console.log("✅ Admin user already exists");
        }

        console.log("✅ Database initialization completed");
        return true;
    } catch (error) {
        console.error("❌ Database initialization failed:", error);
        return false;
    }
}

// ============ ERROR HANDLING ============

app.use((_err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ error: "Erro interno do servidor." });
});

// ============ SERVER STARTUP ============

async function startServer() {
    try {
        // Initialize database first
        const dbInitialized = await initializeDatabase();
        if (!dbInitialized) {
            console.error("❌ Failed to initialize database. Exiting...");
            process.exit(1);
        }

        // Start server
        const server = app.listen(PORT, () => {
            console.log(`🚀 ERP Server running on http://localhost:${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🔐 Login with: admin@erp.com / admin123`);
        });

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('🔄 SIGTERM received, shutting down gracefully...');
            server.close(() => {
                prisma.$disconnect();
                console.log('✅ Server closed');
                process.exit(0);
            });
        });

        process.on('SIGINT', async () => {
            console.log('🔄 SIGINT received, shutting down gracefully...');
            server.close(() => {
                prisma.$disconnect();
                console.log('✅ Server closed');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}

// Start the server
startServer();

export default app;