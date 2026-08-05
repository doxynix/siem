import type { PaginatedResponse } from "@doxynix/siem-shared";
import { db } from "@server/core/db/db";
import { executePaginatedQuery } from "@server/core/db/pagination";
import { type RuleSelect, rules } from "@server/core/db/schema";
import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import postgres from "postgres";
import type { CreateRuleInput, GetRulesQuery, UpdateRuleInput } from "./rules.schema";

export async function getRulesList(query: GetRulesQuery): Promise<PaginatedResponse<RuleSelect>> {
  const { page, limit, severity, isActive, search } = query;

  const conditions: SQL[] = [];

  if (severity != null) {
    conditions.push(eq(rules.severity, severity));
  }

  if (isActive != null) {
    conditions.push(eq(rules.isActive, isActive));
  }

  if (search != null && search.trim() !== "") {
    const cleanSearch = `%${search.trim().replace(/[%_]/g, "\\$&")}%`;
    const searchCondition = or(
      ilike(rules.name, cleanSearch),
      ilike(rules.description, cleanSearch),
    );

    if (searchCondition != null) {
      conditions.push(searchCondition);
    }
  }

  const whereClause: SQL | undefined = conditions.length > 0 ? and(...conditions) : undefined;

  return executePaginatedQuery({
    table: rules,
    whereClause,
    orderBy: [desc(rules.createdAt), desc(rules.id)],
    page,
    limit,
  });
}

export async function createRule(data: CreateRuleInput): Promise<RuleSelect | null> {
  const [newRule] = await db
    .insert(rules)
    .values(data)
    .onConflictDoNothing({ target: rules.name })
    .returning();

  return newRule ?? null;
}

type UpdateRuleResult =
  | { success: true; data: RuleSelect }
  | { success: false; reason: "not_found" | "conflict" };

export async function updateRule(id: string, data: UpdateRuleInput): Promise<UpdateRuleResult> {
  try {
    const [updated] = await db.update(rules).set(data).where(eq(rules.id, id)).returning();

    if (updated == null) {
      return { success: false, reason: "not_found" };
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof postgres.PostgresError && error.code === "23505") {
      return { success: false, reason: "conflict" };
    }
    throw error;
  }
}

export async function deleteRule(id: string): Promise<boolean> {
  const [deleted] = await db.delete(rules).where(eq(rules.id, id)).returning();
  return Boolean(deleted);
}
