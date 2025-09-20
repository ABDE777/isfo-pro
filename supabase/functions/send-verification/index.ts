import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface VerificationRequest {
  email: string;
}

const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: VerificationRequest = await req.json();

    // Check if student exists
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .single();

    if (studentError || !student) {
      return new Response(
        JSON.stringify({ error: "Email d'étudiant non trouvé dans la base de données" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification code
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        email,
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Error inserting verification code:', insertError);
      throw new Error('Erreur lors de la génération du code');
    }

    // Send email
    const emailResponse = await resend.emails.send({
      from: "OFPPT ISFO <onboarding@resend.dev>",
      to: [email],
      subject: "Code de vérification - Demande d'attestation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Code de vérification</h1>
          <p>Bonjour ${student.first_name} ${student.last_name},</p>
          <p>Votre code de vérification pour la demande d'attestation est :</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
            ${code}
          </div>
          <p>Ce code expire dans 10 minutes.</p>
          <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            Institut Spécialisé de Formation de l'Offshoring - Casablanca
          </p>
        </div>
      `,
    });

    console.log("Verification email sent:", emailResponse);

    return new Response(
      JSON.stringify({ 
        message: "Code de vérification envoyé à votre email",
        student: {
          first_name: student.first_name,
          last_name: student.last_name,
          student_group: student.student_group
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-verification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);