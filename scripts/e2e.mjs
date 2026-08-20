import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3017";
const password = process.env.TEST_USER_PASSWORD ?? "CFM@2026!";
const createdIds = [];
const createdProfileIds = [];
const createdDelegationIds = [];
const createdUserIds = [];
const unique = Date.now().toString(36);
const checks = [];
const testStartedAt = new Date().toISOString();
let userSnapshots = [];
let sequenceSnapshots = [];
let institutionalAccounts = [];

async function takeSnapshot() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("DELETE FROM number_sequences WHERE NOT EXISTS (SELECT 1 FROM expedients)");
    userSnapshots = (await client.query("SELECT id,last_access_at,failed_login_attempts,locked_until FROM users")).rows;
    sequenceSnapshots = (await client.query("SELECT unit_id,year,next_value FROM number_sequences")).rows;
    institutionalAccounts = (await client.query(`SELECT u.email,p.slug FROM users u JOIN user_profiles up ON up.user_id=u.id AND up.is_primary=true JOIN profiles p ON p.id=up.profile_id WHERE u.email NOT LIKE 'e2e.%' ORDER BY u.email`)).rows;
  } finally { await client.end(); }
}

function check(name, condition, details = {}) {
  assert.ok(condition, `${name}: ${JSON.stringify(details)}`);
  checks.push({ name, ok: true, ...details });
}

async function login(email, loginPassword = password) {
  const response = await fetch(`${base}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: loginPassword, persistent: false }) });
  const data = await response.json();
  check(`login ${email}`, response.ok && data.ok, { status: response.status, redirect: data.redirectTo });
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie, `Cookie ausente para ${email}`);
  return cookie;
}

async function jsonRequest(cookie, pathname, options = {}) {
  const response = await fetch(`${base}${pathname}`, { ...options, headers: { ...(options.body ? { "content-type": "application/json" } : {}), ...(options.headers ?? {}), cookie } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${options.method ?? "GET"} ${pathname}: ${response.status} ${JSON.stringify(data)}`);
  return { response, data };
}

function baseExpedient(overrides = {}) {
  const due = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  return {
    tipo: "td-carta", unidadeOrigem: "u-doc", remetente: "Felismina Cossa", destinatario: "u-doc",
    assunto: "TESTE E2E - Pedido de intervencao", prioridade: "alta", confidencialidade: "interno", prazo: due,
    origemDocumento: "sistema", modeloId: "tpl-oficio", conteudo: "<p><strong>Exmo. Senhor,</strong></p><p>Solicitamos uma intervenção de teste.</p><p>Com os melhores cumprimentos.</p>",
    ficheiroNome: "", numPaginas: 1, carimbo: "nao", carimboId: "", solicitarAssinatura: false, posicaoPredefinida: true, anexos: [], rascunho: false,
    ...overrides,
  };
}

async function createExpedient(cookie, data, files = {}) {
  const form = new FormData();
  form.set("data", JSON.stringify(data));
  if (files.main) form.set("mainFile", files.main);
  for (const attachment of files.attachments ?? []) form.append("attachments", attachment);
  const response = await fetch(`${base}/api/expedients`, { method: "POST", headers: { cookie }, body: form });
  const result = await response.json();
  if (!response.ok) throw new Error(`create: ${response.status} ${JSON.stringify(result)}`);
  createdIds.push(result.id);
  return result;
}

async function updateDraft(cookie, id, data, files = {}) {
  const form = new FormData();
  form.set("data", JSON.stringify(data));
  if (files.main) form.set("mainFile", files.main);
  for (const attachment of files.attachments ?? []) form.append("attachments", attachment);
  const response = await fetch(`${base}/api/expedients/${id}/draft`, { method: "PUT", headers: { cookie }, body: form });
  const result = await response.json();
  if (!response.ok) throw new Error(`update draft: ${response.status} ${JSON.stringify(result)}`);
  return result;
}

