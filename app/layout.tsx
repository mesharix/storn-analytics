import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import AIChatWidget from "@/components/ai-chat-widget";

export const metadata: Metadata = {
  title: "Data Analysis - Professional Analytics Platform",
  description: "Powerful data analysis and visualization platform - Free alternative to Power BI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        <Providers>
          {children}
          <AIChatWidget />
        </Providers>
      </body>
    </html>
  );
}
