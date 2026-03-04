import { db } from "@isx/db";
import { Hono } from "hono";

const app = new Hono();

app.get("/", async (c) => {
	try {
		// 直接执行原始 SQL 查询
		const result = await db.execute(
			`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
		);
		return c.json({
			tables: result,
			databaseUrl: process.env.DATABASE_URL
				? process.env.DATABASE_URL.replace(/:[^:@]+@/, ":****@")
				: "not set",
		});
	} catch (error: any) {
		return c.json({ error: error.message }, 500);
	}
});

export default app;
