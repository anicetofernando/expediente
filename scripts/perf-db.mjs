import pg from "pg";
import { performance } from "node:perf_hooks";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });

const checks = [
  ["ping", "SELECT 1", []],
  [
    "sessao",
    `SELECT u.id
       FROM users u
       JOIN user_profiles up ON up.user_id=u.id AND up.is_primary=true
       JOIN profiles p ON p.id=up.profile_id AND p.active=true
       JOIN organizational_units ou ON ou.id=u.unit_id
      WHERE u.email=$1
      LIMIT 1`,
    ["sandro.tivane@cfm.co.mz"],
  ],
  [
    "utilizadores",
    `SELECT u.id,array_agg(up.profile_id)
       FROM users u JOIN user_profiles up ON up.user_id=u.id
      GROUP BY u.id ORDER BY u.full_name`,
    [],
  ],
  ["unidades", "SELECT * FROM organizational_units ORDER BY code", []],
  [
    "perfis",
    `SELECT p.id,count(up.user_id)::int
       FROM profiles p LEFT JOIN user_profiles up ON up.profile_id=p.id
      GROUP BY p.id ORDER BY p.id`,
    [],
  ],
];

try {
  for (const [name, sql, values] of checks) {
    const started = performance.now();
    const result = await pool.query(sql, values);
    console.log(`${name}: ${(performance.now() - started).toFixed(1)} ms (${result.rowCount} linhas)`);
  }
} finally {
  await pool.end();
}
