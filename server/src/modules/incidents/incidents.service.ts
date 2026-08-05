import type { PaginatedResponse } from "@doxynix/siem-shared";
import { db } from "@server/core/db/db";
import { executePaginatedQuery } from "@server/core/db/pagination";
import { type IncidentSelect, incidents } from "@server/core/db/schema";
import { and, desc, eq, ilike, type SQL } from "drizzle-orm";
import type { GetIncidentsQuery } from "./incidents.schema";

export async function getIncidentsList(
  query: GetIncidentsQuery,
): Promise<PaginatedResponse<IncidentSelect>> {
  const { page, limit, severity, fileName } = query;

  const conditions: SQL[] = [];

  if (severity != null) {
    conditions.push(eq(incidents.severity, severity));
  }

  if (fileName != null && fileName.trim() !== "") {
    const cleanFileName = `%${fileName.trim().replace(/[%_]/g, "\\$&")}%`;
    conditions.push(ilike(incidents.fileName, cleanFileName));
  }

  const whereClause: SQL | undefined = conditions.length > 0 ? and(...conditions) : undefined;

  return executePaginatedQuery({
    table: incidents,
    whereClause,
    orderBy: [desc(incidents.createdAt), desc(incidents.id)],
    page,
    limit,
  });
}

export async function getIncidentById(id: string) {
  const incident = await db.query.incidents.findFirst({
    where: (table, { eq }) => eq(table.id, id),
    with: {
      findings: true,
    },
  });

  return incident ?? null;
}
