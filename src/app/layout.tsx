import type { Metadata } from "next";
import { AppShell } from "@/components/ui/AppShell";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import "./globals.css";


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
      <body className={"min-h-screen"}>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
