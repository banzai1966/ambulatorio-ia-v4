import axios from 'axios';
import { supabase } from '../lib/supabase';

export async function sendWhatsAppMessage(phone: string, message: string, media?: string, mediaType?: string, fileName?: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    console.log(`[IA] Client: Token found: ${!!token}`);
    if (!token) {
      console.warn("[IA] Client: No session token found. Request might fail with 401.");
    }

    const response = await axios.post('/api/send-message', {
      phone,
      message,
      media,
      mediaType,
      fileName,
      userId: session?.user?.id
    }, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    console.log('WhatsApp message sent successfully');
    return response.data;
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    throw error;
  }
}
