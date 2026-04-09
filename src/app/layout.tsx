import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import AIAssistant from "@/components/layout/AIAssistant";
import CartSidebar from "@/components/layout/CartSidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vivero Libertad | Plantas & Comunidad Botánica",
  description: "Tu vivero online de confianza. Encuentra plantas, accesorios y únete a nuestra comunidad apasionada por la naturaleza.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${outfit.variable} scroll-smooth antialiased`}
    >
      <body className="min-h-screen flex flex-col font-sans selection:bg-primary-500 selection:text-white">
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              {children}
              <AIAssistant />
              <CartSidebar />
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
