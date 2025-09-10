-- Change due_date column from date to timestamp with time zone to store hours
ALTER TABLE public.tasks 
ALTER COLUMN due_date TYPE TIMESTAMP WITH TIME ZONE 
USING due_date::timestamp;