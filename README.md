# ContractGuard - AI 合同审查与风险管理系统

企业级合同全生命周期管理平台，提供 AI 智能审查、风险识别、审批工作流等功能。

## 🚀 核心功能

### 文档管理
- ✅ **真实文件解析** - 支持 PDF、Word(.doc/.docx)、TXT 格式
- ✅ **智能文本提取** - 自动提取合同编号、金额、日期等关键信息
- ✅ **条款结构识别** - 自动识别合同条款层次结构
- ✅ **文件版本管理** - 支持合同版本对比

### AI 智能审查
- ✅ **多模型支持** - 支持 Qwen(通义千问)、DeepSeek、Mock 模式
- ✅ **规则引擎** - 14 条内置审查规则，覆盖常见法律风险
- ✅ **风险评级** - 高中低三级风险分类，量化评分
- ✅ **批注生成** - 自动在原文位置生成审查批注

### 协作审查
- ✅ **精准批注** - 批注关联到原文具体位置
- ✅ **多用户协作** - 支持业务、法务、财务、管理层多级审批
- ✅ **审批工作流** - 完整的审批流程（通过/驳回/退回）

### 用户认证
- ✅ **JWT 认证** - 安全的 Cookie-based 会话管理
- ✅ **角色权限** - 6 种角色（ADMIN/CEO/LEGAL_DIRECTOR/LEGAL_SPECIALIST/FINANCE/BUSINESS_USER）
- ✅ **路由保护** - 未登录自动重定向到登录页

## 🛠 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS + shadcn/ui
- **数据库**: PostgreSQL + Prisma ORM
- **AI**: Qwen / DeepSeek API
- **文件解析**: pdf-parse, mammoth

## 📦 快速开始

### 环境要求
- Node.js 18+
- PostgreSQL 14+ (可选，无数据库时自动使用 Mock 模式)

### 安装依赖
```bash
cd my-app
npm install
```

### 环境配置
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
# 数据库（可选）
DATABASE_URL="postgresql://user:password@localhost:5432/contractguard"

# AI 配置（至少配置一个）
QWEN_API_KEY="your-qwen-api-key"
AI_PROVIDER="qwen"

# 或 DeepSeek
DEEPSEEK_API_KEY="your-deepseek-api-key"

# 文件存储
FILE_STORAGE_PATH="./uploads"
```

### 数据库初始化
```bash
# 生成 Prisma 客户端
npm run db:generate

# 执行迁移（需要 DATABASE_URL）
npm run db:migrate

# 填充初始数据
npm run db:seed
```

### 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

## 📁 项目结构

```
my-app/
├── app/                    # Next.js 应用
│   ├── api/               # API 路由
│   │   ├── contract/      # 合同 CRUD + AI分析
│   │   ├── dashboard/     # 统计数据
│   │   ├── files/         # 文件访问
│   │   └── debug/         # 调试接口
│   ├── contracts/         # 合同列表/详情
│   ├── page.tsx           # Dashboard
│   └── layout.tsx         # 根布局
├── components/            # 组件
│   ├── ui/               # shadcn/ui 组件
│   └── upload-contract-dialog.tsx
├── lib/                   # 工具库
│   ├── ai-service.ts     # AI 服务
│   ├── file-parser.ts    # 文件解析
│   ├── file-storage.ts   # 文件存储
│   ├── text-utils.ts     # 文本处理
│   ├── rule-engine.ts    # 规则引擎
│   └── prisma.ts         # 数据库客户端
├── prisma/               # 数据库
│   ├── schema.prisma     # 数据模型
│   └── seed.ts           # 初始数据
├── constants/            # 常量
│   └── rules.ts          # 审查规则
├── types/                # TypeScript 类型
│   └── index.ts
└── uploads/              # 上传文件存储
```

## 🔧 配置说明

### AI 服务配置

支持三种模式：

1. **Qwen (推荐)** - 阿里云通义千问
   ```env
   QWEN_API_KEY=sk-xxxxxx
   AI_PROVIDER=qwen
   ```

2. **DeepSeek** - DeepSeek API
   ```env
   DEEPSEEK_API_KEY=sk-xxxxxx
   AI_PROVIDER=deepseek
   ```

3. **Mock (默认)** - 本地规则引擎，无需 API Key

### 数据库配置

- **有数据库**: 配置 `DATABASE_URL`，数据持久化存储
- **无数据库**: 不配置 `DATABASE_URL`，自动使用内存 Mock 模式（数据重启后丢失）

### 文件存储

默认使用本地文件系统存储：
```env
FILE_STORAGE_PATH=./uploads
```

文件访问路径：`/api/files/contracts/{fileId}`

## 🚀 部署

### Railway 部署

1. 创建 PostgreSQL 数据库服务
2. 配置环境变量：
   - `DATABASE_URL`
   - `QWEN_API_KEY` 或 `DEEPSEEK_API_KEY`
   - `AI_PROVIDER`
3. 部署命令：
   ```bash
   npm install
   npm run db:generate
   npm run build
   ```

### Docker 部署

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run db:generate
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 API 文档

### 合同相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/contract` | 获取合同列表 |
| POST | `/api/contract` | 上传新合同 |
| GET | `/api/contract/[id]` | 获取合同详情 |
| PATCH | `/api/contract/[id]` | 更新合同 |
| DELETE | `/api/contract/[id]` | 删除合同 |
| POST | `/api/contract/analyze` | AI 分析合同 |

### 批注相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/contract/[id]/annotate` | 获取批注列表 |
| POST | `/api/contract/[id]/annotate` | 添加批注 |
| PATCH | `/api/contract/[id]/annotate` | 更新批注状态 |

### 审批相关

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/contract/[id]/approve` | 审批合同（通过/驳回/退回） |

### 认证相关

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/logout` | 用户登出 |
| GET | `/api/auth/me` | 获取当前用户信息 |

### 文件访问

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/files/[...path]` | 获取/下载文件 |

## 👥 测试账号

系统预置了以下测试账号：

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 业务用户 | business@contractguard.com | password123 |
| 法务专员 | legal@contractguard.com | password123 |
| 法务总监 | director@contractguard.com | password123 |
| 管理员 | admin@contractguard.com | admin123 |

## 🔍 调试

访问 `/api/debug` 查看系统配置状态：
- AI 提供商配置
- 数据库连接状态
- 文件存储配置

## 📄 License

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request。

---

**ContractGuard** - 让合同审查更智能、更高效
