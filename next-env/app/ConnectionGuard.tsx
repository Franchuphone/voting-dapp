"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useConnection } from "wagmi";
import NotConnectedHome from "../components/connection/NotConnectedHome";

// Root wallet gate: disconnected users get a full-screen connect wall, connected users the app.
export default function ConnectionGuard({ children }: { children: ReactNode }) {
  const { isConnected } = useConnection();
  const router = useRouter();
  const pathname = usePathname();

  // Connection state is client-only; wait for mount to avoid a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
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
