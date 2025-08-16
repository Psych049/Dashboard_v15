// Device Management Edge Function
// Handles ESP32 device registration, updates, and status management

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

    const { method } = req

    if (method === 'POST') {
      // Register new device or update device status
      const { 
        device_id, 
        name, 
        device_type = 'esp32', 
        ip_address, 
        mac_address, 
        firmware_version,
        apiKey 
      } = await req.json()
      
      if (!device_id || !name || !apiKey) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: device_id, name, apiKey' 
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

      // Check if device already exists
      const { data: existingDevice, error: existingError } = await supabaseClient
        .from('devices')
        .select('*')
        .eq('device_id', device_id)
        .eq('user_id', apiKeyData.user_id)
        .single()

      if (existingDevice) {
        // Update existing device
        const { data: device, error: updateError } = await supabaseClient
          .from('devices')
          .update({
            name,
            status: 'online',
            last_seen: new Date().toISOString(),
            ip_address,
            mac_address,
            firmware_version
          })
          .eq('id', existingDevice.id)
          .select()
          .single()

        if (updateError) {
          return new Response(JSON.stringify({ error: updateError.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          })
        }

        return new Response(JSON.stringify({ 
          message: 'Device updated successfully',
          device 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      } else {
        // Register new device
        const { data: device, error: insertError } = await supabaseClient
          .from('devices')
          .insert({
            device_id,
            name,
            device_type,
            status: 'online',
            ip_address,
            mac_address,
            firmware_version,
            user_id: apiKeyData.user_id
          })
          .select()
          .single()

        if (insertError) {
          return new Response(JSON.stringify({ error: insertError.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          })
        }

        return new Response(JSON.stringify({ 
          message: 'Device registered successfully',
          device 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        })
      }

    } else if (method === 'GET') {
      // Get user's devices (requires authentication)
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
      
      if (userError) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        })
      }

      const { data: devices, error: devicesError } = await supabaseClient
        .from('devices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (devicesError) {
        return new Response(JSON.stringify({ error: devicesError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      return new Response(JSON.stringify({ 
        devices: devices || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

    } else if (method === 'PUT') {
      // Update device status (heartbeat from ESP32)
      const { device_id, status = 'online', apiKey } = await req.json()
      
      if (!device_id || !apiKey) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: device_id, apiKey' 
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

      // Update device status
      const { data: device, error: updateError } = await supabaseClient
        .from('devices')
        .update({
          status,
          last_seen: new Date().toISOString()
        })
        .eq('device_id', device_id)
        .eq('user_id', apiKeyData.user_id)
        .select()
        .single()

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      return new Response(JSON.stringify({ 
        message: 'Device status updated successfully',
        device 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

    } else if (method === 'DELETE') {
      // Delete device (requires authentication)
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
      
      if (userError) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        })
      }

      const { device_id } = await req.json()
      
      if (!device_id) {
        return new Response(JSON.stringify({ error: 'Missing device_id' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      // Delete device
      const { error: deleteError } = await supabaseClient
        .from('devices')
        .delete()
        .eq('id', device_id)
        .eq('user_id', user.id)

      if (deleteError) {
        return new Response(JSON.stringify({ error: deleteError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      return new Response(JSON.stringify({ 
        message: 'Device deleted successfully'
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