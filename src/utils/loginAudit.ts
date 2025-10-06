import { supabase } from "@/integrations/supabase/client";

interface LoginAuditData {
  userEmail: string;
  userType: 'student' | 'admin';
  success: boolean;
}

export async function trackLogin({ userEmail, userType, success }: LoginAuditData) {
  try {
    // Get user's IP address and location info
    let ipAddress = 'Unknown';
    let city = 'Unknown';
    let country = 'Unknown';
    
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      ipAddress = ipData.ip;

      // Get location from IP
      const locationResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`);
      const locationData = await locationResponse.json();
      city = locationData.city || 'Unknown';
      country = locationData.country_name || 'Unknown';
    } catch (error) {
      console.error('Error fetching IP/location:', error);
    }

    // Get user agent and device info
    const userAgent = navigator.userAgent;
    const deviceInfo = getDeviceInfo(userAgent);

    // Insert audit log
    const { error } = await supabase.from('login_audit').insert({
      user_email: userEmail,
      user_type: userType,
      ip_address: ipAddress,
      city: city,
      country: country,
      user_agent: userAgent,
      device_info: deviceInfo,
      success: success,
    });

    if (error) {
      console.error('Error tracking login:', error);
    }
  } catch (error) {
    console.error('Error in trackLogin:', error);
  }
}

function getDeviceInfo(userAgent: string): string {
  // Simple device detection
  if (/mobile/i.test(userAgent)) {
    return 'Mobile';
  } else if (/tablet/i.test(userAgent)) {
    return 'Tablet';
  } else {
    return 'Desktop';
  }
}
