import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/50 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1466692476868-aef1dfb1e7d6?auto=format&fit=crop&q=80&w=2000" 
          alt="Bosque y Plantas de fondo" 
          className="w-full h-full object-cover object-center opacity-80 dark:opacity-30"
        />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <span className="inline-block py-1 px-3 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-semibold mb-6 ring-1 ring-primary-500/20">
            Nueva Temporada 🌸
          </span>
          <h1 className="text-5xl lg:text-7xl font-display font-bold tracking-tight text-foreground mb-6">
            Transforma tu espacio con <span className="text-primary-600 dark:text-primary-400">naturaleza</span>
          </h1>
          <p className="text-lg text-foreground/80 mb-8 max-w-xl leading-relaxed">
            Descubre nuestra colección de plantas de interior, exterior y accesorios premium. 
            Cultivadas con amor y enviadas directamente a tu puerta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-primary-600 hover:bg-primary-700 text-white transition-all font-medium group shadow-lg shadow-primary-500/20">
              Explorar Catálogo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 rounded-full glass dark:glass-dark hover:bg-black/5 dark:hover:bg-white/5 font-medium transition-colors">
              Saber más
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
