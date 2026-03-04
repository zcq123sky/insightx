import { Hono } from "hono";
import { Client } from "isx/db";

const app = new Hono();

app.get("/", async (c) => {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		return c.json({ error: "DATABASE_URL not set" }, 500);
	}

	try {
		const client = new Client({
			connectionString: databaseUrl,
			ssl: { rejectUnauthorized: false },
		});

		await client.connect();
		const result = await client.query(
			"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
		);
		await client.end();

		return c.json({
			success: true,
			tables: result.rows.map((r) => r.table_name),
		});
	} catch (error: any) {
		return c.json(
			{
				error: error.message,
				code: error.code,
			},
			500,
		);
	}
});

export default app;
