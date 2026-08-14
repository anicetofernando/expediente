import process from "node:process";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL nao definida.");

const client = new pg.Client({ connectionString });
await client.connect();
try {
  const result = await client.query(`
    SELECT
      (SELECT count(*)::int FROM users) users,
      (SELECT count(*)::int FROM profiles) profiles,
      (SELECT count(*)::int FROM user_profiles) assignments,
      (SELECT count(*)::int FROM organizational_units) units,
      (SELECT count(*)::int FROM expedients) expedients,
      (SELECT count(*)::int FROM users WHERE email LIKE 'e2e.%') e2e_users,
      (SELECT count(*)::int FROM profiles WHERE name LIKE 'E2E %') e2e_profiles,
      (SELECT count(*)::int FROM delegations WHERE reason LIKE 'E2E%') e2e_delegations
      ,(SELECT count(*)::int FROM number_sequences) sequences
      ,(SELECT count(*)::int FROM audit_logs WHERE entity_id ILIKE 'e2e%' OR details::text ILIKE '%E2E%') e2e_audit
  `);
  const value = result.rows[0];
  if (value.users < 4 || value.profiles < 4 || value.assignments < 4 || value.units < 1) {
    throw new Error(`Dados iniciais invalidos: ${JSON.stringify(value)}`);
  }
  process.stdout.write(`${JSON.stringify({ ok: true, ...value })}\n`);
} finally {
  await client.end();
}
