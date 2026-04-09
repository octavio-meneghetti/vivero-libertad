'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getFavorites, addFavorite, removeFavorite, FavoriteProduct } from '@/lib/userProfile';

interface FavoritesContextProps {
  favorites: FavoriteProduct[];
  favoriteIds: Set<string>;
  loading: boolean;
  toggleFavorite: (product: any) => Promise<void>;
  isFavorite: (id: string) => boolean;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextProps>({
  favorites: [],
  favoriteIds: new Set(),
  loading: false,
  toggleFavorite: async () => {},
  isFavorite: () => false,
  refreshFavorites: async () => {},
});

export const useFavorites = () => useContext(FavoritesContext);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const favoriteIds = new Set(favorites.map(f => f.productId));

  const refreshFavorites = useCallback(async () => {
    if (!user) { setFavorites([]); return; }
    setLoading(true);
    const favs = await getFavorites(user.uid);
    setFavorites(favs);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const toggleFavorite = async (product: any) => {
    if (!user) return;
    const productId = product.id || product.productId;
    if (favoriteIds.has(productId)) {
      // Optimistic removal
      setFavorites(prev => prev.filter(f => f.productId !== productId));
      await removeFavorite(user.uid, productId);
    } else {
      const fav: FavoriteProduct = {
        productId,
        name: product.name,
        image: product.imageUrl || product.image || '',
        price: Number(product.price),
        category: product.mainCategory || product.category || '',
        addedAt: new Date().toISOString(),
      };
      // Optimistic add
      setFavorites(prev => [...prev, fav]);
      await addFavorite(user.uid, fav);
    }
  };

  const isFavorite = (id: string) => favoriteIds.has(id);

  return (
    <FavoritesContext.Provider value={{ favorites, favoriteIds, loading, toggleFavorite, isFavorite, refreshFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}
