import type { Metadata } from "next";

import {
  Cormorant_Garamond,
  Montserrat,
} from "next/font/google";

import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mistica Spa | Bienestar y relajación",
  description:
    "Reserva tu turno en Mistica Spa. Masajes, tratamientos corporales, faciales y servicios de bienestar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${cormorant.variable} ${montserrat.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}