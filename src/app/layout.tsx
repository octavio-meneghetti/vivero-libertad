import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Script from 'next/script';
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vivero Libertad",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    title: "Vivero Libertad | Plantas & Comunidad Botánica",
    description: "Tu vivero online de confianza. Encuentra plantas, accesorios y únete a nuestra comunidad botánica.",
    siteName: "Vivero Libertad",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport = {
  themeColor: "#2d6a4f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
      <head>
        {/* PWA meta para iOS (Safari no lee el manifest automáticamente) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Vivero Libertad" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#2d6a4f" />
        <meta name="msapplication-TileImage" content="/icon-192x192.png" />
        
        <Script 
          src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js" 
          type="module"
          strategy="afterInteractive"
        />
      </head>
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
