-- Update people table to match new requirements
ALTER TABLE public.people 
DROP COLUMN IF EXISTS professional_specialties,
DROP COLUMN IF EXISTS hashtags,
DROP COLUMN IF EXISTS notes,
DROP COLUMN IF EXISTS age,
DROP COLUMN IF EXISTS gender,
DROP COLUMN IF EXISTS career_history;

-- Add new columns
ALTER TABLE public.people 
ADD COLUMN categories TEXT,
ADD COLUMN email TEXT,
ADD COLUMN newsletter BOOLEAN DEFAULT false,
ADD COLUMN status TEXT,
ADD COLUMN poc_in_apex TEXT,
ADD COLUMN who_warm_intro TEXT,
ADD COLUMN agenda TEXT,
ADD COLUMN meeting_notes TEXT,
ADD COLUMN should_avishag_meet BOOLEAN DEFAULT false,
ADD COLUMN more_info TEXT;