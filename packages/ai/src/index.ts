// packages/ai/src/index.ts
// 导出核心服务

export { BaseAIProvider } from "./providers/base-provider";

// 导出所有供应商（方便按需使用）
export { OllamaProvider } from "./providers/ollama-provider";
export { PRAnalyzerService } from "./services/pr-analyzer.service";

// 导出类型
export type { AnalyzePROutput, AnalyzePRParams } from "./types";
