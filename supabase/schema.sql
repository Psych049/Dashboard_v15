-- Smart Garden Dashboard Database Schema
-- This file contains the complete database schema for the Smart Garden Dashboard
-- Run this in your Supabase SQL Editor to set up the complete database

-- Step 1: Drop all existing tables (WARNING: This will delete all data)
DROP TABLE IF EXISTS public.api_keys CASCADE;
DROP TABLE IF EXISTS public.commands CASCADE;
DROP TABLE IF EXISTS public.watering_schedules CASCADE;
DROP TABLE IF EXISTS public.watering_controls CASCADE;
DROP TABLE IF EXISTS public.sensor_data CASCADE;
DROP TABLE IF EXISTS public.devices CASCADE;
DROP TABLE IF EXISTS public.zones CASCADE;
DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.soil_types CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- Step 2: Drop all functions
DROP FUNCTION IF EXISTS create_api_key(TEXT, TEXT);
DROP FUNCTION IF EXISTS process_sensor_data();
DROP FUNCTION IF EXISTS handle_watering_command();
DROP FUNCTION IF EXISTS process_pending_commands();
DROP FUNCTION IF EXISTS update_device_health(UUID, TEXT, INET, TEXT);
DROP FUNCTION IF EXISTS audit_table_changes();

-- Step 3: Create zones table
CREATE TABLE public.zones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  soil_type text NOT NULL,
  moisture_threshold decimal(5,2) DEFAULT 30.0,
  pump_on boolean DEFAULT false,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT zones_pkey PRIMARY KEY (id),
  CONSTRAINT zones_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Step 4: Create devices table
CREATE TABLE public.devices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  device_id text NOT NULL,
  device_type text NOT NULL DEFAULT 'esp32'::text,
  status text NOT NULL DEFAULT 'offline'::text,
  last_seen timestamp with time zone DEFAULT now(),
  ip_address inet,
  mac_address text,
  firmware_version text,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT devices_pkey PRIMARY KEY (id),
  CONSTRAINT devices_device_id_key UNIQUE (device_id),
  CONSTRAINT devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Step 5: Create sensor_data table
CREATE TABLE public.sensor_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL,
  temperature decimal(5,2) NOT NULL,
  humidity decimal(5,2) NOT NULL,
  soil_moisture decimal(5,2) NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  CONSTRAINT sensor_data_pkey PRIMARY KEY (id),
  CONSTRAINT sensor_data_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zones (id) ON DELETE CASCADE,
  CONSTRAINT sensor_data_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Step 6: Create watering_controls table
