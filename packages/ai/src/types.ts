// packages/ai/src/types.ts
export interface AnalyzePRParams {
	title: string;
	description?: string;
	diff: string; // 代码变更内容
	author?: string;
}

export interface AnalyzePROutput {
	summary: string; // PR 概要总结
	qualityScore: number; // 质量评分 1-10
	suggestions: string[]; // 改进建议
	potentialRisks?: string[]; // 潜在风险
}
