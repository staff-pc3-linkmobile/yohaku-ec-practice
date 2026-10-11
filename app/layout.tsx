import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "余白ストア | 毎日に、少しの余白を。",
  description: "暮らしを整える小さな道具。自分専用のEC学習ストア。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
