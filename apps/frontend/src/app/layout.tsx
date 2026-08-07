import type { Metadata } from "next";
import "./globals.css";
import Providers from "../lib/react-query";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Conference Room Booking",
  description: "Conference Room Scheduling & Resource Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-screen overflow-hidden" suppressHydrationWarning>
      <body className="h-screen overflow-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
