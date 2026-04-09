'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { 
  getPostBySlug, 
  BlogPost, 
  BlogBlock, 
  BlogComment, 
  subscribeToComments, 
  addComment,
  getPublishedPosts 
} from '@/lib/blog';
import { catalogData, Product } from '@/lib/data';
import { 
  getDocs, collection, query, where, limit 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Calendar, Clock, User, ArrowLeft, MessageCircle, Send, 
  Share2, Bookmark, Heart, ChevronRight, ShoppingCart, Sparkles, BookOpen 
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function BlogDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user, userProfile } = useAuth();
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      try {
        const data = await getPostBySlug(slug as string);
        setPost(data);
        
        // Cargar recientes para la sidebar
        const recent = await getPublishedPosts();
        setRecentPosts(recent.filter(p => p.slug !== slug).slice(0, 3));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  useEffect(() => {
    if (post?.id) {
      const unsub = subscribeToComments(post.id, setComments);
      return () => unsub();
    }
  }, [post?.id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim() || !post?.id) return;
    
    setIsSubmitting(true);
    try {
      await addComment({
        postId: post.id,
        userId: user.uid,
        userName: userProfile?.displayName || user.email?.split('@')[0] || 'Usuario',
        userAvatar: userProfile?.avatarUrl,
        text: commentText.trim()
      });
      setCommentText('');
    } catch (e) {
      console.error(e);
      alert("No se pudo enviar el comentario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen animate-pulse bg-black/5" />;
  if (!post) return <div className="min-h-screen flex items-center justify-center">Artículo no encontrado.</div>;

  const dateStr = new Date(post.createdAt).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <main className="min-h-screen bg-[#fcfdfa] dark:bg-slate-950">
      <Navbar />

      {/* Hero Header */}
      <header className="relative pt-32 pb-16 lg:pt-48 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={post.coverImage} className="w-full h-full object-cover opacity-20 blur-3xl scale-110" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#fcfdfa] dark:to-slate-950" />
        </div>

        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <Link href="/blog" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary-600 mb-8 hover:gap-4 transition-all">
            <ArrowLeft className="w-4 h-4" /> Volver al blog
          </Link>
          <div className="flex items-center justify-center gap-6 mb-8 text-[10px] font-black uppercase tracking-[0.2em] opacity-50">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {dateStr}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.readingTime} min</span>
            <span className="flex items-center gap-1.5 text-primary-600 font-black"><Sparkles className="w-3.5 h-3.5" /> {post.category}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-10">
            {post.title}
          </h1>
          <div className="flex items-center justify-center gap-3">
             <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-black">
                {post.author.slice(0, 2).toUpperCase()}
             </div>
             <div className="text-left">
                <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">Autor</p>
                <p className="font-bold">{post.author}</p>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 lg:grid lg:grid-cols-12 lg:gap-16 pb-32">
        
        {/* Left Sidebar: Social / Stats (Stuck) */}
        <aside className="hidden lg:block lg:col-span-1">
          <div className="sticky top-32 flex flex-col items-center gap-6">
            <button className="w-12 h-12 rounded-full border border-black/5 flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all">
              <Heart className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 rounded-full border border-black/5 flex items-center justify-center hover:bg-primary-50 hover:text-primary-500 hover:border-primary-100 transition-all">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 rounded-full border border-black/5 flex items-center justify-center hover:bg-amber-50 hover:text-amber-500 hover:border-amber-100 transition-all">
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
        </aside>

        {/* Content Body */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-slate-900 rounded-[48px] p-8 md:p-12 lg:p-16 shadow-2xl shadow-black/5 border border-black/5 dark:border-white/5 mb-20 text-lg leading-relaxed text-foreground/80 font-medium">
             <img src={post.coverImage} className="w-full h-[400px] object-cover rounded-[32px] mb-12 shadow-xl" alt={post.title} />
             
             <ArticleBlockRenderer blocks={post.blocks} />

             <div className="mt-16 pt-10 border-t border-black/5 flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span key={tag} className="px-4 py-2 bg-black/5 dark:bg-white/5 rounded-full text-xs font-bold text-foreground/60 transition-colors hover:bg-primary-50 hover:text-primary-600">
                    #{tag}
                  </span>
                ))}
             </div>
          </div>

          {/* Comments Section */}
          <section id="comentarios" className="bg-white dark:bg-slate-900 rounded-[48px] p-8 md:p-12 shadow-2xl border border-black/5 dark:border-white/5 overflow-hidden">
            <h3 className="text-2xl font-display font-bold mb-10 flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-primary-600" /> Conversación ({comments.length})
            </h3>

            {/* Formulario */}
            <div className="mb-12">
              {user ? (
                <form onSubmit={handleAddComment} className="relative">
                  <textarea 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Compartí tus dudas o experiencias botánicas..."
                    className="w-full px-6 py-5 rounded-[24px] bg-black/5 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary-500 min-h-[120px] transition-all"
                  />
                  <div className="mt-4 flex justify-end">
                    <button 
                      type="submit"
                      disabled={isSubmitting || !commentText.trim()}
                      className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-primary-700 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? 'Enviando...' : 'Publicar Comentario'} <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-8 bg-primary-50 dark:bg-primary-900/10 rounded-3xl border border-primary-100 dark:border-primary-800/20 text-center">
                   <p className="text-sm font-bold text-primary-700 dark:text-primary-300 mb-4">Iniciá sesión para unirte a la charla botánica.</p>
                   <Link href="/login" className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-black inline-block">Ingresar Ahora</Link>
                </div>
              )}
            </div>

            {/* Listado de Comentarios */}
            <div className="space-y-8">
              {comments.length === 0 ? (
                <p className="text-center text-foreground/40 text-sm italic py-10">Sé el primero en comentar este artículo.</p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="flex gap-4 group animate-in slide-in-from-bottom-2 duration-300">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-primary-600 font-bold text-xs">
                       {c.userAvatar ? <img src={c.userAvatar} className="w-full h-full rounded-full object-cover" /> : c.userName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 bg-black/5 dark:bg-white/5 p-5 rounded-2xl rounded-tl-none">
                       <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-sm">{c.userName}</p>
                          <p className="text-[10px] font-bold opacity-30">{new Date(c.createdAt).toLocaleDateString()}</p>
                       </div>
                       <p className="text-sm text-foreground/70 leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Sidebar: Related Content */}
        <aside className="lg:col-span-4 mt-20 lg:mt-0">
          <div className="sticky top-32 space-y-12">
            
            {/* Recent Posts */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 mb-6 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> También te puede gustar
              </h4>
              <div className="space-y-6">
                {recentPosts.map(rp => (
                  <Link key={rp.id} href={`/blog/${rp.slug}`} className="group flex gap-4 items-center">
                    <img src={rp.coverImage} className="w-20 h-20 rounded-2xl object-cover shadow-lg group-hover:scale-105 transition-transform" />
                    <div>
                      <p className="text-[9px] font-black uppercase text-primary-600 mb-1">{rp.category}</p>
                      <h5 className="font-bold text-sm leading-tight group-hover:text-primary-600 transition-colors line-clamp-2">{rp.title}</h5>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter Mini */}
            <div className="bg-primary-900 rounded-[32px] p-8 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/30 rounded-full blur-2xl" />
               <Sparkles className="w-6 h-6 text-primary-400 mb-4" />
               <h4 className="font-display font-bold text-xl mb-4 leading-tight">Secretos botánicos en tu mail</h4>
               <div className="flex flex-col gap-2">
                  <input type="email" placeholder="Email" className="w-full bg-white/10 border-white/20 rounded-xl px-4 py-2.5 text-xs" />
                  <button className="w-full bg-white text-primary-900 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform shadow-xl">Suscribirme</button>
               </div>
            </div>

          </div>
        </aside>
      </div>
    </main>
  );
}

function ArticleBlockRenderer({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <div className="space-y-8">
      {blocks.map((block) => {
        switch (block.type) {
          case 'h2':
            return <h2 key={block.id} className="text-3xl md:text-4xl font-display font-bold text-foreground pt-4">{block.content}</h2>;
          case 'h3':
            return <h3 key={block.id} className="text-2xl font-display font-bold text-foreground pt-2">{block.content}</h3>;
          case 'p':
            return <p key={block.id} className="leading-relaxed opacity-90">{block.content}</p>;
          case 'quote':
            return (
              <blockquote key={block.id} className="border-l-4 border-primary-600 pl-8 py-2 my-8 italic text-2xl font-display text-primary-800 dark:text-primary-300">
                "{block.content}"
              </blockquote>
            );
          case 'ul':
            return (
              <ul key={block.id} className="list-disc list-inside space-y-3 pl-4">
                {block.content.split('\n').map((li, i) => (
                  <li key={i}>{li}</li>
                ))}
              </ul>
            );
          case 'img':
            return (
              <figure key={block.id} className="my-10">
                <img src={block.content} className="w-full rounded-[32px] shadow-2xl" alt="" />
                {block.data?.caption && <figcaption className="text-center text-xs font-bold uppercase tracking-widest opacity-40 mt-4">— {block.data.caption}</figcaption>}
              </figure>
            );
          case 'product':
            return <ProductBlock key={block.id} productId={block.content} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

function ProductBlock({ productId }: { productId: string }) {
  const [product, setProduct] = useState<any | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      // Intentar buscar en Firebase primero
      const q = query(collection(db, 'products'), where('__name__', '==', productId), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
         setProduct({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        // Fallback a catalogData local
        const p = catalogData.find(p => p.id === productId);
        if (p) setProduct(p);
      }
    };
    fetchProduct();
  }, [productId]);

  if (!product) return null;

  return (
    <div className="my-12 p-1 bg-gradient-to-br from-primary-200 to-amber-100 dark:from-primary-900/40 dark:to-amber-900/20 rounded-[40px] shadow-2xl overflow-hidden group">
      <div className="bg-white dark:bg-slate-900 rounded-[39px] p-6 flex flex-col md:flex-row items-center gap-8">
        <div className="w-full md:w-48 h-48 rounded-3xl overflow-hidden shadow-lg border border-black/5">
          <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.name} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
             <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
             <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Recomendación Botánica</span>
          </div>
          <h4 className="text-2xl font-display font-bold mb-2">{product.name}</h4>
          <p className="text-sm text-foreground/50 mb-6 line-clamp-2 md:max-w-md">{product.description}</p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span className="text-2xl font-black text-primary-600">${product.price.toLocaleString('es-AR')}</span>
            <Link 
              href={`/producto/${product.id}`}
              className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-primary-500/30 active:scale-95"
            >
              Comprar ahora <ShoppingCart className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
