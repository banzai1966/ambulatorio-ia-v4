import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import axios from "axios";
import { createProxyMiddleware } from "http-proxy-middleware";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// Ignora erros de certificado self-signed globalmente no backend
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Debug middleware para verificar o corpo das requisições
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`[API] ${req.method} ${req.path} - Body present: ${!!req.body}`);
  }
  next();
});

// Configuração Supabase (Usando HTTPS mas ignorando erro de certificado no proxy)
const supabaseUrl = "https://qmnbbpoubacuctlokmgq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbmJicG91YmFjdWN0bG9rbWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwODgyOTQsImV4cCI6MjA5MDY2NDI5NH0.a0c7wB3KLQKHkGZccxNihpoKcgG9hpd-Ct9fluiKIJI";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbmJicG91YmFjdWN0bG9rbWdxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA4ODI5NCwiZXhwIjoyMDkwNjY0Mjk0fQ.8qyH3jhL31LwFQsygLjx1iN6Q-dqaE2OtuCyOx6K1zY";

// Credenciais antigas para migração (se necessário)
const OLD_SUPABASE_URL = "https://supabase.makprojetosmake.com.br";
const OLD_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.MkkmMW-v8x41OGDFjXuJnJf0BxR_hWyHH8d2ESgtyrg";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
});

// Proxy para o Supabase (para o frontend usar e evitar Mixed Content / erro de certificado)
const supabaseProxy = createProxyMiddleware({
  target: supabaseUrl,
  changeOrigin: true,
  secure: false, // Ignora erro de certificado self-signed do Supabase
  ws: true, // Necessário para o Supabase Realtime (WebSockets)
  pathRewrite: {
    '^/supabase-api': '', // Remove /supabase-api da URL antes de enviar
  },
  on: {
    proxyReq: (proxyReq, req, res) => {
      // Forçamos o uso da chave correta no cabeçalho apikey
      proxyReq.setHeader('apikey', supabaseKey);
      
      // IMPORTANTE: Só definimos o Authorization se ele não vier do cliente.
      // Se o cliente enviar (porque está logado), mantemos o token do usuário.
      if (!req.headers['authorization']) {
        proxyReq.setHeader('Authorization', `Bearer ${supabaseKey}`);
      }
    },
    proxyRes: (proxyRes, req, res) => {
      // Log de erros do proxy para ajudar no debug
      if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
        console.error(`[PROXY] ❌ Erro no Supabase (${proxyRes.statusCode}): ${req.method} ${req.url}`);
      }
    },
    error: (err, req, res) => {
      console.error(`[PROXY] ❌ Falha crítica no proxy:`, err.message);
      if (res && 'writeHead' in res) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Erro de conexão com o Supabase via Proxy.');
      }
    }
  }
});
app.use('/supabase-api', supabaseProxy);

// --- LÓGICA GEMINI NO BACKEND (MAIS ESTÁVEL) ---
const getGeminiKey = () => {
  return process.env.MINHA_CHAVE_PAGA || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
};

async function runAnalyzeIntent(message: string, history: any[] = []) {
  const key = getGeminiKey();
  if (!key) throw new Error("API_KEY_MISSING");

  const genAI = new GoogleGenerativeAI(key);
  
  const searchDoctorsTool = {
    name: "searchDoctors",
    description: "Busca médicos disponíveis no sistema por especialidade ou nome.",
    parameters: {
      type: "OBJECT",
      properties: {
        specialty: { type: "STRING", description: "A especialidade médica." },
        name: { type: "STRING", description: "O nome do médico (opcional)." }
      }
    }
  };

  const getAvailableSlotsTool = {
    name: "getAvailableSlots",
    description: "Busca horários disponíveis para um médico específico.",
    parameters: {
      type: "OBJECT",
      properties: {
        doctorId: { type: "STRING", description: "O ID único do médico." },
        date: { type: "STRING", description: "Formato YYYY-MM-DD" }
      },
      required: ["doctorId", "date"]
    }
  };

  const requestAppointmentTool = {
    name: "requestAppointment",
    description: "Registra uma solicitação de agendamento.",
    parameters: {
      type: "OBJECT",
      properties: {
        patientName: { type: "STRING" },
        phone: { type: "STRING" },
        doctorId: { type: "STRING" },
        doctorName: { type: "STRING" },
        date: { type: "STRING" },
        time: { type: "STRING" },
        specialty: { type: "STRING" }
      },
      required: ["patientName", "phone", "doctorId", "doctorName", "date", "time", "specialty"]
    }
  };

  const systemInstruction = `Você é o "Assistente Digital de Suporte" do Ambulatório IA.
  Seu objetivo é auxiliar a equipe médica e de recepção, analisando solicitações de pacientes e organizando informações.
  REGRAS ABSOLUTAS: 1. Você NÃO responde diretamente ao paciente. 2. Analise a intenção e use ferramentas. 3. Sugestões curtas e profissionais.`;

  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-pro",
    systemInstruction,
    tools: [{ 
      functionDeclarations: [
        searchDoctorsTool as any, 
        getAvailableSlotsTool as any, 
        requestAppointmentTool as any
      ] 
    }]
  });

  const contents = history.length > 0 ? history : [{ role: 'user', parts: [{ text: message }] }];
  const result = await model.generateContent({ contents });
  const response = result.response;
  
  return {
    text: response.text() || "",
    functionCalls: response.functionCalls() || [],
  };
}

