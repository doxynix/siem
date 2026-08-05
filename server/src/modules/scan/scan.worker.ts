import type { Entry, QueryResult } from "@axiomhq/js";
import { axiom } from "@server/core/axiom";
import { db } from "@server/core/db/db";
import { cronSyncState } from "@server/core/db/schema";
import { env } from "@server/core/env";
import { scanLogContent } from "@server/modules/scan/scan.service";
import { eq } from "drizzle-orm";

const SERVICE_NAME = "axiom_log_ingestion";
const BATCH_LIMIT = 1000;
const DEFAULT_LOOKBACK_MINUTES = 60;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function getLastSyncedTimestamp(): Promise<string> {
  const [syncState] = await db
    .select({ position: cronSyncState.lastSyncedPosition })
    .from(cronSyncState)
    .where(eq(cronSyncState.serviceName, SERVICE_NAME));

  if (syncState?.position != null) {
    return syncState.position;
  }

  const lookbackDuration = Temporal.Duration.from({ minutes: DEFAULT_LOOKBACK_MINUTES });

  const fallbackInstant = Temporal.Now.instant().subtract(lookbackDuration);

  return fallbackInstant.toString();
}

async function updateSyncedTimestamp(lastTime: string): Promise<void> {
  await db
    .insert(cronSyncState)
    .values({
      serviceName: SERVICE_NAME,
      lastSyncedPosition: lastTime,
    })
    .onConflictDoUpdate({
      target: cronSyncState.serviceName,
      set: {
        lastSyncedPosition: lastTime,
        updatedAt: new Date(),
      },
    });
}

export async function runAxiomSyncCycle(): Promise<{ processedCount: number; hasMore: boolean }> {
  const lastTime = await getLastSyncedTimestamp();

  const aplQuery = `
    ['${env.AXIOM_DATASET}']
    | where _time > datetime('${lastTime}')
    | where not(message contains '/ping' or message contains '/health' or message contains 'favicon.ico')
    | sort by _time asc
    | limit ${BATCH_LIMIT}
  `;

  const startTimeMs = performance.now();
  console.log(`🔍 [Axiom Sync] Querying dataset '${env.AXIOM_DATASET}' starting from: ${lastTime}`);

  const response: QueryResult = await axiom.query(aplQuery);

  if (response.matches == null || response.matches.length === 0) {
    console.log(`💤 [Axiom Sync] No new logs found. Up to date at ${lastTime}. Waiting...`);
    return { processedCount: 0, hasMore: false };
  }

  const matches: Entry[] = response.matches;
  console.log(`📥 [Axiom Sync] Fetched ${matches.length} log event(s) from Axiom.`);

  const logLines: string[] = [];
  let newestTimestamp = lastTime;

  for (const match of matches) {
    const itemTime = match._time;
    if (itemTime != null && itemTime > newestTimestamp) {
      newestTimestamp = itemTime;
    }

    const messageText = match.data?.message ?? match.data?.raw ?? match.data?.content;
    if (messageText != null) {
      logLines.push(String(messageText));
    }
  }

  if (newestTimestamp === lastTime && matches.length > 0) {
    const date = new Date(lastTime);
    date.setMilliseconds(date.getMilliseconds() + 1);
    newestTimestamp = date.toISOString();
  }

  if (logLines.length > 0) {
    console.log(
      `⚡ [SIEM Engine] Analyzing ${logLines.length} log line(s) with active detection rules...`,
    );

    const scanResult = await scanLogContent(
      logLines.join("\n"),
      `axiom_${env.AXIOM_DATASET}_${newestTimestamp}.log`,
    );

    const scanDurationMs = (performance.now() - startTimeMs).toFixed(1);

    if (scanResult.isSafe) {
      console.log(
        `✅ [SIEM Engine] Scan clean. No leaks across ${logLines.length} line(s) (${scanDurationMs}ms).`,
      );
    } else {
      const leaksCount = scanResult.findings?.length ?? 0;
      console.warn(
        `🚨 [SIEM ALERT] SECURITY INCIDENT CREATED! Found ${leaksCount} leak(s) in ${scanDurationMs}ms:`,
      );

      scanResult.findings?.forEach((finding, idx) => {
        console.warn(
          `   ${idx + 1}. [${finding.severity.toUpperCase()}] Rule: "${finding.ruleName}" (Line ${finding.line}) -> ${finding.matchedText}`,
        );
      });
    }
  }

  await updateSyncedTimestamp(newestTimestamp);
  console.log(`💾 [Axiom Sync] Checkpoint updated in PostgreSQL -> ${newestTimestamp}`);

  const hasMore = matches.length >= BATCH_LIMIT;
  return { processedCount: matches.length, hasMore };
}

export async function startAxiomIngestionWorker() {
  console.log(
    `🚀 [Axiom Worker] Starting SIEM Ingestion Daemon (Dataset: '${env.AXIOM_DATASET}', Batch Limit: ${BATCH_LIMIT})...`,
  );

  while (true) {
    try {
      const { hasMore } = await runAxiomSyncCycle();

      if (hasMore) {
        console.log(
          `⏩ [Axiom Worker] Batch limit reached (${BATCH_LIMIT}). Catch-up mode active!`,
        );
        continue;
      }

      await sleep(10_000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        `❌ [Axiom Worker Error] Sync cycle failed: ${errorMessage}. Retrying in 15s...`,
      );
      await sleep(15_000);
    }
  }
}
