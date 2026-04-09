'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Upload, Plus, Save, Image as ImageIcon, CheckCircle, ChevronRight, Edit3, Trash2, Package, User, MapPin, MessageCircle, ChevronDown, BookOpen } from 'lucide-react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as B from '@/types/botanical';
import { subscribeToAllOrders, updateOrderStatus, Order, OrderStatus, STATUS_LABELS, STATUS_COLORS } from '@/lib/orders';

const TABS = ['📬 Pedidos', '🗓️ Talleres', '📝 Artículos', '📦 Inventario', 'Comercial', 'Identificación', 'Ambiental', 'Morfología', 'Ornamental', 'Ecología', '📋 Batch JSON'];

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

const INITIAL_WORKSHOP_STATE = {
  title: '', description: '', image: '', date: '', duration: '',
  price: '', capacity: '', instructor: '', type: 'presencial',
  address: '', platform: '', meetingLink: '', requirements: ''
};

const INITIAL_POST_STATE = {
  title: '', excerpt: '', coverImage: '', category: 'Guías Pro',
  tags: '', status: 'draft', blocks: [] as any[]
};

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000";

export default function AdminPage() {
  const { user, isAdmin, loading, userProfile } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  
  const [inventory, setInventory] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const [data, setData] = useState(INITIAL_STATE);
  const [workshopData, setWorkshopData] = useState(INITIAL_WORKSHOP_STATE);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [selectedWorkshopBookings, setSelectedWorkshopBookings] = useState<any[]>([]);
  const [viewingWorkshopId, setViewingWorkshopId] = useState<string | null>(null);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  
  const [posts, setPosts] = useState<any[]>([]);
  const [blogData, setBlogData] = useState(INITIAL_POST_STATE);
  
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

  // Listener de Pedidos en tiempo real
  useEffect(() => {
    if (!isAdmin) return;
    const unsub = subscribeToAllOrders(setOrders);
    return () => unsub();
  }, [isAdmin]);

  // Listener de Talleres
  useEffect(() => {
    if (isAdmin) {
      const q = query(collection(db, 'workshops'), orderBy('date', 'asc'));
      const unsub = onSnapshot(q, snap => {
        setWorkshops(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsub();
    }
  }, [isAdmin]);

  // Listener de Inscriptos (cuando se selecciona un taller para ver)
  useEffect(() => {
    if (isAdmin && viewingWorkshopId) {
      const q = query(
        collection(db, 'workshop_bookings'),
        where('workshopId', '==', viewingWorkshopId),
        orderBy('createdAt', 'desc')
      );
      const unsub = onSnapshot(q, snap => {
        setSelectedWorkshopBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsub();
    } else {
      setSelectedWorkshopBookings([]);
    }
  }, [isAdmin, viewingWorkshopId]);

  // Listener de Blog (Artículos)
  useEffect(() => {
    if (isAdmin) {
      const q = query(collection(db, 'blog_posts'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, snap => {
        setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsub();
    }
  }, [isAdmin]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const pendingCount = orders.filter(o => o.status === 'pendiente').length;

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

  const handleWorkshopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workshopData.title || !workshopData.price || !workshopData.date) {
      return alert("Completa título, fecha y precio.");
    }

    setUploading(true);
    setSuccess('');

    try {
      let imageUrl = workshopData.image || PLACEHOLDER_IMAGE;
      if (imageFile) {
        const storageRef = ref(storage, `workshops/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const payload = {
        ...workshopData,
        price: parseFloat(workshopData.price),
        capacity: parseInt(workshopData.capacity, 10),
        occupiedSpots: workshopData.id ? (workshops.find(w => w.id === workshopData.id)?.occupiedSpots || 0) : 0,
        image: imageUrl,
        updatedAt: new Date().toISOString()
      };

      if (workshopData.id) {
        const { id, ...updateData } = payload;
        await updateDoc(doc(db, "workshops", id), updateData);
        setSuccess('¡Taller actualizado exitosamente!');
      } else {
        (payload as any).createdAt = new Date().toISOString();
        await addDoc(collection(db, "workshops"), payload);
        setSuccess('¡Nuevo taller creado!');
      }

      setWorkshopData(INITIAL_WORKSHOP_STATE);
      setImageFile(null);
      setEditingId(null);
    } catch (e) {
      console.error(e);
      alert('Error al guardar el taller.');
    } finally {
      setUploading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'workshop_bookings', bookingId), { status });
      setSuccess('Estado de inscripción actualizado.');
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogData.title || !blogData.excerpt) {
      return alert("El título y el resumen son obligatorios.");
    }

    setUploading(true);
    setSuccess('');

    try {
      // Importar helpers de blog dinámicamente o por nombre
      // Para evitar problemas de importación, usaré la lógica directa aquí
      const generateSlug = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();
      const calculateReadingTime = (blocks: any[]) => {
        const text = blocks.filter(b => ['p', 'h2', 'h3'].includes(b.type)).map(b => b.content).join(' ');
        return Math.max(1, Math.ceil(text.split(/\s+/).length / 200));
      };

      let coverUrl = blogData.coverImage || PLACEHOLDER_IMAGE;
      if (imageFile) {
        const storageRef = ref(storage, `blog/${Date.now()}_cover`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        coverUrl = await getDownloadURL(snapshot.ref);
      }

      const payload = {
        ...blogData,
        coverImage: coverUrl,
        slug: generateSlug(blogData.title),
        readingTime: calculateReadingTime(blogData.blocks),
        tags: (blogData.tags as string).split(',').map(t => t.trim()).filter(t => t),
        author: userProfile?.displayName || user?.email?.split('@')[0] || 'Admin',
        authorId: user?.uid || '',
        updatedAt: new Date().toISOString()
      };

      if ((blogData as any).id) {
        const { id, ...updateData } = payload as any;
        await updateDoc(doc(db, 'blog_posts', id), updateData);
        setSuccess('¡Artículo actualizado!');
      } else {
        (payload as any).createdAt = new Date().toISOString();
        await addDoc(collection(db, 'blog_posts'), payload);
        setSuccess('¡Artículo publicado!');
      }

      setBlogData(INITIAL_POST_STATE);
      setImageFile(null);
      setEditingId(null);
    } catch (e) {
      console.error(e);
      alert('Error al guardar el artículo.');
    } finally {
      setUploading(false);
    }
  };

  const addBlock = (type: any) => {
    const newBlock = { id: Math.random().toString(36).substr(2, 9), type, content: '' };
    setBlogData(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
  };

  const updateBlock = (id: string, content: string) => {
    setBlogData(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === id ? { ...b, content } : b)
    }));
  };

  const removeBlock = (id: string) => {
    setBlogData(prev => ({
      ...prev,
      blocks: prev.blocks.filter(b => b.id !== id)
    }));
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
                <span className="flex items-center gap-2">
                  {tab}
                  {tab === '📬 Pedidos' && pendingCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </span>
                {activeTab === tab && <ChevronRight className="w-4 h-4 hidden md:block" />}
              </button>
            ))}
          </div>

          {/* FORM CONTENT */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto">

            {/* TAB: PEDIDOS */}
            {activeTab === '📬 Pedidos' && (
              <div>
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-primary-600 dark:text-primary-400">
                  <Package className="w-5 h-5" /> Gestión de Pedidos
                </h2>
                <p className="text-sm text-foreground/50 mb-6">
                  {orders.length} pedido{orders.length !== 1 ? 's' : ''} en total · {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
                </p>

                {orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-foreground/40">
                    <Package className="w-12 h-12 mb-3" />
                    <p className="font-medium">No hay pedidos todavía</p>
                    <p className="text-sm mt-1">Aparecerán aquí en tiempo real cuando los clientes compren.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => {
                      const shortId = order.id?.slice(-6).toUpperCase() ?? '------';
                      const date = new Date(order.createdAt).toLocaleDateString('es-AR', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      });
                      const isUpdating = updatingOrderId === order.id;

                      return (
                        <div key={order.id} className="bg-white/60 dark:bg-black/20 rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden">
                          {/* Header */}
                          <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                            <div className="flex items-center gap-3">
                              <div className="text-xl font-black font-display text-primary-600 dark:text-primary-400">#{shortId}</div>
                              <div>
                                <p className="text-xs text-foreground/50">{date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                                {STATUS_LABELS[order.status]}
                              </span>
                              {/* Selector de estado */}
                              <div className="relative">
                                <select
                                  value={order.status}
                                  disabled={isUpdating}
                                  onChange={e => handleStatusChange(order.id!, e.target.value as OrderStatus)}
                                  className="pl-3 pr-8 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-primary-500 outline-none transition-all appearance-none disabled:opacity-50 cursor-pointer"
                                >
                                  {(Object.keys(STATUS_LABELS) as OrderStatus[]).map(s => (
                                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                  ))}
                                </select>
                                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/40" />
                              </div>
                            </div>
                          </div>

                          {/* Cuerpo */}
                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {/* Cliente */}
                            <div className="flex items-start gap-2">
                              <User className="w-4 h-4 text-foreground/40 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-bold">{order.userName}</p>
                                <p className="text-foreground/50 text-xs">{order.userEmail}</p>
                                {order.userPhone && <p className="text-foreground/50 text-xs">{order.userPhone}</p>}
                              </div>
                            </div>

                            {/* Entrega */}
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-foreground/40 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-bold">{order.deliveryType === 'retiro' ? 'Retiro en vivero' : 'Envío a domicilio'}</p>
                                <p className="text-foreground/50 text-xs">{order.address}</p>
                              </div>
                            </div>

                            {/* Productos */}
                            <div className="md:col-span-2">
                              <p className="text-xs font-bold uppercase tracking-wider text-foreground/40 mb-2">Productos</p>
                              <div className="flex flex-wrap gap-2">
                                {order.items.map((item, i) => (
                                  <div key={i} className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 rounded-xl px-2.5 py-1.5">
                                    <img src={item.image} alt={item.name} className="w-6 h-6 rounded-lg object-cover" />
                                    <span className="text-xs font-medium">{item.name} × {item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Footer de la card */}
                            <div className="md:col-span-2 flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                              <div>
                                <p className="text-xs text-foreground/40">Total</p>
                                <p className="font-black text-lg text-primary-600 dark:text-primary-400">${order.total.toLocaleString('es-AR')}</p>
                              </div>
                              <div className="flex gap-2">
                                {order.notes && (
                                  <span className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-lg border border-amber-200/50">
                                    📝 {order.notes}
                                  </span>
                                )}
                                <a
                                  href={`https://wa.me/${order.userPhone?.replace(/\D/g,'') || ''}?text=${encodeURIComponent(`Hola ${order.userName}! Tu pedido #${shortId} del Vivero Libertad `)}`}
                                  target="_blank" rel="noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl transition-colors"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" /> Contactar
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
            {/* TAB: TALLERES */}
            {activeTab === '🗓️ Talleres' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Formulario de Taller */}
                  <div className="flex-1 space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-primary-600 dark:text-primary-400">
                      {workshopData.id ? 'Editando Taller' : 'Crear Nuevo Taller'}
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2">Título del Taller *</label>
                        <input type="text" value={workshopData.title} onChange={e => setWorkshopData({...workshopData, title: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-black/10 focus:ring-2 focus:ring-primary-500" placeholder="Ej: Taller de Suculentas" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2">Instructor *</label>
                        <input type="text" value={workshopData.instructor} onChange={e => setWorkshopData({...workshopData, instructor: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-black/10 focus:ring-2 focus:ring-primary-500" placeholder="Nombre del experto" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2">Precio ($) *</label>
                        <input type="number" value={workshopData.price} onChange={e => setWorkshopData({...workshopData, price: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-black/10 focus:ring-2 focus:ring-primary-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2">Cupo Total *</label>
                        <input type="number" value={workshopData.capacity} onChange={e => setWorkshopData({...workshopData, capacity: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-black/10 focus:ring-2 focus:ring-primary-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2">Fecha y Hora *</label>
                        <input type="datetime-local" value={workshopData.date} onChange={e => setWorkshopData({...workshopData, date: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-black/10 focus:ring-2 focus:ring-primary-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2">Duración</label>
                        <input type="text" value={workshopData.duration} onChange={e => setWorkshopData({...workshopData, duration: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-black/10 focus:ring-2 focus:ring-primary-500" placeholder="Ej: 2 horas" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2">Modalidad</label>
                        <select value={workshopData.type} onChange={e => setWorkshopData({...workshopData, type: e.target.value as any})} className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-black/10 focus:ring-2 focus:ring-primary-500">
                          <option value="presencial">📍 Presencial</option>
                          <option value="online">🎥 Online</option>
                        </select>
                      </div>
                      {workshopData.type === 'presencial' ? (
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2">Dirección</label>
                          <input type="text" value={workshopData.address} onChange={e => setWorkshopData({...workshopData, address: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-black/10 focus:ring-2 focus:ring-primary-500" />
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2">Plataforma (Zoom/Google Meet)</label>
                            <input type="text" value={workshopData.platform} onChange={e => setWorkshopData({...workshopData, platform: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-black/10 focus:ring-2 focus:ring-primary-500" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2">Enlace de la reunión (Solo para inscriptos)</label>
                            <input type="text" value={workshopData.meetingLink} onChange={e => setWorkshopData({...workshopData, meetingLink: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-black/10 focus:ring-2 focus:ring-primary-500" />
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2">Descripción</label>
                      <textarea value={workshopData.description} onChange={e => setWorkshopData({...workshopData, description: e.target.value})} rows={3} className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-black/10 focus:ring-2 focus:ring-primary-500" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2">Requisitos / Materiales</label>
                      <textarea value={workshopData.requirements} onChange={e => setWorkshopData({...workshopData, requirements: e.target.value})} rows={2} className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-black/10 focus:ring-2 focus:ring-primary-500" placeholder="Ej: Traer delantal..." />
                    </div>

                    <div className="flex gap-4">
                      {workshopData.id && (
                        <button type="button" onClick={() => {setWorkshopData(INITIAL_WORKSHOP_STATE); setEditingId(null);}} className="flex-1 py-4 rounded-xl border border-red-500 text-red-500 font-bold">Cancelar</button>
                      )}
                      <button type="button" onClick={handleWorkshopSubmit} disabled={uploading} className="flex-[2] py-4 rounded-xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-500/20">
                        {uploading ? 'Guardando...' : workshopData.id ? 'Actualizar Taller' : 'Crear Taller'}
                      </button>
                    </div>
                  </div>

                  {/* Listado de Talleres */}
                  <div className="flex-1 border-l border-black/5 dark:border-white/5 pl-8">
                    <h3 className="text-lg font-bold mb-6">Talleres Programados</h3>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                      {workshops.map(w => (
                        <div key={w.id} className={`p-4 rounded-2xl border transition-all ${viewingWorkshopId === w.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-black/5 bg-white/50 dark:bg-black/10'}`}>
                          <div className="flex justify-between items-start gap-4 mb-2">
                            <h4 className="font-bold leading-tight">{w.title}</h4>
                            <span className="text-[10px] font-black uppercase px-2 py-1 bg-black/5 dark:bg-white/10 rounded-md">
                              {w.type === 'online' ? '🎥' : '📍'}
                            </span>
                          </div>
                          <p className="text-xs text-foreground/50 mb-3">{new Date(w.date).toLocaleDateString()} • {w.occupiedSpots}/{w.capacity} cupos</p>
                          <div className="flex gap-2">
                            <button onClick={() => setViewingWorkshopId(w.id === viewingWorkshopId ? null : w.id)} className="flex-1 py-2 rounded-lg bg-white dark:bg-black/40 text-xs font-bold border border-black/5">
                              {viewingWorkshopId === w.id ? 'Ocultar Inscriptos' : 'Ver Inscriptos'}
                            </button>
                            <button onClick={() => {setWorkshopData(w); setEditingId(w.id);}} className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sección de Inscriptos (cuando se selecciona uno) */}
                {viewingWorkshopId && (
                  <div className="mt-8 pt-8 border-t border-black/5 animate-in slide-in-from-top-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold">Inscriptos: {workshops.find(w => w.id === viewingWorkshopId)?.title}</h3>
                      <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-4 py-1.5 rounded-full text-xs font-bold">
                        {selectedWorkshopBookings.length} Reservas Totales
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedWorkshopBookings.map(b => (
                        <div key={b.id} className="bg-white/80 dark:bg-black/40 p-5 rounded-2xl border border-black/5 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-bold">{b.userName}</p>
                              <p className="text-[10px] text-foreground/40">{b.userEmail}</p>
                            </div>
                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                              b.status === 'confirmado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {b.status}
                            </span>
                          </div>
                          <p className="text-sm font-medium mb-4">{b.slots} lugar(es) • Total: ${b.totalPrice}</p>
                          <div className="flex gap-2">
                            {b.status === 'pendiente' && (
                              <button onClick={() => updateBookingStatus(b.id, 'confirmado')} className="flex-1 py-2 bg-green-500 text-white text-[10px] font-black rounded-lg">Confirmar Pago</button>
                            )}
                            <a href={`https://wa.me/${b.userPhone?.replace(/\D/g,'')}`} target="_blank" className="p-2 bg-[#25D366] text-white rounded-lg"><MessageCircle className="w-4 h-4" /></a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: ARTICULOS (BLOG) */}
            {activeTab === '📝 Artículos' && (
              <div className="space-y-8">
                <div className="flex flex-col lg:flex-row gap-10">
                  {/* Editor de Post */}
                  <div className="flex-[2] space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold flex items-center gap-2 text-primary-600 dark:text-primary-400">
                        {editingId ? 'Editando Artículo' : 'Nuevo Artículo Editorial'}
                      </h2>
                      {editingId && (
                        <button onClick={() => {setEditingId(null); setBlogData(INITIAL_POST_STATE);}} className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Cancelar Edición
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2">Título del Post *</label>
                        <input type="text" value={blogData.title} onChange={e => setBlogData({...blogData, title: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-black/10 focus:ring-2 focus:ring-primary-500 font-bold text-lg" placeholder="Ej: Cómo cuidar tu Monstera en invierno" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2">Resumen (Excerpt) *</label>
                        <textarea value={blogData.excerpt} onChange={e => setBlogData({...blogData, excerpt: e.target.value})} rows={2} className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-black/10 focus:ring-2 focus:ring-primary-500" placeholder="Breve descripción para el listado..." />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2">Categoría</label>
                        <select value={blogData.category} onChange={e => setBlogData({...blogData, category: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-black/10 focus:ring-2 focus:ring-primary-500">
                          <option value="Guías Pro">📚 Guías Pro</option>
                          <option value="Decoración">🏠 Decoración</option>
                          <option value="Plantas Raras">💎 Plantas Raras</option>
                          <option value="Noticias">🔔 Noticias</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2">Etiquetas (separadas por coma)</label>
                        <input type="text" value={blogData.tags} onChange={e => setBlogData({...blogData, tags: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-black/10 focus:ring-2 focus:ring-primary-500" placeholder="monstera, interior, riego" />
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-2">Imagen de Portada</label>
                      <input type="text" value={blogData.coverImage} onChange={e => setBlogData({...blogData, coverImage: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-black/10 focus:ring-2 focus:ring-primary-500 text-xs mb-2" placeholder="URL de la imagen o subir archivo" />
                      <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-primary-500/30 rounded-2xl cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <div className="flex flex-col items-center justify-center p-4">
                          {imageFile ? <p className="text-xs font-bold text-primary-600">{imageFile.name}</p> : <p className="text-xs text-foreground/60">Subir foto HD</p>}
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>

                    {/* Bloc Editor Interface */}
                    <div className="bg-black/5 dark:bg-white/5 p-6 rounded-[32px] border border-black/5">
                      <h3 className="text-sm font-black uppercase tracking-widest opacity-40 mb-6 font-display">Contenido del Artículo (Bloques)</h3>
                      
                      <div className="space-y-4 mb-8">
                        {blogData.blocks.map((block, index) => (
                          <div key={block.id} className="group relative bg-white dark:bg-black/40 p-4 rounded-2xl border border-black/5 flex items-start gap-4 shadow-sm">
                            <span className="text-[10px] font-black opacity-20 mt-3">{index + 1}</span>
                            <div className="flex-1">
                              {['p', 'h2', 'h3', 'quote', 'ul'].includes(block.type) ? (
                                <textarea 
                                  value={block.content} 
                                  onChange={e => updateBlock(block.id, e.target.value)}
                                  rows={block.type === 'p' ? 3 : 1}
                                  placeholder={block.type === 'p' ? 'Escribe aquí...' : block.type === 'ul' ? 'Uno por línea...' : 'Título...'}
                                  className={`w-full bg-transparent border-none focus:ring-0 p-0 resize-none ${block.type === 'h2' ? 'text-xl font-bold' : block.type === 'h3' ? 'font-bold' : block.type === 'quote' ? 'italic border-l-2 border-primary-500 pl-4 font-display text-lg' : ''}`}
                                />
                              ) : block.type === 'img' ? (
                                <div className="space-y-2">
                                  <input type="text" value={block.content} onChange={e => updateBlock(block.id, e.target.value)} placeholder="URL de la imagen" className="w-full bg-transparent border-none text-xs" />
                                  {block.content && <img src={block.content} className="h-20 rounded-lg shadow-md" alt="" />}
                                </div>
                              ) : block.type === 'product' ? (
                                <div className="space-y-2">
                                  <input type="text" value={block.content} onChange={e => updateBlock(block.id, e.target.value)} placeholder="ID del Producto (p1, p2...)" className="w-full bg-transparent border-none font-bold" />
                                  <p className="text-[10px] opacity-40 uppercase font-black">Se mostrará una tarjeta de compra en la revista.</p>
                                </div>
                              ) : null}
                            </div>
                            <button onClick={() => removeBlock(block.id)} className="p-2 opacity-0 group-hover:opacity-100 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>
                        ))}
                      </div>

                      {/* Add Block Toolbar */}
                      <div className="flex flex-wrap gap-2 p-2 bg-white/50 dark:bg-black/20 rounded-2xl">
                        <button type="button" onClick={() => addBlock('p')} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-black/40 rounded-xl text-[10px] font-black uppercase tracking-widest border border-black/5 hover:scale-105 transition-all shadow-sm">¶ Párrafo</button>
                        <button type="button" onClick={() => addBlock('h2')} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-black/40 rounded-xl text-[10px] font-black uppercase tracking-widest border border-black/5 hover:scale-105 transition-all shadow-sm">H2 Título</button>
                        <button type="button" onClick={() => addBlock('h3')} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-black/40 rounded-xl text-[10px] font-black uppercase tracking-widest border border-black/5 hover:scale-105 transition-all shadow-sm">H3 Sub</button>
                        <button type="button" onClick={() => addBlock('img')} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-black/40 rounded-xl text-[10px] font-black uppercase tracking-widest border border-black/5 hover:scale-105 transition-all shadow-sm">📷 Imagen</button>
                        <button type="button" onClick={() => addBlock('ul')} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-black/40 rounded-xl text-[10px] font-black uppercase tracking-widest border border-black/5 hover:scale-105 transition-all shadow-sm">☰ Lista</button>
                        <button type="button" onClick={() => addBlock('product')} className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-200 hover:scale-105 transition-all shadow-sm">🛒 Producto</button>
                        <button type="button" onClick={() => addBlock('quote')} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-black/40 rounded-xl text-[10px] font-black uppercase tracking-widest border border-black/5 hover:scale-105 transition-all shadow-sm">❝ Cita</button>
                      </div>
                    </div>

                    <div className="flex gap-4 p-6 bg-white dark:bg-black/20 rounded-[32px] border border-black/5 shadow-inner">
                      <div className="flex-1">
                         <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Estado</label>
                         <select value={blogData.status} onChange={e => setBlogData({...blogData, status: e.target.value as any})} className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border-none font-bold text-xs">
                          <option value="draft">📁 Borrador</option>
                          <option value="published">🚀 Publicado</option>
                        </select>
                      </div>
                      <div className="flex-[2] flex flex-col justify-end">
                        <button type="button" onClick={handlePostSubmit} disabled={uploading} className="w-full py-4 rounded-xl bg-primary-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary-500/30 hover:-translate-y-1 transition-all">
                          {uploading ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Publicar Artículo'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Listado de Posts */}
                  <div className="flex-1 border-l border-black/5 dark:border-white/5 pl-10">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                       <BookOpen className="w-5 h-5 text-primary-600" /> Artículos Guardados
                    </h3>
                    <div className="space-y-4 max-h-[1000px] overflow-y-auto pr-4">
                      {posts.length === 0 ? (
                        <p className="text-sm opacity-40 italic">Aún no hay artículos.</p>
                      ) : posts.map(p => (
                        <div key={p.id} className="group bg-white/50 dark:bg-black/20 rounded-2xl p-4 border border-black/5 hover:border-primary-500 hover:shadow-lg transition-all">
                          <div className="flex gap-4">
                            <img src={p.coverImage} className="w-16 h-16 rounded-xl object-cover shadow-sm bg-black/5" alt="" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm leading-tight mb-1 truncate">{p.title}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-primary-50 text-primary-600 dark:bg-primary-900/30 rounded-md">
                                  {p.category}
                                </span>
                                <span className={`text-[9px] font-black uppercase ${p.status === 'published' ? 'text-green-600' : 'text-amber-600'}`}>
                                  {p.status === 'published' ? 'Público' : 'Borrador'}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button onClick={() => {setBlogData({...p, tags: p.tags.join(', ')}); setEditingId(p.id); setActiveTab('📝 Artículos'); window.scrollTo({top: 0, behavior: 'smooth'});}} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"><Edit3 className="w-4 h-4"/></button>
                              <button onClick={() => deleteDoc(doc(db, 'blog_posts', p.id!))} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={activeTab !== '📋 Batch JSON' && activeTab !== '📦 Inventario' && activeTab !== '📬 Pedidos' && activeTab !== '🗓️ Talleres' && activeTab !== '📝 Artículos' ? handleSubmit : undefined}>
              
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
                  <p className="text-sm text-foreground/50 flex-1">Los datos se guardarán cruzados contra el código: {editingId || "NUEVO"}.</p>
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
