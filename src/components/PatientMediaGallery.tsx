import { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  ZoomIn, 
  Download, 
  FolderOpen, 
  Image as ImageIcon, 
  Maximize2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MediaItem {
  id: string;
  title: string;
  type: 'tomography' | 'radiograph' | 'photo' | 'document';
  url: string;
  date: string;
  description?: string;
}

const DEFAULT_SAMPLE_MEDIA: MediaItem[] = [
  {
    id: '1',
    title: 'Tomografia Computadorizada de Feixe Cônico (Cone Beam)',
    type: 'tomography',
    url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=1000',
    date: '04/08/2026',
    description: 'Documentação Ortodôntica e Tomografia Maxilofacial Completa - Aretusa Colagrande'
  },
  {
    id: '2',
    title: 'Fotografia Extraoral de Rosto (Sorriso Frontal)',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1000',
    date: '04/08/2026',
    description: 'Análise Facial & Planejamento de Harmonização/Odontologia Biológica'
  },
  {
    id: '3',
    title: 'Radiografia Panorâmica & Periapical Dente 22',
    type: 'radiograph',
    url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=1000',
    date: '16/06/2026',
    description: 'Avaliação da crista óssea e biocompatibilidade'
  }
];

export default function PatientMediaGallery({ 
  patientName, 
  onClose 
}: { 
  patientName: string; 
  onClose?: () => void;
}) {
  const [items, setItems] = useState<MediaItem[]>(DEFAULT_SAMPLE_MEDIA);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(DEFAULT_SAMPLE_MEDIA[0]);
  const [activeTab, setActiveTab] = useState<'all' | 'tomography' | 'radiograph' | 'photo'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'tomography' | 'radiograph' | 'photo' | 'document'>('tomography');
  const [newUrl, setNewUrl] = useState('');

  const filteredItems = items.filter(item => {
    if (activeTab === 'all') return true;
    return item.type === activeTab;
  });

  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) {
      toast.error('Informe o título do anexo');
      return;
    }
    const newItem: MediaItem = {
      id: Date.now().toString(),
      title: newTitle,
      type: newCategory,
      url: newUrl || 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=1000',
      date: new Date().toLocaleDateString('pt-BR'),
      description: 'Anexo adicionado ao prontuário do paciente'
    };
    setItems([newItem, ...items]);
    setSelectedItem(newItem);
    setNewTitle('');
    setNewUrl('');
    setShowUploadModal(false);
    toast.success('Imagem/Exame anexado com sucesso!');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
      {/* Top Gallery Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold uppercase tracking-wider">
              Anexos & Exames de Imagem
            </span>
            <span className="text-xs text-slate-400 font-medium">• {patientName}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-1">Galeria Radiológica e Documentação do Paciente</h2>
          <p className="text-xs text-slate-500">Visualização de Tomografias, Raio-X, Fotografia de Rosto e Documentos Ortodônticos.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95"
          >
            <Upload size={16} />
            Anexar Nova Imagem / Tomografia
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todos ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('tomography')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'tomography'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Tomografias (TC)
        </button>
        <button
          onClick={() => setActiveTab('radiograph')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'radiograph'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Radiografias / Raio-X
        </button>
        <button
          onClick={() => setActiveTab('photo')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'photo'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Fotos Extraorais / Intraorais
        </button>
      </div>

      {/* Main Dual Area: Enlarged Viewer & Thumbnails Strip */}
      {selectedItem ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Large Image Display */}
          <div className="lg:col-span-2 bg-slate-950 rounded-2xl p-4 flex flex-col justify-between min-h-[420px] relative group overflow-hidden border border-slate-800">
            <div className="flex items-center justify-between text-white text-xs z-10 bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-white/10">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-emerald-400" />
                <span className="font-bold truncate max-w-[260px]">{selectedItem.title}</span>
              </div>
              <span className="text-slate-400">{selectedItem.date}</span>
            </div>

            <div className="my-auto py-4 flex items-center justify-center overflow-hidden">
              <img 
                src={selectedItem.url} 
                alt={selectedItem.title} 
                className="max-h-[380px] w-auto object-contain rounded-lg transition-transform duration-300 group-hover:scale-[1.02] shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="text-white text-xs z-10 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-white/10 flex items-center justify-between">
              <p className="text-slate-300 italic text-[11px]">{selectedItem.description}</p>
              <div className="flex items-center gap-2">
                <a 
                  href={selectedItem.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                  title="Abrir em tamanho real"
                >
                  <Maximize2 size={14} />
                </a>
              </div>
            </div>
          </div>

          {/* Thumbnail List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Documentos na Pasta</h3>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar-emerald">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                    selectedItem.id === item.id
                      ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="w-16 h-16 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-200">
                    <img 
                      src={item.url} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{item.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.date}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-200 text-slate-700">
                      {item.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <FolderOpen size={40} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-500">Nenhum exame cadastrado</p>
          <p className="text-xs text-slate-400">Clique em "Anexar Nova Imagem" para subir a tomografia ou foto do paciente.</p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Anexar Novo Documento Radiológico</h3>
              <button onClick={() => setShowUploadModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMedia} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título do Exame / Documento</label>
                <input
                  type="text"
                  placeholder="Ex: Tomografia Cone Beam - Maxila Superior"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                >
                  <option value="tomography">Tomografia (TC)</option>
                  <option value="radiograph">Radiografia / Raio-X</option>
                  <option value="photo">Foto Extraoral / Rosto</option>
                  <option value="document">Documentação Ortodôntica</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Link ou URL da Imagem (Opcional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Se deixar em branco, usaremos uma imagem radiológica de demonstração.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                >
                  Salvar Anexo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
