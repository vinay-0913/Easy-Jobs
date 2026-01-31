import { findOne, find, insertOne, deleteOne, SavedJob } from "../_shared/mongodb.ts";
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
      
      const savedJobs = await find<SavedJob>(
        'saved_jobs', 
        { user_id: userId },
        { sort: { saved_at: -1 } }
      );
      
      return new Response(
        JSON.stringify({ success: true, data: savedJobs }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { 
        user_id, 
        job_id, 
        title, 
        company, 
        location, 
        salary, 
        description, 
        apply_url, 
        remote 
      } = body;

      if (!user_id || !job_id) {
        throw new Error('user_id and job_id are required');
      }

      // Check if already saved
      const existing = await findOne<SavedJob>('saved_jobs', { user_id, job_id });
      if (existing) {
        return new Response(
          JSON.stringify({ success: true, data: existing, message: 'Job already saved' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const savedJob: SavedJob = {
        user_id,
        job_id,
        title,
        company,
        location,
        salary,
        description,
        apply_url,
        remote: remote || false,
        saved_at: new Date(),
      };

      await insertOne('saved_jobs', savedJob);

      return new Response(
        JSON.stringify({ success: true, data: savedJob }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'DELETE') {
      const body = await req.json();
      const { user_id, job_id } = body;

      if (!user_id || !job_id) {
        throw new Error('user_id and job_id are required');
      }

      await deleteOne('saved_jobs', { user_id, job_id });

      return new Response(
        JSON.stringify({ success: true, message: 'Job unsaved' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('MongoDB saved-jobs error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
