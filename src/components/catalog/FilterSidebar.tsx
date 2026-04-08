'use client';

import { 
  LUZ_EXPOSICION, 
  USO_PRINCIPAL,
  TIPO_SUELO,
  DRENAJE,
  HABITO_CRECIMIENTO,
  VELOCIDAD_CRECIMIENTO,
  TIPO_FOLLAJE,
  COLOR_FOLLAJE,
  EPOCA_FLORACION,
  MANTENIMIENTO
} from '@/types/botanical';
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, Leaf, PawPrint, Baby, Microscope, Sparkles } from 'lucide-react';
import { useState } from 'react';

export interface FilterState {
  search: string;
  category: string;
  luz: string;
  uso: string;
  petFriendly: boolean;
  nativa: boolean;
  principiante: boolean;
  // Expert fields
  suelo: string;
  drenaje: string;
  habito: string;
  velCrecimiento: string;
  tipoFollaje: string;
  colorFollaje: string;
  epocaFloracion: string;
  mantenimiento: string;
}

export const INITIAL_FILTERS: FilterState = {
  search: '', category: 'todos', luz: '', uso: '', 
  petFriendly: false, nativa: false, principiante: false,
  suelo: '', drenaje: '', habito: '', velCrecimiento: '',
  tipoFollaje: '', colorFollaje: '', epocaFloracion: '', mantenimiento: ''
};

interface Props {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  categories: string[];
}

