'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { 
  getWorkshopById, bookWorkshop, Workshop, WorkshopBooking 
} from '@/lib/workshops';
import { useAuth } from '@/context/AuthContext';
import { 
  Calendar, MapPin, Video, Users, Clock, ArrowLeft, 
  CheckCircle, Plus, Minus, MessageCircle, Info, Landmark, Copy, Check
} from 'lucide-react';
import Link from 'next/link';

// Datos Bancarios de Ejemplo
const BANK_DETAILS = {
  bank: "Banco Galicia",
  cbu: "0070123456789012345678",
  alias: "VIVERO.LIBERTAD.OK",
  owner: "Vivero Libertad S.A."
};

const VIVERO_WHATSAPP = '5491112345678';

export default function WorkshopDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, userProfile } = useAuth();
  
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchWorkshop = async () => {
      if (!id) return;
      try {
        const data = await getWorkshopById(id as string);
        setWorkshop(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkshop();
  }, [id]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBooking = async () => {
    if (!user || !workshop) return;
    
    setIsSubmitting(true);
    try {
      const bookingData: Omit<WorkshopBooking, 'id'> = {
        workshopId: workshop.id!,
        workshopTitle: workshop.title,
        workshopDate: workshop.date,
        userId: user.uid,
        userName: userProfile?.displayName || user.email?.split('@')[0] || 'Cliente',
        userEmail: user.email || '',
        userPhone: userProfile?.phone || '',
        slots,
        totalPrice: workshop.price * slots,
        status: 'pendiente',
        createdAt: new Date().toISOString()
      };

      const newId = await bookWorkshop(bookingData);
      setBookingId(newId);
      
      // Scrollear al tope para ver la confirmación
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      alert(e.message || "Error al realizar la reserva");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen animate-pulse bg-black/5" />;
  if (!workshop) return <div className="min-h-screen flex items-center justify-center">Taller no encontrado.</div>;

  const dateStr = new Date(workshop.date).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const timeStr = new Date(workshop.date).toLocaleTimeString('es-AR', {
    hour: '2-digit', minute: '2-digit'
  });
  
  const spotsLeft = workshop.capacity - workshop.occupiedSpots;

  // Renderizar Vista de Éxito
  if (bookingId) {
    const waMsg = `¡Hola Vivero Libertad! Acabo de reservar ${slots} lugar(es) para el taller "${workshop.title}" (ID: ${bookingId}). Les adjunto el comprobante de transferencia.`;
    const waLink = `https://wa.me/${VIVERO_WHATSAPP}?text=${encodeURIComponent(waMsg)}`;

    return (
      <main className="min-h-screen bg-[#fcfdfa] dark:bg-slate-950 pb-20">
        <Navbar />
        <div className="pt-32 max-w-3xl mx-auto px-4">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 md:p-12 shadow-2xl border border-primary-100 dark:border-primary-900/30 text-center animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">¡Reserva Registrada!</h1>
            <p className="text-foreground/60 mb-8">
              Tu lugar está pre-reservado. Para confirmarlo, realizá la transferencia por el total de 
              <span className="font-black text-primary-600 dark:text-primary-400"> ${workshop.price * slots}</span>.
            </p>

            {/* Datos Bancarios */}
            <div className="bg-black/5 dark:bg-white/5 rounded-3xl p-6 text-left mb-8 border border-black/5">
              <div className="flex items-center gap-2 text-primary-600 font-bold text-xs uppercase tracking-widest mb-4">
                <Landmark className="w-4 h-4" /> Datos para Transferencia
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center group">
                  <div>
                    <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-tighter">CBU</p>
                    <p className="font-mono text-sm">{BANK_DETAILS.cbu}</p>
                  </div>
                  <button onClick={() => copyToClipboard(BANK_DETAILS.cbu)} className="p-2 hover:bg-black/5 rounded-lg transition-colors">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 opacity-40 hover:opacity-100" />}
                  </button>
                </div>
                <div className="flex justify-between items-center group">
                  <div>
                    <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-tighter">Alias</p>
                    <p className="font-bold text-lg">{BANK_DETAILS.alias}</p>
                  </div>
                  <button onClick={() => copyToClipboard(BANK_DETAILS.alias)} className="p-2 hover:bg-black/5 rounded-lg transition-colors">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 opacity-40 hover:opacity-100" />}
                  </button>
                </div>
                <div className="pt-2 border-t border-black/5">
                  <p className="text-xs text-foreground/50">Titular: <span className="font-bold text-foreground">{BANK_DETAILS.owner}</span></p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a 
                href={waLink} 
                target="_blank" 
                className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold transition-all shadow-xl shadow-green-500/20"
              >
                <MessageCircle className="w-5 h-5" /> Enviar Comprobante
              </a>
              <Link 
                href="/talleres" 
                className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold transition-all"
              >
                Seguir Explorando
              </Link>
            </div>
            
            <p className="mt-6 text-xs text-foreground/40 italic">
              Recordá que tenés 24hs para enviar el pago, de lo contrario el cupo se liberará.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fcfdfa] dark:bg-slate-950">
      <Navbar />
      
      {/* Header Mobile & Navigation */}
      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-between mb-8">
        <Link href="/talleres" className="flex items-center gap-2 text-sm font-bold text-foreground/60 hover:text-primary-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver a talleres
        </Link>
        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
          workshop.type === 'online' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {workshop.type === 'online' ? 'Modalidad Virtual' : 'Modalidad Presencial'}
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 pb-32">
        
        {/* Lado Izquierdo: Info */}
        <div className="lg:col-span-7">
          <img 
            src={workshop.image} 
            alt={workshop.title} 
            className="w-full h-[400px] md:h-[500px] object-cover rounded-[40px] shadow-2xl mb-10" 
          />
          
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">{workshop.title}</h1>
          
          <div className="flex flex-wrap gap-6 mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-40">Fecha</p>
                <p className="font-bold">{dateStr}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-40">Horario</p>
                <p className="font-bold">{timeStr} ({workshop.duration})</p>
              </div>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none text-foreground/70 leading-relaxed space-y-4">
            <h3 className="text-xl font-bold text-foreground mb-4">Sobre este workshop</h3>
            <p>{workshop.description}</p>
            
            {workshop.requirements && (
              <div className="bg-primary-50 dark:bg-primary-900/10 p-6 rounded-3xl border border-primary-100 dark:border-primary-800/20 mt-8">
                <h4 className="flex items-center gap-2 text-primary-700 dark:text-primary-300 font-bold mb-2">
                  <Info className="w-5 h-5" /> Requisitos / Materiales
                </h4>
                <p className="text-sm">{workshop.requirements}</p>
              </div>
            )}
          </div>
        </div>

        {/* Lado Derecho: Flotante de Reserva */}
        <div className="lg:col-span-5">
          <div className="sticky top-32 glass dark:glass-dark rounded-[40px] p-8 md:p-10 border border-white/20 dark:border-white/5 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <div>
                <p className="text-sm font-bold opacity-40 uppercase tracking-widest">Inversión</p>
                <p className="text-4xl font-black text-primary-600 dark:text-primary-400">
                  ${workshop.price.toLocaleString('es-AR')}
                </p>
              </div>
              {workshop.type === 'presencial' ? (
                <div className="flex flex-col items-end">
                  <MapPin className="w-6 h-6 text-amber-500 mb-1" />
                  <p className="text-[10px] font-black uppercase text-right leading-tight max-w-[100px]">
                    {workshop.address}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-end">
                  <Video className="w-6 h-6 text-blue-500 mb-1" />
                  <p className="text-[10px] font-black uppercase text-right leading-tight max-w-[100px]">
                    Vía {workshop.platform || 'Directo'}
                  </p>
                </div>
              )}
            </div>

            <hr className="border-black/5 dark:border-white/10 mb-8" />

            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-3">Cantidad de Lugares</p>
                <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 rounded-2xl p-2 border border-black/5">
                  <button 
                    onClick={() => setSlots(Math.max(1, slots - 1))}
                    className="w-12 h-12 rounded-xl flex items-center justify-center hover:bg-white dark:hover:bg-white/10 transition-colors shadow-sm"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-2xl font-black">{slots}</span>
                  <button 
                    onClick={() => setSlots(Math.min(spotsLeft, slots + 1))}
                    disabled={slots >= spotsLeft}
                    className="w-12 h-12 rounded-xl flex items-center justify-center hover:bg-white dark:hover:bg-white/10 transition-colors shadow-sm disabled:opacity-30"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[10px] text-foreground/40 mt-2 text-center font-bold">
                  Solo quedan {spotsLeft} cupos disponibles
                </p>
              </div>

              <div className="flex justify-between items-center font-bold text-lg">
                <span className="opacity-60">Total a pagar:</span>
                <span className="text-2xl font-black">${(workshop.price * slots).toLocaleString('es-AR')}</span>
              </div>

              {!user ? (
                <Link 
                  href="/login" 
                  className="w-full py-5 flex items-center justify-center gap-2 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-black transition-transform hover:scale-[1.02]"
                >
                  Iniciá sesión para reservar
                </Link>
              ) : spotsLeft <= 0 ? (
                <div className="w-full py-5 text-center rounded-2xl bg-red-100 text-red-600 font-black cursor-not-allowed">
                  ¡Cupos Agotados!
                </div>
              ) : (
                <button 
                  onClick={handleBooking}
                  disabled={isSubmitting}
                  className="w-full py-5 flex items-center justify-center gap-2 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-black transition-all shadow-xl shadow-primary-500/30 hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Procesando...' : 'Confirmar Reserva'}
                </button>
              )}
              
              <p className="text-[10px] text-foreground/30 text-center leading-relaxed">
                Al reservar, aceptás nuestras políticas de cancelación. El pago debe realizarse dentro de las 24hs para asegurar el cupo.
              </p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
