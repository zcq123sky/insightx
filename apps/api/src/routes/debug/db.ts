import { db, schema } from "@isx/db";
import { Hono } from "hono";

const app = new Hono();

app.get("/", async (c) => {
	try {
		const result = await db.select().from(schema.pullRequests).limit(1);
		return c.json({
			status: "ok",
			message: "Database connected",
			tableExists: true,
			sample: result,
		});
	} catch (error: any) {
		return c.json(
			{
				status: "error",
				message: error.message,
				tableExists: false,
			},
			500,
		);
	}
});

export default app;
