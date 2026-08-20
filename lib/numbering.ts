import type { PoolClient } from "pg";

export interface UnitNumberingConfig {
  unitId: string;
  prefixoInstitucional: string;
  separador: "/" | "-" | ".";
  digitos: number;
  reinicioAnual: boolean;
}

const DEFAULTS = { prefixoInstitucional: "CFM", separador: "/" as const, digitos: 4, reinicioAnual: true };

export const GLOBAL_NUMBERING_ID = "";

async function loadNumberingConfig(client: PoolClient, unitId: string) {
  const result = await client.query<{ setting_value: unknown }>("SELECT setting_value FROM system_settings WHERE setting_key='numbering'", []);
  const list = Array.isArray(result.rows[0]?.setting_value) ? result.rows[0].setting_value as UnitNumberingConfig[] : [];
  const global = list.find((item) => item.unitId === GLOBAL_NUMBERING_ID);
  const override = list.find((item) => item.unitId === unitId);
  return {
    prefixoInstitucional: override?.prefixoInstitucional ?? global?.prefixoInstitucional ?? DEFAULTS.prefixoInstitucional,
    separador: override?.separador ?? global?.separador ?? DEFAULTS.separador,
    digitos: override?.digitos ?? global?.digitos ?? DEFAULTS.digitos,
    reinicioAnual: override?.reinicioAnual ?? global?.reinicioAnual ?? DEFAULTS.reinicioAnual,
  };
}

/**
 * Generates the next protocol number for a unit, honouring the numbering format
 * configured in Administração → Numeração (falls back to the historical
 * CFM/SIGLA/ANO/0001 format when nothing is configured). When "reinício anual" is
 * disabled for a unit, the running counter is kept in the year=0 bucket of
 * number_sequences so it never resets, while the year segment shown in the
 * formatted number still reflects the current calendar year.
 */
export async function generateProtocolNumber(client: PoolClient, unitId: string, unitAcronym: string, year: number): Promise<string> {
  const config = await loadNumberingConfig(client, unitId);
  const bucketYear = config.reinicioAnual ? year : 0;
  const sequence = await client.query<{ value: number }>(
    `INSERT INTO number_sequences(unit_id,year,next_value) VALUES($1,$2,2)
     ON CONFLICT(unit_id,year) DO UPDATE SET next_value=number_sequences.next_value+1
     RETURNING next_value-1 value`,
    [unitId, bucketYear],
  );
  const padded = String(sequence.rows[0].value).padStart(config.digitos, "0");
  return [config.prefixoInstitucional, unitAcronym, String(year), padded].join(config.separador);
}
