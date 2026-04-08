'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Upload, Plus, Save, Image as ImageIcon, CheckCircle, ChevronRight, Edit3, Trash2 } from 'lucide-react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as B from '@/types/botanical'; 

const TABS = ['📦 Inventario', 'Comercial', 'Identificación', 'Ambiental', 'Morfología', 'Ornamental', 'Ecología', '📋 Batch JSON'];

const INITIAL_STATE = {
  // Comercial
  name: '', description: '', price: '', stock: '', badge: '', image: '',
  // Identificacion
  cientificName: '', family: '', cultivar: '', sku: '', 
  mainCategory: '', subcategory: '',
  // Ambiental
  luz: '', horasSol: '', toleraSolFuerte: false, toleraSombra: false,
  agua: '', humedad: '',
  suelo: '', phNivel: '', drenaje: '',
  tempMin: '', tempMax: '', toleraHeladas: false, toleraCalor: false,
  // Morfologia
  habito: '', velCrecimiento: '', 
  alturaMax: '', anchoMax: '', tipoRaiz: '',
  // Ornamental
  tipoFollaje: '', colorFollaje: '', texturaFollaje: '',
  floracion: false, epocaFloracion: '', colorFlor: '', tamanoFlor: '', fragancia: '',
  // Usos y Ecologia
  usoPrincipal: '', mantenimiento: '', requierePoda: '', 
  principiante: false,
  atraePolinizadores: false, nativa: false, 
  toxicaMascotas: false, toxicaHumanos: false, espinas: false
};

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000";

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  
  const [inventory, setInventory] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [data, setData] = useState(INITIAL_STATE);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [user, isAdmin, loading, router, mounted]);

  // Listener del Inventario
  useEffect(() => {
    if (isAdmin) {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, snap => {
        setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsubscribe();
    }
  }, [isAdmin]);

  if (!mounted || loading || !isAdmin) return <div className="min-h-screen"></div>;

  const handleChange = (field: string, value: any) => setData(prev => ({ ...prev, [field]: value }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
  };

  const cancelEditMode = () => {
    setEditingId(null);
    setData(INITIAL_STATE);
    setImageFile(null);
  };

  const handleEditItem = (item: any) => {
    // Mergeamos con INITIAL_STATE para los campos viejos que falten rellenar con sus defauts
    setData({ ...INITIAL_STATE, ...item, price: String(item.price||''), stock: String(item.stock||'') });
    setEditingId(item.id);
    setActiveTab('Comercial');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (confirm(`¿Estás sumamente seguro de querer borrar: ${name}?`)) {
      try { await deleteDoc(doc(db, 'products', id)); } catch(e) { console.error(e); }
    }
  };

  const handleJsonImport = async () => {
    try {
      const parsed = JSON.parse(jsonInput);

      // MODO BULK LOAD: Array de Plantas Detectado
      if (Array.isArray(parsed)) {
        if (!confirm(`Detecté ${parsed.length} plantas empaquetadas. ¿Subirlas ciegamente como marcadores?`)) return;
        setUploading(true);
        const batchPromises = parsed.map(item => {
          let payload = { ...INITIAL_STATE, ...item };
          payload.price = parseFloat(payload.price) || 0;
          payload.stock = parseInt(payload.stock) || 0;
          payload.category = (payload.mainCategory || payload.category || 'Interior').toLowerCase().trim();
          payload.image = payload.image || PLACEHOLDER_IMAGE;
          payload.createdAt = new Date().toISOString();
          return addDoc(collection(db, "products"), payload);
        });

        await Promise.all(batchPromises);
        setSuccess(`¡Operación Bulk Exitosa! Se insertaron ${parsed.length} productos sin foto real.`);
        setJsonInput('');
        setUploading(false);
        setActiveTab('📦 Inventario');
      } 
      // MODO SINGLE AUTO-FILL: Objeto Detectado
      else {
        setData(prev => ({ ...prev, ...parsed }));
        setSuccess('¡Placa actual rellenada! Navega a las pestañas y súbele la foto para guardar.');
      }
    } catch(err: any) {
      console.error(err);
      alert(`Ocurrió un error. Si es de comillas, revisa tu texto. Si es de Firebase: ${err.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name || !data.price || !data.stock) {
      return alert("Completa los campos principales.");
    }
    // Requiere foto si estamomos en modo nuevo y no tenemos una temporal
    if (!editingId && !imageFile && !data.image) {
      return alert("Sube una foto obligatoria para una creación manual.");
    }

    setUploading(true);
    setSuccess('');

    try {
      let imageUrl = data.image || PLACEHOLDER_IMAGE;
      
      // Si se subió un archivo físico, usamos Firebase Storage para reemplazar URL
      if (imageFile) {
        const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const payload = {
        ...data,
        price: parseFloat(data.price),
        stock: parseInt(data.stock, 10),
        category: (data.mainCategory || data.category || 'Interior').toLowerCase().trim(),
        image: imageUrl
      };

      if (editingId) {
        // Ejecucio de edición (Update Firestore)
        await updateDoc(doc(db, "products", editingId), payload);
        setSuccess('¡Planta actualizada hermosamente en el mercado!');
      } else {
        // Ejecución de creación (Create Firestore)
        payload.createdAt = new Date().toISOString();
        await addDoc(collection(db, "products"), payload);
        setSuccess('¡Nueva planta insertada estructuralmente en la base de datos!');
      }

      setEditingId(null);
      setData(INITIAL_STATE);
      setImageFile(null);
      setActiveTab('📦 Inventario'); // Llevamos de nuevo al control maestro
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error(error);
      alert('Error guardando en los servidores de Google.');
    } finally {
      setUploading(false);
    }
  };


  // Helpers de UI Components...
  const Input = ({ label, field, type="text", placeholder="" }: any) => (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2">{label}</label>
      <input type={type} step={type==='number'?'any':undefined}
        value={(data as any)[field]} onChange={e => handleChange(field, e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-black/10 focus:ring-2 focus:ring-primary-500 font-medium"
        placeholder={placeholder} />
    </div>
  );

  const Select = ({ label, field, options }: any) => (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2">{label}</label>
      <select value={(data as any)[field]} onChange={e => handleChange(field, e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-black/10 focus:ring-2 focus:ring-primary-500 font-medium">
        <option value="">-- No especificado --</option>
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );

  const Check = ({ label, field }: any) => (
    <label className="flex items-center gap-3 p-4 rounded-xl border border-black/10 bg-white/30 dark:bg-black/10 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
      <input type="checkbox" checked={(data as any)[field]} onChange={e => handleChange(field, e.target.checked)}
        className="w-5 h-5 text-primary-600 rounded bg-white dark:bg-black/50 border-black/20" />
      <span className="font-medium text-sm">{label}</span>
    </label>
  );

  return (
    <main className="min-h-screen bg-black/5 dark:bg-white/5">
      <Navbar />
      
      <div className="pt-32 pb-20 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">
              {editingId ? "Editando Producto: " + data.name : "Panel Maestro Botánico"}
            </h1>
            <p className="text-foreground/60 max-w-2xl">Gestor de Stock, Arrays JSON, y Sistema Biológico V1.0.</p>
          </div>
          {editingId && (
            <button onClick={cancelEditMode} className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 rounded-xl font-bold flex items-center gap-2 text-sm shadow">
               Cancelar Modo Edición
            </button>
          )}
        </div>

        {success && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-3 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 font-medium border border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-top-4">
            <CheckCircle className="w-5 h-5" /> {success}
          </div>
        )}

        <div className="glass rounded-3xl overflow-hidden border border-white/20 dark:border-white/5 shadow-2xl dark:glass-dark flex flex-col md:flex-row min-h-[70vh]">
          
          {/* TABS SIDEBAR */}
          <div className="w-full md:w-64 bg-black/5 dark:bg-white/5 border-r border-black/5 dark:border-white/5 p-4 flex flex-row overflow-x-auto md:flex-col gap-2">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                  activeTab === tab ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'hover:bg-black/10 dark:hover:bg-white/10 text-foreground/70'
                }`}>
                {tab}
                {activeTab === tab && <ChevronRight className="w-4 h-4 hidden md:block" />}
              </button>
            ))}
          </div>

          {/* FORM CONTENT */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto">
            <form onSubmit={activeTab !== '📋 Batch JSON' && activeTab !== '📦 Inventario' ? handleSubmit : undefined}>
              
              {/* TAB 0: INVENTARIO */}
              <div className={activeTab === '📦 Inventario' ? 'block' : 'hidden'}>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary-600 dark:text-primary-400">Auditoría del Catálogo VIVO</h2>
                {inventory.length === 0 ? (
                   <p className="text-foreground/50">El inventario general está vacío. Inyecta JSON en Batch o crea una planta.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {inventory.map(item => (
                      <div key={item.id} className="flex items-center gap-4 bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-black/5 dark:border-white/5">
                        <img src={item.image || PLACEHOLDER_IMAGE} className="w-16 h-16 rounded-xl object-cover" />
                        <div className="flex-1">
                          <h3 className="font-bold">{item.name}</h3>
                          <p className="text-xs text-foreground/60">{item.mainCategory} • Stock: {item.stock} • ${item.price}</p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => handleEditItem(item)} className="p-3 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 rounded-xl transition-colors"><Edit3 className="w-4 h-4"/></button>
                          <button type="button" onClick={() => handleDeleteItem(item.id, item.name)} className="p-3 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 rounded-xl transition-colors"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* TAB 1: COMERCIAL */}
              <div className={activeTab === 'Comercial' ? 'block' : 'hidden'}>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary-600 dark:text-primary-400">Datos Comerciales Fundamentales</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Nombre de Venta Público *" field="name" placeholder="Ficus Lyrata" />
                  <Input label="Precio en USD *" field="price" type="number" placeholder="45.00" />
                  <Input label="Unidades en Stock *" field="stock" type="number" placeholder="10" />
                  <Input label="Badge / Etiqueta Promocional" field="badge" placeholder="Ej: Super Oferta" />
                </div>
                <div className="mt-6">
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2">Descripción Comercial</label>
                  <textarea value={data.description} onChange={e => handleChange('description', e.target.value)} rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-black/10 focus:ring-2 focus:ring-primary-500 font-medium"
                    placeholder="Escribe algo atractivo que enamore al cliente..." />
                </div>
                <div className="mt-6">
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2">Fotografía (Archivo local real) {editingId ? "(Opcional si quieres reescribir)" : "*"}</label>
                  {editingId && data.image && !imageFile && (
                    <div className="mb-4">
                      <p className="text-xs text-blue-500 mb-2">Foto temporal alojada actualmente:</p>
                      <img src={data.image} alt="Prev" className="h-24 rounded-xl border border-black/10" />
                    </div>
                  )}
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary-500/30 rounded-2xl cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {imageFile ? (
                        <p className="text-sm font-bold text-primary-600 flex items-center gap-2"><ImageIcon className="w-5 h-5"/> {imageFile.name}</p>
                      ) : (
                        <><Upload className="w-8 h-8 mb-2 text-foreground/40" /><p className="text-sm text-foreground/60">Haz clic para subir foto en HD real</p></>
                      )}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>
              </div>

              {/* TAB 2: IDENTIFICACION */}
              <div className={activeTab === 'Identificación' ? 'block' : 'hidden'}>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary-600 dark:text-primary-400">Taxonomía y Control Interno</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Nombre Científico" field="cientificName" placeholder="Ficus lyrata subsp." />
                  <Input label="Familia Botánica" field="family" placeholder="Moraceae" />
                  <Input label="Variedad / Cultivar" field="cultivar" placeholder="Compacta" />
                  <Input label="Código SKU (Interno)" field="sku" placeholder="FIC-LYR-001" />
                  <Select label="Categoría Principal" field="mainCategory" options={B.CATEGORIAS_PRINCIPALES} />
                  <Select label="Agrupamiento (Sub)" field="subcategory" options={B.SUBCATEGORIAS} />
                </div>
              </div>

              {/* TAB 3: AMBIENTAL */}
              <div className={activeTab === 'Ambiental' ? 'block' : 'hidden'}>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary-600 dark:text-primary-400">Requerimientos RHS</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Select label="Exposición Lumínica" field="luz" options={B.LUZ_EXPOSICION} />
                  <Input label="Horas de Sol Mínimas (Num)" field="horasSol" type="number" />
                  
                  <Select label="Necesidad Hídrica" field="agua" options={B.NECESIDAD_HIDRICA} />
                  <Select label="Humedad Ambiental" field="humedad" options={B.HUMEDAD_AMBIENTAL} />
                  
                  <Select label="Tipo de Sustrato/Suelo" field="suelo" options={B.TIPO_SUELO} />
                  <Select label="Rango de pH" field="phNivel" options={B.PH_SUSTRATO} />
                  
                  <Select label="Esquema de Drenaje" field="drenaje" options={B.DRENAJE} />
                  <Input label="Temp. Mínima Registrada (°C)" field="tempMin" type="number" />
                  <Input label="Temp. Máxima Tolerada (°C)" field="tempMax" type="number" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Check label="Tolera Sol Fuerte Directo" field="toleraSolFuerte" />
                  <Check label="Tolera Sombra Densa" field="toleraSombra" />
                  <Check label="Resiste Heladas" field="toleraHeladas" />
                  <Check label="Soporta Calor Extremo" field="toleraCalor" />
                </div>
              </div>

              {/* TAB 4: MORFOLOGIA */}
              <div className={activeTab === 'Morfología' ? 'block' : 'hidden'}>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary-600 dark:text-primary-400">Arquitectura de Crecimiento</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select label="Hábito de Desarrollo" field="habito" options={B.HABITO_CRECIMIENTO} />
                  <Select label="Velocidad Expansiva" field="velCrecimiento" options={B.VELOCIDAD_CRECIMIENTO} />
                  <Input label="Altura Max Adulta (mts)" field="alturaMax" type="number" step="0.1" />
                  <Input label="Ancho Max Adulto (mts)" field="anchoMax" type="number" step="0.1" />
                  <Select label="Sistema Radicular" field="tipoRaiz" options={B.TIPO_RAIZ} />
                </div>
              </div>

              {/* TAB 5: ORNAMENTAL */}
              <div className={activeTab === 'Ornamental' ? 'block' : 'hidden'}>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary-600 dark:text-primary-400">Estética Folicular y Floral</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Select label="Tipo de Follaje" field="tipoFollaje" options={B.TIPO_FOLLAJE} />
                  <Select label="Color Dominante Follaje" field="colorFollaje" options={B.COLOR_FOLLAJE} />
                  <Select label="Textura Folicular" field="texturaFollaje" options={B.TEXTURA_FOLLAJE} />
                  
                  <Select label="Época de Floración" field="epocaFloracion" options={B.EPOCA_FLORACION} />
                  <Select label="Color de Pétalos" field="colorFlor" options={B.COLOR_FLOR} />
                  <Select label="Perfil de Aromas" field="fragancia" options={B.FRAGANCIA} />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <Check label="Es una especie de Floración Activa" field="floracion" />
                </div>
              </div>

              {/* TAB 6: ECOLOGIA */}
              <div className={activeTab === 'Ecología' ? 'block' : 'hidden'}>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary-600 dark:text-primary-400">Impacto Paisajístico y Bioseguridad</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Select label="Uso Paisajístico Principal" field="usoPrincipal" options={B.USO_PRINCIPAL} />
                  <Select label="Nivel de Mantenimiento" field="mantenimiento" options={B.MANTENIMIENTO} />
                  <Select label="Frecuencia Poda" field="requierePoda" options={B.REQUIERE_PODA} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Check label="Ideal para Principiantes" field="principiante" />
                  <Check label="Atrae Polinizadores (Biota)" field="atraePolinizadores" />
                  <Check label="Especie Nativa / Endémica" field="nativa" />
                  <Check label="Tóxica para Perros/Gatos" field="toxicaMascotas" />
                  <Check label="Tóxica para Humanos (Ingesta)" field="toxicaHumanos" />
                  <Check label="Posee Espinas o Peligros" field="espinas" />
                </div>
              </div>

              {/* TAB 7: JSON BATCH IMPORT */}
              <div className={activeTab === '📋 Batch JSON' ? 'block' : 'hidden'}>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary-600 dark:text-primary-400">Inyector Robótico Lote/Bulk</h2>
                <div className="mb-4 text-sm text-foreground/70 bg-primary-100 dark:bg-primary-900/30 p-4 rounded-xl border border-primary-200">
                  <p><b>1. Completar 1 planta:</b> Pega código que empieza y abre con llaves <code>&#123; "name"...&#125;</code> para rellenar solapadamente tu edición actual.</p>
                  <p className="mt-2"><b>2. Carga en Masa (Múltiples):</b> Pega un Arreglo <code>[ &#123;...&#125;, &#123;...&#125; ]</code>. El sistema las insertará <b>todas</b> y sin foto directa a la BBDD silenciando el formulario.</p>
                </div>
                <textarea 
                  rows={20}
                  value={jsonInput}
                  onChange={e => setJsonInput(e.target.value)}
                  className="w-full font-mono text-xs px-4 py-3 rounded-xl bg-black/5 dark:bg-black/50 border border-black/20 focus:ring-2 focus:ring-primary-500"
                  placeholder='[ { "name": "Planta 1" }, { "name": "Planta 2" } ]'
                />
                <button 
                  type="button" 
                  disabled={uploading}
                  onClick={handleJsonImport}
                  className="mt-4 w-full md:w-auto px-8 py-4 rounded-xl flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black font-bold transition-all shadow-lg hover:shadow-primary-500/20 disabled:opacity-50"
                >
                  {uploading ? "Procesando Batch Masivo..." : "Ejecutar Motor JSON"}
                </button>
              </div>
              
              {activeTab !== '📋 Batch JSON' && activeTab !== '📦 Inventario' && (
                <div className="mt-8 pt-8 border-t border-black/10 dark:border-white/10 flex flex-col md:flex-row gap-4 items-center">
                  <p className="text-sm text-foreground/50 flex-1">Los datos se guardarán cruzados contra el código `{editingId || "NUEVO"}`.</p>
                  <button 
                    type="submit" disabled={uploading}
                    className="w-full md:w-auto px-8 py-4 rounded-xl flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold transition-all shadow-lg hover:shadow-primary-500/20 disabled:opacity-50"
                  >
                    {uploading ? 'Inyectando en BD...' : <><Save className="w-5 h-5" /> {editingId ? "Actualizar/Sobrescribir Ficha" : "Insertar Nueva Ficha"}</>}
                  </button>
                </div>
              )}

            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
