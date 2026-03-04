import "dotenv/config";

import { desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// 读取 .env 文件中的 DATABASE_URL
console.log("Dotenv module path:", require.resolve("dotenv"));
// 创建数据库连接池（管理多个连接，更高效）
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: false,
});

// 创建 db 实例，它将知道我们的表结构（schema）
export const db = drizzle(pool, { schema });
export { schema, desc, sql }; // 导出所有表定义
