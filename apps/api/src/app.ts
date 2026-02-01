// apps/api/src/app.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { errorHandler } from "./middleware/error-handler";
import { rateLimiter } from "./middleware/rate-limit";
import { authRoutes } from "./modules/auth/router";
import { analysisRoutes } from "./modules/analysis/router";
import { analysisRoutes } from "./modules/analysis/analysis.routes";

const app = new Hono();

// 全局中间件
app.use("*", cors());
app.use("*", logger());
app.use("*", prettyJSON());
app.use("/api/*", rateLimiter());

// 健康检查
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API路由
app.route("/api/auth", authRoutes);
app.route("/api/analyze", analysisRoutes);

// 错误处理
app.onError(errorHandler);

export { app };
