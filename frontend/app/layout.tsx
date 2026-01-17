import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SettingsProvider } from "@/components/providers/settings-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LearnID | Adaptive Learning",
  description: "The self-improving course platform.",
};

import { EventTrackerProvider } from "@/hooks/analytics/useEventTracker";
import { SessionProvider } from "@/components/providers/session-provider";

// ... imports

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SettingsProvider>
            <SessionProvider>
              <EventTrackerProvider>
                {children}
              </EventTrackerProvider>
            </SessionProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
