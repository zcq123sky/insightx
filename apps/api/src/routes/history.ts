import { db, desc, schema } from "@isx/db";
import { Hono } from "hono";

const app = new Hono();

app.get("/", async (c) => {
	try {
		const results = await db
			.select({
				id: schema.pullRequests.id,
				number: schema.pullRequests.number,
				repository: schema.pullRequests.repository,
				title: schema.pullRequests.title,
				author: schema.pullRequests.author,
				status: schema.pullRequests.status,
				qualityScore: schema.analyses.qualityScore,
				createdAt: schema.pullRequests.createdAt,
			})
			.from(schema.pullRequests)
			.leftJoin(
				schema.analyses,
				schema.analyses.prId === schema.pullRequests.id,
			)
			.orderBy(desc(schema.pullRequests.createdAt))
			.limit(50);

		return c.json({ data: results });
	} catch (error) {
		console.error("❌ 获取历史失败:", error);
		return c.json({ error: "Failed to fetch history" }, 500);
	}
});

export default app;
