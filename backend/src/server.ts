import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "./routes/auth";
import obrasRoutes from "./routes/obras";
import etapasRoutes from "./routes/etapas";
import medicoesRoutes from "./routes/medicoes";
import lancamentosRoutes from "./routes/lancamentos";
import clientesRoutes from "./routes/clientes";
import fornecedoresRoutes from "./routes/fornecedores";
import cotacoesRoutes from "./routes/cotacoes";
import listaComprasRoutes from "./routes/lista-compras";
import notasFiscaisRoutes from "./routes/notas-fiscais";
import relatoriosRoutes from "./routes/relatorios";
import comentariosRoutes from "./routes/comentarios";
import financeiroRoutes from "./routes/financeiro";
import alertasRoutes from "./routes/alertas";
import relatorioGerencialRoutes from "./routes/relatorio-gerencial";
import activityLogRoutes from "./routes/activity-log";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));

// Public routes
app.use("/auth", authRoutes);

// Protected routes
app.use("/api/obras", obrasRoutes);
app.use("/api/etapas", etapasRoutes);
app.use("/api/medicoes", medicoesRoutes);
app.use("/api/lancamentos", lancamentosRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/fornecedores", fornecedoresRoutes);
app.use("/api/cotacoes", cotacoesRoutes);
app.use("/api/lista-compras", listaComprasRoutes);
app.use("/api/notas-fiscais", notasFiscaisRoutes);
app.use("/api/relatorios", relatoriosRoutes);
app.use("/api/comentarios", comentariosRoutes);
app.use("/api/financeiro", financeiroRoutes);
app.use("/api/alertas", alertasRoutes);
app.use("/api/relatorio-gerencial", relatorioGerencialRoutes);
app.use("/api/activity-log", activityLogRoutes);

// Health check
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled error:", err.message);
    res.status(500).json({ error: "Erro interno do servidor." });
});

app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
});

export default app;
