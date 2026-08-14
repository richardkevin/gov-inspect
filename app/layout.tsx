import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import MuiProvider from "./_components/mui-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "nf-brasil — Notas Fiscais do Portal da Transparência",
    template: "%s — nf-brasil",
  },
  description:
    "Consulta das Notas Fiscais Eletrônicas (NFe) do Poder Executivo Federal publicadas no Portal da Transparência do Governo Federal.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <MuiProvider>{children}</MuiProvider>
      </body>
    </html>
  );
}
