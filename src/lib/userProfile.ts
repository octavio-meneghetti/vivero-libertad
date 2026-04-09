import { db, storage } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface UserProfile {
  displayName: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  avatarUrl: string;
  bio: string;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteProduct {
  productId: string;
  name: string;
  image: string;
  price: number;
  category: string;
  addedAt: string;
}

export const EMPTY_PROFILE: UserProfile = {
  displayName: '',
  phone: '',
  province: '',
  city: '',
  address: '',
  postalCode: '',
  avatarUrl: '',
  bio: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/** Lee el perfil del usuario desde Firestore. Si no existe, retorna null. */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) return snap.data() as UserProfile;
    return null;
  } catch (e) {
    console.error('getUserProfile error:', e);
    return null;
  }
}

/** Crea o actualiza el perfil del usuario en Firestore (merge seguro). */
export async function saveUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  const payload = { ...data, updatedAt: new Date().toISOString() };
  if (snap.exists()) {
    await updateDoc(ref, payload);
  } else {
    await setDoc(ref, { ...EMPTY_PROFILE, ...payload, createdAt: new Date().toISOString() });
  }
}

/** Inicializa el perfil de un usuario recién registrado si no existe. */
export async function initUserProfileIfNeeded(uid: string, email: string): Promise<UserProfile> {
  const existing = await getUserProfile(uid);
  if (existing) return existing;
  const defaultName = email.split('@')[0];
  const newProfile: UserProfile = {
    ...EMPTY_PROFILE,
    displayName: defaultName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'users', uid), newProfile);
  return newProfile;
}

/** Lee la subcolección de favoritos del usuario. */
export async function getFavorites(uid: string): Promise<FavoriteProduct[]> {
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'favorites'));
    return snap.docs.map(d => d.data() as FavoriteProduct);
  } catch (e) {
    console.error('getFavorites error:', e);
    return [];
  }
}

/** Agrega un producto a favoritos. */
export async function addFavorite(uid: string, product: FavoriteProduct): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'favorites', product.productId), {
    ...product,
    addedAt: new Date().toISOString(),
  });
}

/** Quita un producto de favoritos. */
export async function removeFavorite(uid: string, productId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'favorites', productId));
}

/** Sube una imagen de avatar a Firebase Storage y retorna la URL. */
export async function uploadAvatar(uid: string, file: File): Promise<string> {
  const storageRef = ref(storage, `avatars/${uid}_${Date.now()}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}
