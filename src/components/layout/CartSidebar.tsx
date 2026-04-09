'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
  X, Trash2, Plus, Minus, ShoppingBag, ArrowRight,
  ArrowLeft, Home, Store, CheckCircle, Leaf, ClipboardList
} from 'lucide-react';
import { createOrder, buildWhatsAppMessage, Order } from '@/lib/orders';

// Número de WhatsApp del vivero (ajustar al real)
const VIVERO_WHATSAPP = '5491112345678';

type CheckoutStep = 'carrito' | 'checkout' | 'exito';

export default function CartSidebar() {
  const { items, isOpen, setIsOpen, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const { user, userProfile } = useAuth();

  const [step, setStep] = useState<CheckoutStep>('carrito');
  const [deliveryType, setDeliveryType] = useState<'envio' | 'retiro'>('envio');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState('');

  // Pre-llenar dirección desde el perfil del usuario
  useEffect(() => {
    if (userProfile) {
      const { address: addr, city, province, postalCode } = userProfile;
      const parts = [addr, city, province, postalCode].filter(Boolean);
      if (parts.length > 0) setAddress(parts.join(', '));
    }
  }, [userProfile]);

  // Bloquear scroll cuando está abierto
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    // Resetear después de animar el cierre
    setTimeout(() => {
      setStep('carrito');
      setNotes('');
    }, 300);
  };

  const handleConfirmOrder = async () => {
    if (!user) return;
    if (deliveryType === 'envio' && !address.trim()) {
      alert('Por favor ingresá tu dirección de envío.');
      return;
    }

    setSubmitting(true);
    try {
      const newOrder: Omit<Order, 'id'> = {
        userId: user.uid,
        userEmail: user.email || '',
        userName: userProfile?.displayName || user.email?.split('@')[0] || 'Cliente',
        userPhone: userProfile?.phone || '',
        items: items.map(i => ({
          productId: i.id,
          name: i.name,
          image: i.image,
          price: i.price,
          quantity: i.quantity,
        })),
        subtotal: cartTotal,
        total: cartTotal,
        deliveryType,
        address: deliveryType === 'envio' ? address.trim() : 'Retiro en vivero',
        status: 'pendiente',
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 1. Guardar en Firestore
      const newOrderId = await createOrder(newOrder);
      setOrderId(newOrderId);

      // 2. Notificar al vivero por WhatsApp
      const msg = buildWhatsAppMessage(newOrder, newOrderId);
      const waLink = `https://wa.me/${VIVERO_WHATSAPP}?text=${encodeURIComponent(msg)}`;
      window.open(waLink, '_blank');

      // 3. Limpiar carrito y mostrar éxito
      clearCart();
      setStep('exito');
    } catch (e) {
      console.error(e);
      alert('Hubo un error al registrar el pedido. Intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const shortOrderId = orderId ? orderId.slice(-6).toUpperCase() : '';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] transition-opacity animate-in fade-in"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white dark:bg-slate-950 shadow-2xl z-[100] flex flex-col animate-in slide-in-from-right duration-300">

        {/* ══════════════════ HEADER ══════════════════ */}
        <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/5">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            {step === 'carrito' && <><ShoppingBag className="w-6 h-6 text-primary-600" /> Mi Carrito</>}
            {step === 'checkout' && <><ClipboardList className="w-6 h-6 text-primary-600" /> Confirmar Pedido</>}
            {step === 'exito' && <><CheckCircle className="w-6 h-6 text-green-500" /> ¡Pedido Enviado!</>}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ══════════════════ PASO: CARRITO ══════════════════ */}
        {step === 'carrito' && (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <ShoppingBag className="w-16 h-16 mb-4" />
                  <p className="font-medium text-lg">Tu carrito está vacío</p>
                  <p className="text-sm mt-2">Agregá algunas plantas para verlas aquí.</p>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="flex gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-2xl relative group">
                    <img src={item.image} alt={item.name} className="w-20 h-24 object-cover rounded-xl flex-shrink-0" />
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="font-bold text-base leading-tight line-clamp-2">{item.name}</h3>
                        <p className="font-black text-primary-600 dark:text-primary-400 mt-1">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 bg-white dark:bg-black/40 rounded-lg p-1 shadow-sm border border-black/5 dark:border-white/5 w-fit mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          disabled={item.quantity <= 1}
                          className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors disabled:opacity-30"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-sm w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors disabled:opacity-30"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="absolute top-3 right-3 p-1.5 text-red-500 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-black/5 dark:border-white/5">
                <div className="flex items-center justify-between mb-5">
                  <span className="font-medium text-lg text-foreground/70">Total</span>
                  <span className="text-3xl font-black">${cartTotal.toFixed(2)}</span>
                </div>
                {user ? (
                  <button
                    onClick={() => setStep('checkout')}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg transition-all shadow-xl shadow-primary-500/20 active:scale-[0.98]"
                  >
                    Finalizar Pedido <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <a
                    href="/login"
                    onClick={handleClose}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg transition-all shadow-xl shadow-primary-500/20"
                  >
                    Iniciá sesión para continuar
                  </a>
                )}
                <p className="text-center text-xs font-medium text-foreground/40 mt-3">
                  Acordarás el pago directamente con el local.
                </p>
              </div>
            )}
          </>
        )}

        {/* ══════════════════ PASO: CHECKOUT ══════════════════ */}
        {step === 'checkout' && (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Resumen del pedido */}
              <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-foreground/70">{item.name} × {item.quantity}</span>
                    <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-black/10 dark:border-white/10 pt-2 flex justify-between font-black">
                  <span>Total</span>
                  <span className="text-primary-600 dark:text-primary-400">${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Tipo de entrega */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-foreground/50 mb-3">
                  Tipo de entrega
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDeliveryType('envio')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      deliveryType === 'envio'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                        : 'border-black/10 dark:border-white/10 hover:border-primary-300'
                    }`}
                  >
                    <Home className="w-6 h-6" />
                    <span className="font-bold text-sm">Envío a casa</span>
                  </button>
                  <button
                    onClick={() => setDeliveryType('retiro')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      deliveryType === 'retiro'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                        : 'border-black/10 dark:border-white/10 hover:border-primary-300'
                    }`}
                  >
                    <Store className="w-6 h-6" />
                    <span className="font-bold text-sm">Retiro en vivero</span>
                  </button>
                </div>
              </div>

              {/* Dirección (solo si es envío) */}
              {deliveryType === 'envio' && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-foreground/50 mb-2 block">
                    Dirección de envío *
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Calle, número, piso, ciudad..."
                    className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none text-sm"
                  />
                  {!userProfile?.address && (
                    <p className="text-xs text-foreground/40 mt-1">
                      💡 Guardá tu dirección en{' '}
                      <a href="/perfil" onClick={handleClose} className="text-primary-500 hover:underline">
                        tu perfil
                      </a>{' '}
                      para no ingresarla cada vez.
                    </p>
                  )}
                </div>
              )}

              {deliveryType === 'retiro' && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800/30 text-sm text-amber-700 dark:text-amber-400">
                  <p className="font-bold mb-1">📍 Vivero Libertad</p>
                  <p>Lunes a Sábado · 9:00 a 18:00 hs</p>
                  <p className="text-xs mt-1 opacity-70">Te avisamos cuando tu pedido esté listo para retirar.</p>
                </div>
              )}

              {/* Nota opcional */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-foreground/50 mb-2 block">
                  Nota para el vivero (opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ej: maceta doble, sin caja, etc."
                  className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none text-sm"
                />
              </div>
            </div>

            {/* Footer checkout */}
            <div className="p-6 border-t border-black/5 dark:border-white/5 space-y-3">
              <button
                onClick={handleConfirmOrder}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-bold text-lg transition-all shadow-xl shadow-green-500/20 active:scale-[0.98]"
              >
                {submitting ? (
                  <><Leaf className="w-5 h-5 animate-spin" /> Registrando pedido...</>
                ) : (
                  <><CheckCircle className="w-5 h-5" /> Confirmar Pedido</>
                )}
              </button>
              <button
                onClick={() => setStep('carrito')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-foreground/60 hover:bg-black/5 dark:hover:bg-white/5 font-medium transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Volver al carrito
              </button>
            </div>
          </>
        )}

        {/* ══════════════════ PASO: ÉXITO ══════════════════ */}
        {step === 'exito' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-3xl flex items-center justify-center mb-6 animate-in zoom-in duration-300">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-2">¡Pedido registrado!</h3>
            <p className="text-foreground/60 mb-4">
              Tu pedido fue guardado exitosamente. También abrimos WhatsApp para
              notificar al vivero.
            </p>

            <div className="bg-black/5 dark:bg-white/5 rounded-2xl px-6 py-4 mb-8 w-full">
              <p className="text-xs uppercase font-bold tracking-widest text-foreground/40 mb-1">
                Número de pedido
              </p>
              <p className="text-3xl font-black font-display text-primary-600 dark:text-primary-400">
                #{shortOrderId}
              </p>
            </div>

            <div className="space-y-3 w-full">
              <a
                href="/mis-pedidos"
                onClick={handleClose}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold transition-colors"
              >
                Ver mis pedidos
              </a>
              <button
                onClick={handleClose}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-foreground/60 hover:bg-black/5 dark:hover:bg-white/5 font-medium transition-colors text-sm"
              >
                Seguir comprando
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
