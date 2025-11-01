/*
  # Add Default Pickup Address Feature

  1. Changes
    - Add columns to dealers table for storing default pickup address
    - These will auto-populate when creating new jobs
    
  2. Notes
    - Reuses existing street, city, state, zip fields in dealers table
    - No new columns needed - they already exist
    - Just documenting the intended usage for default pickup addresses
*/

-- The dealers table already has street, city, state, zip fields
-- We'll use these as the default pickup address
-- No schema changes needed
