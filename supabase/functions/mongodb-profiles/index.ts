import { findOne, updateOne, UserProfile } from "../_shared/mongodb.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');

    if (req.method === 'GET') {
      if (!userId) {
        throw new Error('user_id is required');
      }
      
      const profile = await findOne<UserProfile>('profiles', { user_id: userId });
      
      return new Response(
        JSON.stringify({ success: true, data: profile }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await req.json();
      const { user_id, email, full_name, avatar_url } = body;

      if (!user_id) {
        throw new Error('user_id is required');
      }

      const now = new Date().toISOString();
      const updateData: Record<string, unknown> = {
        user_id,
        updated_at: now,
      };

      if (email) updateData.email = email;
      if (full_name !== undefined) updateData.full_name = full_name;
      if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

      await updateOne(
        'profiles',
        { user_id },
        { 
          $set: updateData,
          $setOnInsert: { created_at: now }
        },
        { upsert: true }
      );

      const profile = await findOne<UserProfile>('profiles', { user_id });

      return new Response(
        JSON.stringify({ success: true, data: profile }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('MongoDB profiles error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
