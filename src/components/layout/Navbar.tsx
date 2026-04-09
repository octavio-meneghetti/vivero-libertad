'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Leaf, LogOut, ShoppingBag, UserCircle, Star, ChevronDown, Heart, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import PWAInstall from '../pwa/PWAInstall';

export default function Navbar() {
  const { user, isAdmin, loading, logout, userProfile } = useAuth();
  const { cartCount, setIsOpen } = useCart();
  const { favorites } = useFavorites();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayName = userProfile?.displayName || user?.email?.split('@')[0] || '';
  const initials = displayName ? displayName.slice(0, 2).toUpperCase() : 'VL';

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
            <Link href="/talleres" className="font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Talleres</Link>
            <Link href="/blog" className="font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Blog</Link>
            <Link href="/comunidad" className="font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Comunidad</Link>
            <Link href="#" className="font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Nosotros</Link>
          </div>

          <div className="flex items-center space-x-3">
            
            {/* Mobile Menu Button (Hamburger) - Visible only on mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-foreground/80 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors order-first"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              id="mobile-menu-button"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            {/* Install PWA Button (Discreet) */}
            <PWAInstall />

            {/* Carrito */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2 text-foreground/80 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors flex items-center justify-center"
              id="cart-button"
            >
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full shadow-md animate-in zoom-in duration-300">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Autenticación */}
            {loading ? (
              <div className="w-10 h-10 animate-pulse bg-black/10 dark:bg-white/10 rounded-full" />
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                {/* Avatar trigger */}
                <button
                  onClick={() => setDropdownOpen(prev => !prev)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                  id="profile-menu-button"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-primary-600 flex items-center justify-center ring-2 ring-primary-500/30 group-hover:ring-primary-500/60 transition-all flex-shrink-0">
                    {userProfile?.avatarUrl ? (
                      <img src={userProfile.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-white">{initials}</span>
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium max-w-[90px] truncate">{displayName}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-foreground/50 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl glass dark:glass-dark border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                    {/* Header del dropdown */}
                    <div className="px-4 py-3 border-b border-black/5 dark:border-white/5">
                      <p className="text-xs text-foreground/50 font-medium">Sesión iniciada como</p>
                      <p className="text-sm font-bold truncate">{user.email}</p>
                    </div>

                    {/* Opciones */}
                    <div className="p-1.5">
                      <Link
                        href="/perfil"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-400 transition-colors"
                        id="nav-perfil-link"
                      >
                        <UserCircle className="w-4 h-4" />
                        Mi Perfil
                      </Link>

                      <Link
                        href="/perfil?tab=favoritas"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
                        id="nav-favoritas-link"
                      >
                        <Heart className="w-4 h-4" />
                        Mis Favoritas
                        {favorites.length > 0 && (
                          <span className="ml-auto text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold px-1.5 py-0.5 rounded-full">
                            {favorites.length}
                          </span>
                        )}
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                          id="nav-admin-link"
                        >
                          <Star className="w-4 h-4" />
                          Panel Admin
                        </Link>
                      )}
                    </div>

                    {/* Cerrar sesión */}
                    <div className="p-1.5 border-t border-black/5 dark:border-white/5">
                      <button
                        onClick={() => { setDropdownOpen(false); logout(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        id="nav-logout-button"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity font-medium"
                id="login-link"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Ingresar</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-black/10 dark:border-white/10 shadow-2xl animate-in slide-in-from-top-4 duration-300 z-40 overflow-hidden">
          <div className="flex flex-col p-6 space-y-4">
            <Link 
              href="/#catalogo" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-bold hover:text-primary-600 transition-colors py-2 border-b border-black/5 dark:border-white/5"
            >
              📊 Catálogo
            </Link>
            <Link 
              href="/talleres" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-bold hover:text-primary-600 transition-colors py-2 border-b border-black/5 dark:border-white/5"
            >
              🗓️ Talleres
            </Link>
            <Link 
              href="/blog" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-bold hover:text-primary-600 transition-colors py-2 border-b border-black/5 dark:border-white/5"
            >
              📝 Blog
            </Link>
            <Link 
              href="/comunidad" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-bold hover:text-primary-600 transition-colors py-2 border-b border-black/5 dark:border-white/5"
            >
              🏘️ Comunidad
            </Link>
            <Link 
              href="#" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-bold hover:text-primary-600 transition-colors py-2"
            >
              🌿 Nosotros
            </Link>
            
            {!user && (
              <Link 
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-4 flex items-center justify-center gap-2 px-6 py-4 rounded-3xl bg-primary-600 text-white font-black text-center shadow-lg shadow-primary-500/30"
              >
                <User className="w-5 h-5" /> Ingresar al Vivero
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
