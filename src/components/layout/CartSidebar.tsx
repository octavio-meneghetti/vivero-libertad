'use client';

import { useCart } from '@/context/CartContext';
import { X, Trash2, Plus, Minus, ShoppingBag, Send } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function CartSidebar() {
  const { items, isOpen, setIsOpen, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();

  // Bloquear scroll cuando está abierto
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [isOpen]);

  const handleCheckout = () => {
    let msg = `¡Hola Vivero Libertad! 🌱\nMe gustaría encargar los siguientes productos de su catálogo online:\n\n`;
    
    items.forEach(item => {
      msg += `▪ ${item.quantity}x ${item.name} ($${(item.price * item.quantity).toFixed(2)})\n`;
    });
    
    msg += `\n*💰 Total a pagar: $${cartTotal.toFixed(2)}*\n\nPor favor indíquenme cómo procedemos con el pago y envío. ¡Gracias!`;
    
    const waLink = `https://wa.me/1234567890?text=${encodeURIComponent(msg)}`;
    window.open(waLink, '_blank');
    clearCart();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Fondo oscuro Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] transition-opacity animate-in fade-in"
        onClick={() => setIsOpen(false)}
      />

      {/* Panel Frontal Derecha */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white dark:bg-slate-950 shadow-2xl z-[100] flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/5">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary-600" /> Mi Carrito
          </h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Lista de Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <ShoppingBag className="w-16 h-16 mb-4" />
              <p className="font-medium text-lg">Tu carrito está vacío</p>
              <p className="text-sm mt-2">Agrega algunas plantas para verlas aquí.</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-2xl relative group">
                <img src={item.image} alt={item.name} className="w-20 h-24 object-cover rounded-xl" />
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg leading-tight line-clamp-1">{item.name}</h3>
                    <p className="font-black text-primary-600 dark:text-primary-400">${item.price.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3 bg-white dark:bg-black/40 rounded-lg p-1 shadow-sm border border-black/5 dark:border-white/5">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors disabled:opacity-30"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors disabled:opacity-30"
                        disabled={item.quantity >= item.maxStock}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Comercial */}
        {items.length > 0 && (
          <div className="p-6 border-t border-black/5 dark:border-white/5 bg-white dark:bg-slate-950">
            <div className="flex items-center justify-between mb-6">
              <span className="font-medium text-lg text-foreground/70">Subtotal</span>
              <span className="text-3xl font-black">${cartTotal.toFixed(2)}</span>
            </div>
            <button 
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-lg transition-all shadow-xl shadow-green-500/20 active:scale-[0.98]"
            >
              <Send className="w-5 h-5" /> Enviar Pedido por WhatsApp
            </button>
            <p className="text-center text-xs font-medium text-foreground/40 mt-4">
              Sin tarjeta de crédito. Acordarás el pago directamente con el local.
            </p>
          </div>
        )}

      </div>
    </>
  );
}
