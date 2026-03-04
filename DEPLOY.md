# 部署指南

本项目使用 **Vercel** 部署前端，**Railway** 部署后端，**Supabase** 提供 PostgreSQL 数据库。

## 部署前准备

1. **注册账号**
   - [Vercel](https://vercel.com) - 前端部署
   - [Railway](https://railway.app) - 后端部署
   - [Supabase](https://supabase.com) - 数据库

2. **准备 GitHub Token**
   - 创建一个 GitHub Personal Access Token（用于拉取私有仓库）

---

## 步骤 1: 创建 Supabase 数据库

1. 登录 [Supabase](https://supabase.com)
2. 创建新项目
3. 获取连接字符串，格式如下：
   ```
   postgres://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres
   ```

---

## 步骤 2: 部署后端到 Railway

1. 登录 [Railway](https://railway.app)
2. 创建新项目，选择 "Deploy from GitHub repo"
3. 选择你的仓库
4. 在环境变量中添加：
   ```
   DATABASE_URL=postgresql://postgres.iibmqjsphsacipllefra:[hogjo5-wajRyq-guwkon]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

   OLLAMA_BASE_URL=http://localhost:11434  (本地测试用)
   ```
5. 部署完成后，获取 Railway 提供的 URL（例如：`https://your-app.railway.app`）

---

## 步骤 3: 部署前端到 Vercel

1. 登录 [Vercel](https://vercel.com)
2. 导入你的 GitHub 仓库
3. 在环境变量中添加：
   ```
   PUBLIC_API_URL=https://your-railway-app.railway.app
   ```
4. 部署完成

---

## 步骤 4: 配置 CI/CD（可选）

GitHub Actions 工作流已配置在 `.github/workflows/deploy.yml`。

**自动部署设置：**

1. **Vercel**
   - 在 Vercel 项目设置中生成 Token
   - 添加到 GitHub Secrets: `VERCEL_TOKEN`
   - 在项目中设置 Project ID 和 Org ID

2. **Railway**
   - 在 Railway 账户设置中生成 Token
   - 添加到 GitHub Secrets: `RAILWAY_TOKEN`

---

## 本地开发

```bash
# 安装依赖
bun install

# 启动数据库
docker-compose up -d

# 启动后端
cd apps/api && bun run dev

# 启动前端
cd apps/web && bun run dev
```

---

## 环境变量

### 后端 (apps/api/.env)
```env
DATABASE_URL=postgresql://postgres.iibmqjsphsacipllefra:[hogjo5-wajRyq-guwkon]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

GITHUB_APP_ID=...
GITHUB_APP_PRIVATE_KEY=...
GITHUB_APP_WEBHOOK_SECRET=...
OLLAMA_BASE_URL=http://localhost:11434
KIMI_API_KEY=...
```

### 前端 (apps/web/.env)
```env
PUBLIC_API_URL=http://localhost:3000
```
