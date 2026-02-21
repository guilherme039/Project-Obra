# 🚀 GUIA RÁPIDO DE SETUP

## ⚠️ PROBLEMAS COMUNS E SOLUÇÕES

### Problema 1: Prisma versão errada
O npm pode instalar Prisma 7, mas o projeto usa Prisma 5.

**Solução:**
```powershell
# Desinstalar Prisma global se tiver
npm uninstall -g prisma

# Usar a versão local do projeto
npx prisma@5.22.0 generate
npx prisma@5.22.0 migrate dev
```

### Problema 2: concurrently não encontrado
**Solução:**
```powershell
npm install
```

## 📋 PASSOS CORRETOS DE INSTALAÇÃO

### 1. Limpar e reinstalar dependências
```powershell
cd "C:\Users\Quinta Davo\Downloads\Project-Obras\Project-Obra"
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
```

### 2. Configurar .env
```powershell
Copy-Item .env.example .env
notepad .env
```

### 3. Gerar Prisma Client (usando versão correta)
```powershell
npx prisma@5.22.0 generate
```

### 4. Executar migrations
```powershell
npx prisma@5.22.0 migrate dev
```

### 5. Iniciar aplicação
```powershell
npm run dev
```

## 🔧 SE AINDA NÃO FUNCIONAR

### Opção A: Usar scripts diretos
```powershell
# Terminal 1 - Backend
npx tsx watch server.ts

# Terminal 2 - Frontend  
npx vite
```

### Opção B: Verificar instalação
```powershell
npm list prisma
npm list concurrently
```

Se não aparecerem, execute:
```powershell
npm install prisma@5.22.0 concurrently@8.2.2 --save-dev
```
