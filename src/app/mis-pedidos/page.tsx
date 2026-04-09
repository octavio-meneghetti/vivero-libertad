'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package, Leaf, ArrowLeft, MessageCircle,
  Clock, CheckCircle, Truck, Store, ShoppingBag, XCircle
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import {
  Order, OrderStatus, STATUS_LABELS, STATUS_COLORS,
  STATUS_STEPS, subscribeToUserOrders
} from '@/lib/orders';

// ─── Línea de tiempo del pedido ───────────────────────────────────────────────
const STEP_ICONS: Record<OrderStatus, React.ElementType> = {
  pendiente:  Clock,
  confirmado: CheckCircle,
  preparando: Package,
  enviado:    Truck,
  entregado:  CheckCircle,
  cancelado:  XCircle,
};

function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === 'cancelado') {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
        <XCircle className="w-4 h-4" /> Pedido cancelado
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.indexOf(status);

  return (
    <div className="flex items-center gap-0 mt-4 w-full overflow-x-auto pb-1">
      {STATUS_STEPS.map((step, i) => {
        const Icon = STEP_ICONS[step];
        const isDone = i <= currentIndex;
        const isLast = i === STATUS_STEPS.length - 1;

        return (
          <div key={step} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isDone
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30'
                  : 'bg-black/5 dark:bg-white/5 text-foreground/30'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-bold text-center whitespace-nowrap ${
                isDone ? 'text-primary-600 dark:text-primary-400' : 'text-foreground/30'
              }`}>
                {STATUS_LABELS[step]}
              </span>
            </div>
            {!isLast && (
              <div className={`h-0.5 w-8 sm:w-12 mb-4 flex-shrink-0 transition-all ${
                i < currentIndex ? 'bg-primary-500' : 'bg-black/10 dark:bg-white/10'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tarjeta de pedido ────────────────────────────────────────────────────────
function OrderCard({ order }: { order: Order }) {
  const date = new Date(order.createdAt).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  const shortId = order.id?.slice(-6).toUpperCase() ?? '------';

    const waMsg = encodeURIComponent(
      `🌿 *Consulta sobre mi pedido #$${shortId}*\n` +
      `Hola! Soy $${userProfile?.displayName || user?.email?.split('@')[0]}, quería consultar sobre el estado de mi pedido realizado el $${date}.\n` +
      `Estado actual: $${STATUS_LABELS[order.status]}\n` +
      `¡Muchas gracias!`
    );

    const DeliveryIcon = order.deliveryType === 'retiro' ? Store : Truck;

    return (
      <div className="bg-white dark:bg-slate-900/60 rounded-[32px] border border-black/5 dark:border-white/5 overflow-hidden shadow-xl hover:shadow-primary-500/10 transition-all duration-300 group">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white dark:bg-black/20 rounded-2xl flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-110 transition-transform">
               <Package className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-[10px] text-foreground/40 font-black uppercase tracking-widest mb-0.5">
                Pedido Identificado
              </p>
              <p className="text-2xl font-display font-black text-primary-600 dark:text-primary-400 leading-none">
                #{shortId}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
             <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${STATUS_COLORS[order.status]}`}>
               {STATUS_LABELS[order.status]}
             </span>
             <p className="text-[10px] text-foreground/30 font-bold mt-2 uppercase tracking-tight">{date}</p>
          </div>
        </div>

        {/* Products List (Compact) */}
        <div className="p-6">
           <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {order.items.map((item, i) => (
                <div key={i} className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border border-black/5 relative group/item">
                   <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">x{item.quantity}</span>
                   </div>
                </div>
              ))}
              {order.items.length > 5 && (
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-black/5 flex items-center justify-center text-[10px] font-bold opacity-40">
                   +{order.items.length - 5}
                </div>
              )}
           </div>

           {/* Timeline */}
           <div className="mt-4 pt-6 border-t border-black/5">
              <OrderTimeline status={order.status} />
           </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 bg-black/[0.01] dark:bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-3">
              <DeliveryIcon className="w-4 h-4 text-foreground/40" />
              <p className="text-xs font-bold text-foreground/60">
                 {order.deliveryType === 'retiro' ? 'Retiro en Sucursal' : `Envío a: $${order.address}`}
              </p>
           </div>
           
           <div className="flex items-center gap-6 w-full sm:w-auto">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-30 text-right">Inversión Total</p>
                 <p className="text-xl font-black text-foreground text-right">$${order.total.toLocaleString('es-AR')}</p>
              </div>
              <a
                href={`https://wa.me/5491112345678?text=$${waMsg}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-green-500/20 active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                Consultar
              </a>
           </div>
        </div>
      </div>
    );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function MisPedidosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !loading && !user) router.push('/login');
  }, [mounted, loading, user, router]);

  // Suscripción en tiempo real a los pedidos del usuario
  useEffect(() => {
    if (!user) return;
    setOrdersLoading(true);
    const unsub = subscribeToUserOrders(user.uid, (data) => {
      setOrders(data);
      setOrdersLoading(false);
    });
    return () => unsub();
  }, [user]);

  if (!mounted || loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Leaf className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50/40 via-background to-background dark:from-primary-950/20">
      <Navbar />

      <div className="pt-28 pb-20 max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header de página */}
        <div className="mb-8">
          <Link
            href="/perfil"
            className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-4 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al perfil
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">Mis Pedidos</h1>
              <p className="text-foreground/50 text-sm">
                {ordersLoading ? 'Cargando...' : `${orders.length} pedido${orders.length !== 1 ? 's' : ''} encontrado${orders.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        {ordersLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Leaf className="w-10 h-10 text-primary-400 animate-spin" />
            <p className="text-foreground/50 font-medium">Cargando tus pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-black/5 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-5">
              <ShoppingBag className="w-12 h-12 text-foreground/20" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Todavía no hiciste pedidos</h2>
            <p className="text-foreground/50 max-w-sm mb-8">
              Cuando hagas tu primer pedido desde el carrito, aparecerá aquí con seguimiento en tiempo real.
            </p>
            <Link
              href="/#catalogo"
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-primary-500/20"
            >
              <Leaf className="w-4 h-4" /> Explorar catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
