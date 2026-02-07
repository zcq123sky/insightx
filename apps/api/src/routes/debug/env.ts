import { Hono } from "hono";

const app = new Hono();

// 关键：这个端点必须不经任何中间件，直接暴露信息
app.get("/", (c) => {
	// 1. 列出所有我们关心的、明确尝试读取的变量
	const expectedVars = {
		// GitHub App 相关 (必须正确)
		GITHUB_APP_ID: process.env.GITHUB_APP_ID,
		GITHUB_APP_PRIVATE_KEY_EXISTS: process.env.GITHUB_APP_PRIVATE_KEY
			? "(已设置，长度：" + process.env.GITHUB_APP_PRIVATE_KEY.length + ")"
			: "(未设置)",
		GITHUB_APP_WEBHOOK_SECRET_EXISTS: process.env.GITHUB_APP_WEBHOOK_SECRET
			? "(已设置)"
			: "(未设置)",

		// 数据库相关
		DATABASE_URL: process.env.DATABASE_URL ? "(已设置)" : "(未设置)",

		// AI 相关
		OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || "未设置，使用默认值",

		// Node/系统环境
		NODE_ENV: process.env.NODE_ENV,
		PWD: process.env.PWD, // 当前工作目录
	};

	// 2. 安全地检查私钥格式（不显示完整内容）
	let privateKeyFormat = "未知";
	if (process.env.GITHUB_APP_PRIVATE_KEY) {
		const pk = process.env.GITHUB_APP_PRIVATE_KEY;
		if (pk.includes("\\n")) {
			privateKeyFormat = '⚠️ 检测到转义换行符 "\\\\n"，可能需要替换为真实换行符';
		} else if (pk.includes("\n")) {
			privateKeyFormat = "✅ 格式正确 (包含真实换行符)";
		} else {
			privateKeyFormat = "⚠️ 可能是一行式密钥，GitHub SDK可能需要多行格式";
		}
	}

	// 3. 返回结构化诊断信息
	return c.json({
		success: true,
		message: "环境变量诊断报告",
		timestamp: new Date().toISOString(),
		service: "analyzerx-api",

		// 核心：变量状态
		environmentVariables: expectedVars,
		privateKeyFormatCheck: privateKeyFormat,

		// 调试信息
		debugInfo: {
			envFilePath: `${process.env.PWD}/.env`, // 推测的路径
			cwd: process.cwd(),
			platform: process.platform,
		},

		// 下一步行动建议
		nextSteps: [
			"如果任何变量显示“未设置”，请检查 .env 文件位置和拼写",
			"确保 .env 文件在 api 目录下，而不是项目根目录",
			"私钥格式问题请参考下方的“常见陷阱”解决",
		],

		// 常见陷阱清单（帮你快速核对）
		commonPitfalls: {
			1: "`.env` 文件是否在 `apps/api/` 目录下？",
			2: "变量名是否与代码中 `process.env.XXX` 的 `XXX` 完全一致（大小写敏感）？",
			3: "`.env` 文件内容是否为 `KEY=value` 格式，前面没有空格？",
			4: "是否在修改 `.env` 后重启了开发服务器？",
			5: "`.env` 文件是否被 `.gitignore` 忽略？（应该是的）",
		},
	});
});

export default app;
