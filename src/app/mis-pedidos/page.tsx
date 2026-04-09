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
    `Hola! Quería consultar sobre mi pedido *#${shortId}* (${date}). ¿Podrían informarme el estado? ¡Gracias!`
  );

  const DeliveryIcon = order.deliveryType === 'retiro' ? Store : Truck;

  return (
    <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-black/5 dark:border-white/5">
        <div>
          <p className="text-xs text-foreground/40 font-medium uppercase tracking-widest mb-0.5">
            Pedido
          </p>
          <p className="text-xl font-display font-black text-primary-600 dark:text-primary-400">
            #{shortId}
          </p>
          <p className="text-xs text-foreground/50 mt-0.5">{date}</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${STATUS_COLORS[order.status]}`}>
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* Items */}
      <div className="p-5 border-b border-black/5 dark:border-white/5">
        <div className="flex gap-3 flex-wrap">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-black/5 dark:bg-white/5 rounded-xl px-3 py-2">
              <img
                src={item.image || 'https://images.unsplash.com/photo-1416879598553-380108ff4bca?q=80&w=80'}
                alt={item.name}
                className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold truncate max-w-[120px]">{item.name}</p>
                <p className="text-xs text-foreground/50">× {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-5">
        {/* Entrega */}
        <div className="flex items-center gap-2 text-sm text-foreground/60 mb-4">
          <DeliveryIcon className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            {order.deliveryType === 'retiro'
              ? 'Retiro en vivero'
              : `Envío a: ${order.address}`}
          </span>
        </div>

        {/* Línea de tiempo */}
        <OrderTimeline status={order.status} />

        {/* Total + consultar */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-black/5 dark:border-white/5">
          <div>
            <p className="text-xs text-foreground/40 font-medium">Total pagado</p>
            <p className="text-xl font-black">${order.total.toLocaleString('es-AR')}</p>
          </div>
          <a
            href={`https://wa.me/5491112345678?text=${waMsg}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-green-500/20"
          >
            <MessageCircle className="w-4 h-4" />
            Consultar
          </a>
        </div>

        {order.notes && (
          <p className="mt-3 text-xs text-foreground/40 italic bg-black/5 dark:bg-white/5 rounded-xl px-3 py-2">
            📝 {order.notes}
          </p>
        )}
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
