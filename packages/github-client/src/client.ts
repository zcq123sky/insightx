import type { CheckRunOutput, PullRequestDetails } from "@isx/github-core";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

export class PublicGitHubClient {
	private octokit: Octokit;

	constructor(token?: string) {
		this.octokit = new Octokit({
			auth: token,
		});
	}

	async getPullRequestDetails(
		owner: string,
		repo: string,
		pullNumber: number,
	): Promise<PullRequestDetails> {
		const [prResponse, filesResponse] = await Promise.all([
			this.octokit.pulls.get({
				owner,
				repo,
				pull_number: pullNumber,
				mediaType: { format: "diff" },
			}),
			this.octokit.pulls.listFiles({
				owner,
				repo,
				pull_number: pullNumber,
				per_page: 100,
			}),
		]);

		return {
			title: prResponse.data.title,
			body: prResponse.data.body,
			diff: prResponse.data as unknown as string,
			filesChanged: filesResponse.data.length,
			additions: filesResponse.data.reduce((sum, f) => sum + f.additions, 0),
			deletions: filesResponse.data.reduce((sum, f) => sum + f.deletions, 0),
		};
	}
}

export class GitHubClient {
	private octokitCache = new Map<number, Octokit>(); // 缓存安装令牌对应的客户端

	// 获取某个安装的 Octokit 实例（带有效令牌）
	async getInstallationOctokit(installationId: number): Promise<Octokit> {
		if (this.octokitCache.has(installationId)) {
			return this.octokitCache.get(installationId)!;
		}

		// 使用 GitHub App 私钥创建认证
		const auth = createAppAuth({
			appId: process.env.GITHUB_APP_ID!,
			privateKey: process.env.GITHUB_APP_PRIVATE_KEY!.replace(/\\n/g, "\n"),
			installationId,
		});

		const { token } = await auth({ type: "installation" });

		const octokit = new Octokit({ auth: token });
		this.octokitCache.set(installationId, octokit);

		// 设置一小时后清理缓存（令牌有效期通常为一小时）
		setTimeout(
			() => {
				this.octokitCache.delete(installationId);
			},
			55 * 60 * 1000,
		);

		return octokit;
	}

	// 获取 PR 详情和 Diff
	async getPullRequestDetails(
		owner: string,
		repo: string,
		pullNumber: number,
		installationId: number,
	): Promise<PullRequestDetails> {
		const octokit = await this.getInstallationOctokit(installationId);

		// 并行请求提高效率
		const [prResponse, filesResponse] = await Promise.all([
			octokit.pulls.get({
				owner,
				repo,
				pull_number: pullNumber,
				mediaType: { format: "diff" }, // 关键：获取原始 diff
			}),
			octokit.pulls.listFiles({
				owner,
				repo,
				pull_number: pullNumber,
				per_page: 100, // 默认30，调大避免分页
			}),
		]);

		return {
			title: prResponse.data.title,
			body: prResponse.data.body,
			diff: prResponse.data as unknown as string, // 类型转换，因为请求了 diff 格式
			filesChanged: filesResponse.data.length,
			additions: filesResponse.data.reduce((sum, f) => sum + f.additions, 0),
			deletions: filesResponse.data.reduce((sum, f) => sum + f.deletions, 0),
		};
	}

	// 创建 Check Run (将分析结果写回 GitHub)
	async createCheckRun(
		owner: string,
		repo: string,
		sha: string,
		output: CheckRunOutput,
		installationId: number,
	): Promise<void> {
		const octokit = await this.getInstallationOctokit(installationId);

		await octokit.checks.create({
			owner,
			repo,
			name: "AI Code Review",
			head_sha: sha,
			status: "completed",
			conclusion: "neutral", // 或根据评分决定 success/failure
			output,
		});
	}
}
