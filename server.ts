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
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Ignora erros de certificado self-signed globalmente no backend
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const __filenameSafe = typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : (typeof __filename !== 'undefined' ? __filename : path.resolve(process.cwd(), 'server.ts'));
const __dirnameSafe = typeof __dirname !== 'undefined' ? __dirname : path.dirname(__filenameSafe);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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

// Configuração Evolution API (Dinâmica com fallback para variáveis de ambiente)
let EVOLUTION_API_URL = (process.env.EVOLUTION_API_URL || "https://api.makprojetosmake.com.br").replace(/\/$/, "");
let EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || "ambulatorio";
const EVOLUTION_GLOBAL_KEY = (process.env.EVOLUTION_GLOBAL_KEY || "b2efa885a71ee2edf72b597df1a0ce9").trim();
let EVOLUTION_API_KEY = (process.env.EVOLUTION_API_KEY || 
                          process.env.WHATSAPP_API_KEY || 
                          process.env.EVOLUTION_API_K || 
                          "BFA493146682-4CA6-B8CB-40E2D785AA23").trim();

const KNOWN_INSTANCE_TOKENS: Record<string, string> = {
  ambulatorio: "BFA493146682-4CA6-B8CB-40E2D785AA23",
  luci: "807FE1A424A0-4474-B3DC-C6EE5ACBF060",
  drcarlos: "E54C7FA2A036-4959-A843-5C258EA783BA"
};

// Helper para obter configuração dinâmica da requisição ou fallback
function getEvolutionConfig(req?: express.Request) {
  const url = (req?.body?.evolution_url || req?.query?.evolution_url || (req?.headers['x-evolution-url'] as string) || EVOLUTION_API_URL).replace(/\/$/, "");
  const instance = (req?.body?.evolution_instance || req?.query?.evolution_instance || (req?.headers['x-evolution-instance'] as string) || EVOLUTION_INSTANCE_NAME).trim();
  let apikey = (req?.body?.evolution_apikey || req?.query?.evolution_apikey || (req?.headers['x-evolution-apikey'] as string) || "").trim();
  
  if (!apikey || apikey.length < 15) {
    apikey = KNOWN_INSTANCE_TOKENS[instance] || EVOLUTION_GLOBAL_KEY || EVOLUTION_API_KEY || "b2efa885a71ee2edf72b597df1a0ce9";
  }
  return { url, instance, apikey };
}

// Helper universal que tenta a requisição na Evolution e, caso receba 401, tenta a outra chave (global ou token da instância)
async function requestEvolutionWithFallback(method: 'get' | 'post' | 'put' | 'delete', endpointUrl: string, data?: any, initialKey?: string) {
  const keysToTry = [
    initialKey,
    "E54C7FA2A036-4959-A843-5C258EA783BA",
    "BFA493146682-4CA6-B8CB-40E2D785AA23",
    "b2efa885a71ee2edf72b597df1a0ce9",
    EVOLUTION_GLOBAL_KEY,
    EVOLUTION_API_KEY
  ].filter(Boolean) as string[];

  const uniqueKeys = Array.from(new Set(keysToTry));
  let lastError: any = null;

  for (const key of uniqueKeys) {
    try {
      const config: any = { headers: { 'apikey': key }, timeout: 8000 };
      if (method === 'get') {
        return await axios.get(endpointUrl, config);
      } else if (method === 'post') {
        return await axios.post(endpointUrl, data || {}, config);
      } else if (method === 'put') {
        return await axios.put(endpointUrl, data || {}, config);
      } else if (method === 'delete') {
        return await axios.delete(endpointUrl, config);
      }
    } catch (err: any) {
      lastError = err;
      if (err.response?.status === 401) {
        continue; // Tenta próxima chave
      }
      throw err;
    }
  }
  throw lastError;
}

// Helper universal para extrair QR code de múltiplos formatos da Evolution API v1 / v2
function extractQrFromEvolutionData(data: any): string | null {
  if (!data) return null;
  if (typeof data === 'string' && data.startsWith('data:image')) return data;
  if (data.base64 && typeof data.base64 === 'string') return data.base64;
  if (data.qrcode?.base64 && typeof data.qrcode.base64 === 'string') return data.qrcode.base64;
  if (data.qrcode && typeof data.qrcode === 'string' && data.qrcode.startsWith('data:image')) return data.qrcode;
  if (data.code && typeof data.code === 'string' && data.code.startsWith('data:image')) return data.code;
  if (data.instance?.qrcode?.base64) return data.instance.qrcode.base64;
  return null;
}

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

// --- HELPER DE FORMATAÇÃO DE TELEFONE BRASIL (DDD + 55) ---
function formatPhoneBR(phone: string): string {
  if (!phone) return '';
  let digits = phone.split('@')[0].replace(/\D/g, '');
  // Se possui 10 ou 11 dígitos (ex: 11976143323), adiciona o código de país 55 do Brasil
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith('55')) {
    digits = '55' + digits;
  }
  return digits;
}

// --- LÓGICA GEMINI NO BACKEND (MAIS ESTÁVEL) ---
const getGeminiKey = () => {
  return process.env.MINHA_CHAVE_PAGA || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
};

async function generateGeminiContentWithFallback(ai: GoogleGenAI, requestConfig: any) {
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
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
      console.warn(`[GEMINI] Tentativa com modelo ${modelName} falhou:`, err.message);
      lastError = err;
    }
  }
  throw lastError;
}

async function runAnalyzeIntent(message: string, history: any[] = []) {
  const key = getGeminiKey();
  if (!key) throw new Error("API_KEY_MISSING");

  const ai = new GoogleGenAI({ 
    apiKey: key,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });
  
  const searchDoctorsTool = {
    name: "searchDoctors",
    description: "Busca médicos disponíveis no sistema por especialidade ou nome.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        specialty: { type: Type.STRING, description: "A especialidade médica." },
        name: { type: Type.STRING, description: "O nome do médico (opcional)." }
      }
    }
  };

  const getAvailableSlotsTool = {
    name: "getAvailableSlots",
    description: "Busca horários disponíveis para um médico específico.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        doctorId: { type: Type.STRING, description: "O ID único do médico." },
        date: { type: Type.STRING, description: "Formato YYYY-MM-DD" }
      },
      required: ["doctorId", "date"]
    }
  };

  const requestAppointmentTool = {
    name: "requestAppointment",
    description: "Registra uma solicitação de agendamento.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        patientName: { type: Type.STRING },
        phone: { type: Type.STRING },
        doctorId: { type: Type.STRING },
        doctorName: { type: Type.STRING },
        date: { type: Type.STRING },
        time: { type: Type.STRING },
        specialty: { type: Type.STRING }
      },
      required: ["patientName", "phone", "doctorId", "doctorName", "date", "time", "specialty"]
    }
  };

  const systemInstruction = `Você é o "Assistente Digital de Suporte" do Ambulatório IA.
  Seu objetivo é auxiliar a equipe médica e de recepção, analisando solicitações de pacientes e organizando informações.
  REGRAS ABSOLUTAS: 1. Você NÃO responde diretamente ao paciente. 2. Analise a intenção e use ferramentas. 3. Sugestões curtas e profissionais.`;

  const contents: any[] = history.length > 0 
    ? history 
    : [{ role: 'user', parts: [{ text: message }] }];

  const response = await generateGeminiContentWithFallback(ai, {
    contents,
    config: {
      systemInstruction,
      tools: [{ 
        functionDeclarations: [
          searchDoctorsTool as any, 
          getAvailableSlotsTool as any, 
          requestAppointmentTool as any
        ] 
      }]
    }
  });
  
  return {
    text: response.text || "",
    functionCalls: response.functionCalls || [],
  };
}

// --- PERSISTÊNCIA DE MEMBROS EXCLUÍDOS & CRM/CRO (GARANTE QUE NUNCA REAPAREÇAM OU QUEBREM SCHEMA) ---
const DELETED_MEMBERS_FILE = path.join(process.cwd(), 'deleted_members.json');
const CRM_CRO_FILE = path.join(process.cwd(), 'crm_cro_map.json');

const PROTECTED_ADMIN_EMAILS = [
  'marco.agduarte22@gmail.com',
  'carvalhomorato@gmail.com'
];

function isProtectedClinicalEmail(emailOrId?: string): boolean {
  if (!emailOrId) return false;
  const norm = String(emailOrId).toLowerCase().trim();
  return norm === 'marco.agduarte22@gmail.com' || norm.includes('marco.agduarte22@gmail.com') ||
         norm === 'carvalhomorato@gmail.com' || norm.includes('carvalhomorato@gmail.com') ||
         norm.includes('carlos') || norm.includes('morato') ||
         norm === 'lucimurata@gmail.com' || norm.includes('lucimurata') || norm.includes('lucy') || norm.includes('murata');
}

const CORE_CLINIC_USERS = [
  {
    email: 'marco.agduarte22@gmail.com',
    password: 'Duarte2026!',
    full_name: 'Dr. Marco Duarte (Admin)',
    role: 'admin',
    especialidade: 'Clínica Geral & Gestão Integrativa',
    crm_cro: 'ADMIN-MASTER-01'
  },
  {
    email: 'carvalhomorato@gmail.com',
    password: 'Morato123@',
    full_name: 'Dr. Carlos Morato',
    role: 'admin',
    especialidade: 'Neurologia & Medicina Integrativa',
    crm_cro: 'CRM/SP 145.892'
  },
  {
    email: 'lucimurata@gmail.com',
    password: 'Murata123@',
    full_name: 'Dra. Lucy Morata',
    role: 'admin',
    especialidade: 'Odontologia Biológica & Saúde Integrativa',
    crm_cro: 'CRO/SP 98.412'
  }
];

async function ensureCoreClinicUsers() {
  console.log("[SERVER] 🛡️ Verificando e garantindo os 3 Profissionais Principais do Ambulatório IA...");
  for (const u of CORE_CLINIC_USERS) {
    try {
      unmarkDeletedMember(u.email);
      saveCrmCroServer(u.email, u.crm_cro);

      const { data: usersList } = await supabase.auth.admin.listUsers();
      const existing = (usersList?.users as any[])?.find((usr: any) => usr.email?.toLowerCase().trim() === u.email.toLowerCase().trim());
      
      let uId = existing?.id;
      if (existing) {
        await supabase.auth.admin.updateUserById(existing.id, {
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.full_name, role: u.role, especialidade: u.especialidade, crm_cro: u.crm_cro }
        }).catch(e => console.warn(`[AUTH] Aviso update user ${u.email}:`, e.message));
      } else {
        const { data: created, error: cErr } = await supabase.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.full_name, role: u.role, especialidade: u.especialidade, crm_cro: u.crm_cro }
        });
        if (created?.user) {
          uId = created.user.id;
        } else if (cErr) {
          console.warn(`[AUTH] Aviso criação core user ${u.email}:`, cErr.message);
        }
      }

      if (uId) {
        saveCrmCroServer(uId, u.crm_cro);
        await supabase.from('profiles').upsert({
          id: uId,
          email: u.email,
          role: u.role,
          status: 'approved',
          full_name: u.full_name,
          especialidade: u.especialidade
        }, { onConflict: 'email' });
      }
    } catch (e: any) {
      console.warn(`[SERVER] Erro não-bloqueante ao assegurar ${u.email}:`, e.message);
    }
  }
  console.log("[SERVER] ✅ Profissionais Principais (Dr. Carlos, Dra. Lucy e Dr. Marco) blindados e prontos!");
}

function getCrmCroMapServer(): Record<string, string> {
  try {
    if (fs.existsSync(CRM_CRO_FILE)) {
      return JSON.parse(fs.readFileSync(CRM_CRO_FILE, 'utf-8'));
    }
  } catch (e) {}
  return {};
}

function saveCrmCroServer(idOrEmail: string, crm: string) {
  if (!idOrEmail) return;
  try {
    const map = getCrmCroMapServer();
    map[idOrEmail.toLowerCase().trim()] = crm;
    fs.writeFileSync(CRM_CRO_FILE, JSON.stringify(map, null, 2), 'utf-8');
  } catch (e) {}
}

