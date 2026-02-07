// apps/api/src/index.ts
import { serve } from "@hono/node-server"; // Node.js 服务器适配器
import dotenv from "dotenv";
import app from "./app"; // 导入上面定义的 Hono 应用

// 加载环境变量
dotenv.config();

// 配置服务器
const port = parseInt(process.env.PORT || "3000");
const host = process.env.HOST || "0.0.0.0";

console.log(`🚀 正在启动 PR Analyzer API 服务...`);
console.log(`📁 环境：${process.env.NODE_ENV || "development"}`);
console.log(`🌐 监听地址：http://${host}:${port}`);

// 启动服务器
serve(
	{
		fetch: app.fetch, // Hono 应用的 fetch 方法
		port,
		host,
	},
	(info) => {
		console.log(`✅ 服务已成功启动！`);
		console.log(`👉 本地访问：http://localhost:${info.port}`);
		console.log(`👉 健康检查：http://localhost:${info.port}/`);

		// 打印可用路由（可选，帮助调试）
		console.log("\n📋 已注册的主要路由：");
		console.log("   GET    /");
		console.log("   POST   /api/pull-requests/analyze");
		console.log("   GET    /api/pull-requests");
		console.log("   POST   /api/ai-test/quick");
	},
);
