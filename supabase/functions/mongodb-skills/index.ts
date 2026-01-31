import { findOne, find, insertOne, deleteOne, UserSkill } from "../_shared/mongodb.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
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
      
      const skills = await find<UserSkill>('skills', { user_id: userId });
      
      return new Response(
        JSON.stringify({ success: true, data: skills }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { user_id, skill, proficiency } = body;

      if (!user_id || !skill) {
        throw new Error('user_id and skill are required');
      }

      // Check if skill already exists
      const existing = await findOne<UserSkill>('skills', { user_id, skill });
      if (existing) {
        return new Response(
          JSON.stringify({ success: true, data: existing, message: 'Skill already exists' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const newSkill: UserSkill = {
        user_id,
        skill,
        proficiency: proficiency || 'intermediate',
        created_at: new Date(),
      };

      await insertOne('skills', newSkill);

      return new Response(
        JSON.stringify({ success: true, data: newSkill }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'DELETE') {
      const body = await req.json();
      const { user_id, skill } = body;

      if (!user_id || !skill) {
        throw new Error('user_id and skill are required');
      }

      await deleteOne('skills', { user_id, skill });

      return new Response(
        JSON.stringify({ success: true, message: 'Skill deleted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('MongoDB skills error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
