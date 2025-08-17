// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // This is needed for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get request data - updated to match actual schema
    let { device_id, zone_id, sensor_type, value, unit, apiKey, api_key, battery_level, signal_strength } = await req.json()
    
    // Support both apiKey and api_key
    const providedApiKey = apiKey || api_key
    
    // Validate required fields
    if (!device_id || !zone_id || !sensor_type || value === undefined || !unit || !providedApiKey) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: device_id, zone_id, sensor_type, value, unit, apiKey' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Coerce types
    value = parseFloat(value)
    battery_level = battery_level ? parseInt(battery_level) : null
    signal_strength = signal_strength ? parseInt(signal_strength) : null

    // Delegate to SQL function which handles API key validation, cache update and notifications
    const { data: insertedId, error: insertError } = await supabaseClient
      .rpc('insert_sensor_data', {
        p_device_id: device_id,
        p_zone_id: zone_id,
        p_sensor_type: sensor_type,
        p_value: value,
        p_unit: unit,
        p_battery_level: battery_level,
        p_signal_strength: signal_strength,
        p_api_key: providedApiKey
      })

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    return new Response(JSON.stringify({ 
      message: 'Data received successfully',
      id: insertedId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})