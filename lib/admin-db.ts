import "server-only";
import { query } from "@/lib/db";
import type { Delegation, OrganizationalUnit, Profile, User } from "@/types";

export async function listUsers():Promise<User[]> {
  const result=await query<{id:string;full_name:string;email:string;job_title:string;unit_id:string;phone:string|null;avatar_color:string;status:User["estado"];last_access_at:string|null;profile_ids:string[]}>(`
    SELECT u.id,u.full_name,u.email,u.job_title,u.unit_id,u.phone,u.avatar_color,u.status,u.last_access_at,array_agg(up.profile_id ORDER BY up.is_primary DESC) profile_ids
    FROM users u JOIN user_profiles up ON up.user_id=u.id GROUP BY u.id ORDER BY u.full_name
  `);
  return result.rows.map((row)=>({id:row.id,nome:row.full_name,email:row.email,cargo:row.job_title,unidadeId:row.unit_id,perfilIds:row.profile_ids,avatarColor:row.avatar_color,estado:row.status,ultimoAcesso:row.last_access_at??undefined,telefone:row.phone??undefined}));
}

export async function listProfiles():Promise<Profile[]> {
  const result=await query<{id:string;name:string;description:string;slug:Profile["tipoBase"];access_level:Profile["nivel"];permissions:string[];active:boolean;users_count:number}>(`
    SELECT p.*,count(up.user_id)::int users_count FROM profiles p LEFT JOIN user_profiles up ON up.profile_id=p.id GROUP BY p.id ORDER BY p.name
  `);
  return result.rows.map((row)=>({id:row.id,nome:row.name,descricao:row.description,tipoBase:row.slug,nivel:row.access_level,utilizadoresCount:row.users_count,permissoes:row.permissions,estado:row.active?"activo":"inactivo"}));
}

export async function listUnits():Promise<OrganizationalUnit[]> {
  const result=await query<{id:string;name:string;acronym:string;code:string;unit_type:OrganizationalUnit["tipo"];parent_id:string|null;email:string|null;phone:string|null;extension_number:string|null;active:boolean}>("SELECT * FROM organizational_units ORDER BY code");
  return result.rows.map((row)=>({id:row.id,nome:row.name,sigla:row.acronym,codigo:row.code,tipo:row.unit_type,parentId:row.parent_id,responsavelId:"",contactos:{email:row.email??undefined,telefone:row.phone??undefined,ramal:row.extension_number??undefined},estado:row.active?"activo":"inactivo"}));
}

export async function listDelegations():Promise<Delegation[]> {
  const result=await query<{id:string;starts_on:string;ends_on:string;reason:string;active:boolean;delegator_id:string;delegate_id:string}>("SELECT id,starts_on,ends_on,reason,active,delegator_id,delegate_id FROM delegations ORDER BY created_at DESC");
  const users=await listUsers();
  const byId=new Map(users.map((user)=>[user.id,user]));
  const today=new Date().toISOString().slice(0,10);
  return result.rows.flatMap((row)=>{
    const delegante=byId.get(row.delegator_id),delegado=byId.get(row.delegate_id);
    if(!delegante||!delegado)return [];
    return [{id:row.id,delegante,delegado,ambito:row.reason,dataInicio:String(row.starts_on).slice(0,10),dataFim:String(row.ends_on).slice(0,10),estado:!row.active||String(row.ends_on).slice(0,10)<today?"terminada":String(row.starts_on).slice(0,10)>today?"agendada":"activa"} as Delegation];
  });
}
