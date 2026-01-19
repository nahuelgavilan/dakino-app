import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TicketItem {
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface TicketData {
  store_name: string | null;
  date: string | null;
  items: TicketItem[];
  total: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const { image } = await req.json();

    if (!image) {
      throw new Error('No image provided');
    }

    const prompt = `Analiza este ticket/recibo de compra y extrae la información en formato JSON.

IMPORTANTE:
- Extrae TODOS los productos que puedas identificar
- Los precios deben ser números (sin símbolos de moneda)
- La fecha debe estar en formato YYYY-MM-DD
- Si no puedes identificar algún campo, usa null
- quantity debe ser el número de unidades compradas
- unit_price es el precio por unidad
- total es quantity * unit_price para cada producto

Responde SOLO con el JSON, sin explicaciones ni texto adicional:
{
  "store_name": "nombre de la tienda o supermercado",
  "date": "YYYY-MM-DD",
  "items": [
    { "name": "nombre del producto", "quantity": 1, "unit_price": 0.00, "total": 0.00 }
  ],
  "total": 0.00
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.2-90b-vision-preview',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } }
          ]
        }],
        temperature: 0.1,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from Groq');
    }

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    const ticketData: TicketData = JSON.parse(jsonStr);

    // Validate and clean the data
    const cleanedData: TicketData = {
      store_name: ticketData.store_name || null,
      date: ticketData.date || null,
      items: (ticketData.items || []).map(item => ({
        name: String(item.name || 'Producto'),
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        total: Number(item.total) || (Number(item.quantity) || 1) * (Number(item.unit_price) || 0)
      })),
      total: Number(ticketData.total) || 0
    };

    return new Response(JSON.stringify(cleanedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing ticket:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
