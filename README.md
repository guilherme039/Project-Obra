# ConstruBuild ERP

Sistema Integrado de Gestão Empresarial (ERP) desenvolvido especialmente para o setor de construção civil.

## 🚀 Sobre o Projeto

O ConstruBuild ERP é uma solução completa para gerenciamento de obras, insumos, equipes e controle financeiro de projetos de engenharia, com foco na otimização de processos e controle financeiro.

## ✨ Funcionalidades

- ✅ **Gestão de Obras**: Controle completo de projetos de construção
- ✅ **Etapas e Medições**: Acompanhamento detalhado do progresso
- ✅ **Cotações**: Gestão de cotações de fornecedores
- ✅ **Financeiro**: Controle de receitas, despesas e fluxo de caixa
- ✅ **Clientes e Fornecedores**: Cadastro completo
- ✅ **Relatórios**: Relatórios gerenciais e semanais
- ✅ **Alertas**: Sistema de alertas para etapas atrasadas e desvios
- ✅ **Multi-tenant**: Suporte a múltiplas empresas

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Vite** - Build tool
- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **shadcn-ui** - Componentes UI
- **Tailwind CSS** - Estilização
- **React Router DOM** - Roteamento
- **TanStack Query** - Gerenciamento de estado servidor
- **Zod** - Validação de schemas

### Backend
- **Express.js** - Framework Node.js
- **Prisma ORM** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **Helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **Zod** - Validação de dados

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

## 🔧 Instalação e Configuração

### 1. Clone o repositório

```bash
git clone <SEU_GIT_URL>
cd construbuild-erp
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
DIRECT_URL="postgresql://user:password@localhost:5432/dbname"

# JWT Secret (MUDE EM PRODUÇÃO!)
JWT_SECRET="seu-secret-super-seguro-aqui-minimo-32-caracteres"

# CORS
ALLOWED_ORIGINS="http://localhost:8080,http://localhost:3000"

# Admin User (apenas desenvolvimento)
ADMIN_EMAIL="admin@erp.com"
ADMIN_PASSWORD="admin123"

# Environment
NODE_ENV="development"
PORT="3001"
```

### 4. Configure o banco de dados

```bash
# Gerar Prisma Client
npm run prisma:generate

# Executar migrations
npm run prisma:migrate

# Ou apenas fazer push do schema
npm run db:setup
```

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

O servidor estará rodando em:
- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:3001

## 🔐 Credenciais Padrão

**⚠️ IMPORTANTE**: Altere as credenciais padrão em produção!

- **Email**: admin@erp.com
- **Senha**: admin123

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia frontend + backend em modo watch

# Build
npm run build        # Build para produção

# Produção
npm start            # Inicia servidor de produção

# Banco de Dados
npm run db:setup     # Configura banco de dados
npm run db:reset     # Reseta banco de dados
npm run prisma:generate  # Gera Prisma Client
npm run prisma:migrate    # Executa migrations

# Testes
npm test             # Executa testes
npm run test:watch   # Executa testes em modo watch

# Linting
npm run lint         # Executa ESLint
```

## 🧪 Testes

O projeto inclui testes básicos para autenticação e CRUD de obras:

```bash
npm test
```

## 🔒 Segurança

O projeto implementa várias medidas de segurança:

- ✅ **JWT Authentication** - Tokens seguros para autenticação
- ✅ **Rate Limiting** - Proteção contra brute force
- ✅ **Helmet.js** - Security headers
- ✅ **CORS** - Configuração adequada de origens permitidas
- ✅ **Validação Zod** - Validação de todos os inputs
- ✅ **bcrypt** - Hash seguro de senhas
- ✅ **TypeScript Strict** - Type safety

## 📁 Estrutura do Projeto

```
Project-Obra/
├── src/                    # Frontend React
│   ├── pages/             # Páginas principais
│   ├── components/        # Componentes UI
│   ├── services/          # Serviços API
│   ├── contexts/          # Context API
│   ├── hooks/             # Custom hooks
│   └── types/             # TypeScript types
├── server/                # Backend
│   ├── schemas/          # Schemas Zod
│   ├── middlewares/      # Middlewares
│   └── utils/            # Utilitários
├── prisma/               # Schema do banco
│   └── schema.prisma
├── server.ts             # Servidor Express principal
└── package.json
```

## 🚀 Deploy

### Build para Produção

```bash
npm run build
npm start
```

### Variáveis de Ambiente em Produção

Certifique-se de configurar todas as variáveis de ambiente em produção, especialmente:

- `JWT_SECRET` - Deve ser um secret forte e único
- `DATABASE_URL` - URL do banco de dados de produção
- `NODE_ENV=production`
- `ALLOWED_ORIGINS` - Domínios permitidos para CORS

## 📊 API Endpoints

### Autenticação
- `POST /auth/login` - Login
- `POST /auth/register` - Registro

### Obras
- `GET /api/obras` - Listar obras (com paginação)
- `GET /api/obras/:id` - Obter obra por ID
- `POST /api/obras` - Criar obra
- `PUT /api/obras/:id` - Atualizar obra
- `DELETE /api/obras/:id` - Deletar obra

### Outros endpoints disponíveis:
- `/api/clientes` - Gestão de clientes
- `/api/fornecedores` - Gestão de fornecedores
- `/api/lancamentos` - Lançamentos financeiros
- `/api/etapas` - Etapas de obras
- `/api/medicoes` - Medições
- `/api/cotacoes` - Cotações
- `/api/relatorios` - Relatórios semanais
- `/api/financeiro/*` - Endpoints financeiros
- `/api/alertas` - Sistema de alertas

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 🐛 Problemas Conhecidos

Nenhum problema conhecido no momento.

## 📞 Suporte

Para suporte, abra uma issue no repositório.

---

**Desenvolvido com ❤️ para o setor de construção civil**
