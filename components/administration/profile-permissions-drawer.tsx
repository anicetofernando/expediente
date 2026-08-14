"use client";

import * as React from "react";
import { Users2 } from "lucide-react";
import type { Profile, User } from "@/types";
import { permissionModules } from "@/data/permissions";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerBody, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

const ALL_PERMISSION_IDS = permissionModules.flatMap((m) => m.permissoes.map((p) => p.id));

export function ProfilePermissionsDrawer({
  profile,
  users,
  onOpenChange,
  onSave,
}: {
  profile: Profile | null;
  users: User[];
  onOpenChange: (open: boolean) => void;
  onSave: (profileId: string, permissions: string[]) => Promise<void>;
}) {
  const [checkedIds, setCheckedIds] = React.useState<Set<string>>(new Set());
  const [usersPopoverOpen, setUsersPopoverOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (profile) {
      setCheckedIds(profile.permissoes.includes("*") ? new Set(ALL_PERMISSION_IDS) : new Set(profile.permissoes));
    }
  }, [profile]);

  function toggle(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const affectedUsers = profile ? users.filter((u) => u.perfilIds.includes(profile.id)) : [];

  return (
    <Drawer open={!!profile} onOpenChange={onOpenChange}>
      {profile && (
        <DrawerContent size="lg">
          <DrawerHeader>
            <DrawerTitle className="pr-6">Permissões — {profile.nome}</DrawerTitle>
            <DrawerDescription>{profile.descricao}</DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-graphite-150 bg-graphite-25 px-3.5 py-2.5">
              <p className="text-[13px] text-graphite-700">
                <span className="font-semibold text-graphite-900">{affectedUsers.length}</span> de{" "}
                <span className="font-medium text-graphite-800">{users.length}</span> utilizadores afectados
              </p>
              <Popover open={usersPopoverOpen} onOpenChange={setUsersPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="secondary" size="sm">
                    <Users2 className="size-3.5" /> Ver utilizadores afectados
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-2">
                  {affectedUsers.length === 0 ? (
                    <p className="px-2 py-3 text-center text-[13px] text-graphite-500">Nenhum utilizador com este perfil.</p>
                  ) : (
                    <ul className="max-h-64 space-y-0.5 overflow-y-auto">
                      {affectedUsers.map((u) => (
                        <li key={u.id} className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
                          <UserAvatar name={u.nome} color={u.avatarColor} size="xs" />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-graphite-800">{u.nome}</p>
                            <p className="truncate text-2xs text-graphite-500">{u.cargo}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            <p className="text-2xs text-graphite-400">As alterações são aplicadas ao perfil e registadas no PostgreSQL.</p>

            {permissionModules.map((mod, idx) => (
              <div key={mod.modulo}>
                {idx > 0 && <Separator className="mb-5" />}
                <p className="mb-2 text-[13px] font-semibold text-graphite-800">{mod.modulo}</p>
                <div className="divide-y divide-graphite-150 rounded-lg border border-graphite-200">
                  {mod.permissoes.map((perm) => (
                    <label key={perm.id} className="flex cursor-pointer items-start gap-3 px-3.5 py-2.5 transition-colors hover:bg-graphite-50">
                      <Checkbox checked={checkedIds.has(perm.id)} onCheckedChange={() => toggle(perm.id)} className="mt-0.5" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium text-graphite-800">{perm.label}</span>
                        <span className="block text-2xs text-graphite-500">{perm.descricao}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </DrawerBody>
          <DrawerFooter>
            {profile.permissoes.includes("*") && <Badge variant="crimson" className="mr-auto">Acesso total (*)</Badge>}
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Fechar</Button>
            <Button disabled={saving} onClick={async () => {
              setSaving(true);
              await onSave(profile.id, checkedIds.size === ALL_PERMISSION_IDS.length ? ["*"] : Array.from(checkedIds));
              setSaving(false);
            }}>{saving ? "A guardar…" : "Guardar permissões"}</Button>
          </DrawerFooter>
        </DrawerContent>
      )}
    </Drawer>
  );
}
