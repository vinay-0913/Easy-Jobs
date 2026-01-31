import { findOne, updateOne, UserPreferences } from "../_shared/mongodb.ts";
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
      
      const preferences = await findOne<UserPreferences>('preferences', { user_id: userId });
      
      // Return default preferences if none exist
      const defaultPrefs: Partial<UserPreferences> = {
        preferred_locations: [],
        job_types: [],
        remote_preference: 'any',
        industries: [],
      };
      
      return new Response(
        JSON.stringify({ success: true, data: preferences || defaultPrefs }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await req.json();
      const { 
        user_id, 
        preferred_locations, 
        salary_min, 
        salary_max, 
        job_types, 
        remote_preference, 
        industries 
      } = body;

      if (!user_id) {
        throw new Error('user_id is required');
      }

      const updateData: Record<string, unknown> = {
        user_id,
        updated_at: new Date().toISOString(),
      };

      if (preferred_locations !== undefined) updateData.preferred_locations = preferred_locations;
      if (salary_min !== undefined) updateData.salary_min = salary_min;
      if (salary_max !== undefined) updateData.salary_max = salary_max;
      if (job_types !== undefined) updateData.job_types = job_types;
      if (remote_preference !== undefined) updateData.remote_preference = remote_preference;
      if (industries !== undefined) updateData.industries = industries;

      await updateOne(
        'preferences',
        { user_id },
        { $set: updateData },
        { upsert: true }
      );

      const preferences = await findOne<UserPreferences>('preferences', { user_id });

      return new Response(
        JSON.stringify({ success: true, data: preferences }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('MongoDB preferences error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
