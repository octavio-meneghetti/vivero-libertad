'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import ProductCard from './ProductCard';
import FilterSidebar, { FilterState, INITIAL_FILTERS } from './FilterSidebar';
import { Frown } from 'lucide-react';

export default function ProductGrid() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(['todos', 'interior', 'exterior', 'accesorios']);

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  useEffect(() => {
    // Escuchar BD en tiempo real
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods: any[] = [];
      const cats = new Set<string>();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        prods.push({ id: doc.id, ...data });
        if (data.mainCategory) cats.add(data.mainCategory.toLowerCase());
        else if (data.category) cats.add(data.category.toLowerCase());
      });
      
      setProducts(prods);
      
      // Construir categorías dinámicas
      const dynamicCats = ['todos', 'interior', 'exterior', 'accesorios'];
      cats.forEach(c => { if (!dynamicCats.includes(c)) dynamicCats.push(c); });
      setCategories(dynamicCats);
      setLoading(false);
    }, (err) => {
      console.error('Error cargando catálogo:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Motor Core de Filtrado
  const filteredData = products.filter(p => {
    // 1. Text Search
    if (filters.search) {
      const term = filters.search.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(term);
      const matchSci = p.cientificName?.toLowerCase().includes(term);
      if (!matchName && !matchSci) return false;
    }
    // 2. Category
    if (filters.category !== 'todos') {
      const pCat = p.mainCategory?.toLowerCase() || p.category?.toLowerCase() || '';
      if (pCat !== filters.category) return false;
    }
    // 3. Selectors
    if (filters.luz && p.luz !== filters.luz) return false;
    if (filters.uso && p.usoPrincipal !== filters.uso) return false;
    
    // 4. Biological Toggles (Tolerancias)
    // petFriendly = true significa que SOLO queremos las seguras (no tóxicas)
    if (filters.petFriendly && p.toxicaMascotas) return false; 
    
    if (filters.nativa && !p.nativa) return false;
    if (filters.principiante && !p.principiante) return false;
    
    // 5. Expert Filters (Taxonómicos)
    if (filters.suelo && p.suelo !== filters.suelo) return false;
    if (filters.drenaje && p.drenaje !== filters.drenaje) return false;
    if (filters.mantenimiento && p.mantenimiento !== filters.mantenimiento) return false;
    if (filters.habito && p.habito !== filters.habito) return false;
    if (filters.velCrecimiento && p.velCrecimiento !== filters.velCrecimiento) return false;
    if (filters.epocaFloracion && p.epocaFloracion !== filters.epocaFloracion) return false;
    if (filters.tipoFollaje && p.tipoFollaje !== filters.tipoFollaje) return false;
    if (filters.colorFollaje && p.colorFollaje !== filters.colorFollaje) return false;

    return true;
  });

  return (
    <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="catalogo">
      <div className="mb-12">
        <h2 className="text-4xl font-display font-bold mb-4">Nuestro Catálogo</h2>
        <p className="text-foreground/70 max-w-2xl">
          Explora nuestra selección usando el motor de búsqueda botánica avanzada. 
          Encuentra exactamente la especie perfecta para ti.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* BARRA LATERAL (FILTROS AVANZADOS) */}
        <div className="w-full lg:w-72 flex-shrink-0">
           <FilterSidebar filters={filters} setFilters={setFilters} categories={categories} />
        </div>

        {/* GRILLA CENTRAL DE PRODUCTOS */}
        <div className="flex-1">
          
          {/* Píldoras Rápidas (Sincronizadas con Sidebar) */}
          <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-full w-full overflow-x-auto hide-scrollbar mb-8">
            {categories.map((cat) => (
              <button 
                key={cat} onClick={() => setFilters(prev => ({ ...prev, category: cat }))}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all capitalize whitespace-nowrap ${
                  filters.category === cat 
                    ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm' 
                    : 'text-foreground/70 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
              <p className="font-medium text-foreground/60 animate-pulse">Consultando bases de datos de Firebase...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-20 glass rounded-3xl dark:glass-dark flex flex-col items-center">
              <Frown className="w-12 h-12 text-foreground/30 mb-4" />
              <p className="text-xl font-bold text-foreground/50">No hay plantas que cumplan tus requisitos.</p>
              <p className="text-foreground/40 mt-2">Intenta apagar algunos filtros botánicos a la izquierda.</p>
              <button onClick={() => setFilters(INITIAL_FILTERS)} className="mt-6 font-bold text-primary-600 hover:underline">
                Revertir todos los filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredData.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
