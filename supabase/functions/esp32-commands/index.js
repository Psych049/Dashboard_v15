// ESP32 Commands Edge Function
// Handles sending commands to ESP32 devices for pump control and watering operations

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    // Get the user from the auth header
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const { method } = req

    if (method === 'POST') {
      // Send command to ESP32
      const { device_id, command_type, parameters } = await req.json()
      
      if (!device_id || !command_type) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: device_id, command_type' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      // Validate device belongs to user
      const { data: device, error: deviceError } = await supabaseClient
        .from('devices')
        .select('id, name, status')
        .eq('id', device_id)
        .eq('user_id', user.id)
        .single()

      if (deviceError || !device) {
        return new Response(JSON.stringify({ error: 'Device not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        })
      }

      // Insert command into database
      const { data: command, error: commandError } = await supabaseClient
        .from('commands')
        .insert({
          device_id,
          command_type,
          parameters: parameters || {},
          user_id: user.id
        })
        .select()
        .single()

      if (commandError) {
        return new Response(JSON.stringify({ error: commandError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      return new Response(JSON.stringify({ 
        message: 'Command sent successfully',
        command 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

    } else if (method === 'GET') {
      // Get pending commands for ESP32
      const url = new URL(req.url)
      const device_id = url.searchParams.get('device_id')
      const apiKey = url.searchParams.get('apiKey')

      if (!device_id || !apiKey) {
        return new Response(JSON.stringify({ 
          error: 'Missing required parameters: device_id, apiKey' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      // Validate API key
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

      // Get pending commands for the device
      const { data: commands, error: commandsError } = await supabaseClient
        .from('commands')
        .select('*')
        .eq('device_id', device_id)
        .eq('status', 'pending')
        .eq('user_id', apiKeyData.user_id)
        .order('created_at', { ascending: true })

      if (commandsError) {
        return new Response(JSON.stringify({ error: commandsError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      return new Response(JSON.stringify({ 
        commands: commands || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

    } else if (method === 'PUT') {
      // Update command status (for ESP32 to report execution)
      const { command_id, status, apiKey } = await req.json()
      
      if (!command_id || !status || !apiKey) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: command_id, status, apiKey' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      // Validate API key
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

      // Update command status
      const { data: command, error: commandError } = await supabaseClient
        .from('commands')
        .update({ 
          status,
          executed_at: status === 'executed' ? new Date().toISOString() : null
        })
        .eq('id', command_id)
        .eq('user_id', apiKeyData.user_id)
        .select()
        .single()

      if (commandError) {
        return new Response(JSON.stringify({ error: commandError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      return new Response(JSON.stringify({ 
        message: 'Command status updated successfully',
        command 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

    } else {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      })
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 