import { supabase } from "@/integrations/supabase/client";

export const sendNotification = async (requestId: string, status: string, rejectionReason?: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: {
        requestId,
        status,
        rejectionReason
      }
    });

    if (error) {
      console.error('Error sending notification:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in notification service:', error);
    throw error;
  }
};