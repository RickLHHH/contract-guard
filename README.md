# ContractGuard - AI合同审查与风险管理系统

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/DeepSeek-AI-green?style=flat-square" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma" />
  <img src="https://img.shields.io/badge/shadcn/ui-Components-000000?style=flat-square" />
</p>

ContractGuard 是面向中大型企业法务部门的智能合同审查与协作平台，通过AI技术实现合同风险自动识别、审批流程自动化、知识库沉淀。

## ✨ 核心功能

### 🤖 AI 智能审查
- **双轨制审查引擎**：规则引擎快速响应 + DeepSeek AI 深度分析
- **风险自动识别**：智能识别法律、财务、商业风险
- **修改建议生成**：基于法条和案例给出专业修改建议
- **风险评分系统**：0-100分量化评估合同风险

### 📝 合同审查编辑器
- **三栏布局设计**：文档预览 + 批注列表 + AI建议
- **文本锚定批注**：精确到字符位置的批注系统
- **多层级权限**：内部批注 vs 外部可见批注
- **AI 辅助协作**：法务与业务人员在线协作

### 🔄 可视化审批流
- **动态流程图**：ReactFlow 实现的交互式审批流
- **多角色审批**：法务专员 → 法务总监 → 财务 → CEO
- **条件分支**：根据金额、风险等级自动路由
- **实时状态追踪**：审批进度可视化

### 📊 数据仪表盘
- **风险分布分析**：饼图展示高风险/中风险/低风险合同分布
- **月度趋势**：合同数量趋势分析
- **待办提醒**：待审查、待审批合同统计
- **团队效率**：审查时效、采纳率等关键指标

### 📚 知识库管理
- **合同模板库**：标准合同模板快速复用
- **公司制度库**：内部制度文档管理
- **历史案例库**：合同纠纷案例沉淀
- **条款库**：常用条款片段管理

### 🔄 版本管理
- **Diff 对比**：Google diff-match-patch 文本对比
- **版本树**：可视化展示合同修改历史
- **变更追踪**：新增、删除、修改内容高亮

## 🛠️ 技术栈

| 技术领域 | 选型 | 说明 |
|---------|------|------|
| 框架 | Next.js 14 (App Router) | 全栈 React 框架 |
| 语言 | TypeScript | 类型安全 |
| 样式 | Tailwind CSS + shadcn/ui | 现代化 UI 组件 |
| 数据库 | PostgreSQL + Prisma | 关系型数据存储 |
| AI 模型 | DeepSeek-R1 | 合同审查大模型 |
| 流程引擎 | ReactFlow | 可视化工作流 |
| 图表 | Recharts | 数据可视化 |
| 状态管理 | React Hooks | 简洁状态管理 |

## 🚀 快速开始

### 环境要求
- Node.js 18+
- PostgreSQL 14+
- DeepSeek API Key (可选)

### 安装步骤

1. **克隆项目**
```bash
cd contract-guard/my-app
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接和 API Key
```

4. **初始化数据库**
```bash
# 创建数据库迁移
npm run db:migrate

# 生成 Prisma Client
npm run db:generate

# 导入示例数据
npm run db:seed
```

5. **启动开发服务器**
```bash
npm run dev
```

访问 http://localhost:3000 查看应用

### 默认账号

系统初始化时会创建以下演示账号：

| 角色 | 邮箱 | 用途 |
|------|------|------|
| 业务人员 | business@example.com | 提交合同 |
| 法务专员 | legal@example.com | 合同审查 |
| 法务总监 | director@example.com | 质量把控 |
| 财务 | finance@example.com | 财务审核 |
| CEO | ceo@example.com | 最终审批 |

## 📁 项目结构

```
my-app/
├── app/                      # Next.js App Router
│   ├── api/                  # API 路由
│   │   ├── contract/         # 合同相关 API
│   │   ├── dashboard/        # 仪表盘 API
│   │   └── knowledge/        # 知识库 API
│   ├── contracts/            # 合同列表/详情页面
│   ├── knowledge/            # 知识库页面
│   ├── layout.tsx            # 根布局
│   └── page.tsx              # 首页(仪表盘)
├── components/               # React 组件
│   ├── ui/                   # shadcn/ui 组件
│   ├── upload-contract-dialog.tsx
│   ├── workflow-visualizer.tsx
│   └── version-diff.tsx
├── lib/                      # 工具函数和服务
│   ├── ai-service.ts         # DeepSeek AI 服务
│   ├── rule-engine.ts        # 规则引擎
│   ├── file-parser.ts        # 文件解析
│   ├── prisma.ts             # Prisma Client
│   └── utils.ts              # 工具函数
├── src/                      # 源代码
│   ├── types/                # TypeScript 类型
│   └── constants/            # 常量定义
├── prisma/
│   ├── schema.prisma         # 数据库模型
│   └── seed.ts               # 种子数据
└── public/                   # 静态资源
```

## 🔧 核心模块详解

### AI 审查服务 (ai-service.ts)

```typescript
// DeepSeek API 调用
const aiReview = await analyzeContractWithDeepSeek(contractText);

// Mock 模式（无 API Key 时）
const mockReview = generateMockAIReview(contractText);
```

### 规则引擎 (rule-engine.ts)

```typescript
// 预定义审查规则
const rules = CONTRACT_RULES;

// 执行分析
const { risks, score } = hybridAnalyze(contractText);
```

支持的规则类型：
- 付款账期检查
- 管辖条款检查
- 违约金比例检查
- 知识产权归属检查
- 保密条款检查
- 不可抗力条款检查
- ...等14条规则

### 数据模型 (schema.prisma)

核心实体：
- **User**: 用户与角色
- **Contract**: 合同主表
- **AIReview**: AI审查结果
- **Annotation**: 批注
- **WorkflowExecution**: 审批流执行
- **KnowledgeDoc**: 知识库文档

## 🎯 使用指南

### 1. 上传合同
- 点击"上传合同"按钮
- 支持 PDF、Word 格式
- 自动提取合同信息（对方主体、金额等）

### 2. AI 审查
- 系统自动触发 AI 分析
- 生成风险评分和修改建议
- 创建风险批注锚定在原文位置

### 3. 人工审查
- 查看 AI 建议并采纳/拒绝
- 添加人工批注
- 与业务人员在线协作

### 4. 提交审批
- 根据合同金额自动选择审批流
- 可视化追踪审批进度
- 支持委托审批

### 5. 归档管理
- 合同版本自动保存
- 版本对比查看修改内容
- 关键信息结构化存储

## 🔐 安全与隐私

- API Key 存储在服务端环境变量
- 敏感操作需认证授权
- 批注可见性分级（内部/外部）
- 审计日志记录关键操作

## 🌟 项目亮点

1. **混合 AI 架构**：规则引擎保证底线，AI 处理复杂语义理解
2. **嵌入式协作**：批注直接锚定合同文本位置
3. **企业级数据思维**：版本控制、审计追踪、知识沉淀
4. **低代码工作流**：可视化流程设计器
5. **RAG 知识增强**：审查时检索公司制度和历史案例

## 📈 未来规划

- [ ] 扫描版 PDF OCR 支持
- [ ] 电子签章集成
- [ ] 多语言合同审查
- [ ] 移动端适配
- [ ] 企业微信/钉钉集成
- [ ] 智能合同生成

## 📄 License

MIT License

---

<p align="center">
  用 ❤️ 构建 | ContractGuard 让每份合同都经过 AI 初筛
</p>
