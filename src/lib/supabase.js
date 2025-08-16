import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
}

// Create Supabase client with enhanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'farmflow-dashboard/1.0.0'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Create a fresh client instance to clear cache
export const createFreshClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js/2.x'
      }
    }
  });
};

// Authentication functions
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user, error };
};

// Refresh schema cache - useful for resolving column not found errors
export const refreshSchemaCache = async () => {
  try {
    // Create a fresh client to clear cache
    const freshClient = createFreshClient();
    
    // Try a simple query to refresh the schema cache
    const { data, error } = await freshClient
      .from('api_keys')
      .select('id')
      .limit(1);
    
    if (error) {
      console.warn('Schema cache refresh warning:', error);
      return { success: false, error };
    } else {
      console.log('Schema cache refreshed successfully');
      return { success: true, error: null };
    }
  } catch (err) {
    console.error('Error refreshing schema cache:', err);
    return { success: false, error: err };
  }
};

// Force schema refresh by testing the table structure
export const forceSchemaRefresh = async () => {
  try {
    const freshClient = createFreshClient();
    
    // Test the exact query that's failing
    const { data, error } = await freshClient
      .from('api_keys')
      .select('id, name, key, created_at')
      .limit(1);
    
    if (error) {
      console.error('Schema test failed:', error);
      return { success: false, error };
    }
    
    console.log('Schema test successful:', data);
    return { success: true, error: null };
  } catch (err) {
    console.error('Force schema refresh error:', err);
    return { success: false, error: err };
  }
};

// Initialize database schema
export const initializeDatabase = async () => {
  // Create sensor_data table
  await supabase.rpc('init_sensor_data_table');
  
  // Create soil_types table
  await supabase.rpc('init_soil_types_table');
  
  // Create alerts table
  await supabase.rpc('init_alerts_table');
  
  // Create zones table
  await supabase.rpc('init_zones_table');
};