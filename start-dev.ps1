# Script PowerShell para iniciar o projeto

Write-Host "🚀 Iniciando ConstruBuild ERP..." -ForegroundColor Green

# Verificar se está no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: package.json não encontrado!" -ForegroundColor Red
    Write-Host "Certifique-se de estar no diretório Project-Obra" -ForegroundColor Yellow
    exit 1
}

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
        exit 1
    }
}

# Verificar se .env existe
if (-not (Test-Path ".env")) {
    Write-Host "📝 Criando arquivo .env..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item .env.example .env
        Write-Host "✅ Arquivo .env criado. Configure suas variáveis!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ .env.example não encontrado!" -ForegroundColor Yellow
    }
}

# Gerar Prisma Client
Write-Host "🔧 Gerando Prisma Client..." -ForegroundColor Yellow
npx prisma@5.22.0 generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao gerar Prisma Client!" -ForegroundColor Red
    exit 1
}

# Iniciar aplicação
Write-Host "🚀 Iniciando servidor..." -ForegroundColor Green
npm run dev
