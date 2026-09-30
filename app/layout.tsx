import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Fosforera en Casa",
  description: "Pedidos delivery de comida casera venezolana.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
