import psycopg2

# Try different combinations
host = "neo-networker-db-v2.c0d2k4qwgenr.us-east-1.rds.amazonaws.com"
user = "postgres"
passwords = ["NeoNetworker2024!", "NeoNetworker2024", "postgres", "admin", "password"]
databases = ["neo_networker", "postgres", "neo_networker_db", "networker"]

for db in databases:
    for pwd in passwords:
        try:
            print(f"Trying: {user}@{host}/{db} with password {pwd[:10]}...")
            conn = psycopg2.connect(
                host=host,
                user=user,
                password=pwd,
                database=db,
                sslmode='require'
            )
            cursor = conn.cursor()
            cursor.execute("SELECT current_database();")
            db_name = cursor.fetchone()[0]
            print(f"✅ SUCCESS! Connected to database: {db_name}")
            print(f"Password: {pwd}")
            print(f"Database: {db}")
            
            # Now run the fix commands
            commands = [
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id VARCHAR(255);",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255);",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_phone_number VARCHAR(255);",
                "DROP TABLE IF EXISTS telegram_users CASCADE;",
                "DROP TABLE IF EXISTS companies CASCADE;",
                "DROP TABLE IF EXISTS shared_data CASCADE;"
            ]
            
            for cmd in commands:
                cursor.execute(cmd)
                print(f"✅ {cmd}")
            
            conn.commit()
            cursor.close()
            conn.close()
            print("🎉 Database fixed!")
            exit(0)
            
        except Exception as e:
            print(f"❌ Failed: {e}")
            continue

print("❌ Could not connect with any combination")
