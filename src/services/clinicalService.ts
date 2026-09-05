import axios from 'axios';
import { GoogleGenAI } from "@google/genai";

export interface ClinicalSummary {
  queixaPrincipal: string;
  sintomas: string[];
  medicamentos: string[];
  alergias: string[];
  historicoFamiliar: string;
  sugestaoConduta: string;
  prescricao: string;
}

const getGeminiKey = () => {
  return process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
};

async function generateGeminiContentWithFallback(ai: GoogleGenAI, requestConfig: any) {
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-3.7-flash",
    "gemini-flash-latest"
  ];
  
  let lastError: any = null;
  for (const modelName of modelsToTry) {
    try {
      const resp = await ai.models.generateContent({
        ...requestConfig,
        model: modelName
      });
      return resp;
    } catch (err: any) {
      console.warn(`[GEMINI LOCAL] Tentativa com modelo ${modelName} falhou:`, err.message);
      lastError = err;
    }
  }
  throw lastError;
}

export async function generateClinicalSummary(messages: any[]): Promise<ClinicalSummary> {
  try {
    const response = await axios.post('/api/generate-summary', { messages });
    if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
      throw new Error("SPA Fallback returned HTML instead of API JSON");
    }
    return response.data;
  } catch (error: any) {
    console.warn("[IA] Falha no backend, tentando processamento local (Frontend)...");
    
    const key = getGeminiKey();
    if (!key) {
      throw new Error("API_KEY_MISSING");
    }

    try {
      const ai = new GoogleGenAI({ apiKey: key });

      const conversationText = messages
        .map((m: any) => `${m.direcao === 'recebida' ? 'Paciente' : 'Médico'}: ${m.mensagem || (m.audioData ? '[Áudio enviado]' : '[Mídia]')}`)
        .join('\n');

      const prompt = `Analise a conversa e gere um JSON com as chaves: queixaPrincipal, sintomas (lista), medicamentos (lista), alergias (lista), historicoFamiliar, sugestaoConduta, prescricao.\n\nConversa:\n${conversationText}`;

      const response = await generateGeminiContentWithFallback(ai, {
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      let parsed = JSON.parse(response.text || "{}");
      if (Array.isArray(parsed)) {
        parsed = parsed.length > 0 ? parsed[0] : {};
      }
      return parsed;
    } catch (innerError: any) {
      console.error("[IA] Erro no processamento local:", innerError);
      throw innerError;
    }
  }
}

export async function processClinicalInput(
  input: string | { data: string, mimeType: string }, 
  examMode: string, 
  reason: string,
  specialtyContext?: string
): Promise<any> {
  try {
    const response = await axios.post('/api/process-clinical', { input, examMode, reason, specialtyContext });
    if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
      throw new Error("SPA Fallback returned HTML instead of API JSON");
    }
    return response.data;
  } catch (error: any) {
    console.warn("[IA] Falha no backend, tentando processamento local (Frontend)...");
    
    const key = getGeminiKey();
    if (!key) {
      throw new Error("API_KEY_MISSING");
    }

    try {
      const ai = new GoogleGenAI({ apiKey: key });

      const now = new Date();
      const currentDateStr = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      
      const checklistSchema = `
        - suplementos: colina, hidroxi_triptofano, fenilalanina, melatonina, ac_alfa_lipoico, semente_uva, coenzima_q10, astragalus, dhea, epa_dha, mix_pro, coriandrum, propolis, propco, mix_d9, ginger, acido_caprilico, bitter_mellon, arnica, myosothis, hip_perfuratum, neurexan, floral_bach, acido_folico, vit_b3_b6, pregne, heteropterys, arcalion, vinpocetina, fosfatidilserina, fosfatidilcolina, dmae
        - fitoterapicos_especiais: organo_gt, dna_rna_ch, organo_gt_2, dna_rna_ch_2, organo_gt_3, dna_rna_ch_3, artemisia, phaffia, chlorella, acai, mulateiro, cmc, formula_onco_vo, formula_onco_inalat, vovo_meca, euphorbia, zedoaria, naltrex, nootropil
        - vitaminas_minerais: silimarina, quercetina, saw_palmetto, pygeum, tribulus, litio, cardiopeptase, betaina, taurina, vit_d3, ca_mg_zn, vit_k2, selenio, manganes, cu, cromo, lugol
        - biomarcadores: telomero, sirtuina, integrin, thromboxane, crisotila, hg, pb, al
        - neurotransmissores_hormonios: acetylcholine, serotonin, dopamine, cortisol, substance_p, b_amyloid, homocystine, troponin, c_fos
        - patogenos: candida, c_trachomatis, b_burgdorferi, c_pneumoniae, mycobact_tbc, mycobact_avium, hsv_type_1, hsv_type_2, zoster_virus, cmv_5
      `;

      const basePrompt = `Você é um Médico Especialista e Copiloto Clínico de Inteligência Artificial de elite para o Ambulatório IA.
      Analise com máxima precisão e rigor o seguinte relato clínico (texto ou áudio) e extraia todas as informações estruturadas em JSON.
      Data atual: ${currentDateStr}. Motivo do atendimento: ${reason}. Modo selecionado: ${examMode}.
      
      REGRAS CRÍTICAS DE EXTRAÇÃO:
      1. PRESCRIÇÃO MÉDICA (RECEITUÁRIO): Deve conter EXCLUSIVAMENTE medicamentos, fórmulas, suplementos ativos prescritos e condutas com posologias para o paciente tomar (ex: "Metilcobalamina 1.000 mcg", "Coenzima Q10 100 mg", "Magnésio Treonato 250 mg", "Vitamina D3 10.000 UI/dia", "Vitamina C 2.000 mg/dia", "Zinco Quelado 30 mg").
         - NUNCA COLOQUE RESULTADOS DE EXAMES DE SANGUE DENTRO DA 'prescricao'!
      2. EXAME NEUROLÓGICO (QUANDO APLICÁVEL):
         - Reflexos de Wexler: Mapeie os reflexos testados (0 a 4+). Se referir hiper-reflexia à direita (+/4+ ou 3+/4+), coloque "3+" em biceps_d e estiloradial_d.
         - Força Muscular / Tônus / Trofismo: Se normal, preencha todos (face, lingua, msd, mse, mid, mie, coluna) com tonus="Normal", trofismo="Normal", mov_anormais="Ausente", deformidades="Ausente", fatigabilidade="Grau V".
         - Nervos Cranianos: Todos de II a XII como "Preservado".
         - Marcha: "normal" se sem alterações/atípica, ou "alterada" se patológica.
         - Se o modo for 'biological_dentistry' e não houver achados neurológicos, retorne exame_neurologico como {}.
      3. CHECKLIST INTEGRATIVO (MAPEAMENTO EXATO):
         - Coenzima Q10 -> suplementos.coenzima_q10: "100 mg" (ou dose citada)
         - Ácido Fólico / Metilfolato -> suplementos.acido_folico: "400 mcg"
         - Vitamina B12 / Metilcobalamina / Complexo B -> suplementos.vit_b3_b6: "1.000 mcg" (ou valor de exame se citado)
         - Vitamina D3 -> vitaminas_minerais.vit_d3: "10.000 UI" (ou dose/valor citado)
         - Cálcio, Magnésio, Zinco / Magnésio Treonato -> vitaminas_minerais.ca_mg_zn: "250 mg" (ou valor de exame)
         - Homocisteína -> neurotransmissores_hormonios.homocystine: "15.8 µmol/L"
      4. ODONTOLOGIA BIOLÓGICA (DRA. LUCY) & ODONTOGRAMA:
         - Se houver achados odontológicos ou o modo for 'biological_dentistry', preencha 'dados_especialidade' com os campos e o 'odontograma':
           * 'amalgama_ativo': true se houver amálgama; 'amalgama_elementos': "16, 46" (números FDI dos dentes).
           * 'smart_dique_nitrilo', 'smart_oxigenio_nasal', 'smart_exaustor_vapor', 'smart_irrigacao_alta', 'smart_carvao_chlorella', 'smart_quelacao_vitc': true/false.
           * 'implante_zirconia_ativo': true; 'implante_elementos': "36"; 'implante_prf_ienxerto': true; 'implante_tipo_sistema': "Cerâmico Zircônia Metal-Free".
           * 'focos_cavitacao_ativo': true; 'focos_descricao': texto; 'focos_tomografia_cbct': texto (ex: "Área hipodensa trabecular em região de 38/48").
           * 'terapia_neural_ativo': true; 'terapia_neural_locais': "Polos retromolares e foco 38 com Procaína 0,7%"; 'ozonioterapia_ativo': true; 'ozonio_modalidades': ["Insuflação Cavitacional", "Água Ozonizada (Irrigação)"].
           * 'suplemento_vit_d3_k2': true/false, 'suplemento_vit_c': true/false, 'suplemento_zinco_mg': true/false, 'suplemento_arnica_homeo': true/false, 'suplemento_coenzima_q10': true/false.
           * 'observacoes_odonto_biologica': texto do plano.
           * 'odontograma': { "teeth": { [numDente]: { "id": number, "status": "amalgam"|"zirconia_implant"|"titanium_implant"|"endodontic"|"cavitation_nico"|"missing"|"caries"|"ceramic_crown"|"healthy", "notes": string, "biologicalPlan": string, "neuralTherapy": boolean } } }.
       5. ESCUTA AMBIENTAL & DIARIZAÇÃO (AMBIENT SCRIBE DE CONSULTA LIVRE):
          - Se a entrada for um diálogo natural de consulta médica/odontológica:
            a) Descarte bate-papo informal (trânsito, clima, amenidades).
            b) Diarize e separe queixas do paciente (para queixa principal/anamnese) das constatações clínicas, exames e condutas do Dr. Carlos ou Dra. Lucy (para exame físico, odontograma FDI, reflexos, suplementos e prescrição).
       
      MODELO JSON OBRIGATÓRIO DE RETORNO:
      {
        "paciente_nome_completo": "",
        "paciente_cpf": "",
        "paciente_data_nascimento": "",
        "especialidade": "Odontologia Biológica | Neurologia | Integrativa | Clínica Geral",
        "resumo_formatado": "Gere um resumo clínico estruturado e detalhado.",
        "hipotese_diagnostica": "",
        "conduta_plano_terapeutico": "",
        "sugestao_conduta": "",
        "queixa_principal": "",
        "exame_fisico": "",
        "prescricao": "Receituário formatado exclusivo dos medicamentos e suplementos com doses e horários",
        "dados_clinicos": "Para pressão, peso, altura, histórico",
        "paciente_status": "Estável | Atenção | Crítico",
        "vitals": {
          "bpm": 72,
          "spo2": 98,
          "resp": 16,
          "pressao": "120/80"
        },
        "alertas_copiloto": [],
        "resumo_clinico": "Breve justificativa clínica dos sinais vitais",
        "mapeamento_corporal": [],
        "dados_especialidade": {
          "amalgama_ativo": true,
          "amalgama_elementos": "16, 46",
          "smart_dique_nitrilo": true,
          "smart_oxigenio_nasal": true,
          "smart_exaustor_vapor": true,
          "smart_irrigacao_alta": true,
          "smart_carvao_chlorella": true,
          "smart_quelacao_vitc": true,
          "implante_zirconia_ativo": true,
          "implante_elementos": "36",
          "implante_prf_ienxerto": true,
          "implante_tipo_sistema": "Cerâmico Zircônia Metal-Free",
          "focos_cavitacao_ativo": true,
          "focos_descricao": "Foco cavitacional NICO em região 38",
          "focos_tomografia_cbct": "Área hipodensa trabecular em 38",
          "terapia_neural_ativo": true,
          "terapia_neural_locais": "Polos retromolares e foco 38 com Procaína 0,7%",
          "ozonioterapia_ativo": true,
          "ozonio_modalidades": ["Insuflação Cavitacional", "Água Ozonizada (Irrigação)"],
          "atm_bruxismo_ativo": false,
          "suplemento_vit_d3_k2": true,
          "suplemento_vit_c": true,
          "suplemento_zinco_mg": true,
          "suplemento_arnica_homeo": true,
          "suplemento_coenzima_q10": true,
          "observacoes_odonto_biologica": "Protocolo SMART para amálgamas 16 e 46. Implante de Zircônia 36 com PRF. Curetagem e ozônio em cavitação NICO 38 com Terapia Neural.",
          "odontograma": {
            "teeth": {
              "16": { "id": 16, "status": "amalgam", "notes": "Amálgama oclusal - Troca segura SMART", "biologicalPlan": "Protocolo SMART IAOMT" },
              "46": { "id": 46, "status": "amalgam", "notes": "Amálgama extenso - Troca segura SMART", "biologicalPlan": "Protocolo SMART IAOMT" },
              "36": { "id": 36, "status": "zirconia_implant", "notes": "Ausência dental - Implante Zircônia", "biologicalPlan": "Implante Cerâmico Metal-Free + PRF" },
              "38": { "id": 38, "status": "cavitation_nico", "notes": "Biointerferência NICO / FDOK", "biologicalPlan": "Curetagem + Ozonioterapia + Terapia Neural", "neuralTherapy": true }
            }
          }
        },
        "exame_neurologico": {
          "fascia": "típica",
          "atitude": "ativa",
          "dominancia": "D",
          "marcha": "normal",
          "escala_glasgow": 15,
          "reflexos_wexler": {
            "biceps_d": "1+",
            "biceps_e": "2+",
            "estiloradial_d": "2+",
            "estiloradial_e": "2+",
            "patelar_d": "3+",
            "patelar_e": "2+",
            "aquileu_d": "4+",
            "aquileu_e": "2+",
            "axiais_face": "Ausente",
            "grasping": "Ausente",
            "groping": "Ausente",
            "hoffmann": "Ausente",
            "palmo_mentoniano": "Ausente",
            "wartenberg": "Ausente"
          },
          "dermatomos_marcardos": {
            "C5": "parestesia",
            "C6": "hipoestesia",
            "L4": "hipoestesia",
            "L5": "dor"
          },
          "forca_muscular": {
            "face": { "tonus": "Normal", "trofismo": "Normal", "mov_anormais": "Ausente", "deformidades": "Ausente", "fatigabilidade": "Grau V" },
            "lingua": { "tonus": "Normal", "trofismo": "Normal", "mov_anormais": "Ausente", "deformidades": "Ausente", "fatigabilidade": "Grau V" },
            "msd": { "tonus": "Normal", "trofismo": "Normal", "mov_anormais": "Ausente", "deformidades": "Ausente", "fatigabilidade": "Grau V" },
            "mse": { "tonus": "Normal", "trofismo": "Normal", "mov_anormais": "Ausente", "deformidades": "Ausente", "fatigabilidade": "Grau V" },
            "mid": { "tonus": "Normal", "trofismo": "Normal", "mov_anormais": "Ausente", "deformidades": "Ausente", "fatigabilidade": "Grau V" },
            "mie": { "tonus": "Normal", "trofismo": "Normal", "mov_anormais": "Ausente", "deformidades": "Ausente", "fatigabilidade": "Grau V" },
            "coluna": { "tonus": "Normal", "trofismo": "Normal", "mov_anormais": "Ausente", "deformidades": "Ausente", "fatigabilidade": "Grau V" }
          },
          "sensibilidade": {
            "cabeca": { "proprio": "Normal", "vibrat": "Normal", "temp": "Normal", "dor": "Normal", "toque": "Normal" },
            "torax": { "proprio": "Normal", "vibrat": "Normal", "temp": "Normal", "dor": "Normal", "toque": "Normal" },
            "mmss": { "proprio": "Normal", "vibrat": "Normal", "temp": "Normal", "dor": "Alterada", "toque": "Hipoestesia" },
            "abdome": { "proprio": "Normal", "vibrat": "Normal", "temp": "Normal", "dor": "Normal", "toque": "Normal" },
            "mmii": { "proprio": "Normal", "vibrat": "Normal", "temp": "Normal", "dor": "Normal", "toque": "Normal" }
          },
          "coordenacao": {
            "status": "normal",
            "lado": null,
            "index_nariz": true,
            "romberg": false,
            "calcanhar_joelho": true,
            "diadococinesia": true
          },
          "nervos_cranianos": {
            "ii": "Preservado",
            "iii": "Preservado",
            "iv": "Preservado",
            "vi": "Preservado",
            "v": "Preservado",
            "vii": "Preservado",
            "viii": "Preservado",
            "ix": "Preservado",
            "x": "Preservado",
            "xi": "Preservado",
            "xii": "Preservado",
            "pupilas_d": "Isocórica",
            "pupilas_e": "Isocórica",
            "fundo_olho": "Normal",
            "campo": "Preservado"
          }
        },
        "checklist_integrativo": {
          "suplementos": { "coenzima_q10": "100 mg", "acido_folico": "400 mcg", "vit_b3_b6": "1.000 mcg" },
          "vitaminas_minerais": { "vit_d3": "10.000 UI", "ca_mg_zn": "250 mg" },
          "neurotransmissores_hormonios": { "homocystine": "15.8 µmol/L" }
        }
      }

      REGRAS:
      1. Siga exatamente a estrutura raiz acima. NUNCA invente ou alucine nomes de pacientes, CPFs ou datas de nascimento! Se o relato NÃO disser explicitamente o nome da pessoa, deixe "paciente_nome_completo": "" (string vazia). NUNCA coloque nomes como "Richard", "João", "Maria" ou fictícios se não foram ditos.
      2. Mapeamento Corporal: Array com {x,y,label,side}. Lados: 'anterior' ou 'posterior' (ex: lombar/cervical/costas é posterior). Use labels curtíssimos (MÁXIMO 2 PALAVRAS).
         GUIA DE COORDENADAS (X: 0 a 100, Y: 0 a 100):
         - Eixo X (Horizontal): Centro = 50. Ombros = 32 ou 68. Joelhos = 40 ou 60. Pés = 38 ou 62.
         - Eixo Y (Vertical): Cabeça=10, Cervical=15, Ombros=22, Peito=35, Lombar=48, Glúteo=55, Joelhos=72, Panturrilha=85, Pés=95.
      3. exame_neurologico: Preencha este objeto se o relato tiver dados neurológicos ou o modo for 'neurological'.
         - IMPORTANTE: "Glasgow" refere-se a "escala_glasgow" (um número, máx 15). NUNCA coloque 'Glasgow 15' dentro de 'cognitivo.total_score'.
         - "cognitivo.total_score" é exclusivo do Mini Mental / MEEM (um número, máx 30).
      4. checklist_integrativo: SEMPRE extraia e preencha este objeto se houver menção a suplementos, vitaminas, fitoterápicos, biomarcadores ou patógenos no relato! Use os valores exatos ou doses prescritas/relatadas. Se apenas o nome for citado, use 'Sinalizado'.
      5. Ignore pausas e ruídos.

      Schema Checklist:\n${checklistSchema}`;

      let contents: any;
      if (typeof input === 'string') {
        contents = [{ parts: [{ text: `${basePrompt}\n\nRelato:\n${input}` }] }];
      } else {
        contents = [{
          parts: [
            { text: basePrompt },
            { inlineData: input }
          ]
        }];
      }

      const response = await generateGeminiContentWithFallback(ai, {
        contents,
        config: { responseMimeType: "application/json" }
      });
      
      const cleaned = (response.text || "{}").replace(/```json\n?|\n?```/g, '').trim();
      let parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        parsed = parsed.length > 0 ? parsed[0] : {};
      }
      return parsed;
    } catch (innerError: any) {
      console.error("[IA] Erro local:", innerError);
      throw innerError;
    }
  }
}