app.post("/api/process-clinical", async (req, res) => {
  try {
    const { input, examMode, reason } = req.body;
    const key = getGeminiKey();
    
    if (!key) {
      return res.status(500).json({ error: "API_KEY_MISSING" });
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" }
    });

    const now = new Date();
    let currentDateStr = now.toLocaleDateString('pt-BR');
    try {
      // Força o horário do Brasil (UTC-3)
      const formatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
      currentDateStr = formatter.format(now);
    } catch(e) {
      console.warn("Date tz fallback", e);
    }
    
    const checklistSchema = `
      - suplementos: colina, hidroxi_triptofano, fenilalanina, melatonina, ac_alfa_lipoico, semente_uva, coenzima_q10, astragalus, dhea, epa_dha, mix_pro, coriandrum, propolis, propco, mix_d9, ginger, acido_caprilico, bitter_mellon, arnica, myosothis, hip_perfuratum, neurexan, floral_bach, acido_folico, vit_b3_b6, pregne, heteropterys, arcalion, vinpocetina, fosfatidilserina, fosfatidilcolina, dmae
      - fitoterapicos_especiais: organo_gt, dna_rna_ch, organo_gt_2, dna_rna_ch_2, organo_gt_3, dna_rna_ch_3, artemisia, phaffia, chlorella, acai, mulateiro, cmc, formula_onco_vo, formula_onco_inalat, vovo_meca, euphorbia, zedoaria, naltrex, nootropil
      - vitaminas_minerais: silimarina, quercetina, saw_palmetto, pygeum, tribulus, litio, cardiopeptase, betaina, taurina, vit_d3, ca_mg_zn, vit_k2, selenio, manganes, cu, cromo, lugol
      - biomarcadores: telomero, sirtuina, integrin, thromboxane, crisotila, hg, pb, al
      - neurotransmissores_hormonios: acetylcholine, serotonin, dopamine, cortisol, substance_p, b_amyloid, homocystine, troponin, c_fos
      - patogenos: candida, c_trachomatis, b_burgdorferi, c_pneumoniae, mycobact_tbc, mycobact_avium, hsv_type_1, hsv_type_2, zoster_virus, cmv_5
    `;

    const basePrompt = `Analise o seguinte relato clínico (texto ou áudio) e extraia as informações estruturadas.
      Data atual: ${currentDateStr}
      Motivo da consulta: ${reason}
      Modo de exame/Especialidade: ${examMode}
      
      REGRAS CRÍTICAS DE RIGIDEZ (MODO INTEGRATIVO):
      1. MAPEAMENTO EXATO: Você deve ser EXTREMAMENTE RÍGIDO ao mapear termos para o checklist_integrativo. Use apenas as chaves fornecidas.
      2. VALORES NUMÉRICOS: No checklist_integrativo, os valores NÃO são mais booleanos. Você deve extrair o VALOR NUMÉRICO ou SIMBÓLICO mencionado (ex: "5 > 100", "300 mcg", "10 pg", "3 > 1").
      3. UNIDADES DE MEDIDA: Diferencie rigorosamente miligramas (mg), gramas (g), microgramas (mcg ou ug) e picogramas (pg). Se o médico disser "trezentos microgramas", escreva "300mcg". Se disser "dez picogramas", escreva "10pg".
      4. CHECKLIST INTEGRATIVO: Preencha com o valor exato mencionado. Se apenas o item for citado sem valor numérico mas com forma (ex: "em gotas", "1 capsula", "injetável"), extraia a forma como o valor (ex: "gotas"). Se o item for citado, mas sem nenhum valor ou forma, use a string "Sinalizado". É ESTRITAMENTE PROIBIDO "adivinhar", "deduzir" ou "copiar" dosagens de um item para outro. Nunca preencha uma dosagem que não foi claramente ditada para AQUELE item específico.
      5. DOSAGENS: Extraia dosagens exatas para a 'prescricao'.
      6. CORREÇÃO DE TRANSCRIÇÃO: O texto de entrada pode conter erros ortográficos, caracteres estranhos () ou palavras quebradas devido a pausas na transcrição de áudio. É SUA OBRIGAÇÃO corrigir contextualmente esses erros e gerar todos os textos (resumo, conduta, hipótese, prescrição) em um português médico polido, impecável e com a acentuação correta.

      REGRAS PARA CÁLCULO DE IDADE:
      - Se a data de nascimento for fornecida (ex: 08/05/1966), calcule a idade baseada na data atual (${currentDateStr}).
      - Seja preciso: subtraia os anos e verifique se o dia/mês atual já passou o dia/mês de nascimento. Se não passou, a idade é (AnoAtual - AnoNasc - 1).
      - Exemplo: 08/05/1966 em 12/04/2026 -> 2026-1966 = 60, mas como 12/04 é antes de 08/05, a idade correta é 59 anos.
      
      Extraia em formato JSON:
      - paciente_nome_completo: Nome do paciente
      - paciente_cpf: CPF (apenas números)
      - paciente_data_nascimento: Data de nascimento (YYYY-MM-DD)
      - resumo_formatado: Resumo clínico profissional (inclua a idade calculada corretamente no texto)
      - hipotese_diagnostica: Hipótese diagnóstica baseada no relato
      - conduta_plano_terapeutico: Plano terapêutico e conduta médica
      - prescricao: STRING com Receituário detalhado e DOSAGENS EXATAS. REGRA CRONOBIOLÓGICA: Se o médico ditar horários (ex: "de manhã", "ao deitar"), agrupe os itens usando cabeçalhos com emojis (ex: "🌅 PELA MANHÃ:", "🌙 À NOITE:") - TUDO DENTRO DA MESMA STRING, separados por quebra de linha. OBEDIÊNCIA CEGA: É ESTRITAMENTE PROIBIDO adivinhar horários. Se o médico não disser a hora, agrupe em "📋 USO GERAL:". Nunca deduzir horários. Se nenhum horário for citado no áudio inteiro, faça apenas uma lista normal. O RETORNO ABSOLUTO DE DEVE SER UMA STRING (TEXTO) E NUNCA UM OBJETO OU ARRAY.
      - sugestao_conduta: Resumo da conduta (para exibição rápida)
      - alertas_copiloto: Array de strings. Atue como um Copiloto Clínico Integrativo. Analise as suplementações/vitaminas e cite alertas CUIDADOSOS. Exemplos Obrigatórios: "Uso de altas doses de Vitamina D3 (como 50.000 UI) exige Vitamina K2 associada obrigatoriamente para evitar toxicidade e calcificação", "Zinco sem Cobre...". Seja breve e comece com "Atenção:". Mesmo riscos e dicas de controle devem ser pontuados.  Se a prescrição estiver 100% perfeita, retorne um array vazio [].
      - especialidade: Especialidade sugerida ou confirmada
      - paciente_status: Status (Estável, Alerta, Urgente)
      - mapeamento_corporal: Array de objetos marcando sintomas locais ou dores. IMPORTANTE: Extraia SEMPRE o mapeamento se o paciente relatar dor (ex: "dor na perna") ou outros sintomas físicos localizados (ex: "peso nas pernas", "formigamento na mão"). Use labels curtíssimos (ex: "Dor Joelho D", "Peso Pernas"). Se não houver sintoma localizado relatado, retorne []. 
        Estrutura de cada ponto: { "x": numero, "y": numero, "side": "front" ou "back", "label": "string curta" }. 
        Use coordenadas percentuais X (lateral, 50 é o centro) e Y (altura, 10 a cabeça, 95 o pé).
        Lista de coordenadas (X, Y) - VALORES OBRIGATÓRIOS: Cabeça(50,10), Cervical(50,15), Ombro Dir(32,22), Ombro Esq(68,22), Braço Dir(25,40), Braço Esq(75,40), Mãos(20,55 / 80,55), Estômago(50,35), Costas/Dorsal(50,30), Lombar(50,48), Quadril(50,54), Coxa Dir(40,62), Coxa Esq(60,62), Joelho Dir(40,72), Joelho Esq(60,72), Canela Dir(40,82), Canela Esq(60,82), Pé Dir(38,95), Pé Esq(62,95).
        Lados: Se dor nas costas/lombar/posterior, usar side: "back". Caso contrário, "front".
        Para o campo "label", utilize no máximo 2 palavras (ex: "Dor Joelho D"). Se não houver dor clara no áudio para o ponto identificado, retorne label: "".
      - dados_especialidade: Objeto JSON com campos específicos da especialidade se mencionados. 
        IMPORTANTE: Extraia APENAS o número (ex: 18 em vez de "18 Kg").
        Use EXATAMENTE estas chaves se os dados forem encontrados:
        - Para Pediatria: peso, altura, perimetro_cefalico, vacinas_em_dia (boolean)
        - Para Cardiologia: pa_sistolica, pa_diastolica, frequencia_cardiaca, tabagista (boolean)
        - Para Psiquiatria: humor_predominante, qualidade_sono, medicacao_atual, ideacao_suicida (boolean)
      - exame_neurologico: Se o modo for 'neurological', preencha um objeto segundo a estrutura abaixo. Mapeie exatamente os valores mencionados, use strings curtas. Se o modo NÃO for 'neurological', retorne null: 
        {
          "fascia": "atípica" | "típica",
          "atitude": "ativa" | "passiva",
          "dominancia": "D" | "E",
          "marcha": "normal" | "alterada",
          "fluencia_verbal": "0-15" | "15-30" | "30-45" | "45-60",
          "cognitivo": { "orient_temp": "", "orient_esp": "", "mem_imed": "", "calculo": "", "mem_evoc": "", "nomeacao": "", "repeticao": "", "leitura": "", "comando": "", "total_score": "" },
          "nervos_cranianos": { "ii": "", "iii": "", "iv": "", "vi": "", "v": "", "vii": "", "viii": "", "ix": "", "x": "", "xi": "", "xii": "", "pupilas_d": "", "pupilas_e": "", "fundo_olho": "normal"|"alterado", "campo": "" },
          "coordenacao": { "status": "normal"|"alterado", "lado": "D"|"E", "index_nariz": true|false, "romberg": true|false, "calcanhar_joelho": true|false, "diadococinesia": true|false },
          "sensibilidade": { "cabeca": {"proprio":"","vibrat":"","temp":"","dor":"","toque":""}, "torax": {...}, "mmss": {...}, "abdome": {...}, "mmii": {...} },
          "forca_muscular": { "face": {"tonus":"","trofismo":"","mov_anormais":"","deformidades":"","fatigabilidade":""}, "lingua": {...}, "msd": {...}, "mse": {...}, "mid": {...}, "mie": {...}, "coluna": {...} }
        }
      - checklist_integrativo: Se o modo for 'integrative', preencha conforme as regras abaixo. Se o modo NÃO for 'integrative', retorne null. É PROIBIDO USAR BOOLEAN (true/false) AQUI. O valor DEVE SER UMA STRING. Preencha com a dosagem exata (ex: "500 mg", "50.000 UI"). Se disser apenas o nome do item sem valor, preencha com a string "Sinalizado". 
       ATENÇÃO: Números no nome do item (ex: "Coenzima Q10", "Mix D9", "Vit K2") NÃO são dosagens! O "10" em "Coenzima Q10" faz parte do nome. Se o médico disser apenas "Coenzima Q 10", preencha "coenzima_q10" com "Sinalizado".
        Estrutura esperada: { "suplementos": { "coenzima_q10": "Sinalizado" }, "biomarcadores": { "cortisol": "5 < 10" }, "vitaminas_minerais": { "vit_d3": "50.000 UI" } }
        Chaves disponíveis:
        ${checklistSchema}
      
      IMPORTANTE: Para o checklist_integrativo, você DEVE mapear os itens mencionados no relato para as chaves exatas acima e NUNCA usar true.`;

    let parts: any[];
    if (typeof input === 'string') {
      parts = [{ text: `${basePrompt}\n\nRelato:\n${input}` }];
    } else {
      parts = [
        { text: basePrompt },
        { inlineData: input }
      ];
    }

    const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
    const response = result.response;
    const responseText = response.text() || "{}";
    console.log("[GEMINI] Resposta bruta:", responseText);
    res.json(JSON.parse(responseText));
  } catch (err: any) {
    console.error("[GEMINI] ❌ Erro no processamento:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/generate-summary", async (req, res) => {
  try {
    const { messages } = req.body;
    const key = getGeminiKey();
    
    if (!key) {
      return res.status(500).json({ error: "API_KEY_MISSING" });
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" }
    });

    // Prepara a conversa em texto
    const conversationText = messages
      .map((m: any) => `${m.direcao === 'recebida' ? 'Paciente' : 'Médico'}: ${m.mensagem || (m.audioData ? '[Áudio enviado]' : '[Mídia]')}`)
      .join('\n');

    // Prepara as partes para o Gemini (Texto + Áudios se houver)
    const parts: any[] = [
      { text: `Analise a seguinte conversa de atendimento médico via WhatsApp e extraia um resumo clínico estruturado.
      Considere tanto o texto das mensagens quanto o conteúdo dos áudios fornecidos.
      
      Conversa (Texto):
      ${conversationText}
      
      Extraia as seguintes informações em formato JSON:
      - queixaPrincipal: A principal reclamação do paciente.
      - sintomas: Uma lista de sintomas mencionados.
      - medicamentos: Uma lista de medicamentos que o paciente já usa ou mencionou.
      - alergias: Uma lista de alergias mencionadas.
      - historicoFamiliar: Informações sobre doenças na família, se houver.
      - sugestaoConduta: Uma sugestão de conduta médica baseada no relato.
      - prescricao: Uma prescrição médica detalhada, se houver, baseada no relato.` }
    ];

    // Adiciona os áudios como partes multimodais
    messages.forEach((m: any) => {
      if (m.audioData && m.mimeType) {
        parts.push({
          inlineData: {
            data: m.audioData,
            mimeType: m.mimeType
          }
        });
      }
    });

    const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
    const response = result.response;
    res.json(JSON.parse(response.text() || "{}"));
  } catch (err: any) {
    console.error("[GEMINI] ❌ Erro no resumo:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/analyze-intent", async (req, res) => {
  try {
    const { message, history } = req.body;
    const result = await runAnalyzeIntent(message, history);
    res.json(result);
  } catch (err: any) {
    console.error("[GEMINI] ❌ Erro na intenção:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/dump-logs", (req, res) => {
  fs.writeFileSync(path.join(process.cwd(), "debug_logs.txt"), webhookLogs.join("\n"));
  res.send("Logs dumped to debug_logs.txt");
});

// Rota de saúde para o sistema
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    time: new Date().toISOString(),
    realtime: "active",
    webhookUrl: process.env.N8N_WEBHOOK_URL || "Using internal endpoint",
    instance: "ambulatorio",
    processedEvolutionIds: Array.from(processedEvolutionIds).slice(-10),
    processedDatabaseIds: Array.from(processedDatabaseIds).slice(-10),
    lastProcessedMessages: Array.from(lastProcessedMessages.entries()).slice(-5)
  });
});

app.post("/api/reconfigure-webhook", async (req, res) => {
  addLog("🚀 Reconfiguração manual do webhook solicitada via API");
  await updateEvolutionWebhook();
  res.json({ status: "ok", message: "Reconfiguração disparada. Verifique os logs." });
});

app.post("/api/simulate-webhook", async (req, res) => {
  addLog("🧪 Simulação de webhook solicitada");
  const mockPayload = {
    event: "messages.upsert",
    data: {
      key: {
        remoteJid: "5511999999999@s.whatsapp.net",
        fromMe: false,
        id: "MOCK_" + Date.now()
      },
      message: {
        conversation: "Mensagem de teste"
      }
    }
  };
  
  try {
    // Chama o próprio endpoint de webhook internamente
    const response = await axios.post(`http://localhost:${PORT}/evolution-webhook`, mockPayload);
    res.json({ status: "ok", detail: response.data });
  } catch (err: any) {
    addLog(`❌ Erro na simulação: ${err.message}`);
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.get("/api/evolution-status", async (req, res) => {
  try {
    const response = await axios.get(`https://api.makprojetosmake.com.br/instance/connectionState/ambulatorio`, {
      headers: { 'apikey': EVOLUTION_API_KEY }
    });
    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

app.get("/api/evolution-webhook-status", async (req, res) => {
  try {
    const response = await axios.get(`https://api.makprojetosmake.com.br/webhook/find/ambulatorio`, {
      headers: { 'apikey': EVOLUTION_API_KEY }
    });
    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// --- LÓGICA DO VIGIA (SUPABASE WATCHER) ---
const processedEvolutionIds = new Set<string>();
const processedDatabaseIds = new Set<number>();
const lastProcessedMessages = new Map<string, { text: string, time: number }>();
const lastAIResponses = new Map<string, string>();
const pendingInsertions = new Map<string, Promise<any>>();
const webhookLogs: string[] = [];
const lastPayloads: any[] = [];

function addLog(msg: string) {
  const log = `[${new Date().toISOString()}] ${msg}`;
  console.log(log);
  webhookLogs.push(log);
  if (webhookLogs.length > 100) webhookLogs.shift();
}

app.get("/api/logs", (req, res) => {
  res.json(webhookLogs);
});

app.get("/api/last-payloads", (req, res) => {
  res.json(lastPayloads);
});

app.get("/api/debug-db", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('mensagens')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    
    res.json({
      status: "ok",
      count: data?.length || 0,
      recent: data,
      config: {
        url: supabaseUrl,
        key: supabaseKey.substring(0, 10) + "..."
      }
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Helper para inserção resiliente na tabela mensagens
async function tryInsertMessage(data: any, attempt = 0): Promise<{ success?: boolean, error?: any }> {
  const { error } = await supabase.from('mensagens').insert([data]);
  if (error) {
    console.error(`[DB] ❌ Erro ao salvar mensagem (tentativa ${attempt}):`, error.message);
    
    // Se o erro for de coluna inexistente, tenta remover a coluna e reenviar
    if (error.message.includes('column') && error.message.includes('does not exist') && attempt < 3) {
      const match = error.message.match(/column "([^"]+)"/);
      if (match && match[1]) {
        const missingColumn = match[1];
        console.warn(`[DB] ⚠️ Removendo coluna inexistente '${missingColumn}' e tentando novamente...`);
        const { [missingColumn]: _, ...newData } = data;
        return tryInsertMessage(newData, attempt + 1);
      }
    }
    return { error };
  }
  return { success: true };
}

// Webhook da Evolution API para receber mensagens em tempo real
// Cache de IDs de mensagens processadas para evitar duplicação
app.post("/evolution-webhook", (req, res, next) => {
  addLog(`📡 [RAW] Request recebido em /evolution-webhook. Method: ${req.method}, Content-Type: ${req.headers['content-type']}`);
  next();
}, async (req, res) => {
  const now = new Date().toISOString();
  addLog(`📥 Webhook recebido`);
  
  // Salva o payload para debug
  lastPayloads.push({ time: now, body: req.body });
  if (lastPayloads.length > 10) lastPayloads.shift();

  addLog(`📦 Payload: ${JSON.stringify(req.body).substring(0, 500)}...`);
  
  try {
    const event = req.body.event;
    addLog(`🔔 Evento recebido: ${event}`);
    
    if (event === "messages.upsert" || event === "MESSAGES_UPSERT" || event === "messages.upsert") {
      const data = req.body.data;
      
      // Evolution API v2 pode enviar um array em data.messages ou o objeto direto em data
      const messageObj = data.messages ? data.messages[0] : data;
      
      if (!messageObj || !messageObj.key) {
        addLog(`⚠️ Payload de mensagem inválido ou vazio.`);
        return res.status(200).send("Invalid payload");
      }

      const message = messageObj.message;
      const key = messageObj.key;
      const remoteJid = key.remoteJid;
      const messageId = key.id;

      // Ignorar mensagens de status/broadcast para não sujar o banco
      if (remoteJid === 'status@broadcast' || remoteJid.includes('broadcast')) {
        addLog(`⏭️ Ignorando mensagem de status/broadcast: ${remoteJid}`);
        return res.status(200).send("Ignore broadcast");
      }
      // Normalização robusta do fromMe
      const fromMe = (
        key.fromMe === true || 
        key.fromMe === "true" || 
        messageObj.fromMe === true || 
        messageObj.fromMe === "true" ||
        messageObj.key?.fromMe === true
      );
      
      const cleanPhone = remoteJid ? remoteJid.split('@')[0] : "unknown";
      
      addLog(`🔍 Webhook Info: ID=${messageId}, FromMe=${fromMe}, Phone=${cleanPhone}, Event=${event}`);

      // 1. FILTRO DE DUPLICAÇÃO POR ID DA EVOLUTION
      if (processedEvolutionIds.has(messageId)) {
        addLog(`🛑 Mensagem duplicada ignorada (cache de ID Evolution): ${messageId}`);
        return res.status(200).send("Ignored duplicate");
      }
      
      // --- PROCESSAMENTO DE MÍDIA DESATIVADO NO BACKEND ---
      // Deixamos o n8n cuidar disso para evitar duplicidade e sobrecarga no Storage.
      addLog(`📸 Mídia detectada. Ignorando processamento no backend (n8n assumirá o controle).`);
      
      let midia_url = null;
      let tipo = 'text';
      let tipo_midia = null;

      // Extrair texto da mensagem para comparação
      let text = "";
      if (message) {
        if (message.conversation) {
          text = message.conversation;
        } else if (message.extendedTextMessage) {
          text = message.extendedTextMessage.text;
        } else if (message.imageMessage) {
          text = message.imageMessage.caption || "[Imagem]";
        } else if (message.videoMessage) {
          text = message.videoMessage.caption || "[Vídeo]";
        } else if (message.documentMessage) {
          text = message.documentMessage.caption || "[Documento]";
        } else if (message.audioMessage) {
          text = "[Áudio]";
        }
      }

      const textToCompare = text.trim();
      
      addLog(`🔍 Analisando: text="${textToCompare}", fromMe=${fromMe}, messageType=${messageObj.messageType}`);
      
      // Ignorar mensagens enviadas por mim (evita loops e echos diretos)
      if (fromMe) {
        addLog(`⏭️ Ignorando: De mim (fromMe)? ${fromMe}`);
        return res.status(200).send("Ignored (from me)");
      }

      // 2. FILTRO POR CONTEÚDO RECENTE (Evita duplicidade se o ID mudar mas o conteúdo for igual)
      const contentKey = `${cleanPhone}:${textToCompare || messageId}`;
      
      // BLOQUEIO IMEDIATO: Verificar se já existe uma inserção em andamento para este conteúdo
      if (pendingInsertions.has(contentKey)) {
        addLog(`🛑 Inserção em andamento para este conteúdo, ignorando duplicata: ${contentKey}`);
        return res.status(200).send("Ignored duplicate (pending)");
      }

      // Registrar que estamos processando este conteúdo
      let resolveInsertion: (val?: any) => void;
      const insertionPromise = new Promise(resolve => { resolveInsertion = resolve; });
      pendingInsertions.set(contentKey, insertionPromise);

      try {
        // --- PROTEÇÃO REFINADA CONTRA DUPLICIDADE E ECHO ---
        
        // 1. Verificar se já recebemos esta mesma mensagem nos últimos 20 segundos (Duplicidade da API)
        const { data: recentReceived } = await supabase
          .from('mensagens')
          .select('id')
          .eq('telefone_cliente', cleanPhone)
          .eq('mensagem', textToCompare)
          .eq('direcao', 'recebida')
          .gte('created_at', new Date(Date.now() - 20000).toISOString())
          .limit(1);

        if (recentReceived && recentReceived.length > 0) {
          addLog(`🛑 Duplicidade detectada (já recebida recentemente): "${textToCompare.substring(0,20)}..."`);
          processedEvolutionIds.add(messageId);
          setTimeout(() => processedEvolutionIds.delete(messageId), 600000);
          resolveInsertion!();
          return res.status(200).send("Ignored duplicate");
        }

        // 2. Verificar se é um ECHO (recebendo o que acabamos de enviar)
        // Janela de echo é curta (5 segundos) para não bloquear respostas rápidas do cliente
        const { data: recentSent } = await supabase
          .from('mensagens')
          .select('id')
          .eq('telefone_cliente', cleanPhone)
          .eq('mensagem', textToCompare)
          .eq('direcao', 'enviada')
          .gte('created_at', new Date(Date.now() - 5000).toISOString())
          .limit(1);

        if (recentSent && recentSent.length > 0) {
          addLog(`🛑 Echo detectado (acabamos de enviar isso): "${textToCompare.substring(0,20)}..."`);
          processedEvolutionIds.add(messageId);
          setTimeout(() => processedEvolutionIds.delete(messageId), 600000);
          resolveInsertion!();
          return res.status(200).send("Ignored echo");
        }

        // --- INSERÇÃO NO BANCO DESATIVADA NO BACKEND ---
        // O n8n é o responsável por salvar as mensagens no Supabase para evitar duplicidade.
        addLog(`📩 Mensagem de ${cleanPhone} recebida. Ignorando inserção no banco (n8n processará).`);
        
        /* 
        const insertData = {
          telefone_cliente: cleanPhone,
          mensagem: textToCompare || (tipo === 'media' ? `[${tipo_midia}]` : ''),
          direcao: fromMe ? 'enviada' : 'recebida',
          lida: fromMe,
          created_at: new Date().toISOString(),
          tipo,
          tipo_midia,
          midia_url
        };

        const { error } = await tryInsertMessage(insertData);
        
        if (error) {
          addLog(`❌ Erro ao salvar mensagem no Supabase: ${error.message}`);
          processedEvolutionIds.delete(messageId);
        } else {
          addLog(`✅ Mensagem salva no Supabase com sucesso!`);
        }
        */
      } finally {
        // Garantir que o bloqueio seja removido após um tempo de segurança
        setTimeout(() => {
          pendingInsertions.delete(contentKey);
          resolveInsertion!();
        }, 5000);
      }
    }
    
    res.status(200).send("OK");
  } catch (err: any) {
    addLog(`❌ Erro ao processar webhook: ${err.message}`);
    res.status(500).send("Error");
  }
});

// Tenta pegar a chave de várias fontes possíveis para ser resiliente
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 
                          process.env.WHATSAPP_API_KEY || 
                          process.env.EVOLUTION_API_K || // Caso o usuário tenha cortado o nome
                          "E6247913DB92-48B4-8B54-5C7449EA639B";

async function updateEvolutionWebhook() {
  try {
    addLog(`🔄 Tentando atualizar webhook da Evolution...`);
    
    // Voltamos para o n8n como gateway público, pois o App é protegido
    const webhookUrl = process.env.N8N_WEBHOOK_URL || "https://n8n.makprojetosmake.com.br/webhook/16464b5a-567f-44d8-b17a-2f4e48184278";
    addLog(`🌐 Reconfigurando webhook para n8n: ${webhookUrl}`);
    
    addLog(`📍 URL Alvo: ${webhookUrl}`);
    addLog(`🔑 Usando API Key: ${EVOLUTION_API_KEY.substring(0, 5)}...`);
    
    const response = await axios.post("https://api.makprojetosmake.com.br/webhook/set/ambulatorio", {
      webhook: {
        url: webhookUrl,
        enabled: true,
        webhook_by_events: true, // Alterado para true para forçar a configuração por evento
        webhook_base64: true,
        events: [
          "MESSAGES_UPSERT",
          "MESSAGES_UPDATE",
          "MESSAGES_DELETE",
          "SEND_MESSAGE",
          "CONNECTION_UPDATE"
        ]
      }
    }, { 
      headers: { 'apikey': EVOLUTION_API_KEY } 
    });
    
    addLog(`✅ Webhook configurado! Resposta: ${JSON.stringify(response.data)}`);
  } catch (err: any) {
    addLog(`❌ Erro ao configurar webhook: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
  }
}

// --- DADOS MOCKADOS PARA TOOLS ---
const mockDoctors = [
  { id: "1", name: "Dra. Tânia", specialty: "Neurologia" },
  { id: "2", name: "Dr. Marco", specialty: "Cardiologia" },
  { id: "3", name: "Dra. Ana", specialty: "Pediatria" }
];

const mockSlots: Record<string, string[]> = {
  "1": ["09:00", "10:00", "14:00"],
  "2": ["08:30", "11:00", "15:30"],
  "3": ["10:30", "13:00", "16:00"]
};

async function processAndReply(phone: string, message: string) {
  const cleanPhone = phone.split('@')[0];
  console.log(`[IA] 🚀 Processando mensagem de ${cleanPhone}: "${message.substring(0, 50)}..."`);
  
  try {
    // Normalização para comparação de "DNA" da mensagem
    const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    const nMsg = normalize(message);
    
    // Deduplicação agressiva de entrada
    const lastMsg = lastProcessedMessages.get(cleanPhone);
    const now = Date.now();
    if (lastMsg && normalize(lastMsg.text) === nMsg && (now - lastMsg.time) < 60000) { // Aumentado para 60 segundos
      console.warn(`[IA] 🛑 Deduplicação de entrada para ${cleanPhone}: "${message}"`);
      return;
    }
    // SET IMEDIATO PARA EVITAR RACE CONDITION
    lastProcessedMessages.set(cleanPhone, { text: message, time: now });

    console.log(`[IA] 📩 Processando: ${cleanPhone} -> "${message}"`);
    
    let { data: session, error: sessionError } = await supabase.from('chat_sessions').select('*').eq('phone', cleanPhone).maybeSingle();
    if (sessionError) console.error(`[IA] ❌ Erro ao buscar sessão para ${cleanPhone}:`, sessionError.message);
    
    let history = session?.ai_context?.history || [];
    
    // Adiciona a mensagem atual ao histórico antes de analisar
    const currentHistory = [...history, { role: "user", parts: [{ text: message }] }];
    
    console.log(`[IA] 🧠 Analisando com Gemini para ${cleanPhone}...`);
    let result: any = await runAnalyzeIntent(message, history);
    
    if (result.error) {
      console.error(`[IA] ❌ Erro na análise da IA para ${cleanPhone}:`, result.error);
      return;
    }

    // --- LÓGICA DE EXECUÇÃO DE TOOLS ---
    if (result.functionCalls && result.functionCalls.length > 0) {
      console.log(`[IA] 🛠️ Ferramentas detectadas. Ignorando texto inicial para evitar eco.`);
      
      const toolHistory = [...currentHistory];
      // ... rest of tool logic
      
      for (const call of result.functionCalls) {
        let toolResponse = "Informação não encontrada.";
        // ... (lógica de busca igual)
        if (call.name === "searchDoctors") {
          const spec = (call.args as any).specialty?.toLowerCase();
          const name = (call.args as any).name?.toLowerCase();
          const found = mockDoctors.filter(d => 
            (spec && d.specialty.toLowerCase().includes(spec)) || 
            (name && d.name.toLowerCase().includes(name))
          );
          toolResponse = found.length > 0 ? JSON.stringify(found) : "Nenhum médico encontrado.";
        } 
        else if (call.name === "getAvailableSlots") {
          const docId = (call.args as any).doctorId;
          const slots = mockSlots[docId] || [];
          toolResponse = slots.length > 0 ? `Horários: ${slots.join(", ")}` : "Sem horários.";
        }
        else if (call.name === "requestAppointment") {
          toolResponse = "Solicitação enviada.";
        }

        toolHistory.push({ 
          role: "model", 
          parts: [{ functionCall: { name: call.name, args: call.args } }] 
        });
        toolHistory.push({ 
          role: "user", 
          parts: [{ functionResponse: { name: call.name, response: { content: toolResponse } } }] 
        });
      }

      // Chama a IA novamente com o contexto das ferramentas
      result = await runAnalyzeIntent("O paciente aguarda sua resposta. Com base nos dados acima, responda de forma curta e gentil, sem repetir a pergunta dele.", toolHistory);
      
      // Bloqueio de Eco na resposta final também
      if (result.text?.trim().toLowerCase() === nMsg) {
        console.warn(`[IA] 🛑 Bloqueio de Eco na resposta final para ${cleanPhone}.`);
        return;
      }

      // Atualiza o histórico final com as voltas da ferramenta
      history = toolHistory;
    } else {
      // Se não houve ferramenta, apenas atualiza com a mensagem do usuário
      history = currentHistory;
    }

    if (result.text) {
      const finalResp = result.text.trim();
      const nResp = normalize(finalResp);
      
      // Bloqueio de Repetição de Resposta (Evita que a IA mande a mesma coisa duas vezes seguidas)
      const lastAIResp = lastAIResponses.get(cleanPhone);
      if (lastAIResp && normalize(lastAIResp) === nResp) {
        console.warn(`[IA] 🛑 Bloqueio de Repetição de Resposta para ${cleanPhone}: "${finalResp}"`);
        return;
      }
      lastAIResponses.set(cleanPhone, finalResp);

      const userMsg = message.trim();
      const nUser = normalize(userMsg);

      if (nResp === nUser || (nResp.length > 5 && nUser.includes(nResp)) || (nUser.length > 5 && nResp.includes(nUser))) {
        console.warn(`[IA] 🛑 Bloqueio de Eco Agressivo para ${cleanPhone}.`);
        return;
      }

      console.log(`[IA] 📤 Resposta final para ${cleanPhone}: "${finalResp}"`);
      
      // Enviar via Evolution
      try {
        const evoResponse = await axios.post("https://api.makprojetosmake.com.br/message/sendText/ambulatorio", {
          number: cleanPhone,
          text: finalResp,
          linkPreview: true
        }, { headers: { 'apikey': EVOLUTION_API_KEY } });
        
        console.log(`[EVOLUTION] ✅ Enviado para WhatsApp:`, evoResponse.data);
      } catch (evoErr: any) {
        console.error(`[EVOLUTION] ❌ Erro no WhatsApp:`, evoErr.response?.data || evoErr.message);
      }

      // Salvar resposta no banco
      await supabase.from('mensagens').insert([{
        telefone_cliente: cleanPhone,
        mensagem: finalResp,
        direcao: 'enviada',
        created_at: new Date().toISOString()
      }]);

      // ATUALIZAR SESSÃO NO SUPABASE
      const { error: updateError } = await supabase
        .from('chat_sessions')
        .upsert([{
          phone: cleanPhone,
          ai_context: { history: history },
          updated_at: new Date().toISOString()
        }], { onConflict: 'phone' });
      
      if (updateError) console.error(`[IA] ❌ Erro ao atualizar sessão para ${cleanPhone}:`, updateError.message);
      else console.log(`[IA] ✅ Sessão atualizada para ${cleanPhone}.`);

      // Atualizar histórico na sessão (CORRIGIDO: history já contém a mensagem do usuário)
      const finalHistory = [
        ...history,
        { role: "model", parts: [{ text: finalResp }] }
      ].slice(-15);

      await supabase.from('chat_sessions').upsert({
        phone: cleanPhone,
        ai_context: { history: finalHistory },
        last_message: message,
        updated_at: new Date().toISOString()
      }, { onConflict: 'phone' });
    }
  } catch (err: any) {
    console.error("[IA] ❌ Erro Geral:", err.message);
  }
}

// --- SUPABASE REALTIME (Substitui o Polling) ---
const setupRealtime = () => {
  console.log("[REALTIME] 📡 Configurando escuta em tempo real no Supabase...");
  
  const channel = supabase
    .channel('schema-db-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'mensagens',
        filter: 'direcao=eq.recebida'
      },
      async (payload) => {
        const msg = payload.new;
        
        // Evita processar a mesma mensagem duas vezes (cache de ID do banco)
        if (processedDatabaseIds.has(msg.id)) return;
        processedDatabaseIds.add(msg.id);
        
        console.log(`[REALTIME] 📩 Nova mensagem recebida de ${msg.telefone_cliente}: "${msg.mensagem}"`);
        
        try {
          // Filtro para não responder ao próprio número da clínica ou mensagens de sistema
          const clinicNumber = "5511976143323";
          if (msg.telefone_cliente.includes(clinicNumber) || msg.telefone_cliente.includes("ambulatorio")) {
            console.log(`[REALTIME] ⏭️ Ignorando mensagem do próprio número ou sistema.`);
            return;
          }

          // --- IA DESATIVADA A PEDIDO DO USUÁRIO ---
          // O sistema agora foca em atendimento humano direto.
          addLog(`🤖 IA Desativada: Mensagem de ${msg.telefone_cliente} ignorada para resposta automática.`);
          // await processAndReply(msg.telefone_cliente, msg.mensagem);
          
          // Marca como lida no banco se necessário (opcional agora que é humano)
          // await supabase.from('mensagens').update({ lida: true }).eq('id', msg.id);
            
          console.log(`[REALTIME] ✅ Mensagem ${msg.id} recebida e pronta para atendimento humano.`);
        } catch (error) {
          console.error(`[REALTIME] ❌ Erro ao processar mensagem ${msg.id}:`, error);
        }
      }
    )
    .subscribe((status) => {
      console.log(`[REALTIME] Status da inscrição: ${status}`);
    });

  return channel;
};

const startWatcher = () => {
  updateEvolutionWebhook(); // Reativado para configurar o novo webhook de teste
  setupRealtime(); // Inicia o Realtime em vez do setInterval
};

// Limpeza periódica de IDs processados para evitar vazamento de memória
setInterval(() => {
  console.log(`[WATCHER] 🧹 Limpando cache de IDs processados (${processedEvolutionIds.size} Evo, ${processedDatabaseIds.size} DB).`);
  processedEvolutionIds.clear();
  processedDatabaseIds.clear();
  lastProcessedMessages.clear();
  lastAIResponses.clear();
}, 1000 * 60 * 10); // A cada 10 minutos

startWatcher();

// --- ROTAS NORMAIS ---
app.get("/health", (req, res) => res.send("OK"));

// Rota de teste da IA
app.get("/test-ai", async (req, res) => {
  try {
    const result = await runAnalyzeIntent("Olá, como você está?");
    res.json({ status: "success", response: result.text });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.post("/whatsapp", (req, res) => {
  res.status(200).json({ status: "Use o Supabase para enviar mensagens agora!" });
});

// Rota para envio manual de mensagens pela UI
app.post("/api/send-message", async (req, res) => {
  try {
    const { phone, message, media, mediaType, fileName, userId } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: "Telefone é obrigatório" });
    }

    const cleanPhone = phone.split('@')[0];
    addLog(`📤 Enviando mensagem manual para ${cleanPhone}...`);
    
    const payload: any = {
      number: cleanPhone,
    };

    let endpoint = "sendText";
    let cleanMedia = "";
    
    if (media && mediaType) {
      cleanMedia = typeof media === 'string' ? media.replace(/^data:.*?;base64,/, '') : media;
      
      if (mediaType === 'audio') {
        endpoint = "sendWhatsAppAudio";
        payload.audio = cleanMedia;
        // ptt: false faz com que envie como arquivo de áudio normal, que funciona no celular.
        // ptt: true exige formato ogg/opus estrito que o navegador não gera nativamente.
        payload.ptt = false;
      } else {
        endpoint = "sendMedia";
        payload.mediatype = mediaType;
        payload.media = cleanMedia;
        if (fileName) payload.fileName = fileName;
        if (message) payload.caption = message;
      }
    } else {
      payload.text = message;
      payload.linkPreview = true;
    }

    // 1. Inserção imediata no banco removida para evitar duplicidade.
    // Como o n8n (webhook) já está salvando as mensagens enviadas (fromMe=true) no banco,
    // se salvarmos aqui também, a mensagem aparecerá duplicada na tela.
    /*
    const insertData = {
      telefone_cliente: cleanPhone,
      mensagem: message || (mediaType === 'audio' ? '[Áudio]' : (mediaType === 'image' ? '[Imagem]' : '')),
      direcao: 'enviada',
      lida: true,
      created_at: new Date().toISOString(),
      tipo: media ? 'media' : 'text',
      tipo_midia: mediaType,
      midia_url: media ? (media.startsWith('http') ? media : `data:${mediaType === 'audio' ? 'audio/ogg' : 'image/jpeg'};base64,${cleanMedia}`) : null
    };
    tryInsertMessage(insertData).catch(e => addLog(`⚠️ Erro silencioso no banco: ${e.message}`));
    */

    addLog(`🚀 Chamando Evolution: ${endpoint} para ${cleanPhone}`);

    try {
      const evoResponse = await axios.post(`https://api.makprojetosmake.com.br/message/${endpoint}/ambulatorio`, payload, { 
        headers: { 'apikey': EVOLUTION_API_KEY } 
      });

      addLog(`✅ Evolution respondeu: ${JSON.stringify(evoResponse.data)}`);

      const messageId = evoResponse.data.key?.id;
      if (messageId) {
        processedEvolutionIds.add(messageId);
        setTimeout(() => processedEvolutionIds.delete(messageId), 600000);
      }

      res.json({ success: true, data: evoResponse.data });
    } catch (err: any) {
      const errorMsg = err.response?.data || err.message;
      addLog(`❌ Falha na Evolution: ${JSON.stringify(errorMsg)}`);
      res.status(500).json({ error: "Falha ao enviar para o WhatsApp", details: errorMsg });
    }
  } catch (err: any) {
    console.error("[API] ❌ Erro crítico na rota send-message:", err);
    res.status(500).json({ error: err.message });
  }
});

const setupFrontend = async () => {
  const isProd = fs.existsSync(path.join(process.cwd(), 'dist'));
  if (isProd) {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => res.sendFile(path.join(process.cwd(), 'dist', 'index.html')));
  } else {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  }
  
  // 1. LIGAR O SERVIDOR NO FINAL
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] >>> AMBULATORIO IA V3.2 STARTING ON PORT ${PORT} <<<`);
    
    // Tenta pegar a chave nova primeiro, depois as antigas
    const apiKey = process.env.MINHA_CHAVE_PAGA || process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey) {
      console.log(`[SERVER] ✅ API_KEY encontrada: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
      if (apiKey.includes('TODO') || apiKey.includes('KEYHERE')) {
        console.error("[SERVER] ❌ AVISO: A API_KEY parece ser um placeholder!");
      }
    } else {
      console.error("[SERVER] ❌ ERRO: Nenhuma API_KEY encontrada no ambiente!");
    }
  });
};
setupFrontend();

// Tratamento global de erros para evitar queda do servidor
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] ❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] ❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
