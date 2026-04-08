import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  // Manejo de imágen (soporta tanto los del JSON viejo como los nuevos de Firestore)
  const productImg = product.imageUrl || product.image || 'https://images.unsplash.com/photo-1416879598553-380108ff4bca?q=80&w=800&auto=format&fit=crop';

  return (
    <Link href={`/producto/${product.id}`} className="group rounded-3xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md overflow-hidden hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-1 transition-all duration-300 block">
      <div className="relative aspect-[4/5] overflow-hidden bg-black/5 dark:bg-white/5">
        {product.badge && (
          <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 text-xs font-bold text-primary-600 dark:text-primary-400 shadow-sm backdrop-blur-md">
            {product.badge}
          </div>
        )}
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
        <div className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-2">
          {product.category}
        </div>
        <h3 className="text-xl font-display font-semibold mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-foreground/70 mb-4 line-clamp-2">
          {product.description}
        </p>
        <div className="text-lg font-bold">
          ${Number(product.price).toFixed(2)}
        </div>
      </div>
    </Link>
  );
}
