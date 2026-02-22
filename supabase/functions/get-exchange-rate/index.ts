import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    const response = await fetch("https://www.dzairexchange.com/");
    const html = await response.text();

    const payseraMatch = html.match(/Paysera[^|]*\|\s*(\d+(?:\.\d+)?)\s*DZD/i);

    if (!payseraMatch) {
      const altMatch = html.match(/Paysera.*?(\d+(?:\.\d+)?)\s*DZD/i);

      if (!altMatch) {
        return new Response(
          JSON.stringify({
            error: "Could not find Paysera rate",
            debug: html.substring(0, 500)
          }),
          {
            status: 404,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const rate = parseFloat(altMatch[1]);
      return new Response(
        JSON.stringify({ rate, timestamp: new Date().toISOString() }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const rate = parseFloat(payseraMatch[1]);

    return new Response(
      JSON.stringify({ rate, timestamp: new Date().toISOString() }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
