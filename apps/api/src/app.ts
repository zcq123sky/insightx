import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import envDebugRoute from "./routes/debug/env";
import githubWebhook from "./routes/github/webhook";

// 其他路由...

const app = new Hono();

// 全局中间件
app.use("*", logger());
app.use("*", cors());

// 健康检查
app.get("/", (c) => c.json({ status: "ok", service: "analyzerx-api" }));

app.post("/", async (c) => {
	console.log("⚠️  【调试】收到了发送到根路径 / 的 POST 请求");
	console.log(
		"请求头:",
		JSON.stringify(Object.fromEntries(c.req.raw.headers), null, 2),
	);

	try {
		const body = await c.req.text();
		console.log("请求体 (前500字符):", body.substring(0, 500));
	} catch (e) {
		console.log("无法读取请求体");
	}

	// 返回200，让GitHub知道我们收到了，方便调试
	return c.text("Webhook received at root (debug mode)", 200);
});

// 挂载路由
app.route("/api/github/webhook", githubWebhook);

app.route("/debug/env", envDebugRoute);

// app.route('/api/health', healthRoute);

// 错误处理
app.onError((err, c) => {
	console.error(err);
	if (err instanceof HTTPException) {
		return c.json({ error: err.message }, err.status);
	}
	return c.json({ error: "Internal server error" }, 500);
});

export default app;
