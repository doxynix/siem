import type { ScanResult } from "@doxynix/siem-shared";
import { db } from "@server/core/db/db";
import { findings, incidents, rules } from "@server/core/db/schema";
import { eq } from "drizzle-orm";
import { analyzeLogContent } from "./scan.engine";

export async function scanLogContent(content: string, fileName: string): Promise<ScanResult> {
  const activeRules = await db
    .select({
      id: rules.id,
      name: rules.name,
      severity: rules.severity,
      pattern: rules.pattern,
    })
    .from(rules)
    .where(eq(rules.isActive, true));

  const engineResult = analyzeLogContent(content, activeRules);

  if (engineResult.isSafe) {
    return {
      isSafe: true,
      message: "Log content is safe. No sensitive data leaked.",
      findings: [],
    };
  }

  await db.transaction(async (tx) => {
    const [insertedIncident] = await tx
      .insert(incidents)
      .values({
        fileName,
        severity: engineResult.maxSeverity,
        findingsCount: engineResult.findings.length,
        score: engineResult.score,
      })
      .returning();

    if (insertedIncident == null) {
      throw new Error("Failed to persist security incident record");
    }

    await tx.insert(findings).values(
      engineResult.findings.map((f) => ({
        incidentId: insertedIncident.id,
        ruleName: f.ruleName,
        severity: f.severity,
        matchedText: f.matchedText,
        line: f.line,
      })),
    );
  });

  return {
    isSafe: false,
    message: `Security threat detected! Found ${engineResult.findings.length} leak(s).`,
    findings: engineResult.findings,
  };
}
