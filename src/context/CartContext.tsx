'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  maxStock: number;
}

interface CartContextProps {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, amount: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextProps>({} as CartContextProps);

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Cargar de Local Storage
  useEffect(() => {
    const saved = localStorage.getItem('vivero_cart');
    if (saved) {
      try { setItems(JSON.parse(saved)); } catch (e) {}
    }
    setMounted(true);
  }, []);

  // Guardar en Local Storage
  useEffect(() => {
    if (mounted) localStorage.setItem('vivero_cart', JSON.stringify(items));
  }, [items, mounted]);

  const addToCart = (product: any, quantity: number = 1) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) {
        return prev.map(i => i.id === product.id 
          ? { ...i, quantity: Math.min(i.quantity + quantity, i.maxStock) } 
          : i
        );
      }
      
      const img = product.imageUrl || product.image || 'https://images.unsplash.com/photo-1416879598553-380108ff4bca?auto=format&fit=crop&q=80&w=400';
      return [...prev, {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: img,
        quantity: Math.min(quantity, product.stock),
        maxStock: product.stock
      }];
    });
    setIsOpen(true);
  };

  const removeFromCart = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, amount: number) => {
    setItems(prev => prev.map(i => {
      if (i.id === id) {
        const newQ = Math.max(1, Math.min(i.quantity + amount, i.maxStock));
        return { ...i, quantity: newQ };
      }
      return i;
    }));
  };

  const clearCart = () => setItems([]);

  const cartTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      items, isOpen, setIsOpen, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount 
    }}>
      {children}
    </CartContext.Provider>
  );
};
