/**
 * Utilitários de fuso horário brasileiro (America/Sao_Paulo / UTC-3)
 * Garante que agendamentos, datas de consulta e horários nunca sofram
 * com o deslocamento de +3 horas dos servidores UTC (Supabase / Docker).
 */

export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Retorna a data atual no Brasil no formato 'YYYY-MM-DD'
 * Mesmo às 22h ou 23h da noite, nunca pula para o dia seguinte.
 */
export function getBrazilTodayDate(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
}

/**
 * Retorna o horário atual no Brasil no formato 'HH:mm'
 */
export function getBrazilCurrentTime(): string {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return formatter.format(new Date());
}

/**
 * Formata uma data para o padrão brasileiro 'DD/MM/YYYY'
 * Tratando com segurança strings 'YYYY-MM-DD' e ISO timestamps UTC.
 */
export function formatBrazilDate(rawDate?: string | null): string {
  if (!rawDate) return '';
  const trimmed = rawDate.trim();

  // Se já for apenas YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-');
    return `${d}/${m}/${y}`;
  }

  // Se já for DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  // Se for ISO ou timestamp com data e hora
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('pt-BR', {
        timeZone: BRAZIL_TIMEZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  } catch (_) {}

  return trimmed;
}

/**
 * Extrai a data 'YYYY-MM-DD' de uma string no fuso horário do Brasil
 */
export function extractBrazilDateISO(rawDate?: string | null): string {
  if (!rawDate) return getBrazilTodayDate();
  const trimmed = rawDate.trim();

  // Se já for YYYY-MM-DD simples
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Se for YYYY-MM-DDTHH:mm... sem Z (local)
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed) && !trimmed.endsWith('Z')) {
    return trimmed.split('T')[0];
  }

  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: BRAZIL_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(d);
    }
  } catch (_) {}

  return trimmed.split('T')[0] || getBrazilTodayDate();
}

/**
 * Extrai o horário 'HH:mm' de um agendamento no fuso do Brasil
 */
export function extractBrazilTime(rawTimeOrIso?: string | null): string {
  if (!rawTimeOrIso) return '09:00';
  const trimmed = rawTimeOrIso.trim();

  // Se for HH:mm ou HH:mm:ss
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    return trimmed.slice(0, 5);
  }

  // Se for ISO string
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('pt-BR', {
        timeZone: BRAZIL_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
  } catch (_) {}

  if (trimmed.includes('T')) {
    const part = trimmed.split('T')[1];
    if (part) return part.slice(0, 5);
  }

  return '09:00';
}

/**
 * Constrói string ISO com offset explícito do Brasil (-03:00)
 * Isso impede que o PostgreSQL ou o Supabase interpretem como UTC e desloquem o dia.
 */
export function buildBrazilDateTime(date: string, time: string): {
  data_consulta: string;
  hora_consulta: string;
  data_hora_inicio: string;
  data_hora_display: string;
} {
  const cleanDate = date.includes('T') ? date.split('T')[0] : date;
  const cleanTime = time.length === 5 ? `${time}:00` : (time.length === 8 ? time : '08:00:00');
  
  // Offset fixo do horário oficial de Brasília: -03:00
  const timestampWithTz = `${cleanDate}T${cleanTime}-03:00`;
  const [y, m, d] = cleanDate.split('-');
  const display = `${d}/${m}/${y} às ${cleanTime.slice(0, 5)}`;

  return {
    data_consulta: cleanDate,
    hora_consulta: cleanTime,
    data_hora_inicio: timestampWithTz,
    data_hora_display: display
  };
}
