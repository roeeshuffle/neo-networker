-- Create companies table with the specified columns
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record TEXT NOT NULL, -- Company name/record
  tags TEXT[],
  categories TEXT,
  linkedin_profile TEXT,
  last_interaction TIMESTAMP WITH TIME ZONE,
  connection_strength TEXT,
  twitter_follower_count INTEGER,
  twitter TEXT,
  domains TEXT[],
  description TEXT,
  notion_id TEXT,
  owner_id UUID NOT NULL,
  created_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own and shared companies" 
ON public.companies 
FOR SELECT 
USING ((auth.uid() = owner_id) OR (EXISTS ( SELECT 1
   FROM shared_data
  WHERE ((shared_data.table_name = 'companies'::text) AND (shared_data.record_id = companies.id) AND (shared_data.shared_with_user_id = auth.uid())))));

CREATE POLICY "Users can create their own companies" 
ON public.companies 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own companies" 
ON public.companies 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own companies" 
ON public.companies 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();