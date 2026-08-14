import "server-only";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __expedientePool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL nao esta configurada.");
  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 30_000,
  });
}

export const db = global.__expedientePool ?? createPool();
if (process.env.NODE_ENV !== "production") global.__expedientePool = db;

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  try {
    return await db.query<T>(text, values);
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (!message.includes("connection") && !message.includes("timeout") && !message.includes("econnreset")) throw error;
    return db.query<T>(text, values);
  }
}

export async function transaction<T>(work: (client: PoolClient) => Promise<T>) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
