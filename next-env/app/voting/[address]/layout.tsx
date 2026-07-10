import type { ReactNode } from "react";
import RoleGuard from "@/components/voting/RoleGuard";

// Guards /voting/[address]: only the owner or a registered voter may enter.
export default function VotingLayout({ children }: { children: ReactNode }) {
  return <RoleGuard>{children}</RoleGuard>;
}
