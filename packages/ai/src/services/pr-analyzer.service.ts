// packages/ai/src/services/pr-analyzer.service.ts
import type { BaseAIProvider } from "../providers/base-provider";
import { OllamaProvider } from "../providers/ollama-provider";
import type { AnalyzePROutput, AnalyzePRParams } from "../types";

export class PRAnalyzerService {
	private provider: BaseAIProvider;

	constructor(provider?: BaseAIProvider) {
		this.provider = provider || new OllamaProvider();
	}

	async analyze(params: AnalyzePRParams): Promise<AnalyzePROutput> {
		try {
			console.log(`🧠 开始AI分析PR: ${params.title}`);
			const result = await this.provider.analyzePR(params);
			console.log(`✅ AI分析完成，评分: ${result.qualityScore}/10`);
			return result;
		} catch (error) {
			console.error("❌ AI 分析服务失败:", error);

			// 安全地获取错误信息
			let errorMessage = "未知错误";
			if (error instanceof Error) {
				errorMessage = error.message;
			} else if (typeof error === "string") {
				errorMessage = error;
			} else if (error && typeof error === "object" && "message" in error) {
				errorMessage = String((error as any).message);
			}

			return {
				summary: `分析服务暂时不可用: ${errorMessage}`,
				qualityScore: 5,
				suggestions: ["请稍后重试，或联系管理员。"],
				potentialRisks: ["AI服务异常，本次分析结果不可用。"],
			};
		}
	}

	setProvider(provider: BaseAIProvider) {
		this.provider = provider;
		console.log("🔄 已切换 AI 供应商");
	}
}
