import { supabase } from '../lib/supabase';

export interface AvailabilityRule {
  doctor_id: string;
  day_of_week: number; // 1 = Segunda, 7 = Domingo
  start_time: string; // "08:00"
  end_time: string; // "18:00"
  duration_minutes: number;
}

export const getAvailableSlots = async (doctorId: string, date: string) => {
  // 1. Busca a regra de disponibilidade do médico para o dia da semana
  // Usamos T12:00:00 para garantir que o dia da semana seja calculado corretamente independente do fuso horário
  const dateObj = new Date(`${date}T12:00:00`);
  const day = dateObj.getDay(); // 0=Dom, 1=Seg, ..., 6=Sab
  const dayOfWeek = day === 0 ? 7 : day; // Mapeia para 1=Seg, ..., 7=Dom
  
  const { data: rules } = await supabase
    .from('doctor_availability')
    .select('id, doctor_id, day_of_week, start_time, end_time, duration_minutes')
    .eq('doctor_id', doctorId)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle(); // Usamos maybeSingle para evitar erro se não houver regra

  if (!rules) {
    // Se não houver regras, retorna slots padrão (08:00 às 18:00, a cada 30 min)
    const defaultSlots = [];
    for (let h = 8; h < 18; h++) {
      defaultSlots.push(`${h.toString().padStart(2, '0')}:00`);
      defaultSlots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    
    // Filtra slots ocupados mesmo com regras padrão
    try {
      const tryFetchAppointments = async (table: string, dateCol: string, timeCol: string): Promise<any[]> => {
        // Tenta buscar por data_consulta e hora_consulta
        try {
          const { data, error } = await supabase
            .from(table)
            .select(`${dateCol}, ${timeCol}`)
            .eq(dateCol, date);
          if (error) throw error;
          return data || [];
        } catch (err) {
          // Fallback para data_hora_inicio ou data_hora
          const { data, error } = await supabase
            .from(table)
            .select('data_hora_inicio, data_hora')
            .or(`data_hora_inicio.gte.${date}T00:00:00,data_hora.gte.${date}T00:00:00`)
            .or(`data_hora_inicio.lte.${date}T23:59:59,data_hora.lte.${date}T23:59:59`);
          
          if (error) {
            // Se falhar o OR complexo, tenta o mais simples
            const { data: simpleData, error: simpleError } = await supabase
              .from(table)
              .select('data_hora_inicio')
              .gte('data_hora_inicio', `${date}T00:00:00`)
              .lte('data_hora_inicio', `${date}T23:59:59`);
            
            if (simpleError) throw simpleError;
            return (simpleData || []).map(app => ({
              [dateCol]: app.data_hora_inicio.split('T')[0],
              [timeCol]: app.data_hora_inicio.split('T')[1]
            }));
          }

          return (data || []).map(app => {
            const val = app.data_hora_inicio || app.data_hora;
            return {
              [dateCol]: val.split('T')[0],
              [timeCol]: val.split('T')[1]
            };
          });
        }
      };

      let appointments: any[] = [];
      try {
        appointments = await tryFetchAppointments('agendamentos', 'data_consulta', 'hora_consulta');
      } catch (err: any) {
        console.warn("schedulingService: Erro ao buscar em agendamentos, tentando appointments...", err.message);
        try {
          appointments = await tryFetchAppointments('appointments', 'appointment_date', 'appointment_time');
        } catch (err2) {
          console.error("schedulingService: Falha total ao buscar agendamentos ocupados.");
        }
      }

      return defaultSlots.filter(slot => {
        // Verifica se já existe um agendamento exatamente nesse horário
        const isOccupied = appointments.some(app => {
          const appTime = app.hora_consulta || app.appointment_time;
          return appTime?.substring(0, 5) === slot;
        });
        return !isOccupied;
      });
    } catch (err) {
      console.warn("schedulingService: Erro ao filtrar slots padrão:", err);
      return defaultSlots;
    }
  }

  // 2. Busca os agendamentos já existentes para este dia
  try {
    const tryFetchAppointments = async (table: string, dateCol: string, timeCol: string): Promise<any[]> => {
      try {
        const { data, error } = await supabase
          .from(table)
          .select(`${dateCol}, ${timeCol}`)
          .eq(dateCol, date);
        if (error) throw error;
        return data || [];
      } catch (err) {
        // Fallback para data_hora_inicio ou data_hora
        const { data, error } = await supabase
          .from(table)
          .select('data_hora_inicio, data_hora')
          .or(`data_hora_inicio.gte.${date}T00:00:00,data_hora.gte.${date}T00:00:00`)
          .or(`data_hora_inicio.lte.${date}T23:59:59,data_hora.lte.${date}T23:59:59`);
        
        if (error) {
          const { data: simpleData, error: simpleError } = await supabase
            .from(table)
            .select('data_hora_inicio')
            .gte('data_hora_inicio', `${date}T00:00:00`)
            .lte('data_hora_inicio', `${date}T23:59:59`);
          
          if (simpleError) throw simpleError;
          return (simpleData || []).map(app => ({
            [dateCol]: app.data_hora_inicio.split('T')[0],
            [timeCol]: app.data_hora_inicio.split('T')[1]
          }));
        }

        return (data || []).map(app => {
          const val = app.data_hora_inicio || app.data_hora;
          return {
            [dateCol]: val.split('T')[0],
            [timeCol]: val.split('T')[1]
          };
        });
      }
    };

    let appointments: any[] = [];
    try {
      appointments = await tryFetchAppointments('agendamentos', 'data_consulta', 'hora_consulta');
    } catch (err: any) {
      console.warn("schedulingService: Erro ao buscar em agendamentos (com regras), tentando appointments...", err.message);
      try {
        appointments = await tryFetchAppointments('appointments', 'appointment_date', 'appointment_time');
      } catch (err2) {
        console.error("schedulingService: Falha total ao buscar agendamentos (com regras).");
      }
    }

    // 3. Gera todos os slots possíveis baseados na regra
    const slots: string[] = [];
    let currentTime = new Date(`${date}T${rules.start_time}`);
    const endTime = new Date(`${date}T${rules.end_time}`);

    while (currentTime < endTime) {
      const slotStart = currentTime.toTimeString().substring(0, 5);
      
      // Verifica se o slot está livre
      const isOccupied = appointments.some(app => {
        const appTime = app.hora_consulta || app.appointment_time;
        return appTime?.substring(0, 5) === slotStart;
      });

      if (!isOccupied) {
        slots.push(slotStart);
      }

      currentTime = new Date(currentTime.getTime() + rules.duration_minutes * 60000);
    }
    
    return slots;
  } catch (err) {
    console.error("schedulingService: Erro ao gerar slots com regras:", err);
    return [];
  }
};

export const getDoctorsBySpecialty = async (specialtyName: string) => {
  // 1. Busca o ID da especialidade pelo nome (tenta 'nome' e 'name')
  let { data: specialty } = await supabase
    .from('specialties')
    .select('id')
    .eq('nome', specialtyName)
    .single();

  if (!specialty) {
    const { data: altSpecialty } = await supabase
      .from('specialties')
      .select('id')
      .eq('name', specialtyName)
      .single();
    specialty = altSpecialty;
  }

  if (!specialty) return [];

  // 2. Busca os médicos com essa especialidade (aceita role doctor ou admin)
  try {
    const { data: doctors, error } = await supabase
      .from('profiles')
      .select('id, full_name, especialidade, role')
      .in('role', ['doctor', 'admin'])
      .eq('especialidade', specialtyName);

    if (error) {
      console.warn("Erro ao buscar médicos por especialidade, tentando fallback:", error.message);
      
      const { data: allDoctors, error: allErr } = await supabase
        .from('profiles')
        .select('id, full_name, especialidade, role')
        .in('role', ['doctor', 'admin']);
      
      if (allErr) throw allErr;
      
      return (allDoctors || []).filter(d => d.especialidade === specialtyName);
    }

    return doctors || [];
  } catch (err) {
    console.error("Erro crítico ao buscar médicos por especialidade:", err);
    // Fallback final: busca todos os profissionais clínicos (doctor e admin)
    const { data } = await supabase.from('profiles').select('id, full_name').in('role', ['doctor', 'admin']);
    return data || [];
  }
};
