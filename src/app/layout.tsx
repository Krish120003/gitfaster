import "@/styles/globals.css";
import { ThemeProvider } from "@/components/theme-provider";

import type { Metadata } from "next";

import { TRPCReactProvider } from "@/trpc/react";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Gitfaster",
  description: "A faster web client for GitHub",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          crossOrigin="anonymous"
          src="//unpkg.com/react-scan/dist/auto.global.js"
        />
      </head>
      <body className="min-h-screen bg-accent text-foreground antialiased">
        <SessionProvider>
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
        </SessionProvider>
      </body>
    </html>
  );
}
