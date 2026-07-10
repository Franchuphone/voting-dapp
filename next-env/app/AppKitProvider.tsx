"use client";
import { type ReactNode } from "react";
import { WagmiProvider, type Config } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "viem";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { sepolia, hardhat } from "@reown/appkit/networks";

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "";
const RPC = process.env.NEXT_PUBLIC_INFURA_SEPOLIA || "";

// Wallet-metadata origin: NEXT_PUBLIC_APP_URL, else the browser origin, else localhost.
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000");

const wagmiAdapter = new WagmiAdapter({
  networks: [sepolia, hardhat],
  projectId,
  ssr: true,
  transports: {
    [sepolia.id]: http(RPC),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
});

// Init AppKit once at module scope; its modal is a global web component on <body>.
createAppKit({
  adapters: [wagmiAdapter],
  networks: [sepolia, hardhat],
  projectId,
  metadata: {
    name: "Voting Platform",
    description: "Your place to vote or propose a vote",
    url: appUrl,
    icons: [`${appUrl}/icon.svg`],
  },
  features: {
    analytics: false,
  },
});

const queryClient = new QueryClient();

export default function AppKitProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as unknown as Config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
