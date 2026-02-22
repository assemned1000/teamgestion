import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const body = await req.json();
    const { to, subject, message } = body;

    if (!to) {
      return new Response(
        JSON.stringify({ error: 'Email recipient (to) is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Get Resend API key from database
    const { data: configData, error: configError } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'RESEND_API_KEY')
      .single();

    if (configError || !configData) {
      console.error('Error fetching API key:', configError);
      throw new Error('Failed to fetch API key from configuration');
    }

    const resendApiKey = configData.value;

    // Build email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 15px; margin-bottom: 25px; }
            .content { background: #f9fafb; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2563eb; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }
            .badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Test Email - Team Gestion</h1>
            <p>Ceci est un email de test pour vérifier que votre configuration Resend fonctionne correctement.</p>
            
            <div class="content">
              <p><strong>Message:</strong></p>
              <p>${message || 'Votre système d\'envoi d\'emails est maintenant opérationnel!'}</p>
            </div>

            <p>✨ <span class="badge">Configuration réussie</span></p>
            
            <div class="footer">
              <p>Email envoyé par Team Gestion</p>
              <p>Propulsé par Resend</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Team Gestion <CEO@scalset.com>',
        to: Array.isArray(to) ? to : [to],
        subject: subject || '✅ Test Email - Team Gestion',
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Email sending error:', errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailData = await emailResponse.json();
    console.log('Test email sent successfully:', emailData);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Test email sent successfully',
        emailId: emailData.id,
        to: to
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error in send-test-email:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});