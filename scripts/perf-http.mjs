import { performance } from "node:perf_hooks";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3017";
const email = process.env.PERF_EMAIL ?? "sandro.tivane@cfm.co.mz";
const password = process.env.PERF_PASSWORD;

if (!password) throw new Error("PERF_PASSWORD e obrigatoria.");

async function timedFetch(path, options = {}) {
  const started = performance.now();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    signal: AbortSignal.timeout(120_000),
  });
  await response.arrayBuffer();
  return { response, elapsed: performance.now() - started };
}

const login = await timedFetch("/api/auth/login", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password, remember: false }),
});
if (!login.response.ok) throw new Error(`Login falhou: HTTP ${login.response.status}`);
const cookie = login.response.headers.get("set-cookie")?.split(";")[0];
if (!cookie) throw new Error("Cookie de autenticacao nao recebido.");
console.log(`login: ${login.elapsed.toFixed(1)} ms`);

for (const path of ["/admin/utilizadores", "/admin/configuracoes", "/perfil", "/notificacoes"]) {
  const samples = [];
  for (let index = 0; index < 3; index += 1) {
    const result = await timedFetch(path, { headers: { cookie } });
    if (!result.response.ok) throw new Error(`${path} falhou: HTTP ${result.response.status}`);
    samples.push(result.elapsed);
  }
  const warm = samples.slice(1);
  const average = warm.reduce((sum, value) => sum + value, 0) / warm.length;
  console.log(`${path}: primeiro=${samples[0].toFixed(1)} ms, aquecido=${average.toFixed(1)} ms`);
}