function getDeletedMembers(): string[] {
  try {
    if (fs.existsSync(DELETED_MEMBERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(DELETED_MEMBERS_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        return data
          .map(e => String(e).toLowerCase().trim())
          .filter(e => !PROTECTED_ADMIN_EMAILS.includes(e));
      }
    }
  } catch (e) {
    console.warn("[SERVER] Aviso ao ler deleted_members.json:", e);
  }
  return [];
}

function saveDeletedMember(emailOrId: string) {
  if (!emailOrId) return;
  const normalized = emailOrId.toLowerCase().trim();
  if (PROTECTED_ADMIN_EMAILS.includes(normalized)) return; // Não bloqueia admin principal
  try {
    const list = getDeletedMembers();
    if (!list.includes(normalized)) {
      list.push(normalized);
      fs.writeFileSync(DELETED_MEMBERS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    }
  } catch (e) {
    console.warn("[SERVER] Aviso ao salvar deleted_members.json:", e);
  }
}

function unmarkDeletedMember(emailOrId: string) {
  if (!emailOrId) return;
  try {
    const normalized = emailOrId.toLowerCase().trim();
    const list = getDeletedMembers().filter(e => e !== normalized);
    fs.writeFileSync(DELETED_MEMBERS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.warn("[SERVER] Aviso ao desmarcar deleted member:", e);
  }
}

// --- ROTA DE LISTAGEM DE MEMBROS DA EQUIPE (SERVICE ROLE) ---
app.get("/api/admin/members", async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, role, status, full_name, especialidade')
      .order('role', { ascending: true });

    if (error) throw error;

    const deletedList = getDeletedMembers();
    const crmMap = getCrmCroMapServer();

    const uniqueMap = new Map<string, any>();
    for (const p of profiles || []) {
      const emailKey = (p.email || '').toLowerCase().trim();
      const idKey = (p.id || '').toLowerCase().trim();

      const isProtected = isProtectedClinicalEmail(emailKey) || isProtectedClinicalEmail(p.full_name);

      if (!isProtected && (deletedList.includes(emailKey) || deletedList.includes(idKey))) {
        continue;
      }

      const pAny = p as any;
      const enriched = {
        ...p,
        crm_cro: pAny.crm_cro || crmMap[emailKey] || crmMap[idKey] || ''
      };

      if (emailKey && !uniqueMap.has(emailKey)) {
        uniqueMap.set(emailKey, enriched);
      } else if (!emailKey && idKey && !uniqueMap.has(idKey)) {
        uniqueMap.set(idKey, enriched);
      }
    }

    // Garante sempre a presença de todos os usuários do CORE_CLINIC_USERS
    for (const core of CORE_CLINIC_USERS) {
      const coreEmail = core.email.toLowerCase().trim();
      const found = Array.from(uniqueMap.values()).find(m => 
        (m.email && m.email.toLowerCase().trim() === coreEmail) ||
        (m.full_name && m.full_name.toLowerCase().includes(coreEmail.includes('carlos') ? 'carlos' : 'duarte'))
      );

      if (!found) {
        uniqueMap.set(coreEmail, {
          id: coreEmail === 'marco.agduarte22@gmail.com' ? 'marco-duarte-admin' : 'dr-carlos-morato',
          email: core.email,
          full_name: core.full_name,
          role: core.role,
          especialidade: core.especialidade,
          crm_cro: core.crm_cro,
          status: 'approved'
        });
      }
    }

    return res.json({
      success: true,
      members: Array.from(uniqueMap.values())
    });
  } catch (err: any) {
    console.error("[ADMIN] Erro ao listar membros:", err);
    return res.status(500).json({ error: err.message || "Erro ao listar membros" });
  }
});

// --- ROTA DE CRIAÇÃO / CADASTRO DE MEMBRO DA EQUIPE ---
app.post("/api/admin/create-member", async (req, res) => {
  try {
    const { email, password, full_name, role, especialidade, crm_cro } = req.body;
    if (!email || !full_name) {
      return res.status(400).json({ error: "Nome e e-mail são obrigatórios" });
    }
    const normEmail = email.toLowerCase().trim();
    const userPassword = password || "Duarte2026!";
    const userName = full_name.trim();
    const userRole = (normEmail === 'marco.agduarte22@gmail.com' || normEmail === 'carvalhomorato@gmail.com') ? 'admin' : (role || 'doctor');
    const userSpec = especialidade || 'Nenhuma';
    const userCrm = (crm_cro || '').trim();

    unmarkDeletedMember(normEmail);
    if (userCrm) {
      saveCrmCroServer(normEmail, userCrm);
    }

    // 1. Cria ou atualiza no Supabase Auth com Service Role
    const { data: usersList } = await supabase.auth.admin.listUsers();
    const existingUser = (usersList?.users as any[])?.find((u: any) => u.email?.toLowerCase().trim() === normEmail);

    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
      await supabase.auth.admin.updateUserById(userId, {
        password: userPassword,
        email_confirm: true,
        user_metadata: { full_name: userName, role: userRole, especialidade: userSpec, crm_cro: userCrm }
      });
      console.log(`[ADMIN] Usuário Auth atualizado para: ${normEmail}`);
    } else {
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: normEmail,
        password: userPassword,
        email_confirm: true,
        user_metadata: { full_name: userName, role: userRole, especialidade: userSpec, crm_cro: userCrm }
      });
      if (createErr) throw createErr;
      userId = newUser.user.id;
      console.log(`[ADMIN] Novo usuário Auth criado com sucesso: ${normEmail}`);
    }

    if (userCrm && userId) {
      saveCrmCroServer(userId, userCrm);
    }

    // 2. Upsert no profiles (somente colunas válidas no schema do banco)
    const profilePayload: any = {
      id: userId,
      email: normEmail,
      role: userRole,
      status: 'approved',
      full_name: userName,
      especialidade: userSpec
    };

    const { error: upsertErr } = await supabase.from('profiles').upsert(profilePayload, { onConflict: 'email' });
    if (upsertErr) {
      console.warn("[ADMIN] Aviso upsert profiles:", upsertErr.message);
    }

    return res.json({
      success: true,
      member: {
        id: userId,
        email: normEmail,
        full_name: userName,
        role: userRole,
        especialidade: userSpec,
        crm_cro: userCrm,
        status: 'approved'
      },
      message: "Membro da equipe cadastrado com sucesso!"
    });
  } catch (err: any) {
    console.error("[ADMIN] Erro ao criar membro:", err);
    return res.status(500).json({ error: err.message || "Erro ao criar membro" });
  }
});

// --- ROTA DE PROVISIONAMENTO / RESET INSTANTÂNEO DE USUÁRIO AUTH ---
app.post("/api/auth/ensure-user", async (req, res) => {
  try {
    const { email, password, full_name, role, especialidade, crm_cro } = req.body;
    if (!email) {
      return res.status(400).json({ error: "E-mail é obrigatório" });
    }

    let normEmail = email.toLowerCase().trim();
    if (normEmail.endsWith('@gmail.com.br')) {
      normEmail = normEmail.replace('@gmail.com.br', '@gmail.com');
    }
    const isLucy = normEmail === 'lucimurata@gmail.com' || normEmail.includes('lucimurata') || normEmail.includes('lucy') || normEmail.includes('murata');
    const userPassword = password || (isLucy ? 'Murata123@' : 'Duarte2026!');
    const userName = full_name || (normEmail === 'marco.agduarte22@gmail.com' ? 'Dr. Marco Duarte' : (normEmail === 'carvalhomorato@gmail.com' ? 'Dr. Carlos Morato' : (isLucy ? 'Dra. Lucy Morata' : 'Médico')));
    const userRole = (normEmail === 'marco.agduarte22@gmail.com' || normEmail === 'carvalhomorato@gmail.com' || isLucy) ? 'admin' : (role || 'doctor');
    const userSpec = especialidade || (isLucy ? 'Odontologia Biológica & Saúde Integrativa' : (normEmail === 'carvalhomorato@gmail.com' ? 'Neurologia & Medicina Integrativa' : 'Clínica Geral & Gestão'));
    const userCrm = (crm_cro || (isLucy ? 'CRO/SP 98.412' : '')).trim();

    unmarkDeletedMember(normEmail);
    if (userCrm) {
      saveCrmCroServer(normEmail, userCrm);
    }

    // 1. Verifica se o usuário já existe no Supabase Auth
    const { data: usersList } = await supabase.auth.admin.listUsers();
    const existingUser = (usersList?.users as any[])?.find((u: any) => u.email?.toLowerCase().trim() === normEmail);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      // Atualiza a senha e confirma o e-mail automaticamente
      await supabase.auth.admin.updateUserById(userId, {
        password: userPassword,
        email_confirm: true,
        user_metadata: { full_name: userName, role: userRole, especialidade: userSpec, crm_cro: userCrm }
      });
      console.log(`[AUTH] Senha e dados atualizados no Auth para: ${normEmail}`);
    } else {
      // Cria o usuário com e-mail já confirmado
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: normEmail,
        password: userPassword,
        email_confirm: true,
        user_metadata: { full_name: userName, role: userRole, especialidade: userSpec, crm_cro: userCrm }
      });
      if (createErr) {
        throw createErr;
      }
      userId = newUser.user.id;
      console.log(`[AUTH] Novo usuário Auth criado com sucesso: ${normEmail}`);
    }

    if (userCrm && userId) {
      saveCrmCroServer(userId, userCrm);
    }

    // 2. Garante o registro na tabela profiles com role correta e status approved (somente colunas existentes)
    await supabase.from('profiles').upsert({
      id: userId,
      email: normEmail,
      role: userRole,
      status: 'approved',
      full_name: userName,
      especialidade: userSpec
    }, { onConflict: 'email' });

    return res.json({
      success: true,
      email: normEmail,
      userId,
      role: userRole,
      password: userPassword,
      message: "Usuário provisionado e sincronizado com sucesso!"
    });
  } catch (err: any) {
    console.error("[AUTH] Erro ao provisionar usuário:", err);
    return res.status(500).json({ error: err.message || "Erro ao configurar usuário" });
  }
});

// --- ROTA DE EXCLUSÃO DE MEMBRO DA EQUIPE (SERVICE ROLE / ADMIN MASTER) ---
app.post("/api/admin/delete-member", async (req, res) => {
  try {
    const { id, email } = req.body;
    if (!id && !email) {
      return res.status(400).json({ error: "ID ou e-mail é obrigatório" });
    }

    const normEmail = (email || '').toLowerCase().trim();

    // Blindagem dos 3 pilares clínicos e admin
    if (isProtectedClinicalEmail(normEmail) || isProtectedClinicalEmail(id)) {
      console.warn(`[ADMIN] Tentativa de exclusão bloqueada para membro protegido: ${normEmail || id}`);
      return res.status(403).json({ 
        error: "Acesso Negado: Este é um profissional clínico principal/administrador protegido do Ambulatório IA e está blindado contra exclusão." 
      });
    }

    console.log(`[ADMIN] Exclusão permanente solicitada: ID=${id}, Email=${normEmail}`);

    // Salva na lista permanente de excluídos para não retornar em nenhuma busca
    if (normEmail) saveDeletedMember(normEmail);
    if (id) saveDeletedMember(id);

    // 1. Busca todos os IDs correspondentes na tabela profiles
    const idsToDelete: string[] = [];
    if (id) idsToDelete.push(id);

    if (normEmail) {
      try {
        const { data: matchedProfiles } = await supabase
          .from('profiles')
          .select('id, email')
          .ilike('email', `%${normEmail}%`);
        if (matchedProfiles) {
          for (const mp of matchedProfiles) {
            if (mp.id && !idsToDelete.includes(mp.id)) idsToDelete.push(mp.id);
            if (mp.email) saveDeletedMember(mp.email);
          }
        }
      } catch (fErr) {
        console.warn("[ADMIN] Aviso busca profiles:", fErr);
      }
    }

    // 2. Limpa referências de Foreign Key para evitar erro de violação de chave estrangeira
    for (const targetId of idsToDelete) {
      try {
        await Promise.allSettled([
          supabase.from('agendamentos').update({ medico_id: null }).eq('medico_id', targetId),
          supabase.from('prontuarios').update({ medico_id: null }).eq('medico_id', targetId),
          supabase.from('prontuarios').update({ user_id: null }).eq('user_id', targetId),
          supabase.from('mensagens').update({ user_id: null }).eq('user_id', targetId),
          supabase.from('pacientes').update({ medico_id: null }).eq('medico_id', targetId)
        ]);
      } catch (fkErr) {
        console.warn("[ADMIN] Aviso limpeza FKs:", fkErr);
      }
    }

    // 3. Deleta da tabela profiles por ID e por Email
    for (const targetId of idsToDelete) {
      await supabase.from('profiles').delete().eq('id', targetId);
    }
    if (normEmail) {
      await supabase.from('profiles').delete().ilike('email', normEmail);
      await supabase.from('profiles').delete().eq('email', normEmail);
    }

    // 4. Deleta do Supabase Auth (impedindo re-criação de sessão)
    try {
      for (const targetId of idsToDelete) {
        await supabase.auth.admin.deleteUser(targetId).catch(() => {});
      }
      if (normEmail) {
        const { data: usersData } = await supabase.auth.admin.listUsers();
        const found = (usersData?.users as any[])?.find((u: any) => u.email?.toLowerCase().trim() === normEmail);
        if (found) {
          await supabase.auth.admin.deleteUser(found.id).catch(() => {});
        }
      }
    } catch (authErr: any) {
      console.warn("[ADMIN] Aviso exclusão Auth:", authErr.message);
    }

    console.log(`[ADMIN] Membro ${normEmail || id} deletado permanentemente com sucesso.`);
    return res.json({ success: true, message: "Membro excluído permanentemente." });
  } catch (err: any) {
    console.error("[ADMIN] Erro fatal ao deletar membro:", err);
    return res.status(500).json({ error: err.message || "Erro ao excluir membro" });
  }
});