CREATE TABLE public.watering_controls (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL,
  device_id uuid,
  pump_pin integer NOT NULL,
  valve_pin integer,
  is_active boolean DEFAULT false,
  auto_mode boolean DEFAULT true,
  moisture_threshold decimal(5,2) DEFAULT 30.0,
  watering_duration integer DEFAULT 30,
  last_watered timestamp with time zone,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT watering_controls_pkey PRIMARY KEY (id),
  CONSTRAINT watering_controls_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zones (id) ON DELETE CASCADE,
  CONSTRAINT watering_controls_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices (id) ON DELETE SET NULL,
  CONSTRAINT watering_controls_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Step 7: Create watering_schedules table
CREATE TABLE public.watering_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL,
  name text NOT NULL,
  cron_expression text NOT NULL,
  duration integer DEFAULT 30,
  is_active boolean DEFAULT true,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT watering_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT watering_schedules_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zones (id) ON DELETE CASCADE,
  CONSTRAINT watering_schedules_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Step 8: Create commands table
CREATE TABLE public.commands (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  device_id uuid,
  command_type text NOT NULL,
  parameters jsonb,
  status text DEFAULT 'pending',
  priority integer DEFAULT 0,
  retry_count integer DEFAULT 0,
  last_retry_at timestamp with time zone,
  error_message text,
  executed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  CONSTRAINT commands_pkey PRIMARY KEY (id),
  CONSTRAINT commands_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices (id) ON DELETE CASCADE,
  CONSTRAINT commands_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Step 9: Create api_keys table
CREATE TABLE public.api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  CONSTRAINT api_keys_pkey PRIMARY KEY (id),
  CONSTRAINT api_keys_key_key UNIQUE (key),
  CONSTRAINT api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Step 10: Create alerts table
CREATE TABLE public.alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text NOT NULL,
  zone text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  read boolean NOT NULL DEFAULT false,
  CONSTRAINT alerts_pkey PRIMARY KEY (id),
  CONSTRAINT alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Step 11: Create soil_types table
CREATE TABLE public.soil_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text NOT NULL,
  ideal_plants jsonb NOT NULL,
  watering_tips text NOT NULL,
  amendments text NOT NULL,
  characteristics text NOT NULL,
  user_id uuid,
  CONSTRAINT soil_types_pkey PRIMARY KEY (id),
  CONSTRAINT soil_types_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Step 12: Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  operation text NOT NULL,
  record_id uuid,
  user_id uuid,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  old_data jsonb,
  new_data jsonb,
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Step 13: Enable Row Level Security on all tables
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watering_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watering_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Step 14: Create RLS policies for zones
CREATE POLICY "Users can view their own zones" ON public.zones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own zones" ON public.zones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own zones" ON public.zones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own zones" ON public.zones FOR DELETE USING (auth.uid() = user_id);

-- Step 15: Create RLS policies for devices
CREATE POLICY "Users can view their own devices" ON public.devices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own devices" ON public.devices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own devices" ON public.devices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own devices" ON public.devices FOR DELETE USING (auth.uid() = user_id);

-- Step 16: Create RLS policies for sensor_data
CREATE POLICY "Users can view their own sensor data" ON public.sensor_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sensor data" ON public.sensor_data FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Step 17: Create RLS policies for watering_controls
CREATE POLICY "Users can view their own watering controls" ON public.watering_controls FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own watering controls" ON public.watering_controls FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own watering controls" ON public.watering_controls FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own watering controls" ON public.watering_controls FOR DELETE USING (auth.uid() = user_id);

-- Step 18: Create RLS policies for watering_schedules
CREATE POLICY "Users can view their own watering schedules" ON public.watering_schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own watering schedules" ON public.watering_schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own watering schedules" ON public.watering_schedules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own watering schedules" ON public.watering_schedules FOR DELETE USING (auth.uid() = user_id);

-- Step 19: Create RLS policies for commands
CREATE POLICY "Users can view their own commands" ON public.commands FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own commands" ON public.commands FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own commands" ON public.commands FOR UPDATE USING (auth.uid() = user_id);

-- Step 20: Create RLS policies for api_keys
CREATE POLICY "Users can view their own API keys" ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own API keys" ON public.api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own API keys" ON public.api_keys FOR DELETE USING (auth.uid() = user_id);

-- Step 21: Create RLS policies for alerts
CREATE POLICY "Users can view their own alerts" ON public.alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own alerts" ON public.alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own alerts" ON public.alerts FOR UPDATE USING (auth.uid() = user_id);

-- Step 22: Create RLS policies for soil_types
CREATE POLICY "Anyone can view public soil types" ON public.soil_types FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users can insert their own soil types" ON public.soil_types FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Step 23: Create RLS policies for audit_logs
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);

-- Step 24: Insert default soil types
INSERT INTO public.soil_types (type, ideal_plants, watering_tips, amendments, characteristics, user_id) VALUES
  ('Loam soil', '["Tomatoes", "Peppers", "Cucumbers", "Zucchini", "Roses"]'::jsonb, 'Water deeply but less frequently to encourage root growth.', 'Add compost yearly to maintain organic content.', 'Equal parts of sand, silt, and clay. Excellent drainage and moisture retention.', NULL),
  ('Sandy soil', '["Lavender", "Rosemary", "Cacti", "Sedums", "Zinnias"]'::jsonb, 'Water more frequently but in smaller amounts.', 'Add compost and mulch to improve water retention.', 'Gritty texture with large particles. Drains quickly but retains little moisture.', NULL),
  ('Potting Mix', '["Basil", "Mint", "Parsley", "Thyme", "Cilantro"]'::jsonb, 'Check moisture level daily, water when top inch feels dry.', 'Replace or refresh annually with fresh mix.', 'Lightweight and sterile. Good drainage with adequate water retention.', NULL),
  ('Peat soil', '["Ferns", "Orchids", "African Violets", "Peace Lily", "Spider Plant"]'::jsonb, 'Water thoroughly when top layer becomes dry, avoid overwatering.', 'Mix with perlite or sand to improve drainage.', 'Dark, rich organic material. Excellent water retention but can become compacted.', NULL);

-- Step 25: Create functions
CREATE OR REPLACE FUNCTION create_api_key(key_name TEXT, key_value TEXT) RETURNS JSONB AS $$
DECLARE
  current_user_id UUID;
  new_api_key_id UUID;
  result JSONB;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  INSERT INTO api_keys (name, key, user_id) VALUES (key_name, key_value, current_user_id) RETURNING id INTO new_api_key_id;
  
  SELECT jsonb_build_object('id', id, 'name', name, 'key', key, 'created_at', created_at, 'user_id', user_id) INTO result
  FROM api_keys WHERE id = new_api_key_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION process_sensor_data() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.soil_moisture < 25 THEN
    INSERT INTO alerts (type, zone, message, severity, user_id)
    SELECT 'warning', z.name, 'Soil moisture critically low (' || NEW.soil_moisture || '%)', 'high', NEW.user_id
    FROM zones z WHERE z.id = NEW.zone_id;
  ELSIF NEW.soil_moisture < 30 THEN
    INSERT INTO alerts (type, zone, message, severity, user_id)
    SELECT 'warning', z.name, 'Soil moisture below optimal levels (' || NEW.soil_moisture || '%)', 'medium', NEW.user_id
    FROM zones z WHERE z.id = NEW.zone_id;
  END IF;
  
  IF NEW.temperature > 30 THEN
    INSERT INTO alerts (type, zone, message, severity, user_id)
    SELECT 'warning', z.name, 'Temperature too high (' || NEW.temperature || '°C)', 'medium', NEW.user_id
    FROM zones z WHERE z.id = NEW.zone_id;
  END IF;
  
  INSERT INTO commands (device_id, command_type, parameters, user_id)
  SELECT wc.device_id, 'check_watering', 
         jsonb_build_object('moisture', NEW.soil_moisture, 'threshold', wc.moisture_threshold),
         NEW.user_id
  FROM watering_controls wc
  WHERE wc.zone_id = NEW.zone_id 
    AND wc.auto_mode = true 
    AND wc.is_active = true
    AND NEW.soil_moisture < wc.moisture_threshold;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_watering_command() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.command_type = 'check_watering' AND NEW.parameters->>'moisture'::text < NEW.parameters->>'threshold'::text THEN
    INSERT INTO commands (device_id, command_type, parameters, user_id)
    VALUES (NEW.device_id, 'pump_on', 
            jsonb_build_object('duration', 
              (SELECT watering_duration FROM watering_controls WHERE device_id = NEW.device_id LIMIT 1)), 
            NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION process_pending_commands() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'failed' AND NEW.retry_count < 3 THEN
    INSERT INTO commands (device_id, command_type, parameters, status, user_id, retry_count, last_retry_at)
    VALUES (NEW.device_id, NEW.command_type, NEW.parameters, 'pending', NEW.user_id, NEW.retry_count + 1, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_device_health(p_device_id UUID, p_status TEXT DEFAULT 'online', p_ip_address INET DEFAULT NULL, p_firmware_version TEXT DEFAULT NULL) RETURNS VOID AS $$
BEGIN
  UPDATE devices 
  SET status = p_status, last_seen = NOW(), ip_address = COALESCE(p_ip_address, ip_address), firmware_version = COALESCE(p_firmware_version, firmware_version)
  WHERE id = p_device_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_table_changes() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (table_name, operation, record_id, user_id, old_data, new_data) VALUES (
    TG_TABLE_NAME, TG_OP, COALESCE(NEW.id, OLD.id), auth.uid(),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 26: Grant permissions
GRANT EXECUTE ON FUNCTION create_api_key(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_device_health(UUID, TEXT, INET, TEXT) TO authenticated;

-- Step 27: Create triggers
CREATE TRIGGER sensor_data_trigger AFTER INSERT ON public.sensor_data FOR EACH ROW EXECUTE FUNCTION process_sensor_data();
CREATE TRIGGER watering_command_trigger AFTER INSERT ON public.commands FOR EACH ROW EXECUTE FUNCTION handle_watering_command();
CREATE TRIGGER retry_failed_commands AFTER UPDATE ON public.commands FOR EACH ROW WHEN (NEW.status = 'failed') EXECUTE FUNCTION process_pending_commands();
CREATE TRIGGER devices_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.devices FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

-- Step 28: Enable realtime for tables
ALTER TABLE public.sensor_data REPLICA IDENTITY FULL;
ALTER TABLE public.devices REPLICA IDENTITY FULL;
ALTER TABLE public.commands REPLICA IDENTITY FULL;
ALTER TABLE public.zones REPLICA IDENTITY FULL;
ALTER TABLE public.alerts REPLICA IDENTITY FULL;

-- Step 29: Verify setup
SELECT 'DATABASE SETUP COMPLETE' as status;
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';
SELECT COUNT(*) as function_count FROM information_schema.routines WHERE routine_schema = 'public';
SELECT COUNT(*) as trigger_count FROM information_schema.triggers WHERE trigger_schema = 'public';






-- Extra sql queries added by me --


-- Enable Realtime for specific tables
ALTER TABLE sensor_data REPLICA IDENTITY FULL;
ALTER TABLE devices REPLICA IDENTITY FULL;
ALTER TABLE commands REPLICA IDENTITY FULL;
ALTER TABLE zones REPLICA IDENTITY FULL;
ALTER TABLE alerts REPLICA IDENTITY FULL;







-- Create an audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  record_id UUID,
  user_id UUID REFERENCES auth.users,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  old_data JSONB,
  new_data JSONB
);

-- Create a generic audit trigger function
CREATE OR REPLACE FUNCTION audit_table_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    table_name, 
    operation, 
    record_id, 
    user_id, 
    old_data, 
    new_data
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example of applying audit trigger to a table
CREATE TRIGGER devices_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON devices
FOR EACH ROW EXECUTE FUNCTION audit_table_changes();





CREATE OR REPLACE FUNCTION process_pending_commands() 
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically create follow-up commands or handle retries
  IF NEW.status = 'failed' AND NEW.retry_count < 3 THEN
    INSERT INTO commands (
      device_id, 
      command_type, 
      parameters, 
      status, 
      user_id, 
      retry_count,
      last_retry_at
    )
    VALUES (
      NEW.device_id,
      NEW.command_type,
      NEW.parameters,
      'pending',
      NEW.user_id,
      NEW.retry_count + 1,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER retry_failed_commands
AFTER UPDATE ON commands
FOR EACH ROW
WHEN (NEW.status = 'failed')
EXECUTE FUNCTION process_pending_commands();




CREATE OR REPLACE FUNCTION update_device_health(
  p_device_id UUID, 
  p_status TEXT DEFAULT 'online', 
  p_ip_address INET DEFAULT NULL,
  p_firmware_version TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE devices 
  SET 
    status = p_status,
    last_seen = NOW(),
    ip_address = COALESCE(p_ip_address, ip_address),
    firmware_version = COALESCE(p_firmware_version, firmware_version)
  WHERE id = p_device_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;




-- Update commands table
ALTER TABLE commands 
ADD COLUMN priority INTEGER DEFAULT 0,
ADD COLUMN retry_count INTEGER DEFAULT 0,
ADD COLUMN last_retry_at TIMESTAMPTZ,
ADD COLUMN error_message TEXT;








