import { supabase } from '@/integrations/supabase/client';

// Types
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  salary: string;
  description: string;
  matchScore: number;
  postedDate: string;
  jobType: string;
  applyUrl: string;
}

export interface UserProfile {
  user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserSkill {
  user_id: string;
  skill: string;
  proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  created_at?: string;
}

export interface UserPreferences {
  user_id: string;
  preferred_locations: string[];
  salary_min?: number;
  salary_max?: number;
  job_types: string[];
  remote_preference: 'remote' | 'onsite' | 'hybrid' | 'any';
  industries: string[];
  updated_at?: string;
}

export interface SavedJob extends Job {
  saved_at?: string;
}

// Job Search API
export const jobsApi = {
  async search(params: {
    query: string;
    location?: string;
    remote?: boolean;
    jobType?: string;
    limit?: number;
  }): Promise<{ success: boolean; data?: Job[]; error?: string }> {
    const { data, error } = await supabase.functions.invoke('firecrawl-job-search', {
      body: {
        query: params.query,
        location: params.location,
        remote: params.remote,
        job_type: params.jobType,
        limit: params.limit || 20,
      },
    });

    if (error) {
      console.error('Job search error:', error);
      return { success: false, error: error.message };
    }

    return data;
  },
};

// Profile API
export const profileApi = {
  async get(userId: string): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
    const { data, error } = await supabase.functions.invoke('mongodb-profiles', {
      body: {},
      method: 'GET',
    });

    // Edge functions don't support query params in invoke, so we use POST with user_id in body
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mongodb-profiles?user_id=${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      }
    );

    const result = await response.json();
    return result;
  },

  async upsert(profile: Partial<UserProfile>): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
    const { data, error } = await supabase.functions.invoke('mongodb-profiles', {
      body: profile,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data;
  },
};

// Skills API
export const skillsApi = {
  async get(userId: string): Promise<{ success: boolean; data?: UserSkill[]; error?: string }> {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mongodb-skills?user_id=${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      }
    );

    return response.json();
  },

  async add(userId: string, skill: string, proficiency?: string): Promise<{ success: boolean; data?: UserSkill; error?: string }> {
    const { data, error } = await supabase.functions.invoke('mongodb-skills', {
      body: { user_id: userId, skill, proficiency },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data;
  },

  async remove(userId: string, skill: string): Promise<{ success: boolean; error?: string }> {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mongodb-skills`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ user_id: userId, skill }),
      }
    );

    return response.json();
  },
};

// Preferences API
export const preferencesApi = {
  async get(userId: string): Promise<{ success: boolean; data?: UserPreferences; error?: string }> {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mongodb-preferences?user_id=${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      }
    );

    return response.json();
  },

  async update(preferences: Partial<UserPreferences>): Promise<{ success: boolean; data?: UserPreferences; error?: string }> {
    const { data, error } = await supabase.functions.invoke('mongodb-preferences', {
      body: preferences,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data;
  },
};

// Saved Jobs API
export const savedJobsApi = {
  async get(userId: string): Promise<{ success: boolean; data?: SavedJob[]; error?: string }> {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mongodb-saved-jobs?user_id=${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      }
    );

    return response.json();
  },

  async save(userId: string, job: Job): Promise<{ success: boolean; data?: SavedJob; error?: string }> {
    const { data, error } = await supabase.functions.invoke('mongodb-saved-jobs', {
      body: {
        user_id: userId,
        job_id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        description: job.description,
        apply_url: job.applyUrl,
        remote: job.remote,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data;
  },

  async unsave(userId: string, jobId: string): Promise<{ success: boolean; error?: string }> {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mongodb-saved-jobs`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ user_id: userId, job_id: jobId }),
      }
    );

    return response.json();
  },
};
