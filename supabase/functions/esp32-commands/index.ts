// Enhanced ESP32 Commands Edge Function
// Handles advanced command processing, queuing, and execution tracking

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Command types and their validation schemas
const COMMAND_SCHEMAS = {
  'PUMP_ON': {
    required: [],
    optional: ['duration'],
    description: 'Turn water pump on',
    defaultDuration: 5000
  },
  'PUMP_OFF': {
    required: [],
    optional: [],
    description: 'Turn water pump off immediately'
  },
  'PUMP_DURATION': {
    required: ['duration'],
    optional: ['intensity'],
    description: 'Run pump for specified duration in milliseconds',
    validation: {
      duration: { min: 1000, max: 300000 } // 1 second to 5 minutes
    }
  },
  'CALIBRATE_SENSOR': {
    required: ['sensor_type', 'min_value', 'max_value'],
    optional: ['unit'],
    description: 'Calibrate sensor with new min/max values',
    validation: {
      sensor_type: ['moisture', 'temperature', 'humidity', 'light'],
      min_value: { type: 'number' },
      max_value: { type: 'number' }
    }
  },
  'UPDATE_FIRMWARE': {
    required: ['version'],
    optional: ['url', 'checksum'],
    description: 'Prepare for firmware update',
    validation: {
      version: { type: 'string', pattern: /^v\d+\.\d+\.\d+$/ }
    }
  },
  'SYSTEM_REBOOT': {
    required: [],
    optional: ['delay'],
    description: 'Reboot ESP32 system',
    validation: {
      delay: { min: 0, max: 60000 } // 0 to 60 seconds
    }
  },
  'GET_STATUS': {
    required: [],
    optional: ['include_sensors', 'include_network'],
    description: 'Get comprehensive device status'
  }
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
      // Send command to ESP32
      return await handleCommandSend(req, supabaseClient)
    } else if (method === 'GET') {
      // Get pending commands for ESP32
      return await handleCommandRetrieval(req, supabaseClient)
    } else if (method === 'PUT') {
      // Update command status (for ESP32 to report execution)
      return await handleCommandStatusUpdate(req, supabaseClient)
    } else if (method === 'DELETE') {
      // Cancel pending command
      return await handleCommandCancellation(req, supabaseClient)
    } else {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      })
    }

  } catch (error) {
    console.error('ESP32 Commands Error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

// Handle sending new commands
async function handleCommandSend(req, supabaseClient) {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
  
  if (userError) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    })
  }

  const { device_id, command_type, parameters = {}, priority = 'normal', scheduled_for = null } = await req.json()
  
  if (!device_id || !command_type) {
    return new Response(JSON.stringify({ 
      error: 'Missing required fields: device_id, command_type' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  // Validate command type
  if (!COMMAND_SCHEMAS[command_type]) {
    return new Response(JSON.stringify({ 
      error: `Invalid command type: ${command_type}`,
      available_commands: Object.keys(COMMAND_SCHEMAS)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  // Validate command parameters
  const validationResult = validateCommand(command_type, parameters)
  if (!validationResult.valid) {
    return new Response(JSON.stringify({ 
      error: 'Command validation failed',
      details: validationResult.errors
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  // Verify device belongs to user
  const { data: device, error: deviceError } = await supabaseClient
    .from('devices')
    .select('id, name, status, last_seen')
    .eq('id', device_id)
    .eq('user_id', user.id)
    .single()

  if (deviceError || !device) {
    return new Response(JSON.stringify({ error: 'Device not found or access denied' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    })
  }

  // Check if device is online (optional - allow offline queuing)
  const isDeviceOnline = device.status === 'online' && 
    device.last_seen && 
    (new Date().getTime() - new Date(device.last_seen).getTime()) < 300000 // 5 minutes

  // Insert command into database with enhanced metadata
  const commandData = {
    device_id,
    command_type,
    parameters: parameters || {},
    priority: ['low', 'normal', 'high', 'urgent'].includes(priority) ? priority : 'normal',
    scheduled_for: scheduled_for ? new Date(scheduled_for).toISOString() : null,
    user_id: user.id,
    status: 'pending',
    created_at: new Date().toISOString(),
    device_online: isDeviceOnline,
    estimated_execution_time: estimateExecutionTime(command_type, parameters)
  }

  const { data: command, error: commandError } = await supabaseClient
    .from('commands')
    .insert(commandData)
    .select()
    .single()

  if (commandError) {
    return new Response(JSON.stringify({ error: commandError.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  // Log command creation
  await supabaseClient
    .from('command_logs')
    .insert({
      command_id: command.id,
      action: 'created',
      user_id: user.id,
      details: `Command ${command_type} created for device ${device.name}`,
      timestamp: new Date().toISOString()
    })

  return new Response(JSON.stringify({ 
    message: 'Command sent successfully',
    command,
    device_status: {
      online: isDeviceOnline,
      last_seen: device.last_seen,
      estimated_delivery: isDeviceOnline ? 'immediate' : 'when_online'
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}

// Handle command retrieval by ESP32
async function handleCommandRetrieval(req, supabaseClient) {
  const url = new URL(req.url)
  const device_id = url.searchParams.get('device_id')
  const apiKey = url.searchParams.get('apiKey')
  const limit = parseInt(url.searchParams.get('limit') || '10')
  const priority = url.searchParams.get('priority') || 'all'

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
    .select('user_id, device_id, is_active')
    .eq('key_hash', apiKey)
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

  // Build query for pending commands
  let query = supabaseClient
    .from('commands')
    .select('*')
    .eq('device_id', device_id)
    .eq('status', 'pending')
    .eq('user_id', apiKeyData.user_id)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit)

  // Filter by priority if specified
  if (priority !== 'all') {
    query = query.eq('priority', priority)
  }

  const { data: commands, error: commandsError } = await query

  if (commandsError) {
    return new Response(JSON.stringify({ error: commandsError.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  // Mark commands as 'in_progress' when retrieved
  if (commands && commands.length > 0) {
    const commandIds = commands.map(cmd => cmd.id)
    await supabaseClient
      .from('commands')
      .update({ 
        status: 'in_progress',
        retrieved_at: new Date().toISOString()
      })
      .in('id', commandIds)

    // Log command retrieval
    for (const command of commands) {
      await supabaseClient
        .from('command_logs')
        .insert({
          command_id: command.id,
          action: 'retrieved',
          user_id: apiKeyData.user_id,
          details: `Command ${command.command_type} retrieved by device`,
          timestamp: new Date().toISOString()
        })
    }
  }

  return new Response(JSON.stringify({ 
    commands: commands || [],
    total_pending: commands ? commands.length : 0,
    retrieved_at: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}

// Handle command status updates from ESP32
async function handleCommandStatusUpdate(req, supabaseClient) {
  const { command_id, status, apiKey, execution_details, error_message } = await req.json()
  
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
    .eq('key_hash', apiKey)
    .single()

  if (apiKeyError || !apiKeyData) {
    return new Response(JSON.stringify({ error: 'Invalid API key' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    })
  }

  // Validate status
  const validStatuses = ['pending', 'in_progress', 'executed', 'failed', 'cancelled', 'timeout']
  if (!validStatuses.includes(status)) {
    return new Response(JSON.stringify({ 
      error: `Invalid status: ${status}`,
      valid_statuses: validStatuses
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  // Update command status
  const updateData = { 
    status,
    executed_at: status === 'executed' ? new Date().toISOString() : null,
    completed_at: ['executed', 'failed', 'cancelled', 'timeout'].includes(status) ? new Date().toISOString() : null
  }

  // Add execution details if provided
  if (execution_details) {
    updateData.execution_details = execution_details
  }

  if (error_message) {
    updateData.error_message = error_message
  }

  const { data: command, error: commandError } = await supabaseClient
    .from('commands')
    .update(updateData)
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

  // Log status update
  await supabaseClient
    .from('command_logs')
    .insert({
      command_id: command_id,
      action: `status_${status}`,
      user_id: apiKeyData.user_id,
      details: `Command status updated to ${status}`,
      timestamp: new Date().toISOString()
    })

  return new Response(JSON.stringify({ 
    message: 'Command status updated successfully',
    command,
    updated_at: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}

// Handle command cancellation
async function handleCommandCancellation(req, supabaseClient) {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
  
  if (userError) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    })
  }

  const { command_id } = await req.json()
  
  if (!command_id) {
    return new Response(JSON.stringify({ error: 'Missing command_id' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  // Update command status to cancelled
  const { data: command, error: commandError } = await supabaseClient
    .from('commands')
    .update({ 
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id
    })
    .eq('id', command_id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (commandError) {
    return new Response(JSON.stringify({ error: commandError.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  // Log cancellation
  await supabaseClient
    .from('command_logs')
    .insert({
      command_id: command_id,
      action: 'cancelled',
      user_id: user.id,
      details: `Command cancelled by user`,
      timestamp: new Date().toISOString()
    })

  return new Response(JSON.stringify({ 
    message: 'Command cancelled successfully',
    command
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}

// Validate command parameters against schema
function validateCommand(commandType, parameters) {
  const schema = COMMAND_SCHEMAS[commandType]
  if (!schema) {
    return { valid: false, errors: [`Unknown command type: ${commandType}`] }
  }

  const errors = []

  // Check required parameters
  for (const required of schema.required) {
    if (!(required in parameters)) {
      errors.push(`Missing required parameter: ${required}`)
    }
  }

  // Validate parameter values
  if (schema.validation) {
    for (const [param, rules] of Object.entries(schema.validation)) {
      if (parameters[param] !== undefined) {
        if (rules.type === 'number' && typeof parameters[param] !== 'number') {
          errors.push(`Parameter ${param} must be a number`)
        }
        if (rules.min !== undefined && parameters[param] < rules.min) {
          errors.push(`Parameter ${param} must be at least ${rules.min}`)
        }
        if (rules.max !== undefined && parameters[param] > rules.max) {
          errors.push(`Parameter ${param} must be at most ${rules.max}`)
        }
        if (rules.pattern && !rules.pattern.test(parameters[param])) {
          errors.push(`Parameter ${param} format is invalid`)
        }
        if (Array.isArray(rules) && !rules.includes(parameters[param])) {
          errors.push(`Parameter ${param} must be one of: ${rules.join(', ')}`)
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// Estimate execution time for commands
function estimateExecutionTime(commandType, parameters) {
  const estimates = {
    'PUMP_ON': 1000, // 1 second
    'PUMP_OFF': 100,  // 100ms
    'PUMP_DURATION': parameters.duration || 5000,
    'CALIBRATE_SENSOR': 2000, // 2 seconds
    'UPDATE_FIRMWARE': 300000, // 5 minutes
    'SYSTEM_REBOOT': 10000,   // 10 seconds
    'GET_STATUS': 500         // 500ms
  }

  return estimates[commandType] || 1000
} 