import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://qmnbbpoubacuctlokmgq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbmJicG91YmFjdWN0bG9rbWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwODgyOTQsImV4cCI6MjA5MDY2NDI5NH0.a0c7wB3KLQKHkGZccxNihpoKcgG9hpd-Ct9fluiKIJI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.from('prontuarios').select('*').limit(1);
  if (error) {
    console.error("Error:", error.message);
  } else if (data && data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
  } else {
    console.log("No data found to check columns.");
  }
}

checkSchema();
