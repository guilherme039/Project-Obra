# Changelog

## [1.0.0] - 2026-02-21

### 🔒 Segurança
- ✅ Movido JWT_SECRET para variável de ambiente
- ✅ Implementado CORS configurável
- ✅ Adicionado Rate Limiting (express-rate-limit)
- ✅ Implementado Helmet.js para security headers
- ✅ Validação Zod em todas as rotas API
- ✅ Middleware de autorização por roles
- ✅ Senha padrão removida do código (configurável via env)

### 🛠️ Melhorias
- ✅ TypeScript strict mode habilitado
- ✅ Removidos console.log de produção
- ✅ Tratamento de erros centralizado
- ✅ Paginação implementada nas rotas GET
- ✅ Transações Prisma onde necessário
- ✅ Validação completa de inputs com Zod

### 📝 Documentação
- ✅ README atualizado com instruções completas
- ✅ .env.example criado
- ✅ .gitignore atualizado para proteger .env

### 🧪 Testes
- ✅ Testes de autenticação adicionados
- ✅ Testes de CRUD de obras adicionados

### 🏗️ Estrutura
- ✅ Schemas Zod organizados em `server/schemas/`
- ✅ Middlewares organizados em `server/middlewares/`
- ✅ Utilitários organizados em `server/utils/`

### 📦 Dependências
- ✅ Adicionado `helmet` para segurança
- ✅ Adicionado `express-rate-limit` para rate limiting
- ✅ `dotenv` já estava instalado, agora configurado corretamente

---

## [0.0.0] - Versão Inicial

Versão inicial do projeto com funcionalidades básicas.
