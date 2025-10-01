#!/usr/bin/env python3
"""
Database Query Tool for Neo Networker
Run SQL queries against the PostgreSQL database
"""

import psycopg2
import os
import sys
from dotenv import load_dotenv

def connect_to_db():
    """Connect to the PostgreSQL database"""
    load_dotenv()
    
    DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/neo_networker')
    
    try:
        # Parse the DATABASE_URL
        if '://' in DATABASE_URL:
            url_parts = DATABASE_URL.split('://')[1]
            user_pass, host_port_db = url_parts.split('@')
            user, password = user_pass.split(':')
            host_port, database = host_port_db.split('/')
            host, port = host_port.split(':')
        else:
            host = 'localhost'
            port = '5432'
            database = 'neo_networker'
            user = 'postgres'
            password = 'password'
        
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password
        )
        return conn
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        return None

def execute_query(query, fetch=True):
    """Execute a SQL query and return results"""
    conn = connect_to_db()
    if not conn:
        return None
    
    try:
        cur = conn.cursor()
        cur.execute(query)
        
        if fetch:
            results = cur.fetchall()
            columns = [desc[0] for desc in cur.description] if cur.description else []
            cur.close()
            conn.close()
            return results, columns
        else:
            conn.commit()
            cur.close()
            conn.close()
            return "Query executed successfully"
            
    except Exception as e:
        print(f"❌ Error executing query: {e}")
        if conn:
            conn.rollback()
            conn.close()
        return None

def show_tables():
    """Show all tables in the database"""
    query = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """
    result = execute_query(query)
    if result:
        tables, _ = result
        print("📋 Database Tables:")
        for table in tables:
            print(f"  - {table[0]}")
        return [table[0] for table in tables]
    return []

def describe_table(table_name):
    """Show the schema of a specific table"""
    query = f"""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = '{table_name}'
        ORDER BY ordinal_position;
    """
    result = execute_query(query)
    if result:
        columns, _ = result
        print(f"\n📊 Table Schema: {table_name}")
        print("-" * 60)
        for col in columns:
            nullable = 'NULL' if col[2] == 'YES' else 'NOT NULL'
            default = f" DEFAULT {col[3]}" if col[3] else ""
            print(f"  {col[0]:<20} {col[1]:<20} {nullable}{default}")
        return columns
    return []

def run_custom_query(query):
    """Run a custom SQL query"""
    print(f"🔍 Executing: {query}")
    print("-" * 60)
    
    result = execute_query(query)
    if result:
        rows, columns = result
        if rows:
            # Print column headers
            print(" | ".join(f"{col:<15}" for col in columns))
            print("-" * (len(columns) * 18))
            
            # Print rows
            for row in rows:
                print(" | ".join(f"{str(cell):<15}" for cell in row))
            print(f"\n📊 {len(rows)} rows returned")
        else:
            print("📊 No rows returned")
        return rows, columns
    else:
        print("❌ Query failed")
        return None, None

def interactive_mode():
    """Interactive SQL query mode"""
    print("🔧 Neo Networker Database Query Tool")
    print("=" * 50)
    print("Commands:")
    print("  tables          - Show all tables")
    print("  describe <table> - Show table schema")
    print("  sql <query>     - Execute SQL query")
    print("  quit/exit       - Exit")
    print("=" * 50)
    
    while True:
        try:
            command = input("\n> ").strip()
            
            if command.lower() in ['quit', 'exit', 'q']:
                print("👋 Goodbye!")
                break
            elif command.lower() == 'tables':
                show_tables()
            elif command.lower().startswith('describe '):
                table_name = command.split(' ', 1)[1]
                describe_table(table_name)
            elif command.lower().startswith('sql '):
                query = command.split(' ', 1)[1]
                run_custom_query(query)
            elif command.lower() == 'help':
                print("Commands: tables, describe <table>, sql <query>, quit")
            else:
                print("❌ Unknown command. Type 'help' for available commands.")
                
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "tables":
            show_tables()
        elif sys.argv[1] == "describe" and len(sys.argv) > 2:
            describe_table(sys.argv[2])
        elif sys.argv[1] == "sql" and len(sys.argv) > 2:
            query = " ".join(sys.argv[2:])
            run_custom_query(query)
        else:
            print("Usage: python3 query_db.py [tables|describe <table>|sql <query>]")
    else:
        interactive_mode()
