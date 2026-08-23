import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, X, Check, Loader2, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface UserProfileModalProps {
  user: {
    email: string;
    id: string;
    role: 'admin' | 'doctor' | 'receptionist';
    status: 'pending' | 'approved';
    full_name?: string;
    avatar_url?: string;
  } | null;
  onClose: () => void;
  onUpdateUser: (updatedUser: any) => void;
}

export default function UserProfileModal({ user, onClose, onUpdateUser }: UserProfileModalProps) {
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Carrega avatar salvo no localStorage se existir
    if (user?.email) {
      const storedAvatar = localStorage.getItem(`ambulatorio_user_avatar_${user.email.toLowerCase().trim()}`);
      if (storedAvatar && !avatarPreview) {
        setAvatarPreview(storedAvatar);
      }
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecione um arquivo de imagem válido (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem é muito grande. Escolha uma imagem de até 5MB.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      setAvatarPreview(base64Data);
      setIsUploading(false);
      toast.success('Foto carregada! Clique em "Salvar Alterações" para confirmar.');
    };
    reader.onerror = () => {
      setIsUploading(false);
      toast.error('Erro ao ler a imagem.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const emailKey = user.email ? user.email.toLowerCase().trim() : 'default';
      
      // Salva localmente para persistência imediata e offline
      if (avatarPreview) {
        localStorage.setItem(`ambulatorio_user_avatar_${emailKey}`, avatarPreview);
      } else {
        localStorage.removeItem(`ambulatorio_user_avatar_${emailKey}`);
      }

      const updatedUserObj = {
        ...user,
        full_name: fullName.trim() || user.full_name || user.email,
        avatar_url: avatarPreview || undefined
      };

      // Tenta atualizar no Supabase se houver conexão e tabela configurada
      try {
        if (user.id) {
          await supabase
            .from('profiles')
            .update({
              full_name: fullName.trim(),
              avatar_url: avatarPreview
            })
            .eq('id', user.id);
        }
      } catch (err) {
        console.warn('Atualização remota do perfil no Supabase:', err);
      }

      onUpdateUser(updatedUserObj);
      toast.success('Perfil e foto atualizados com sucesso!');
      onClose();
    } catch (error: any) {
      toast.error('Erro ao salvar alterações: ' + (error.message || 'Tente novamente'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Meu Perfil & Foto</h3>
            <p className="text-xs text-slate-500">Personalize sua foto de perfil exibida no sistema</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="py-6 space-y-6">
          
          {/* Avatar Upload Area */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={fullName || user?.full_name || 'Foto de Perfil'}
                  className="w-24 h-24 rounded-3xl object-cover border-2 border-blue-500 shadow-md ring-4 ring-blue-50"
                />
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md ring-4 ring-blue-50">
                  {fullName ? fullName.charAt(0).toUpperCase() : (user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'M')}
                </div>
              )}

              {/* Hover overlay button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 text-white rounded-3xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Clique para trocar a foto"
              >
                <Camera size={22} />
                <span className="text-[10px] font-bold mt-1">Alterar Foto</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all border border-blue-200/80 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                <span>{avatarPreview ? 'Trocar Foto' : 'Escolher Foto'}</span>
              </button>

              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all border border-red-200/80 flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Remover foto e usar iniciais"
                >
                  <Trash2 size={13} />
                  <span>Remover</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Formatos recomendados: PNG, JPG ou WebP (máx. 5MB)</p>
          </div>

          {/* User Details Form */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo / Como deseja ser chamado</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Dr. Marco Duarte"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">E-mail</label>
                <input
                  type="text"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl text-xs font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Cargo / Função</label>
                <input
                  type="text"
                  value={user?.role === 'admin' ? 'Administrador' : (user?.role === 'doctor' ? 'Médico' : 'Recepção')}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl text-xs font-medium cursor-not-allowed uppercase"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isUploading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            <span>Salvar Alterações</span>
          </button>
        </div>

      </div>
    </div>
  );
}
