import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authorizeAiRequest, corsHeaders } from "../_shared/guard.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
// Must be a vision-capable model. Override with the OPENAI_RECEIPT_MODEL secret.
const receiptModel = Deno.env.get('OPENAI_RECEIPT_MODEL') ?? 'gpt-5-mini';

// Input validation constants
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'gif'];

function validateImageData(image: unknown): { valid: boolean; error?: string } {
  if (!image || typeof image !== 'string') {
    return { valid: false, error: 'Invalid image data' };
  }
  
  // Check for data URL format
  const dataUrlRegex = /^data:image\/(jpeg|jpg|png|webp|gif);base64,/;
  const match = image.match(dataUrlRegex);
  
  if (!match) {
    return { valid: false, error: `Invalid image format. Use ${ALLOWED_IMAGE_FORMATS.join(', ').toUpperCase()}` };
  }
  
  // Extract base64 content and estimate size
  const base64Content = image.split(',')[1];
  if (!base64Content) {
    return { valid: false, error: 'Invalid base64 image data' };
  }
  
  // Base64 size estimation: actual bytes ≈ base64 length * 3/4
  const estimatedSize = (base64Content.length * 3) / 4;
  if (estimatedSize > MAX_IMAGE_SIZE_BYTES) {
    return { valid: false, error: 'Image exceeds 5MB limit' };
  }
  
  return { valid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { image } = body;

    // Validate image input
    const validation = validateImageData(image);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!openAIApiKey) {
      console.error("OPENAI_API_KEY is not configured");
      return new Response(JSON.stringify({ error: 'Service configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify subscription and charge quota only once the request is valid
    const denied = await authorizeAiRequest(req, 'receipt');
    if (denied) return denied;

    console.log('Analyzing receipt image...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: receiptModel,
        ...(receiptModel.startsWith('gpt-5') ? { reasoning_effort: 'minimal' } : {}),
        // Guarantees a parseable JSON object instead of prose or markdown fences.
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a receipt analyzer. Extract expense information from receipt images.
            
Return a JSON object with:
- items: array of {name, price} for each line item
- total: the total amount
- store: the store/merchant name
- date: the date if visible
- category: suggested category (groceries, dining, shopping, entertainment, transport, utilities, other)

If you can't read certain fields, use null. Be concise and accurate.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this receipt and extract the expense details.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: image,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Unable to analyze receipt.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    // Try to parse JSON from the response
    let parsed;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsed = JSON.parse(jsonStr);
    } catch {
      // If parsing fails, return the raw content
      parsed = { raw: content };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error analyzing receipt:', error);
    return new Response(JSON.stringify({ error: 'An error occurred processing your request.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
