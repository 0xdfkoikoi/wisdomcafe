export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/generate" || request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const { prompt } = await request.json();
      if (!prompt || typeof prompt !== "string") {
        return new Response(JSON.stringify({ error: "Invalid prompt" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!env.GEMINI_API_KEY) {
        return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const geminiUrl =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      });

      const raw = await geminiRes.json();

      if (!geminiRes.ok) {
        return new Response(
          JSON.stringify({ error: "Gemini error", raw }),
          {
            status: geminiRes.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      let text = "";
      try {
        text = raw.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
      } catch (_) {
        text = "";
      }

      return new Response(JSON.stringify({ text, raw }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Bad request", details: String(err) }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};


