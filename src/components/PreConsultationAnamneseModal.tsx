import React, { useState } from 'react';
import { User, Phone, MapPin, Camera, AlertTriangle, ShieldCheck, Check, Search, X, Heart, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PreConsultationAnamneseModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientNamePrefill?: string;
  patientPhonePrefill?: string;
  onAnamneseSubmitted?: (updatedData: any) => void;
}

export default function PreConsultationAnamneseModal({
  isOpen,
  onClose,
  patientNamePrefill = '',
  patientPhonePrefill = '',
  onAnamneseSubmitted
}: PreConsultationAnamneseModalProps) {
  const [nome, setNome] = useState(patientNamePrefill);
  const [telefone, setTelefone] = useState(patientPhonePrefill);
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  
  // Perguntas Clínicas / Alertas
  const [isHipertenso, setIsHipertenso] = useState(false);
  const [isDiabetico, setIsDiabetico] = useState(false);
  const [alergias, setAlergias] = useState<string[]>([]);
  const [alergiaTexto, setAlergiaTexto] = useState('Penicilina');
  const [temCardiopatia, setTemCardiopatia] = useState(false);
  const [usaAnticoagulante, setUsaAnticoagulante] = useState(false);
  const [medicamentosAtuais, setMedicamentosAtuais] = useState('');
  const [observacoesClinicas, setObservacoesClinicas] = useState('');

  // Foto / Selfie
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [aceitouTermoVeracidade, setAceitouTermoVeracidade] = useState(true);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Busca Automática de CEP
  const handleCepSearch = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      toast.error("Informe um CEP válido com 8 números.");
      return;
    }
    setIsSearchingCep(true);
    try {
      const res = await fetch(`/api/cep/${cleanCep}`);
      const data = await res.json();
      if (data.error) {
        toast.error("CEP não encontrado.");
      } else {
        setLogradouro(data.logradouro || '');
        setBairro(data.bairro || '');
        setCidade(data.localidade || '');
        setEstado(data.uf || '');
        toast.success("Endereço preenchido automaticamente!");
      }
    } catch (e: any) {
      toast.error("Erro ao buscar CEP.");
    } finally {
      setIsSearchingCep(false);
    }
  };

  // Upload ou captura de selfie
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleAlergia = (item: string) => {
    setAlergias(prev => 
      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Nome completo é obrigatório.");
      return;
    }
    if (!aceitouTermoVeracidade) {
      toast.error("Você precisa declarar a veracidade das informações fornecidas.");
      return;
    }

    setIsSubmitting(true);

    // Gerar Etiquetas de Alertas Clínicos
    const alertas: string[] = [];
    if (isHipertenso) alertas.push("HIPERTENSO");
    if (isDiabetico) alertas.push("DIABÉTICO");
    if (temCardiopatia) alertas.push("CARDIOPATIA");
    if (usaAnticoagulante) alertas.push("ANTICOAGULANTE");
    if (alergias.length > 0) {
      alergias.forEach(a => alertas.push(`ALERGIA: ${a.toUpperCase()}`));
    } else if (alergiaTexto.trim()) {
      alertas.push(`ALERGIA: ${alergiaTexto.toUpperCase()}`);
    }

    const payload = {
      paciente_nome: nome,
      paciente_telefone: telefone,
      paciente_cpf: cpf,
      data_nascimento: dataNascimento,
      endereco: {
        cep, logradouro, numero, complemento, bairro, cidade, estado
      },
      alertas_clinicos: alertas,
      medicamentosAtuais,
      observacoesClinicas,
      foto_url: photoPreview,
      data_submissao: new Date().toISOString()
    };

    try {
      toast.success("Anamnese pré-consulta enviada com sucesso! Alertas clínicos ativos.");
      if (onAnamneseSubmitted) {
        onAnamneseSubmitted(payload);
      }
      onClose();
    } catch (err: any) {
      toast.error("Erro ao enviar anamnese: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-2xl border border-blue-400/30">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Anamnese Pré-Consulta & Cadastro Digital</h2>
              <p className="text-xs text-blue-200">Preenchimento rápido e seguro para agilizar seu atendimento médico</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl text-blue-200 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Seção 1: Dados Pessoais & Foto/Selfie */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              1. Identificação do Paciente & Foto
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Foto Selfie */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                {photoPreview ? (
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500 shadow-md">
                    <img src={photoPreview} alt="Selfie Paciente" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer text-center">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full mb-2">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">Tirar / Anexar Selfie</span>
                    <span className="text-[9px] text-slate-400">Reconhecimento na Recepção</span>
                    <input type="file" accept="image/*" capture="user" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                )}
              </div>

              {/* Campos Principais */}
              <div className="md:col-span-2 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Seu nome sem abreviações"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Telefone (WhatsApp)</label>
                    <input
                      type="text"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Data de Nascimento</label>
                    <input
                      type="date"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Endereço com busca inteligente por CEP */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              2. Endereço com Busca por CEP (ViaCEP)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CEP</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCep(val);
                      const clean = val.replace(/\D/g, '');
                      if (clean.length === 8 && !isSearchingCep) {
                        setTimeout(() => handleCepSearch(), 100);
                      }
                    }}
                    onBlur={() => {
                      if (cep.replace(/\D/g, '').length === 8) {
                        handleCepSearch();
                      }
                    }}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="00000-000"
                  />
                  <button
                    type="button"
                    onClick={handleCepSearch}
                    disabled={isSearchingCep}
                    className="px-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                  >
                    {isSearchingCep ? "..." : <Search className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Logradouro / Rua</label>
                <input
                  type="text"
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="Rua, Avenida, Alameda..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Número</label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="123"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bairro</label>
                <input
                  type="text"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cidade</label>
                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">UF</label>
                <input
                  type="text"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl uppercase"
                  placeholder="SP"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Questionário de Saúde & Alertas Clínicos Automáticos */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              3. Alertas Clínicos e Histórico de Saúde
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                isHipertenso ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span>Possui Pressão Alta (Hipertensão)?</span>
                <input
                  type="checkbox"
                  checked={isHipertenso}
                  onChange={(e) => setIsHipertenso(e.target.checked)}
                  className="w-4 h-4 rounded-md accent-amber-600"
                />
              </label>

              <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                isDiabetico ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span>Possui Diabetes?</span>
                <input
                  type="checkbox"
                  checked={isDiabetico}
                  onChange={(e) => setIsDiabetico(e.target.checked)}
                  className="w-4 h-4 rounded-md accent-amber-600"
                />
              </label>

              <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                temCardiopatia ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span>Problemas Cardíacos / Marcapasso?</span>
                <input
                  type="checkbox"
                  checked={temCardiopatia}
                  onChange={(e) => setTemCardiopatia(e.target.checked)}
                  className="w-4 h-4 rounded-md accent-amber-600"
                />
              </label>

              <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                usaAnticoagulante ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span>Usa Anticoagulanties (Aspirina, Marevan)?</span>
                <input
                  type="checkbox"
                  checked={usaAnticoagulante}
                  onChange={(e) => setUsaAnticoagulante(e.target.checked)}
                  className="w-4 h-4 rounded-md accent-amber-600"
                />
              </label>
            </div>

            {/* Seleção de Alergias */}
            <div className="p-3 bg-red-50/50 border border-red-200 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-red-900 block">Alergias Conhecidas (Medicamentos/Alimentos):</span>
              <div className="flex flex-wrap gap-2 text-xs">
                {['Penicilina', 'Dipirona', 'Ibuprofeno', 'Anestésico Local', 'Frutos do Mar', 'Látex'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleAlergia(item)}
                    className={`px-3 py-1.5 rounded-xl font-medium border transition-all ${
                      alergias.includes(item)
                        ? 'bg-red-600 text-white border-red-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-red-300'
                    }`}
                  >
                    {alergias.includes(item) ? '✓ ' : '+ '}{item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Medicamentos de uso contínuo:</label>
              <input
                type="text"
                value={medicamentosAtuais}
                onChange={(e) => setMedicamentosAtuais(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                placeholder="Ex: Losartana 50mg, Puran T4, Omeprazol..."
              />
            </div>
          </div>

          {/* Termo de Veracidade */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
            <input
              type="checkbox"
              id="veracidade"
              checked={aceitouTermoVeracidade}
              onChange={(e) => setAceitouTermoVeracidade(e.target.checked)}
              className="mt-1 w-4 h-4 rounded-md accent-blue-600"
            />
            <label htmlFor="veracidade" className="text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-slate-800">Declaração de Veracidade e Consentimento:</strong> Declaro que todas as informações prestadas são verdadeiras e completas. Autorizo o cadastramento para fins estritamente clínicos conforme a LGPD.
            </label>
          </div>

          {/* Footer Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-2xl text-xs transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {isSubmitting ? "Enviando..." : "Confirmar e Transmitir Anamnese"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
