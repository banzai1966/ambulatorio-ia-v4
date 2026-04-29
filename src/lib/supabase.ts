import { createClient } from '@supabase/supabase-js';

// Usamos a URL direta do Supabase para evitar problemas de roteamento em ambientes estáticos como o Netlify
const supabaseUrl = "https://qmnbbpoubacuctlokmgq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbmJicG91YmFjdWN0bG9rbWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwODgyOTQsImV4cCI6MjA5MDY2NDI5NH0.a0c7wB3KLQKHkGZccxNihpoKcgG9hpd-Ct9fluiKIJI";

// Lock em memória para contornar o erro do Navigator LockManager em iframes (AI Studio)
const memoryLock = (() => {
  let isLocked = false;
  const queue: Array<() => void> = [];

  return async <R>(name: string, acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
    if (isLocked) {
      await new Promise<void>((resolve) => queue.push(resolve));
    }
    isLocked = true;
    try {
      return await fn();
    } finally {
      isLocked = false;
      if (queue.length > 0) {
        const next = queue.shift();
        if (next) next();
      }
    }
  };
})();

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Bypass Navigator LockManager to prevent timeout in iframes
    lock: memoryLock,
  }
});
