'use client';

import { Heart, ShoppingBag, Star } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useRouter } from 'next/navigation';

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const router = useRouter();

  const productImg = product.imageUrl || product.image
    || 'https://images.unsplash.com/photo-1416879598553-380108ff4bca?q=80&w=800&auto=format&fit=crop';

  const faved = isFavorite(product.id);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { router.push('/login'); return; }
    toggleFavorite(product);
  };

  const currentRating = product.ratingAvg || 0;
  const reviewCount = product.reviewCount || 0;

  return (
    <Link
      href={`/producto/${product.id}`}
      className="group rounded-3xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md overflow-hidden hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-1 transition-all duration-300 block"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-black/5 dark:bg-white/5">
        {product.badge && (
          <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 text-xs font-bold text-primary-600 dark:text-primary-400 shadow-sm backdrop-blur-md">
            {product.badge}
          </div>
        )}

        {/* Botón favorito */}
        <button
          onClick={handleFavorite}
          className={`absolute top-3 right-3 z-20 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm transition-all hover:scale-110 ${
            faved
              ? 'bg-red-500 text-white'
              : 'bg-white/80 dark:bg-black/50 text-foreground/50 hover:text-red-500'
          }`}
          title={faved ? 'Quitar de favoritas' : 'Agregar a favoritas'}
        >
          <Heart className={`w-4 h-4 transition-all ${faved ? 'fill-current scale-110' : ''}`} />
        </button>

        <div className="absolute inset-0 bg-black/10 dark:bg-black/20 group-hover:bg-transparent transition-colors z-0" />
        <img
          src={productImg}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute bottom-4 right-4 z-10 p-3 rounded-full bg-white dark:bg-slate-800 text-foreground shadow-lg translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary-50 dark:hover:bg-slate-700 hover:scale-110 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5" />
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            {product.category}
          </div>
          {currentRating > 0 && (
            <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
              <Star className="w-3 h-3 fill-current" />
              <span>{currentRating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <h3 className="text-xl font-display font-semibold mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-foreground/70 mb-4 line-clamp-2">
          {product.description}
        </p>
        <div className="flex justify-between items-end">
          <div className="text-lg font-bold">
            ${Number(product.price).toFixed(2)}
          </div>
          {reviewCount > 0 && (
            <span className="text-[10px] text-foreground/40 font-bold uppercase tracking-tighter">
              {reviewCount} {reviewCount === 1 ? 'opinión' : 'opiniones'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