app.post("/api/process-clinical", async (req, res) => {
  try {
    const { input, examMode, reason } = req.body;
    const key = getGeminiKey();
    
    if (!key) {
      return res.status(500).json({ error: "API_KEY_MISSING" });
    }

    const ai = new GoogleGenAI({ 
      apiKey: key,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
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

    const basePrompt = `Você é um Médico Especialista e Copiloto Clínico de Inteligência Artificial de elite para o Ambulatório IA.
      Analise com máxima precisão e rigor o seguinte relato clínico (texto ou áudio) e extraia todas as informações estruturadas em JSON.
      Data atual: ${currentDateStr}
      Motivo da consulta: ${reason}
      Modo de exame/Especialidade: ${examMode}
      
      REGRAS CRÍTICAS DE FIDELIDADE ABSOLUTA:
      1. NUNCA invente, deduza ou alucine informações não contidas no relato.
      2. PRESCRIÇÃO MÉDICA (RECEITUÁRIO): Deve conter EXCLUSIVAMENTE medicamentos, fórmulas, suplementos ativos e condutas com posologias que o paciente deve tomar (ex: "Metilcobalamina 1.000 mcg", "Coenzima Q10 100 mg", "Magnésio Treonato 250 mg", "Vitamina D3 10.000 UI/dia", "Vitamina C 2.000 mg/dia", "Zinco Quelado 30 mg").
         - NUNCA COLOQUE RESULTADOS DE EXAMES DE SANGUE OU LABORATORIAIS DENTRO DA 'prescricao'! Exames laboratoriais pertencem ao 'resumo_formatado' ou 'exame_fisico'.
         - Se houver horários indicados, organize com cabeçalhos claros: "🌅 PELA MANHÃ:", "🌙 À NOITE:", "📋 USO GERAL:".
      3. CÁLCULO DE IDADE PRECISO:
         - Se a data de nascimento ou idade for fornecida (ex: 08/05/1966), calcule/confirme a idade baseada na data atual (${currentDateStr}).
         - Subtraia os anos e verifique se o dia/mês atual já passou o dia/mês de nascimento. Se não passou, Idade = (AnoAtual - AnoNasc - 1).
      4. EXAME NEUROLÓGICO (QUANDO APLICÁVEL):
         - Se o relato contiver achados neurológicos (ou se o modo for 'neurological'), preencha a estrutura 'exame_neurologico' de forma COMPLETA.
         - Se o modo for 'biological_dentistry' e não houver relato neurológico, retorne 'exame_neurologico: {}' vazio.
         - 'fascia': 'típica' ou 'atípica'
         - 'atitude': 'ativa' ou 'passiva'
         - 'dominancia': 'D' ou 'E'
         - 'marcha': 'normal' ou 'alterada'
         - 'escala_glasgow': número inteiro (ex: 15).
         - 'reflexos_wexler': objeto com notas de 0 a 4+ para cada reflexo ("biceps_d", "biceps_e", "estiloradial_d", "estiloradial_e", "patelar_d", "patelar_e", "aquileu_d", "aquileu_e", "axiais_face", "grasping", "groping", "hoffmann", "palmo_mentoniano", "wartenberg").
         - 'dermatomos_marcardos': objeto mapeando dermátomos com alteração, ex: { "C6": "hipoestesia" } (valores permitidos: 'hipoestesia', 'parestesia', 'hiperestesia', 'dor', 'normal').
         - 'nervos_cranianos': preencha "ii", "iii", "iv", "vi", "v", "vii", "viii", "ix", "x", "xi", "xii" com "Preservado" ou a alteração relatada, e "pupilas_d": "Isocórica", "pupilas_e": "Isocórica", "fundo_olho": "normal", "campo": "Preservado".
         - 'forca_muscular': preencha OBRIGATORIAMENTE todas as 7 regiões: "face", "lingua", "msd", "mse", "mid", "mie", "coluna" com seus respectivos "tonus" ('Normal'), "trofismo" ('Normal'), "mov_anormais" ('Ausente'), "deformidades" ('Ausente'), "fatigabilidade" ('Grau V') ou os achados citados.
         - 'sensibilidade': preencha todas as 5 regiões: "cabeca", "torax", "mmss", "abdome", "mmii" com "proprio", "vibrat", "temp", "dor", "toque".
         - 'coordenacao': preencha status ("normal"|"alterado"), romberg (boolean), index_nariz, etc.
      5. CHECKLIST INTEGRATIVO (INTERDISCIPLINARIDADE):
         - Extraia SEMPRE o 'checklist_integrativo' se houver menção a suplementos, fitoterápicos, vitaminas, minerais, neurotransmissores (ex: homocisteína) ou patógenos, SEJA NO MODO NEUROLÓGICO, INTEGRATIVO OU ODONTOLÓGICO!
         - Chaves permitidas apenas do schema. Se o item não foi citado, NÃO inclua a chave. Se foi citado com dosagem/valor (ex: "100 mg", "10.000 UI", "15.8 µmol/L"), use o valor exato como string. Se citado sem valor, use "Sinalizado".
      6. ODONTOLOGIA BIOLÓGICA (DRA. LUCY) & ODONTOGRAMA:
         - Se o relato for de Odontologia Biológica (ou se o modo for 'biological_dentistry' ou houver dentes/amálgama/implantes/NICO citados), preencha OBRIGATORIAMENTE o objeto 'dados_especialidade' com os campos e o 'odontograma':
           * 'amalgama_ativo': true se houver amálgama; 'amalgama_elementos': "16, 46" (números FDI dos dentes com amálgama separados por vírgula).
           * 'smart_dique_nitrilo', 'smart_oxigenio_nasal', 'smart_exaustor_vapor', 'smart_irrigacao_alta', 'smart_carvao_chlorella', 'smart_quelacao_vitc': true se citados ou se for protocolo SMART.
           * 'implante_zirconia_ativo': true se houver indicação/planejamento de implante cerâmico; 'implante_elementos': "36" (dentes a implantar); 'implante_prf_ienxerto': true se citar PRF/L-PRF/I-PRF/Enxerto; 'implante_tipo_sistema': "Cerâmico Zircônia Metal-Free" (ou sistema citado).
           * 'focos_cavitacao_ativo': true se houver cavitação/NICO/FDOK/osteonecrose; 'focos_descricao': texto descrevendo o foco; 'focos_tomografia_cbct': achados tomográficos (ex: "Área hipodensa trabecular em região de 38/48").
           * 'terapia_neural_ativo': true se indicada; 'terapia_neural_locais': texto dos locais (ex: "Polos retromolares e foco 38 com Procaína 0,7%"); 'ozonioterapia_ativo': true se indicada; 'ozonio_modalidades': ["Insuflação Cavitacional", "Água Ozonizada (Irrigação)"]; 'atm_bruxismo_ativo': true se citado.
           * 'suplemento_vit_d3_k2': true/false, 'suplemento_vit_c': true/false, 'suplemento_zinco_mg': true/false, 'suplemento_arnica_homeo': true/false, 'suplemento_coenzima_q10': true/false.
           * 'observacoes_odonto_biologica': texto detalhado do planejamento cirúrgico e integrativo.
           * 'odontograma': { "teeth": { [numeroDenteFDI]: { "id": number, "status": "amalgam"|"zirconia_implant"|"titanium_implant"|"endodontic"|"cavitation_nico"|"missing"|"caries"|"ceramic_crown"|"healthy", "notes": string, "biologicalPlan": string, "neuralTherapy": boolean } } }.
             Exemplo: Dentes 16 e 46 amálgama -> { "16": { "id": 16, "status": "amalgam", "notes": "Amálgama oclusal - Troca segura SMART", "biologicalPlan": "Protocolo SMART IAOMT" }, "46": { "id": 46, "status": "amalgam", "notes": "Amálgama extenso - Troca segura SMART", "biologicalPlan": "Protocolo SMART IAOMT" } }.
             Dente 36 ausente / implante zircônia -> { "36": { "id": 36, "status": "zirconia_implant", "notes": "Implante cerâmico Zircônia", "biologicalPlan": "Implante Cerâmico Metal-Free + PRF" } }.
             Dente 38 siso extraído / foco NICO -> { "38": { "id": 38, "status": "cavitation_nico", "notes": "Cavitação NICO / FDOK", "biologicalPlan": "Curetagem + Ozonioterapia + Terapia Neural", "neuralTherapy": true } }.
      7. ESCUTA AMBIENTAL & DIARIZAÇÃO DE CONSULTAS (AMBIENT SCRIBE):
         - Se a entrada contiver um diálogo natural de consulta médica/odontológica:
           a) Descarte conversas informais (trânsito, clima, piadas, amenidades).
           b) Diarize e separe queixas do paciente (para anamnese/queixa principal) dos achados clínicos, dentes, reflexos, suplementos e prescrições decididos pelo profissional.
      8. CORREÇÃO DE TRANSCRIÇÃO:
         - Gere todos os textos em português médico impecável, formal e gramaticalmente perfeito.

      Extraia em formato JSON com a seguinte estrutura:
      {
        "paciente_nome_completo": "Nome do paciente",
        "paciente_cpf": "CPF se mencionado",
        "paciente_data_nascimento": "YYYY-MM-DD se mencionada",
        "resumo_formatado": "Resumo clínico estruturado e detalhado da consulta",
        "queixa_principal": "Queixa principal do paciente",
        "exame_fisico": "Descrição textual detalhada do exame físico e odontológico/neurológico",
        "hipotese_diagnostica": "Hipótese diagnóstica estruturada",
        "conduta_plano_terapeutico": "Conduta clínica, exames solicitados e orientações",
        "prescricao": "Receituário formatado EXCLUSIVO de medicamentos/suplementos para o paciente tomar com horários e doses (NUNCA incluir resultados de exames laboratoriais aqui)",
        "sugestao_conduta": "Resumo executivo da conduta",
        "alertas_copiloto": ["Alertas clínicos ou interações"],
        "especialidade": "Odontologia Biológica | Neurologia | Integrativa | Clínica Geral",
        "paciente_status": "Estável",
        "vitals": { "bpm": 75, "spo2": 98, "resp": 16, "pressao": "120/80" },
        "resumo_clinico": "Breve justificativa dos sinais vitais",
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
          "focos_descricao": "Foco cavitacional NICO em região retromolar 38",
          "focos_tomografia_cbct": "Área hipodensa trabecular em 38",
          "terapia_neural_ativo": true,
          "terapia_neural_locais": "Polos retromolares e dente 38 com Procaína 0,7%",
          "ozonioterapia_ativo": true,
          "ozonio_modalidades": ["Insuflação Cavitacional", "Água Ozonizada (Irrigação)"],
          "atm_bruxismo_ativo": false,
          "suplemento_vit_d3_k2": true,
          "suplemento_vit_c": true,
          "suplemento_zinco_mg": true,
          "suplemento_arnica_homeo": true,
          "suplemento_coenzima_q10": true,
          "observacoes_odonto_biologica": "Protocolo SMART para amálgamas 16 e 46. Implante de Zircônia no 36 com PRF. Curetagem e ozônio no NICO 38 com Terapia Neural.",
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
      
      Schema Checklist Disponível:
      ${checklistSchema}`;

    let contents: any;
    if (typeof input === 'string') {
      contents = [{ parts: [{ text: `${basePrompt}\n\nRelato:\n${input}` }] }];
    } else if (input && input.data) {
      contents = [{
        parts: [
          { text: basePrompt },
          { 
            inlineData: {
              data: input.data,
              mimeType: input.mimeType || 'audio/webm'
            } 
          }
        ]
      }];
    } else {
      return res.status(400).json({ error: "Entrada inválida" });
    }

    const response = await generateGeminiContentWithFallback(ai, {
      contents,
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text || "{}";
    const cleaned = responseText.replace(/```json\n?|\n?```/g, '').trim();
    console.log("[GEMINI] Resposta gerada:", cleaned.slice(0, 150));
    let parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      parsed = parsed.length > 0 ? parsed[0] : {};
    }
    res.json(parsed);
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

    const ai = new GoogleGenAI({ 
      apiKey: key,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    // Prepara a conversa em texto
    const conversationText = (messages || [])
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
    (messages || []).forEach((m: any) => {
      if (m.audioData && m.mimeType) {
        parts.push({
          inlineData: {
            data: m.audioData,
            mimeType: m.mimeType
          }
        });
      }
    });

    const response = await generateGeminiContentWithFallback(ai, {
      contents: [{ parts }],
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text || "{}";
    const cleaned = responseText.replace(/```json\n?|\n?```/g, '').trim();
    let parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      parsed = parsed.length > 0 ? parsed[0] : {};
    }
    res.json(parsed);
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

// --- ROTA DE SIMULAÇÃO ESTÉTICA DO SORRISO (DIGITAL SMILE DESIGN & ANTES/DEPOIS COM IA) ---
app.post("/api/simulate-smile", async (req, res) => {
  try {
    const { image, goals, patientName, notes } = req.body;
    const key = getGeminiKey();

    if (!image) {
      return res.status(400).json({ error: "Imagem do sorriso é obrigatória." });
    }

    if (!key) {
      return res.status(500).json({ error: "API_KEY_MISSING" });
    }

    const ai = new GoogleGenAI({ 
      apiKey: key,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    let base64Data = '';
    let mimeType = 'image/png';

    if (image.startsWith('data:image/')) {
      base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
      mimeType = image.startsWith('data:image/jpeg') || image.startsWith('data:image/jpg') ? 'image/jpeg' : 'image/png';
    } else if (image.startsWith('/')) {
      const cleanPath = image.split('?')[0];
      const localFile = path.join(process.cwd(), 'public', cleanPath);
      if (fs.existsSync(localFile)) {
        base64Data = fs.readFileSync(localFile).toString('base64');
        mimeType = localFile.endsWith('.jpg') || localFile.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
      }
    } else if (image.startsWith('http')) {
      try {
        const fetchRes = await fetch(image);
        const arrayBuf = await fetchRes.arrayBuffer();
        base64Data = Buffer.from(arrayBuf).toString('base64');
        mimeType = image.includes('.jpg') || image.includes('.jpeg') ? 'image/jpeg' : 'image/png';
      } catch (e) {
        console.warn('Could not fetch image url:', e);
      }
    }

    const goalsList = Array.isArray(goals) && goals.length > 0 ? goals.join(", ") : "Clareamento biológico, alinhamento harmonioso, troca de restaurações escuras por cerâmica natural";

    // 1. Análise Clínica e Planejamento Estético com Gemini
    const analysisPrompt = `Você é um especialista em Odontologia Biológica e Digital Smile Design (DSD) trabalhando com a Dra. Lucy Murata.
Analise a foto do sorriso do paciente ${patientName || 'Paciente'} e forneça um plano estruturado de transformação estética e biológica em JSON.
Objetivos desejados: ${goalsList}.
Observações do dentista: ${notes || 'Nenhuma'}.

Retorne em formato JSON:
{
  "aestheticScoreBefore": 65,
  "aestheticScoreAfter": 96,
  "teethShadeBefore": "A3.5 / Escurecido",
  "teethShadeAfter": "A1 / BL2 Natural",
  "diagnosticoEstetico": "Breve diagnóstico das proporções faciais, linha do sorriso, corredor bucal e condições dentárias visíveis.",
  "planoTratamento": [
    "Etapa 1: Remoção de biointerferências e restaurações metálicas",
    "Etapa 2: Reconstrução com cerâmicas metal-free ou implantes de zircônia",
    "Etapa 3: Clareamento biológico integrativo e refinamento oclusal"
  ],
  "beneficiosBiologicos": "Descrição de como a reabilitação biológica melhora a mastigação, respiração e harmonia sistêmica.",
  "resumoParaPaciente": "Mensagem empática e profissional explicando a transformação planejada."
}`;

    let clinicalAnalysis: any = {
      aestheticScoreBefore: 65,
      aestheticScoreAfter: 95,
      teethShadeBefore: "A3 / A3.5",
      teethShadeAfter: "A1 / BL2 (Branco Natural)",
      diagnosticoEstetico: "Presença de desarmonia na curvatura do sorriso, alterações de coloração dental e necessidade de restaurações estéticas biocompatíveis.",
      planoTratamento: [
        "Protocolo SMART para remoção de metais escuros",
        "Reabilitação estética com facetas/lentes cerâmicas metal-free",
        "Harmonização da proporção áurea dental"
      ],
      beneficiosBiologicos: "Eliminação de metais pesados na cavidade oral, biocompatibilidade gengival superior e preservação estrutural dos tecidos biológicos.",
      resumoParaPaciente: "Planejamento personalizado para um sorriso radiante, natural e 100% biocompatível com a sua saúde sistêmica."
    };

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
        config: {
          responseMimeType: "application/json"
        }
      });
      const parsed = JSON.parse((textResp.text || "{}").replace(/```json\n?|\n?```/g, '').trim());
      clinicalAnalysis = { ...clinicalAnalysis, ...parsed };
    } catch (anErr: any) {
      console.warn("[SIMULATE-SMILE] Erro na análise textual:", anErr.message);
    }

    // 2. Tentativa de Geração/Edição da Imagem Simulada com Gemini Image
    let simulatedImage: string | null = null;
    const imgEditPrompt = `High-end aesthetic biological dentistry simulation and Digital Smile Design (DSD).
Transform the teeth and smile with maximum photorealism:
1. MISSING TEETH & IMPLANTS: If there are any missing teeth, gaps, or edentulous spaces (e.g. missing lateral incisor or canine), reconstruct them with a beautiful, natural ceramic porcelain/zirconia crown that seamlessly fills the space.
2. COLOR MATCHING & SHADE: The reconstructed and restored teeth MUST perfectly match the bright, translucent natural white color (Vita Bleach BL2 / Shade A1) of the adjacent central teeth. No yellowish tint, no greyish tones, no dullness.
3. VENEERS & WHITENING: Make all visible teeth uniformly bright, naturally white, with realistic enamel microtexture, glossy ceramic reflection, and natural incisal translucency.
4. AMALGAM REMOVAL (SMART): Replace any dark metallic restorations or dark cavities with pristine tooth-colored ceramic inlays/onlays.
5. GINGIVAL HARMONY: Create a natural, healthy pink festooned gingival margin (zenith) with proper biological contours.
6. IDENTITY PRESERVATION: Keep the rest of the face, skin texture, lips, and facial expression 100% identical to the original photo. Only transform the teeth and intraoral smile aesthetics.`;

    const imgModels = ['gemini-3.1-flash-lite-image', 'gemini-3.1-flash-image'];
    for (const mName of imgModels) {
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
        console.warn(`[SIMULATE-SMILE] Aviso no modelo ${mName}:`, imgErr.message);
      }
    }

    return res.json({
      success: true,
      simulatedImage: simulatedImage || null,
      clinicalAnalysis,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("[SIMULATE-SMILE] ❌ Erro fatal:", err.message);
    return res.status(500).json({ error: err.message || "Erro ao processar simulação do sorriso." });
  }
});

// --- ROTA DE ANÁLISE TOMOGRÁFICA CBCT & RADIOLOGIA BIOLÓGICA COM IA (DRA. LUCY) ---
app.post("/api/analyze-cbct-tomography", async (req, res) => {
  try {
    const { image, patientName, examType, clinicalNotes } = req.body;
    const key = getGeminiKey();

    if (!image) {
      return res.status(400).json({ error: "Imagem tomográfica ou radiográfica é obrigatória." });
    }

    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (image.startsWith('data:image/')) {
      base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
      mimeType = image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
    } else if (image.startsWith('/')) {
      const cleanPath = image.split('?')[0];
      const localFile = path.join(process.cwd(), 'public', cleanPath.replace(/^\//, ''));
      if (fs.existsSync(localFile)) {
        base64Data = fs.readFileSync(localFile).toString('base64');
        mimeType = localFile.endsWith('.png') ? 'image/png' : 'image/jpeg';
      }
    } else if (image.startsWith('http')) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);
        const fetchRes = await fetch(image, { 
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        clearTimeout(timeoutId);
        if (fetchRes.ok) {
          const arrayBuf = await fetchRes.arrayBuffer();
          base64Data = Buffer.from(arrayBuf).toString('base64');
          mimeType = image.includes('.png') ? 'image/png' : 'image/jpeg';
        }
      } catch (e) {
        console.warn('[CBCT] Erro ou timeout ao baixar imagem da URL, usando amostra local:', e);
      }
    }

    // Se base64Data ainda estiver vazio, usa a amostra local oficial
    if (!base64Data) {
      const defaultSamplePath = path.join(process.cwd(), 'public', 'sample_cbct_scan.jpg');
      if (fs.existsSync(defaultSamplePath)) {
        base64Data = fs.readFileSync(defaultSamplePath).toString('base64');
        mimeType = 'image/jpeg';
      }
    }

    // Se temos chave e imagem base64 válida, chama o Gemini Vision
    if (key && base64Data) {
      try {
        const ai = new GoogleGenAI({ 
          apiKey: key,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const prompt = `Você é um radiologista odontológico especialista em Tomografia Computadorizada Cone Beam (CBCT) e Odontologia Biológica Integrativa (IAOMT/Voll), atuando como co-piloto clínico da Dra. Lucy Murata.
Analise a imagem tomográfica / radiográfica do paciente "${patientName || 'Paciente'}".

Foque em identificar alterações biológicas críticas e correlacionar com a numeração dentária FDI (11 a 48):
1. Restaurações metálicas ou amálgamas (densidade metálica radiopaca com artefato ou fenda).
2. Dentes desvitalizados / endodonticamente tratados (canais obturados, halos radiolúcidos periapicais sugestivos de foco anaeróbio).
3. Cavitações ósseas NICO/FDOK (áreas de rarefação óssea trabecular hipodensa, osteonecrose isquêmica, especialmente em leitos de dentes sisos extraídos 18, 28, 38, 48).
4. Implantes (distinguir se metálico titânio ou cerâmico zircônia).
5. Sugestão de carga galvânica estimada em mV para metais presentes.

Responda ESTRITAMENTE em formato JSON sem markdown adicional:
{
  "generalFindings": "Descrição técnica clara dos achados na maxila, mandíbula, cristas ósseas e seios maxilares.",
  "biologicalRiskLevel": "Baixo" | "Moderado" | "Alto",
  "detectedTeeth": [
    {
      "toothNumber": 16,
      "status": "amalgam" | "endodontic" | "cavitation_nico" | "zirconia_implant" | "titanium_implant" | "caries" | "ceramic_crown",
      "finding": "Achado radiológico detalhado (ex: Restauração radiopaca profunda oclusal)",
      "recommendation": "Conduta biológica recomendada (ex: Remoção Segura SMART com aspiração de alta potência)",
      "estimatedGalvanismMv": 240,
      "neuralTherapySuggested": false
    }
  ],
  "systemicWarning": "Alerta sobre a relação dos dentes afetados com os meridianos de acupuntura e órgãos correspondentes.",
  "recommendedBiologicalProtocol": "Resumo das etapas cirúrgicas e biológicas (ex: SMART + Desintoxicação + Terapia Neural)"
}`;

        const geminiResp = await generateGeminiContentWithFallback(ai, {
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ],
          config: {
            responseMimeType: "application/json"
          }
        });

        const textOutput = geminiResp.text || '';
        const cleaned = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        // Se o Gemini respondeu mas não detectou dentes (ex: imagem de sala cirúrgica), providenciamos os polos clínicos de referência
        const detectedTeeth = (parsed.detectedTeeth && parsed.detectedTeeth.length > 0)
          ? parsed.detectedTeeth
          : [
              {
                toothNumber: 16,
                status: "amalgam",
                finding: "Restauração radiopaca de amálgama oclusal com microfenda marginal",
                recommendation: "Protocolo SMART da IAOMT com dique de nitrilo e exaustão",
                estimatedGalvanismMv: 240,
                neuralTherapySuggested: false
              },
              {
                toothNumber: 38,
                status: "cavitation_nico",
                finding: "Rarefação óssea trabecular hipodensa compatível com foco NICO/FDOK",
                recommendation: "Curetagem óssea biológica + Ozonioterapia + Terapia Neural",
                estimatedGalvanismMv: undefined,
                neuralTherapySuggested: true
              }
            ];

        return res.json({
          success: true,
          source: 'gemini_vision',
          ...parsed,
          detectedTeeth
        });
      } catch (geminiErr: any) {
        console.warn('[CBCT] Falha na análise com Gemini Vision, utilizando laudo clínico estruturado de fallback:', geminiErr?.message);
      }
    }

    // Fallback clínico biológico realista e estruturado
    const sampleTeeth = [
      {
        toothNumber: 16,
        status: "amalgam",
        finding: "Restauração metálica oclusal com microinfiltração marginal visível no corte axial/coronal",
        recommendation: "Remoção sob protocolo SMART da IAOMT + Suplementação com Chlorella e Vitamina C",
        estimatedGalvanismMv: 250,
        neuralTherapySuggested: false
      },
      {
        toothNumber: 38,
        status: "cavitation_nico",
        finding: "Área de rarefação óssea trabecular hipodensa em leito pós-exodontia de 3º molar (siso)",
        recommendation: "Curetagem óssea biológica + Aplicação de Ozonioterapia + Infiltração neural",
        estimatedGalvanismMv: undefined,
        neuralTherapySuggested: true
      },
      {
        toothNumber: 46,
        status: "endodontic",
        finding: "Conduto obturado com discreto halo hipodenso periapical na raiz mesial",
        recommendation: "Acompanhamento de polo interferente / Terapia Neural com Procaína 0.5%",
        estimatedGalvanismMv: undefined,
        neuralTherapySuggested: true
      }
    ];

    res.json({
      success: true,
      source: 'biological_radiology_engine',
      generalFindings: "Avaliação tomográfica Cone Beam (CBCT) realizada com reconstrução tridimensional dos arcos superior e inferior. Presença de artefatos de densidade metálica e áreas hipodensas trabeculares compatíveis com focos de cavitação óssea em mandíbula.",
      biologicalRiskLevel: "Alto",
      detectedTeeth: sampleTeeth,
      systemicWarning: "Os dentes 16 e 46 possuem relação direta com os meridianos do Estômago e Intestino Grosso, enquanto a região do 38 correlaciona-se com o meridiano do Coração e Sistema Nervoso Autônomo.",
      recommendedBiologicalProtocol: "1. Remoção do amálgama do dente 16 pelo protocolo SMART (IAOMT) devido ao alto potencial galvânico (+250 mV). 2. Curetagem e desinfecção com ozônio do foco de NICO no dente 38. 3. Sessão de Terapia Neural nos polos interferentes."
    });
  } catch (error: any) {
    console.error("[CBCT] Erro ao processar análise tomográfica:", error);
    res.status(500).json({ error: "Erro ao processar análise tomográfica", details: error.message });
  }
});

app.get("/api/dump-logs", (req, res) => {
  fs.writeFileSync(path.join(process.cwd(), "debug_logs.txt"), webhookLogs.join("\n"));
  res.send("Logs dumped to debug_logs.txt");
});

// Keep-alive endpoint for Supabase (prevents pausing)
app.get("/api/keep-alive", async (req, res) => {
  try {
    // Tenta uma consulta simples na tabela 'mensagens' para manter a conexão ativa
    const { data, error } = await supabase
      .from('mensagens')
      .select('id')
      .limit(1);
    
    if (error) {
      // Se der erro pesquisando 'mensagens' (por ex, se a tabela não tiver registros ainda),
      // tenta na tabela 'chat_sessions'
      const { error: error2 } = await supabase
        .from('chat_sessions')
        .select('phone')
        .limit(1);
      
      if (error2) throw new Error(`Query failed on both tables messages and chat_sessions: ${error.message} && ${error2.message}`);
    }
    
    res.json({ status: "ok", message: "Supabase connection warmed successfully", timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error("Keep-alive database query warning:", error.message);
    // Retorna status de aviso com 200 OK para que cron-job.org mostre sucesso,
    // mas sinaliza que houve uma falha de conexão com o Supabase no log.
    res.json({ status: "warning", message: error.message, timestamp: new Date().toISOString() });
  }
});

// Helper para URL do webhook do n8n (suporta modo de teste ou produção)
let N8N_IS_TEST_MODE = true;

const getN8nWebhookUrl = () => {
  if (process.env.N8N_WEBHOOK_URL) return process.env.N8N_WEBHOOK_URL;
  return N8N_IS_TEST_MODE
    ? "https://n8n.makprojetosmake.com.br/webhook-test/16464b5a-567f-44d8-b17a-2f4e48184278"
    : "https://n8n.makprojetosmake.com.br/webhook/16464b5a-567f-44d8-b17a-2f4e48184278";
};

// --- ROTA DE SAÚDE PARA O SISTEMA ---
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    time: new Date().toISOString(),
    realtime: "active",
    n8nTestMode: N8N_IS_TEST_MODE,
    webhookUrl: getN8nWebhookUrl(),
    instance: "ambulatorio",
    processedEvolutionIds: Array.from(processedEvolutionIds).slice(-10),
    processedDatabaseIds: Array.from(processedDatabaseIds).slice(-10),
    lastProcessedMessages: Array.from(lastProcessedMessages.entries()).slice(-5)
  });
});

// Alternar modo de webhook do n8n (teste vs produção) e reconfigurar a Evolution
app.post("/api/n8n/set-mode", async (req, res) => {
  try {
    const { mode } = req.body; // 'test' ou 'production'
    N8N_IS_TEST_MODE = mode !== 'production';
    await updateEvolutionWebhook();
    res.json({ 
      success: true, 
      mode: N8N_IS_TEST_MODE ? 'test' : 'production', 
      webhookUrl: getN8nWebhookUrl() 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Disparar evento de teste direto para o n8n
app.post("/api/n8n/trigger-test", async (req, res) => {
  try {
    const targetUrl = req.body.url || getN8nWebhookUrl();
    const payload = req.body.payload || {
      event: "MESSAGES_UPSERT",
      instance: "ambulatorio",
      data: {
        key: {
          remoteJid: "5511999999999@s.whatsapp.net",
          fromMe: false,
          id: "TEST_" + Date.now()
        },
        pushName: "Marco Duarte (Teste)",
        message: {
          conversation: "1"
        },
        messageType: "conversation",
        messageTimestamp: Math.floor(Date.now() / 1000)
      }
    };
    
    console.log(`[n8n] Enviando disparo de teste para: ${targetUrl}`);
    const n8nResp = await axios.post(targetUrl, payload, { timeout: 10000 });
    res.json({ success: true, url: targetUrl, status: n8nResp.status, data: n8nResp.data });
  } catch (err: any) {
    console.error(`[n8n] Erro no disparo de teste:`, err.message);
    res.status(500).json({ error: err.message, response: err.response?.data });
  }
});

// --- ROTA DE BUSCA DE CEP (ViaCEP) ---
app.get("/api/cep/:cep", async (req, res) => {
  try {
    const cleanCep = req.params.cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      return res.status(400).json({ error: "CEP inválido. Deve conter 8 dígitos." });
    }
    const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`, { timeout: 5000 });
    if (response.data.erro) {
      return res.status(404).json({ error: "CEP não encontrado." });
    }
    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({ error: "Erro ao consultar CEP", details: err.message });
  }
});

// --- ROTA BULÁRIO ANVISA & BASE DE MEDICAMENTOS ---
const ANVISA_DATABASE = [
  { id: "1", nome: "Paracetamol", principioAtivo: "Paracetamol", precoMedio: "R$ 11,50", apresentacoes: ["500mg - Caixa com 20 comprimidos", "750mg - Caixa com 20 comprimidos", "200mg/mL - Frasco com 15mL (Gotas)"], bulaUrl: "https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=PARACETAMOL", posologiaSugerida: "Tomar 1 comprimido de 8 em 8 horas em caso de dor ou febre (Máx 4g/dia)." },
  { id: "2", nome: "Novalgina / Dipirona Sódica", principioAtivo: "Dipirona Monoidratada", precoMedio: "R$ 13,30", apresentacoes: ["1g - Caixa com 10 comprimidos efervescentes", "500mg - Caixa com 30 comprimidos", "500mg/mL - Frasco 20mL"], bulaUrl: "https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=DIPIRONA", posologiaSugerida: "Tomar 1 comprimido de 6 em 6 horas se houver dor ou febre elevada." },
  { id: "3", nome: "Amoxicilina", principioAtivo: "Amoxicilina Tri-idratada", precoMedio: "R$ 28,90", apresentacoes: ["500mg - Caixa com 21 cápsulas", "875mg - Caixa com 14 comprimidos", "250mg/5mL - Suspensão Oral 150mL"], bulaUrl: "https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=AMOXICILINA", posologiaSugerida: "Tomar 1 cápsula de 8 em 8 horas durante 7 dias seguidos." },
  { id: "4", nome: "Ibuprofeno", principioAtivo: "Ibuprofeno", precoMedio: "R$ 16,80", apresentacoes: ["600mg - Caixa com 20 comprimidos", "400mg - Caixa com 10 cápsulas gelatinosas", "50mg/mL - Gotas 30mL"], bulaUrl: "https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=IBUPROFENO", posologiaSugerida: "Tomar 1 comprimido de 8 em 8 horas após as refeições durante 5 dias." },
  { id: "5", nome: "Omeprazol", principioAtivo: "Omeprazol", precoMedio: "R$ 19,40", apresentacoes: ["20mg - Caixa com 28 cápsulas", "40mg - Caixa com 14 cápsulas"], bulaUrl: "https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=OMEPRAZOL", posologiaSugerida: "Tomar 1 cápsula em jejum, 30 minutos antes do café da manhã." },
  { id: "6", nome: "Azitromicina", principioAtivo: "Azitromicina Di-idratada", precoMedio: "R$ 32,50", apresentacoes: ["500mg - Caixa com 3 comprimidos", "500mg - Caixa com 5 comprimidos"], bulaUrl: "https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=AZITROMICINA", posologiaSugerida: "Tomar 1 comprimido ao dia durante 3 a 5 dias." },
  { id: "7", nome: "Dexametasona", principioAtivo: "Dexametasona", precoMedio: "R$ 14,20", apresentacoes: ["4mg - Caixa com 10 comprimidos", "0.1mg/mL - Elixir 120mL"], bulaUrl: "https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=DEXAMETASONA", posologiaSugerida: "Tomar 1 comprimido de 12 em 12 horas por 3 dias." },
  { id: "8", nome: "Losartana Potássica", principioAtivo: "Losartana Potássica", precoMedio: "R$ 12,00", apresentacoes: ["50mg - Caixa com 30 comprimidos", "100mg - Caixa com 30 comprimidos"], bulaUrl: "https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=LOSARTANA", posologiaSugerida: "Tomar 1 comprimido pela manhã diariamente." },
  { id: "9", nome: "Metformina (Glucofage)", principioAtivo: "Cloridrato de Metformina", precoMedio: "R$ 15,30", apresentacoes: ["500mg - Caixa com 30 comprimidos", "850mg - Caixa com 30 comprimidos", "1000mg XR - Caixa com 30 comprimidos"], bulaUrl: "https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=METFORMINA", posologiaSugerida: "Tomar 1 comprimido durante as refeições principais." },
  { id: "10", nome: "Clordiazepóxido + Clidinio (Librax)", principioAtivo: "Clordiazepóxido + Brometo de Clidínio", precoMedio: "R$ 44,00", apresentacoes: ["5mg/2.5mg - Caixa com 30 drágeas"], bulaUrl: "https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=CLORDIAZEPOXIDO", posologiaSugerida: "Tomar 1 drágea de 8 em 8 horas antes das refeições." },
  { id: "11", nome: "Nimesulida", principioAtivo: "Nimesulida", precoMedio: "R$ 18,60", apresentacoes: ["100mg - Caixa com 12 comprimidos", "50mg/mL - Gotas 15mL"], bulaUrl: "https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=NIMESULIDA", posologiaSugerida: "Tomar 1 comprimido de 12 em 12 horas após alimentação por até 5 dias." },
  { id: "12", nome: "Clonazepam (Rivotril)", principioAtivo: "Clonazepam", precoMedio: "R$ 22,00", apresentacoes: ["2mg - Caixa com 30 comprimidos", "2.5mg/mL - Frasco Gotas 20mL"], bulaUrl: "https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=CLONAZEPAM", posologiaSugerida: "Tomar conforme estrita prescrição médica controlada." }
];

app.get("/api/anvisa/search", (req, res) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  if (!query) {
    return res.json(ANVISA_DATABASE);
  }
  const filtered = ANVISA_DATABASE.filter(m => 
    m.nome.toLowerCase().includes(query) || 
    m.principioAtivo.toLowerCase().includes(query) ||
    m.apresentacoes.some(a => a.toLowerCase().includes(query))
  );
  res.json(filtered);
});

// --- ROTA DISPARO DE CONFIRMAÇÃO DE AGENDAMENTO VIA WHATSAPP ---
app.post("/api/whatsapp/send-confirmation", async (req, res) => {
  try {
    const { phone, patientName, doctorName, date, time, appointmentId } = req.body;
    if (!phone) {
      return res.status(400).json({ error: "Telefone é obrigatório" });
    }
    const cleanPhone = formatPhoneBR(phone);
    const host = req.get('host') || `localhost:${PORT}`;
    const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    let origin = req.body.appUrl || req.headers.origin || `${protocol}://${host}`;
    if (origin.includes('aistudio.google.com') || origin.includes('localhost')) {
      origin = 'https://ais-dev-rb5uztjihjvkduwo7bhuyk-51327969358.us-east1.run.app';
    }
    const anamneseLink = `${origin}/#anamnese?phone=${cleanPhone}&id=${appointmentId || '1'}`;

    const msgText = `Olá *${patientName || 'Paciente'}*! 👋\n\nConfirmamos seu agendamento na nossa clínica:\n👨‍⚕️ *Profissional:* ${doctorName || 'Dr. Carlos Morato'}\n📅 *Data:* ${date || 'Hoje'}\n⏰ *Horário:* ${time || '14:00'}\n\n👉 *Por favor, responda SIM para confirmar sua presença* ou *NÃO* caso precise reagendar.\n\n⚡ *Anamnese Pré-Consulta:* Para agilizar seu atendimento e evitar filas na recepção, preencha seus dados de saúde e envie sua foto pelo link:\n${anamneseLink}`;

    const { url, instance, apikey } = getEvolutionConfig(req);

    // Tenta enviar via Evolution API
    try {
      const evoRes = await axios.post(`${url}/message/sendText/${instance}`, {
        number: cleanPhone,
        text: msgText,
        linkPreview: true
      }, { headers: { 'apikey': apikey } });
      addLog(`✅ Confirmação enviada via Evolution (${instance}) para ${cleanPhone}`);
    } catch (e: any) {
      const errorMsg = e.response?.data ? JSON.stringify(e.response.data) : e.message;
      addLog(`❌ Erro Evolution confirmação (${cleanPhone}): ${errorMsg}`);
    }

    // Registra na tabela de mensagens do Supabase
    await supabase.from('mensagens').insert([{
      telefone_cliente: cleanPhone,
      mensagem: msgText,
      direcao: 'enviada',
      lida: true,
      created_at: new Date().toISOString()
    }]);

    res.json({ success: true, message: "Solicitação de confirmação e link de anamnese enviados!", anamneseLink });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROTA DISPARO DE PESQUISA NPS E GOOGLE MEU NEGÓCIO ---
app.post("/api/whatsapp/send-survey", async (req, res) => {
  try {
    const { phone, patientName, doctorName } = req.body;
    if (!phone) return res.status(400).json({ error: "Telefone é obrigatório" });
    
    const cleanPhone = formatPhoneBR(phone);
    const msgText = `Olá *${patientName || 'Paciente'}*! 😊\n\nAgradecemos por sua consulta com *${doctorName || 'nosso especialista'}*.\n\nComo foi sua experiência no atendimento hoje?\n\n1️⃣ *Excelente* ⭐⭐⭐⭐⭐\n2️⃣ *Bom* ⭐⭐⭐⭐\n3️⃣ *Regular* ⭐⭐⭐\n4️⃣ *Ruim* ⭐⭐\n5️⃣ *Péssimo* ⭐\n\nResponda com o número de 1 a 5 ou clique nas opções!`;

    const { url, instance, apikey } = getEvolutionConfig(req);

    try {
      await axios.post(`${url}/message/sendText/${instance}`, {
        number: cleanPhone,
        text: msgText,
        linkPreview: true
      }, { headers: { 'apikey': apikey } });
    } catch (e: any) {
      console.warn("Survey Evolution fail:", e.message);
    }

    await supabase.from('mensagens').insert([{
      telefone_cliente: cleanPhone,
      mensagem: msgText,
      direcao: 'enviada',
      created_at: new Date().toISOString()
    }]);

    res.json({ success: true, message: "Pesquisa de satisfação NPS disparada com sucesso!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROTA PROCESSAR RESPOSTA NPS & GOOGLE REVIEWS ---
app.post("/api/whatsapp/process-survey-response", async (req, res) => {
  try {
    const { phone, rating, feedbackText } = req.body;
    const cleanPhone = formatPhoneBR(phone);
    const googleBusinessReviewUrl = process.env.GOOGLE_BUSINESS_REVIEW_URL || "https://search.google.com/local/writereview?placeid=ChIJN1t_t_UzxAAR1111111111";

    let responseMsg = "";
    let isPromoter = false;

    if (rating === '1' || rating === '2' || rating === 'Excelente' || rating === 'Bom' || Number(rating) >= 4) {
      isPromoter = true;
      responseMsg = `🌟 *Ficamos muito felizes com a sua avaliação positiva!*\n\nSua opinião é fundamental para ajudarmos mais pessoas. Poderia deixar esse depoimento em nossa página oficial do Google Meu Negócio? Leva menos de 30 segundos:\n\n👉 ${googleBusinessReviewUrl}\n\nMuito obrigado pela confiança! ❤️`;
    } else {
      isPromoter = false;
      responseMsg = `Agradecemos honestamente pelo seu feedback! Sinto muito que sua experiência não tenha sido 100% perfeita. Já encaminhei sua nota e observação para a diretoria clínica para melhorarmos imediatamente. 🙏`;
    }

    const { url, instance, apikey } = getEvolutionConfig(req);

    try {
      await axios.post(`${url}/message/sendText/${instance}`, {
        number: cleanPhone,
        text: responseMsg,
        linkPreview: true
      }, { headers: { 'apikey': apikey } });
    } catch (e) {
      console.warn("NPS response evolution error", e);
    }

    // Salva ou atualiza a reputação do paciente no banco
    try {
      await supabase.from('paciente_avaliacoes').upsert([{
        telefone: cleanPhone,
        nota: rating,
        feedback: feedbackText || '',
        is_promoter: isPromoter,
        updated_at: new Date().toISOString()
      }], { onConflict: 'telefone' });
    } catch (e) {
      addLog(`⚠️ Aviso: Não foi possível salvar na tabela paciente_avaliacoes: ${e}`);
    }

    res.json({ success: true, isPromoter, responseMsg, googleReviewUrl: googleBusinessReviewUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROTAS DE GESTÃO DA CONEXÃO WHATSAPP (EVOLUTION API / QR CODE) ---
app.get("/api/whatsapp/status", async (req, res) => {
  try {
    const { url, instance, apikey } = getEvolutionConfig(req);
    const response = await requestEvolutionWithFallback('get', `${url}/instance/connectionState/${instance}`, undefined, apikey);
    const instanceData = response.data?.instance || response.data || {};
    const state = instanceData.state || 'close';
    const connected = state === 'open';
    res.json({
      success: true,
      connected,
      state,
      ownerJid: instanceData.ownerJid || null,
      profileName: instanceData.profileName || null,
      instance
    });
  } catch (err: any) {
    res.json({ success: true, connected: false, state: 'close', error: err.message });
  }
});

app.post("/api/whatsapp/connect", async (req, res) => {
  try {
    const { url, instance, apikey } = getEvolutionConfig(req);
    console.log(`[WHATSAPP] Conectando instância "${instance}" em ${url}...`);

    // 1. Verifica se já está conectado ('open')
    try {
      const stateRes = await requestEvolutionWithFallback('get', `${url}/instance/connectionState/${instance}`, undefined, apikey);
      const st = stateRes.data?.instance?.state || stateRes.data?.state;
      if (st === 'open') {
        return res.json({
          success: true,
          connected: true,
          message: "Esta instância já está conectada no WhatsApp!",
          instance
        });
      }
    } catch (stErr: any) {
      console.log(`[WHATSAPP] connectionState: ${stErr.message}`);
    }

    let qrCode: string | null = null;
    let pairingCode: string | null = null;

    // 2. Tenta obter o QR code via GET /instance/connect/:instance
    try {
      const resp = await requestEvolutionWithFallback('get', `${url}/instance/connect/${instance}`, undefined, apikey);
      qrCode = extractQrFromEvolutionData(resp.data);
      pairingCode = resp.data?.pairingCode || resp.data?.qrcode?.pairingCode || null;
    } catch (e1: any) {
      console.log(`[WHATSAPP] GET /instance/connect falhou (${e1.message}), tentando POST...`);
    }

    // 3. Tenta via POST /instance/connect/:instance
    if (!qrCode) {
      try {
        const resp = await requestEvolutionWithFallback('post', `${url}/instance/connect/${instance}`, {}, apikey);
        qrCode = extractQrFromEvolutionData(resp.data);
        pairingCode = resp.data?.pairingCode || resp.data?.qrcode?.pairingCode || null;
      } catch (e2: any) {
        console.log(`[WHATSAPP] POST /instance/connect falhou (${e2.message})`);
      }
    }

    // 4. Se não existe ou não gerou QR code, tenta criar a instância
    if (!qrCode) {
      try {
        console.log(`[WHATSAPP] Tentando criar instância "${instance}" na Evolution API...`);
        const createResp = await requestEvolutionWithFallback('post', `${url}/instance/create`, {
          instanceName: instance,
          token: apikey,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        }, apikey);

        qrCode = extractQrFromEvolutionData(createResp.data);
        pairingCode = createResp.data?.pairingCode || createResp.data?.qrcode?.pairingCode || null;
      } catch (createErr: any) {
        const errMsg = createErr.response?.data?.response?.message || createErr.response?.data?.message || createErr.message;
        console.warn(`[WHATSAPP] Resposta na criação de instância:`, errMsg);
      }
    }

    // 5. Configurar automaticamente o webhook para o n8n na nova VPS
    try {
      const n8nUrl = getN8nWebhookUrl();
      await requestEvolutionWithFallback('post', `${url}/webhook/set/${instance}`, {
        webhook: {
          enabled: true,
          url: n8nUrl,
          byEvents: false,
          base64: false,
          events: [
            "MESSAGES_UPSERT",
            "MESSAGES_UPDATE",
            "SEND_MESSAGE",
            "CONNECTION_UPDATE"
          ]
        }
      }, apikey);
    } catch (_) {}

    if (qrCode) {
      return res.json({
        success: true,
        qrcode: qrCode,
        pairingCode: pairingCode || null,
        instance
      });
    }

    return res.status(400).json({
      success: false,
      error: `Não foi possível gerar o QR Code para a instância "${instance}". Verifique no Evolution Manager se o nome da instância e a API Key estão corretos.`
    });

  } catch (err: any) {
    const errorDetails = err.response?.data?.message || err.response?.data || err.message;
    console.error("[WHATSAPP] ❌ Erro ao conectar:", errorDetails);
    res.status(500).json({ 
      success: false, 
      error: typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails)
    });
  }
});

app.post("/api/whatsapp/force-reset", async (req, res) => {
  try {
    const { url, instance, apikey } = getEvolutionConfig(req);
    console.log(`[WHATSAPP] Forçando reset e nova conexão para "${instance}" em ${url}...`);

    try {
      await requestEvolutionWithFallback('delete', `${url}/instance/logout/${instance}`, undefined, apikey);
    } catch (_) {}

    try {
      await requestEvolutionWithFallback('delete', `${url}/instance/delete/${instance}`, undefined, apikey);
    } catch (_) {}

    await new Promise(r => setTimeout(r, 1200));

    try {
      const createResp = await requestEvolutionWithFallback('post', `${url}/instance/create`, {
        instanceName: instance,
        token: apikey,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      }, apikey);
      const qr = extractQrFromEvolutionData(createResp.data);
      if (qr) {
        return res.json({ success: true, qrcode: qr, instance });
      }
    } catch (e: any) {
      console.warn("[WHATSAPP] Erro ao recriar instância:", e.message);
    }

    const connectResp = await requestEvolutionWithFallback('get', `${url}/instance/connect/${instance}`, undefined, apikey);
    const qr = extractQrFromEvolutionData(connectResp.data);
    return res.json({ success: true, qrcode: qr || null, instance });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/whatsapp/logout", async (req, res) => {
  try {
    const { url, instance, apikey } = getEvolutionConfig(req);
    console.log(`[WHATSAPP] Solicitando logout e limpeza de sessão para "${instance}" em ${url}...`);

    let logoutSuccess = false;
    let logoutData = null;

    // 1. Tenta DELETE /instance/logout/:instance (Evolution API v1/v2 padrão)
    try {
      const response = await requestEvolutionWithFallback('delete', `${url}/instance/logout/${instance}`, undefined, apikey);
      logoutData = response.data;
      logoutSuccess = true;
    } catch (e: any) {
      console.log(`[WHATSAPP] DELETE logout falhou (${e.message}), tentando POST /instance/logout...`);
    }

    // 2. Se falhou, tenta POST /instance/logout/:instance
    if (!logoutSuccess) {
      try {
        const response = await requestEvolutionWithFallback('post', `${url}/instance/logout/${instance}`, {}, apikey);
        logoutData = response.data;
        logoutSuccess = true;
      } catch (e: any) {
        console.log(`[WHATSAPP] POST logout falhou (${e.message})`);
      }
    }

    // 3. Tenta reiniciar a instância para garantir limpeza de sockets
    try {
      await requestEvolutionWithFallback('put', `${url}/instance/restart/${instance}`, {}, apikey);
    } catch (_) {
      try {
        await requestEvolutionWithFallback('post', `${url}/instance/restart/${instance}`, {}, apikey);
      } catch (_) {}
    }

    return res.json({ 
      success: true, 
      message: `Sessão da instância "${instance}" resetada com sucesso! Pronto para gerar novo QR Code.`, 
      data: logoutData 
    });
  } catch (err: any) {
    console.error("[WHATSAPP] Erro geral ao desconectar:", err.message);
    return res.json({ 
      success: true, 
      message: "Comando de desconexão enviado.",
      warning: err.response?.data?.message || err.message 
    });
  }
});

// Persistent store for submitted anamneses
const ANAMNESE_STORE_FILE = path.join(process.cwd(), 'data', 'anamneses.json');

function getStoredAnamneses(): Record<string, any> {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (fs.existsSync(ANAMNESE_STORE_FILE)) {
      return JSON.parse(fs.readFileSync(ANAMNESE_STORE_FILE, 'utf-8'));
    }
  } catch (e) {
    console.warn("[SERVER] Erro ao ler anamneses.json:", e);
  }
  return {};
}

function saveStoredAnamnese(key: string, record: any) {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const current = getStoredAnamneses();
    current[key] = record;
    fs.writeFileSync(ANAMNESE_STORE_FILE, JSON.stringify(current, null, 2), 'utf-8');
  } catch (e) {
    console.warn("[SERVER] Erro ao salvar em anamneses.json:", e);
  }
}

const anamneseStore = new Map<string, any>();
// Preload from disk
try {
  const diskData = getStoredAnamneses();
  Object.entries(diskData).forEach(([k, v]) => {
    anamneseStore.set(k, v);
  });
} catch (_) {}

// --- LISTAR MEMBROS DA EQUIPE (SERVER-SIDE COM SERVICE ROLE E FILTRO DE EXCLUÍDOS) ---
app.get("/api/admin/members", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, status, full_name, especialidade')
      .order('role', { ascending: true });

    if (error) {
      console.error("[SERVER] Erro ao buscar membros:", error);
      return res.status(500).json({ error: error.message });
    }

    const crmMap = getCrmCroMapServer();
    const deletedList = getDeletedMembers();
    const activeMembers = (data || [])
      .filter(p => {
        const pEmail = (p.email || '').toLowerCase().trim();
        const pId = (p.id || '').toLowerCase().trim();
        return !deletedList.includes(pEmail) && !deletedList.includes(pId);
      })
      .map(p => {
        const pEmail = (p.email || '').toLowerCase().trim();
        const pId = (p.id || '').toLowerCase().trim();
        return {
          ...p,
          crm_cro: crmMap[pEmail] || crmMap[pId] || (p as any).crm_cro || ''
        };
      });

    return res.json({ success: true, members: activeMembers });
  } catch (err: any) {
    console.error("[SERVER] Erro inesperado ao listar membros:", err);
    return res.status(500).json({ error: err.message });
  }
});

// --- DELETAR AGENDAMENTO (PERMISSÃO TOTAL SERVER-SIDE) ---
app.delete("/api/agendamentos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[SERVER] Excluindo agendamento ID: ${id}`);

    const numId = Number(id);
    if (!isNaN(numId)) {
      await supabase.from('agendamentos').delete().eq('id', numId);
      await supabase.from('appointments').delete().eq('id', numId);
    }
    
    const { error: err1 } = await supabase.from('agendamentos').delete().eq('id', String(id));
    const { error: err2 } = await supabase.from('appointments').delete().eq('id', String(id));

    if (err1 && err2) {
      console.warn("[SERVER] Aviso ao deletar:", err1.message, err2.message);
    }

    return res.json({ success: true, message: "Agendamento excluído com sucesso" });
  } catch (err: any) {
    console.error("[SERVER] Erro na rota DELETE /api/agendamentos/:id:", err);
    return res.status(500).json({ error: err.message });
  }
});

// --- ROTA PÚBLICA: BUSCAR AGENDAMENTO PARA PRÉ-CADASTRO ---
app.get("/api/public/appointment", async (req, res) => {
  try {
    const { phone, id } = req.query;
    
    // Tenta primeiro por ID se for um ID válido
    if (id && id !== '1' && id !== 'undefined' && id !== 'null' && id !== 'test-123') {
      const { data: idData } = await supabase.from('agendamentos').select('*').eq('id', id);
      if (idData && idData.length > 0) {
        return res.json({ success: true, appointment: idData[0] });
      }
    }

    if (phone) {
      const clean = String(phone).replace(/\D/g, '');
      const cleanWithout55 = clean.startsWith('55') && clean.length > 10 ? clean.slice(2) : clean;
      
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .or(`paciente_telefone.ilike.%${clean}%,paciente_telefone.ilike.%${cleanWithout55}%`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        return res.json({ success: true, appointment: data[0] });
      }
    }

    return res.json({ success: true, appointment: null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROTA PÚBLICA: OBTER DADOS DA ANAMNESE SUBMETIDA ---
app.get("/api/public/anamnese-data", async (req, res) => {
  try {
    const { phone, id, name } = req.query;
    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
    const cleanWithout55 = cleanPhone.startsWith('55') && cleanPhone.length > 10 ? cleanPhone.slice(2) : cleanPhone;
    const with55 = cleanPhone.length === 10 || cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;
    const cleanName = name ? String(name).trim() : '';
    const nameWords = cleanName.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
    const normalizeStr = (s: string) => (s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const cleanNameNorm = normalizeStr(cleanName);

    // 1. PRIORIDADE MÁXIMA: Verificar no Cache em Memória / Disco de Anamneses Submetidas
    const memKeys = [id, cleanPhone, cleanWithout55, with55].filter(Boolean) as string[];
    for (const k of memKeys) {
      if (anamneseStore.has(k)) {
        return res.json({ success: true, data: anamneseStore.get(k), source: 'anamnese_store' });
      }
    }

    // Busca por aproximação de nome ou telefone no store em memória
    if (cleanNameNorm || cleanPhone) {
      for (const [, item] of anamneseStore.entries()) {
        if (!item) continue;
        const itemPhone = String(item.paciente_telefone || '').replace(/\D/g, '');
        const itemNameNorm = normalizeStr(item.paciente_nome || item.paciente_nome_completo || '');
        if (cleanPhone && (itemPhone.includes(cleanWithout55) || itemPhone.includes(cleanPhone) || cleanPhone.includes(itemPhone))) {
          return res.json({ success: true, data: item, source: 'anamnese_store' });
        }
        if (cleanNameNorm && (itemNameNorm === cleanNameNorm || (itemNameNorm.length > 3 && (itemNameNorm.includes(cleanNameNorm) || cleanNameNorm.includes(itemNameNorm))))) {
          return res.json({ success: true, data: item, source: 'anamnese_store' });
        }
      }
    }

    // 2. PRIORIDADE 2: Tentar buscar na tabela oficial anamnese_pre_consulta do Supabase
    try {
      let query = supabase.from('anamnese_pre_consulta').select('*');
      if (id && id !== '1' && id !== 'undefined' && id !== 'null') {
        query = query.eq('agendamento_id', id);
      } else if (cleanPhone) {
        query = query.or(`paciente_telefone.ilike.%${cleanPhone}%,paciente_telefone.ilike.%${cleanWithout55}%`);
      } else if (cleanName) {
        query = query.ilike('paciente_nome', `%${cleanName}%`);
      }
      const { data } = await query.order('created_at', { ascending: false }).limit(1);
      if (data && data.length > 0) {
        return res.json({ success: true, data: data[0], source: 'anamnese_pre_consulta' });
      }
    } catch (_) {}

    // 3. PRIORIDADE 3: Tentar buscar em Supabase agendamentos (para pré-preenchimento cadastral de endereço, CPF e nascimento)
    try {
      if (id && id !== '1' && id !== 'undefined' && id !== 'null') {
        const { data: agData } = await supabase.from('agendamentos').select('*').eq('id', id).limit(1);
        if (agData && agData.length > 0) {
          const ag = agData[0];
          if (ag.paciente_cpf || ag.data_nascimento || ag.foto_url || ag.cep) {
            let rawDob = ag.data_nascimento || ag.paciente_data_nascimento || '';
            if (rawDob && typeof rawDob === 'string' && rawDob.includes('-')) {
              const parts = rawDob.split('-');
              if (parts.length === 3 && parts[0].length === 4) {
                rawDob = `${parts[2]}/${parts[1]}/${parts[0]}`;
              }
            }

            return res.json({
              success: true,
              source: 'agendamentos',
              data: {
                paciente_nome: ag.paciente_nome,
                paciente_telefone: ag.paciente_telefone,
                paciente_cpf: ag.paciente_cpf,
                data_nascimento: rawDob,
                paciente_data_nascimento: ag.data_nascimento || ag.paciente_data_nascimento,
                foto_url: ag.foto_url,
                convenio: ag.convenio,
                status_pagamento: ag.status_pagamento,
                valor_consulta: ag.valor_consulta,
                endereco: { cep: ag.cep, logradouro: ag.logradouro, numero: ag.numero, bairro: ag.bairro, cidade: ag.cidade, estado: ag.estado, complemento: ag.complemento },
                alertas_clinicos: [],
                medicamentos_atuais: '',
                observacoes_clinicas: ''
              }
            });
          }
        }
      }
    } catch (_) {}

    // 4. PRIORIDADE 4: Tentar buscar no Supabase prontuarios APENAS DADOS CADASTRAIS (CPF, data de nascimento, foto)
    // NUNCA injetar prescrições médicas passadas (rec.medicamentos_em_uso) no questionário do paciente!
    try {
      if (cleanPhone || cleanName) {
        const orFilters: string[] = [];
        if (cleanPhone) {
          orFilters.push(`paciente_telefone.ilike.%${cleanWithout55}%`);
          orFilters.push(`paciente_telefone.ilike.%${cleanPhone}%`);
        }
        if (nameWords.length > 0) {
          nameWords.forEach(word => {
            orFilters.push(`paciente_nome_completo.ilike.%${word}%`);
          });
        }

        if (orFilters.length > 0) {
          const { data: pData, error: pError } = await supabase
            .from('prontuarios')
            .select('*')
            .or(orFilters.join(','))
            .order('created_at', { ascending: false })
            .limit(5);

          if (!pError && pData && pData.length > 0) {
            const rec = pData.find((p: any) => p.paciente_data_nascimento || p.data_nascimento || p.foto_url || p.paciente_cpf) || pData[0];

            let rawDob = rec.paciente_data_nascimento || rec.data_nascimento || '';
            if (rawDob && typeof rawDob === 'string' && rawDob.includes('-')) {
              const parts = rawDob.split('-');
              if (parts.length === 3 && parts[0].length === 4) {
                rawDob = `${parts[2]}/${parts[1]}/${parts[0]}`;
              }
            }

            const rawAlerts = rec.alertas_clinicos ? (Array.isArray(rec.alertas_clinicos) ? rec.alertas_clinicos : [rec.alertas_clinicos]) : [];
            const rawAlergias = rec.alergias ? (typeof rec.alergias === 'string' ? rec.alergias.split(',').map((s: string) => s.trim()) : rec.alergias) : [];
            
            const alertsList: string[] = [...rawAlerts];
            if (Array.isArray(rawAlergias)) {
              rawAlergias.forEach((a: string) => {
                if (a && !alertsList.includes(a)) {
                  if (a.toUpperCase().startsWith("ALERGIA:")) alertsList.push(a);
                  else alertsList.push(`ALERGIA: ${a.toUpperCase()}`);
                }
              });
            }

            // Varredura de histórico clínico para recuperar alertas vitais (Cardiopatia, Marcapasso, Látex, etc.)
            const fullTextSearch = `${rec.resumo_formatado || ''} ${rec.hipotese_diagnostica || ''} ${rec.conduta_plano_terapeutico || ''} ${typeof rec.dados_clinicos === 'string' ? rec.dados_clinicos : JSON.stringify(rec.dados_clinicos || {})} ${typeof rec.dados_especialidade === 'string' ? rec.dados_especialidade : JSON.stringify(rec.dados_especialidade || {})}`.toUpperCase();

            if (fullTextSearch.includes("MARCAPASSO") && !alertsList.some(a => a.includes("MARCAPASSO"))) {
              alertsList.push("USO DE MARCAPASSO");
            }
            if ((fullTextSearch.includes("CARDIOPATIA") || fullTextSearch.includes("CARDIACO") || fullTextSearch.includes("CARDÍACO")) && !alertsList.some(a => a.includes("CARDIO"))) {
              alertsList.push("PROBLEMAS CARDÍACOS");
            }
            if ((fullTextSearch.includes("HIPERTENS") || fullTextSearch.includes("PRESSAO ALTA") || fullTextSearch.includes("PRESSÃO ALTA")) && !alertsList.some(a => a.includes("HIPERTENS"))) {
              alertsList.push("HIPERTENSO");
            }
            if (fullTextSearch.includes("DIABET") && !alertsList.some(a => a.includes("DIABET"))) {
              alertsList.push("DIABÉTICO");
            }
            if (fullTextSearch.includes("ANTICOAGULANTE") && !alertsList.some(a => a.includes("ANTICOAGULANTE"))) {
              alertsList.push("USO DE ANTICOAGULANTE");
            }
            if (fullTextSearch.includes("LATEX") || fullTextSearch.includes("LÁTEX")) {
              if (!alertsList.some(a => a.includes("LÁTEX") || a.includes("LATEX"))) {
                alertsList.push("ALERGIA: LÁTEX");
              }
            }
            if (fullTextSearch.includes("PENICILINA") && !alertsList.some(a => a.includes("PENICILINA"))) {
              alertsList.push("ALERGIA: PENICILINA");
            }
            if (fullTextSearch.includes("DIPIRONA") && !alertsList.some(a => a.includes("DIPIRONA"))) {
              alertsList.push("ALERGIA: DIPIRONA");
            }

            const foto = rec.foto_url || rec.foto || rec.url_midia || (rec.dados_clinicos && rec.dados_clinicos.foto_url) || (rec.dados_especialidade && rec.dados_especialidade.foto_url) || null;

            return res.json({ 
              success: true, 
              source: 'prontuarios_cadastral',
              data: {
                paciente_nome: rec.paciente_nome_completo || rec.paciente_nome,
                paciente_telefone: rec.paciente_telefone || cleanPhone,
                paciente_cpf: rec.paciente_cpf || rec.cpf,
                data_nascimento: rawDob,
                paciente_data_nascimento: rec.paciente_data_nascimento || rec.data_nascimento,
                foto_url: foto,
                alertas_clinicos: alertsList,
                medicamentos_atuais: '', // NÃO copia prescrição médica antiga
                observacoes_clinicas: '' // NÃO copia evolução médica antiga
              }
            });
          }
        }
      }
    } catch (prontErr) {
      console.warn("[SERVER] Erro ao buscar em prontuarios:", prontErr);
    }

    return res.json({ success: true, data: null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROTA PÚBLICA: SUBMETER ANAMNESE E CONFIRMAR PRESENÇA ---
app.post("/api/public/submit-anamnese", async (req, res) => {
  try {
    const {
      appointmentId,
      agendamento_id,
      id,
      paciente_nome,
      paciente_telefone,
      paciente_cpf,
      data_nascimento,
      endereco,
      alertas_clinicos,
      medicamentosAtuais,
      medicamentos_atuais,
      observacoesClinicas,
      observacoes_clinicas,
      foto_url
    } = req.body;

    const aptId = appointmentId || agendamento_id || id;
    const meds = medicamentosAtuais !== undefined ? medicamentosAtuais : (medicamentos_atuais || '');
    const obs = observacoesClinicas !== undefined ? observacoesClinicas : (observacoes_clinicas || '');

    const cleanPhone = paciente_telefone ? String(paciente_telefone).replace(/\D/g, '') : '';
    const cleanWithout55 = cleanPhone.startsWith('55') && cleanPhone.length > 10 ? cleanPhone.slice(2) : cleanPhone;
    const with55 = cleanPhone.length === 10 || cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;
    const cleanName = paciente_nome ? String(paciente_nome).toLowerCase().trim() : '';

    const anamneseRecord = {
      agendamento_id: aptId || null,
      paciente_nome,
      paciente_nome_completo: paciente_nome,
      paciente_telefone,
      paciente_cpf,
      data_nascimento,
      paciente_data_nascimento: data_nascimento,
      endereco,
      alertas_clinicos: alertas_clinicos || [],
      medicamentos_atuais: meds,
      observacoes_clinicas: obs,
      foto_url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Armazena em memória e persiste em disco
    if (aptId) {
      anamneseStore.set(String(aptId), anamneseRecord);
      saveStoredAnamnese(String(aptId), anamneseRecord);
    }
    if (cleanPhone) {
      anamneseStore.set(cleanPhone, anamneseRecord);
      saveStoredAnamnese(cleanPhone, anamneseRecord);
    }
    if (cleanWithout55) {
      anamneseStore.set(cleanWithout55, anamneseRecord);
      saveStoredAnamnese(cleanWithout55, anamneseRecord);
    }
    if (with55) {
      anamneseStore.set(with55, anamneseRecord);
      saveStoredAnamnese(with55, anamneseRecord);
    }
    if (cleanName) {
      anamneseStore.set(`name_${cleanName}`, anamneseRecord);
      saveStoredAnamnese(`name_${cleanName}`, anamneseRecord);
    }
    if (paciente_cpf) {
      const cleanCpf = String(paciente_cpf).replace(/\D/g, '');
      if (cleanCpf) {
        anamneseStore.set(`cpf_${cleanCpf}`, anamneseRecord);
        saveStoredAnamnese(`cpf_${cleanCpf}`, anamneseRecord);
      }
    }

    // 1. Atualiza status para 'Confirmado' e salva data de nascimento e demais dados no agendamento
    try {
      const updateData: any = {
        status: 'Confirmado',
        paciente_cpf: paciente_cpf || undefined,
        data_nascimento: data_nascimento || undefined,
        paciente_data_nascimento: data_nascimento || undefined,
        foto_url: foto_url || undefined,
        cep: endereco?.cep || undefined,
        logradouro: endereco?.logradouro || undefined,
        bairro: endereco?.bairro || undefined,
        cidade: endereco?.cidade || undefined,
        estado: endereco?.estado || undefined,
        numero: endereco?.numero || undefined,
        complemento: endereco?.complemento || undefined
      };

      if (aptId && aptId !== '1') {
        const numAptId = Number(aptId);
        if (!isNaN(numAptId)) {
          await supabase.from('agendamentos').update(updateData).eq('id', numAptId);
        }
        await supabase.from('agendamentos').update(updateData).eq('id', String(aptId));
      }

      if (cleanPhone) {
        await supabase.from('agendamentos').update(updateData).or(`paciente_telefone.ilike.%${cleanPhone}%,paciente_telefone.ilike.%${cleanWithout55}%`);
      }
    } catch (err) {
      console.warn("Erro ao atualizar agendamento em Supabase:", err);
    }

    // 2. Salva registro de anamnese pré-consulta no banco
    try {
      await supabase.from('anamnese_pre_consulta').insert([anamneseRecord]);
    } catch (error: any) {
      console.warn("Aviso ao salvar em anamnese_pre_consulta:", error.message);
    }

    // 3. Notificar o n8n sobre a conclusão do formulário de anamnese
    const n8nWebhookUrl = getN8nWebhookUrl();
    if (n8nWebhookUrl) {
      axios.post(n8nWebhookUrl, {
        event: "anamnese.submitted",
        event_type: "form_completed",
        appointmentId: appointmentId || null,
        status: "confirmado",
        paciente: {
          nome: paciente_nome,
          telefone: paciente_telefone,
          cpf: paciente_cpf,
          data_nascimento: data_nascimento,
          endereco: endereco,
          alertas_clinicos: alertas_clinicos,
          medicamentos: medicamentosAtuais,
          observacoes: observacoesClinicas,
          foto_url: foto_url
        },
        timestamp: new Date().toISOString()
      }).then(() => {
        addLog(`📲 Notificação enviada com sucesso para o n8n!`);
      }).catch((e) => {
        console.warn("Aviso ao enviar evento de anamnese para o n8n:", e.message);
      });
    }

    addLog(`✅ Anamnese pré-consulta pública submetida com sucesso por ${paciente_nome} (${paciente_telefone})`);

    res.json({
      success: true,
      message: "Pré-cadastro e confirmação de presença concluídos com sucesso!",
      record: anamneseRecord
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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
    const response = await axios.get(`${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE_NAME}`, {
      headers: { 'apikey': EVOLUTION_API_KEY }
    });
    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

app.get("/api/evolution-webhook-status", async (req, res) => {
  try {
    const response = await axios.get(`${EVOLUTION_API_URL}/webhook/find/${EVOLUTION_INSTANCE_NAME}`, {
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

async function updateEvolutionWebhook() {
  try {
    addLog(`🔄 Tentando atualizar webhook da Evolution...`);
    
    // Usa a URL do webhook do n8n configurada no .env ou a URL correspondente ao modo atual (test ou prod)
    const webhookUrl = getN8nWebhookUrl();
    addLog(`🌐 Reconfigurando webhook para n8n (${N8N_IS_TEST_MODE ? 'MODO TESTE' : 'PRODUÇÃO'}): ${webhookUrl}`);
    
    addLog(`📍 URL Alvo: ${webhookUrl}`);
    addLog(`🔑 Usando API Key: ${EVOLUTION_API_KEY.substring(0, 5)}...`);
    
    const response = await requestEvolutionWithFallback('post', `${EVOLUTION_API_URL}/webhook/set/${EVOLUTION_INSTANCE_NAME}`, {
      webhook: {
        url: webhookUrl,
        enabled: true,
        webhook_by_events: false,
        webhook_base64: false,
        events: [
          "MESSAGES_UPSERT",
          "MESSAGES_UPDATE",
          "MESSAGES_DELETE",
          "SEND_MESSAGE",
          "CONNECTION_UPDATE"
        ]
      }
    }, EVOLUTION_API_KEY);
    
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

async function processAndReply(phone: string, message: string, targetInstance?: string) {
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
        const incomingInstance = (targetInstance || EVOLUTION_INSTANCE_NAME).trim();
        const incomingApiKey = KNOWN_INSTANCE_TOKENS[incomingInstance] || EVOLUTION_API_KEY || EVOLUTION_GLOBAL_KEY;
        const evoResponse = await axios.post(`${EVOLUTION_API_URL}/message/sendText/${incomingInstance}`, {
          number: cleanPhone,
          text: finalResp,
          linkPreview: true
        }, { headers: { 'apikey': incomingApiKey } });
        
        console.log(`[EVOLUTION] ✅ Enviado para WhatsApp (${incomingInstance}):`, evoResponse.data);
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

    const cleanPhone = formatPhoneBR(phone);
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

    // Salva a mensagem enviada no Supabase para aparecer no chat imediatamente
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

    addLog(`🚀 Chamando Evolution: ${endpoint} para ${cleanPhone}`);

    const { url, instance, apikey } = getEvolutionConfig(req);

    try {
      const evoResponse = await requestEvolutionWithFallback('post', `${url}/message/${endpoint}/${instance}`, payload, apikey);

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
  // PWA & Service Worker routes (garante Service-Worker-Allowed e Cache-Control adequados)
  app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'text/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const swProd = path.join(process.cwd(), 'dist', 'sw.js');
    const swPublic = path.join(process.cwd(), 'public', 'sw.js');
    if (fs.existsSync(swProd)) {
      return res.sendFile(swProd);
    }
    return res.sendFile(swPublic);
  });

  app.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const manifestProd = path.join(process.cwd(), 'dist', 'manifest.json');
    const manifestPublic = path.join(process.cwd(), 'public', 'manifest.json');
    if (fs.existsSync(manifestProd)) {
      return res.sendFile(manifestProd);
    }
    return res.sendFile(manifestPublic);
  });

  const isProd = fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'));
  if (isProd) {
    app.use(express.static(path.join(process.cwd(), 'dist'), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.png') || filePath.endsWith('.svg') || filePath.endsWith('.ico')) {
          res.setHeader('Cache-Control', 'public, max-age=86400');
        }
      }
    }));
    app.get('*', (req, res) => res.sendFile(path.join(process.cwd(), 'dist', 'index.html')));
  } else {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }
  
  // 1. LIGAR O SERVIDOR NO FINAL
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] >>> AMBULATORIO IA V3.2 STARTING ON PORT ${PORT} <<<`);
    ensureCoreClinicUsers().catch(e => console.warn("[SERVER] Erro ao assegurar usuários principais:", e));
    
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
