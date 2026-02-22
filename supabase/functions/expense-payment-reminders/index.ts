import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Expense {
  id: string;
  name: string;
  type: string;
  amount: number;
  currency: string;
  payment_date: string;
  description: string | null;
  enterprise: {
    name: string;
    slug: string;
  };
}

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

    // Get Resend API key from database
    const { data: configData, error: configError } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'RESEND_API_KEY')
      .single();

    if (configError) {
      console.error('Error fetching API key:', configError);
      throw new Error('Failed to fetch API key from configuration');
    }

    const resendApiKey = configData?.value;

    // Calculate the date 2 days from now
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    // Query expenses that are due in 2 days and not paid
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select(`
        id,
        name,
        type,
        amount,
        currency,
        payment_date,
        description,
        enterprise_id,
        enterprise:enterprises!expenses_enterprise_id_fkey (
          name,
          slug
        )
      `)
      .eq('is_paid', false)
      .eq('payment_date', targetDateStr);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    if (!expenses || expenses.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No expenses due in 2 days' }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Group expenses by enterprise
    const expensesByEnterprise = expenses.reduce((acc: Record<string, Expense[]>, expense: any) => {
      const enterpriseName = expense.enterprise_id ? expense.enterprise.name : 'Dépenses Personnelles';
      if (!acc[enterpriseName]) {
        acc[enterpriseName] = [];
      }
      acc[enterpriseName].push(expense as Expense);
      return acc;
    }, {});

    // Build email content
    let emailHtml = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
            h2 { color: #1e40af; margin-top: 30px; }
            .expense-item { background: #f3f4f6; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #2563eb; }
            .expense-header { font-weight: bold; font-size: 16px; color: #1e293b; margin-bottom: 8px; }
            .expense-details { font-size: 14px; color: #475569; }
            .amount { color: #dc2626; font-weight: bold; font-size: 16px; }
            .type-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-left: 8px; }
            .type-pro { background: #dbeafe; color: #1e40af; }
            .type-perso { background: #fef3c7; color: #92400e; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔔 Rappel de Paiement - Dépenses à venir</h1>
            <p>Les dépenses suivantes sont dues dans <strong>2 jours</strong> (${targetDateStr}):</p>
    `;

    for (const [enterpriseName, enterpriseExpenses] of Object.entries(expensesByEnterprise)) {
      emailHtml += `<h2>🏢 ${enterpriseName}</h2>`;
      
      let enterpriseTotal = 0;
      const currencySums: Record<string, number> = {};

      for (const expense of enterpriseExpenses) {
        const typeBadge = expense.type === 'Professionnel' 
          ? '<span class="type-badge type-pro">Professionnel</span>'
          : '<span class="type-badge type-perso">Personnel</span>';

        emailHtml += `
          <div class="expense-item">
            <div class="expense-header">
              ${expense.name} ${typeBadge}
            </div>
            <div class="expense-details">
              <div class="amount">${expense.amount.toLocaleString()} ${expense.currency}</div>
              ${expense.description ? `<div style="margin-top: 8px;"><strong>Description:</strong> ${expense.description}</div>` : ''}
              <div style="margin-top: 8px; color: #64748b;"><strong>Date de paiement:</strong> ${expense.payment_date}</div>
            </div>
          </div>
        `;

        // Sum by currency
        if (!currencySums[expense.currency]) {
          currencySums[expense.currency] = 0;
        }
        currencySums[expense.currency] += Number(expense.amount);
      }

      // Add enterprise totals
      emailHtml += `<div style="margin-top: 15px; padding: 10px; background: #f9fafb; border-radius: 6px;"><strong>Total pour ${enterpriseName}:</strong> `;
      for (const [currency, sum] of Object.entries(currencySums)) {
        emailHtml += `<span style="margin-left: 10px;">${sum.toLocaleString()} ${currency}</span>`;
      }
      emailHtml += `</div>`;
    }

    emailHtml += `
            <div class="footer">
              <p>Ce rappel automatique a été généré par le système Team Gestion.</p>
              <p>Veuillez vous assurer que ces dépenses sont payées à temps.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend (if API key is configured)
    if (resendApiKey) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Team Gestion <CEO@scalset.com>',
          to: ['scalset.uae@gmail.com'],
          subject: `🔔 Rappel: ${expenses.length} dépense(s) à payer dans 2 jours`,
          html: emailHtml,
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error('Email sending error:', errorText);
        throw new Error(`Failed to send email: ${errorText}`);
      }

      const emailData = await emailResponse.json();
      console.log('Email sent successfully:', emailData);

      return new Response(
        JSON.stringify({ 
          message: 'Reminders sent successfully',
          expenseCount: expenses.length,
          emailId: emailData.id
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    } else {
      // If no Resend API key, just return the HTML for testing
      console.log('No RESEND_API_KEY configured, returning HTML for preview');
      return new Response(
        JSON.stringify({ 
          message: 'No email service configured',
          expenseCount: expenses.length,
          previewHtml: emailHtml
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

  } catch (error) {
    console.error('Error in expense-payment-reminders:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
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