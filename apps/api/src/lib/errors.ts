/**
 * 应用错误处理系统
 * 公司规范：
 * 1. 所有错误必须使用AppError类
 * 2. 错误必须有明确的错误码
 * 3. 生产环境不暴露堆栈信息
 * 4. 日志必须包含足够的上下文
 */

import { StatusCode } from "hono/utils/http-status";

// 公司标准错误码
export enum ErrorCode {
  // 通用错误
  INTERNAL_ERROR = "INTERNAL_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",

  // 业务错误
  PR_NOT_FOUND = "PR_NOT_FOUND",
  ANALYSIS_FAILED = "ANALYSIS_FAILED",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // 外部服务错误
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  CACHE_ERROR = "CACHE_ERROR",

  // 输入错误
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",

  // GitHub相关
  ACCESS_DENIED = "ACCESS_DENIED",
  REPO_NOT_FOUND = "REPO_NOT_FOUND",

  // AI相关
  AI_SERVICE_UNAVAILABLE = "AI_SERVICE_UNAVAILABLE",
  AI_RATE_LIMIT = "AI_RATE_LIMIT",
}

// 错误码到HTTP状态码的映射
const ERROR_STATUS_MAP: Record<ErrorCode, StatusCode> = {
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.PR_NOT_FOUND]: 404,
  [ErrorCode.ANALYSIS_FAILED]: 500,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.EXTERNAL_API_ERROR]: 502,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.CACHE_ERROR]: 500,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.ACCESS_DENIED]: 403,
  [ErrorCode.REPO_NOT_FOUND]: 404,
  [ErrorCode.AI_SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.AI_RATE_LIMIT]: 429,
};

// 用户友好的错误消息
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.INTERNAL_ERROR]: "服务器内部错误",
  [ErrorCode.VALIDATION_ERROR]: "请求参数验证失败",
  [ErrorCode.NOT_FOUND]: "资源不存在",
  [ErrorCode.UNAUTHORIZED]: "未授权访问",
  [ErrorCode.FORBIDDEN]: "禁止访问",
  [ErrorCode.PR_NOT_FOUND]: "未找到指定的Pull Request",
  [ErrorCode.ANALYSIS_FAILED]: "分析失败，请重试",
  [ErrorCode.RATE_LIMIT_EXCEEDED]: "请求过于频繁，请稍后重试",
  [ErrorCode.EXTERNAL_API_ERROR]: "外部服务暂时不可用",
  [ErrorCode.DATABASE_ERROR]: "数据库错误",
  [ErrorCode.CACHE_ERROR]: "缓存服务错误",
  [ErrorCode.INVALID_INPUT]: "输入参数无效",
  [ErrorCode.MISSING_REQUIRED_FIELD]: "缺少必填字段",
  [ErrorCode.ACCESS_DENIED]: "没有权限访问此资源",
  [ErrorCode.REPO_NOT_FOUND]: "仓库不存在",
  [ErrorCode.AI_SERVICE_UNAVAILABLE]: "AI服务暂时不可用",
  [ErrorCode.AI_RATE_LIMIT]: "AI服务调用频率过高",
};

/**
 * 应用错误类
 * 公司所有错误必须继承此类
 */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message?: string,
    public readonly details?: any,
    public readonly cause?: Error,
  ) {
    super(message || ERROR_MESSAGES[code]);
    this.name = "AppError";

    // 保持正确的堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * 转换为HTTP状态码
   */
  get statusCode(): StatusCode {
    return ERROR_STATUS_MAP[this.code] || 500;
  }

  /**
   * 转换为API响应格式
   */
  toResponse() {
    const base = {
      success: false,
      error: {
        code: this.code,
        message: this.message,
      },
      timestamp: new Date().toISOString(),
    };

    // 开发环境添加更多调试信息
    if (process.env.NODE_ENV === "development") {
      return {
        ...base,
        error: {
          ...base.error,
          details: this.details,
          stack: this.stack,
        },
      };
    }

    return base;
  }
}

/**
 * 创建验证错误
 */
export function createValidationError(field: string, message: string) {
  return new AppError(ErrorCode.VALIDATION_ERROR, `${field}: ${message}`, {
    field,
    message,
  });
}

/**
 * 创建数据库错误
 */
export function createDatabaseError(error: Error, operation: string) {
  return new AppError(
    ErrorCode.DATABASE_ERROR,
    `数据库操作失败: ${operation}`,
    { operation },
    error,
  );
}

/**
 * 全局错误处理器中间件
 */
export function errorHandler(err: Error, c: any) {
  const logger = c.get("logger") || console;

  // 处理AppError
  if (err instanceof AppError) {
    logger.warn({ error: err }, "业务错误");
    return c.json(err.toResponse(), err.statusCode);
  }

  // 处理Zod验证错误
  if (err.name === "ZodError") {
    const validationError = new AppError(
      ErrorCode.VALIDATION_ERROR,
      "请求参数验证失败",
      err.errors,
    );
    return c.json(validationError.toResponse(), validationError.statusCode);
  }

  // 处理未知错误
  logger.error({ error: err }, "未处理的错误");

  const internalError = new AppError(
    ErrorCode.INTERNAL_ERROR,
    "服务器内部错误",
  );

  return c.json(internalError.toResponse(), internalError.statusCode);
}
