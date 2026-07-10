"use client";

import WalletButton from "./WalletButton";
import { useConnection } from "wagmi";
import { cn } from "@/lib/utils";

// Header account button: hidden while disconnected, fades in after connecting.
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
