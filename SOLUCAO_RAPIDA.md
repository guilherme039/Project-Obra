# ⚡ SOLUÇÃO RÁPIDA - Problemas de Instalação

## 🔴 PROBLEMAS IDENTIFICADOS

1. **Prisma 7 instalado** mas projeto usa Prisma 5
2. **concurrently não encontrado**

## ✅ SOLUÇÃO PASSO A PASSO

### Passo 1: Entrar no diretório correto
```powershell
cd "C:\Users\Quinta Davo\Downloads\Project-Obras\Project-Obra"
```

### Passo 2: Limpar e reinstalar dependências
```powershell
# Opção A: Usar o script automático
.\install-deps.ps1

# Opção B: Manual
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
```

### Passo 3: Configurar .env
```powershell
Copy-Item .env.example .env
notepad .env
```

**Configure pelo menos:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
DIRECT_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET="seu-secret-aqui-minimo-32-caracteres"
```

### Passo 4: Gerar Prisma Client (VERSÃO CORRETA)
```powershell
npx prisma@5.22.0 generate
```

### Passo 5: Executar Migrations
```powershell
npx prisma@5.22.0 migrate dev
```

### Passo 6: Iniciar Aplicação

**Opção A: Usar script automático**
```powershell
.\start-dev.ps1
```

**Opção B: Manual**
```powershell
npm run dev
```

**Opção C: Se concurrently não funcionar, use 2 terminais:**

**Terminal 1 (Backend):**
```powershell
npx tsx watch server.ts
```

**Terminal 2 (Frontend):**
```powershell
npx vite
```

## 🎯 COMANDOS COMPLETOS (COPIE E COLE)

```powershell
# 1. Entrar no diretório
cd "C:\Users\Quinta Davo\Downloads\Project-Obras\Project-Obra"

# 2. Limpar e reinstalar
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install

# 3. Configurar .env
Copy-Item .env.example .env

# 4. Gerar Prisma (VERSÃO CORRETA)
npx prisma@5.22.0 generate

# 5. Migrations
npx prisma@5.22.0 migrate dev

# 6. Iniciar
npm run dev
```

## 🔧 SE AINDA DER ERRO

### Erro: "concurrently não encontrado"
```powershell
npm install concurrently@8.2.2 --save-dev
```

### Erro: "Prisma versão errada"
```powershell
npm install prisma@5.22.0 @prisma/client@5.22.0 --save-dev
npx prisma@5.22.0 generate
```

### Erro: "Cannot find module"
```powershell
npm install
npm run prisma:generate
```

## ✅ VERIFICAÇÃO

Após executar os comandos, verifique:

1. ✅ `node_modules` existe
2. ✅ `.env` existe e está configurado
3. ✅ Prisma Client gerado (`node_modules/.prisma/client`)
4. ✅ Banco de dados conectado

## 📞 AINDA COM PROBLEMAS?

Execute e envie o resultado:
```powershell
npm list prisma
npm list concurrently
node --version
npm --version
```
