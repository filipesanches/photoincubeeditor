'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Printer, 
  Trash2, 
  RotateCcw, 
  Type, 
  Layout, 
  Settings2,
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft,
  Plus,
  Download
} from 'lucide-react';

// --- Types ---

type Orientation = 'portrait' | 'landscape';

interface PolaroidPhoto {
  id: string;
  src: string;
  text: string;
  orientation: Orientation;
  rotation: number;
  zoom: number;
  x: number;
  y: number;
}

interface PaperSettings {
  type: string;
  weight: string;
  isAdhesive: boolean;
}

// --- Constants ---

const PAPER_TYPES = [
  { id: 'glossy', name: 'Papel Fotográfico Brilhante' },
  { id: 'matte', name: 'Papel Fotográfico Fosco' },
  { id: 'satin', name: 'Papel Fotográfico Acetinado' },
];

const PAPER_WEIGHTS = [
  { id: '180', name: '180g' },
  { id: '200', name: '200g' },
  { id: '230', name: '230g' },
  { id: '260', name: '260g' },
];

// --- Components ---

const PolaroidCard = ({ 
  photo, 
  onUpdate, 
  onRemove 
}: { 
  photo: PolaroidPhoto; 
  onUpdate: (id: string, updates: Partial<PolaroidPhoto>) => void;
  onRemove: (id: string) => void;
}) => {
  const rotateImage = () => {
    onUpdate(photo.id, { rotation: (photo.rotation + 90) % 360 });
  };

  const isPortrait = photo.orientation === 'portrait';

  return (
    <div 
      className={`relative group bg-white border border-neutral-100 flex flex-col items-center transition-all duration-300 mx-auto overflow-hidden ${
        isPortrait ? 'w-[70mm] h-[100mm] p-2 pb-8' : 'w-[100mm] h-[70mm] p-2 pb-8'
      }`}
      style={isPortrait ? { transform: 'rotate(-90deg)', transformOrigin: 'center' } : {}}
    >
      {/* Photo Area */}
      <div className={`relative w-full overflow-hidden bg-gray-100 transition-all duration-300 ${
        isPortrait ? 'aspect-square' : 'aspect-[4/3]'
      }`}>
        <img 
          src={photo.src} 
          alt="Preview" 
          className="absolute w-full h-full object-cover transition-all duration-200"
          style={{ 
            transform: `rotate(${photo.rotation}deg) scale(${photo.zoom}) translate(${photo.x}%, ${photo.y}%)`,
            transformOrigin: 'center center'
          }}
        />
        
        {/* Zoom/Position Overlay (Visible on Hover) */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 gap-1 no-print">
          <div className="bg-white/90 rounded-lg p-2 space-y-2 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold uppercase w-8">Zoom</span>
              <input 
                type="range" min="1" max="3" step="0.1" 
                value={photo.zoom} 
                onChange={(e) => onUpdate(photo.id, { zoom: parseFloat(e.target.value) })}
                className="flex-1 h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold uppercase w-8">X</span>
              <input 
                type="range" min="-50" max="50" step="1" 
                value={photo.x} 
                onChange={(e) => onUpdate(photo.id, { x: parseInt(e.target.value) })}
                className="flex-1 h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold uppercase w-8">Y</span>
              <input 
                type="range" min="-50" max="50" step="1" 
                value={photo.y} 
                onChange={(e) => onUpdate(photo.id, { y: parseInt(e.target.value) })}
                className="flex-1 h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Caption Area - Always at bottom with authentic Polaroid spacing */}
      <div className="mt-auto w-full flex flex-col justify-center items-center pt-2">
        <input
          type="text"
          value={photo.text}
          onChange={(e) => onUpdate(photo.id, { text: e.target.value })}
          placeholder="Legenda (opcional)"
          className="w-full text-center text-[11px] font-serif italic border-none focus:ring-0 bg-transparent placeholder:text-gray-200 text-neutral-700"
        />
      </div>

      {/* Action Buttons */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 no-print">
        <button 
          onClick={rotateImage}
          className="p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-white text-gray-600"
          title="Girar Imagem"
        >
          <RotateCcw size={14} />
        </button>
        <button 
          onClick={() => onUpdate(photo.id, { orientation: isPortrait ? 'landscape' : 'portrait' })}
          className="p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-white text-gray-600"
          title={isPortrait ? "Mudar para Horizontal" : "Mudar para Vertical"}
        >
          <Layout size={14} />
        </button>
        <button 
          onClick={() => onRemove(photo.id)}
          className="p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-red-50 text-red-500"
          title="Remover"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default function PolaroidStudio() {
  const [photos, setPhotos] = useState<PolaroidPhoto[]>([]);
  const [settings, setSettings] = useState<PaperSettings>({
    type: 'glossy',
    weight: '180',
    isAdhesive: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: PolaroidPhoto[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos(prev => {
            if (prev.length >= 8) return prev;
            return [...prev, {
              id: Math.random().toString(36).substr(2, 9),
              src: event.target!.result as string,
              text: '',
              orientation: 'landscape' as Orientation,
              rotation: 0,
              zoom: 1,
              x: 0,
              y: 0
            }].slice(0, 8);
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const updatePhoto = (id: string, updates: Partial<PolaroidPhoto>) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      {/* Header */}
      <header className="no-print sticky top-0 z-50 bg-white/80 backdrop-blur-md border-bottom border-neutral-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white">
            <ImageIcon size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">Polaroid Studio</h1>
            <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">A4 Print Layout</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-full text-sm font-semibold transition-colors"
          >
            <Upload size={18} />
            <span>Upload</span>
          </button>
          <button 
            onClick={handlePrint}
            disabled={photos.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white rounded-full text-sm font-semibold transition-all shadow-lg shadow-black/10 active:scale-95"
          >
            <Printer size={18} />
            <span>Imprimir Folha</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">
        
        {/* Sidebar Controls */}
        <aside className="no-print space-y-6">
          <section className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Settings2 size={20} className="text-neutral-400" />
              <h2 className="font-bold text-sm uppercase tracking-widest">Configurações de Papel</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Tipo de Papel</label>
                <select 
                  value={settings.type}
                  onChange={(e) => setSettings({...settings, type: e.target.value})}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                >
                  {PAPER_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Gramatura</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAPER_WEIGHTS.map(w => (
                    <button
                      key={w.id}
                      onClick={() => setSettings({...settings, weight: w.id})}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                        settings.weight === w.id 
                        ? 'bg-black border-black text-white' 
                        : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-400'
                      }`}
                    >
                      {w.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={settings.isAdhesive}
                      onChange={(e) => setSettings({...settings, isAdhesive: e.target.checked})}
                      className="sr-only"
                    />
                    <div className={`w-12 h-6 rounded-full transition-colors ${settings.isAdhesive ? 'bg-black' : 'bg-neutral-200'}`}></div>
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.isAdhesive ? 'translate-x-6' : ''}`}></div>
                  </div>
                  <span className="text-sm font-semibold text-neutral-700 group-hover:text-black transition-colors">Papel Adesivo</span>
                </label>
              </div>

              <div className="pt-6 border-t border-neutral-100">
                <button 
                  onClick={() => setPhotos([])}
                  disabled={photos.length === 0}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl text-sm font-bold transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Trash2 size={18} />
                  <span>Limpar Tudo</span>
                </button>
              </div>
            </div>
          </section>

          <section className="bg-neutral-900 rounded-3xl p-6 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2">Dica de Impressão</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Para melhores resultados, use a configuração de &quot;Alta Qualidade&quot; da sua impressora e selecione o tipo de papel correspondente nas configurações do sistema.
              </p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12">
              <Printer size={120} />
            </div>
          </section>
        </aside>

        {/* Preview Area */}
        <div className="flex flex-col items-center gap-8">
          <div className="no-print flex items-center justify-between w-full max-w-[210mm]">
            <div className="flex items-center gap-2">
              <Layout size={18} className="text-neutral-400" />
              <span className="text-sm font-bold text-neutral-600">Preview da Folha A4</span>
            </div>
            <div className="text-xs font-medium text-neutral-400">
              {photos.length} de 8 fotos adicionadas
            </div>
          </div>

          {/* A4 Sheet */}
          <div className="sheet-container relative shadow-2xl shadow-black/10 transition-transform duration-500">
            <div className="a4-sheet grid grid-cols-2 grid-rows-4 gap-0 items-center justify-center content-center" style={{ padding: '8.5mm 5mm' }}>
              {Array.from({ length: 8 }).map((_, index) => {
                const photo = photos[index];
                return (
                  <div key={index} className="w-[100mm] h-[70mm] border border-dashed border-neutral-100 flex items-center justify-center overflow-hidden bg-neutral-50/30 relative">
                    {photo ? (
                      <PolaroidCard 
                        photo={photo} 
                        onUpdate={updatePhoto} 
                        onRemove={removePhoto} 
                      />
                    ) : (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="no-print group flex flex-col items-center gap-2 text-neutral-300 hover:text-neutral-500 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Plus size={24} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Adicionar Foto</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Empty State / Quick Help */}
          {photos.length === 0 && (
            <div className="no-print text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
                <ImageIcon size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2">Comece seu projeto</h2>
              <p className="text-neutral-500 max-w-xs mx-auto text-sm">
                Faça o upload de até 8 fotos para preencher sua folha A4 no formato Polaroid.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleUpload}
        multiple
        accept="image/*"
        className="hidden"
      />

      {/* Footer Info */}
      <footer className="no-print mt-20 border-t border-neutral-200 py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-neutral-100 rounded flex items-center justify-center">
              <ImageIcon size={16} className="text-neutral-400" />
            </div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Polaroid Print Studio &copy; 2026</span>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Papel</p>
              <p className="text-sm font-semibold">{PAPER_TYPES.find(t => t.id === settings.type)?.name}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Gramatura</p>
              <p className="text-sm font-semibold">{settings.weight}g</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Adesivo</p>
              <p className="text-sm font-semibold">{settings.isAdhesive ? 'Sim' : 'Não'}</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Print Overlay (Optional, for better print experience) */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          main {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
          }
          .a4-sheet {
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
