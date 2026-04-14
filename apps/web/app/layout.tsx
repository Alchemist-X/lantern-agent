import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lantern Agent — 链上信号驱动的预测市场 Agent",
  description: "用 Onchainos 链上数据，在预测市场自主发现 Edge。每次决策公开写入 X Layer。",
  metadataBase: new URL("https://lantern-agent-dashboard.vercel.app"),
  openGraph: {
    title: "Lantern Agent — 链上信号驱动的预测市场 Agent",
    description: "用 Onchainos 链上数据，在预测市场自主发现 Edge。",
    siteName: "Lantern Agent",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lantern Agent",
    description: "链上信号驱动的预测市场 Agent",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, background: "#0D1117" }}>{children}</body>
    </html>
  );
}
