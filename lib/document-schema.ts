import "server-only";
import type { PoolClient } from "pg";
import { query } from "@/lib/db";

type QueryExecutor = Pick<PoolClient, "query">;

let referenceMetadataColumnReady = false;

export async function ensureDocumentReferenceMetadataColumn(executor?: QueryExecutor) {
  if (referenceMetadataColumnReady) return;
  const sql = "ALTER TABLE documents ADD COLUMN IF NOT EXISTS reference_metadata jsonb";
  if (executor) await executor.query(sql);
  else await query(sql);
  referenceMetadataColumnReady = true;
}
