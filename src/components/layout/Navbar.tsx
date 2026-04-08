'use client';

import Link from 'next/link';
import { User, Leaf, LogOut, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const { user, isAdmin, loading, logout } = useAuth();
  const { cartCount, setIsOpen } = useCart();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 glass dark:glass-dark border-b border-black/5 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          <Link href="/" className="flex items-center gap-2 group">
            <Leaf className="w-8 h-8 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform" />
            <span className="font-display font-bold text-2xl tracking-tight text-foreground">
              Vivero Libertad
            </span>
          </Link>

          <div className="hidden md:flex flex-1 justify-center space-x-8">
            <Link href="/#catalogo" className="font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Catálogo</Link>
            <Link href="/comunidad" className="font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Comunidad</Link>
            <Link href="#" className="font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Nosotros</Link>
          </div>

          <div className="flex items-center space-x-5">
            <button 
              onClick={() => setIsOpen(true)}
              className="relative p-2 text-foreground/80 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors flex items-center justify-center"
            >
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full shadow-md animate-in zoom-in duration-300">
                  {cartCount}
                </span>
              )}
            </button>
            
            {loading ? (
              <div className="w-24 h-10 animate-pulse bg-black/10 dark:bg-white/10 rounded-full"></div>
            ) : user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link href="/admin" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 hover:bg-primary-200 transition-colors font-bold text-xs uppercase tracking-wider">
                    Admin
                  </Link>
                )}
                <span className="text-sm font-medium hidden sm:block">
                  Hola, {user.email?.split('@')[0]}
                </span>
                <button 
                  onClick={() => logout()}
                  title="Cerrar sesión"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100/80 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity font-medium">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">VIP Login</span>
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
