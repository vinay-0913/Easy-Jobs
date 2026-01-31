// MongoDB Atlas Data API helper
// Uses REST API instead of native driver for Deno compatibility

const MONGODB_URI = Deno.env.get('MONGODB_URI') || '';

// Parse connection string to extract cluster info
function parseConnectionString(): { 
  clusterUrl: string; 
  database: string;
  username: string;
  password: string;
} {
  // Format: mongodb+srv://username:password@cluster.xxx.mongodb.net/database
  const match = MONGODB_URI.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]*)/);
  
  if (!match) {
    throw new Error('Invalid MongoDB URI format');
  }
  
  return {
    username: match[1],
    password: match[2],
    clusterUrl: match[3],
    database: match[4] || 'simplify_jobs',
  };
}

// MongoDB Data API endpoint helper
async function mongoDataApi(action: string, body: Record<string, unknown>) {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  const { clusterUrl, database } = parseConnectionString();
  
  // Extract cluster name from URL (e.g., cluster0.qd8yeuf.mongodb.net -> cluster0)
  const clusterName = clusterUrl.split('.')[0];
  
  // MongoDB Data API URL format
  const dataApiUrl = `https://data.mongodb-api.com/app/data-${clusterName}/endpoint/data/v1/action/${action}`;
  
  const response = await fetch(dataApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': Deno.env.get('MONGODB_API_KEY') || '',
    },
    body: JSON.stringify({
      dataSource: 'Cluster0',
      database,
      ...body,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`MongoDB API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Simple in-memory store for edge function use
// Each edge function instance will have its own store
const memoryStore: Map<string, unknown[]> = new Map();

function getCollection<T>(name: string): T[] {
  if (!memoryStore.has(name)) {
    memoryStore.set(name, []);
  }
  return memoryStore.get(name) as T[];
}

// For now, we'll use a simpler approach - store data in Supabase instead
// but provide a MongoDB-like interface

export async function findOne<T>(collection: string, filter: Record<string, unknown>): Promise<T | null> {
  try {
    const result = await mongoDataApi('findOne', { collection, filter });
    return result.document as T | null;
  } catch {
    // Fallback: return null if Data API isn't set up
    console.log('MongoDB Data API not available, using fallback');
    return null;
  }
}

export async function find<T>(collection: string, filter: Record<string, unknown>, options?: { sort?: Record<string, number>; limit?: number }): Promise<T[]> {
  try {
    const result = await mongoDataApi('find', { 
      collection, 
      filter,
      sort: options?.sort,
      limit: options?.limit,
    });
    return (result.documents || []) as T[];
  } catch {
    console.log('MongoDB Data API not available, using fallback');
    return [];
  }
}

export async function insertOne<T>(collection: string, document: T): Promise<{ insertedId: string }> {
  try {
    const result = await mongoDataApi('insertOne', { collection, document });
    return { insertedId: result.insertedId };
  } catch (error) {
    console.log('MongoDB Data API not available:', error);
    throw error;
  }
}

export async function updateOne(
  collection: string, 
  filter: Record<string, unknown>, 
  update: Record<string, unknown>,
  options?: { upsert?: boolean }
): Promise<{ matchedCount: number; modifiedCount: number; upsertedId?: string }> {
  try {
    const result = await mongoDataApi('updateOne', { 
      collection, 
      filter, 
      update,
      upsert: options?.upsert,
    });
    return result;
  } catch (error) {
    console.log('MongoDB Data API not available:', error);
    throw error;
  }
}

export async function deleteOne(collection: string, filter: Record<string, unknown>): Promise<{ deletedCount: number }> {
  try {
    const result = await mongoDataApi('deleteOne', { collection, filter });
    return result;
  } catch (error) {
    console.log('MongoDB Data API not available:', error);
    throw error;
  }
}

export type UserProfile = {
  user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
};

export type UserSkill = {
  user_id: string;
  skill: string;
  proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  created_at: Date;
};

export type UserPreferences = {
  user_id: string;
  preferred_locations: string[];
  salary_min?: number;
  salary_max?: number;
  job_types: string[];
  remote_preference: 'remote' | 'onsite' | 'hybrid' | 'any';
  industries: string[];
  updated_at: Date;
};

export type SavedJob = {
  user_id: string;
  job_id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  apply_url: string;
  remote: boolean;
  saved_at: Date;
};

export type Resume = {
  user_id: string;
  file_name: string;
  file_url: string;
  parsed_content?: {
    skills: string[];
    experience: Array<{
      title: string;
      company: string;
      duration: string;
      description: string;
    }>;
    education: Array<{
      degree: string;
      institution: string;
      year: string;
    }>;
    summary?: string;
  };
  uploaded_at: Date;
  parsed_at?: Date;
};
