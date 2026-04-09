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
  onSnapshot,
  Unsubscribe,
  getDoc,
  runTransaction
} from 'firebase/firestore';

// ---------- Tipos ----------

export type WorkshopType = 'presencial' | 'online';

export interface Workshop {
  id?: string;
  title: string;
  description: string;
  image: string;
  date: string; // ISO String
  duration: string; // Ej: "2 horas"
  price: number;
  capacity: number;
  occupiedSpots: number;
  instructor: string;
  type: WorkshopType;
  // Campos específicos
  address?: string; // Para presencial
  meetingLink?: string; // Para online (oculto hasta confirmar)
  platform?: string; // Ej: Zoom, Google Meet
  requirements?: string; // Materiales a traer, etc.
  createdAt: string;
}

export type BookingStatus = 'pendiente' | 'confirmado' | 'cancelado';

export interface WorkshopBooking {
  id?: string;
  workshopId: string;
  workshopTitle: string;
  workshopDate: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  slots: number;
  totalPrice: number;
  status: BookingStatus;
  paymentProofUrl?: string; // URL de la foto de la transferencia
  createdAt: string;
}

// ---------- CRUD Talleres ----------

/**
 * Crea un taller en Firestore.
 */
export async function createWorkshop(data: Omit<Workshop, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'workshops'), data);
  return docRef.id;
}

/**
 * Obtiene todos los talleres ordenados por fecha.
 */
export async function getAllWorkshops(): Promise<Workshop[]> {
  const q = query(collection(db, 'workshops'), orderBy('date', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Workshop));
}

/**
 * Obtiene un taller por ID.
 */
export async function getWorkshopById(id: string): Promise<Workshop | null> {
  const docRef = doc(db, 'workshops', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Workshop;
  }
  return null;
}

/**
 * Actualiza un taller.
 */
export async function updateWorkshop(id: string, data: Partial<Workshop>): Promise<void> {
  const docRef = doc(db, 'workshops', id);
  await updateDoc(docRef, data);
}

// ---------- Inscripciones ----------

/**
 * Realiza una reserva en una transacción para validar cupos.
 */
export async function bookWorkshop(booking: Omit<WorkshopBooking, 'id'>): Promise<string> {
  const result = await runTransaction(db, async (transaction) => {
    const workshopRef = doc(db, 'workshops', booking.workshopId);
    const workshopSnap = await transaction.get(workshopRef);
    
    if (!workshopSnap.exists()) {
      throw new Error("El taller no existe");
    }
    
    const workshop = workshopSnap.data() as Workshop;
    const available = workshop.capacity - workshop.occupiedSpots;
    
    if (booking.slots > available) {
      throw new Error(`Lo sentimos, solo quedan ${available} cupos disponibles.`);
    }
    
    // 1. Crear la reserva
    const bookingRef = doc(collection(db, 'workshop_bookings'));
    transaction.set(bookingRef, {
      ...booking,
      id: bookingRef.id
    });
    
    // 2. Actualizar cupos ocupados
    transaction.update(workshopRef, {
      occupiedSpots: workshop.occupiedSpots + booking.slots
    });
    
    return bookingRef.id;
  });
  
  return result;
}

/**
 * Obtiene las reservas de un usuario.
 */
export async function getBookingsByUser(uid: string): Promise<WorkshopBooking[]> {
  const q = query(
    collection(db, 'workshop_bookings'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkshopBooking));
}

/**
 * Suscripción en tiempo real a inscriptos de un taller (para Admin).
 */
export function subscribeToWorkshopBookings(
  workshopId: string,
  callback: (bookings: WorkshopBooking[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'workshop_bookings'),
    where('workshopId', '==', workshopId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkshopBooking)));
  });
}

/**
 * Actualiza el estado de una reserva (Ej: Confirmar pago).
 */
export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus
): Promise<void> {
  const docRef = doc(db, 'workshop_bookings', bookingId);
  await updateDoc(docRef, { status });
}
