# 🔧 CORREÇÕES CRÍTICAS - Guia de Implementação

Este documento contém exemplos de código para corrigir os problemas críticos identificados na auditoria.

---

## 1. 🔐 JWT_SECRET em Variável de Ambiente

### ❌ ANTES (server.ts)
```typescript
const JWT_SECRET = "erp-secret-key-change-in-production";
```

### ✅ DEPOIS
```typescript
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error("JWT_SECRET deve ser configurado em produção");
  }
  console.warn("⚠️ Usando JWT_SECRET padrão (apenas desenvolvimento)");
  return "erp-secret-key-change-in-production";
})();
```

### 📝 Atualizar .env
```env
JWT_SECRET="seu-secret-super-seguro-aqui-minimo-32-caracteres"
```

---

## 2. 🛡️ CORS Configurado Corretamente

### ❌ ANTES
```typescript
app.use(cors());
```

### ✅ DEPOIS
```typescript
import cors from "cors";

const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:8080',
      'http://localhost:3000'
    ];
    
    // Permitir requisições sem origin (mobile apps, Postman, etc) apenas em desenvolvimento
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

### 📝 Atualizar .env
```env
ALLOWED_ORIGINS="http://localhost:8080,https://seu-dominio.com"
```

---

## 3. 🚦 Rate Limiting

### 📦 Instalar dependência
```bash
npm install express-rate-limit
npm install -D @types/express-rate-limit
```

### ✅ Implementação
```typescript
import rateLimit from 'express-rate-limit';

// Rate limiter geral
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por IP
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para login (mais restritivo)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  skipSuccessfulRequests: true, // Não contar tentativas bem-sucedidas
});

// Rate limiter para registro
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 registros por hora
  message: 'Muitas tentativas de registro. Tente novamente em 1 hora.',
});

// Aplicar
app.use('/api', generalLimiter);
app.post('/auth/login', loginLimiter, async (req, res) => { ... });
app.post('/auth/register', registerLimiter, async (req, res) => { ... });
```

---

## 4. 🪖 Helmet.js (Security Headers)

### 📦 Instalar dependência
```bash
npm install helmet
npm install -D @types/helmet
```

### ✅ Implementação
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Ajustar conforme necessário
}));
```

---

## 5. ✅ Validação com Zod

### 📦 Zod já está instalado, criar schemas

### ✅ Criar arquivo `server/schemas/auth.ts`
```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

export const registerSchema = z.object({
  companyName: z.string().min(2, 'Nome da empresa é obrigatório').optional(),
  companyCnpj: z.string().optional(),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
});
```

### ✅ Criar arquivo `server/schemas/obra.ts`
```typescript
import { z } from 'zod';

export const createObraSchema = z.object({
  name: z.string().min(1, 'Nome da obra é obrigatório'),
  materialsCost: z.number().min(0, 'Custo de materiais deve ser positivo').optional(),
  laborCost: z.number().min(0, 'Custo de mão de obra deve ser positivo').optional(),
  totalCost: z.number().min(0, 'Custo total deve ser positivo').optional(),
  progress: z.number().min(0).max(100, 'Progresso deve estar entre 0 e 100'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['Em andamento', 'Concluida', 'Pausada']),
  client: z.string().optional(),
  address: z.string().optional(),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido').optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url('URL de imagem inválida').optional(),
});
```

### ✅ Usar nos endpoints
```typescript
import { loginSchema, registerSchema } from './schemas/auth';
import { createObraSchema } from './schemas/obra';

app.post("/auth/login", loginLimiter, async (req, res) => {
  try {
    // Validar input
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: validation.error.errors 
      });
    }

    const { email, password } = validation.data;
    // ... resto do código
  } catch (err) {
    // ...
  }
});

app.post("/api/obras", authMiddleware, async (req, res) => {
  try {
    const validation = createObraSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: validation.error.errors 
      });
    }

    const data = validation.data;
    // ... resto do código
  } catch (err) {
    // ...
  }
});
```

---

## 6. 🔒 Middleware de Autorização

### ✅ Criar arquivo `server/middlewares/authorization.ts`
```typescript
import { Request, Response, NextFunction } from 'express';

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ 
        error: 'Acesso negado. Permissão insuficiente.' 
      });
    }

    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  return requireRole('admin')(req, res, next);
}
```

