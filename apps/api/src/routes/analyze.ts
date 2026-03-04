import { PRAnalyzerService } from "@isx/ai";
import { db, schema } from "@isx/db";
import { PublicGitHubClient } from "@isx/github-client";
import { Hono } from "hono";
import { z } from "zod";

const app = new Hono();

const analyzeSchema = z.object({
	prUrl: z.string().url(),
	githubToken: z.string().optional(),
});

function parsePRUrl(url: string): {
	owner: string;
	repo: string;
	number: number;
} | null {
	const patterns = [
		/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/,
		/gitlab\.com\/([^/]+)\/([^/]+)\/-\/merge_requests\/(\d+)/,
	];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match) {
			return {
				owner: match[1],
				repo: match[2],
				number: parseInt(match[3], 10),
			};
		}
	}
	return null;
}

app.post("/", async (c) => {
	const body = await c.req.json();
	const result = analyzeSchema.safeParse(body);

	if (!result.success) {
		return c.json({ error: "Invalid request", details: result.error }, 400);
	}

	const { prUrl, githubToken } = result.data;
	const parsed = parsePRUrl(prUrl);

	if (!parsed) {
		return c.json({ error: "Invalid PR URL format" }, 400);
	}

	const { owner, repo, number } = parsed;

	try {
		const githubClient = new PublicGitHubClient(githubToken);
		const aiAnalyzer = new PRAnalyzerService();

		console.log(`🔍 开始分析 PR #${number} in ${owner}/${repo}`);

		const prDetails = await githubClient.getPullRequestDetails(
			owner,
			repo,
			number,
		);

		console.log(`📄 PR 标题: "${prDetails.title}"`);
		console.log(`📊 文件变更: ${prDetails.filesChanged} 个文件`);

		console.log("🧠 开始 AI 分析...");
		const analysis = await aiAnalyzer.analyze({
			title: prDetails.title,
			description: prDetails.body || "",
			diff: prDetails.diff,
		});

		console.log(`✅ AI 分析完成，评分: ${analysis.qualityScore}/10`);

		const prUrl = `https://github.com/${owner}/${repo}/pull/${number}`;
		const [prRecord] = await db
			.insert(schema.pullRequests)
			.values({
				githubId: 0,
				number,
				url: prUrl,
				repository: `${owner}/${repo}`,
				title: prDetails.title,
				author: "manual",
				status: "analyzed",
				additions: prDetails.additions,
				deletions: prDetails.deletions,
			})
			.returning({ id: schema.pullRequests.id });

		await db.insert(schema.analyses).values({
			prId: prRecord.id,
			summary: analysis.summary,
			qualityScore: analysis.qualityScore,
		});

		console.log("💾 分析结果已保存到数据库");

		return c.json({
			success: true,
			pr: {
				url: prUrl,
				title: prDetails.title,
				filesChanged: prDetails.filesChanged,
				additions: prDetails.additions,
				deletions: prDetails.deletions,
			},
			analysis: {
				summary: analysis.summary,
				qualityScore: analysis.qualityScore,
				suggestions: analysis.suggestions,
				potentialRisks: analysis.potentialRisks,
			},
		});
	} catch (error) {
		console.error("❌ 分析失败:", error);
		return c.json({ error: "Analysis failed", details: String(error) }, 500);
	}
});

export default app;
