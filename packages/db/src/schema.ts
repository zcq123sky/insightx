import {
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

// 1. 定义一个“状态”枚举（PR只能是开放、合并、关闭三种状态）
export const prStatusEnum = pgEnum("pr_status", [
	"open",
	"merged",
	"closed",
	"analyzed",
]);

// 2. 定义 “Pull Requests” 表
export const pullRequests = pgTable("pull_requests", {
	id: serial("id").primaryKey(), // 自增主键，像Excel第一列序号
	url: varchar("url", { length: 512 }).unique().notNull(), // 唯一且不能为空的URL
	title: varchar("title", { length: 255 }).notNull(),
	description: text("description"), // 文本，可以为空
	author: varchar("author", { length: 100 }).notNull(),
	repository: varchar("repository", { length: 255 }).notNull(), // 格式：owner/repo
	status: prStatusEnum("status").default("open").notNull(), // 状态，默认为'open'
	filesChanged: integer("files_changed"),
	additions: integer("additions"),
	deletions: integer("deletions"),
	createdAt: timestamp("created_at").defaultNow().notNull(), // 创建时间，默认为现在
	updatedAt: timestamp("updated_at").$onUpdate(() => new Date()), // 更新时间，修改时自动刷新
});

// 3. 定义 “Analyses” 表
export const analyses = pgTable("analyses", {
	id: serial("id").primaryKey(),
	prId: integer("pr_id")
		.references(() => pullRequests.id)
		.notNull(), // 外键，关联pr表
	summary: text("summary").notNull(),
	complexityScore: integer("complexity_score"),
	qualityScore: integer("quality_score"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
