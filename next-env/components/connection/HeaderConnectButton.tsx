"use client";

import WalletButton from "./WalletButton";
import { useConnection } from "wagmi";
import { cn } from "@/lib/utils";

/**
 * The header connect/account button. Stays invisible while disconnected and
 * fades in (after a short delay) once connected, so it only appears as the
 * traveling NotConnected button slides up into its spot.
 */
export default function HeaderConnectButton() {
  const { isConnected } = useConnection();

  return (
    <div
      className={cn(
        "transition-opacity duration-300",
        isConnected
          ? "opacity-100 delay-500"
          : "pointer-events-none opacity-0",
      )}
    >
      <WalletButton />
    </div>
  );
}
