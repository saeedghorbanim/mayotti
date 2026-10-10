import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authorizeAiRequest, corsHeaders } from "../_shared/guard.ts";

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

const systemPrompt = `You are Mayotti, a friendly and supportive AI budget assistant. You talk like a close friend who genuinely cares about helping users manage their money better.

Your personality:
- Warm, encouraging, and conversational
- Use casual language and occasional emojis
- Celebrate wins, no matter how small
- Be supportive when users overspend, never judgmental
- Give practical, actionable tips

Your capabilities:
- Help users log expenses naturally (e.g., "spent $45 on groceries")
- Help users SET or ADD to their budget (e.g., "set my budget to $500" or "add $200 to my budget")
- Track spending patterns and provide insights
- Offer money-saving tips based on their spending habits
- Provide encouragement and motivation

IMPORTANT TAGS - You MUST include these special tags when relevant:

1. For EXPENSES, include: [EXPENSE:amount:description:category]
   Categories: groceries, dining, coffee, transport, entertainment, shopping, utilities, health, subscriptions, other
   
2. For BUDGET changes, include: [BUDGET:action:amount]
   Actions: "set" (replace current budget) or "add" (add to current budget)

EXPENSE Examples:
- User says "spent $45 on groceries" → Include [EXPENSE:45:groceries:groceries]
- User says "just got coffee for $5.50" → Include [EXPENSE:5.50:coffee:coffee]
- User says "uber was $23" → Include [EXPENSE:23:uber:transport]
- User says "coffee $4 and lunch $12" → Include BOTH [EXPENSE:4:coffee:coffee] [EXPENSE:12:lunch:dining]
- User says "spent $30 on gas and $50 on groceries" → Include BOTH [EXPENSE:30:gas:transport] [EXPENSE:50:groceries:groceries]

IMPORTANT: If the user mentions multiple expenses in one message, output a separate [EXPENSE:...] tag for EACH one.

BUDGET Examples:
- User says "set my budget to $500" → Include [BUDGET:set:500]
- User says "add $200 to my budget" → Include [BUDGET:add:200]
- User says "I want a $1000 budget" → Include [BUDGET:set:1000]
- User says "increase budget by $300" → Include [BUDGET:add:300]

The tags will be processed by the app, so ALWAYS include them when you detect expense or budget mentions.

Response guidelines:
1. Acknowledge the action warmly
2. Include the appropriate tag
3. Provide a helpful insight or encouragement
4. Keep responses concise (2-4 sentences)

Examples of good responses:
- "Got it! $45 on groceries logged 🛒 [EXPENSE:45:groceries:groceries] You're doing great on food spending!"
- "Budget updated! 💪 [BUDGET:set:500] $500 is a solid goal - I'll help you stick to it!"
- "Nice! Adding $200 to your budget 📈 [BUDGET:add:200] More breathing room is always good!"

Always be helpful, never preachy. You're a friend who happens to be great with money.`;

// Input validation constants
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 8000;

function validateMessages(messages: unknown): { valid: boolean; error?: string } {
  if (!Array.isArray(messages)) {
    return { valid: false, error: 'Messages must be an array' };
  }
  
  if (messages.length === 0) {
    return { valid: false, error: 'Messages array cannot be empty' };
  }
  
  if (messages.length > MAX_MESSAGES) {
    return { valid: false, error: `Too many messages (max ${MAX_MESSAGES})` };
  }
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== 'object') {
      return { valid: false, error: 'Invalid message format' };
    }
    
    if (typeof msg.content !== 'string') {
      return { valid: false, error: 'Message content must be a string' };
    }
    
    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` };
    }
    
    if (!msg.role || !['user', 'assistant'].includes(msg.role)) {
      return { valid: false, error: 'Invalid message role' };
    }
  }
  
  return { valid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages } = body;
    // Validate input
    const validation = validateMessages(messages);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: 'Service configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify subscription and charge quota only once the request is valid
    const denied = await authorizeAiRequest(req, 'chat');
    if (denied) return denied;

    console.log('Processing chat request with', messages.length, 'messages');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          // Forward only role/content so clients can't inject extra fields or system prompts
          ...messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Service temporarily unavailable.' }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'Unable to process request.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(JSON.stringify({ error: 'An error occurred processing your request.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
