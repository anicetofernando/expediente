import type { Profile, User } from "@/types";
import type { PerfilNavegacao } from "@/config/navigation";

export interface AuthSession {
  user: User;
  profile: Profile;
  perfilNavegacao: PerfilNavegacao;
  unitName: string;
}