### ✅ Usar nos endpoints
```typescript
import { requireAdmin } from './middlewares/authorization';

app.post("/api/users", authMiddleware, requireAdmin, async (req, res) => {
  // Apenas admins podem criar usuários
});
```

---

## 7. 📝 Tratamento de Erros Centralizado

### ✅ Criar arquivo `server/middlewares/errorHandler.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log do erro
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Erro de validação Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.errors,
    });
  }

  // Erro de autenticação
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token inválido' });
  }

  // Erro de autorização
  if (err.name === 'UnauthorizedError') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  // Erro genérico
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : err.message,
  });
}
```

### ✅ Usar no server.ts
```typescript
import { errorHandler } from './middlewares/errorHandler';

// No final do arquivo, antes de startServer()
app.use(errorHandler);
```

---

## 8. 🗄️ Transações Prisma

### ✅ Exemplo: Aprovar Cotação com Transação
```typescript
app.post("/api/cotacoes/:id/aprovar", authMiddleware, async (req, res) => {
  try {
    const cotacao = await prisma.cotacao.findFirst({
      where: { id: req.params.id, companyId: req.auth!.companyId }
    });
    
    if (!cotacao) {
      return res.status(404).json({ error: "Cotação não encontrada." });
    }

    // Usar transação para garantir atomicidade
    const result = await prisma.$transaction(async (tx) => {
      // Criar lançamento
      const obra = await tx.obra.findFirst({ 
        where: { id: cotacao.obraId } 
      });

      const lancamento = await tx.lancamento.create({
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

      // Criar item na lista de compras
      await tx.listaCompra.create({
        data: {
          obraId: cotacao.obraId,
          companyId: req.auth!.companyId,
          descricao: cotacao.descricao,
          valorPrevisto: cotacao.valor,
          dataPrevista: new Date().toISOString().split("T")[0],
          status: "Planejado"
        }
      });

      // Atualizar status da cotação
      const updatedCotacao = await tx.cotacao.update({
        where: { id: req.params.id },
        data: { status: "Aprovado" }
      });

      return { cotacao: updatedCotacao, lancamento };
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Erro ao aprovar." });
  }
});
```

---

## 9. 📄 Paginação

### ✅ Helper de Paginação
```typescript
// server/utils/pagination.ts
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function getPaginationParams(req: any): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  return { page, limit };
}
```

### ✅ Usar nas rotas GET
```typescript
import { getPaginationParams } from './utils/pagination';

app.get("/api/obras", authMiddleware, async (req, res) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const skip = (page - 1) * limit;

    const [obras, total] = await Promise.all([
      prisma.obra.findMany({
        where: { companyId: req.auth!.companyId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.obra.count({
        where: { companyId: req.auth!.companyId }
      })
    ]);

    res.json({
      data: obras,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch {
    res.status(500).json({ error: "Erro ao buscar obras." });
  }
});
```

---

## 10. 📝 .env.example

### ✅ Criar arquivo `.env.example`
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?pgbouncer=true"
DIRECT_URL="postgresql://user:password@localhost:5432/dbname"

# JWT
JWT_SECRET="change-this-to-a-random-secret-minimum-32-characters"

# CORS
ALLOWED_ORIGINS="http://localhost:8080,http://localhost:3000"

# SMTP (Email)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="user@example.com"
SMTP_PASS="password"

# Environment
NODE_ENV="development"
PORT="3001"
```

---

## 11. 🚫 Atualizar .gitignore

### ✅ Adicionar ao `.gitignore`
```
# Environment variables
.env
.env.local
.env.*.local
.env.production

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Debug
debug_obras.txt
```

---

## 📋 Checklist de Implementação

- [ ] Mover JWT_SECRET para variável de ambiente
- [ ] Configurar CORS adequadamente
- [ ] Adicionar Rate Limiting
- [ ] Instalar e configurar Helmet.js
- [ ] Criar schemas Zod para todas as rotas
- [ ] Implementar middleware de autorização
- [ ] Criar tratamento de erros centralizado
- [ ] Adicionar transações onde necessário
- [ ] Implementar paginação nas rotas GET
- [ ] Criar `.env.example`
- [ ] Atualizar `.gitignore`
- [ ] Remover console.log e implementar logging adequado

---

**Próximo passo:** Após implementar estas correções, executar novamente a auditoria para verificar se todos os problemas críticos foram resolvidos.
