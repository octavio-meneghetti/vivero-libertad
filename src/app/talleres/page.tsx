'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { 
  Calendar, Video, MapPin, Users, Clock, ArrowRight, Sparkles, Filter 
} from 'lucide-react';
import Link from 'next/link';
import { getAllWorkshops, Workshop } from '@/lib/workshops';

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | 'presencial' | 'online'>('todos');

  useEffect(() => {
    const fetchWorkshops = async () => {
      try {
        const data = await getAllWorkshops();
        setWorkshops(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkshops();
  }, []);

  const filteredWorkshops = workshops.filter(w => {
    if (filter === 'todos') return true;
    return w.type === filter;
  });

  return (
    <main className="min-h-screen bg-[#fcfdfa] dark:bg-slate-950">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-50/50 via-transparent to-transparent dark:from-primary-900/10" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary-200/20 dark:bg-primary-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-black uppercase tracking-widest mb-6 border border-primary-200 dark:border-primary-800">
            <Sparkles className="w-3.5 h-3.5" /> Viví la Experiencia Botánica
          </span>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6">
            Talleres y <span className="text-primary-600 dark:text-primary-400">Workshops</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-foreground/60 leading-relaxed">
            Aprendé a cuidar tus plantas, crear terrarios o diseñar tu huerta urbana con nuestros expertos. Online desde tu casa o presencial en nuestro vivero.
          </p>
        </div>
      </section>

      {/* Barra de Filtros */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => setFilter('todos')}
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
              filter === 'todos' 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' 
                : 'bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 hover:bg-black/5'
            }`}
          >
            Todos los eventos
          </button>
          <button
            onClick={() => setFilter('presencial')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
              filter === 'presencial' 
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                : 'bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 hover:bg-black/5'
            }`}
          >
            <MapPin className="w-4 h-4" /> Presenciales
          </button>
          <button
            onClick={() => setFilter('online')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
              filter === 'online' 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                : 'bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 hover:bg-black/5'
            }`}
          >
            <Video className="w-4 h-4" /> Online / En Vivo
          </button>
        </div>
      </section>

      {/* Grid de Talleres */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[450px] rounded-3xl bg-black/5 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredWorkshops.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 rounded-[40px]">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-foreground/20" />
            <h3 className="text-xl font-bold mb-2">No hay talleres programados</h3>
            <p className="text-foreground/50">Estamos preparando nuevas experiencias. ¡Volvé pronto!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredWorkshops.map((workshop) => (
              <WorkshopCard key={workshop.id} workshop={workshop} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Footer */}
      <section className="bg-primary-900 py-20 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">¿Querés dictar tu propio taller?</h2>
          <p className="text-primary-200 mb-8 max-w-xl mx-auto">
            Buscamos expertos, paisajistas y amantes del arte botánico para sumar a nuestra cartelera.
          </p>
          <button className="px-8 py-4 rounded-full bg-white text-primary-900 font-bold hover:scale-105 transition-transform">
            Postulate como Instructor
          </button>
        </div>
      </section>

    </main>
  );
}

function WorkshopCard({ workshop }: { workshop: Workshop }) {
  const date = new Date(workshop.date).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long'
  });
  
  const time = new Date(workshop.date).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const spotsLeft = workshop.capacity - workshop.occupiedSpots;
  const isLleno = spotsLeft <= 0;

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border border-black/5 dark:border-white/5 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
      <div className="relative h-64 overflow-hidden">
        <img 
          src={workshop.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000"} 
          alt={workshop.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Chips flotantes */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {workshop.type === 'online' ? (
            <span className="px-3 py-1 bg-blue-500/90 backdrop-blur-md text-white text-[10px] font-black rounded-full uppercase flex items-center gap-1">
              <Video className="w-3 h-3" /> Online
            </span>
          ) : (
            <span className="px-3 py-1 bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-black rounded-full uppercase flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Presencial
            </span>
          )}
        </div>

        <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
          <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-white">
            <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Inicio</p>
            <p className="text-xl font-black">{date}</p>
          </div>
          <div className="text-right text-white">
            <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Inversión</p>
            <p className="text-2xl font-black">${Number(workshop.price).toLocaleString('es-AR')}</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <h3 className="text-2xl font-display font-bold mb-3 group-hover:text-primary-600 transition-colors">
          {workshop.title}
        </h3>
        <p className="text-foreground/60 text-sm line-clamp-2 mb-6">
          {workshop.description}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="flex items-center gap-2 text-foreground/40 text-xs font-bold">
            <Clock className="w-4 h-4 text-primary-500" /> {workshop.duration}
          </div>
          <div className={`flex items-center gap-2 text-xs font-bold ${isLleno ? 'text-red-500' : 'text-green-600'}`}>
            <Users className="w-4 h-4" /> 
            {isLleno ? 'Cupos Agotados' : `${spotsLeft} lugares libres`}
          </div>
        </div>

        <Link 
          href={`/talleres/${workshop.id}`}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all ${
            isLleno 
              ? 'bg-black/5 text-foreground/30 cursor-not-allowed' 
              : 'bg-primary-600 hover:bg-primary-700 text-white shadow-xl shadow-primary-500/20 active:scale-95'
          }`}
        >
          {isLleno ? 'Cerrado' : 'Reservar Mi Lugar'} 
          {!isLleno && <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />}
        </Link>
      </div>
    </div>
  );
}
