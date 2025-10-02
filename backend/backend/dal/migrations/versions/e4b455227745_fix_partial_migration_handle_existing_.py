"""fix_partial_migration_handle_existing_columns

Revision ID: e4b455227745
Revises: d4c7b7800d65
Create Date: 2025-10-01 14:57:52.051989

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e4b455227745'
down_revision: Union[str, None] = 'd4c7b7800d65'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Fix partial migration by safely adding missing columns"""
    
    # Get database connection
    connection = op.get_bind()
    
    # Check and add missing columns to tasks table
    columns_to_add = [
        ('title', 'VARCHAR(255)', 'COALESCE(text, \'Untitled Task\')'),
        ('description', 'TEXT', 'NULL'),
        ('project', 'VARCHAR(100)', '\'personal\''),
        ('scheduled_date', 'TIMESTAMP', 'NULL'),
        ('is_scheduled', 'BOOLEAN', 'FALSE'),
        ('is_active', 'BOOLEAN', 'TRUE')
    ]
    
    for column_name, column_type, default_value in columns_to_add:
        # Check if column exists
        result = connection.execute(
            sa.text(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'tasks' AND column_name = '{column_name}'
                );
            """)
        )
        
        column_exists = result.fetchone()[0]
        
        if not column_exists:
            print(f"Adding column {column_name} to tasks table...")
            
            # Add column as nullable first
            if default_value == 'NULL':
                connection.execute(sa.text(f"ALTER TABLE tasks ADD COLUMN {column_name} {column_type}"))
            else:
                connection.execute(sa.text(f"ALTER TABLE tasks ADD COLUMN {column_name} {column_type}"))
                # Set default values for existing rows
                connection.execute(sa.text(f"UPDATE tasks SET {column_name} = {default_value} WHERE {column_name} IS NULL"))
                
                # Make NOT NULL for required columns
                if column_name in ['title', 'project']:
                    connection.execute(sa.text(f"ALTER TABLE tasks ALTER COLUMN {column_name} SET NOT NULL"))
    
    # Check if events table exists
    result = connection.execute(
        sa.text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'events'
            );
        """)
    )
    
    events_table_exists = result.fetchone()[0]
    
    if not events_table_exists:
        print("Creating events table...")
        connection.execute(sa.text("""
            CREATE TABLE events (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                start_datetime TIMESTAMP NOT NULL,
                end_datetime TIMESTAMP NOT NULL,
                location VARCHAR(255),
                event_type VARCHAR(50) DEFAULT 'event',
                participants JSON,
                alert_minutes INTEGER DEFAULT 15,
                repeat_pattern VARCHAR(50),
                repeat_interval INTEGER DEFAULT 1,
                repeat_days JSON,
                repeat_end_date TIMESTAMP,
                notes TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_id VARCHAR(36) NOT NULL,
                FOREIGN KEY (user_id) REFERENCES profiles(id)
            );
        """))
        connection.execute(sa.text("CREATE INDEX ix_events_id ON events (id);"))
    
    # Check if event_type column exists in events table
    result = connection.execute(
        sa.text("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'events' AND column_name = 'event_type'
            );
        """)
    )
    
    event_type_exists = result.fetchone()[0]
    
    if not event_type_exists:
        print("Adding event_type column to events table...")
        connection.execute(sa.text("ALTER TABLE events ADD COLUMN event_type VARCHAR(50) DEFAULT 'event'"))


def downgrade() -> None:
    pass