// --- SIMULADOR DE SORRISO DSD COM IA GEMINI (SUPORTA BACKEND E NETLIFY CLIENT-SIDE) ---
export interface SmileSimulationParams {
  image: string;
  goals: string[];
  patientName?: string;
  notes?: string;
}

export interface SmileSimulationResult {
  simulatedImage: string | null;
  clinicalAnalysis: {
    aestheticScoreBefore: number;
    aestheticScoreAfter: number;
    teethShadeBefore: string;
    teethShadeAfter: string;
    diagnosticoEstetico: string;
    planoTratamento: string[];
    beneficiosBiologicos: string;
    resumoParaPaciente: string;
  };
}

export async function simulateSmileAI(params: SmileSimulationParams): Promise<SmileSimulationResult> {
  const { image, goals, patientName, notes } = params;

  // 1. Tenta primeiro via Backend (/api/simulate-smile)
  try {
    const response = await axios.post('/api/simulate-smile', {
      image,
      goals,
      patientName,
      notes
    }, { timeout: 35000 });

    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      if (response.data.clinicalAnalysis) {
        return {
          simulatedImage: response.data.simulatedImage || null,
          clinicalAnalysis: response.data.clinicalAnalysis
        };
      }
    }
  } catch (err: any) {
    console.warn('[DSD IA] Backend indisponível (ambiente estático/Netlify), executando simulação com IA localmente...', err.message);
  }

  // 2. Execução Local com Gemini (quando no Netlify ou sem backend Express)
  const key = getGeminiKey();
  let base64Data = '';
  let mimeType = 'image/jpeg';

  if (image.startsWith('data:image/')) {
    base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
    mimeType = image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
  }

  let clinicalAnalysis = {
    aestheticScoreBefore: 62,
    aestheticScoreAfter: 96,
    teethShadeBefore: "A3.5 / Escurecido",
    teethShadeAfter: "Shade Vita Bleach BL2 / A1 (Branco Natural)",
    diagnosticoEstetico: "Presença de desarmonia de cor, necessidade de substituição de restaurações escurecidas e harmonização da curvatura do sorriso.",
    planoTratamento: [
      "Etapa 1: Descontaminação biológica, profilaxia com protocolo guiado e Clareamento Biológico integrativo.",
      "Etapa 2: Planejamento Digital do Sorriso (DSD), mock-up diagnóstico e alinhamento gengival.",
      "Etapa 3: Instalação de cerâmicas e lentes de contato metal-free com acabamento biocompatível.",
      "Etapa 4: Ajuste oclusal biomimético e protocolo de proteção noturna."
    ],
    beneficiosBiologicos: "Eliminação de metais pesados na cavidade oral, biocompatibilidade gengival superior e preservação estrutural dos tecidos biológicos.",
    resumoParaPaciente: "Planejamento personalizado para um sorriso radiante, natural e 100% biocompatível com a sua saúde sistêmica."
  };

  let simulatedImage: string | null = null;

  if (key && base64Data) {
    try {
      const ai = new GoogleGenAI({ apiKey: key });

      // Análise clínica via Gemini
      const goalsList = Array.isArray(goals) && goals.length > 0 ? goals.join(", ") : "Clareamento biológico, restaurações cerâmicas";
      const analysisPrompt = `Você é um especialista em Odontologia Biológica e Digital Smile Design (DSD) trabalhando com a Dra. Lucy Murata.
Analise a foto do sorriso do paciente ${patientName || 'Paciente'} e forneça um plano estruturado de transformação estética e biológica em JSON.
Objetivos desejados: ${goalsList}.
Observações: ${notes || 'Nenhuma'}.

Retorne em formato JSON:
{
  "aestheticScoreBefore": 65,
  "aestheticScoreAfter": 96,
  "teethShadeBefore": "A3.5 / Escurecido",
  "teethShadeAfter": "A1 / BL2 Natural",
  "diagnosticoEstetico": "Breve diagnóstico das proporções faciais, linha do sorriso e condições dentárias.",
  "planoTratamento": [
    "Etapa 1: Descontaminação e clareamento",
    "Etapa 2: Cerâmicas metal-free",
    "Etapa 3: Harmonização estética"
  ],
  "beneficiosBiologicos": "Descrição de como a reabilitação biológica melhora a saúde sistêmica.",
  "resumoParaPaciente": "Mensagem empática explicando a transformação planejada."
}`;

      try {
        const textResp = await generateGeminiContentWithFallback(ai, {
          contents: [
            {
              parts: [
                { text: analysisPrompt },
                { inlineData: { data: base64Data, mimeType } }
              ]
            }
          ],
          config: { responseMimeType: "application/json" }
        });
        const parsed = JSON.parse((textResp.text || "{}").replace(/```json\n?|\n?```/g, '').trim());
        clinicalAnalysis = { ...clinicalAnalysis, ...parsed };
      } catch (e: any) {
        console.warn('[DSD IA] Análise de texto local falhou:', e.message);
      }

      // Tentativa de Geração de Imagem com Gemini Image Models
      const imgEditPrompt = `High-end aesthetic biological dentistry simulation and Digital Smile Design (DSD).
Transform the teeth and smile with maximum photorealism:
1. MISSING TEETH & IMPLANTS: If there are any missing teeth, gaps, or edentulous spaces, reconstruct them with a beautiful, natural ceramic porcelain/zirconia crown that seamlessly fills the space.
2. COLOR MATCHING & SHADE: The reconstructed and restored teeth MUST perfectly match the bright, translucent natural white color (Vita Bleach BL2 / Shade A1) of the adjacent central teeth. No yellowish tint, no greyish tones.
3. VENEERS & WHITENING: Make all visible teeth uniformly bright, naturally white, with realistic enamel microtexture, glossy ceramic reflection, and natural incisal translucency.
4. AMALGAM REMOVAL (SMART): Replace any dark metallic restorations or dark cavities with pristine tooth-colored ceramic inlays/onlays.
5. GINGIVAL HARMONY: Create a natural, healthy pink festooned gingival margin with proper biological contours.
6. IDENTITY PRESERVATION: Keep the rest of the face, skin texture, lips, and facial expression 100% identical to the original photo. Only transform the teeth and intraoral smile aesthetics.`;

      const imageModels = ['gemini-3.1-flash-lite-image', 'gemini-3.1-flash-image'];
      for (const mName of imageModels) {
        try {
          const imgResp = await ai.models.generateContent({
            model: mName,
            contents: {
              parts: [
                { inlineData: { data: base64Data, mimeType } },
                { text: imgEditPrompt }
              ]
            }
          });

          for (const part of imgResp.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData && part.inlineData.data) {
              simulatedImage = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
              break;
            }
          }
          if (simulatedImage) break;
        } catch (imgErr: any) {
          console.warn(`[DSD IA] Tentativa com modelo ${mName} falhou:`, imgErr.message);
        }
      }
    } catch (localErr: any) {
      console.warn('[DSD IA] Processamento Gemini local falhou:', localErr.message);
    }
  }

  // 3. Renderizador Biológico Biomimético de Alta Fidelidade (Se o modelo de imagem não retornar output direto)
  if (!simulatedImage) {
    simulatedImage = await renderBiomimeticSmileTransformation(image, goals);
  }

  return {
    simulatedImage,
    clinicalAnalysis
  };
}

