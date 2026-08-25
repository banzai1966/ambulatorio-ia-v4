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

export async function generateClinicalSummary(messages: any[]): Promise<ClinicalSummary> {
  try {
    const response = await axios.post('/api/generate-summary', { messages });
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

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
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
      1. PRESCRIÇÃO MÉDICA (RECEITUÁRIO): Deve conter EXCLUSIVAMENTE medicamentos, fórmulas, suplementos ativos prescritos e condutas com posologias para o paciente tomar (ex: "Metilcobalamina 1.000 mcg", "Coenzima Q10 100 mg", "Magnésio Treonato 250 mg", "Vitamina D3 10.000 UI/dia").
         - NUNCA COLOQUE RESULTADOS DE EXAMES DE SANGUE DENTRO DA 'prescricao'!
      2. EXAME NEUROLÓGICO:
         - Reflexos de Wexler: Mapeie os reflexos testados (0 a 4+). Se referir hiper-reflexia à direita (+/4+ ou 3+/4+), coloque "3+" em biceps_d e estiloradial_d.
         - Força Muscular / Tônus / Trofismo: Se normal, preencha todos (face, lingua, msd, mse, mid, mie, coluna) com tonus="Normal", trofismo="Normal", mov_anormais="Ausente", deformidades="Ausente", fatigabilidade="Grau V".
         - Nervos Cranianos: Todos de II a XII como "Preservado".
         - Marcha: "normal" se sem alterações/atípica, ou "alterada" se patológica.
      3. CHECKLIST INTEGRATIVO (MAPEAMENTO EXATO):
         - Coenzima Q10 -> suplementos.coenzima_q10: "100 mg" (ou dose citada)
         - Ácido Fólico / Metilfolato -> suplementos.acido_folico: "400 mcg"
         - Vitamina B12 / Metilcobalamina / Complexo B -> suplementos.vit_b3_b6: "1.000 mcg" (ou valor de exame se citado)
         - Vitamina D3 -> vitaminas_minerais.vit_d3: "22 ng/ml" (ou dose/valor citado)
         - Cálcio, Magnésio, Zinco / Magnésio Treonato -> vitaminas_minerais.ca_mg_zn: "250 mg" (ou valor de exame)
         - Homocisteína -> neurotransmissores_hormonios.homocystine: "15.8 µmol/L"
      
      MODELO JSON OBRIGATÓRIO DE RETORNO:
      {
        "paciente_nome_completo": "Nome do paciente",
        "paciente_cpf": "",
        "paciente_data_nascimento": "",
        "especialidade": "",
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
        "mapeamento_corporal": [
           {"x": 50, "y": 15, "label": "Dor Cervical", "side": "posterior"}
        ],
        "dados_especialidade": {},
        "exame_neurologico": {
          "fascia": "típica",
          "atitude": "ativa",
          "dominancia": "D",
          "marcha": "normal",
          "escala_glasgow": 15,
          "fluencia_verbal": "45-60",
          "cognitivo": { "orient_temp": "Preservado", "orient_esp": "Preservado", "mem_imed": "Preservado", "calculo": "Preservado", "mem_evoc": "Preservado", "nomeacao": "Preservado", "repeticao": "Preservado", "leitura": "Preservado", "comando": "Preservado", "total_score": "" },
          "nervos_cranianos": { "ii": "Preservado", "iii": "Preservado", "iv": "Preservado", "vi": "Preservado", "v": "Preservado", "vii": "Preservado", "viii": "Preservado", "ix": "Preservado", "x": "Preservado", "xi": "Preservado", "xii": "Preservado", "pupilas_d": "Isocórica", "pupilas_e": "Isocórica", "fundo_olho": "normal", "campo": "Preservado" },
          "coordenacao": { "status": "normal", "lado": null, "index_nariz": false, "romberg": false, "calcanhar_joelho": false, "diadococinesia": false },
          "sensibilidade": { "cabeca": {"proprio":"Normal","vibrat":"Normal","temp":"Normal","dor":"Normal","toque":"Normal"}, "torax": {"proprio":"Normal","vibrat":"Normal","temp":"Normal","dor":"Normal","toque":"Normal"}, "mmss": {"proprio":"Normal","vibrat":"Normal","temp":"Normal","dor":"Normal","toque":"Hipoestesia C6 à D"}, "abdome": {"proprio":"Normal","vibrat":"Normal","temp":"Normal","dor":"Normal","toque":"Normal"}, "mmii": {"proprio":"Normal","vibrat":"Normal","temp":"Normal","dor":"Normal","toque":"Normal"} },
          "dermatomos_marcardos": { "C6": "hipoestesia" },
          "reflexos_wexler": { "biceps_d": "3+", "biceps_e": "2+", "estiloradial_d": "3+", "estiloradial_e": "2+", "patelar_d": "2+", "patelar_e": "2+", "aquileu_d": "2+", "aquileu_e": "2+", "axiais_face": "0", "grasping": "0", "groping": "0", "hoffmann": "0", "palmo_mentoniano": "0", "wartenberg": "0" },
          "forca_muscular": { "face": {"tonus":"Normal","trofismo":"Normal","mov_anormais":"Ausente","deformidades":"Ausente","fatigabilidade":"Grau V"}, "lingua": {"tonus":"Normal","trofismo":"Normal","mov_anormais":"Ausente","deformidades":"Ausente","fatigabilidade":"Grau V"}, "msd": {"tonus":"Normal","trofismo":"Normal","mov_anormais":"Ausente","deformidades":"Ausente","fatigabilidade":"Grau V"}, "mse": {"tonus":"Normal","trofismo":"Normal","mov_anormais":"Ausente","deformidades":"Ausente","fatigabilidade":"Grau V"}, "mid": {"tonus":"Normal","trofismo":"Normal","mov_anormais":"Ausente","deformidades":"Ausente","fatigabilidade":"Grau V"}, "mie": {"tonus":"Normal","trofismo":"Normal","mov_anormais":"Ausente","deformidades":"Ausente","fatigabilidade":"Grau V"}, "coluna": {"tonus":"Normal","trofismo":"Normal","mov_anormais":"Ausente","deformidades":"Ausente","fatigabilidade":"Grau V"} }
        },
        "checklist_integrativo": {
          "suplementos": { "coenzima_q10": "100 mg", "acido_folico": "400 mcg", "vit_b3_b6": "1.000 mcg" },
          "vitaminas_minerais": { "vit_d3": "10.000 UI", "ca_mg_zn": "250 mg" },
          "neurotransmissores_hormonios": { "homocystine": "15.8 µmol/L" }
        }
      }

      REGRAS:
      1. Siga exatamente a estrutura raiz acima. NUNCA omita a chave paciente_nome_completo ou prescricao.
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

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
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
