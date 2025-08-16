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
    let { device_id, zone_id, sensor_type, value, unit, apiKey, battery_level, signal_strength } = await req.json()
    
    // Validate required fields
    if (!device_id || !zone_id || !sensor_type || value === undefined || !unit || !apiKey) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: device_id, zone_id, sensor_type, value, unit, apiKey' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Convert data to proper types
    value = parseFloat(value)
    battery_level = battery_level ? parseInt(battery_level) : null
    signal_strength = signal_strength ? parseInt(signal_strength) : null
    
    // API key validation using the actual schema
    const { data: apiKeyData, error: apiKeyError } = await supabaseClient
      .from('api_keys')
      .select('user_id, device_id, is_active')
      .eq('key_hash', apiKey) // This should be the hashed version
      .eq('is_active', true)
      .single()

    if (apiKeyError || !apiKeyData) {
      return new Response(JSON.stringify({ error: 'Invalid or inactive API key' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Verify the API key belongs to the device
    if (apiKeyData.device_id !== device_id) {
      return new Response(JSON.stringify({ error: 'API key not authorized for this device' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    const user_id = apiKeyData.user_id

    // Verify the zone belongs to the user
    const { data: zone, error: zoneError } = await supabaseClient
      .from('zones')
      .select('id, moisture_threshold, auto_watering')
      .eq('id', zone_id)
      .eq('user_id', user_id)
      .single()

    if (zoneError || !zone) {
      return new Response(JSON.stringify({ error: 'Zone not found or access denied' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    // Insert data into sensor_data table using the actual schema
    const { data, error } = await supabaseClient
      .from('sensor_data')
      .insert({
        device_id,
        zone_id,
        sensor_type,
        value,
        unit,
        battery_level,
        signal_strength,
        reading_timestamp: new Date().toISOString()
      })
      .select()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Update real-time cache
    const { error: cacheError } = await supabaseClient
      .from('realtime_cache')
      .upsert({
        zone_id,
        device_id,
        moisture_value: sensor_type === 'moisture' ? value : null,
        temperature_value: sensor_type === 'temperature' ? value : null,
        humidity_value: sensor_type === 'humidity' ? value : null,
        light_value: sensor_type === 'light' ? value : null,
        last_updated: new Date().toISOString(),
        data_freshness: 0
      }, {
        onConflict: 'zone_id,device_id'
      })

    if (cacheError) {
      console.warn('Cache update failed:', cacheError)
    }

    // Update device last_seen
    const { error: deviceError } = await supabaseClient
      .from('devices')
      .update({ 
        last_seen: new Date().toISOString(),
        is_online: true,
        connection_status: 'connected'
      })
      .eq('id', device_id)

    if (deviceError) {
      console.warn('Device update failed:', deviceError)
    }

    // Check if irrigation is needed based on moisture threshold
    let irrigation_needed = false
    if (sensor_type === 'moisture' && zone.moisture_threshold && value < zone.moisture_threshold) {
      irrigation_needed = true
    }

    return new Response(JSON.stringify({ 
      message: 'Data received successfully',
      irrigation_needed,
      data,
      zone_info: {
        moisture_threshold: zone.moisture_threshold,
        auto_watering: zone.auto_watering
      }
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