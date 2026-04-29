import { createClient } from '@supabase/supabase-js';

const OLD_URL = "https://supabase.makprojetosmake.com.br";
const OLD_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.MkkmMW-v8x41OGDFjXuJnJf0BxR_hWyHH8d2ESgtyrg";

const NEW_URL = "https://qmnbbpoubacuctlokmgq.supabase.co";
const NEW_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbmJicG91YmFjdWN0bG9rbWdxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA4ODI5NCwiZXhwIjoyMDkwNjY0Mjk0fQ.8qyH3jhL31LwFQsygLjx1iN6Q-dqaE2OtuCyOx6K1zY";

const oldClient = createClient(OLD_URL, OLD_KEY);
const newClient = createClient(NEW_URL, NEW_KEY);

const tables = [
  'specialties',
  'profiles',
  'prontuarios',
  'mensagens',
  'chat_sessions',
  'agendamentos'
];

async function migrate() {
  console.log("🚀 Iniciando migração de dados...");

  for (const table of tables) {
    console.log(`\n--- Migrando tabela: ${table} ---`);
    
    // Buscar dados do banco antigo
    const { data: oldData, error: fetchError } = await oldClient.from(table).select('*');
    
    if (fetchError) {
      console.error(`❌ Erro ao buscar dados de ${table}:`, fetchError.message);
      continue;
    }

    if (!oldData || oldData.length === 0) {
      console.log(`ℹ️ Tabela ${table} está vazia no banco antigo.`);
      continue;
    }

    console.log(`📦 Encontrados ${oldData.length} registros em ${table}.`);
    console.log(`🔍 Colunas detectadas: ${Object.keys(oldData[0]).join(', ')}`);

    // Inserir no banco novo
    const { error: insertError } = await newClient.from(table).upsert(oldData);

    if (insertError) {
      console.error(`❌ Erro ao inserir dados em ${table}:`, insertError.message);
    } else {
      console.log(`✅ Sucesso! ${oldData.length} registros migrados para ${table}.`);
    }
  }

  console.log("\n✨ Migração concluída!");
}

migrate().catch(err => {
  console.error("💥 Erro fatal na migração:", err);
});
