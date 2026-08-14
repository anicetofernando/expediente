import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL nao definida.");

const client = new pg.Client({ connectionString });
await client.connect();
try {
  const directory = path.join(process.cwd(), "db", "migrations");
  const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
  for (const file of files) {
    await client.query(await readFile(path.join(directory, file), "utf8"));
    process.stdout.write(`Aplicada: ${file}\n`);
  }
} finally {
  await client.end();
}
