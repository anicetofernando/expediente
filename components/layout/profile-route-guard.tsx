"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getProfileLandingHref,
  isPathAllowedForProfile,
} from "@/components/layout/navigation-model";
import { useSession } from "@/lib/session";

export function ProfileRouteGuard() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { perfilNavegacao, sessionReady, user } = useSession();

  useEffect(() => {
    if (!sessionReady || !pathname) return;

    if (user.precisaAlterarPalavraPasse && pathname !== "/perfil") {
      router.replace("/perfil?seguranca=1");
      return;
    }

    if (!isPathAllowedForProfile(pathname, perfilNavegacao)) {
      router.replace(getProfileLandingHref(perfilNavegacao));
    }
  }, [pathname, perfilNavegacao, router, sessionReady, user.precisaAlterarPalavraPasse]);

  return null;
}
