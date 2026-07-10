import type { ReactNode } from "react";
import RoleGuard from "@/components/voting/RoleGuard";

// Protects /voting/[address]: only the admin (owner) or a registered voter of
// the contract may see the session; everyone else is redirected out.
export default function VotingLayout({ children }: { children: ReactNode }) {
  return <RoleGuard>{children}</RoleGuard>;
}
