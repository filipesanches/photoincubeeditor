'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import { domToJpeg } from 'modern-screenshot';
import { 
  Upload, 
  Trash2, 
  RotateCcw, 
  Type, 
  Layout, 
  Settings2,
  Image as ImageIcon,
  Plus,
  Download,
  Bold,
  X,
  MousePointer2,
  AlignLeft,
  AlignCenter,
  AlignRight
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
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  background?: string;
  backgroundSize?: number;
}

// --- Constants ---

const BACKGROUNDS = [
  { id: '#ffffff', name: 'Branco', type: 'color' },
  { id: '#000000', name: 'Preto', type: 'color' },
  { id: '#fdf4ff', name: 'Rosa Bebê', type: 'color' },
  { id: '#f0f9ff', name: 'Azul Bebê', type: 'color' },
  { id: '#fefce8', name: 'Creme', type: 'color' },
  { id: '#f0fdf4', name: 'Verde Menta', type: 'color' },
  { id: 'url(https://www.transparenttextures.com/patterns/paper-fibers.png)', name: 'Papel', type: 'pattern' },
  { id: 'url(https://www.transparenttextures.com/patterns/cardboard-flat.png)', name: 'Papelão', type: 'pattern' },
  { id: 'url(https://www.transparenttextures.com/patterns/white-diamond.png)', name: 'Diamante', type: 'pattern' },
];

const FONTS = [
  { id: 'font-serif', name: 'Serif' },
  { id: 'font-sans', name: 'Sans' },
  { id: 'font-mono', name: 'Mono' },
  { id: 'font-cursive', name: 'Manuscrita' },
];

const COLORS = [
  { id: '#374151', name: 'Padrão' },
  { id: '#000000', name: 'Preto' },
  { id: '#ef4444', name: 'Vermelho' },
  { id: '#3b82f6', name: 'Azul' },
  { id: '#10b981', name: 'Verde' },
  { id: '#f59e0b', name: 'Amarelo' },
];

// --- Components ---

