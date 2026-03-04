import { db, desc, schema, sql } from "@isx/db";
import { Hono } from "hono";

const app = new Hono();

app.get("/", async (c) => {
	try {
		const [totalResult, avgResult, maxResult, minResult, recentResults] =
			await Promise.all([
				db.select({ count: sql<number>`count(*)` }).from(schema.pullRequests),
				db
					.select({ avg: sql<number>`avg(${schema.analyses.qualityScore})` })
					.from(schema.analyses),
				db
					.select({ max: sql<number>`max(${schema.analyses.qualityScore})` })
					.from(schema.analyses),
				db
					.select({ min: sql<number>`min(${schema.analyses.qualityScore})` })
					.from(schema.analyses),
				db
					.select({
						qualityScore: schema.analyses.qualityScore,
						createdAt: schema.analyses.createdAt,
					})
					.from(schema.analyses)
					.orderBy(desc(schema.analyses.createdAt))
					.limit(30),
			]);

		const distribution = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		recentResults.forEach((r) => {
			if (
				r.qualityScore !== null &&
				r.qualityScore >= 1 &&
				r.qualityScore <= 10
			) {
				distribution[r.qualityScore - 1]++;
			}
		});

		return c.json({
			data: {
				total: totalResult[0]?.count || 0,
				average: avgResult[0]?.avg ? Math.round(avgResult[0].avg * 10) / 10 : 0,
				highest: maxResult[0]?.max || 0,
				lowest: minResult[0]?.min || 0,
				distribution,
			},
		});
	} catch (error) {
		console.error("❌ 获取统计失败:", error);
		return c.json({ error: "Failed to fetch stats" }, 500);
	}
});

export default app;
