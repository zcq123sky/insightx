import { PRAnalyzerService } from "@isx/ai";
import { db, schema } from "@isx/db";
import { GitHubClient } from "@isx/github-client";
import { verifyWebhookSignature } from "@isx/github-core";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

// 使用 Hono Factory 创建类型安全的路由
const app = new Hono();

// 关键修改：提取事件处理逻辑，完全脱离 Hono 上下文
async function processWebhookEvent(event: string, data: any) {
	console.log(`🔄 开始处理 ${event} 事件`);

	const githubClient = new GitHubClient();
	const aiAnalyzer = new PRAnalyzerService();

	try {
		if (
			event === "pull_request" &&
			["opened", "synchronize"].includes(data.action)
		) {
			await handlePullRequest(data, githubClient, aiAnalyzer);
		} else if (event === "installation" && data.action === "created") {
			await handleInstallation(data);
		} else if (event === "ping") {
			console.log("🏓 收到 Ping 事件，连接正常");
		} else {
			console.log(`⚠️  未处理的事件类型: ${event} (action: ${data.action})`);
		}
	} catch (error) {
		console.error(`❌ 处理 ${event} 事件失败:`, error);
		// 这里可以添加错误上报逻辑
	}
}

// Webhook 路由处理
app.post("/", async (c) => {
	const payload = await c.req.text();
	const signature = c.req.header("x-hub-signature-256");
	const event = c.req.header("x-github-event");
	const deliveryId = c.req.header("x-github-delivery");

	console.log(`📩 收到 ${event} 事件 (${deliveryId})`);

	// 1. 验证签名
	const secret = process.env.GITHUB_APP_WEBHOOK_SECRET!;
	if (!verifyWebhookSignature(payload, signature, secret)) {
		console.error("❌ Webhook 签名验证失败");
		return c.json({ error: "Invalid signature" }, 401);
	}

	const data = JSON.parse(payload);

	// 2. 立即返回 202 Accepted（GitHub 要求快速响应）
	c.status(202);
	c.json({ accepted: true, event, deliveryId });

	// 3. 异步处理事件（使用 setImmediate 确保在主循环后执行）
	setImmediate(() => {
		processWebhookEvent(event, data).catch(console.error);
	});

	// 注意：这里必须 return c.json() 的结果
	// 但由于上面已经返回，这里实际上不会执行
	return;
});

// 业务处理函数
async function handlePullRequest(
	data: any,
	githubClient: GitHubClient,
	aiAnalyzer: PRAnalyzerService,
) {
	const { pull_request, repository, installation } = data;
	const installationId = installation.id;

	console.log(
		`🔍 开始分析 PR #${pull_request.number} in ${repository.full_name}`,
	);

	// 1. 获取 PR 详情
	const prDetails = await githubClient.getPullRequestDetails(
		repository.owner.login,
		repository.name,
		pull_request.number,
		installationId,
	);

	console.log(`📄 PR 标题: "${prDetails.title}"`);
	console.log(`📊 文件变更: ${prDetails.filesChanged} 个文件`);

	// 2. AI 分析
	console.log("🧠 开始 AI 分析...");
	const analysis = await aiAnalyzer.analyze({
		title: prDetails.title,
		description: prDetails.body || "",
		diff: prDetails.diff,
		author: pull_request.user.login,
	});

	console.log(`✅ AI 分析完成，评分: ${analysis.qualityScore}/10`);

	// 3. 将结果写回 GitHub
	try {
		await githubClient.createCheckRun(
			repository.owner.login,
			repository.name,
			pull_request.head.sha,
			{
				title: `AI 代码评审: ${analysis.qualityScore}/10`,
				summary: analysis.summary,
				text: `## 💡 建议\n${analysis.suggestions.join("\n\n")}`,
			},
			installationId,
		);
		console.log("✅ Check run 创建成功");
	} catch (error) {
		console.error("❌ 创建 Check run 失败:", error.message);

		// 如果是因为缺少权限，给出明确提示
		if (error.status === 403) {
			console.error("\n🔑 权限问题解决方案:");
			console.error('1. 确认 GitHub App 有 "Checks: Read & Write" 权限');
			console.error("2. 重新安装 App 使新权限生效");
			console.error("3. 当前权限列表:");
			console.error("   - Checks: Read & Write (必需)");
			console.error("   - Pull requests: Read & Write");
			console.error("   - Contents: Read");
		}
	}

	// 4. 存储结果到数据库
	try {
		await db.insert(schema.pullRequests).values({
			githubId: pull_request.id,
			number: pull_request.number,
			repository: repository.full_name,
			title: pull_request.title,
			author: pull_request.user.login,
			status: "analyzed",
			additions: prDetails.additions,
			deletions: prDetails.deletions,
		});
		console.log("💾 分析结果已保存到数据库");
	} catch (dbError) {
		console.warn("⚠️  保存到数据库失败:", dbError.message);
	}

	console.log(`🎉 PR #${pull_request.number} 分析完成`);
}

async function handleInstallation(data: any) {
	const { installation, repositories } = data;

	console.log(`🔄 App 被安装到: ${installation.account.login}`);
	console.log(`📦 授权仓库数量: ${repositories?.length || 0}`);

	if (repositories) {
		repositories.forEach((repo: any, index: number) => {
			console.log(`   ${index + 1}. ${repo.full_name}`);
		});
	}

	// 这里可以初始化数据库记录等
	// 例如：记录哪个用户/组织安装了你的 App
}

export default app;
