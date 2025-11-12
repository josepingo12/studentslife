import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModerationRequest {
  content: string;
  mediaUrl?: string;
  contentType: 'post' | 'comment' | 'message' | 'story';
}

interface ModerationResult {
  approved: boolean;
  score: number;
  category?: string;
  reason?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, mediaUrl, contentType }: ModerationRequest = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Moderating content:', { contentType, hasMedia: !!mediaUrl });

    // Build system prompt for moderation
    const systemPrompt = `You are a content moderation AI. Analyze the provided content and determine if it violates any of these policies:

1. Contenuti diffamatori, discriminatori o malevoli (religione, razza, orientamento sessuale, genere, origine)
2. Rappresentazioni realistiche di violenza, mutilazione, tortura o abuso
3. Contenuti che incoraggiano l'uso illegale di armi o facilitano l'acquisto di armi
4. Materiale apertamente sessuale o pornografico
5. Informazioni false o fuorvianti, funzionalità ingannevoli
6. Contenuti dannosi che capitalizzano su eventi recenti (conflitti, terrorismo, epidemie)

Respond ONLY with a JSON object in this exact format:
{
  "approved": true/false,
  "score": 0-100 (0=safe, 100=extremely harmful),
  "category": "one of: hate_speech, violence, weapons, sexual_content, misinformation, harmful_exploitation, safe",
  "reason": "brief explanation in Italian"
}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analyze this content:\n\n${content || '(no text content)'}${mediaUrl ? `\n\nMedia URL: ${mediaUrl}` : ''}` }
    ];

    // Call Lovable AI for moderation
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          approved: false,
          score: 50,
          category: 'rate_limited',
          reason: 'Troppi tentativi. Riprova tra qualche minuto.'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI Response:', aiResponse);

    // Parse AI response
    let result: ModerationResult;
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Default to safe if parsing fails
      result = {
        approved: true,
        score: 0,
        category: 'safe',
        reason: 'Contenuto analizzato e approvato'
      };
    }

    // Log moderation result
    console.log('Moderation result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in moderate-content function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      approved: false,
      score: 50,
      category: 'error',
      reason: 'Errore durante la moderazione. Riprova.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});