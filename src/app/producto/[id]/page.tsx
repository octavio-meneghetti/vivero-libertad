'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Navbar from '@/components/layout/Navbar';
import { 
  ArrowLeft, ShoppingCart, MessageCircle, Sun, Droplets, PawPrint, CheckCircle2, AlertTriangle, 
  Leaf, Microscope, Snowflake, ThermometerSun 
} from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', params.id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          router.push('/');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [params.id, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black/5 dark:bg-white/5 pt-32 pb-20 flex justify-center items-center">
        <Navbar />
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </main>
    );
  }

  if (!product) return null;

  const productImg = product.imageUrl || product.image || 'https://images.unsplash.com/photo-1416879598553-380108ff4bca?q=80&w=800&auto=format&fit=crop';
  const waLink = `https://wa.me/1234567890?text=${encodeURIComponent(`Hola, me interesa comprar la planta ${product.name} (Ref: ${product.id}) que vi en su catálogo web.`)}`;

  return (
    <main className="min-h-screen bg-black/5 dark:bg-white/5">
      <Navbar />
      
      <div className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
        
        {/* Botón Volver */}
        <Link href="/#catalogo" className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary-600 mb-8 font-bold transition-colors">
          <ArrowLeft className="w-5 h-5" /> Volver al catálogo
        </Link>

        <div className="bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row">
          
          {/* FOTO GIGANTE (Izquierda) */}
          <div className="w-full lg:w-1/2 relative bg-black/5 dark:bg-white/5 min-h-[400px] lg:min-h-[600px]">
            <img src={productImg} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            
            <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-2">
              {product.nativa && (
                <span className="px-3 py-1 bg-green-500/90 backdrop-blur-md text-white font-bold text-xs rounded-full uppercase flex items-center gap-1 shadow-md">
                  <Leaf className="w-3 h-3" /> Especie Nativa
                </span>
              )}
              {product.principiante && (
                <span className="px-3 py-1 bg-amber-500/90 backdrop-blur-md text-white font-bold text-xs rounded-full uppercase flex items-center gap-1 shadow-md">
                  <CheckCircle2 className="w-3 h-3" /> Para Principiantes
                </span>
              )}
              {product.toxicaMascotas ? (
                <span className="px-3 py-1 bg-red-500/90 backdrop-blur-md text-white font-bold text-xs rounded-full uppercase flex items-center gap-1 shadow-md">
                  <AlertTriangle className="w-3 h-3" /> Tóxica para mascotas
                </span>
              ) : (
                <span className="px-3 py-1 bg-blue-500/90 backdrop-blur-md text-white font-bold text-xs rounded-full uppercase flex items-center gap-1 shadow-md">
                  <PawPrint className="w-3 h-3" /> Segura M/Mascotas
                </span>
              )}
            </div>
          </div>

          {/* DATOS COMERCIALES (Derecha) */}
          <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col">
            <div className="flex-1">
              <div className="text-secondary-600 dark:text-secondary-400 font-black text-xs uppercase tracking-widest mb-3">
                {product.mainCategory} • {product.usoPrincipal}
              </div>
              <h1 className="text-4xl lg:text-5xl font-display font-bold mb-2 text-foreground">
                {product.name}
              </h1>
              <h2 className="text-xl lg:text-2xl font-serif italic text-foreground/50 mb-6">
                {product.cientificName}
              </h2>
              
              <p className="text-lg text-foreground/80 leading-relaxed mb-8">
                {product.description}
              </p>

              <div className="flex items-end gap-4 mb-10">
                <span className="text-5xl font-black">${Number(product.price).toFixed(2)}</span>
                <span className={`text-sm font-bold pb-1 ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.stock > 0 ? `${product.stock} disponibles en stock` : 'Agotado temporalmente'}
                </span>
              </div>

              {/* Botonera Transaccional */}
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button 
                  onClick={() => addToCart(product, 1)}
                  disabled={product.stock <= 0}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-foreground/10 text-white font-bold transition-all shadow-xl shadow-primary-500/20 active:scale-[0.98]"
                >
                  <ShoppingCart className="w-5 h-5" /> Agregar al Carrito
                </button>
                <a 
                  href={waLink} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold transition-all shadow-xl shadow-[#25D366]/20 active:scale-[0.98]"
                >
                  <MessageCircle className="w-5 h-5" /> Consultar
                </a>
              </div>
            </div>

            {/* Quick Specs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-black/5 dark:border-white/5">
              <div className="text-center bg-black/5 dark:bg-white/5 rounded-xl p-4">
                <Sun className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                <p className="text-[10px] uppercase font-black text-foreground/50">Luz</p>
                <p className="font-bold text-sm leading-tight mt-1">{product.luz || 'Variada'}</p>
              </div>
              <div className="text-center bg-black/5 dark:bg-white/5 rounded-xl p-4">
                <Droplets className="w-6 h-6 mx-auto mb-2 text-cyan-500" />
                <p className="text-[10px] uppercase font-black text-foreground/50">Riego</p>
                <p className="font-bold text-sm leading-tight mt-1">{product.agua || 'Medio'}</p>
              </div>
              <div className="text-center bg-black/5 dark:bg-white/5 rounded-xl p-4">
                <Snowflake className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                <p className="text-[10px] uppercase font-black text-foreground/50">Mínima</p>
                <p className="font-bold text-sm leading-tight mt-1">{product.tempMin ? `${product.tempMin}°C` : 'N/A'}</p>
              </div>
              <div className="text-center bg-black/5 dark:bg-white/5 rounded-xl p-4">
                <ThermometerSun className="w-6 h-6 mx-auto mb-2 text-red-500" />
                <p className="text-[10px] uppercase font-black text-foreground/50">Máxima</p>
                <p className="font-bold text-sm leading-tight mt-1">{product.tempMax ? `${product.tempMax}°C` : 'N/A'}</p>
              </div>
            </div>

          </div>
        </div>

        {/* Ficha Taxonómica Completa */}
        <div className="mt-12 bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-3xl p-8 lg:p-12 shadow-sm">
          <h3 className="text-2xl font-display font-bold mb-8 flex items-center gap-3">
            <Microscope className="w-8 h-8 text-secondary-500" /> Ficha Técnica Botánica
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
            <div className="border-b border-black/5 dark:border-white/5 pb-2">
              <span className="text-xs uppercase font-bold text-foreground/50 block mb-1">Familia Botánica</span>
              <span className="font-medium">{product.family || 'No especificada'}</span>
            </div>
            <div className="border-b border-black/5 dark:border-white/5 pb-2">
              <span className="text-xs uppercase font-bold text-foreground/50 block mb-1">Hábito de Crecimiento</span>
              <span className="font-medium">{product.habito || 'No especificado'}</span>
            </div>
            <div className="border-b border-black/5 dark:border-white/5 pb-2">
              <span className="text-xs uppercase font-bold text-foreground/50 block mb-1">Velocidad de Crec.</span>
              <span className="font-medium">{product.velCrecimiento || 'No especificada'}</span>
            </div>
            <div className="border-b border-black/5 dark:border-white/5 pb-2">
              <span className="text-xs uppercase font-bold text-foreground/50 block mb-1">Tipo de Follaje</span>
              <span className="font-medium">{product.tipoFollaje || 'No especificado'}</span>
            </div>
            <div className="border-b border-black/5 dark:border-white/5 pb-2">
              <span className="text-xs uppercase font-bold text-foreground/50 block mb-1">Color de Follaje</span>
              <span className="font-medium">{product.colorFollaje || 'No especificado'}</span>
            </div>
            <div className="border-b border-black/5 dark:border-white/5 pb-2">
              <span className="text-xs uppercase font-bold text-foreground/50 block mb-1">Época Floración</span>
              <span className="font-medium">{product.epocaFloracion || 'Sin floración conspicua'}</span>
            </div>
            <div className="border-b border-black/5 dark:border-white/5 pb-2">
              <span className="text-xs uppercase font-bold text-foreground/50 block mb-1">Tipo de Suelo Ideal</span>
              <span className="font-medium">{product.suelo || 'Adaptable'}</span>
            </div>
            <div className="border-b border-black/5 dark:border-white/5 pb-2">
              <span className="text-xs uppercase font-bold text-foreground/50 block mb-1">Nivel de Drenaje</span>
              <span className="font-medium">{product.drenaje || 'Promedio'}</span>
            </div>
            <div className="border-b border-black/5 dark:border-white/5 pb-2">
              <span className="text-xs uppercase font-bold text-foreground/50 block mb-1">PH Sustrato</span>
              <span className="font-medium">{product.phNivel || 'Neutro'}</span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
