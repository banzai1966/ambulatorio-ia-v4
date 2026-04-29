import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Upload, Loader2, Save } from 'lucide-react';

export default function DoctorSettings({ userId }: { userId: string }) {
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSignature();
  }, [userId]);

  const fetchSignature = async () => {
    console.log("Fetching signature for userId:", userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('signature_url')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("Erro ao buscar assinatura:", error);
    } else {
      console.log("Assinatura encontrada:", data);
      if (data && data.signature_url) {
        setSignatureUrl(data.signature_url);
      }
    }
  };

  const handleUploadSignature = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/signature.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('signatures')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ signature_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setSignatureUrl(publicUrl);
      toast.success("Assinatura atualizada com sucesso!");
    } catch (err: any) {
      console.error("Erro ao fazer upload:", err);
      toast.error("Erro ao fazer upload da assinatura.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <h2 className="text-lg font-bold text-slate-800 mb-4">Configurações de Assinatura</h2>
      <div className="flex flex-col gap-4">
        {signatureUrl && (
          <div className="border rounded-lg p-2">
            <img src={signatureUrl} alt="Assinatura atual" className="h-20 object-contain" />
          </div>
        )}
        <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors w-fit">
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          <span>{signatureUrl ? 'Alterar Assinatura' : 'Upload de Assinatura'}</span>
          <input type="file" className="hidden" accept="image/*" onChange={handleUploadSignature} disabled={uploading} />
        </label>
        <p className="text-xs text-slate-500">Recomendado: Imagem com fundo transparente (PNG).</p>
      </div>
    </div>
  );
}
