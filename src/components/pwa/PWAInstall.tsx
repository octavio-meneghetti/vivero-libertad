'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Download } from 'lucide-react';

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Detectar si ya está instalada (en modo standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // 2. Capturar el evento de instalación de Android/Desktop
    const handler = (e: any) => {
      // Prevenir que el navegador muestre su propio banner automáticamente
      e.preventDefault();
      // Guardar el evento para dispararlo luego
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // 3. Ocultar si se instala exitosamente
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setIsVisible(false);
      setIsInstalled(true);
      console.log('PWA: Instalación completada con éxito.');
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostrar el prompt nativo del navegador
    deferredPrompt.prompt();

    // Esperar a la elección del usuario
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA: Usuario eligió ${outcome}`);

    // Limpiar el evento ya usado
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible || isInstalled) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white transition-all shadow-lg shadow-primary-500/20 active:scale-95 animate-in fade-in slide-in-from-right-4 duration-500"
      aria-label="Instalar aplicación"
    >
      <Smartphone className="w-4 h-4 group-hover:scale-110 transition-transform" />
      <span className="text-[11px] font-black uppercase tracking-tighter">Instalar App</span>
      
      {/* Tooltip discreto */}
      <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Usa Vivero Libertad como una App
      </span>
    </button>
  );
}
