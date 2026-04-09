'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { 
  Search, Calendar, Clock, ArrowRight, Sparkles, BookOpen, ChevronRight, Hash 
} from 'lucide-react';
import Link from 'next/link';
import { getPublishedPosts, BlogPost } from '@/lib/blog';

const CATEGORIES = ["Guías Pro", "Decoración", "Plantas Raras", "Noticias"];

export default function BlogListingPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getPublishedPosts();
        setPosts(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesCategory = activeCategory === 'Todas' || post.category === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = filteredPosts[0];
  const otherPosts = filteredPosts.slice(1);

  return (
    <main className="min-h-screen bg-[#fcfdfa] dark:bg-slate-950">
      <Navbar />

      {/* Hero Section / Editorial Header */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-black uppercase tracking-widest mb-6 border border-primary-200 dark:border-primary-800 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <BookOpen className="w-3.5 h-3.5" /> El Jardín del Conocimiento
            </span>
            <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground mb-6 tracking-tight">
              Nuestro <span className="text-primary-600 dark:text-primary-400 italic">Blog</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-foreground/60 leading-relaxed">
              Guías maestras, inspiración botánica y secretos de jardinería urbana para transformar tu hogar en un oasis vivo.
            </p>
          </div>

          {/* Search & Categories Bar */}
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 p-4 rounded-[32px] shadow-xl shadow-black/5 backdrop-blur-xl mb-16">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <button 
                onClick={() => setActiveCategory('Todas')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeCategory === 'Todas' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'hover:bg-black/5'}`}
              >
                Todas
              </button>
              {CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeCategory === cat ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'hover:bg-black/5'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
              <input 
                type="text" 
                placeholder="Buscar artículos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary-500 font-medium text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[400px] rounded-[40px] bg-black/5 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 rounded-[40px]">
            <Search className="w-16 h-16 mx-auto mb-4 text-foreground/20" />
            <h3 className="text-xl font-bold mb-2">No encontramos artículos</h3>
            <p className="text-foreground/50">Probá con otros filtros o términos de búsqueda.</p>
          </div>
        ) : (
          <div className="space-y-20">
            {/* Featured Post Card */}
            {activeCategory === 'Todas' && searchQuery === '' && featuredPost && (
              <div className="group relative grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white dark:bg-slate-900 rounded-[48px] overflow-hidden border border-black/5 dark:border-white/5 shadow-2xl hover:shadow-primary-500/10 transition-all duration-500 translate-y-0 hover:-translate-y-2">
                <div className="lg:col-span-7 h-[400px] lg:h-[550px] overflow-hidden">
                  <img src={featuredPost.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={featuredPost.title} />
                </div>
                <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="px-4 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                      Destacado • {featuredPost.category}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold opacity-40 uppercase tracking-widest">
                      <Clock className="w-3 h-3" /> {featuredPost.readingTime} min
                    </span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 group-hover:text-primary-600 transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-foreground/60 text-lg mb-8 line-clamp-3 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                  <Link href={`/blog/${featuredPost.slug}`} className="flex items-center gap-3 font-black uppercase tracking-widest text-xs py-4 px-8 rounded-2xl bg-primary-600 text-white w-fit hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/20 active:scale-95">
                    Leer artículo completo <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* Grid for other posts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {(activeCategory === 'Todas' && searchQuery === '' ? otherPosts : filteredPosts).map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Newsletter Section */}
      <section className="bg-primary-900 py-24 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-800 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 opacity-50" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <Sparkles className="w-12 h-12 text-primary-400 mx-auto mb-6" />
          <h2 className="text-4xl font-display font-bold mb-4">¿Querés aprender más?</h2>
          <p className="text-primary-200 mb-10 text-lg">Suscribite a nuestro Newsletter botánico y recibí guías exclusivas, ofertas y secretos de nuestros expertos directo en tu mail.</p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input type="email" placeholder="Tu correo electrónico" className="flex-1 px-6 py-4 rounded-2xl bg-white/10 border border-white/20 focus:ring-2 focus:ring-primary-500 placeholder:text-white/40 font-medium" />
            <button className="px-8 py-4 rounded-2xl bg-white text-primary-900 font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform active:scale-95">Suscribirme</button>
          </div>
        </div>
      </section>
    </main>
  );
}

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="group flex flex-col bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border border-black/5 dark:border-white/5 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
      <Link href={`/blog/${post.slug}`} className="relative h-64 overflow-hidden">
        <img src={post.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={post.title} />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-white/90 dark:bg-black/80 backdrop-blur-md text-foreground text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
            {post.category}
          </span>
        </div>
      </Link>
      <div className="p-8 flex flex-col flex-1">
        <div className="flex items-center gap-4 mb-4 text-[10px] font-bold uppercase tracking-widest opacity-40">
           <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {new Date(post.createdAt).toLocaleDateString()}</span>
           <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {post.readingTime} min</span>
        </div>
        <h3 className="text-2xl font-display font-bold mb-4 group-hover:text-primary-600 transition-colors leading-tight">
          {post.title}
        </h3>
        <p className="text-foreground/60 text-sm line-clamp-2 mb-8 flex-1 leading-relaxed">
          {post.excerpt}
        </p>
        <Link href={`/blog/${post.slug}`} className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px] text-primary-600 group-hover:translate-x-2 transition-transform">
          Leer más <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </article>
  );
}
