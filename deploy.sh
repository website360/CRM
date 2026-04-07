#!/bin/bash
# ===========================================
# Script de deploy para Digital Ocean
# Execute no servidor após clonar o repositório
# ===========================================

set -e

echo "=== CRM LP - Deploy ==="

# 1. Instalar dependências
echo "→ Instalando dependências..."
npm ci

# 2. Gerar Prisma Client
echo "→ Gerando Prisma Client..."
npx prisma generate

# 3. Rodar migrations no banco Supabase
echo "→ Aplicando migrations no banco..."
npx prisma migrate deploy

# 4. Build da aplicação
echo "→ Fazendo build..."
npm run build

# 5. Reiniciar com PM2
echo "→ Reiniciando aplicação com PM2..."
pm2 delete crm-lp 2>/dev/null || true
pm2 start .next/standalone/server.js --name crm-lp --env production
pm2 save

echo ""
echo "=== Deploy concluído! ==="
echo "Aplicação rodando na porta 3000"
echo "Use 'pm2 logs crm-lp' para ver os logs"
