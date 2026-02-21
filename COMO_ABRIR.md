# Como abrir o projeto (npm run dev)

## 1. Abrir no diretório certo
```powershell
cd "C:\Users\Quinta Davo\Downloads\Project-Obras\Project-Obra"
```

## 2. Instalar dependências (só na primeira vez ou depois de apagar node_modules)
```powershell
npm install
```

## 3. Abrir a aplicação
```powershell
npm run dev
```

O front sobe em **http://localhost:8080** e o backend em **http://localhost:3001**.

---

## Se der erro

### "concurrently não é reconhecido"
Já está corrigido: o script usa `npx concurrently`. Se ainda falhar:
```powershell
npm install
npm run dev
```

### "Cannot find package 'vite'"
`node_modules` está incompleto. Faça:
```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
npm run dev
```

### "Can't reach database server at localhost:5432"
O `.env` está apontando para localhost. Se você usa Supabase/outro servidor, edite o `.env` e coloque de volta a sua `DATABASE_URL` e `DIRECT_URL` corretas. Não use os valores do `.env.example` se o seu banco for remoto.

### "bun não é reconhecido"
Pode ignorar se aparecer durante o Prisma. O projeto usa Node/npm. Para gerar o client do Prisma use:
```powershell
npx prisma generate
```
e depois `npm run dev`.
