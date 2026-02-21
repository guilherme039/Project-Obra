
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, PrivateRoute } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import Obras from "./pages/Obras";
import ObraDetalhe from "./pages/ObraDetalhe";
import Cotacoes from "./pages/Cotacoes";
import Controle from "./pages/Controle";
import Documentos from "./pages/Documentos";
import Gestao from "./pages/Gestao";
import Financeiro from "./pages/Financeiro";
import Clientes from "./pages/Clientes";
import Fornecedores from "./pages/Fornecedores";
import Relatorios from "./pages/Relatorios";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />

              <Route element={<PrivateRoute />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/obras" element={<Obras />} />
                <Route path="/obras/:id" element={<ObraDetalhe />} />
                <Route path="/cotacoes" element={<Cotacoes />} />
                <Route path="/controle" element={<Controle />} />
                <Route path="/documentos" element={<Documentos />} />
                <Route path="/gestao" element={<Gestao />} />
                <Route path="/financeiro" element={<Financeiro />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/fornecedores" element={<Fornecedores />} />
                <Route path="/relatorios" element={<Relatorios />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
