// apps/api/src/db/seed.ts

import { sql } from "drizzle-orm";
import { db } from "./index";
import { analyses, pullRequests } from "./schema";

async function main() {
	console.log("🌱 开始填充种子数据...");

	// 安全起见：先清空表（注意顺序，因为有外键依赖）
	console.log("🗑️  清空现有数据...");
	// 使用 raw SQL 来禁用外键检查（PostgreSQL 和 SQLite 语法不同）
	await db.execute(sql`TRUNCATE TABLE ${analyses} RESTART IDENTITY CASCADE`);
	await db.execute(
		sql`TRUNCATE TABLE ${pullRequests} RESTART IDENTITY CASCADE`,
	);

	console.log("📝 插入 Pull Request 数据...");
	// 插入第一条 PR 数据，并获取插入后的结果（包含自动生成的id）
	const [pr1] = await db
		.insert(pullRequests)
		.values([
			{
				url: "https://github.com/vuejs/vue/pull/12345",
				title: "修复响应性系统中的内存泄漏问题",
				description: "此PR修复了在长时间运行应用中可能发生的微小内存泄漏。",
				author: "vuejs-bot",
				repository: "vuejs/vue",
				status: "merged",
				filesChanged: 3,
				additions: 150,
				deletions: 80,
			},
			{
				url: "https://github.com/nodejs/node/pull/40001",
				title: "文档：更新 events.md 中的示例",
				description: "更新了 events 模块的示例代码以使用更现代的语法。",
				author: "code-contributor",
				repository: "nodejs/node",
				status: "open",
				filesChanged: 1,
				additions: 20,
				deletions: 5,
			},
		])
		.returning(); // `.returning()` 用于获取插入的数据，在PostgreSQL中支持

	console.log("🤖 插入 AI 分析数据...");
	// 插入关联的分析数据，使用上面第一条PR的ID
	await db.insert(analyses).values([
		{
			prId: pr1.id, // 这里关联到刚插入的 pr1 的id
			summary:
				"此PR解决了一个关键的内存泄漏问题，代码改动非常精准，仅涉及核心响应性逻辑。",
			complexityScore: 85,
			qualityScore: 90,
		},
		{
			prId: pr1.id,
			summary: "建议在合并前为边缘情况添加额外的单元测试。",
			complexityScore: 30,
			qualityScore: 95,
		},
	]);

	console.log("✅ 种子数据填充完成！");
	console.log(`   已创建 ${pr1.id} 条 Pull Request 记录`);
	process.exit(0);
}

// 执行并捕获错误
main().catch((err) => {
	console.error("❌ 填充种子数据时出错：");
	console.error(err);
	process.exit(1);
});
