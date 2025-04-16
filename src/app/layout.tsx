import "@/styles/globals.css";
import { ThemeProvider } from "@/components/theme-provider";

import type { Metadata } from "next";

import { TRPCReactProvider } from "@/trpc/react";
import { SessionProvider } from "next-auth/react";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export const metadata: Metadata = {
  title: "Gitfaster",
  description: "A faster web client for GitHub",
  icons: [{ rel: "icon", url: "/favicon.svg" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head></head>
      <body className="min-h-screen bg-accent text-foreground antialiased">
        <SessionProvider>
          <NuqsAdapter>
            <TRPCReactProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
              </ThemeProvider>
            </TRPCReactProvider>
          </NuqsAdapter>
        </SessionProvider>
      </body>
    </html>
  );
}
