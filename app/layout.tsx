import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 对练",
  description: "AI对话产品，支持文本和语音对话",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
