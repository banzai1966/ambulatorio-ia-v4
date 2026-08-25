import axios from 'axios';
import { supabase } from '../lib/supabase';
import { getActiveClinicConfig } from '../constants/clinicProfiles';

export async function sendWhatsAppMessage(phone: string, message: string, media?: string, mediaType?: string, fileName?: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    // Obtém usuário da sessão ou do localStorage para identificar o médico logado
    let currentUser = session?.user;
    if (!currentUser && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ambulatorio_user_session');
        if (saved) currentUser = JSON.parse(saved);
      } catch (e) {
        console.warn("Aviso ao ler sessão:", e);
      }
    }

    // Recupera configurações salvas da clínica para a instância correta do profissional
    const clinicConfig = getActiveClinicConfig(currentUser);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (clinicConfig.evolution_url) headers['x-evolution-url'] = clinicConfig.evolution_url;
    if (clinicConfig.evolution_instance) headers['x-evolution-instance'] = clinicConfig.evolution_instance;
    if (clinicConfig.evolution_apikey) headers['x-evolution-apikey'] = clinicConfig.evolution_apikey;

    const response = await axios.post('/api/send-message', {
      phone,
      message,
      media,
      mediaType,
      fileName,
      userId: currentUser?.id,
      evolution_url: clinicConfig.evolution_url,
      evolution_instance: clinicConfig.evolution_instance,
      evolution_apikey: clinicConfig.evolution_apikey
    }, {
      headers
    });
    console.log(`WhatsApp message sent successfully via instance [${clinicConfig.evolution_instance}] (${clinicConfig.professional_name})`);
    return response.data;
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    throw error;
  }
}
