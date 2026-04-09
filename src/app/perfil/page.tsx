'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Heart, Package, Lock, Camera, Save, LogOut,
  Leaf, MapPin, Edit3, CheckCircle,
  ChevronRight, Star, AlertTriangle, ArrowRight
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { saveUserProfile, uploadAvatar, UserProfile, EMPTY_PROFILE } from '@/lib/userProfile';
import { getBookingsByUser } from '@/lib/workshops';

// ---------- Tipos ----------
const TABS = [
  { id: 'datos',     icon: User,     label: 'Mis Datos' },
  { id: 'favoritas', icon: Heart,    label: 'Mis Favoritas' },
  { id: 'pedidos',   icon: Package,  label: 'Mis Pedidos' },
  { id: 'talleres',  icon: Calendar, label: 'Mis Workshops' },
  { id: 'cuenta',    icon: Lock,     label: 'Mi Cuenta' },
];

const PROVINCIAS_AR = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
];



// ---------- Componentes auxiliares ----------
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-display font-bold mb-6 text-primary-700 dark:text-primary-400 flex items-center gap-2">
      {children}
    </h2>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">
      {children}
    </label>
  );
}

function InputField({ label, value, onChange, placeholder = '', type = 'text', disabled = false }: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-black/20 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}

// ---------- Página Principal ----------
export default function PerfilPage() {
  const { user, userProfile, loading, refreshProfile, logout, isAdmin } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('datos');
  const [formData, setFormData] = useState<UserProfile>(EMPTY_PROFILE);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Redirigir si no está logueado
  useEffect(() => {
    if (mounted && !loading && !user) router.push('/login');
  }, [mounted, loading, user, router]);

  // Pre-llenar formulario con perfil de Firestore
  useEffect(() => {
    if (userProfile) {
      setFormData(userProfile);
      setAvatarPreview(userProfile.avatarUrl || '');
    }
  }, [userProfile]);

  // Cargar bookings cuando cambia el tab a talleres
  useEffect(() => {
    if (activeTab === 'talleres' && user) {
      setLoadingBookings(true);
      getBookingsByUser(user.uid)
        .then(setMyBookings)
        .catch(console.error)
        .finally(() => setLoadingBookings(false));
    }
  }, [activeTab, user]);

  if (!mounted || loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Leaf className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  const field = (key: keyof UserProfile) => ({
    value: formData[key] as string,
    onChange: (v: string) => setFormData(prev => ({ ...prev, [key]: v })),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    try {
      let avatarUrl = formData.avatarUrl;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(user.uid, avatarFile);
        setAvatarFile(null);
      }
      await saveUserProfile(user.uid, { ...formData, avatarUrl });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const displayName = formData.displayName || user.email?.split('@')[0] || 'Usuario';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50/40 via-background to-background dark:from-primary-950/20">
      <Navbar />

      {/* Hero del perfil */}
      <div className="pt-24 pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 to-primary-800 p-8 md:p-12 mb-0 shadow-2xl shadow-primary-500/20">
            {/* Decoración de fondo */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-white rounded-full translate-y-1/2" />
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-28 h-28 rounded-3xl overflow-hidden ring-4 ring-white/30 shadow-2xl bg-primary-700 flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-display font-bold text-white">{initials}</span>
                  )}
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-9 h-9 bg-white text-primary-700 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              {/* Info */}
              <div className="text-white text-center sm:text-left">
                <p className="text-primary-200 text-sm font-medium uppercase tracking-widest mb-1">
                  {isAdmin ? '🌟 Administrador' : '🌿 Miembro Botánico'}
                </p>
                <h1 className="text-3xl md:text-4xl font-display font-bold">{displayName}</h1>
                <p className="text-primary-200 mt-1">{user.email}</p>
              </div>

              {/* Stats rápidas */}
              <div className="sm:ml-auto flex gap-4">
                <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3">
                  <p className="text-2xl font-bold text-white">{favorites.length}</p>
                  <p className="text-primary-200 text-xs font-medium">Favoritas</p>
                </div>
                <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3">
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="text-primary-200 text-xs font-medium">Pedidos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido con tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar de tabs */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="glass dark:glass-dark rounded-3xl p-3 border border-black/5 dark:border-white/5 shadow-xl">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-medium text-sm transition-all mb-1 last:mb-0 ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                        : 'text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{tab.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </button>
                );
              })}

              {/* Acceso rápido Admin */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-medium text-sm text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all mt-2 border border-amber-200/50 dark:border-amber-800/30"
                >
                  <Star className="w-5 h-5 flex-shrink-0" />
                  <span>Panel Admin</span>
                </Link>
              )}
            </div>
          </aside>

          {/* Panel de contenido */}
          <section className="flex-1 glass dark:glass-dark rounded-3xl border border-black/5 dark:border-white/5 shadow-xl overflow-hidden">

            {/* ── TAB: MIS DATOS ── */}
            {activeTab === 'datos' && (
              <div className="p-6 md:p-8">
                <SectionTitle><Edit3 className="w-5 h-5" /> Mis Datos Personales</SectionTitle>

                {saved && (
                  <div className="mb-6 flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
                    <CheckCircle className="w-4 h-4" /> ¡Perfil actualizado correctamente!
                  </div>
                )}

                <div className="space-y-6">
                  {/* Identidad */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-4 border-b border-black/5 dark:border-white/5 pb-2">
                      Identidad
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField label="Nombre para mostrar" placeholder="Ana García" {...field('displayName')} />
                      <InputField label="Teléfono / WhatsApp" placeholder="+54 9 11 1234-5678" {...field('phone')} />
                    </div>
                    <div className="mt-4">
                      <FieldLabel>Bio (sobre vos)</FieldLabel>
                      <textarea
                        rows={3}
                        value={formData.bio}
                        onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Amante de las plantas, balcón siempre verde..."
                        className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-black/20 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Dirección de envío */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-4 border-b border-black/5 dark:border-white/5 pb-2 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" /> Dirección de Envío
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <FieldLabel>Provincia</FieldLabel>
                        <select
                          value={formData.province}
                          onChange={e => setFormData(prev => ({ ...prev, province: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-black/20 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        >
                          <option value="">— Seleccioná tu provincia —</option>
                          {PROVINCIAS_AR.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                      <InputField label="Ciudad / Localidad" placeholder="Buenos Aires" {...field('city')} />
                      <InputField label="Dirección (calle y número)" placeholder="Av. Corrientes 1234" {...field('address')} />
                      <InputField label="Código Postal" placeholder="1414" {...field('postalCode')} />
                    </div>
                  </div>
                </div>

                {/* Botón guardar */}
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-3.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/20 transition-all hover:shadow-primary-500/30 hover:scale-[1.02]"
                  >
                    {saving ? (
                      <><Leaf className="w-5 h-5 animate-spin" /> Guardando...</>
                    ) : (
                      <><Save className="w-5 h-5" /> Guardar Cambios</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB: MIS FAVORITAS ── */}
            {activeTab === 'favoritas' && (
              <div className="p-6 md:p-8">
                <SectionTitle><Heart className="w-5 h-5" /> Mis Plantas Favoritas</SectionTitle>

                {favorites.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-3xl flex items-center justify-center mb-4">
                      <Heart className="w-10 h-10 text-primary-300" />
                    </div>
                    <h3 className="text-xl font-display font-bold mb-2">Todavía no tenés favoritas</h3>
                    <p className="text-foreground/60 max-w-sm mb-6">
                      Guardá las plantas que te gustan desde el catálogo tocando el ❤️ en cada tarjeta.
                    </p>
                    <Link
                      href="/#catalogo"
                      className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20"
                    >
                      <Leaf className="w-4 h-4" /> Explorar Catálogo
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {favorites.map(fav => (
                      <div
                        key={fav.productId}
                        className="group relative rounded-2xl overflow-hidden border border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/20 hover:shadow-xl transition-all hover:-translate-y-0.5"
                      >
                        <Link href={`/producto/${fav.productId}`}>
                          <div className="aspect-square overflow-hidden bg-black/5">
                            <img
                              src={fav.image || 'https://images.unsplash.com/photo-1416879598553-380108ff4bca?q=80&w=400'}
                              alt={fav.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <div className="p-3">
                            <p className="font-semibold text-sm truncate">{fav.name}</p>
                            <p className="text-primary-600 dark:text-primary-400 font-bold text-sm">
                              ${Number(fav.price).toFixed(2)}
                            </p>
                          </div>
                        </Link>
                        {/* Quitar de favoritos */}
                        <button
                          onClick={() => toggleFavorite({ id: fav.productId, ...fav })}
                          className="absolute top-2 right-2 w-8 h-8 bg-white/90 dark:bg-black/70 backdrop-blur-sm rounded-xl flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 shadow transition-colors"
                          title="Quitar de favoritas"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: MIS PEDIDOS ── */}
            {activeTab === 'pedidos' && (
              <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-3xl flex items-center justify-center mb-5">
                  <Package className="w-10 h-10 text-primary-500" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">Tu historial de pedidos</h3>
                <p className="text-foreground/50 max-w-xs mb-6 text-sm">
                  Seguí el estado de todos tus pedidos en tiempo real, con línea de
                  tiempo y opción de consultar por WhatsApp.
                </p>
                <Link
                  href="/mis-pedidos"
                  className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-primary-500/20"
                >
                  Ver mis pedidos <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}


            {/* ── TAB: MIS WORKSHOPS ── */}
            {activeTab === 'talleres' && (
              <div className="p-6 md:p-8">
                <SectionTitle><Calendar className="w-5 h-5" /> Mis Workshops</SectionTitle>
                
                {loadingBookings ? (
                  <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <Calendar className="w-12 h-12 text-foreground/10 mb-2" />
                    <p className="text-sm text-foreground/30">Cargando tus lugares...</p>
                  </div>
                ) : myBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-3xl flex items-center justify-center mb-4 text-primary-300">
                      <Calendar className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-display font-bold mb-2">Aún no te inscribiste en ningún taller</h3>
                    <p className="text-foreground/60 max-w-sm mb-6">
                      Aprendé cosas nuevas, conocé gente y conectá con la naturaleza en nuestras experiencias presenciales y online.
                    </p>
                    <Link
                      href="/talleres"
                      className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" /> Ver Agenda de Talleres
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myBookings.map(b => (
                      <div key={b.id} className="bg-white/50 dark:bg-black/20 rounded-2xl p-5 border border-black/5 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight ${
                              b.status === 'confirmado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700 font-bold'
                            }`}>
                              {b.status === 'confirmado' ? 'Inscrito' : 'Pendiente de Pago'}
                            </span>
                            <span className="text-[10px] text-foreground/40 font-bold">
                              {new Date(b.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-bold text-lg leading-tight mb-1">{b.workshopTitle}</h4>
                          <p className="text-xs text-foreground/60 flex items-center gap-1 mb-4">
                            <Calendar className="w-3 h-3" /> {new Date(b.workshopDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                          </p>
                        </div>
                        
                        <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                          <p className="text-xs font-bold">{b.slots} lugar(es)</p>
                          <Link 
                            href={`/talleres/${b.workshopId}`}
                            className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                          >
                            Ver detalle <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: MI CUENTA ── */}
            {activeTab === 'cuenta' && (
              <div className="p-6 md:p-8">
                <SectionTitle><Lock className="w-5 h-5" /> Mi Cuenta</SectionTitle>

                <div className="space-y-4 mb-8">
                  <InputField label="Correo Electrónico" value={user.email || ''} disabled />
                  <InputField
                    label="Cuenta creada"
                    value={userProfile?.createdAt
                      ? new Date(userProfile.createdAt).toLocaleDateString('es-AR', { dateStyle: 'long' })
                      : 'Desconocida'}
                    disabled
                  />
                  <InputField
                    label="Tipo de cuenta"
                    value={isAdmin ? 'Administrador del vivero' : 'Miembro botánico'}
                    disabled
                  />
                </div>

                {/* Cerrar sesión */}
                <div className="mb-4">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-6 py-3 bg-foreground/5 hover:bg-foreground/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-2xl font-medium transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Cerrar sesión
                  </button>
                </div>

                {/* Zona de peligro */}
                <div className="mt-8 p-5 rounded-2xl border border-red-200 dark:border-red-800/30 bg-red-50/50 dark:bg-red-900/10">
                  <div className="flex items-center gap-2 mb-3 text-red-600 dark:text-red-400 font-bold">
                    <AlertTriangle className="w-5 h-5" />
                    Zona de peligro
                  </div>
                  <p className="text-sm text-foreground/60 mb-4">
                    Eliminar tu cuenta es una acción permanente. Se borrarán todos tus datos, favoritas y
                    historial de pedidos. Esta acción no se puede deshacer.
                  </p>
                  <button className="text-sm font-bold text-red-600 dark:text-red-400 hover:underline">
                    Eliminar mi cuenta permanentemente
                  </button>
                </div>
              </div>
            )}

          </section>
        </div>
      </div>
    </main>
  );
}
