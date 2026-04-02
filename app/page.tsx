'use client';

import Image from 'next/image';
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
  AlignRight,
  ChevronDown,
  Italic,
  RotateCw,
  Wand2
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
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  background?: string;
  backgroundSize?: number;
  brightness?: number; // Valor de 0 a 200 (100 é o padrão)
  grayscale?: boolean;
  sepia?: boolean;
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
  { id: 'font-sans', name: 'Sans (Inter)' },
  { id: 'font-serif', name: 'Serif (Playfair)' },
  { id: 'font-mono', name: 'Mono (Roboto)' },
  { id: 'font-cursive', name: 'Manuscrita (Dancing)' },
  { id: 'font-caveat', name: 'Caveat' },
  { id: 'font-pacifico', name: 'Pacifico' },
  { id: 'font-montserrat', name: 'Montserrat' },
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
      className={`relative group flex items-center justify-center transition-all duration-300 mx-auto w-[100mm] h-[70mm] cursor-pointer ${isSelected ? 'z-50 ring-4 ring-black ring-offset-4 rounded-lg' : 'z-10 hover:scale-[1.02]'
        }`}
    >
      {/* Visual Polaroid - This part handles rotation */}
      <div
        className={`flex flex-col items-center border border-neutral-100 transition-all duration-300 z-10 ${isPortrait ? 'w-[70mm] h-[100mm] p-2 pb-8' : 'w-full h-full p-2 pb-8'
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
        {/* Photo Area */}
        <div className={`relative w-full overflow-hidden bg-gray-100 transition-all duration-300 ${isPortrait ? 'aspect-square' : 'aspect-[4/3]'
          }`}>

          {/* Camada de Blur (Fundo) */}
          <div className="absolute inset-0 z-0">
            <Image
              src={photo.src}
              alt="Blur Background"
              fill
              unoptimized
              className="object-cover blur-md opacity-50 scale-120" // O scale evita bordas brancas no blur
              style={{
                filter: `brightness(${photo.brightness ?? 100}%) ${photo.grayscale ? 'grayscale(100%)' : ''} ${photo.sepia ? 'sepia(100%)' : ''} blur(5px)`
              }}
            />
          </div>

          {/* Foto Principal (Frente) */}
          <div className="relative z-10 w-full h-full">
            <Image
              src={photo.src}
              alt="Preview"
              fill
              unoptimized
              referrerPolicy="no-referrer"
              className="object-contain transition-all duration-200"
              style={{
                transform: `rotate(${photo.rotation}deg) scale(${photo.zoom}) translate(${photo.x}%, ${photo.y}%)`,
                transformOrigin: 'center center',
                filter: `brightness(${photo.brightness ?? 100}%) ${photo.grayscale ? 'grayscale(100%)' : ''} ${photo.sepia ? 'sepia(100%)' : ''}`
              }}
            />
          </div>
        </div>

        {/* Caption Area */}
        <div className="mt-auto w-full flex flex-col justify-center items-center pt-2 relative overflow-hidden">
          <div
            className={`w-full min-h-[1.5em] px-2 break-words whitespace-pre-wrap ${photo.fontFamily || 'font-serif'} ${photo.fontWeight || ''} ${(photo.fontStyle === 'italic' || !photo.fontStyle) ? 'italic' : ''}`}
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    caption: false,
    style: false,
    adjustments: false,
    filters: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      // Primeiro, definimos todas as seções como fechadas (false)
      caption: false,
      style: false,
      adjustments: false,
      filters: false,
      // Depois, invertemos o estado APENAS da seção que foi clicada
      [section]: !prev[section]
    }));
  };

  // Adjust preview scale on mount based on screen size
  React.useEffect(() => {
    const updateScale = () => {
      if (window.innerWidth < 640) {
        setPreviewScale(0.35);
      } else if (window.innerWidth < 1024) {
        setPreviewScale(0.55);
      } else {
        setPreviewScale(0.8);
      }
    };
    updateScale();
  }, []);

  const [customBackgrounds, setCustomBackgrounds] = useState<{ id: string, url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
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

  // Função para lidar com o upload do novo fundo
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        const bgId = `url(${dataUrl})`;

        setCustomBackgrounds(prev => [...prev, { id: bgId, url: bgId }]);

        // Se tiver uma foto selecionada, já aplica o fundo nela automaticamente
        if (selectedPhotoId) {
          updatePhoto(selectedPhotoId, { background: bgId, backgroundSize: 100 });
        }
      }
    };
    reader.readAsDataURL(file);

    // Limpa o input para poder subir o mesmo arquivo de novo se necessário
    if (backgroundInputRef.current) {
      backgroundInputRef.current.value = '';
    }
  };

  // Função para remover um fundo personalizado do LocalStorage
  const removeCustomBackground = (idToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que o clique vaze para o container
    setCustomBackgrounds(prev => prev.filter(bg => bg.id !== idToRemove));

    // Se a foto atual estava usando esse fundo, volta para branco
    if (selectedPhotoId) {
      const currentPhoto = photos.find(p => p.id === selectedPhotoId);
      if (currentPhoto && currentPhoto.background === idToRemove) {
        updatePhoto(selectedPhotoId, { background: '#ffffff' });
      }
    }
  };


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
              fontFamily: 'font-serif',
              fontSize: 11,
              color: '#374151',
              fontWeight: 'font-normal',
              fontStyle: 'italic' as const,
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

  // --- FUNÇÕES "APLICAR A TODAS" ---
  // 1. Aplica apenas o estilo do texto (mantém o texto original de cada foto intacto)
  const applyCaptionStyleToAll = () => {
    const selected = photos.find(p => p.id === selectedPhotoId);
    if (!selected) return;
    const { fontFamily, fontSize, color, fontWeight, fontStyle, textAlign } = selected;

    setPhotos(prev => prev.map(p => ({
      ...p, fontFamily, fontSize, color, fontWeight, fontStyle, textAlign
    })));
  };

  // 2. Aplica apenas o fundo
  const applyBackgroundToAll = () => {
    const selected = photos.find(p => p.id === selectedPhotoId);
    if (!selected) return;
    const { background, backgroundSize } = selected;

    setPhotos(prev => prev.map(p => ({
      ...p, background, backgroundSize
    })));
  };

  // 3. Aplica apenas os filtros e efeitos de cor
  const applyFiltersToAll = () => {
    const selected = photos.find(p => p.id === selectedPhotoId);
    if (!selected) return;
    const { brightness, grayscale, sepia } = selected;

    setPhotos(prev => prev.map(p => ({
      ...p, brightness, grayscale, sepia
    })));
  };

  // 4. Aplica APENAS o texto (conteúdo escrito)
  const applyTextToAll = () => {
    const selected = photos.find(p => p.id === selectedPhotoId);
    if (!selected) return;
    const { text } = selected;

    setPhotos(prev => prev.map(p => ({
      ...p, text
    })));
  };

  const handlePrint = async () => {
    if (!sheetRef.current) return;

    // Guarda a escala atual para poder restaurar depois do print
    const previousScale = previewScale;

    // Desmarca a foto (fecha o editor e remove a borda de seleção)
    setSelectedPhotoId(null);
    // Força o zoom da folha para 100%
    setPreviewScale(1);

    setIsGenerating(true);

    try {
      // Garante que a página esteja no topo para evitar cortes na imagem
      window.scrollTo(0, 0);

      // Aumentamos o delay para 800ms para garantir que a animação 
      // de fechamento do editor e o redimensionamento do zoom terminem completamente
      await new Promise(resolve => setTimeout(resolve, 800));

      const sheet = sheetRef.current;

      // Use modern-screenshot to capture the sheet as JPEG
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
      // Retorna o zoom para como estava antes do usuário clicar em baixar
      setPreviewScale(previousScale);
    }
  };

  const selectedPhoto = photos.find(p => p.id === selectedPhotoId);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-black selection:text-white">
      {/* Header */}
      <header className="no-print sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200 px-4 md:px-6 py-3 md:py-4" data-html2canvas-ignore>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-black rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-black/20">
              <ImageIcon className="text-white" size={16} />
            </div>
            <div>
              <h1 className="text-sm md:text-lg font-black tracking-tighter uppercase leading-none">Photo in Cube</h1>
              <p className="text-[8px] md:text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5 md:mt-1">Crie sua folha A4</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 p-2.5 md:px-6 md:py-3 bg-neutral-100 hover:bg-neutral-200 text-black rounded-xl md:rounded-2xl text-xs font-bold transition-all"
              title="Upload de Fotos"
            >
              <Upload size={16} />
              <span className="hidden md:inline">Upload de Fotos</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={photos.length === 0 || isGenerating}
              className="flex items-center gap-2 p-2.5 md:px-8 md:py-3 bg-black hover:bg-neutral-800 text-white rounded-xl md:rounded-2xl text-xs font-bold transition-all shadow-xl shadow-black/20 disabled:opacity-30 disabled:shadow-none"
              title="Baixar PDF"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download size={16} />
              )}
              <span className="hidden md:inline">{isGenerating ? 'Gerando...' : 'Baixar PDF'}</span>
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
                className="w-full bg-white border border-neutral-200 rounded-[24px] p-5 md:p-6 space-y-5"
              >
                {/* Header do Editor */}
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
                      <Settings2 size={16} className="text-white" />
                    </div>
                    <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-neutral-800">Editor</h2>
                  </div>
                  <button
                    onClick={() => setSelectedPhotoId(null)}
                    className="p-2 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-400 hover:text-black"
                    title="Fechar Editor"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Seção: Legenda & Fonte */}
                  <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => toggleSection('caption')}
                      className="w-full flex items-center justify-between p-4 bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
                    >
                      <span className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Legenda & Fonte</span>
                      <ChevronDown size={16} className={`text-neutral-400 transition-transform duration-300 ${expandedSections.caption ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence initial={false}>
                      {expandedSections.caption && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-neutral-100"
                        >
                          <div className="p-4 space-y-5">
                            {/* Alinhamento e Textarea */}
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <label className="text-[9px] font-bold uppercase text-neutral-400 tracking-widest">Texto</label>
                                <div className="flex bg-neutral-100 p-1 rounded-lg gap-1">
                                  {[
                                    { icon: AlignLeft, value: 'left' },
                                    { icon: AlignCenter, value: 'center' },
                                    { icon: AlignRight, value: 'right' }
                                  ].map((item) => (
                                    <button
                                      key={item.value}
                                      onClick={() => updatePhoto(selectedPhoto.id, { textAlign: item.value as 'left' | 'center' | 'right' })}
                                      className={`p-1.5 rounded transition-all ${(selectedPhoto.textAlign === item.value || (item.value === 'center' && !selectedPhoto.textAlign))
                                        ? 'bg-white shadow-sm text-black'
                                        : 'text-neutral-400 hover:text-neutral-600'
                                        }`}
                                    >
                                      <item.icon size={14} />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <textarea
                                value={selectedPhoto.text}
                                onChange={(e) => updatePhoto(selectedPhoto.id, { text: e.target.value })}
                                placeholder="Escreva sua legenda..."
                                rows={2}
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all resize-none"
                              />
                            </div>

                            {/* Botões Aplicar a Todas (Texto) */}
                            <div className="border-neutral-100 space-y-2">
                              <button
                                onClick={applyTextToAll}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-neutral-50 hover:bg-neutral-200 hover:text-black text-neutral-700 rounded-xl border border-neutral-100 transition-all font-bold text-[11px] uppercase tracking-widest"
                              >
                                <Wand2 size={14} /> Aplicar Texto a Todas
                              </button>
                            </div>

                            {/* Fonte e Estilo */}
                            <div className="grid grid-cols-1 gap-4">
                              <div className="space-y-2">
                                <label className="text-[9px] font-bold uppercase text-neutral-400 tracking-widest">Fonte</label>
                                <select
                                  value={selectedPhoto.fontFamily}
                                  onChange={(e) => updatePhoto(selectedPhoto.id, { fontFamily: e.target.value })}
                                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[11px] font-bold outline-none cursor-pointer focus:border-black"
                                >
                                  {FONTS.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => updatePhoto(selectedPhoto.id, { fontWeight: selectedPhoto.fontWeight === 'font-bold' ? 'font-normal' : 'font-bold' })}
                                  className={`flex-1 py-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 text-[10px] font-bold ${selectedPhoto.fontWeight === 'font-bold' ? 'bg-black text-white border-black' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}
                                >
                                  <Bold size={12} /> Negrito
                                </button>
                                <button
                                  onClick={() => updatePhoto(selectedPhoto.id, { fontStyle: (selectedPhoto.fontStyle === 'italic' || !selectedPhoto.fontStyle) ? 'normal' : 'italic' })}
                                  className={`flex-1 py-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 text-[10px] font-bold ${(selectedPhoto.fontStyle === 'italic' || !selectedPhoto.fontStyle) ? 'bg-black text-white border-black' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}
                                >
                                  <Italic size={12} /> Itálico
                                </button>
                              </div>
                            </div>

                            {/* Tamanho e Cor */}
                            <div className="space-y-4">
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] font-bold uppercase text-neutral-400 tracking-widest">Tamanho</span>
                                  <span className="text-[10px] font-black px-2 py-0.5 bg-neutral-100 rounded-md text-neutral-900">{selectedPhoto.fontSize || 11}px</span>
                                </div>
                                <input
                                  type="range" min="8" max="32" step="1"
                                  value={selectedPhoto.fontSize || 11}
                                  onChange={(e) => updatePhoto(selectedPhoto.id, { fontSize: parseInt(e.target.value) })}
                                  className="w-full h-1.5 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-black"
                                />
                              </div>

                              <div className="space-y-3">
                                <span className="text-[9px] font-bold uppercase text-neutral-400 tracking-widest">Cor do Texto</span>
                                <div className="flex gap-2 flex-wrap mt-4 items-center">
                                  {COLORS.map(c => (
                                    <button
                                      key={c.id}
                                      onClick={() => updatePhoto(selectedPhoto.id, { color: c.id })}
                                      className={`w-6 h-6 rounded-full border border-neutral-200 transition-all ${selectedPhoto.color === c.id ? 'ring-2 ring-black ring-offset-2 scale-110' : 'hover:scale-110'}`}
                                      style={{ backgroundColor: c.id }}
                                    />
                                  ))}
                                  <div className="relative w-6 h-6 group">
                                    <input
                                      type="color"
                                      value={selectedPhoto.color || '#374151'}
                                      onChange={(e) => updatePhoto(selectedPhoto.id, { color: e.target.value })}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`w-6 h-6 rounded-full border border-neutral-200 transition-all flex items-center justify-center bg-gradient-to-tr from-red-400 via-green-400 to-blue-400 ${!COLORS.some(c => c.id === selectedPhoto.color) ? 'ring-2 ring-black ring-offset-2 scale-110' : 'hover:scale-110'}`}>
                                      <Plus size={12} className="text-white" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="pt-2 border-neutral-100">
                              <button
                                onClick={applyCaptionStyleToAll}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-neutral-50 hover:bg-neutral-200 hover:text-black text-neutral-700 rounded-xl border border-neutral-100 transition-all font-bold text-[11px] uppercase tracking-widest"
                              >
                                <Wand2 size={14} /> Aplicar Estilo da Fonte a Todas
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Seção: Fundo */}
                  <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => toggleSection('style')}
                      className="w-full flex items-center justify-between p-4 bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
                    >
                      <span className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Fundo</span>
                      <ChevronDown size={16} className={`text-neutral-400 transition-transform duration-300 ${expandedSections.style ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence initial={false}>
                      {expandedSections.style && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-neutral-100"
                        >
                          <div className="p-4 space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-bold uppercase text-neutral-400 tracking-widest">Padrões</span>
                              {selectedPhoto.background?.startsWith('url') && (
                                <div className="flex items-center gap-2 bg-neutral-100 px-2 py-1 rounded-lg">
                                  <span className="text-[9px] font-black text-neutral-500 uppercase">Zoom</span>
                                  <input
                                    type="range" min="10" max="200" step="5"
                                    value={selectedPhoto.backgroundSize || 100}
                                    onChange={(e) => updatePhoto(selectedPhoto.id, { backgroundSize: parseInt(e.target.value) })}
                                    className="w-16 h-1 bg-neutral-300 rounded-lg appearance-none cursor-pointer accent-black"
                                  />
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2.5 flex-wrap">
                              {/* Fundos Padrão */}
                              {BACKGROUNDS.map(bg => (
                                <button
                                  key={bg.id}
                                  onClick={() => updatePhoto(selectedPhoto.id, { background: bg.id, backgroundSize: 100 })}
                                  className={`w-9 h-9 rounded-xl border border-neutral-200 transition-all ${selectedPhoto.background === bg.id ? 'ring-2 ring-black ring-offset-2 scale-110' : 'hover:scale-110 shadow-sm'}`}
                                  style={{
                                    backgroundColor: bg.type === 'color' ? bg.id : '#ffffff',
                                    backgroundImage: bg.type === 'pattern' ? bg.id : 'none'
                                  }}
                                />
                              ))}

                              {/* Fundos Personalizados (LocalStorage) */}
                              {customBackgrounds.map(bg => (
                                <div key={bg.id} className="relative group">
                                  <button
                                    onClick={() => updatePhoto(selectedPhoto.id, { background: bg.id, backgroundSize: 100 })}
                                    className={`w-9 h-9 rounded-xl border border-neutral-200 transition-all ${selectedPhoto.background === bg.id ? 'ring-2 ring-black ring-offset-2 scale-110' : 'hover:scale-110 shadow-sm'}`}
                                    style={{
                                      backgroundColor: '#ffffff',
                                      backgroundImage: bg.url,
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center'
                                    }}
                                  />
                                  <button
                                    onClick={(e) => removeCustomBackground(bg.id, e)}
                                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                    title="Remover fundo"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              ))}

                              {/* Botão de Novo Fundo... */}
                              <button
                                onClick={() => backgroundInputRef.current?.click()}
                                className="w-9 h-9 rounded-xl border border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 hover:text-black hover:border-neutral-400 transition-all bg-neutral-50"
                                title="Adicionar fundo personalizado"
                              >
                                <Plus size={18} />
                              </button>
                            </div>

                            {/* Botão Aplicar Fundo a Todas */}
                            <div className="pt-2 border-neutral-100">
                              <button
                                onClick={applyBackgroundToAll}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-neutral-50 hover:bg-neutral-200 hover:text-black text-neutral-700 rounded-xl border border-neutral-100 transition-all font-bold text-[11px] uppercase tracking-widest"
                              >
                                <Wand2 size={14} /> Aplicar Fundo a Todas
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Seção: Ajustes & Ações */}
                  <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => toggleSection('adjustments')}
                      className="w-full flex items-center justify-between p-4 bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
                    >
                      <span className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Ajustes & Ações</span>
                      <ChevronDown size={16} className={`text-neutral-400 transition-transform duration-300 ${expandedSections.adjustments ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence initial={false}>
                      {expandedSections.adjustments && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-neutral-100"
                        >
                          <div className="p-4 space-y-5">
                            {/* Botões de Girar e Formato */}
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                onClick={() => updatePhoto(selectedPhoto.id, { rotation: (selectedPhoto.rotation - 10) % 360 })}
                                className="flex flex-col items-center gap-1.5 py-3 bg-white hover:bg-neutral-50 text-neutral-600 rounded-xl border border-neutral-200 transition-all shadow-sm"
                              >
                                <RotateCcw size={16} />
                                <span className="text-[9px] font-bold uppercase">Esq.</span>
                              </button>
                              <button
                                onClick={() => updatePhoto(selectedPhoto.id, { rotation: (selectedPhoto.rotation + 10) % 360 })}
                                className="flex flex-col items-center gap-1.5 py-3 bg-white hover:bg-neutral-50 text-neutral-600 rounded-xl border border-neutral-200 transition-all shadow-sm"
                              >
                                <RotateCw size={16} />
                                <span className="text-[9px] font-bold uppercase">Dir.</span>
                              </button>
                              <button
                                onClick={() => updatePhoto(selectedPhoto.id, { orientation: selectedPhoto.orientation === 'portrait' ? 'landscape' : 'portrait' })}
                                className="flex flex-col items-center gap-1.5 py-3 bg-white hover:bg-neutral-50 text-neutral-600 rounded-xl border border-neutral-200 transition-all shadow-sm"
                              >
                                <Layout size={16} />
                                <span className="text-[9px] font-bold uppercase">Layout</span>
                              </button>
                            </div>

                            {/* Sliders de Zoom e Posição */}
                            <div className="space-y-4 pt-2">
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span className="text-[9px] font-bold uppercase text-neutral-400 tracking-widest">Zoom da Imagem</span>
                                  <span className="text-[10px] font-black text-neutral-900">{selectedPhoto.zoom.toFixed(1)}x</span>
                                </div>
                                <input
                                  type="range" min="1" max="5" step="0.1"
                                  value={selectedPhoto.zoom}
                                  onChange={(e) => updatePhoto(selectedPhoto.id, { zoom: parseFloat(e.target.value) })}
                                  className="w-full h-1.5 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-black"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <span className="text-[9px] font-bold uppercase text-neutral-400 tracking-widest text-center block">Eixo X</span>
                                  <input
                                    type="range" min="-50" max="50" step="1"
                                    value={selectedPhoto.x}
                                    onChange={(e) => updatePhoto(selectedPhoto.id, { x: parseInt(e.target.value) })}
                                    className="w-full h-1 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-neutral-400"
                                  />
                                </div>
                                <div className="space-y-3">
                                  <span className="text-[9px] font-bold uppercase text-neutral-400 tracking-widest text-center block">Eixo Y</span>
                                  <input
                                    type="range" min="-50" max="50" step="1"
                                    value={selectedPhoto.y}
                                    onChange={(e) => updatePhoto(selectedPhoto.id, { y: parseInt(e.target.value) })}
                                    className="w-full h-1 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-neutral-400"
                                  />
                                </div>
                              </div>
                            </div>




                            {/* Botão Remover */}
                            <button
                              onClick={() => {
                                removePhoto(selectedPhoto.id);
                                setSelectedPhotoId(null);
                              }}
                              className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 rounded-xl border border-red-100 transition-all font-bold text-[11px] uppercase tracking-widest mt-2"
                            >
                              <Trash2 size={16} />
                              Excluir Foto
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {/* Seção: Filtros e Efeitos (Dropdown) */}
                  <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => toggleSection('filters')}
                      className="w-full flex items-center justify-between p-4 bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
                    >
                      <span className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Filtros & Efeitos</span>
                      <ChevronDown size={16} className={`text-neutral-400 transition-transform duration-300 ${expandedSections.filters ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence initial={false}>
                      {expandedSections.filters && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-neutral-100"
                        >
                          <div className="p-4 space-y-5">
                            {/* Slider de Brilho */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[9px] font-bold uppercase text-neutral-400 tracking-widest">Brilho</label>
                                <span className="text-[10px] font-black">{selectedPhoto.brightness ?? 100}%</span>
                              </div>
                              <input
                                type="range" min="50" max="150" step="1"
                                value={selectedPhoto.brightness ?? 100}
                                onChange={(e) => updatePhoto(selectedPhoto.id, { brightness: parseInt(e.target.value) })}
                                className="w-full h-1.5 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-black"
                              />
                            </div>

                            {/* Menu Dropdown para Filtros de Cor */}
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold uppercase text-neutral-400 tracking-widest">Efeito de Cor</label>
                              <select
                                value={selectedPhoto.grayscale ? 'grayscale' : selectedPhoto.sepia ? 'sepia' : 'none'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updatePhoto(selectedPhoto.id, {
                                    grayscale: val === 'grayscale',
                                    sepia: val === 'sepia'
                                  });
                                }}
                                className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[11px] font-bold outline-none cursor-pointer focus:border-black transition-all"
                              >
                                <option value="none">Original (Cores)</option>
                                <option value="grayscale">Preto e Branco</option>
                                <option value="sepia">Sépia (Vintage)</option>
                              </select>
                            </div>

                            {/* Botão de Reset rápido */}
                            <button
                              onClick={() => updatePhoto(selectedPhoto.id, { grayscale: false, sepia: false, brightness: 100 })}
                              className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 rounded-xl border border-red-100 transition-all font-bold text-[11px] uppercase tracking-widest"
                            >
                              <RotateCcw size={12} /> Resetar Efeitos
                            </button>

                            {/* Botão Aplicar Filtros a Todas */}
                            <div className="border-neutral-100">
                              <button
                                onClick={applyFiltersToAll}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-neutral-50 hover:bg-neutral-200 hover:text-black text-neutral-700 rounded-xl border border-neutral-100 transition-all font-bold text-[11px] uppercase tracking-widest"
                              >
                                <Wand2 size={14} /> Aplicar Efeitos a Todas
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </motion.section>
            ) : (
              /* Estado Vazio */
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-[32px] p-10 md:p-16 flex flex-col items-center justify-center text-center space-y-5"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-neutral-100">
                  <MousePointer2 size={24} className="text-neutral-300" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400">Selecione uma foto</h3>
                  <p className="text-[10px] font-medium text-neutral-400/80 max-w-[180px] leading-relaxed">
                    Clique em qualquer Polaroid na folha para começar a editar.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col items-center gap-4 md:gap-8 w-full">
          {/* Preview Area */}
          <div className="flex flex-col items-center gap-4 md:gap-8 w-full overflow-x-auto pb-20 px-4">
            <div className="no-print flex flex-col sm:flex-row items-center justify-between w-full max-w-[210mm] gap-4" data-html2canvas-ignore>
              <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <Layout size={18} className="text-neutral-400" />
                  <span className="text-sm font-bold text-neutral-600">Preview A4</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-neutral-200 shadow-sm w-full sm:w-auto justify-between sm:justify-start">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">Zoom</span>
                  <input
                    type="range" min="0.2" max="1.0" step="0.05"
                    value={previewScale}
                    onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
                    className="w-24 md:w-32 h-1 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-black"
                  />
                  <span className="text-[10px] font-bold text-neutral-900 w-8">{Math.round(previewScale * 100)}%</span>
                </div>
              </div>
              <div className="text-xs font-medium text-neutral-400 bg-neutral-100 px-3 py-1 rounded-full whitespace-nowrap">
                {photos.length} de 8 fotos
              </div>
            </div>

            {/* A4 Sheet Wrapper to handle scaling layout */}
            <div
              className="relative shadow-2xl shadow-black/10 transition-all duration-300 z-10 mx-auto"
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

      {/* NOVO INPUT PARA FUNDOS */}
      <input
        type="file"
        ref={backgroundInputRef}
        onChange={handleBackgroundUpload}
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
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Photo in Cube &copy; 2026</span>
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
