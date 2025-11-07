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

// Helper function to convert base64url to base64
function base64urlToBase64(base64url: string): string {
  return base64url.replace(/-/g, '+').replace(/_/g, '/');
}

// Helper function to convert base64 to base64url
function base64ToBase64url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Generate JWT for Google OAuth2
async function generateJWT(serviceAccount: any): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64ToBase64url(btoa(JSON.stringify(header)));
  const encodedPayload = base64ToBase64url(btoa(JSON.stringify(payload)));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Import private key
  const privateKeyPem = serviceAccount.private_key;
  const pemContents = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Sign the token
  const encoder = new TextEncoder();
  const data = encoder.encode(unsignedToken);
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    data
  );

  const base64Signature = base64ToBase64url(
    btoa(String.fromCharCode(...new Uint8Array(signature)))
  );

  return `${unsignedToken}.${base64Signature}`;
}

// Get OAuth2 access token from Google
async function getAccessToken(serviceAccount: any): Promise<string> {
  const jwt = await generateJWT(serviceAccount);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
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
    const projectId = firebaseConfig.project_id;
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

    console.log('Using FCM token from DB for user', recipientUserId, ':', userDevice.fcm_token); // <-- LOG AGGIUNTO QUI
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
          priority: 'high' as const,
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

    // Get OAuth2 access token
    console.log('🔑 Getting OAuth2 access token...');
    const accessToken = await getAccessToken(firebaseConfig);
    console.log('✅ Access token obtained');

    // Send notification using FCM HTTP v1 API
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    console.log('📤 Sending FCM notification...');

    const fcmResponse = await fetch(fcmUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fcmMessage),
    });

    if (!fcmResponse.ok) {
      const errorText = await fcmResponse.text();
      console.error('❌ FCM API error:', errorText);
      return new Response(
        JSON.stringify({
          error: 'Failed to send FCM notification',
          details: errorText,
          status: fcmResponse.status
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fcmResult = await fcmResponse.json();
    console.log('✅ FCM notification sent successfully:', fcmResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification sent successfully',
        fcmMessageId: fcmResult.name,
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
