import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Parliament News",
  description: "Парламентын мэдээний сайт",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn">
      <body>{children}</body>
    </html>
  );
}
