const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper for authenticated requests - now accepts token as parameter
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}, token?: string) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
};

// Types
export interface JobHighlights {
  Qualifications?: string[];
  Responsibilities?: string[];
  Benefits?: string[];
}

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
  experienceLevel?: string;
  applyUrl: string;
  skills?: string[];
  requiredSkills?: string[];
  highlights?: JobHighlights;
  companyLogo?: string;
  fullDescription?: string;
}

export interface UserProfile {
  user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  mobile?: string;
  location?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  dob?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserSkill {
  user_id?: string;
  skill: string;
  proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  created_at?: string;
}

export interface UserPreferences {
  user_id?: string;
  preferred_roles?: string[];
  preferred_locations: string[];
  experience_level?: 'fresher' | '1-3' | '3-5' | '5-10' | '10+';
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

export interface Education {
  _id?: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  grade?: string;
  description?: string;
}

export interface Experience {
  _id?: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  description?: string;
}

export interface Project {
  _id?: string;
  title: string;
  description: string;
  technologies: string[];
  url?: string;
  startDate: string;
  endDate: string;
}

// Generic CRUD for profile sections (education, experience, projects)
export const sectionApi = {
  async get(section: string, token?: string) {
    return fetchWithAuth(`/profile/${section}`, { method: 'GET' }, token);
  },
  async add(section: string, item: any, token?: string) {
    return fetchWithAuth(`/profile/${section}`, {
      method: 'POST',
      body: JSON.stringify(item),
    }, token);
  },
  async update(section: string, itemId: string, updates: any, token?: string) {
    return fetchWithAuth(`/profile/${section}/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }, token);
  },
  async remove(section: string, itemId: string, token?: string) {
    return fetchWithAuth(`/profile/${section}/${itemId}`, {
      method: 'DELETE',
    }, token);
  },
};

// Job Search API - Uses JSearch backend
export const jobsApi = {
  async search(params: {
    query: string;
    location?: string;
    remote?: boolean;
    jobType?: string;
    experience?: string;
    limit?: number;
    page?: number;
  }, token?: string): Promise<{ success: boolean; data?: Job[]; error?: string; hasMore?: boolean }> {
    try {
      const queryParams = new URLSearchParams({
        query: params.query,
        ...(params.location && { location: params.location }),
        ...(params.remote !== undefined && { remote: String(params.remote) }),
        ...(params.jobType && { jobType: params.jobType }),
        ...(params.experience && { experience: params.experience }),
        ...(params.limit && { limit: String(params.limit) }),
        ...(params.page && { page: String(params.page) }),
      });

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/jobs/search?${queryParams}`, { headers });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      return response.json();
    } catch (error: any) {
      console.error('Job search error:', error);
      return { success: false, error: error.message };
    }
  },

  async scrapeJobDetails(url: string): Promise<{ success: boolean; data?: Job; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/jobs/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      return response.json();
    } catch (error: any) {
      console.error('Job scrape error:', error);
      return { success: false, error: error.message };
    }
  },

  async crawlJobBoard(url: string, limit: number = 10): Promise<{ success: boolean; data?: Job[]; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/jobs/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, limit }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      return response.json();
    } catch (error: any) {
      console.error('Job crawl error:', error);
      return { success: false, error: error.message };
    }
  },
};

// Profile API - token is now passed explicitly
export const profileApi = {
  async get(userId: string, token?: string): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
    try {
      const response = await fetchWithAuth('/profile', {}, token);
      return response;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async upsert(profile: Partial<UserProfile>, token?: string): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
    try {
      const response = await fetchWithAuth('/profile', {
        method: 'POST',
        body: JSON.stringify(profile),
      }, token);
      return response;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

// Skills API
export const skillsApi = {
  async get(userId: string, token?: string): Promise<{ success: boolean; data?: UserSkill[]; error?: string }> {
    try {
      return await fetchWithAuth('/profile/skills', {}, token);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async add(userId: string, skill: string, proficiency?: string, token?: string): Promise<{ success: boolean; data?: UserSkill; error?: string }> {
    try {
      return await fetchWithAuth('/profile/skills', {
        method: 'POST',
        body: JSON.stringify({ skill, proficiency }),
      }, token);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async remove(userId: string, skill: string, token?: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await fetchWithAuth('/profile/skills', {
        method: 'DELETE',
        body: JSON.stringify({ skill }),
      }, token);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

// Preferences API
export const preferencesApi = {
  async get(userId: string, token?: string): Promise<{ success: boolean; data?: UserPreferences; error?: string }> {
    try {
      return await fetchWithAuth('/profile/preferences', {}, token);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async update(preferences: Partial<UserPreferences>, token?: string): Promise<{ success: boolean; data?: UserPreferences; error?: string }> {
    try {
      return await fetchWithAuth('/profile/preferences', {
        method: 'POST',
        body: JSON.stringify(preferences),
      }, token);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

// Saved Jobs API
export const savedJobsApi = {
  async get(userId: string, token?: string): Promise<{ success: boolean; data?: SavedJob[]; error?: string }> {
    try {
      return await fetchWithAuth('/profile/saved-jobs', {}, token);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async save(userId: string, job: Job, token?: string): Promise<{ success: boolean; data?: SavedJob; error?: string }> {
    try {
      return await fetchWithAuth('/profile/saved-jobs', {
        method: 'POST',
        body: JSON.stringify({
          job_id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          description: job.description,
          apply_url: job.applyUrl,
          remote: job.remote,
          matchScore: job.matchScore,
          skills: job.skills,
          company_logo: job.companyLogo,
        }),
      }, token);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async unsave(userId: string, jobId: string, token?: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await fetchWithAuth('/profile/saved-jobs', {
        method: 'DELETE',
        body: JSON.stringify({ job_id: jobId }),
      }, token);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

// Applied Jobs
export interface AppliedJob extends Job {
  job_id?: string;
  status: 'Applied' | 'Not Applied' | 'Interview' | 'Offer Received' | 'Rejected';
  applied_at?: string;
  company_logo?: string;
}

export const appliedJobsApi = {
  async get(userId: string, token?: string): Promise<{ success: boolean; data?: AppliedJob[]; error?: string }> {
    try {
      return await fetchWithAuth('/profile/applied-jobs', {}, token);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async apply(userId: string, job: Job, token?: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await fetchWithAuth('/profile/applied-jobs', {
        method: 'POST',
        body: JSON.stringify({
          job_id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          description: job.description,
          apply_url: job.applyUrl,
          remote: job.remote,
          company_logo: job.companyLogo,
        }),
      }, token);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async updateStatus(userId: string, jobId: string, status: string, token?: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await fetchWithAuth(`/profile/applied-jobs/${jobId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }, token);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async remove(userId: string, jobId: string, token?: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await fetchWithAuth('/profile/applied-jobs', {
        method: 'DELETE',
        body: JSON.stringify({ job_id: jobId }),
      }, token);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