export default function FilterSidebar({ filters, setFilters, categories }: Props) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [expertMode, setExpertMode] = useState(false);
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>({});

  const handleChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleBlock = (block: string) => {
    setCollapsedBlocks(prev => ({ ...prev, [block]: !prev[block] }));
  };

  const BlockHeader = ({ title, blockKey }: { title: string, blockKey: string }) => (
    <div 
      className="flex justify-between items-center py-3 cursor-pointer select-none group mt-4 first:mt-0"
      onClick={() => toggleBlock(blockKey)}
    >
      <h3 className="font-bold text-sm uppercase tracking-wider text-foreground/80 group-hover:text-primary-600 transition-colors">{title}</h3>
      {collapsedBlocks[blockKey] ? <ChevronDown className="w-4 h-4 text-foreground/50" /> : <ChevronUp className="w-4 h-4 text-foreground/50" />}
    </div>
  );

  const DropdownExpert = ({ label, propKey, options }: { label: string, propKey: keyof FilterState, options: string[] }) => (
    <div className="mb-4 last:mb-0">
      <label className="block text-xs font-bold text-foreground/60 mb-1.5 ml-1">{label}</label>
      <select 
        value={filters[propKey] as string} onChange={e => handleChange(propKey, e.target.value)}
        className="w-full text-sm font-medium px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5 border border-transparent hover:border-black/10 dark:hover:border-white/10 outline-none focus:ring-2 focus:ring-secondary-500 transition-all"
      >
        <option value="">-- Cualquiera --</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <>
      <button 
        onClick={() => setIsOpenMobile(!isOpenMobile)}
        className="w-full lg:hidden mb-6 flex items-center justify-between px-6 py-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-black/10 dark:border-white/5 backdrop-blur-md"
      >
        <span className="font-bold flex items-center gap-2"><SlidersHorizontal className="w-5 h-5"/> Filtros y Búsqueda</span>
        {isOpenMobile ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
      </button>

      <aside className={`w-full lg:block lg:sticky lg:top-24 space-y-6 ${isOpenMobile ? 'block' : 'hidden'} overflow-y-auto max-h-[85vh] hide-scrollbar pb-6`}>
        
        {/* Barra de Búsqueda */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
          <input 
            type="text" 
            placeholder="Buscar por nombre..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/60 dark:bg-black/30 border border-black/10 focus:ring-2 focus:ring-primary-500 font-medium transition-all outline-none"
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
          />
        </div>

        <div className="glass rounded-3xl p-5 border border-white/20 dark:border-white/5 shadow-sm dark:glass-dark relative overflow-hidden transition-all">
          
          {/* MODO EXPERTO TOGGLE */}
          <button 
            onClick={() => setExpertMode(!expertMode)}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black mb-6 transition-all border ${
              expertMode 
                ? 'bg-secondary-600 text-white border-secondary-600 shadow-md shadow-secondary-600/20' 
                : 'bg-black/5 dark:bg-white/5 text-foreground/60 border-transparent hover:bg-black/10'
            }`}
          >
            {expertMode ? <Microscope className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            {expertMode ? 'MODO PAISAJISTA ACTIVO' : 'ACTIVAR MODO EXPERTO'}
          </button>

          <div>
            <BlockHeader title="Tipo de Planta" blockKey="cat" />
            {!collapsedBlocks['cat'] && (
              <div className="flex flex-wrap gap-2 pb-2">
                {categories.map(c => (
                  <button 
                    key={c} onClick={() => handleChange('category', c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      filters.category === c 
                        ? (expertMode ? 'bg-secondary-600 text-white' : 'bg-primary-600 text-white shadow-sm') 
                        : 'bg-black/5 dark:bg-white/5 text-foreground/70 hover:bg-black/10'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="my-2 h-px w-full bg-black/5 dark:bg-white/5" />

          <div>
            <BlockHeader title="Luz y Ubicación" blockKey="luz" />
            {!collapsedBlocks['luz'] && (
              <div className="flex flex-col gap-2 pb-2">
                <label className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary-600 transition-colors">
                  <input type="radio" checked={filters.luz === ''} onChange={() => handleChange('luz', '')} className={`focus:ring-2 ${expertMode ? 'text-secondary-600 focus:ring-secondary-500' : 'text-primary-600 focus:ring-primary-500'}`} />
                  <span className="font-medium">Indiferente</span>
                </label>
                {LUZ_EXPOSICION.map(luz => (
                  <label key={luz} className="flex items-center gap-3 text-sm cursor-pointer hover:text-primary-600 transition-colors">
                    <input type="radio" checked={filters.luz === luz} onChange={() => handleChange('luz', luz)} className={`focus:ring-2 ${expertMode ? 'text-secondary-600 focus:ring-secondary-500' : 'text-primary-600 focus:ring-primary-500'}`} />
                    <span className="font-medium">{luz}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="my-2 h-px w-full bg-black/5 dark:bg-white/5" />

          <div>
            <BlockHeader title="Filtros Biológicos" blockKey="bio" />
            {!collapsedBlocks['bio'] && (
              <div className="flex flex-col gap-3 pb-2 pt-1">
                <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${filters.petFriendly ? (expertMode ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-900/10' : 'border-primary-500 bg-primary-50 dark:bg-primary-900/10') : 'border-black/5 hover:border-black/20 dark:border-white/5'}`}>
                  <PawPrint className={`w-5 h-5 ${filters.petFriendly ? (expertMode ? 'text-secondary-600' : 'text-primary-600') : 'text-foreground/40'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-bold">Segura p/ Mascotas</p>
                    <p className="text-xs text-foreground/60 leading-tight">Oculta las plantas tóxicas</p>
                  </div>
                  <input type="checkbox" className="hidden" checked={filters.petFriendly} onChange={e => handleChange('petFriendly', e.target.checked)} />
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${filters.nativa ? (expertMode ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-900/10' : 'border-primary-500 bg-primary-50 dark:bg-primary-900/10') : 'border-black/5 hover:border-black/20 dark:border-white/5'}`}>
                  <Leaf className={`w-5 h-5 ${filters.nativa ? (expertMode ? 'text-secondary-600' : 'text-primary-600') : 'text-foreground/40'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-bold">Especies Nativas</p>
                    <p className="text-xs text-foreground/60 leading-tight">Flora autóctona</p>
                  </div>
                  <input type="checkbox" className="hidden" checked={filters.nativa} onChange={e => handleChange('nativa', e.target.checked)} />
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${filters.principiante ? (expertMode ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-900/10' : 'border-primary-500 bg-primary-50 dark:bg-primary-900/10') : 'border-black/5 hover:border-black/20 dark:border-white/5'}`}>
                  <Baby className={`w-5 h-5 ${filters.principiante ? (expertMode ? 'text-secondary-600' : 'text-primary-600') : 'text-foreground/40'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-bold">Para Principiantes</p>
                    <p className="text-xs text-foreground/60 leading-tight">Mantenimiento muy bajo</p>
                  </div>
                  <input type="checkbox" className="hidden" checked={filters.principiante} onChange={e => handleChange('principiante', e.target.checked)} />
                </label>
              </div>
            )}
          </div>
          
          <div className="my-2 h-px w-full bg-black/5 dark:bg-white/5" />

          <div>
            <BlockHeader title="Uso Paisajístico" blockKey="uso" />
            {!collapsedBlocks['uso'] && (
              <div className="flex flex-col gap-2 pb-2">
                <select 
                  value={filters.uso} onChange={e => handleChange('uso', e.target.value)}
                  className={`w-full text-sm font-medium px-3 py-2.5 rounded-lg bg-black/5 dark:bg-white/5 border-none outline-none focus:ring-2 ${expertMode ? 'focus:ring-secondary-500' : 'focus:ring-primary-500'}`}
                >
                  <option value="">Cualquier Uso</option>
                  {USO_PRINCIPAL.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* ==== MODO EXPERTO BLOQUE DE FILTROS AVANZADOS ==== */}
          {expertMode && (
            <div className="mt-4 pt-4 border-t-2 border-secondary-500/20 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="bg-secondary-50 dark:bg-secondary-900/10 p-4 rounded-xl border border-secondary-500/30">
                <h3 className="font-black text-xs uppercase text-secondary-600 dark:text-secondary-400 mb-4 tracking-wider flex items-center gap-1.5">
                  <Microscope className="w-4 h-4"/> Filtros Taxonómicos
                </h3>
                
                <DropdownExpert label="Sustrato / Suelo" propKey="suelo" options={TIPO_SUELO} />
                <DropdownExpert label="Capacidad Drenaje" propKey="drenaje" options={DRENAJE} />
                <DropdownExpert label="Mantenimiento" propKey="mantenimiento" options={MANTENIMIENTO} />
                <DropdownExpert label="Hábito de Crecimiento" propKey="habito" options={HABITO_CRECIMIENTO} />
                <DropdownExpert label="Velocidad Desarrollo" propKey="velCrecimiento" options={VELOCIDAD_CRECIMIENTO} />
                <DropdownExpert label="Época Floración" propKey="epocaFloracion" options={EPOCA_FLORACION} />
                <DropdownExpert label="Tipo de Follaje" propKey="tipoFollaje" options={TIPO_FOLLAJE} />
                <DropdownExpert label="Color del Follaje" propKey="colorFollaje" options={COLOR_FOLLAJE} />
              </div>
            </div>
          )}

          {/* Botón Limpiar */}
          {(filters.search || filters.category !== 'todos' || filters.luz || filters.uso || filters.petFriendly || filters.nativa || filters.principiante || filters.suelo || filters.epocaFloracion) && (
            <button 
              onClick={() => setFilters(INITIAL_FILTERS)}
              className="mt-6 w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 transition-colors"
            >
              Restablecer Filtros
            </button>
          )}

        </div>
      </aside>
    </>
  );
}
