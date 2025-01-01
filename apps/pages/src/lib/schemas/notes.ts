import { InferSelectModel } from "drizzle-orm";
import { sqliteTable as table } from "drizzle-orm/sqlite-core";
import * as t from "drizzle-orm/sqlite-core";
import { uuidv7 } from "uuidv7";

export const notesTable = table("notes", {
	id: t.text("id")
		.primaryKey()
		.unique()
		.$defaultFn(() => uuidv7()),
	name: t.text("name").notNull(),
	content: t.text("content").notNull(),
	createdAt: t.integer("created_at", {
		mode: "timestamp"
	}).$defaultFn(() => {
		return new Date()
	}),
	updatedAt: t.integer("updated_at", {
		mode: "timestamp"
	}).$onUpdateFn(() => {
		return new Date()
	}),
});

export type Note = InferSelectModel<typeof notesTable>;


