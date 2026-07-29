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
  const { perfilNavegacao, sessionReady } = useSession();

  useEffect(() => {
    if (
      !sessionReady ||
      !pathname ||
      isPathAllowedForProfile(pathname, perfilNavegacao)
    ) {
      return;
    }

    router.replace(getProfileLandingHref(perfilNavegacao));
  }, [pathname, perfilNavegacao, router, sessionReady]);

  return null;
}
