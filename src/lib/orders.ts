import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pendiente'
  | 'confirmado'
  | 'preparando'
  | 'enviado'
  | 'entregado'
  | 'cancelado';

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface Order {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  deliveryType: 'envio' | 'retiro';
  address: string;
  status: OrderStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers de display ───────────────────────────────────────────────────────

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente:  'Pendiente',
  confirmado: 'Confirmado',
  preparando: 'Preparando',
  enviado:    'En camino',
  entregado:  'Entregado',
  cancelado:  'Cancelado',
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pendiente:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmado: 'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  preparando: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  enviado:    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  entregado:  'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
  cancelado:  'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
};

// Orden en que avanzan los estados (para la línea de tiempo)
export const STATUS_STEPS: OrderStatus[] = [
  'pendiente',
  'confirmado',
  'preparando',
  'enviado',
  'entregado',
];

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * Crea un nuevo pedido en Firestore y retorna el ID generado.
 */
export async function createOrder(data: Omit<Order, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'orders'), data);
  return docRef.id;
}

/**
 * Retorna todos los pedidos de un usuario específico, ordenados por fecha desc.
 */
export async function getOrdersByUser(uid: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
  } catch (e) {
    console.error('getOrdersByUser error:', e);
    return [];
  }
}

/**
 * Retorna todos los pedidos (para el panel Admin), ordenados por fecha desc.
 */
export async function getAllOrders(): Promise<Order[]> {
  try {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
  } catch (e) {
    console.error('getAllOrders error:', e);
    return [];
  }
}

/**
 * Suscripción en tiempo real a todos los pedidos (para Admin).
 * Retorna la función unsubscribe para limpiar el listener.
 */
export function subscribeToAllOrders(
  callback: (orders: Order[]) => void
): Unsubscribe {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
  });
}

/**
 * Suscripción en tiempo real a los pedidos de un usuario.
 */
export function subscribeToUserOrders(
  uid: string,
  callback: (orders: Order[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
  });
}

/**
 * Actualiza el estado de un pedido (acción de Admin).
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), {
    status,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Genera el mensaje de WhatsApp para notificar al vivero sobre un nuevo pedido.
 */
export function buildWhatsAppMessage(order: Order, orderId: string): string {
  const lines = order.items.map(
    i => `  • ${i.quantity}× ${i.name} ($${(i.price * i.quantity).toFixed(2)})`
  );
  const delivery =
    order.deliveryType === 'envio'
      ? `📦 Envío a: ${order.address}`
      : `🏪 Retiro en vivero`;

  return [
    `🌿 *NUEVO PEDIDO — Vivero Libertad*`,
    `N° de pedido: *${orderId}*`,
    ``,
    `👤 Cliente: ${order.userName} (${order.userEmail})`,
    order.userPhone ? `📱 Teléfono: ${order.userPhone}` : '',
    ``,
    `🛒 *Productos:*`,
    ...lines,
    ``,
    `💰 *Total: $${order.total.toFixed(2)}*`,
    ``,
    delivery,
    order.notes ? `📝 Nota: ${order.notes}` : '',
    ``,
    `Por favor confirmar el pedido. ¡Gracias!`,
  ]
    .filter(l => l !== null && l !== undefined)
    .join('\n');
}
