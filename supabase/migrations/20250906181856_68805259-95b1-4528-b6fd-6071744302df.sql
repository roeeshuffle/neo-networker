-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create people table for VC search engine
CREATE TABLE public.people (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name TEXT NOT NULL,
  company TEXT,
  career_history TEXT,
  professional_specialties TEXT[],
  hashtags TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admin access)
CREATE POLICY "Authenticated users can view all people" 
ON public.people 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert people" 
ON public.people 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update people" 
ON public.people 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete people" 
ON public.people 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create indexes for search optimization
CREATE INDEX idx_people_full_name ON public.people USING gin(to_tsvector('english', full_name));
CREATE INDEX idx_people_company ON public.people USING gin(to_tsvector('english', company));
CREATE INDEX idx_people_hashtags ON public.people USING gin(hashtags);
CREATE INDEX idx_people_specialties ON public.people USING gin(professional_specialties);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_people_updated_at
    BEFORE UPDATE ON public.people
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();