import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import { ThemeScript } from "@/components/theme/ThemeScript";

import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Avisus | Inteligência de preços para revendedores",
  description:
    "Monitore ofertas, margem estimada e alertas acionáveis para revender com mais velocidade no Brasil.",
  openGraph: {
    title: "Avisus | Inteligência de preços para revendedores",
    description:
      "Monitore ofertas, margem estimada e alertas acionáveis para revender com mais velocidade no Brasil.",
    locale: "pt_BR",
    siteName: "Avisus",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${montserrat.variable} font-body antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
