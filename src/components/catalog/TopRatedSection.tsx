'use client';

import { useEffect, useState } from 'react';
import { Star, TrendingUp, Trophy, ArrowRight } from 'lucide-react';
import { getTopRatedProducts } from '@/lib/reviews';
import ProductCard from './ProductCard';
import Link from 'next/link';

export default function TopRatedSection() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTop = async () => {
      try {
        const top = await getTopRatedProducts(5);
        setProducts(top);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTop();
  }, []);

  if (loading) return null; // No mostramos nada mientras carga para no saltar UI
  if (products.length === 0) return null;

  return (
    <section className="py-12 bg-gradient-to-b from-background to-black/5 dark:to-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header de la sección */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-black text-xs uppercase tracking-[0.2em] mb-3">
              <Trophy className="w-4 h-4" /> Los Favoritos de la Comunidad
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Top 5 <span className="text-secondary-600 dark:text-secondary-400">más valoradas</span>
            </h2>
          </div>
          <p className="max-w-md text-foreground/50 text-sm leading-relaxed">
            Basado en las experiencias reales de nuestros clientes. Plantas que han robado corazones por su belleza y resistencia.
          </p>
        </div>

        {/* Grid de productos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {products.map((product, index) => (
            <div 
              key={product.id} 
              className="relative animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Medalla de ranking */}
              <div className="absolute -top-3 -left-3 z-30 w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center font-black text-lg border-2 border-primary-500 text-primary-600 dark:text-primary-400 italic">
                #{index + 1}
              </div>
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Call to action inferior */}
        <div className="mt-12 flex justify-center">
          <Link 
            href="/#catalogo" 
            className="flex items-center gap-2 px-8 py-3 rounded-full bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm font-bold hover:bg-black/5 transition-all group"
          >
            Ver catálogo completo
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
