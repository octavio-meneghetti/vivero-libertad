import { db, storage } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  runTransaction,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ---------- Tipos ----------

export interface Review {
  id?: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  comment: string;
  imageUrl?: string;
  isVerified: boolean;
  createdAt: string;
}

// ---------- Funciones ----------

/**
 * Verifica si un usuario ha comprado un producto específico y el pedido fue ENTREGADO.
 */
export async function canUserReview(productId: string, userId: string): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      where('status', '==', 'entregado')
    );
    
    const querySnapshot = await getDocs(q);
    
    // Debería existir al menos un pedido que contenga este productId en sus items
    return querySnapshot.docs.some(doc => {
      const order = doc.data();
      return order.items?.some((item: any) => item.productId === productId);
    });
  } catch (e) {
    console.error('Error checking review permission:', e);
    return false;
  }
}

/**
 * Sube una imagen de reseña a Firebase Storage.
 */
export async function uploadReviewImage(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}_${Date.now()}.${fileExt}`;
  const storageRef = ref(storage, `reviews/${fileName}`);
  
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

/**
 * Agrega una nueva reseña y actualiza el promedio del producto en una transacción.
 */
export async function addReview(review: Omit<Review, 'id'>): Promise<string> {
  const result = await runTransaction(db, async (transaction) => {
    const productRef = doc(db, 'products', review.productId);
    const productSnap = await transaction.get(productRef);
    
    if (!productSnap.exists()) {
      throw new Error("El producto no existe");
    }
    
    const productData = productSnap.data();
    const currentRatingAvg = productData.ratingAvg || 0;
    const currentReviewCount = productData.reviewCount || 0;
    
    // Nuevo promedio: (Avg * Count + New) / (Count + 1)
    const newReviewCount = currentReviewCount + 1;
    const newRatingAvg = (currentRatingAvg * currentReviewCount + review.rating) / newReviewCount;
    
    // 1. Guardar la reseña
    const reviewRef = doc(collection(db, 'reviews'));
    transaction.set(reviewRef, {
      ...review,
      id: reviewRef.id
    });
    
    // 2. Actualizar el producto
    transaction.update(productRef, {
      ratingAvg: newRatingAvg,
      reviewCount: newReviewCount
    });
    
    return reviewRef.id;
  });
  
  return result;
}

/**
 * Obtiene todas las reseñas de un producto particular.
 */
export async function getReviewsByProduct(productId: string): Promise<Review[]> {
  const q = query(
    collection(db, 'reviews'),
    where('productId', '==', productId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Review);
}

/**
 * Obtiene los 5 productos con mejor calificación (con al menos 1 reseña).
 */
export async function getTopRatedProducts(limitCount: number = 5) {
  try {
    // Simplificamos la query para evitar problemas de índices complejos
    // Simplemente ordenamos por rating y filtramos los que tengan 0 reseñas en memoria
    const q = query(
      collection(db, 'products'),
      orderBy('ratingAvg', 'desc'),
      limit(20) // Traemos un poco más para poder filtrar los que no tienen reseñas
    );
    
    const querySnapshot = await getDocs(q);
    const allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filtramos los que tienen al menos una reseña y tomamos los mejores 5
    return allProducts
      .filter((p: any) => p.reviewCount > 0)
      .slice(0, limitCount);
  } catch (e) {
    console.error('Error fetching top rated products:', e);
    return [];
  }
}
