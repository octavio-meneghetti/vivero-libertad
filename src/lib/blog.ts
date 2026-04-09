import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  getDoc,
  deleteDoc,
  limit,
  onSnapshot,
  Unsubscribe,
  Timestamp
} from 'firebase/firestore';

// ---------- Tipos ----------

export type BlockType = 'p' | 'h2' | 'h3' | 'img' | 'ul' | 'product' | 'quote';

export interface BlogBlock {
  id: string;
  type: BlockType;
  content: string; // Para texto o ID de producto
  data?: any; // Para URLs de imagen, estilos extra, etc.
}

export type PostStatus = 'draft' | 'published';

export interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: string;
  authorId: string;
  status: PostStatus;
  blocks: BlogBlock[];
  readingTime: number;
  relatedProducts: string[]; // IDs de productos vinculados
  createdAt: string;
  updatedAt: string;
}

export interface BlogComment {
  id?: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

// ---------- Helpers ----------

/**
 * Genera un slug amigable a partir de un título.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9\s-]/g, '') // Quitar caracteres raros
    .replace(/\s+/g, '-') // Espacios por guiones
    .replace(/-+/g, '-') // Quitar guiones duplicados
    .trim();
}

/**
 * Calcula el tiempo de lectura estimado (Promedio: 200 palabras por minuto).
 */
export function calculateReadingTime(blocks: BlogBlock[]): number {
  const textContent = blocks
    .filter(b => ['p', 'h2', 'h3', 'quote'].includes(b.type))
    .map(b => b.content)
    .join(' ');
  const words = textContent.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

// ---------- CRUD Artículos ----------

/**
 * Crea un nuevo artículo.
 */
export async function createPost(data: Omit<BlogPost, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'blog_posts'), {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  return docRef.id;
}

/**
 * Obtiene todos los artículos publicados.
 */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const q = query(
    collection(db, 'blog_posts'), 
    where('status', '==', 'published'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as BlogPost));
}

/**
 * Obtiene un artículo por su slug.
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const q = query(collection(db, 'blog_posts'), where('slug', '==', slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as BlogPost;
}

/**
 * Obtiene todos los posts (para Admin).
 */
export function subscribeToAllPosts(callback: (posts: BlogPost[]) => void): Unsubscribe {
  const q = query(collection(db, 'blog_posts'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as BlogPost)));
  });
}

/**
 * Actualiza un artículo.
 */
export async function updatePost(id: string, data: Partial<BlogPost>): Promise<void> {
  const docRef = doc(db, 'blog_posts', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Elimina un artículo.
 */
export async function deletePost(id: string): Promise<void> {
  await deleteDoc(doc(db, 'blog_posts', id));
}

// ---------- Comentarios ----------

/**
 * Añade un comentario a un artículo.
 */
export async function addComment(comment: Omit<BlogComment, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'blog_comments'), {
    ...comment,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

/**
 * Suscripción en tiempo real a los comentarios de un post.
 */
export function subscribeToComments(postId: string, callback: (comments: BlogComment[]) => void): Unsubscribe {
  const q = query(
    collection(db, 'blog_comments'),
    where('postId', '==', postId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as BlogComment)));
  });
}

/**
 * Obtiene artículos que mencionan un producto específico.
 */
export async function getPostsByRelatedProduct(productId: string): Promise<BlogPost[]> {
  const q = query(
    collection(db, 'blog_posts'),
    where('status', '==', 'published'),
    where('relatedProducts', 'array-contains', productId),
    limit(3)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as BlogPost));
}
