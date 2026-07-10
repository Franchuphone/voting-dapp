import type { Metadata } from "next";
import { DM_Sans, Figtree } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

import { Toaster } from "@/components/ui/sonner";

import AppKitProvider from "./AppKitProvider";
import ThemeProvider from "./ThemeProvider";
import Layout from "@/components/layout/Layout";
import MouseGlow from "./MouseGlow";
import ConnectionGuard from "./ConnectionGuard";

const figtreeHeading = Figtree({
  subsets: ["latin"],
  variable: "--font-heading",
});

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Voting Platform",
  description: "Your place to vote or propose a vote",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "font-sans",
        dmSans.variable,
        figtreeHeading.variable,
      )}
    >
      <body>
        <ThemeProvider>
          <MouseGlow />
          <AppKitProvider>
            <Layout>
              <ConnectionGuard>{children} </ConnectionGuard>
            </Layout>
          </AppKitProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