const PolaroidCard = ({ 
  photo, 
  onUpdate, 
  onRemove,
  previewScale = 1,
  isSelected,
  onSelect
}: { 
  photo: PolaroidPhoto; 
  onUpdate: (id: string, updates: Partial<PolaroidPhoto>) => void;
  onRemove: (id: string) => void;
  previewScale?: number;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const isPortrait = photo.orientation === 'portrait';
  const currentBackground = photo.background || '#ffffff';

  const cardStyle: React.CSSProperties = {
    backgroundColor: currentBackground.startsWith('url') ? '#ffffff' : currentBackground,
    backgroundImage: currentBackground.startsWith('url') ? currentBackground : 'none',
    backgroundSize: photo.backgroundSize ? `${photo.backgroundSize}%` : 'cover',
    backgroundRepeat: 'repeat',
    backgroundPosition: 'center'
  };

  return (
    <div 
      onClick={onSelect}
      className={`relative group flex items-center justify-center transition-all duration-300 mx-auto w-[100mm] h-[70mm] cursor-pointer ${
        isSelected ? 'z-50 ring-4 ring-black ring-offset-4 rounded-lg' : 'z-10 hover:scale-[1.02]'
      }`}
    >
      {/* Visual Polaroid - This part handles rotation */}
      <div 
        className={`flex flex-col items-center border border-neutral-100 transition-all duration-300 z-10 ${
          isPortrait ? 'w-[70mm] h-[100mm] p-2 pb-8' : 'w-full h-full p-2 pb-8'
        }`}
        style={{
          ...cardStyle,
          ...(isPortrait ? { 
            transform: 'rotate(-90deg)', 
            position: 'absolute',
            top: 'calc(50% - 50mm)',
            left: 'calc(50% - 35mm)'
          } : {})
        }}
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
        </div>
        
        {/* Caption Area */}
        <div className="mt-auto w-full flex flex-col justify-center items-center pt-2 relative overflow-hidden">
          <div
            className={`w-full min-h-[1.5em] px-2 break-words whitespace-pre-wrap ${photo.fontFamily || 'font-serif italic'} ${photo.fontWeight || ''}`}
            style={{ 
              fontSize: `${photo.fontSize || 11}px`,
              color: photo.color || '#374151',
              fontWeight: photo.fontWeight === 'font-bold' ? 'bold' : 'normal',
              textAlign: photo.textAlign || 'center'
            }}
          >
            {photo.text || ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PolaroidStudio() {
  const [photos, setPhotos] = useState<PolaroidPhoto[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.8);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [customBackgrounds, setCustomBackgrounds] = useState<{id: string, url: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Load custom backgrounds from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('polaroid-custom-backgrounds');
    if (saved) {
      try {
        setCustomBackgrounds(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load custom backgrounds', e);
      }
    }
  }, []);

  // Save custom backgrounds to localStorage
  React.useEffect(() => {
    localStorage.setItem('polaroid-custom-backgrounds', JSON.stringify(customBackgrounds));
  }, [customBackgrounds]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: PolaroidPhoto[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const id = Math.random().toString(36).substr(2, 9);
          setPhotos(prev => {
            if (prev.length >= 8) return prev;
            if (prev.length === 0) setSelectedPhotoId(id);
            return [...prev, {
              id,
              src: event.target!.result as string,
              text: '',
              orientation: 'landscape' as Orientation,
              rotation: 0,
              zoom: 1,
              x: 0,
              y: 0,
              background: '#ffffff',
              fontFamily: 'font-serif italic',
              fontSize: 11,
              color: '#374151',
              fontWeight: 'font-normal',
              textAlign: 'center' as const,
              backgroundSize: 100
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

  const handlePrint = async () => {
    if (!sheetRef.current) return;
    
    setIsGenerating(true);
    
    try {
      // Ensure we are at the top to avoid capture issues
      window.scrollTo(0, 0);
      
      // Small delay to ensure any UI changes are rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const sheet = sheetRef.current;
      
      // Use modern-screenshot to capture the sheet as JPEG
      // It handles modern CSS like oklch much better than html2canvas
      const imgData = await domToJpeg(sheet, {
        quality: 0.95,
        scale: 2,
        backgroundColor: '#ffffff',
        width: 210 * 3.7795275591, // mm to px conversion (approx)
        height: 297 * 3.7795275591,
        filter: (node) => {
          if (node instanceof HTMLElement) {
            return !node.hasAttribute('data-html2canvas-ignore') && !node.classList.contains('no-print');
          }
          return true;
        }
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // A4 is 210x297mm
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      pdf.save('polaroid-studio.pdf');
    } catch (error) {
      console.error('Erro detalhado ao gerar PDF:', error);
      alert('Houve um erro ao gerar o PDF. Por favor, tente novamente ou use um navegador diferente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedPhoto = photos.find(p => p.id === selectedPhotoId);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-black selection:text-white">
      {/* Header */}
      <header className="no-print sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200 px-6 py-4" data-html2canvas-ignore>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center shadow-lg shadow-black/20">
              <ImageIcon className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter uppercase leading-none">Polaroid Studio</h1>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Crie sua folha A4</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-black rounded-2xl text-xs font-bold transition-all"
            >
              <Upload size={16} />
              <span>Upload de Fotos</span>
            </button>
            <button 
              onClick={handlePrint}
              disabled={photos.length === 0 || isGenerating}
              className="flex items-center gap-2 px-8 py-3 bg-black hover:bg-neutral-800 text-white rounded-2xl text-xs font-bold transition-all shadow-xl shadow-black/20 disabled:opacity-30 disabled:shadow-none"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download size={16} />
              )}
              <span>{isGenerating ? 'Gerando...' : 'Baixar PDF'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-[320px_1fr] lg:grid-cols-[380px_1fr] gap-6 lg:gap-10 items-start">
        
        {/* Photo Editor Section - Left Sidebar */}
        <div className="no-print md:sticky md:top-24 h-fit max-h-screen md:max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-hide" data-html2canvas-ignore>
          <AnimatePresence mode="wait">
            {selectedPhoto ? (
              <motion.section 
                key="editor"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full bg-white border border-neutral-200 rounded-[32px] p-6 shadow-2xl shadow-black/5 space-y-6"
              >
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
                      <Settings2 size={16} className="text-white" />
                    </div>
                    <h2 className="text-xs font-black uppercase tracking-widest">Editor</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setSelectedPhotoId(null)}
                      className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
                      title="Fechar Editor"
                    >
                      <X size={18} className="text-neutral-400" />
                    </button>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Caption & Font */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Legenda</span>
                        <div className="flex bg-neutral-100 p-1 rounded-lg gap-1">
                          <button 
                            onClick={() => updatePhoto(selectedPhoto.id, { textAlign: 'left' })}
                            className={`p-1 rounded transition-all ${selectedPhoto.textAlign === 'left' ? 'bg-white shadow-sm text-black' : 'text-neutral-400'}`}
                          >
                            <AlignLeft size={14} />
                          </button>
                          <button 
                            onClick={() => updatePhoto(selectedPhoto.id, { textAlign: 'center' })}
                            className={`p-1 rounded transition-all ${selectedPhoto.textAlign === 'center' || !selectedPhoto.textAlign ? 'bg-white shadow-sm text-black' : 'text-neutral-400'}`}
                          >
                            <AlignCenter size={14} />
                          </button>
                          <button 
                            onClick={() => updatePhoto(selectedPhoto.id, { textAlign: 'right' })}
                            className={`p-1 rounded transition-all ${selectedPhoto.textAlign === 'right' ? 'bg-white shadow-sm text-black' : 'text-neutral-400'}`}
                          >
                            <AlignRight size={14} />
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={selectedPhoto.text}
                        onChange={(e) => updatePhoto(selectedPhoto.id, { text: e.target.value })}
                        placeholder="Escreva sua legenda..."
                        rows={2}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-neutral-400 block mb-2 tracking-widest">Fonte</span>
                        <select 
                          value={selectedPhoto.fontFamily}
                          onChange={(e) => updatePhoto(selectedPhoto.id, { fontFamily: e.target.value })}
                          className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[11px] font-bold outline-none cursor-pointer"
                        >
                          {FONTS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-neutral-400 block mb-2 tracking-widest">Estilo</span>
                        <button 
                          onClick={() => updatePhoto(selectedPhoto.id, { fontWeight: selectedPhoto.fontWeight === 'font-bold' ? 'font-normal' : 'font-bold' })}
                          className={`w-full py-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 text-[11px] font-bold ${selectedPhoto.fontWeight === 'font-bold' ? 'bg-black text-white border-black' : 'bg-neutral-50 border-neutral-200 text-neutral-600'}`}
                        >
                          <Bold size={14} />
                          <span>Negrito</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Text Style & Background */}
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between mb-2">
                          <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Tamanho</span>
                          <span className="text-[10px] font-black text-neutral-900">{selectedPhoto.fontSize || 11}px</span>
                        </div>
                        <input 
                          type="range" min="8" max="32" step="1" 
                          value={selectedPhoto.fontSize || 11} 
                          onChange={(e) => updatePhoto(selectedPhoto.id, { fontSize: parseInt(e.target.value) })}
                          className="w-full h-1.5 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-black"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] font-black uppercase text-neutral-400 block mb-2 tracking-widest">Cor</span>
                        <div className="flex gap-1.5 flex-wrap items-center">
                          {COLORS.map(c => (
                            <button 
                              key={c.id}
                              onClick={() => updatePhoto(selectedPhoto.id, { color: c.id })}
                              className={`w-5 h-5 rounded-full border border-neutral-200 transition-all ${selectedPhoto.color === c.id ? 'ring-2 ring-black ring-offset-2 scale-110' : 'hover:scale-110'}`}
                              style={{ backgroundColor: c.id }}
                            />
                          ))}
                          <div className="relative w-5 h-5 group">
                            <input 
                              type="color"
                              value={selectedPhoto.color || '#374151'}
                              onChange={(e) => updatePhoto(selectedPhoto.id, { color: e.target.value })}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div 
                              className={`w-5 h-5 rounded-full border border-neutral-200 transition-all flex items-center justify-center bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 ${!COLORS.some(c => c.id === selectedPhoto.color) ? 'ring-2 ring-black ring-offset-2 scale-110' : 'hover:scale-110'}`}
                            >
                              <Plus size={10} className="text-white drop-shadow-sm" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Fundo da Moldura</span>
                        {selectedPhoto.background?.startsWith('url') && (
                          <div className="flex items-center gap-2 bg-neutral-100 px-2 py-1 rounded-lg">
                            <span className="text-[9px] font-black text-neutral-400 uppercase">Tamanho</span>
                            <input 
                              type="range" min="10" max="200" step="5"
                              value={selectedPhoto.backgroundSize || 100}
                              onChange={(e) => updatePhoto(selectedPhoto.id, { backgroundSize: parseInt(e.target.value) })}
                              className="w-16 h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black"
                            />
                            <span className="text-[9px] font-black w-6">{selectedPhoto.backgroundSize || 100}%</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {BACKGROUNDS.map(bg => (
                          <button 
                            key={bg.id}
                            onClick={() => updatePhoto(selectedPhoto.id, { background: bg.id, backgroundSize: 100 })}
                            className={`w-8 h-8 rounded-xl border border-neutral-200 transition-all ${selectedPhoto.background === bg.id ? 'ring-2 ring-black ring-offset-2 scale-110' : 'hover:scale-110'}`}
                            style={{ 
                              backgroundColor: bg.type === 'color' ? bg.id : '#ffffff',
                              backgroundImage: bg.type === 'pattern' ? bg.id : 'none'
                            }}
                          />
                        ))}
                        
                        {/* Custom Saved Backgrounds */}
                        {customBackgrounds.map(bg => (
                          <button 
                            key={bg.id}
                            onClick={() => updatePhoto(selectedPhoto.id, { background: bg.url })}
                            className={`w-8 h-8 rounded-xl border border-neutral-200 transition-all relative group ${selectedPhoto.background === bg.url ? 'ring-2 ring-black ring-offset-2 scale-110' : 'hover:scale-110'}`}
                            style={{ 
                              backgroundImage: bg.url,
                              backgroundSize: 'cover'
                            }}
                          >
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                setCustomBackgrounds(prev => prev.filter(item => item.id !== bg.id));
                              }}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={10} />
                            </div>
                          </button>
                        ))}

                        <button 
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  if (ev.target?.result) {
                                    const url = `url(${ev.target.result})`;
                                    const newBg = { id: Math.random().toString(36).substr(2, 9), url };
                                    setCustomBackgrounds(prev => [newBg, ...prev].slice(0, 10)); // Keep last 10
                                    updatePhoto(selectedPhoto.id, { background: url, backgroundSize: 100 });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            };
                            input.click();
                          }}
                          className="w-8 h-8 rounded-xl border border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 hover:text-black hover:border-neutral-400 transition-all"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Image Adjustments & Quick Actions */}
                  <div className="space-y-6 bg-neutral-50 p-5 rounded-[24px] border border-neutral-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Ajuste da Imagem</span>
                      <button 
                        onClick={() => {
                          removePhoto(selectedPhoto.id);
                          setSelectedPhotoId(null);
                        }}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl border border-red-100 transition-all shadow-sm"
                        title="Remover Foto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => updatePhoto(selectedPhoto.id, { rotation: (selectedPhoto.rotation + 90) % 360 })}
                        className="flex-1 py-2.5 bg-white hover:bg-neutral-100 text-neutral-600 rounded-xl border border-neutral-200 transition-all shadow-sm flex items-center justify-center gap-2 text-[11px] font-bold"
                        title="Girar Imagem"
                      >
                        <RotateCcw size={16} />
                        <span>Girar</span>
                      </button>
                      <button 
                        onClick={() => updatePhoto(selectedPhoto.id, { orientation: selectedPhoto.orientation === 'portrait' ? 'landscape' : 'portrait' })}
                        className="flex-1 py-2.5 bg-white hover:bg-neutral-100 text-neutral-600 rounded-xl border border-neutral-200 transition-all shadow-sm flex items-center justify-center gap-2 text-[11px] font-bold"
                        title={selectedPhoto.orientation === 'portrait' ? "Mudar para Horizontal" : "Mudar para Vertical"}
                      >
                        <Layout size={16} />
                        <span>Formato</span>
                      </button>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-neutral-200/50">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-[9px] font-black uppercase text-neutral-500">Zoom</span>
                          <span className="text-[9px] font-black">{selectedPhoto.zoom.toFixed(1)}x</span>
                        </div>
                        <input 
                          type="range" min="1" max="3" step="0.1" 
                          value={selectedPhoto.zoom} 
                          onChange={(e) => updatePhoto(selectedPhoto.id, { zoom: parseFloat(e.target.value) })}
                          className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-[9px] font-black uppercase text-neutral-500">Posição X</span>
                          <span className="text-[9px] font-black">{selectedPhoto.x}%</span>
                        </div>
                        <input 
                          type="range" min="-50" max="50" step="1" 
                          value={selectedPhoto.x} 
                          onChange={(e) => updatePhoto(selectedPhoto.id, { x: parseInt(e.target.value) })}
                          className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-[9px] font-black uppercase text-neutral-500">Posição Y</span>
                          <span className="text-[9px] font-black">{selectedPhoto.y}%</span>
                        </div>
                        <input 
                          type="range" min="-50" max="50" step="1" 
                          value={selectedPhoto.y} 
                          onChange={(e) => updatePhoto(selectedPhoto.id, { y: parseInt(e.target.value) })}
                          className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full bg-neutral-100/50 border border-dashed border-neutral-200 rounded-[32px] p-12 flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <MousePointer2 size={20} className="text-neutral-300" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Selecione uma foto</h3>
                  <p className="text-[10px] font-bold text-neutral-400 mt-2 leading-relaxed">Clique em qualquer Polaroid na folha para começar a editar.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col items-center gap-8 w-full">
          {/* Preview Area */}
          <div className="flex flex-col items-center gap-8 w-full overflow-x-auto pb-20">
            <div className="no-print flex flex-col sm:flex-row items-center justify-between w-full max-w-[210mm] px-4 gap-4" data-html2canvas-ignore>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Layout size={18} className="text-neutral-400" />
                  <span className="text-sm font-bold text-neutral-600">Preview A4</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-neutral-200 shadow-sm">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">Zoom</span>
                  <input 
                    type="range" min="0.3" max="1.0" step="0.05" 
                    value={previewScale} 
                    onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
                    className="w-24 h-1 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-black"
                  />
                  <span className="text-[10px] font-bold text-neutral-900 w-8">{Math.round(previewScale * 100)}%</span>
                </div>
              </div>
              <div className="text-xs font-medium text-neutral-400 bg-neutral-100 px-3 py-1 rounded-full">
                {photos.length} de 8 fotos
              </div>
            </div>

            {/* A4 Sheet Wrapper to handle scaling layout */}
            <div 
              className="relative shadow-2xl shadow-black/10 transition-all duration-300 z-10"
              style={{ 
                width: `${210 * previewScale}mm`, 
                height: `${297 * previewScale}mm`,
                minWidth: `${210 * previewScale}mm`
              }}
            >
              <div 
                ref={sheetRef}
                className="a4-sheet grid grid-cols-2 grid-rows-4 gap-0 items-center justify-center content-center bg-white origin-top-left" 
                style={{ 
                  padding: '8.5mm 5mm', 
                  width: '210mm', 
                  height: '297mm',
                  transform: `scale(${previewScale})`
                }}
              >
                {Array.from({ length: 8 }).map((_, index) => {
                  const photo = photos[index];
                  const isSelected = photo && selectedPhotoId === photo.id;
                  return (
                    <div 
                      key={index} 
                      className={`w-[100mm] h-[70mm] border border-dashed border-neutral-100 flex items-center justify-center bg-neutral-50/30 relative ${isSelected ? 'z-50' : 'z-0'}`}
                    >
                      {photo ? (
                        <PolaroidCard 
                          photo={photo} 
                          onUpdate={updatePhoto} 
                          onRemove={removePhoto} 
                          previewScale={previewScale}
                          isSelected={isSelected}
                          onSelect={() => setSelectedPhotoId(photo.id)}
                        />
                      ) : (
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="no-print group flex flex-col items-center gap-2 text-neutral-300 hover:text-neutral-500 transition-colors"
                          data-html2canvas-ignore
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
              <div className="no-print text-center py-12" data-html2canvas-ignore>
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
        </div>
      </main>

      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleUpload}
        multiple
        accept="image/*"
        className="hidden"
      />

      {/* Footer Info */}
      <footer className="no-print mt-20 border-t border-neutral-200 py-12 px-6 bg-white" data-html2canvas-ignore>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-neutral-100 rounded flex items-center justify-center">
              <ImageIcon size={16} className="text-neutral-400" />
            </div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Polaroid Print Studio &copy; 2026</span>
          </div>
          <div className="flex gap-8">
            {/* Global info removed as backgrounds are now per-card */}
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
        
        .a4-sheet {
          width: 210mm;
          height: 297mm;
          background: white;
          position: relative;
          box-shadow: none !important;
        }

        .sheet-container {
          background: white;
          padding: 0;
          margin: 0;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
}
