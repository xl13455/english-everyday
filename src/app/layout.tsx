import type { Metadata, Viewport } from "next";
import { MotionProvider } from "@/components/MotionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "考研英语真题",
  description: "2010–2026 考研英语真题：生词、小作文、大作文",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <MotionProvider>
          <div className="app-shell">{children}</div>
        </MotionProvider>
      </body>
    </html>
  );
}
