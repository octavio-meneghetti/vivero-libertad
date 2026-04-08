'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Users, BookOpen, Star, Image as ImageIcon, Send, X, Heart } from 'lucide-react';
import { db, storage } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '@/lib/imageCompressor';

interface Post {
  id: string;
  userEmail: string;
  userName: string;
  content: string;
  imageUrl?: string;
  likes: string[]; // array of user emails
  createdAt: string;
}

const timeAgo = (dateString: string) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
};

export default function ComunidadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // Feed Status
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  // Poster State
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!loading && !user && mounted) router.push('/login');
  }, [user, loading, router, mounted]);

  // Suscripción al Feed Social
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const livePosts: Post[] = [];
      snapshot.forEach(doc => livePosts.push({ id: doc.id, ...doc.data() } as Post));
      setPosts(livePosts);
      setLoadingFeed(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const publishPost = async () => {
    if (!content.trim() && !imageFile) return;
    if (!user || !user.email) return;
    setIsPosting(true);
    try {
      let finalImageUrl = null;
      
      // Motor de Compresión Local y Subida a Storage
      if (imageFile) {
        const compressedFile = await compressImage(imageFile, 800); // Achica 800px para ahorrar Firebase Storage
        const fileRef = ref(storage, `community/${Date.now()}_${compressedFile.name}`);
        const snapshot = await uploadBytes(fileRef, compressedFile);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      }

      const payload = {
        userEmail: user.email,
        userName: user.email.split('@')[0],
        content: content.trim(),
        likes: [],
        imageUrl: finalImageUrl,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'posts'), payload);
      
      // Limpiar Cajita
      setContent('');
      removeImage();
    } catch (error) {
      console.error(error);
      alert('Error publicando. Verifica la conexión a Firebase.');
    } finally {
      setIsPosting(false);
    }
  };

  const toggleLike = async (postId: string, currentLikes: string[]) => {
    if (!user?.email) return;
    const postRef = doc(db, 'posts', postId);
    try {
      if (currentLikes.includes(user.email)) {
        await updateDoc(postRef, { likes: arrayRemove(user.email) });
      } else {
        await updateDoc(postRef, { likes: arrayUnion(user.email) });
      }
    } catch (e) {
      console.error("Error toggling like", e);
    }
  };

  if (loading || !mounted || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black/5 dark:bg-white/5">
      <Navbar />
      
      <div className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            <Star className="w-4 h-4" />
            Acceso VIP Activo
          </div>
          <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4">
            Comunidad Raíces
          </h1>
          <p className="text-lg text-foreground/70 max-w-2xl">
            Sube fotos de tu jardín, pide consejos o comparte cortes y esquejes.
            Cualquier foto que subas será automáticamente comprimida para cuidar la base de datos.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="col-span-1 md:col-span-2 space-y-6">
            
            {/* CAJA DE CREACIÓN DE PUBLICACIÓN */}
            <div className="glass shadow-sm dark:glass-dark rounded-3xl p-6 border border-black/5 dark:border-white/5 relative overflow-hidden">
              {isPosting && (
                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full"></div>
                </div>
              )}

              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg flex-shrink-0">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <textarea 
                  className="flex-1 min-h-[100px] p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-transparent focus:border-black/10 dark:focus:border-white/10 outline-none resize-none transition-all placeholder:text-foreground/40"
                  placeholder="¿Tus suculentas necesitan rescate? Escribe aquí..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              {previewUrl && (
                <div className="relative mb-6 ml-16 max-w-sm rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 shadow-sm group">
                  <img src={previewUrl} alt="Preview" className="w-full h-auto object-cover max-h-64" />
                  <button 
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors backdrop-blur-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="absolute bottom-2 left-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">Se comprimirá inteligentemente ⚡</p>
                </div>
              )}

              <div className="flex items-center justify-between ml-16">
                <div>
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold text-sm px-4 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-colors"
                  >
                    <ImageIcon className="w-5 h-5" />
                    Adjuntar Foto
                  </button>
                </div>
                
                <button 
                  onClick={publishPost}
                  disabled={!content.trim() && !imageFile}
                  className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-foreground/20 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-full transition-all shadow-lg shadow-primary-500/20"
                >
                  Publicar <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* FEED SOCIAL EN TIEMPO REAL */}
            <div className="space-y-6">
              {loadingFeed ? (
                <div className="text-center py-10 opacity-50 font-medium">Cargando el mural...</div>
              ) : posts.length === 0 ? (
                <div className="text-center py-10 opacity-50 font-medium">No hay publicaciones aún. ¡Sé el primero en saludar!</div>
              ) : (
                posts.map((post) => {
                  const isLiked = post.likes.includes(user.email!);
                  return (
                    <div key={post.id} className="glass shadow-sm dark:glass-dark rounded-3xl p-6 border border-black/5 dark:border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-700 font-bold text-base">
                          {post.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm">@{post.userName}</p>
                          <p className="text-xs text-foreground/50">{timeAgo(post.createdAt)}</p>
                        </div>
                      </div>

                      <p className="text-foreground/90 whitespace-pre-wrap mb-4">{post.content}</p>

                      {post.imageUrl && (
                        <div className="rounded-2xl overflow-hidden mb-4 border border-black/5 dark:border-white/5">
                          <img src={post.imageUrl} alt="Publicación" className="w-full h-auto object-cover max-h-96" />
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-4 border-t border-black/5 dark:border-white/5">
                        <button 
                          onClick={() => toggleLike(post.id, post.likes)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-sm font-bold ${
                            isLiked ? 'text-red-500 bg-red-50 dark:bg-red-500/10' : 'text-foreground/50 hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                          {post.likes.length > 0 && <span>{post.likes.length}</span>}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass shadow-sm dark:glass-dark rounded-3xl p-6 border border-black/5 dark:border-white/5">
              <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-500" />
                Guías Exclusivas
              </h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="font-medium text-foreground/70 hover:text-primary-600 transition-colors">🌿 Cómo propagar la Monstera</a></li>
                <li><a href="#" className="font-medium text-foreground/70 hover:text-primary-600 transition-colors">💧 Guía definitiva de riego en invierno</a></li>
                <li><a href="#" className="font-medium text-foreground/70 hover:text-primary-600 transition-colors">🪴 Identificando hongos en las hojas</a></li>
              </ul>
            </div>

            <div className="glass shadow-sm dark:glass-dark rounded-3xl p-6 border border-black/5 dark:border-white/5 bg-secondary-50/50 dark:bg-secondary-900/10 border-secondary-500/10">
              <h3 className="font-display font-bold text-lg mb-2 text-secondary-700 dark:text-secondary-400 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Reglas del Muro
              </h3>
              <p className="text-xs text-foreground/60 leading-relaxed mb-2">
                Mantén un lenguaje respetuoso. Evita diagnosticar plantas ajenas si no estás seguro. ¡Y comparte lo bello!
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
