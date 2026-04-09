"use client";

import React, { useEffect, useState } from 'react';
import { X, Maximize2, RotateCw, Box } from 'lucide-react';

interface PlantARViewerProps {
  modelUrl: string;
  posterUrl?: string;
  onClose: () => void;
  productName: string;
}

// Declaración para que TypeScript no se queje del elemento personalizado <model-viewer>
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

export default function PlantARViewer({ modelUrl, posterUrl, onClose, productName }: PlantARViewerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full h-full flex flex-col">
        
        {/* Header con Controles */}
        <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
          <div>
            <h3 className="text-white font-display font-bold text-xl">{productName}</h3>
            <p className="text-white/60 text-xs flex items-center gap-2">
              <Box className="w-3 h-3" /> Visualización 3D & AR
            </p>
          </div>
          
          <button 
            onClick={onClose}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* El Viewer 3D */}
        <div className="flex-1 w-full relative">
          <model-viewer
            src={modelUrl}
            poster={posterUrl}
            alt={`Un modelo 3D de ${productName}`}
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            auto-rotate
            shadow-intensity="1"
            exposure="1"
            touch-action="pan-y"
            style={{ width: '100%', height: '100%', '--poster-color': 'transparent' } as any}
          >
            {/* Botón de AR específico de model-viewer (aparece en móviles compatibles) */}
            <button slot="ar-button" className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-2xl shadow-primary-500/40 active:scale-95 transition-all">
              <Maximize2 className="w-5 h-5" /> Ver en mi espacio (AR)
            </button>

            {/* Hint de carga */}
            <div slot="poster" className="absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="flex flex-col items-center gap-4">
                <RotateCw className="w-10 h-10 text-primary-500 animate-spin" />
                <p className="text-white/40 font-bold text-sm tracking-widest uppercase">Cargando experiencia 3D...</p>
              </div>
            </div>
          </model-viewer>
        </div>

        {/* Footer con Instrucciones */}
        <div className="p-8 text-center bg-gradient-to-t from-black/50 to-transparent">
          <p className="text-white/50 text-xs max-w-xs mx-auto">
            Girá con un dedo, hacé zoom con dos. En móviles compatibles, usá el botón azul para proyectar la planta en tu casa.
          </p>
        </div>
      </div>
    </div>
  );
}
