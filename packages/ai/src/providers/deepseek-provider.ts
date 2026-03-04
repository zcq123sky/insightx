import type { AnalyzePROutput, AnalyzePRParams } from "../types";
import { BaseAIProvider } from "./base-provider";

export class DeepSeekProvider extends BaseAIProvider {
	private apiKey: string;
	private model: string;

	constructor(apiKey: string, model: string = "deepseek-coder") {
		super();
		this.apiKey = apiKey;
		this.model = model;
	}

	async analyzePR(params: AnalyzePRParams): Promise<AnalyzePROutput> {
		const prompt = this.buildPrompt(params);

		const response = await fetch(
			"https://api.deepseek.com/v1/chat/completions",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.apiKey}`,
				},
				body: JSON.stringify({
					model: this.model,
					messages: [
						{
							role: "system",
							content: "你是一个经验丰富的开源项目维护者，擅长代码审查。",
						},
						{
							role: "user",
							content: prompt,
						},
					],
					temperature: 0.2,
				}),
			},
		);

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`DeepSeek API Error: ${response.status} - ${error}`);
		}

		const result = await response.json();
		const rawAnalysis = result.choices?.[0]?.message?.content || "";

		return this.parseResponse(rawAnalysis, params);
	}

	private buildPrompt(params: AnalyzePRParams): string {
		return `请对以下 GitHub Pull Request 进行专业代码审查分析：

**PR 标题:** ${params.title}
**PR 描述:** ${params.description || "无"}
**提交者:** ${params.author || "未知"}
**代码变更 (diff):**
\`\`\`diff
${params.diff.substring(0, 8000)}
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
			const jsonMatch = text.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				const parsed = JSON.parse(jsonMatch[0]);
				return {
					summary: parsed.summary || "分析完成",
					qualityScore:
						typeof parsed.qualityScore === "number" ? parsed.qualityScore : 7,
					suggestions: Array.isArray(parsed.suggestions)
						? parsed.suggestions
						: [],
					potentialRisks: Array.isArray(parsed.potentialRisks)
						? parsed.potentialRisks
						: [],
				};
			}
			return {
				summary: `分析完成：${params.title}`,
				qualityScore: 7,
				suggestions: ["AI返回格式异常，请检查提示词或模型。"],
				potentialRisks: ["解析失败，分析结果可能不完整。"],
			};
		} catch (error) {
			console.error("解析 DeepSeek 响应失败:", error);
			return {
				summary: `分析完成：${params.title}`,
				qualityScore: 7,
				suggestions: ["AI返回格式异常，请检查提示词或模型。"],
				potentialRisks: ["解析失败，分析结果可能不完整。"],
			};
		}
	}
}
