"use client";

import { ProfileProvider } from "@/features/profile/use-profile";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <ProfileProvider>{children}</ProfileProvider>;
}
