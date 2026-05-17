import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/ui/AppShell";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "万能工具箱",
  description: "本地工具集 · 持续扩展",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={`min-h-screen ${inter.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
