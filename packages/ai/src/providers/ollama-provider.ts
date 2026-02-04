// packages/ai/src/providers/ollama-provider.ts
import { BaseAIProvider } from "./base-provider";
import type { AnalyzePRParams, AnalyzePROutput } from "../types";

export class OllamaProvider extends BaseAIProvider {
	private baseUrl: string;

	constructor(baseUrl: string = "http://localhost:11434") {
		super();
		this.baseUrl = baseUrl;
	}

	async analyzePR(params: AnalyzePRParams): Promise<AnalyzePROutput> {
		// 1. 构建提示词
		const prompt = this.buildPrompt(params);

		// 2. 调用 Ollama 的 API
		const response = await fetch(`${this.baseUrl}/api/generate`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model: "qwen2.5-coder:1.5b",
				prompt: prompt,
				stream: false,
				options: {
					temperature: 0.2,
				},
			}),
		});

		if (!response.ok) {
			throw new Error(`Ollama API Error: ${response.statusText}`);
		}

		const result = await response.json();
		const rawAnalysis = result.response;

		// 3. 解析 AI 返回的文本
		return this.parseResponse(rawAnalysis, params);
	}

	private buildPrompt(params: AnalyzePRParams): string {
		return `你是一个经验丰富的开源项目维护者，请对以下 GitHub Pull Request 进行专业分析：

**PR 标题:** ${params.title}
**PR 描述:** ${params.description || "无"}
**提交者:** ${params.author || "未知"}
**代码变更 (diff):**
\`\`\`diff
${params.diff}
\`\`\`

请严格按以下 JSON 格式输出你的分析结果，不要包含任何其他解释：
{
  "summary": "这里写一段简明扼要的总结，说明这个PR主要做了什么。",
  "qualityScore": 一个1到10的整数分数,
  "suggestions": ["第一条具体的改进建议", "第二条建议"],
  "potentialRisks": ["可能存在的风险一", "风险二"]
}`;
	}

	private parseResponse(
		text: string,
		params: AnalyzePRParams,
	): AnalyzePROutput {
		try {
			// 尝试从返回文本中提取 JSON 部分
			const jsonMatch = text.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				return JSON.parse(jsonMatch[0]);
			}
			// 如果 Ollama 没有按格式返回，返回一个兜底分析
			return {
				summary: `初步分析完成：${params.title}`,
				qualityScore: 7,
				suggestions: ["AI返回格式异常，请检查提示词或模型。"],
				potentialRisks: ["解析失败，分析结果可能不完整。"],
			};
		} catch (error) {
			console.error("解析 Ollama 响应失败:", error);
			return {
				summary: `初步分析完成：${params.title}`,
				qualityScore: 7,
				suggestions: ["AI返回格式异常，请检查提示词或模型。"],
				potentialRisks: ["解析失败，分析结果可能不完整。"],
			};
		}
	}
}
