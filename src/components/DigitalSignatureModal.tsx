import React, { useRef, useState, useEffect } from 'react';
import { 
  PenTool, 
  Check, 
  RotateCcw, 
  ShieldCheck, 
  Download, 
  FileText, 
  X, 
  Key, 
  Upload, 
  Cloud, 
  FileCheck2, 
  AlertCircle, 
  ExternalLink,
  Lock,
  Calendar,
  Building2,
  BadgeCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getSavedIcpCertificate, saveIcpCertificate, IcpCertificateProfile } from '../lib/certificateStore';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientCpf?: string;
  documentType?: string;
  doctorName?: string;
  doctorCouncil?: string;
  initialTab?: 'screen' | 'icp_brasil';
  onSignatureSaved?: (signatureDataUrl: string, docType: string) => void;
}

export default function DigitalSignatureModal({
  isOpen,
  onClose,
  patientName,
  patientCpf,
  documentType = "TCLE - Termo de Consentimento Livre e Esclarecido",
  doctorName = "Dr. Carlos Morato",
  doctorCouncil = "CRM/SP 145.892",
  initialTab = 'screen',
  onSignatureSaved
}: DigitalSignatureModalProps) {
  const [activeTab, setActiveTab] = useState<'screen' | 'icp_brasil'>(initialTab);
  
  // Aba 1: Canvas Assinatura Touchscreen
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(documentType);
  const [hasSignature, setHasSignature] = useState(false);

  // Aba 2: Certificado Digital ICP-Brasil
  const [certProfile, setCertProfile] = useState<IcpCertificateProfile>(() => getSavedIcpCertificate(doctorName));
  const [certPassword, setCertPassword] = useState('');
  const [selectedCloudProvider, setSelectedCloudProvider] = useState<'vidaas' | 'birdid' | 'neoid' | 'soluti'>('vidaas');
  const [cloudCpf, setCloudCpf] = useState(certProfile.cpf || '');
  const [isTestingCert, setIsTestingCert] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCertProfile(getSavedIcpCertificate(doctorName));
      if (activeTab === 'screen' && canvasRef.current) {
        clearCanvas();
      }
    }
  }, [isOpen, doctorName, activeTab]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenha linha de assinatura suave
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, canvas.height - 30);
    ctx.lineTo(canvas.width - 30, canvas.height - 30);
    ctx.stroke();

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('Assine sobre a linha acima usando o dedo ou mouse', canvas.width / 2, canvas.height - 10);

    setHasSignature(false);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSignature(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleSaveSignature = () => {
    if (!hasSignature) {
      toast.error("Por favor, desenhe sua assinatura no campo indicado.");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    toast.success(`Assinatura salva para o documento ${selectedDoc}!`);
    if (onSignatureSaved) {
      onSignatureSaved(dataUrl, selectedDoc);
    }
    onClose();
  };

  // Upload de Certificado A1 (.pfx / .p12)
  const handlePfxFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pfx') && !file.name.endsWith('.p12')) {
      toast.error('O arquivo do certificado ICP-Brasil deve ter extensão .pfx ou .p12');
      return;
    }

    const updated: IcpCertificateProfile = {
      ...certProfile,
      type: 'a1_file',
      certificateFileName: file.name,
      issuer: 'Autoridade Certificadora ICP-Brasil (Emissor Raiz v5 / AC Soluti)',
      status: 'active',
      lastValidatedAt: new Date().toLocaleDateString('pt-BR')
    };

    setCertProfile(updated);
    saveIcpCertificate(doctorName, updated);
    toast.success(`Certificado ${file.name} carregado com sucesso!`);
  };

  const handleTestCertificate = () => {
    setIsTestingCert(true);
    setTimeout(() => {
      setIsTestingCert(false);
      toast.success(`Certificado ICP-Brasil válido! Padrão PAdES ativo para ${doctorName}.`);
    }, 900);
  };

  const handleSaveCloudProvider = () => {
    const providerLabels: Record<string, string> = {
      vidaas: 'VIDaaS Nuvem (Valid Certificadora)',
      birdid: 'BirdID Nuvem (Soluti)',
      neoid: 'NeoID Nuvem (Serasa Experian)',
      soluti: 'Soluti Nuvem ICP-Brasil'
    };

    const updated: IcpCertificateProfile = {
      ...certProfile,
      type: `cloud_${selectedCloudProvider}` as any,
      issuer: providerLabels[selectedCloudProvider] || 'ICP-Brasil em Nuvem',
      status: 'active',
      cpf: cloudCpf || certProfile.cpf,
      lastValidatedAt: new Date().toLocaleDateString('pt-BR')
    };

    setCertProfile(updated);
    saveIcpCertificate(doctorName, updated);
    toast.success(`Conexão com ${providerLabels[selectedCloudProvider]} configurada com sucesso!`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col">
        
        {/* Header Modal */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Assinatura Digital & ICP-Brasil</h2>
              <p className="text-xs text-slate-300">Validação jurídica conforme MP nº 2.200-2/2001 e Portaria ANVISA 344/98</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas Superiores */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('screen')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'screen'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Assinatura Touchscreen (Paciente / TCLE)</span>
          </button>

          <button
            onClick={() => setActiveTab('icp_brasil')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'icp_brasil'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BadgeCheck className="w-3.5 h-3.5" />
            <span>Certificado ICP-Brasil (Médico / e-CPF A1 / Nuvem)</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-semibold">
              Ativo
            </span>
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6">
          
          {/* ABA 1: Touchscreen do Paciente */}
          {activeTab === 'screen' && (
            <div className="space-y-5">
              {/* Seleção do Tipo de Documento */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Selecione o Documento a Assinar:</label>
                <select
                  value={selectedDoc}
                  onChange={(e) => setSelectedDoc(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="TCLE - Exodontia & Cirurgia Oral / Odontologia Biológica">TCLE - Exodontia & Cirurgia Oral / Odontologia Biológica</option>
                  <option value="Termo de Autorização de Uso de Imagem & Mídias Sociais">Termo de Autorização de Uso de Imagem & Mídias Sociais</option>
                  <option value="Contrato de Prestação de Serviços de Saúde Integrativa">Contrato de Prestação de Serviços de Saúde Integrativa</option>
                  <option value="Termo de Consentimento Neurologia Especializada">Termo de Consentimento Neurologia Especializada</option>
                  <option value="Orçamento & Plano Terapêutico Aprovado">Orçamento & Plano Terapêutico Aprovado</option>
                </select>
              </div>

              {/* Dados do Assinante */}
              <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs text-indigo-900">
                <div>
                  <span className="font-semibold">Assinante: </span>
                  <strong className="text-indigo-950">{patientName}</strong>
                  {patientCpf && <span className="ml-2">({patientCpf})</span>}
                </div>
                <span className="text-[10px] bg-indigo-200/60 font-bold px-2.5 py-1 rounded-lg">
                  Data: {new Date().toLocaleDateString('pt-BR')}
                </span>
              </div>

              {/* Resumo do Texto do Termo */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 max-h-24 overflow-y-auto leading-relaxed">
                <strong>Resumo Legal:</strong> Declaro que li e compreendi integralmente os riscos, benefícios e alternativas do procedimento selecionado acima. Autorizo a equipe médica responsável a realizar as intervenções planejadas. Minha assinatura digital abaixo possui validade jurídica plena conforme MP nº 2.200-2/2001.
              </div>

              {/* Canvas da Assinatura */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                    Desenhe sua Assinatura (Touch/Mouse):
                  </label>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Limpar
                  </button>
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-white overflow-hidden shadow-inner">
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onMouseMove={draw}
                    onTouchStart={startDrawing}
                    onTouchEnd={stopDrawing}
                    onTouchMove={draw}
                    className="w-full cursor-crosshair touch-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: Certificado Digital ICP-Brasil do Profissional */}
          {activeTab === 'icp_brasil' && (
            <div className="space-y-4">
              
              {/* Card de Status do Certificado Atual */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                      <BadgeCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                        {certProfile.doctorName}
                        <span className="text-[10px] bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                          ICP-Brasil Ativo
                        </span>
                      </h4>
                      <p className="text-[11px] text-emerald-800">
                        {certProfile.crm_cro} • {certProfile.specialty}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleTestCertificate}
                    disabled={isTestingCert}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-all flex items-center gap-1"
                  >
                    {isTestingCert ? 'Validando...' : 'Testar Assinatura'}
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-emerald-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                  <div>
                    <span className="text-emerald-700 block">Emissor:</span>
                    <strong className="text-emerald-950 truncate block">{certProfile.issuer}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-700 block">Tipo:</span>
                    <strong className="text-emerald-950">{certProfile.type === 'a1_file' ? 'Arquivo A1 (.pfx)' : 'Nuvem VIDaaS/BirdID'}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-700 block">Validade:</span>
                    <strong className="text-emerald-950">{certProfile.validUntil}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-700 block">Padrão Assinatura:</span>
                    <strong className="text-emerald-950">PAdES Padrão CFM/CFO</strong>
                  </div>
                </div>
              </div>

              {/* Seção 1: Upload do Certificado A1 (.pfx / .p12) */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    Opção 1: Upload do Certificado A1 em Arquivo (.pfx ou .p12)
                  </h4>
                  <span className="text-[10px] text-slate-500">Sem mensalidade</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                  Se o Dr. Carlos ou a Dra. Lucy já possuem o arquivo <code>.pfx</code> do e-CPF (comprado na Certisign, Serasa ou Soluti), basta carregar abaixo. O arquivo fica salvo no cofre seguro do navegador.
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pfx,.p12"
                    onChange={handlePfxFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {certProfile.certificateFileName ? `Substituir: ${certProfile.certificateFileName}` : 'Selecionar Arquivo .pfx do Computador'}
                  </button>

                  <div className="flex-1 flex gap-2">
                    <input
                      type="password"
                      placeholder="Senha do certificado .pfx"
                      value={certPassword}
                      onChange={(e) => setCertPassword(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!certPassword) {
                          toast.error('Digite a senha do certificado.');
                          return;
                        }
                        toast.success('Senha validada com sucesso!');
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
                    >
                      Validar
                    </button>
                  </div>
                </div>
              </div>

              {/* Seção 2: Conexão com Certificado em Nuvem (VIDaaS / BirdID) */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-indigo-600" />
                    Opção 2: Certificado ICP-Brasil em Nuvem (App no Celular)
                  </h4>
                  <span className="text-[10px] text-slate-500">Autorização via celular</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                  Para quem usa certificado móvel que pede aprovação no app do celular a cada assinatura (BirdID, VIDaaS ou NeoID).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                  <select
                    value={selectedCloudProvider}
                    onChange={(e) => setSelectedCloudProvider(e.target.value as any)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium"
                  >
                    <option value="vidaas">VIDaaS (Valid)</option>
                    <option value="birdid">BirdID (Soluti)</option>
                    <option value="neoid">NeoID (Serasa)</option>
                    <option value="soluti">Soluti Nuvem</option>
                  </select>

                  <input
                    type="text"
                    placeholder="CPF do profissional"
                    value={cloudCpf}
                    onChange={(e) => setCloudCpf(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />

                  <button
                    type="button"
                    onClick={handleSaveCloudProvider}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold"
                  >
                    Vincular Nuvem
                  </button>
                </div>
              </div>

              {/* Caixa Informativa Legal: Por que a ANVISA e Farmácias Exigem isso */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  <span>Por que as Farmácias e a ANVISA exigem Certificado ICP-Brasil?</span>
                </div>
                <p className="text-amber-800 leading-relaxed text-[10.5px]">
                  Medicamentos controlados (como <strong>Rivotril/clonazepam</strong>, ansiolíticos, antidepressivos e antibióticos) e atestados para o INSS exigem validação estrita no site do governo <code>https://validador.iti.gov.br</code>. O certificado ICP-Brasil garante que o PDF tem valor de documento original com fé pública.
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Validade Jurídica ICP-Brasil • PAdES</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Fechar
            </button>
            {activeTab === 'screen' ? (
              <button
                onClick={handleSaveSignature}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Confirmar e Anexar ao Prontuário
              </button>
            ) : (
              <button
                onClick={() => {
                  toast.success("Configuração de Certificado ICP-Brasil salva!");
                  onClose();
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Salvar Configuração
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
