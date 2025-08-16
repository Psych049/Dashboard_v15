-- Cleanup Duplicate API Keys Script
-- Run this in your Supabase SQL editor to clean up any existing duplicate API keys

-- First, let's see what duplicate API keys exist
WITH duplicate_keys AS (
  SELECT 
    device_id,
    user_id,
    COUNT(*) as key_count,
    ARRAY_AGG(id ORDER BY created_at DESC) as key_ids
  FROM api_keys 
  WHERE device_id IS NOT NULL 
    AND is_active = true
  GROUP BY device_id, user_id
  HAVING COUNT(*) > 1
)
SELECT 
  dk.device_id,
  dk.user_id,
  dk.key_count,
  dk.key_ids,
  d.device_name,
  up.email
FROM duplicate_keys dk
JOIN devices d ON d.id = dk.device_id
JOIN user_profiles up ON up.id = dk.user_id;

-- Now let's clean up the duplicates, keeping only the most recent one for each device
WITH duplicate_keys AS (
  SELECT 
    device_id,
    user_id,
    COUNT(*) as key_count,
    ARRAY_AGG(id ORDER BY created_at DESC) as key_ids
  FROM api_keys 
  WHERE device_id IS NOT NULL 
    AND is_active = true
  GROUP BY device_id, user_id
  HAVING COUNT(*) > 1
),
keys_to_delete AS (
  SELECT 
    unnest(key_ids[2:]) as key_id  -- Skip the first (most recent) key
  FROM duplicate_keys
)
DELETE FROM api_keys 
WHERE id IN (SELECT key_id FROM keys_to_delete);

-- Verify the cleanup worked
SELECT 
  device_id,
  user_id,
  COUNT(*) as remaining_keys
FROM api_keys 
WHERE device_id IS NOT NULL 
  AND is_active = true
GROUP BY device_id, user_id
HAVING COUNT(*) > 1;

-- If the above query returns no results, the cleanup was successful!
-- You should now see only one API key per device in your dashboard.
