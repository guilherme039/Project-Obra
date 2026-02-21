# 📦 Guia de Instalação - ConstruBuild ERP

## Passo a Passo Completo

### 1. Instalar Dependências

```bash
npm install
```

Isso instalará todas as dependências necessárias, incluindo:
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting
- `dotenv` - Variáveis de ambiente
- E todas as outras dependências do projeto

### 2. Configurar Banco de Dados

#### Opção A: Usando PostgreSQL Local

1. Instale PostgreSQL se ainda não tiver
2. Crie um banco de dados:
```sql
CREATE DATABASE construbuild_erp;
```

3. Configure a `DATABASE_URL` no `.env`:
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/construbuild_erp"
DIRECT_URL="postgresql://usuario:senha@localhost:5432/construbuild_erp"
```

#### Opção B: Usando Supabase/Outro Serviço Cloud

1. Crie uma conta no serviço
2. Crie um novo projeto/banco
3. Copie a connection string
4. Configure no `.env`

### 3. Configurar Variáveis de Ambiente

1. Copie `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` com suas configurações:
```env
# Database
DATABASE_URL="sua-connection-string-aqui"
DIRECT_URL="sua-connection-string-aqui"

# JWT Secret (IMPORTANTE: Use um secret forte!)
JWT_SECRET="seu-secret-super-seguro-minimo-32-caracteres-aleatorios"

# CORS - Adicione seus domínios permitidos
ALLOWED_ORIGINS="http://localhost:8080,http://localhost:3000"

# Admin User (apenas desenvolvimento)
ADMIN_EMAIL="admin@erp.com"
ADMIN_PASSWORD="admin123"

# Environment
NODE_ENV="development"
PORT="3001"
```

### 4. Configurar Banco de Dados com Prisma

```bash
# Gerar Prisma Client
npm run prisma:generate

# Executar migrations (cria as tabelas)
npm run prisma:migrate

# OU apenas fazer push do schema (mais rápido para desenvolvimento)
npx prisma db push
```

### 5. Iniciar o Servidor

#### Desenvolvimento
```bash
npm run dev
```

Isso iniciará:
- Backend na porta 3001
- Frontend na porta 8080

#### Produção
```bash
# Build primeiro
npm run build

# Depois iniciar
npm start
```

### 6. Acessar a Aplicação

1. Abra seu navegador em: `http://localhost:8080`
2. Faça login com:
   - Email: `admin@erp.com`
   - Senha: `admin123`

### 7. Verificar se Está Funcionando

1. Acesse o health check: `http://localhost:3001/health`
2. Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "...",
  "database": "connected"
}
```

## 🔧 Troubleshooting

### Erro: "Cannot find module"
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Prisma Client not generated"
```bash
npm run prisma:generate
```

### Erro: "Database connection failed"
- Verifique se o PostgreSQL está rodando
- Verifique se a `DATABASE_URL` está correta
- Teste a conexão manualmente

### Erro: "Port already in use"
- Mude a porta no `.env` ou
- Pare o processo que está usando a porta

### Erro de CORS
- Adicione sua URL ao `ALLOWED_ORIGINS` no `.env`
- Reinicie o servidor após alterar

## ✅ Checklist de Instalação

- [ ] Node.js 18+ instalado
- [ ] PostgreSQL instalado e rodando
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado
- [ ] Banco de dados criado
- [ ] Prisma migrations executadas
- [ ] Servidor iniciado (`npm run dev`)
- [ ] Health check funcionando
- [ ] Login funcionando

## 🚀 Próximos Passos

Após a instalação bem-sucedida:

1. **Altere a senha padrão** do admin
2. **Configure o SMTP** se quiser envio de emails
3. **Revise as configurações de segurança** para produção
4. **Configure backups** do banco de dados
5. **Leia a documentação** da API no README

---

**Problemas?** Abra uma issue no repositório!
