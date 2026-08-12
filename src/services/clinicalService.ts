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

      const basePrompt = `Extraia os dados médicos da transcrição e retorne um JSON estrito seguindo este exato modelo (não mude as chaves da raiz).
      
      Data atual: ${currentDateStr}. Motivo do atendimento: ${reason}. Modo selecionado: ${examMode}.
      
      MODELO JSON OBRIGATÓRIO DE RETORNO:
      {
        "paciente_nome_completo": "Extraia o nome (ex: Marco Antônio...), se não citado, deixe vazio",
        "paciente_cpf": "",
        "paciente_data_nascimento": "",
        "especialidade": "",
        "resumo_formatado": "Gere um resumo clínico PROFISSIONAL e DETALHADO. Se for modo neurologia, inclua achados da cognição, marcha, força e nervos cranianos. Se for integrativo, destaque suplementos e bioanalise.",
        "hipotese_diagnostica": "",
        "conduta_plano_terapeutico": "",
        "sugestao_conduta": "",
        "queixa_principal": "Descreva a dor ou motivo",
        "prescricao": "Lista de medicações ditadas (ex: Colina 500mg)",
        "dados_clinicos": "Para pressão, peso, altura, histórico",
        "paciente_status": "estável | atenção | crítico (Avalie a gravidade. Se fc, spo2 ou resp fora da normalidade, use atenção ou crítico)",
        "vitals": {
          "bpm": "Extraia número (ex: 72)",
          "spo2": "Extraia número (ex: 98)",
          "resp": "Extraia número de respirações",
          "pressao": "Extraia valor de pressão arterial, ex: 120/80",
          "soroName": "Nome do soro/infusão citado",
          "soroRate": "Gotejamento ou taxa citada"
        },
        "alertas_copiloto": [
          "Gere 1 a 3 alertas médicos rápidos e inteligentes baseados na transcrição (riscos, alterações, observações clínicas cruciais)"
        ],
        "resumo_clinico": "Breve justificativa clínica dos sinais vitais extraídos",
        "mapeamento_corporal": [
           {"x": 30, "y": 40, "label": "dor no ombro direito", "side": "anterior"}
        ],
        "exame_neurologico": {
          "fascia": "atípica" | "típica",
          "atitude": "ativa" | "passiva",
          "dominancia": "D" | "E",
          "marcha": "normal" | "alterada",
          "escala_glasgow": 15,
          "fluencia_verbal": "0-15" | "15-30" | "30-45" | "45-60",
          "cognitivo": { "orient_temp": "", "orient_esp": "", "mem_imed": "", "calculo": "", "mem_evoc": "", "nomeacao": "", "repeticao": "", "leitura": "", "comando": "", "total_score": "" },
          "nervos_cranianos": { "ii": "", "iii": "", "iv": "", "vi": "", "v": "", "vii": "", "viii": "", "ix": "", "x": "", "xi": "", "xii": "", "pupilas_d": "", "pupilas_e": "", "fundo_olho": "normal"|"alterado", "campo": "" },
          "coordenacao": { "status": "normal"|"alterado", "lado": "D"|"E", "index_nariz": true|false, "romberg": true|false, "calcanhar_joelho": true|false, "diadococinesia": true|false },
          "sensibilidade": { "cabeca": {"proprio":"","vibrat":"","temp":"","dor":"","toque":""}, "torax": {"proprio":"","vibrat":"","temp":"","dor":"","toque":""}, "mmss": {"proprio":"","vibrat":"","temp":"","dor":"","toque":""}, "abdome": {"proprio":"","vibrat":"","temp":"","dor":"","toque":""}, "mmii": {"proprio":"","vibrat":"","temp":"","dor":"","toque":""} },
          "dermatomos_marcardos": { "C2": "hipoestesia", "C3": "hipoestesia", "C4": "dor", "L4": "parestesia" },
          "forca_muscular": { "face": {"tonus":"","trofismo":"","mov_anormais":"","deformidades":"","fatigabilidade":""}, "lingua": {"tonus":"","trofismo":"","mov_anormais":"","deformidades":"","fatigabilidade":""}, "msd": {"tonus":"","trofismo":"","mov_anormais":"","deformidades":"","fatigabilidade":""}, "mse": {"tonus":"","trofismo":"","mov_anormais":"","deformidades":"","fatigabilidade":""}, "mid": {"tonus":"","trofismo":"","mov_anormais":"","deformidades":"","fatigabilidade":""}, "mie": {"tonus":"","trofismo":"","mov_anormais":"","deformidades":"","fatigabilidade":""}, "coluna": {"tonus":"","trofismo":"","mov_anormais":"","deformidades":"","fatigabilidade":""} }
        },
        "checklist_integrativo": {
           "suplementos": {
              "colina": "500 mg"
           }
        }
      }

      REGRAS:
      1. Siga exatamente a estrutura raiz acima. NUNCA omita a chave paciente_nome_completo ou prescricao.
      2. Mapeamento Corporal: Array com {x,y,label,side}. Lados: 'anterior' ou 'posterior' (ex: lombar/cervical/costas é posterior). Use labels curtíssimos (MÁXIMO 2 PALAVRAS).
         GUIA DE COORDENADAS (X: 0 a 100, Y: 0 a 100):
         - Eixo X (Horizontal): Centro = 50. Ombros = 32 ou 68. Joelhos = 40 ou 60. Pés = 38 ou 62.
         - Eixo Y (Vertical): Cabeça=10, Cervical=15, Ombros=22, Peito=35, Lombar=48, Glúteo=55, Joelhos=72, Panturrilha=85, Pés=95.
      3. exame_neurologico: Preencha este objeto se o modo for 'neurological'. Caso contrário, retorne null!
         - IMPORTANTE: "Glasgow" refere-se a "escala_glasgow" (um número, máx 15). NUNCA coloque 'Glasgow 15' dentro de 'cognitivo.total_score'.
         - "cognitivo.total_score" é exclusivo do Mini Mental / MEEM (um número, máx 30).
      4. checklist_integrativo: SEMPRE extraia e preencha este objeto APENAS E EXCLUSIVAMENTE se houver qualquer menção a suplementos, vitaminas, fitoterápicos, biomarcadores ou patógenos no relato! É ESTRITAMENTE PROIBIDO incluir ou sinalizar itens que NÃO foram citados no texto. Se o item não foi falado, NÃO inclua a chave. Valores exatos (ex: 500mg, 50.000 UI, 25mg, 5%). Se apenas o nome for citado, use 'Sinalizado'.
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
