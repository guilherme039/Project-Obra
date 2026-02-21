# Script PowerShell para instalar dependências corretamente

Write-Host "📦 Instalando dependências do ConstruBuild ERP..." -ForegroundColor Green

# Verificar se está no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: package.json não encontrado!" -ForegroundColor Red
    Write-Host "Certifique-se de estar no diretório Project-Obra" -ForegroundColor Yellow
    exit 1
}

# Limpar instalações anteriores (opcional)
Write-Host "🧹 Limpando instalações anteriores..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
}

# Instalar dependências
Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
    exit 1
}

# Verificar instalação do Prisma
Write-Host "🔍 Verificando versão do Prisma..." -ForegroundColor Yellow
$prismaVersion = npm list prisma 2>&1 | Select-String "prisma@"
Write-Host $prismaVersion

# Verificar instalação do concurrently
Write-Host "🔍 Verificando instalação do concurrently..." -ForegroundColor Yellow
$concurrently = npm list concurrently 2>&1 | Select-String "concurrently@"
Write-Host $concurrently

Write-Host "✅ Dependências instaladas com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Configure o arquivo .env (copie de .env.example)" -ForegroundColor White
Write-Host "2. Execute: npx prisma@5.22.0 generate" -ForegroundColor White
Write-Host "3. Execute: npx prisma@5.22.0 migrate dev" -ForegroundColor White
Write-Host "4. Execute: npm run dev" -ForegroundColor White
