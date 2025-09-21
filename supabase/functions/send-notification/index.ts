import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface NotificationRequest {
  requestId: string;
  status: string;
  rejectionReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requestId, status, rejectionReason }: NotificationRequest = await req.json();

    console.log("Processing notification:", { requestId, status });

    // Get attestation request details - student info is already included in the request
    const { data: request, error: requestError } = await supabase
      .from('attestation_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      console.error("Request not found:", requestError);
      throw new Error("Demande d'attestation non trouvée");
    }

    // For requests that have student_id, try to get email from students table
    let studentEmail = request.phone; // fallback to phone field which sometimes contains email
    
    if (request.student_id) {
      const { data: studentData } = await supabase
        .from('students')
        .select('email')
        .eq('id', request.student_id)
        .single();
      
      if (studentData?.email) {
        studentEmail = studentData.email;
      }
    }

    // Use student data directly from the attestation request
    const student = {
      first_name: request.first_name,
      last_name: request.last_name,
      email: studentEmail,
      student_group: request.student_group,
      cin: request.cin
    };

    // Prepare email content based on status
    let subject: string;
    let emailHtml: string;

    if (status === 'approved') {
      subject = "Attestation approuvée - OFPPT ISFO";
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #059669; margin: 0;">✅ Attestation Approuvée</h1>
          </div>
          
          <div style="background: #f0fdf4; padding: 25px; border-radius: 8px; border-left: 4px solid #059669; margin: 20px 0;">
            <p style="margin: 0 0 15px 0; font-size: 16px;">Bonjour <strong>${student.first_name} ${student.last_name}</strong>,</p>
            <p style="margin: 0 0 15px 0; color: #166534;">Excellente nouvelle ! Votre demande d'attestation a été <strong>approuvée</strong>.</p>
            
            <div style="background: #ffffff; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #059669;">Détails de votre demande :</p>
              <p style="margin: 5px 0; color: #374151;"><strong>CIN :</strong> ${student.cin}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>Groupe :</strong> ${student.student_group}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>Date de demande :</strong> ${new Date(request.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
            
            <p style="margin: 15px 0 0 0; color: #166534;"><strong>Veuillez vous présenter à la direction pour récupérer votre attestation.</strong></p>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
              Institut Spécialisé de Formation de l'Offshoring - Casablanca
            </p>
          </div>
        </div>
      `;
    } else if (status === 'rejected') {
      subject = "Demande d'attestation rejetée - OFPPT ISFO";
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0;">❌ Demande Rejetée</h1>
          </div>
          
          <div style="background: #fef2f2; padding: 25px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
            <p style="margin: 0 0 15px 0; font-size: 16px;">Bonjour <strong>${student.first_name} ${student.last_name}</strong>,</p>
            <p style="margin: 0 0 15px 0; color: #991b1b;">Nous regrettons de vous informer que votre demande d'attestation a été <strong>rejetée</strong>.</p>
            
            <div style="background: #ffffff; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #dc2626;">Détails de votre demande :</p>
              <p style="margin: 5px 0; color: #374151;"><strong>CIN :</strong> ${student.cin}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>Groupe :</strong> ${student.student_group}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>Date de demande :</strong> ${new Date(request.created_at).toLocaleDateString('fr-FR')}</p>
              ${rejectionReason ? `<p style="margin: 10px 0 0 0; color: #991b1b;"><strong>Motif :</strong> ${rejectionReason}</p>` : ''}
            </div>
            
            <p style="margin: 15px 0 0 0; color: #991b1b;"><strong>Votre demande a été rejetée. Veuillez vous présenter à la direction pour plus d'informations.</strong></p>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
              Institut Spécialisé de Formation de l'Offshoring - Casablanca
            </p>
          </div>
        </div>
      `;
    } else {
      throw new Error("Statut de notification invalide");
    }

    // Send email via Resend
    try {
      const emailResponse = await resend.emails.send({
        from: "OFPPT ISFO <onboarding@resend.dev>",
        to: [student.email],
        subject: subject,
        html: emailHtml,
      });

      console.log("Notification email sent successfully via Resend:", emailResponse);
    } catch (error: any) {
      console.error("Error sending notification email via Resend:", error);
      throw new Error(`Erreur lors de l'envoi de la notification: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ message: "Notification envoyée avec succès" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur lors de l'envoi de la notification" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
