# EduPath 本地开发指南

## Vercel Serverless Functions 工作原理

### 1. 架构说明
- `api/` 文件夹中的每个 `.js` 文件都会成为一个独立的 API 端点
- Vercel 会自动将这些文件部署为 Serverless Functions
- 每个函数都是独立的，按需执行，自动扩缩容

### 2. API 端点映射
```
api/chat.js     → /api/chat      (POST) - 智能聊天处理
api/analyze.js  → /api/analyze   (POST) - 用户档案分析 
api/schools.js  → /api/schools   (GET)  - 获取学校推荐
api/timeline.js → /api/timeline  (GET)  - 获取申请时间线
api/adjust.js   → /api/adjust    (POST) - 调整学校推荐
```

## 本地开发环境设置

### 1. 安装 Vercel CLI
```bash
npm install -g vercel
```

### 2. 创建环境变量文件
创建 `.env.local` 文件（已在 .gitignore 中）：
```env
# 数据库配置 (TiDB)
TIDB_HOST=your_tidb_host
TIDB_PORT=4000
TIDB_USER=your_username
TIDB_PASSWORD=your_password
TIDB_DATABASE=your_database

# OpenAI API 配置
OPENAI_API_KEY=your_openai_api_key

# 其他配置
NODE_ENV=development
```

### 3. 启动本地开发服务器

#### 方法一：使用 Vercel dev（推荐）
```bash
# 启动 Vercel dev server（会同时运行前端和API）
vercel dev

# 这会在默认端口启动：
# - 前端：http://localhost:3000 
# - API：http://localhost:3000/api/*
```

#### 方法二：分别启动前端和API
```bash
# 终端1：启动 Vercel dev server (只API functions)
vercel dev --yes

# 终端2：启动 Vite dev server (前端)
npm run dev

# 前端：http://localhost:5173
# API：http://localhost:3000/api/*
```

#### 方法三：只测试 API
```bash
# 只启动 Vercel dev server
vercel dev --yes

# 使用测试脚本
node test-api.js
```

### 4. API 调用方式

#### 从前端调用 (localhost:5173)
前端会自动调用 `http://localhost:3000/api/*` 的 API 端点

#### 直接测试 API
```javascript
// 测试聊天 API
fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: '我想申请CS研究生' }]
  })
})

// 测试学校推荐 API  
fetch('http://localhost:3000/api/schools?analysisId=your-analysis-id')

// 测试时间线 API
fetch('http://localhost:3000/api/timeline?analysisId=your-analysis-id')
```

## 开发流程

### 1. 完整测试流程
```bash
# 1. 启动服务
vercel dev --listen 3000

# 2. 运行测试脚本
node test-api.js

# 3. 或者启动前端进行完整测试
npm run dev
```

### 2. API 调用顺序
1. **Chat API** - 收集用户信息
2. **Analyze API** - 分析用户档案，生成 analysis_id
3. **Schools API** - 基于 analysis_id 获取学校推荐
4. **Timeline API** - 基于 analysis_id 生成申请时间线
5. **Adjust API** - 调整学校推荐（可选）

### 3. 错误处理
- 检查环境变量是否正确设置
- 确保数据库连接正常
- 验证 OpenAI API Key 有效
- 查看控制台日志了解详细错误信息

## 部署到 Vercel

### 1. 部署命令
```bash
# 首次部署
vercel --prod

# 后续部署
vercel --prod
```

### 2. 环境变量设置
在 Vercel Dashboard 中设置以下环境变量：
- `TIDB_HOST`
- `TIDB_PORT`  
- `TIDB_USER`
- `TIDB_PASSWORD`
- `TIDB_DATABASE`
- `OPENAI_API_KEY`

### 3. 生产环境 API 调用
部署后，API 端点变为：
```
https://your-app.vercel.app/api/chat
https://your-app.vercel.app/api/analyze
https://your-app.vercel.app/api/schools
https://your-app.vercel.app/api/timeline
https://your-app.vercel.app/api/adjust
```

## 常见问题

### Q: 为什么要用端口 3000 而不是 5173？
A: 
- 端口 5173 是 Vite 前端开发服务器
- 端口 3000 是 Vercel dev server，专门用于运行 serverless functions
- 前端通过 CORS 调用 API 服务器

### Q: 如何调试 API 错误？
A:
- 查看 Vercel dev server 的控制台输出
- 使用 `console.log()` 在 API 函数中添加日志
- 检查网络请求的响应状态和错误信息

### Q: 环境变量不生效怎么办？
A:
- 确保 `.env.local` 文件在项目根目录
- 重启 Vercel dev server
- 检查变量名拼写是否正确

### Q: 数据库连接失败？
A:
- 检查 TiDB 连接参数
- 确认网络访问权限
- 验证 SSL 配置
