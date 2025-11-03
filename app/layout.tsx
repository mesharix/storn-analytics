import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Storn Analytics - Data Analysis Platform",
  description: "Powerful data analysis and visualization platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
