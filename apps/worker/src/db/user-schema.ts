import { InferSelectModel } from "drizzle-orm";
import { sqliteTable as table } from "drizzle-orm/sqlite-core";
import * as t from "drizzle-orm/sqlite-core";

export const userTable = table("user", {
	id: t.integer("id").primaryKey(),
	name: t.text("name").notNull(),
	email: t.text("email").notNull(),
	passwordHash: t.text("password_hash").notNull(),
	emailVerified: t.integer("email_verified").notNull().default(0),
	totpKey: t.blob("totp_key"),
	recoveryCode: t.blob("recovery_code").notNull(),
	role: t.text("role").notNull().default("user"),
});

export const sessionTable = table("session", {
	id: t.text("id").primaryKey(),
	userId: t.integer("user_id")
		.notNull()
		.references(() => userTable.id),
	expiresAt: t.integer("expires_at", {
		mode: "timestamp"
	}).notNull(),
	twoFactorVerified: t.integer("two_factor_verified").notNull().default(0)
});

export const emailVerificationRequestTable = table("email_verification_request", {
	id: t.text("id").primaryKey(),
	userId: t.integer("user_id")
		.notNull()
		.references(() => userTable.id),
	email: t.text("email").notNull(),
	code: t.text("code").notNull(),
	expiresAt: t.integer("expires_at", {
		mode: "timestamp"
	}).notNull()
});

export const passwordResetSessionTable = table("password_reset_session", {
	id: t.text("id").primaryKey(),
	userId: t.integer("user_id")
		.notNull()
		.references(() => userTable.id),
	email: t.text("email").notNull(),
	code: t.text("code").notNull(),
	expiresAt: t.integer("expires_at", {
		mode: "timestamp"
	}).notNull(),
	emailVerified: t.integer("email_verified").notNull().default(0),
	twoFactorVerified: t.integer("two_factor_verified").notNull().default(0)
});

export type User = InferSelectModel<typeof userTable>;
export type Session = InferSelectModel<typeof sessionTable>;
