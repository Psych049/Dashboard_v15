import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, X-API-Key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate API Key
    const apiKey = req.headers.get('X-API-Key')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API Key is required' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!, 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Validate API key against database
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_value', apiKey)
      .eq('is_active', true)
      .single()

    if (apiKeyError || !apiKeyData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive API Key' }), 
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get device information
    const { data: deviceData, error: deviceError } = await supabase
      .from('devices')
      .select('*')
      .eq('api_key_id', apiKeyData.id)
      .single()

    if (deviceError || !deviceData) {
      return new Response(
        JSON.stringify({ error: 'Device not found for this API key' }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return handleGet(req, supabase, deviceData, corsHeaders)
      case 'POST':
        return handlePost(req, supabase, deviceData, corsHeaders)
      case 'PUT':
        return handlePut(req, supabase, deviceData, corsHeaders)
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }), 
          { 
            status: 405, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

  } catch (error) {
    console.error('Device API Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Handle GET requests (fetch commands, device status, etc.)
async function handleGet(req: Request, supabase: any, deviceData: any, corsHeaders: any) {
  const url = new URL(req.url)
  const path = url.pathname.split('/').pop()

  switch (path) {
    case 'commands':
      // Fetch pending commands for the device
      const { data: commands, error: commandsError } = await supabase
        .from('commands')
        .select('*')
        .eq('device_id', deviceData.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(10)

      if (commandsError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch commands' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ commands: commands || [] }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    case 'status':
      // Return device status
      return new Response(
        JSON.stringify({ 
          device: deviceData,
          status: 'online',
          timestamp: new Date().toISOString()
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    default:
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint' }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
  }
}

// Handle POST requests (send sensor data, register device, etc.)
async function handlePost(req: Request, supabase: any, deviceData: any, corsHeaders: any) {
  const url = new URL(req.url)
  const path = url.pathname.split('/').pop()
  const body = await req.json()

  switch (path) {
    case 'sensor-data':
      // Insert sensor data
      const { data: sensorData, error: sensorError } = await supabase
        .from('sensor_data')
        .insert([{
          zone_id: body.zone_id || deviceData.zone_id,
          temperature: body.temperature,
          humidity: body.humidity,
          soil_moisture: body.soil_moisture,
          device_id: deviceData.id,
          timestamp: new Date().toISOString()
        }])
        .select()
        .single()

      if (sensorError) {
        return new Response(
          JSON.stringify({ error: 'Failed to save sensor data' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: sensorData,
          irrigation_needed: body.soil_moisture < 30 // Simple threshold check
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    case 'register':
      // Update device registration
      const { data: updatedDevice, error: updateError } = await supabase
        .from('devices')
        .update({
          name: body.name || deviceData.name,
          status: 'online',
          last_seen: new Date().toISOString(),
          firmware_version: body.firmware_version,
          ip_address: body.ip_address
        })
        .eq('id', deviceData.id)
        .select()
        .single()

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to update device' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          device: updatedDevice 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    default:
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint' }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
  }
}

// Handle PUT requests (update command status, device heartbeat, etc.)
async function handlePut(req: Request, supabase: any, deviceData: any, corsHeaders: any) {
  const url = new URL(req.url)
  const path = url.pathname.split('/').pop()
  const body = await req.json()

  switch (path) {
    case 'command-status':
      // Update command execution status
      const { data: updatedCommand, error: commandError } = await supabase
        .from('commands')
        .update({
          status: body.status,
          executed_at: body.status === 'executed' ? new Date().toISOString() : null,
          result: body.result
        })
        .eq('id', body.command_id)
        .eq('device_id', deviceData.id)
        .select()
        .single()

      if (commandError) {
        return new Response(
          JSON.stringify({ error: 'Failed to update command status' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          command: updatedCommand 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    case 'heartbeat':
      // Update device heartbeat
      const { data: heartbeatDevice, error: heartbeatError } = await supabase
        .from('devices')
        .update({
          status: 'online',
          last_seen: new Date().toISOString()
        })
        .eq('id', deviceData.id)
        .select()
        .single()

      if (heartbeatError) {
        return new Response(
          JSON.stringify({ error: 'Failed to update heartbeat' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          timestamp: new Date().toISOString() 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    default:
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint' }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
  }
} 