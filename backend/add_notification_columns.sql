-- Add new columns to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS notification_type VARCHAR(50) NOT NULL DEFAULT 'general',
ADD COLUMN IF NOT EXISTS seen BOOLEAN NOT NULL DEFAULT FALSE;

-- Update existing notifications to have a default notification type
UPDATE notifications 
SET notification_type = 'general' 
WHERE notification_type IS NULL OR notification_type = '';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_seen ON notifications(user_email, seen);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
