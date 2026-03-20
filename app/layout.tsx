import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boa Safra Sementes",
  description: "Sistema de gestão de produtores integrados",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
