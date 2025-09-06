-- Add new fields to people table
ALTER TABLE public.people 
ADD COLUMN gender TEXT,
ADD COLUMN age INTEGER,
ADD COLUMN linkedin_profile TEXT;