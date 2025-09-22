#!/usr/bin/env python3
"""
Quick database fix - run this in production to add WhatsApp columns
"""

import os
import psycopg2
from urllib.parse import urlparse

# Get database URL from environment
db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:123456@localhost:5432/neo_networker')

try:
    # Parse the URL
    parsed = urlparse(db_url)
    host = parsed.hostname
    port = parsed.port or 5432
    database = parsed.path[1:]  # Remove leading slash
    username = parsed.username
    password = parsed.password
    
    print(f"Connecting to: {host}:{port}/{database}")
    
    # Connect to database
    conn = psycopg2.connect(
        host=host,
        port=port,
        database=database,
        user=username,
        password=password
    )
    
    cursor = conn.cursor()
    
    # Add whatsapp_phone column
    print("Adding whatsapp_phone column...")
    cursor.execute('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_phone VARCHAR(20) UNIQUE;')
    
    # Add preferred_messaging_platform column
    print("Adding preferred_messaging_platform column...")
    cursor.execute("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_messaging_platform VARCHAR(20) DEFAULT 'telegram';")
    
    # Commit changes
    conn.commit()
    print("✅ WhatsApp columns added successfully!")
    
    # Verify
    cursor.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name IN ('whatsapp_phone', 'preferred_messaging_platform')
    """)
    
    columns = cursor.fetchall()
    print("Added columns:")
    for col in columns:
        print(f"  ✅ {col[0]}: {col[1]}")
    
    cursor.close()
    conn.close()
    print("🎉 Database fix completed!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
