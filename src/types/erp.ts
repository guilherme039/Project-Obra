// Types for the ERP system

export interface Company {
  id: string;
  name: string;
  createdAt?: string;
}

export interface User {
  id: string;
  companyId: string;
  name: string;
  email: string;
  password?: string; // Optional for frontend
  role?: "admin" | "user";
  avatar?: string;
  obraId?: string;
  createdAt?: string;
}

export interface Obra {
  id: string;
  companyId: string;
  name: string;
  materialsCost: number;
  laborCost: number;
  totalCost: number;
  progress: number;
  startDate?: string;
  endDate?: string;
  status: "Em andamento" | "Concluida" | "Pausada";

  // Optional fields
  client?: string;
  address?: string;
  cep?: string;
  number?: string;
  complement?: string;
  description?: string;
  imageUrl?: string;

  // Relations (optional/loaded)
  users?: UserObra[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Cliente {
  id: string;
  companyId: string;
  nome: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
  createdAt?: string;
}

export interface Finance {
  id: string;
  type: "entrada" | "saida";
  amount: number;
  obraId: string;
  companyId: string;
  obra?: Obra;
}

export interface UserObra {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  obraId?: string;
  createdAt?: string;
}

export interface Lancamento {
  id: string;
  companyId: string;
  obraId: string;
  obraNome?: string;
  tipo: "Receita" | "Despesa";
  fornecedorId?: string;
  fornecedorNome?: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: "Pendente" | "Pago" | "Atrasado";
  categoria?: string;
  parcela?: number;
  totalParcelas?: number;
  createdAt: string;
}

export interface Fornecedor {
  id: string;
  companyId: string;
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  createdAt: string;
}

export interface AuthState {
  user: Omit<User, "password"> | null;
  isAuthenticated: boolean;
}

export interface RelatorioSemanal {
  id: string;
  obraId: string;
  companyId: string;
  semanaInicio: string;
  semanaFim: string;
  descricaoAtividades: string;
  fotos: string[];
  observacoesTecnicas: string;
  criadoPor: string;
  criadoPorNome: string;
  createdAt: string;
}

export interface Medicao {
  id: string;
  obraId: string;
  companyId: string;
  etapaId?: string;
  descricao: string;
  percentualExecutado: number;
  valorMedido: number;
  dataMedicao: string;
  status: "Pendente" | "Aprovado" | "Pago";
  lancamentoGeradoId?: string;
  createdAt: string;
}

export interface ComentarioObra {
  id: string;
  obraId: string;
  companyId: string;
  usuarioId: string;
  usuarioNome: string;
  comentario: string;
  dataCriacao: string;
  oculto: boolean;
}

export interface ListaCompra {
  id: string;
  obraId: string;
  companyId: string;
  etapaId?: string;
  descricao: string;
  valorPrevisto: number;
  dataPrevista: string;
  status: "Planejado" | "Comprado";
  createdAt: string;
}

export interface Etapa {
  id: string;
  obraId: string;
  companyId: string;
  nome: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  percentualPrevisto: number;
  percentualExecutado: number;
  ordem: number;
  createdAt: string;
  // Relations
  obra?: { name: string };
}

export interface Cotacao {
  id: string;
  obraId: string;
  companyId: string;
  fornecedorId: string;
  fornecedorNome?: string;
  descricao: string;
  valor: number;
  status: "Solicitado" | "Recebido" | "Aprovado" | "Rejeitado";
  criadoEm: string;
  createdAt: string;
  // Relations
  obra?: { name: string };
  fornecedor?: { nome: string };
}

export interface NotaFiscal {
  id: string;
  obraId: string;
  companyId: string;
  numero: string;
  fornecedorId: string;
  fornecedorNome?: string;
  valor: number;
  dataEmissao: string;
  arquivoURL?: string;
  lancamentoId?: string;
  createdAt: string;
  // Relations
  obra?: { name: string };
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  companyId: string;
  action: "create" | "update" | "delete";
  entity: string;
  entityId: string;
  entityName: string;
  timestamp: string;
}
