"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useConnection } from "wagmi";
import NotConnectedHome from "../components/connection/NotConnectedHome";

/**
 * Wallet-connection gate for every route
 * Wraps the whole app : while disconnected it shows a full-screen connect wall
 * Connected users get the full app.
 * Rendered once at the root
 */
export default function ConnectionGuard({ children }: { children: ReactNode }) {
  const { isConnected } = useConnection();
  const router = useRouter();
  const pathname = usePathname();

  // Connection state is only known on the client
  // Wait for it to avoid a hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !isConnected && pathname !== "/") {
      router.replace("/");
    }
  }, [mounted, isConnected, pathname, router]);

  if (!mounted) return null;

  if (!isConnected) {
    return pathname === "/" ? <NotConnectedHome /> : null;
  }
  return <>{children}</>;
}
