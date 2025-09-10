-- Clear all telegram users so they can reauthorize with the new email linking flow
DELETE FROM telegram_users;