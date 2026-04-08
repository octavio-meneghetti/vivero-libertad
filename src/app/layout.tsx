import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
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
  title: "EcoComunidad | Tu Vivero y Espacio Natural",
  description: "Plataforma comunitaria de autosustentabilidad, tienda de plantas y ecosistema vivo.",
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
            {children}
            <AIAssistant />
            <CartSidebar />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
