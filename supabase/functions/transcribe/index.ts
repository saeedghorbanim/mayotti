import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authorizeAiRequest, corsHeaders } from "../_shared/guard.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Input validation constants
const MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768): Uint8Array {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

function validateAudioData(audio: unknown): { valid: boolean; error?: string } {
  if (!audio || typeof audio !== 'string') {
    return { valid: false, error: 'Invalid audio data' };
  }
  
  if (audio.length === 0) {
    return { valid: false, error: 'Audio data cannot be empty' };
  }
  
  // Base64 size estimation: actual bytes ≈ base64 length * 3/4
  const estimatedSize = (audio.length * 3) / 4;
  if (estimatedSize > MAX_AUDIO_SIZE_BYTES) {
    return { valid: false, error: 'Audio file too large (max 10MB)' };
  }
  
  return { valid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { audio } = body;
    
    // Validate audio input
    const validation = validateAudioData(audio);
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
    const denied = await authorizeAiRequest(req, 'transcribe');
    if (denied) return denied;

    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio);
    
    // Prepare form data
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(binaryAudio).buffer as ArrayBuffer], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    console.log('Sending audio for transcription...');

    // Send to OpenAI
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Transcription service error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Unable to transcribe audio.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ text: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred processing your request.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
