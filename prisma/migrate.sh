#!/bin/bash
# 数据库迁移脚本

echo "=== ContractGuard 数据库迁移 ==="

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️ 警告: 未设置 DATABASE_URL 环境变量"
  echo "将使用 Mock 模式运行"
  exit 0
fi

echo "正在生成 Prisma 客户端..."
npx prisma generate

echo "正在执行数据库迁移..."
npx prisma migrate dev --name init

echo "正在填充初始数据..."
npx tsx prisma/seed.ts

echo "✅ 数据库迁移完成"
