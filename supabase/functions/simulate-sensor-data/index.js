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
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Create client with Auth context of the user that called the function.
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the user from the auth header
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Get zones for the authenticated user
    const { data: zones, error: zonesError } = await supabaseClient
      .from('zones')
      .select('id, name, sensor_id')
      .eq('user_id', user.id)

    if (zonesError) {
      return new Response(JSON.stringify({ error: zonesError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    if (!zones || zones.length === 0) {
      return new Response(JSON.stringify({ error: 'No zones found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    // Generate random sensor data for each zone
    const sensorData = zones.map(zone => ({
      zone_id: zone.id,
      temperature: parseFloat((15 + Math.random() * 15).toFixed(1)), // 15-30°C
      humidity: parseFloat((40 + Math.random() * 40).toFixed(1)),    // 40-80%
      soil_moisture: parseFloat((20 + Math.random() * 40).toFixed(1)), // 20-60%
      user_id: user.id
    }))

    // Insert the data into the sensor_data table
    const { data, error } = await supabaseClient
      .from('sensor_data')
      .insert(sensorData)
      .select()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    return new Response(JSON.stringify({ 
      message: 'Sensor data simulated successfully',
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