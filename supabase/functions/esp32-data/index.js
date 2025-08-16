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

    // Get request data
    let { sensor_id, temperature, humidity, soil_moisture, apiKey } = await req.json()
    
    // Validate required fields
    if (!sensor_id || temperature === undefined || humidity === undefined || soil_moisture === undefined || !apiKey) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: sensor_id, temperature, humidity, soil_moisture, apiKey' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Convert data to proper types
    temperature = parseFloat(temperature)
    humidity = parseFloat(humidity)
    soil_moisture = parseFloat(soil_moisture)
    
    // Simple API key validation - you should implement a more secure system
    const { data: apiKeyData, error: apiKeyError } = await supabaseClient
      .from('api_keys')
      .select('user_id')
      .eq('key', apiKey)
      .single()

    if (apiKeyError || !apiKeyData) {
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const user_id = apiKeyData.user_id

    // Get zone_id from sensor_id
    const { data: zone, error: zoneError } = await supabaseClient
      .from('zones')
      .select('id')
      .eq('sensor_id', sensor_id)
      .eq('user_id', user_id)
      .single()

    if (zoneError || !zone) {
      return new Response(JSON.stringify({ error: 'Zone not found for this sensor ID' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    const zone_id = zone.id

    // Insert data into sensor_data table
    const { data, error } = await supabaseClient
      .from('sensor_data')
      .insert({
        zone_id,
        temperature,
        humidity,
        soil_moisture,
        user_id
      })
      .select()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Get current zone moisture level
    const { data: zoneData } = await supabaseClient
      .from('zones')
      .select('moisture_level')
      .eq('id', zone_id)
      .single()

    // Check if irrigation is needed
    let irrigation_needed = false
    if (zoneData && soil_moisture < 30) {
      irrigation_needed = true
    }

    return new Response(JSON.stringify({ 
      message: 'Data received successfully',
      irrigation_needed,
      data 
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