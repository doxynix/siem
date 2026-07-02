import { sql } from "drizzle-orm";
import { integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const rolesEnum = pgEnum("roles", ["analyst", "admin"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  role: rolesEnum("roles").default("analyst"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const incidents = pgTable("incidents", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  severity: varchar("severity", { length: 50 }).notNull(),
  findingsCount: integer("findings_count").default(0).notNull(),
  score: integer("score").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const findings = pgTable("findings", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  incidentId: uuid("incident_id")
    .references(() => incidents.id, { onDelete: "cascade" })
    .notNull(),
  ruleName: varchar("rule_name", { length: 100 }).notNull(),
  severity: varchar("severity", { length: 50 }).notNull(),
  matchedText: text("matched_text").notNull(),
  line: integer("line").notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  actor: varchar("actor", { length: 100 }).notNull(),
  action: varchar("action", { length: 150 }).notNull(),
  target: varchar("target", { length: 150 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
