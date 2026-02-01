/**
 * 环境配置模块
 * 公司标准：所有配置必须通过此模块获取
 * 环境变量验证和默认值设置
 */

import { z } from "zod";

// 定义环境变量模式
const envSchema = z.object({
  // 应用配置
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),

  // 数据库
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),

  // GitHub配置
  GITHUB_TOKEN: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // OpenAI配置
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_ORGANIZATION: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4"),

  // 安全配置
  JWT_SECRET: z.string().min(32),
  COOKIE_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),

  // 日志配置
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),

  // 速率限制
  RATE_LIMIT_WINDOW: z.coerce.number().default(900000), // 15分钟
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});

/**
 * 获取验证后的环境配置
 * @throws {Error} 如果环境变量验证失败
 */
export function loadConfig() {
  try {
    const parsed = envSchema.parse(process.env);

    // 根据环境调整配置
    const config = {
      ...parsed,
      isDev: parsed.NODE_ENV === "development",
      isTest: parsed.NODE_ENV === "test",
      isProd: parsed.NODE_ENV === "production",

      // 添加计算的配置
      database: {
        url: parsed.DATABASE_URL,
        pool: {
          min: parsed.isProd ? 5 : 2,
          max: parsed.isProd ? 20 : 10,
        },
      },

      security: {
        jwtSecret: parsed.JWT_SECRET,
        cookieSecret: parsed.COOKIE_SECRET,
        corsOrigins: parsed.CORS_ORIGIN.split(","),
      },
    };

    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map((e) => e.path.join("."));
      throw new Error(`❌ 环境变量配置错误: ${missing.join(", ")}`);
    }
    throw error;
  }
}

// 导出单例配置
export const config = loadConfig();
