// packages/ai/src/providers/base-provider.ts
import type { AnalyzePRParams, AnalyzePROutput } from "../types";

// 所有 AI 供应商的抽象基类
export abstract class BaseAIProvider {
	abstract analyzePR(params: AnalyzePRParams): Promise<AnalyzePROutput>;
	// 未来可以扩展其他方法，例如 summarizeIssue, generateCode 等
}