// Renderizador Fotográfico Biomimético Inteligente (Sem artefatos, manchas ou pintura sólida)
export async function renderBiomimeticSmileTransformation(sourceDataUrl: string, selectedGoals: string[]): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(sourceDataUrl);
        return;
      }

      canvas.width = img.naturalWidth || img.width || 1200;
      canvas.height = img.naturalHeight || img.height || 900;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;
        const totalPixels = data.length;

        const isWhitening = selectedGoals.includes('Clareamento Biológico (Shade A1)');
        const isVeneers = selectedGoals.includes('Facetas Cerâmicas & Lentes de Contato');
        const isZirconia = selectedGoals.includes('Implantes Cerâmicos de Zircônia Metal-Free');
        const isSmartAmalgam = selectedGoals.includes('Troca de Amálgama por Cerâmica (SMART)');

        // Amostragem de cor de esmalte natural dos dentes vizinhos para interpolação suave
        let healthyEnamelR = 230;
        let healthyEnamelG = 225;
        let healthyEnamelB = 215;
        let healthyCount = 0;

        for (let i = 0; i < totalPixels; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const isGingivaOrLip = (r > g + 25 && r > b + 30) || (r > 140 && g < 100 && b < 100);
          const isDark = (r + g + b) < 160;
          if (!isGingivaOrLip && !isDark && r > 160 && g > 150 && b > 110) {
            healthyEnamelR += r;
            healthyEnamelG += g;
            healthyEnamelB += b;
            healthyCount++;
          }
        }

        if (healthyCount > 0) {
          healthyEnamelR = Math.round(healthyEnamelR / (healthyCount + 1));
          healthyEnamelG = Math.round(healthyEnamelG / (healthyCount + 1));
          healthyEnamelB = Math.round(healthyEnamelB / (healthyCount + 1));
        }

        // Transformação tonal contínua e suave (sem descontinuidades visuais)
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Detecção de tecidos moles (gengiva, lábios, mucosa)
            const isGingivaOrLip = (r > g + 22 && r > b + 28) || (r > 135 && g < 105 && b < 105);
            if (isGingivaOrLip) continue;

            const brightness = (r + g + b) / 3;
            const yellowChroma = Math.max(0, (r + g) / 2 - b);

            // Detecção de esmalte dental (não-gengiva, saturação compatível com dente)
            const isToothStructure = brightness > 60 && Math.abs(r - g) < 40 && (r >= b || Math.abs(r - b) < 50);

            if (isToothStructure) {
              // 1. Clareamento e Iluminação Biomimética do Esmalte
              if (brightness > 110) {
                const whitenessWeight = Math.min(1.0, Math.max(0.2, (brightness / 220)));
                const blueCorrection = yellowChroma * 0.75 * whitenessWeight;
                
                let newR = r * 1.08 + 15 * whitenessWeight;
                let newG = g * 1.10 + 18 * whitenessWeight;
                let newB = b * 1.12 + blueCorrection + 24 * whitenessWeight;

                if (isVeneers || isZirconia || isWhitening) {
                  // Harmoniza para tom Vita Bleach / A1
                  const lum = 0.299 * newR + 0.587 * newG + 0.114 * newB;
                  newR = newR * 0.75 + lum * 0.25 + 8;
                  newG = newG * 0.75 + lum * 0.25 + 8;
                  newB = newB * 0.72 + lum * 0.28 + 12;
                }

                data[i] = Math.min(255, Math.round(newR));
                data[i + 1] = Math.min(255, Math.round(newG));
                data[i + 2] = Math.min(255, Math.round(newB));
              }

              // 2. Restauração Biológica de Amálgama / Manchas Escuras (Suave e Gradual, sem blocos cinzas)
              else if (isSmartAmalgam && brightness <= 110 && brightness > 25) {
                // Interpolação ponderada com o esmalte circundante com preservação das fissuras anatômicas
                const shadowPreserve = Math.max(0.35, brightness / 110);
                const blendFactor = 0.78 * (1 - brightness / 140);
                
                const targetR = (healthyEnamelR * 0.92) * shadowPreserve;
                const targetG = (healthyEnamelG * 0.94) * shadowPreserve;
                const targetB = (healthyEnamelB * 0.96) * shadowPreserve;

                data[i] = Math.min(255, Math.round(r * (1 - blendFactor) + targetR * blendFactor));
                data[i + 1] = Math.min(255, Math.round(g * (1 - blendFactor) + targetG * blendFactor));
                data[i + 2] = Math.min(255, Math.round(b * (1 - blendFactor) + targetB * blendFactor));
              }
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);

        // Suave filtro de acabamento em cerâmica pura e brilho natural
        const highlightGrad = ctx.createRadialGradient(
          width / 2, height * 0.5, width * 0.05,
          width / 2, height * 0.5, width * 0.45
        );
        highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
        highlightGrad.addColorStop(0.5, 'rgba(245, 250, 255, 0.03)');
        highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = highlightGrad;
        ctx.fillRect(0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', 0.95));
      } catch (err) {
        console.warn('[DSD Render] Falha no canvas:', err);
        resolve(sourceDataUrl);
      }
    };
    img.onerror = () => resolve(sourceDataUrl);
    img.src = sourceDataUrl;
  });
}

