import type { Config } from "drizzle-kit";
export default {
	schema: "./src/schema.ts", // 告诉工具：设计图在这里
	out: "./src/migrations", // 告诉工具：生成的SQL脚本放这里
	dialect: "postgresql", // 我们用的是Postgres数据库
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
} satisfies Config;
