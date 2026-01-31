import { corsHeaders } from "../_shared/cors.ts";

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

interface JobSearchParams {
  query: string;
  location?: string;
  remote?: boolean;
  job_type?: string;
  limit?: number;
}

interface FirecrawlSearchResult {
  url: string;
  title: string;
  description: string;
  markdown?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!FIRECRAWL_API_KEY) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: JobSearchParams = await req.json();
    const { query, location, remote, job_type, limit = 20 } = body;

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: 'Search query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build search query for job boards
    let searchQuery = `${query} jobs`;
    if (location) searchQuery += ` ${location}`;
    if (remote) searchQuery += ' remote';
    if (job_type) searchQuery += ` ${job_type}`;

    console.log('Searching jobs with query:', searchQuery);

    // Use Firecrawl's search endpoint
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        limit,
        scrapeOptions: {
          formats: ['markdown'],
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firecrawl API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Firecrawl API error: ${response.status}` 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await response.json();
    console.log('Firecrawl search returned', searchData.data?.length || 0, 'results');

    // Transform Firecrawl results into job listings
    const jobs = (searchData.data || []).map((result: FirecrawlSearchResult, index: number) => {
      // Extract job info from the result
      const titleMatch = result.title || result.markdown?.split('\n')[0] || 'Job Opportunity';
      
      // Try to extract company from URL or content
      const urlParts = result.url ? new URL(result.url).hostname.replace('www.', '').split('.')[0] : '';
      const company = urlParts.charAt(0).toUpperCase() + urlParts.slice(1) || 'Company';
      
      // Try to detect if remote from content
      const isRemote = result.markdown?.toLowerCase().includes('remote') || 
                       result.description?.toLowerCase().includes('remote') ||
                       remote;

      return {
        id: `job-${Date.now()}-${index}`,
        title: titleMatch.slice(0, 100),
        company,
        location: location || (isRemote ? 'Remote' : 'Various Locations'),
        remote: isRemote,
        salary: 'Competitive', // Salary often not in search results
        description: result.description?.slice(0, 300) || 
                    result.markdown?.slice(0, 300) || 
                    'Click to view full job details.',
        matchScore: Math.floor(Math.random() * 20) + 75, // Placeholder - will implement AI matching
        postedDate: 'Recently',
        jobType: job_type || 'Full-time',
        applyUrl: result.url || '#',
      };
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: jobs,
        total: jobs.length,
        query: searchQuery,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Job search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
