'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Navbar from '@/components/layout/Navbar';
import { 
  ArrowLeft, ShoppingCart, MessageCircle, Sun, Droplets, PawPrint, CheckCircle2, AlertTriangle, 
  Leaf, Microscope, Snowflake, ThermometerSun, Star, Camera, Check, Plus, MessageSquare,
  Calendar, Clock, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { 
  Review, getReviewsByProduct, canUserReview, addReview, uploadReviewImage 
} from '@/lib/reviews';
import { BlogPost, getPostsByRelatedProduct } from '@/lib/blog';

// ---------- Componentes Auxiliares ----------

function StarRating({ rating, size = 4, onRate }: { rating: number, size?: number, onRate?: (r: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onRate}
          onClick={() => onRate?.(star)}
          className={`${onRate ? 'hover:scale-110' : ''} transition-transform`}
        >
          <Star 
            className={`w-${size} h-${size} ${
              star <= rating 
                ? 'text-amber-500 fill-amber-500' 
                : 'text-black/10 dark:text-white/10'
            }`} 
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const date = new Date(review.createdAt).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <div className="bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center font-bold text-primary-600">
            {review.userName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-sm">{review.userName}</p>
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} size={3} />
              <span className="text-[10px] text-foreground/40 font-medium">{date}</span>
            </div>
          </div>
        </div>
        {review.isVerified && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full uppercase tracking-tighter">
            <Check className="w-2.5 h-2.5" /> Compra Verificada
          </span>
        )}
      </div>

      <p className="text-foreground/80 text-sm leading-relaxed mb-4">
        {review.comment}
      </p>

      {review.imageUrl && (
        <div className="w-24 h-24 rounded-xl overflow-hidden border border-black/5">
          <img src={review.imageUrl} alt="Review" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}

// ---------- Página Principal ----------

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Reseñas
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userCanReview, setUserCanReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  // Artículos relacionados
  const [relatedArticles, setRelatedArticles] = useState<BlogPost[]>([]);
  
  // Formulario de reseña
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newImage, setNewImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!params?.id) return;
    const fetchData = async () => {
      try {
        const prodId = params.id as string;
        
        // 1. Fetch Producto
        const docRef = doc(db, 'products', prodId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const pData = { id: docSnap.id, ...docSnap.data() };
          setProduct(pData);
          
          // 2. Fetch Reviews
          const revs = await getReviewsByProduct(prodId);
          setReviews(revs);
          
          // 3. Verificar si el usuario puede reseñar
          if (user) {
            const can = await canUserReview(prodId, user.uid);
            // Solo dejamos reseñar si no ha reseñado ya (opcional, por ahora solo si can)
            setUserCanReview(can);
          }
        } else {
          router.push('/');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        // Cargar artículos relacionados de forma no bloqueante
        getPostsByRelatedProduct(params.id as string).then(setRelatedArticles);
      }
    };
    fetchData();
  }, [params.id, router, user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product) return;
    
    setSubmitting(true);
    try {
      let imageUrl = '';
      if (newImage) {
        imageUrl = await uploadReviewImage(newImage, user.uid);
      }
      
      const reviewData: Omit<Review, 'id'> = {
        productId: product.id,
        userId: user.uid,
        userName: user.displayName || 'Usuario de Vivero',
        rating: newRating,
        comment: newComment,
        imageUrl,
        isVerified: true, // Si puede reseñar es porque verificamos la compra
        createdAt: new Date().toISOString()
      };
      
      await addReview(reviewData);
      
      // Actualizar UI localmente
      setReviews([reviewData as Review, ...reviews]);
      setShowReviewForm(false);
      setNewComment('');
      setNewImage(null);
      setImagePreview('');
      
      // Actualizar datos del producto para mostrar el nuevo promedio si refrescara
      // En una app real, podrías recalcular localmente o refrescar el doc del producto
    } catch (e) {
      console.error(e);
      alert('Error al enviar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

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
              <div className="flex justify-between items-start mb-3">
                <div className="text-secondary-600 dark:text-secondary-400 font-black text-xs uppercase tracking-widest">
                  {product.mainCategory} • {product.usoPrincipal}
                </div>
                {product.ratingAvg > 0 && (
                  <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-black text-amber-700 dark:text-amber-400">{product.ratingAvg.toFixed(1)}</span>
                    <span className="text-[10px] text-amber-600/60 font-bold uppercase">({product.reviewCount})</span>
                  </div>
                )}
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

        {/* SECCIÓN DE RESEÑAS */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Summary & Form */}
          <div className="lg:col-span-1">
            <div className="bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-3xl p-8 sticky top-24">
              <h3 className="text-2xl font-display font-bold mb-2 flex items-center gap-2">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" /> Opiniones
              </h3>
              <p className="text-sm text-foreground/50 mb-6">Lo que dice la comunidad sobre esta planta.</p>

              <div className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-6xl font-black">{product.ratingAvg?.toFixed(1) || '0.0'}</span>
                  <div>
                    <StarRating rating={Math.round(product.ratingAvg || 0)} />
                    <p className="text-xs font-bold text-foreground/40 mt-1 uppercase tracking-wider">
                      Basado en {product.reviewCount || 0} reseñas
                    </p>
                  </div>
                </div>
              </div>

              {userCanReview && !showReviewForm && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="w-full py-4 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold transition-all shadow-lg shadow-primary-500/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" /> Dejar mi opinión
                </button>
              )}

              {/* Formulario */}
              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="space-y-4 animate-in fade-in zoom-in-95">
                  <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5">
                    <p className="text-xs font-black uppercase text-foreground/40 mb-3">Tu calificación</p>
                    <StarRating rating={newRating} size={8} onRate={setNewRating} />
                  </div>
                  
                  <div>
                    <label className="text-xs font-black uppercase text-foreground/40 block mb-2 px-1">Tu comentario</label>
                    <textarea
                      required
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="¿Cómo llegó la planta? ¿Qué te pareció?"
                      className="w-full p-4 rounded-2xl bg-white/60 dark:bg-black/40 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none h-32 text-sm"
                    />
                  </div>

                  {/* Foto opcional */}
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-black/10 dark:border-white/10 hover:border-primary-500 transition-colors text-xs font-bold"
                    >
                      {imagePreview ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                      {imagePreview ? 'Foto añadida' : 'Añadir foto (opcional)'}
                    </button>
                    {imagePreview && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-black/10">
                        <img src={imagePreview} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold transition-all disabled:opacity-50"
                    >
                      {submitting ? 'Enviando...' : 'Publicar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-6 py-4 rounded-xl bg-black/5 dark:bg-white/5 font-bold hover:bg-black/10"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {!user && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5" /> Necesitás ingresar para comentar
                  </p>
                  <Link href="/login" className="text-xs font-black text-amber-600 hover:underline mt-1 block">Ir al Login →</Link>
                </div>
              )}
            </div>
          </div>

          {/* Listado de Reseñas */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="bg-white/40 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 rounded-3xl p-12 text-center">
                  <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-foreground/20" />
                  </div>
                  <h4 className="text-lg font-display font-bold mb-1">Sin opiniones todavía</h4>
                  <p className="text-sm text-foreground/50">Sé el primero en calificar esta planta si ya la compraste.</p>
                </div>
              ) : (
                reviews.map((rev, idx) => (
                  <ReviewCard key={idx} review={rev} />
                ))
              )}
            </div>
          </div>

        </div>

        {/* Artículos Relacionados Section */}
        {relatedArticles.length > 0 && (
          <div className="mt-24 border-t border-black/5 dark:border-white/5 pt-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600 mb-2 block animate-in fade-in slide-in-from-left duration-700">Contenido Educativo</span>
                <h2 className="text-4xl font-display font-bold mb-3 tracking-tight">Cultura Botánica</h2>
                <p className="text-foreground/50 text-sm max-w-lg">Guías exclusivas, secretos de cultivo y consejos de nuestros expertos para que tu selva urbana prospere.</p>
              </div>
              <Link href="/blog" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary-600 hover:gap-4 transition-all pb-1 group border-b border-primary-600/0 hover:border-primary-600/30">
                Ver todo el blog <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {relatedArticles.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col bg-white dark:bg-slate-900 rounded-[40px] overflow-hidden border border-black/5 dark:border-white/5 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  <div className="relative h-60 overflow-hidden">
                    <img src={post.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={post.title} />
                    <div className="absolute top-6 left-6">
                      <span className="px-4 py-1.5 bg-white/95 dark:bg-black/80 backdrop-blur-md text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg border border-black/5">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest opacity-40 mb-3">
                       <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(post.createdAt).toLocaleDateString()}</span>
                       <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.readingTime} min</span>
                    </div>
                    <h3 className="text-xl font-display font-bold mb-4 group-hover:text-primary-600 transition-colors line-clamp-2 leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-sm text-foreground/50 line-clamp-2 mb-6 leading-relaxed">{post.excerpt}</p>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary-600 group-hover:translate-x-2 transition-transform">
                       Leer artículo completo <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
