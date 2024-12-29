import { InferSelectModel } from "drizzle-orm";
import { sqliteTable as table } from "drizzle-orm/sqlite-core";
import * as t from "drizzle-orm/sqlite-core";

export const userTable = table("user", {
	id: t.integer("id").primaryKey()
});

export const sessionTable = table("session", {
	id: t.text("id").primaryKey(),
	userId: t.integer("user_id")
		.notNull()
		.references(() => userTable.id),
	expiresAt: t.integer("expires_at", {
		mode: "timestamp"
	}).notNull()
});

export type User = InferSelectModel<typeof userTable>;
export type Session = InferSelectModel<typeof sessionTable>;
