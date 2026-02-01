/**
 * 公司标准日志系统
 * 使用Pino进行结构化日志记录
 * 生产环境会自动收集到Logstash
 */

import pino from "pino";
import { config } from "../config/env";

// 自定义日志级别
const levels = {
  emergency: 70,
  alert: 60,
  critical: 50,
  error: 40,
  warn: 30,
  info: 20,
  debug: 10,
  trace: 5,
};

/**
 * 创建应用日志器
 * @param context 日志上下文（通常是模块名称）
 */
export function createLogger(context: string = "app") {
  return pino({
    level: config.LOG_LEVEL,
    customLevels: levels,
    useOnlyCustomLevels: false,
    timestamp: () => `,"time":"${new Date().toISOString()}"`,

    // 结构化日志字段
    base: {
      pid: process.pid,
      hostname: process.env.HOSTNAME,
      env: config.NODE_ENV,
      service: "prinsight-api",
      version: process.env.npm_package_version || "0.1.0",
      context,
    },

    // 开发环境美化输出
    transport: config.isDev
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
            messageFormat: "[{context}] {msg}",
          },
        }
      : undefined,

    // 生产环境序列化错误
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },
  });
}

// 默认应用日志器
export const logger = createLogger();

/**
 * API请求日志中间件
 */
export const requestLogger = {
  logRequest: (req: any, res: any, responseTime: number) => {
    logger.info(
      {
        type: "request",
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: responseTime,
        userAgent: req.headers["user-agent"],
        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      },
      "📥 请求处理完成",
    );
  },

  logError: (error: Error, req: any) => {
    logger.error(
      {
        type: "error",
        error: error.message,
        stack: error.stack,
        method: req?.method,
        url: req?.url,
      },
      "💥 请求处理失败",
    );
  },
};
