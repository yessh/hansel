import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hänsel",
  description: "위치 기반 소셜 서비스 헨젤",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
