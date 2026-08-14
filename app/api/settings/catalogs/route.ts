import { NextResponse } from "next/server";
import { audit, getCurrentSession } from "@/lib/auth";
import { query, transaction } from "@/lib/db";

interface UnitInput {
  id: string;
  nome: string;
  sigla: string;
  codigo: string;
  tipo: string;
  parentId?: string | null;
  contactos?: { email?: string; telefone?: string; ramal?: string };
  estado?: string;
}

function unitsFrom(value: unknown): UnitInput[] {
  if (!value || typeof value !== "object") return [];
  const units = (value as { organizationalUnits?: unknown }).organizationalUnits;
  if (!Array.isArray(units)) return [];
  return units.filter((unit): unit is UnitInput => {
    if (!unit || typeof unit !== "object") return false;
    const item = unit as Partial<UnitInput>;
    return Boolean(item.id && item.nome && item.sigla && item.codigo && item.tipo);
  });
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  const result = await query<{ setting_value: unknown }>(
    "SELECT setting_value FROM system_settings WHERE setting_key='catalogs'",
  );
  return NextResponse.json({ catalogs: result.rows[0]?.setting_value ?? null });
}

export async function PUT(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  if (session.perfilNavegacao !== "administracao") return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  const catalogs = await request.json().catch(() => null);
  if (!catalogs || typeof catalogs !== "object" || Array.isArray(catalogs)) {
    return NextResponse.json({ error: "Catalogos invalidos." }, { status: 400 });
  }
  const units = unitsFrom(catalogs);

  await transaction(async (client) => {
    for (const unit of units) {
      await client.query(
        `INSERT INTO organizational_units(id,name,acronym,code,unit_type,parent_id,email,phone,extension_number,active)
         VALUES($1,$2,$3,$4,$5,NULL,$6,$7,$8,$9)
         ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,acronym=EXCLUDED.acronym,code=EXCLUDED.code,
           unit_type=EXCLUDED.unit_type,email=EXCLUDED.email,phone=EXCLUDED.phone,
           extension_number=EXCLUDED.extension_number,active=EXCLUDED.active`,
        [unit.id, unit.nome, unit.sigla, unit.codigo, unit.tipo, unit.contactos?.email || null,
          unit.contactos?.telefone || null, unit.contactos?.ramal || null, unit.estado !== "inactivo"],
      );
    }
    for (const unit of units) {
      await client.query("UPDATE organizational_units SET parent_id=$2 WHERE id=$1", [unit.id, unit.parentId || null]);
    }
    await client.query(
      `INSERT INTO system_settings(setting_key,setting_value,updated_by)
       VALUES('catalogs',$1::jsonb,$2)
       ON CONFLICT(setting_key) DO UPDATE SET setting_value=EXCLUDED.setting_value,
         updated_by=EXCLUDED.updated_by,updated_at=now()`,
      [JSON.stringify(catalogs), session.user.id],
    );
  });
  await audit({ userId: session.user.id, action: "Catalogos actualizados", entityType: "Configuracao", entityId: "catalogs", details: { units: units.length } });
  return NextResponse.json({ ok: true });
}
