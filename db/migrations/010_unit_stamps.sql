-- Cada unidade activa recebe um carimbo institucional proprio. Os carimbos
-- funcionais existentes (protocolo, recebido, confidencial, etc.) permanecem.

UPDATE system_settings settings
   SET setting_value = jsonb_set(
     settings.setting_value,
     '{stamps}',
     COALESCE(settings.setting_value->'stamps', '[]'::jsonb) || COALESCE((
       SELECT jsonb_agg(jsonb_build_object(
         'id', 'st-unidade-' || unit.id,
         'nome', 'Carimbo institucional - ' || unit.acronym,
         'categoria', 'institucional',
         'unidade', unit.name,
         'utilizadoresAutorizados', '[]'::jsonb,
         'etapasPermitidas', jsonb_build_array('Aprovacao', 'Emissao'),
         'tiposDocumento', jsonb_build_array('Todos'),
         'posicao', 'inferior-direita',
         'tamanho', 'medio',
         'transparencia', 0,
         'validadeDias', NULL,
         'activo', true,
         'utilizacoes', 0,
         'cor', 'navy'
       ))
         FROM organizational_units unit
        WHERE unit.active = true
          AND NOT EXISTS (
            SELECT 1
              FROM jsonb_array_elements(COALESCE(settings.setting_value->'stamps', '[]'::jsonb)) stamp
             WHERE stamp->>'id' = 'st-unidade-' || unit.id
          )
     ), '[]'::jsonb),
     true
   )
 WHERE settings.setting_key = 'catalogs';