async function action(cookie, id, actionName, extra = {}) {
  const { data } = await jsonRequest(cookie, `/api/expedients/${id}/actions`, { method: "POST", body: JSON.stringify({ action: actionName, note: `Teste: ${actionName}`, ...extra }) });
  check(`action ${actionName}`, data.ok === true);
  return data;
}

async function cleanup() {
  if (!process.env.DATABASE_URL) return;
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("BEGIN");
    if (createdIds.length) await client.query("DELETE FROM expedients WHERE id=ANY($1::uuid[])", [createdIds]);
    const entities = [...createdIds, ...createdProfileIds, ...createdDelegationIds, ...createdUserIds, "utilizador.inexistente@cfm.co.mz", `e2e.recovery.${unique}@cfm.co.mz`, `E2E notification ${unique}`];
    await client.query("DELETE FROM audit_logs WHERE created_at >= $1 OR entity_id=ANY($2::text[]) OR user_id=ANY($3::uuid[])", [testStartedAt, entities, createdUserIds]);
    if (createdDelegationIds.length) await client.query("DELETE FROM delegations WHERE id=ANY($1::uuid[])", [createdDelegationIds]);
    if (createdUserIds.length) await client.query("DELETE FROM users WHERE id=ANY($1::uuid[])", [createdUserIds]);
    if (createdProfileIds.length) await client.query("DELETE FROM profiles WHERE id=ANY($1::text[])", [createdProfileIds]);
    await client.query("DELETE FROM notifications WHERE title=$1", [`Teste: E2E notification ${unique}`]);
    for (const user of userSnapshots) await client.query("UPDATE users SET last_access_at=$2,failed_login_attempts=$3,locked_until=$4 WHERE id=$1", [user.id,user.last_access_at,user.failed_login_attempts,user.locked_until]);
    await client.query("DELETE FROM number_sequences");
    for (const sequence of sequenceSnapshots) await client.query("INSERT INTO number_sequences(unit_id,year,next_value) VALUES($1,$2,$3)", [sequence.unit_id,sequence.year,sequence.next_value]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { await client.end(); }
  const root = path.resolve(process.cwd(), "storage", "uploads");
  for (const id of createdIds) {
    const target = path.resolve(root, id);
    if (target.startsWith(root + path.sep)) await rm(target, { recursive: true, force: true });
  }
}

await takeSnapshot();

try {
  const invalid = await fetch(`${base}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "utilizador.inexistente@cfm.co.mz", password: "incorrecta" }) });
  check("invalid login rejected", invalid.status === 401, { status: invalid.status });

  for (const account of institutionalAccounts) await login(account.email);
  check("all institutional users authenticate", institutionalAccounts.length === 17, { users: institutionalAccounts.length });

  const sender = await login("felismina.cossa@cfm.co.mz");
  const pastForm = new FormData();
  pastForm.set("data", JSON.stringify(baseExpedient({ assunto: "TESTE E2E - Prazo inválido", prazo: new Date(Date.now() - 86400000).toISOString().slice(0, 10) })));
  const pastResponse = await fetch(`${base}/api/expedients`, { method: "POST", headers: { cookie: sender }, body: pastForm });
  check("past delivery date rejected", pastResponse.status === 400, { status: pastResponse.status });
  const written = await createExpedient(sender, baseExpedient({ carimbo: "automatico", solicitarAssinatura: true }));
  check("written letter created", !!written.id && written.protocolo.startsWith("CFM/DOC/"), { protocol: written.protocolo });
  const detail = await fetch(`${base}/expedientes/${written.id}`, { headers: { cookie: sender } });
  check("sender reads own expedient", detail.status === 200, { status: detail.status });
  const comment = await jsonRequest(sender, `/api/expedients/${written.id}/comments`, { method: "POST", body: JSON.stringify({ body: "Comentário funcional E2E", internal: false }) });
  check("comment persisted", comment.data.comment?.texto === "Comentário funcional E2E");

  const attached = await createExpedient(sender, baseExpedient({ assunto: "TESTE E2E - Carta anexada", origemDocumento: "importado", modeloId: "", conteudo: "", ficheiroNome: "carta-teste.pdf", anexos: [{ nome: "anexo-teste.png", descricao: "Anexo E2E", confidencialidade: "interno" }] }), {
    main: new File(["%PDF-1.4\n% teste local\n"], "carta-teste.pdf", { type: "application/pdf" }),
    attachments: [new File([new Uint8Array([137,80,78,71,13,10,26,10])], "anexo-teste.png", { type: "image/png" })],
  });
  check("attached letter created", !!attached.id, { protocol: attached.protocolo });

  const draft = await createExpedient(sender, baseExpedient({ assunto: "TESTE E2E - Rascunho", rascunho: true }));
  check("draft created without official sequence", !!draft.id && draft.protocolo.startsWith("RASCUNHO-"), { protocol: draft.protocolo });
  const editableDraft = await jsonRequest(sender, `/api/expedients/${draft.id}/draft`);
  check("draft can be reopened for editing", editableDraft.data.draft?.assunto === "TESTE E2E - Rascunho" && /^\d{4}-\d{2}-\d{2}$/.test(editableDraft.data.draft?.prazo), { dueDate: editableDraft.data.draft?.prazo });
  const inboxWithDraft = await fetch(`${base}/expedientes/caixa-entrada`, { headers: { cookie: sender } });
  check("draft excluded from inbox", inboxWithDraft.status === 200 && !(await inboxWithDraft.text()).includes(draft.protocolo));
  const editedDraft = await updateDraft(sender, draft.id, baseExpedient({ assunto: "TESTE E2E - Rascunho editado", rascunho: true }));
  check("draft changes persist", editedDraft.rascunho === true && editedDraft.protocolo === draft.protocolo);
  const submittedDraft = await action(sender, draft.id, "submeter");
  check("draft receives official protocol on submission", submittedDraft.protocolo?.startsWith("CFM/DOC/"), { protocol: submittedDraft.protocolo });

  const privateDraft = await createExpedient(sender, baseExpedient({ assunto: "TESTE E2E - Rascunho privado da Secretaria", rascunho: true }));

  const secretary = await login("cremilda.nhantumbo@cfm.co.mz");
  const secretaryReception = await fetch(`${base}/secretaria`, { headers: { cookie: secretary } });
  const secretaryReceptionHtml = await secretaryReception.text();
  check("obsolete digitization menu removed from secretary", secretaryReception.status === 200 && !secretaryReceptionHtml.includes("DigitalizaÃ§Ãµes"), { status: secretaryReception.status });
  const secretaryConsultation = await fetch(`${base}/expedientes`, { headers: { cookie: secretary } });
  const secretaryConsultationHtml = await secretaryConsultation.text();
  check("secretary consultation opens submitted expedient", secretaryConsultation.status === 200 && secretaryConsultationHtml.includes(submittedDraft.protocolo), { status: secretaryConsultation.status });
  check("expedient rows are directly clickable", secretaryConsultationHtml.includes('role="link"') && secretaryConsultationHtml.includes('tabindex="0"'));
  check("private draft excluded from secretary consultation", !secretaryConsultationHtml.includes(privateDraft.protocolo));
  const secretaryBook = await fetch(`${base}/livro`, { headers: { cookie: secretary } });
  check("private draft excluded from secretary book", secretaryBook.status === 200 && !(await secretaryBook.text()).includes(privateDraft.protocolo), { status: secretaryBook.status });
  const secretaryDetail = await fetch(`${base}/expedientes/${written.id}`, { headers: { cookie: secretary } });
  check("secretary opens expedient details", secretaryDetail.status === 200, { status: secretaryDetail.status });
  const privateDraftDetail = await fetch(`${base}/expedientes/${privateDraft.id}`, { headers: { cookie: secretary } });
  const privateDraftDetailHtml = await privateDraftDetail.text();
  check(
    "secretary cannot read another user's private draft",
    !privateDraftDetailHtml.includes(privateDraft.protocolo) && !privateDraftDetailHtml.includes("TESTE E2E - Rascunho privado da Secretaria"),
    { status: privateDraftDetail.status }
  );
  const secretaryAuthorizations = await jsonRequest(secretary, "/api/document-authorizations");
  check("secretary only sees unit stamps", secretaryAuthorizations.data.stamps.length > 0 && secretaryAuthorizations.data.stamps.every((stamp) => stamp.unidade === "Secretaria Geral" || stamp.unidade === "Global"));
  check("secretary has no shared departmental signature", secretaryAuthorizations.data.signatures.length === 0);
  await action(secretary, written.id, "receber");
  await action(secretary, written.id, "protocolar");
  await action(secretary, written.id, "encaminhar", { target: "u-doc" });

  const approver = await login("fatima.momade@cfm.co.mz");
  const approverAuthorizations = await jsonRequest(approver, "/api/document-authorizations");
  check("approver only sees own individual signature", approverAuthorizations.data.signatures.length === 1 && approverAuthorizations.data.signatures[0].email === "fatima.momade@cfm.co.mz");
  await action(approver, written.id, "aprovar");
  await action(approver, written.id, "assinatura");
  await action(approver, written.id, "disponibilizar");
  await action(sender, written.id, "confirmar");
  await action(secretary, written.id, "arquivar");

  const admin = await login("sandro.tivane@cfm.co.mz");
  const adminPage = await fetch(`${base}/admin/utilizadores`, { headers: { cookie: admin } });
  check("admin user management opens", adminPage.status === 200, { status: adminPage.status });
  for (const pathname of ["/documentos", "/actividade", "/livro", "/relatorios", "/admin/perfis", "/admin/configuracoes"]) {
    const page = await fetch(`${base}${pathname}`, { headers: { cookie: admin } });
    check(`real page ${pathname}`, page.status === 200, { status: page.status });
  }
  const catalogs = await jsonRequest(admin, "/api/settings/catalogs");
  const settings = await jsonRequest(admin, "/api/admin/settings/general-configuration");
  check("database settings endpoints", "catalogs" in catalogs.data && "value" in settings.data);

  const profile = await jsonRequest(admin, "/api/profiles", { method: "POST", body: JSON.stringify({ nome: `E2E Perfil ${unique}`, descricao: "Perfil temporário de validação", nivel: "operacional", ambito: "unidade" }) });
  createdProfileIds.push(profile.data.profile.id);
  await jsonRequest(admin, `/api/profiles/${profile.data.profile.id}`, { method: "PATCH", body: JSON.stringify({ permissoes: ["expedientes.criar"] }) });
  check("profile and permission persistence", !!profile.data.profile.id);

  const delegation = await jsonRequest(admin, "/api/delegations", { method: "POST", body: JSON.stringify({ delegatorId: "00000000-0000-0000-0000-000000000000", delegateId: "00000000-0000-0000-0000-000000000001", startsOn: new Date().toISOString().slice(0,10), endsOn: new Date(Date.now()+86400000).toISOString().slice(0,10), reason: "E2E" }) }).catch(() => null);
  check("delegation validation rejects unknown users", delegation === null);
  const lookupClient = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await lookupClient.connect();
  const delegationUsers = await lookupClient.query("SELECT id,email FROM users WHERE email=ANY($1::text[])", [["fatima.momade@cfm.co.mz","amelia.nhaca@cfm.co.mz"]]);
  await lookupClient.end();
  const delegatorId = delegationUsers.rows.find((row) => row.email === "fatima.momade@cfm.co.mz")?.id;
  const delegateId = delegationUsers.rows.find((row) => row.email === "amelia.nhaca@cfm.co.mz")?.id;
  const validDelegation = await jsonRequest(admin, "/api/delegations", { method: "POST", body: JSON.stringify({ delegatorId, delegateId, startsOn: new Date().toISOString().slice(0,10), endsOn: new Date(Date.now()+86400000).toISOString().slice(0,10), reason: `E2E delegation ${unique}` }) });
  createdDelegationIds.push(validDelegation.data.id);
  await jsonRequest(admin, `/api/delegations/${validDelegation.data.id}`, { method: "PATCH" });
  check("delegation create and close", true);

  const tempEmail = `e2e.user.${unique}@cfm.co.mz`;
  const tempUser = await jsonRequest(admin, "/api/users", { method: "POST", body: JSON.stringify({ nome: `Utilizador E2E ${unique}`, email: tempEmail, cargo: "Teste", unidadeId: "u-doc", perfilId: "p-remetente", estado: "activo" }) });
  createdUserIds.push(tempUser.data.user.id);
  const tempCookie = await login(tempEmail);
  await jsonRequest(tempCookie, "/api/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword: password, newPassword: "E2E@2026!" }) });
  await login(tempEmail, "E2E@2026!");
  check("user creation and password change", true);

  const testNotification = await jsonRequest(admin, "/api/admin/notifications/test", { method: "POST", body: JSON.stringify({ rule: { nome: `E2E notification ${unique}`, evento: "Teste automatizado", urgente: false } }) });
  check("admin notification test persisted", testNotification.data.ok === true);
  const recovery = await fetch(`${base}/api/auth/recover`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: `e2e.recovery.${unique}@cfm.co.mz` }) });
  check("recovery request is privacy-safe", recovery.status === 200);
  const notifications = await jsonRequest(secretary, "/api/notifications");
  check("notifications generated", Array.isArray(notifications.data.items) && notifications.data.items.length > 0, { count: notifications.data.items?.length });

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const database = await client.query(`SELECT e.status,(SELECT count(*)::int FROM documents d WHERE d.expedient_id=e.id) documents,(SELECT count(*)::int FROM timeline_events t WHERE t.expedient_id=e.id) events,(SELECT count(*)::int FROM comments c WHERE c.expedient_id=e.id) comments,(SELECT id::text FROM documents d WHERE d.expedient_id=e.id AND d.document_kind='principal' LIMIT 1) document_id,(SELECT stamped FROM documents d WHERE d.expedient_id=e.id AND d.document_kind='principal' LIMIT 1) stamped,(SELECT signed FROM documents d WHERE d.expedient_id=e.id AND d.document_kind='principal' LIMIT 1) signed,(SELECT stamp_metadata IS NOT NULL AND signature_metadata IS NOT NULL FROM documents d WHERE d.expedient_id=e.id AND d.document_kind='principal' LIMIT 1) output_metadata,(SELECT template_metadata IS NOT NULL FROM documents d WHERE d.expedient_id=e.id AND d.document_kind='principal' LIMIT 1) template_saved,(SELECT signature_metadata->>'proprietario' FROM documents d WHERE d.expedient_id=e.id AND d.document_kind='principal' LIMIT 1) signer FROM expedients e WHERE e.id=$1`, [written.id]);
  await client.end();
  check("database final state", database.rows[0]?.status === "arquivado" && database.rows[0]?.documents === 1 && database.rows[0]?.events >= 10 && database.rows[0]?.comments === 1, database.rows[0]);
  check("stamp and signature persisted", database.rows[0]?.stamped === true && database.rows[0]?.signed === true && database.rows[0]?.output_metadata === true, database.rows[0]);
  check("template layout snapshot persisted", database.rows[0]?.template_saved === true, database.rows[0]);
  check("correct individual signed document", database.rows[0]?.signer === "Fátima Momade", database.rows[0]);
  const pdfResponse = await fetch(`${base}/api/documents/${database.rows[0].document_id}/pdf?download=1`, { headers: { cookie: sender } });
  const pdfBytes = Buffer.from(await pdfResponse.arrayBuffer());
  check("final PDF downloads and matches PDF format", pdfResponse.ok && pdfResponse.headers.get("content-type") === "application/pdf" && pdfResponse.headers.get("content-disposition")?.startsWith("attachment") && pdfBytes.subarray(0, 4).toString() === "%PDF", { status: pdfResponse.status, bytes: pdfBytes.length });

  process.stdout.write(`${JSON.stringify({ ok: true, checks }, null, 2)}\n`);
} finally {
  await cleanup();
}
