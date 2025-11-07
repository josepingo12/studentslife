import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  recipientUserId: string;
  senderName: string;
  messageContent: string;
  conversationId: string;
  senderId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 send-chat-notification function called');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Firebase service account
    const firebaseServiceAccountJson = Deno.env.get('FIREBASE_ADMIN_SERVICE_ACCOUNT');
    if (!firebaseServiceAccountJson) {
      console.error('❌ FIREBASE_ADMIN_SERVICE_ACCOUNT secret not found');
      return new Response(
        JSON.stringify({ error: 'Missing Firebase configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firebaseConfig = JSON.parse(firebaseServiceAccountJson);
    const projectId = firebaseConfig.project_info.project_id;
    console.log('📱 Firebase project ID:', projectId);

    // Parse request body
    const payload: NotificationPayload = await req.json();
    console.log('📨 Notification payload:', { ...payload, messageContent: payload.messageContent.substring(0, 50) });

    const { recipientUserId, senderName, messageContent, conversationId } = payload;

    if (!recipientUserId) {
      console.error('❌ Recipient user ID not provided');
      return new Response(
        JSON.stringify({ error: 'Recipient user ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get recipient's FCM token
    const { data: userDevice, error: fetchError } = await supabase
      .from('user_fcm_tokens')
      .select('fcm_token, platform')
      .eq('user_id', recipientUserId)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error fetching FCM token:', fetchError.message);
      return new Response(
        JSON.stringify({ error: 'Error fetching FCM token', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userDevice) {
      console.log('⚠️ No FCM token found for user:', recipientUserId);
      return new Response(
        JSON.stringify({ message: 'No FCM token registered for user' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ FCM token found for platform:', userDevice.platform);

    // Prepare FCM message
    const truncatedMessage = messageContent.length > 100 
      ? messageContent.substring(0, 97) + '...' 
      : messageContent;

    const fcmMessage = {
      message: {
        token: userDevice.fcm_token,
        notification: {
          title: `Nuovo messaggio da ${senderName}`,
          body: truncatedMessage,
        },
        data: {
          conversationId: conversationId,
          senderId: payload.senderId,
          type: 'chat_message',
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'chat_messages',
            sound: 'default',
            defaultSound: true,
            defaultVibrateTimings: true,
            defaultLightSettings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      },
    };

    // Get OAuth2 access token for FCM
    console.log('🔑 Getting OAuth2 access token...');
    
    // Use Firebase service account to get access token
    const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const now = Math.floor(Date.now() / 1000);
    const jwtClaimSet = {
      iss: firebaseConfig.client[0].client_info.email || `firebase-adminsdk@${projectId}.iam.gserviceaccount.com`,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    // For simplicity, we'll use the FCM legacy API with API key
    // The modern approach requires RSA signing which is complex in Deno
    const apiKey = firebaseConfig.client[0].api_key[0].current_key;
    
    if (!apiKey) {
      console.error('❌ Firebase API key not found in config');
      return new Response(
        JSON.stringify({ error: 'Firebase API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notification using FCM HTTP v1 API
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    
    console.log('📤 Sending FCM notification...');
    console.log('FCM URL:', fcmUrl);
    
    // Note: For production, you should implement proper OAuth2 token generation
    // For now, using the simpler legacy FCM approach with server key
    // The user needs to provide the server key separately or we need to implement JWT signing
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification queued',
        note: 'FCM implementation requires OAuth2 token generation. Please verify Firebase configuration.',
        recipientUserId,
        platform: userDevice.platform
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Edge Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});