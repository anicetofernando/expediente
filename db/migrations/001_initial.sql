BEGIN;

CREATE TABLE IF NOT EXISTS organizational_units (
  id text PRIMARY KEY,
  name text NOT NULL,
  acronym varchar(20) NOT NULL,
  code varchar(30) NOT NULL UNIQUE,
  unit_type varchar(30) NOT NULL,
  parent_id text REFERENCES organizational_units(id),
  email text,
  phone text,
  extension_number text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id text PRIMARY KEY,
  slug varchar(30) NOT NULL UNIQUE CHECK (slug IN ('remetente','secretaria','superior','administracao')),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  access_level varchar(30) NOT NULL,
  scope varchar(30) NOT NULL DEFAULT 'unidade',
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  job_title text NOT NULL,
  unit_id text NOT NULL REFERENCES organizational_units(id),
  phone text,
  avatar_color varchar(30) NOT NULL DEFAULT 'navy',
  status varchar(20) NOT NULL DEFAULT 'activo' CHECK (status IN ('activo','inactivo','suspenso')),
  must_change_password boolean NOT NULL DEFAULT false,
  failed_login_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  last_access_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id text NOT NULL REFERENCES profiles(id),
  is_primary boolean NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, profile_id)
);

CREATE TABLE IF NOT EXISTS number_sequences (
  unit_id text NOT NULL REFERENCES organizational_units(id),
  year integer NOT NULL,
  next_value integer NOT NULL DEFAULT 1 CHECK (next_value > 0),
  PRIMARY KEY (unit_id, year)
);

CREATE TABLE IF NOT EXISTS expedients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol text NOT NULL UNIQUE,
  subject text NOT NULL,
  document_type text NOT NULL,
  description text NOT NULL DEFAULT '',
  status varchar(40) NOT NULL,
  priority varchar(20) NOT NULL CHECK (priority IN ('baixa','normal','alta','urgente')),
  confidentiality varchar(20) NOT NULL CHECK (confidentiality IN ('publico','interno','restrito','confidencial')),
  sender_name text NOT NULL,
  sender_type varchar(20) NOT NULL DEFAULT 'interno',
  sender_contact text,
  origin_unit_id text NOT NULL REFERENCES organizational_units(id),
  recipient_unit_id text NOT NULL REFERENCES organizational_units(id),
  responsible_user_id uuid REFERENCES users(id),
  created_by uuid NOT NULL REFERENCES users(id),
  due_date date NOT NULL,
  next_step text NOT NULL DEFAULT 'Recepcao pela Secretaria',
  notes text,
  submitted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expedients_created_by_idx ON expedients(created_by);
CREATE INDEX IF NOT EXISTS expedients_responsible_idx ON expedients(responsible_user_id);
CREATE INDEX IF NOT EXISTS expedients_status_idx ON expedients(status);
CREATE INDEX IF NOT EXISTS expedients_recipient_idx ON expedients(recipient_unit_id);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expedient_id uuid NOT NULL REFERENCES expedients(id) ON DELETE CASCADE,
  name text NOT NULL,
  document_kind varchar(30) NOT NULL,
  source varchar(30) NOT NULL,
  mime_type text,
  size_bytes bigint NOT NULL DEFAULT 0,
  page_count integer NOT NULL DEFAULT 1,
  storage_path text,
  content_html text,
  confidentiality varchar(20) NOT NULL DEFAULT 'interno',
  stamped boolean NOT NULL DEFAULT false,
  signed boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (storage_path IS NOT NULL OR content_html IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expedient_id uuid NOT NULL REFERENCES expedients(id) ON DELETE CASCADE,
  event_type varchar(40) NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  user_id uuid REFERENCES users(id),
  unit_id text REFERENCES organizational_units(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS timeline_expedient_idx ON timeline_events(expedient_id, created_at);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expedient_id uuid NOT NULL REFERENCES expedients(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id),
  body text NOT NULL,
  internal boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type varchar(30) NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  expedient_id uuid REFERENCES expedients(id) ON DELETE CASCADE,
  read_at timestamptz,
  urgent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id, read_at, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip inet,
  result varchar(20) NOT NULL DEFAULT 'sucesso',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_created_idx ON audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS delegations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id uuid NOT NULL REFERENCES users(id),
  delegate_id uuid NOT NULL REFERENCES users(id),
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  reason text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_on >= starts_on),
  CHECK (delegator_id <> delegate_id)
);

CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  document_type text NOT NULL,
  description text NOT NULL DEFAULT '',
  version integer NOT NULL DEFAULT 1,
  status varchar(20) NOT NULL DEFAULT 'rascunho',
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_settings (
  setting_key text PRIMARY KEY,
  setting_value jsonb NOT NULL,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS organizational_units_updated_at ON organizational_units;
CREATE TRIGGER organizational_units_updated_at BEFORE UPDATE ON organizational_units FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS expedients_updated_at ON expedients;
CREATE TRIGGER expedients_updated_at BEFORE UPDATE ON expedients FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO organizational_units (id,name,acronym,code,unit_type,parent_id,email,phone,extension_number) VALUES
('u-dg','Direccao Geral','DG','01','direccao',NULL,'direccao.geral@cfm.co.mz','+258 21 43 1111',NULL),
('u-doe','Direccao de Operacoes Ferroviarias','DOF','02','direccao','u-dg','operacoes@cfm.co.mz','+258 21 43 1122',NULL),
('u-dmv','Departamento de Manutencao de Via','DMV','02.1','departamento','u-doe','manutencao.via@cfm.co.mz',NULL,'2231'),
('u-dmc','Departamento de Material Circulante','DMC','02.2','departamento','u-doe','material.circulante@cfm.co.mz',NULL,'2245'),
('u-din','Direccao de Infra-estruturas','DIN','03','direccao','u-dg','infraestruturas@cfm.co.mz','+258 21 43 1144',NULL),
('u-doc','Departamento de Obras e Construcao','DOC','03.1','departamento','u-din','obras@cfm.co.mz',NULL,'2311'),
('u-dst','Departamento de Sinalizacao e Telecomunicacoes','DST','03.2','departamento','u-din','sinalizacao@cfm.co.mz',NULL,'2325'),
('u-drh','Direccao de Recursos Humanos','DRH','04','direccao','u-dg','recursos.humanos@cfm.co.mz','+258 21 43 1166',NULL),
('u-dfa','Direccao Financeira e Administrativa','DFA','05','direccao','u-dg','financeira@cfm.co.mz','+258 21 43 1177',NULL),
('u-dap','Departamento de Aprovisionamento','DAP','05.1','departamento','u-dfa','aprovisionamento@cfm.co.mz',NULL,'2411'),
('u-sg','Secretaria Geral','SG','05.2','seccao','u-dfa','secretaria.geral@cfm.co.mz',NULL,'2200'),
('u-dju','Direccao Juridica','DJU','06','direccao','u-dg','juridico@cfm.co.mz','+258 21 43 1188',NULL)
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, acronym=EXCLUDED.acronym, code=EXCLUDED.code, parent_id=EXCLUDED.parent_id;

INSERT INTO profiles (id,slug,name,description,access_level,scope,permissions) VALUES
('p-remetente','remetente','Remetente','Cria e acompanha os seus expedientes.','operacional','unidade','["expedientes.criar","expedientes.ver.proprios","documentos.anexar"]'),
('p-secretaria','secretaria','Secretaria','Recebe, protocola, carimba e encaminha expedientes.','operacional','global','["secretaria.protocolar","secretaria.carimbar","secretaria.encaminhar","livro.gerir"]'),
('p-superior','superior','Superior / Aprovador','Analisa, solicita pareceres e decide expedientes.','supervisao','unidade','["expedientes.ver.unidade","expedientes.encaminhar","expedientes.parecer","expedientes.aprovar","relatorios.ver"]'),
('p-administracao','administracao','Administrador do Sistema','Configura e administra todo o sistema.','administracao','global','["*"]')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,description=EXCLUDED.description,permissions=EXCLUDED.permissions,active=true;

WITH seed(full_name,email,job_title,unit_id,profile_id,avatar_color) AS (VALUES
('Felismina Cossa','felismina.cossa@cfm.co.mz','Tecnica de expediente','u-doc','p-remetente','info'),
('Cremilda Nhantumbo','cremilda.nhantumbo@cfm.co.mz','Chefe da Secretaria Geral','u-sg','p-secretaria','success'),
('Paulo Nhaca','paulo.nhaca@cfm.co.mz','Assistente Administrativo','u-sg','p-secretaria','success'),
('Fatima Momade','fatima.momade@cfm.co.mz','Chefe do Departamento de Obras e Construcao','u-doc','p-superior','navy'),
('Amelia Nhaca','amelia.nhaca@cfm.co.mz','Directora-Geral','u-dg','p-superior','navy'),
('Carlos Machava','carlos.machava@cfm.co.mz','Director de Operacoes Ferroviarias','u-doe','p-superior','info'),
('Jose Cumbe','jose.cumbe@cfm.co.mz','Chefe do Departamento de Manutencao de Via','u-dmv','p-superior','success'),
('Felismina Tembe','felismina.tembe@cfm.co.mz','Tecnica Superior de Via e Obras','u-dmv','p-remetente','crimson'),
('Antonio Sitoe','antonio.sitoe@cfm.co.mz','Chefe do Departamento de Material Circulante','u-dmc','p-superior','amber'),
('Eduardo Macuacua','eduardo.macuacua@cfm.co.mz','Director de Infra-estruturas','u-din','p-superior','navy'),
('Ricardo Langa','ricardo.langa@cfm.co.mz','Tecnico de Sinalizacao','u-dst','p-remetente','success'),
('Lidia Chissano','lidia.chissano@cfm.co.mz','Directora de Recursos Humanos','u-drh','p-superior','crimson'),
('Armando Bila','armando.bila@cfm.co.mz','Director Financeiro e Administrativo','u-dfa','p-superior','navy'),
('Graca Muianga','graca.muianga@cfm.co.mz','Chefe do Departamento de Aprovisionamento','u-dap','p-superior','amber'),
('Noemia Machel','noemia.machel@cfm.co.mz','Directora Juridica','u-dju','p-superior','crimson'),
('Isabel Cuamba','isabel.cuamba@cfm.co.mz','Tecnica de Aprovisionamento','u-dap','p-remetente','amber'),
('Sandro Tivane','sandro.tivane@cfm.co.mz','Administrador do Sistema','u-dg','p-administracao','graphite')
), inserted AS (
  INSERT INTO users(full_name,email,password_hash,job_title,unit_id,avatar_color)
  SELECT full_name,email,'scrypt$19dc1d3c6bb13e3ec746712dc04b9eda$4f43a90112ab3452c6ad73b4b4f4a7fa374d2160299deaeea7aa4495cb4ecc9d2d256f49addbaa0911552d9543324306269eb6704fce1c307f29f63d689832b9',job_title,unit_id,avatar_color FROM seed
  ON CONFLICT (email) DO UPDATE SET full_name=EXCLUDED.full_name,job_title=EXCLUDED.job_title,unit_id=EXCLUDED.unit_id,avatar_color=EXCLUDED.avatar_color
  RETURNING id,email
)
INSERT INTO user_profiles(user_id,profile_id,is_primary)
SELECT u.id,s.profile_id,true FROM seed s JOIN inserted u ON u.email=s.email
ON CONFLICT (user_id,profile_id) DO UPDATE SET is_primary=true;

INSERT INTO system_settings(setting_key,setting_value) VALUES
('organization','{"name":"CFM - Portos e Caminhos de Ferro de Mocambique","acronym":"CFM"}'),
('security','{"passwordOnly":true,"maxLoginAttempts":5}'),
('documents','{"maxUploadMb":20,"allowedExtensions":["pdf","docx","jpg","jpeg","png"]}')
ON CONFLICT (setting_key) DO UPDATE SET setting_value=EXCLUDED.setting_value;

COMMIT;
