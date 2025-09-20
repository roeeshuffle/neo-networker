from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import TelegramUser, User, Person, Company, Task
from database import db
from datetime import datetime
import uuid
import requests
import os
import openai
import json
import logging

# Configure logging for Telegram bot
logging.basicConfig(level=logging.INFO)
telegram_logger = logging.getLogger('telegram_bot')

telegram_bp = Blueprint('telegram', __name__)

# Initialize OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

# Admin user ID for notifications
ADMIN_TELEGRAM_ID = 1001816902

def send_admin_notification(user_id: str, prompt: str, response: str, success: bool):
    """Send notification to admin about user requests"""
    try:
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not bot_token:
            telegram_logger.warning("⚠️ Telegram bot token not configured for admin notifications")
            return
        
        # Format the message
        status = "✅ Succeeded" if success else "❌ Failed"
        message = f"User: {user_id}\nRequest: {prompt}\nResponse: {status}"
        
        # Send message to admin
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        data = {
            'chat_id': ADMIN_TELEGRAM_ID,
            'text': message,
            'parse_mode': 'HTML'
        }
        
        response = requests.post(url, data=data, timeout=5)
        if response.status_code == 200:
            telegram_logger.info(f"📤 Admin notification sent for user {user_id}")
        else:
            telegram_logger.warning(f"⚠️ Failed to send admin notification: {response.status_code}")
            
    except Exception as e:
        telegram_logger.error(f"💥 Error sending admin notification: {e}")

def process_natural_language_request(text: str, telegram_user: TelegramUser) -> str:
    """Process natural language requests using OpenAI and map to functions"""
    telegram_logger.info(f"🧠 Processing natural language request: '{text}' for user {telegram_user.first_name}")
    
    if not os.getenv('OPENAI_API_KEY'):
        telegram_logger.error("❌ OpenAI API key not configured")
        return "❌ OpenAI API not configured. Please contact administrator."

    try:
        import requests
        
        response = requests.post('https://api.openai.com/v1/chat/completions', 
            headers={
                'Authorization': f'Bearer {os.getenv("OPENAI_API_KEY")}',
                'Content-Type': 'application/json',
            },
            json={
                'model': 'gpt-4o-mini',
                'messages': [
                    { 
                        'role': 'system', 
                        'content': '''You are a function router. Return ONLY a JSON array [function_number, parameters].

Functions:
1. search_information(words: array)
2. add_task(task: object with text, assign_to, due_date, status, label, priority, repeat)
3. remove_task(task_id: string/number)
4. add_alert_to_task(task_id: string/number)
5. show_all_tasks(period: "daily"|"weekly"|"monthly"|"all", filter?: object)
6. add_new_people(people_data: array)
7. show_all_meetings(period: "today"|"weekly"|"monthly")
8. update_task_request(words: array, field: string, new_value: string)
9. update_person(person_identifier: string/number, updates: object)
10. delete_person(person_identifier: string/number)

For add_new_people (contacts), extract these fields from natural language:
- full_name: person's name
- email: email address
- company: company name
- status: job title/position/role
- skills: skills, expertise, or specializations
- categories: tags, interests, hobbies, or skills (same as skills)
- linkedin_profile: LinkedIn URL if mentioned

For add_task, extract these fields from natural language:
- text: task description
- assign_to: person/company to assign to
- due_date: when the task is due (format: YYYY-MM-DD HH:MM) - convert relative dates like "tomorrow" to actual dates
- priority: low/medium/high
- status: todo/in-progress/completed
- label: task category/label
- notes: additional notes or details about the task
- alert_time: when to alert about the task (format: YYYY-MM-DD HH:MM)

CONTACT vs TASK DETECTION:
- "add contact", "new contact", "add person" → contact functions
- "add task", "new task", "call", "meeting", "schedule" → task functions
- "call [person]" → task (unless it's "add contact [person]")

Examples:
"Find AI info" → [1, ["AI"]]
"add task call John tomorrow" → [2, {"text":"call John","due_date":"2025-09-20 09:00","status":"todo","priority":"medium"}]
"add task call Alon from puzzlesoft tomorrow at 15:00 note for the meeting: talk with guy before" → [2, {"text":"call Alon","assign_to":"puzzlesoft","due_date":"2025-09-20 15:00","status":"todo","priority":"medium","notes":"talk with guy before"}]
"add contact sachar caspi works as ceo in Shuffle, sachar@shuffel.com, skills - marketing and music" → [6, [{"full_name":"sachar caspi","email":"sachar@shuffel.com","company":"Shuffle","status":"ceo","skills":"marketing and music","categories":"marketing and music"}]]
"show weekly tasks" → [5, {"period":"weekly"}]
"delete person 123" → [10, {"person_id":"123"}]
'''
                    },
                    { 'role': 'user', 'content': text }
                ],
                'temperature': 0.1,
                'max_tokens': 150
            }
        )

        data = response.json()
        function_call = data['choices'][0]['message']['content'].strip()
        
        telegram_logger.info(f"🤖 OpenAI function router response: {function_call}")
        
        try:
            function_data = json.loads(function_call)
            function_number = function_data[0]
            parameters = function_data[1] if len(function_data) > 1 else None
            telegram_logger.info(f"🔧 Executing function {function_number} with parameters: {parameters}")
            return execute_bot_function(function_number, parameters, telegram_user, text)
        except (json.JSONDecodeError, IndexError) as parse_error:
            telegram_logger.warning(f"⚠️ Failed to parse OpenAI function response: {parse_error}")
            # Fallback to search
            return search_from_telegram({"query": text, "type": "people"}, telegram_user)
        
    except Exception as error:
        telegram_logger.error(f"💥 OpenAI function router error: {error}")
        # Fallback to search
        return search_from_telegram({"query": text, "type": "people"}, telegram_user)

def execute_bot_function(function_number: int, parameters: any, telegram_user: TelegramUser, original_text: str) -> str:
    """Execute the function mapped by OpenAI"""
    telegram_logger.info(f"⚙️ Executing function {function_number} with params: {parameters} for user {telegram_user.first_name}")
    
    try:
        if function_number == 1:  # search_information
            if parameters and isinstance(parameters, list):
                search_query = ' '.join(parameters)
                return search_from_telegram({"query": search_query, "type": "people"}, telegram_user)
            else:
                return search_from_telegram({"query": original_text, "type": "people"}, telegram_user)
                
        elif function_number == 2:  # add_task
            return add_task_from_telegram(parameters, telegram_user)
            
        elif function_number == 3:  # remove_task
            return remove_task_from_telegram(parameters, telegram_user)
            
        elif function_number == 4:  # add_alert_to_task
            return add_alert_to_task_from_telegram(parameters, telegram_user)
            
        elif function_number == 5:  # show_all_tasks
            return show_tasks_from_telegram(parameters, telegram_user)
            
        elif function_number == 6:  # add_new_people
            return add_people_from_telegram(parameters, telegram_user)
            
        elif function_number == 7:  # show_all_meetings
            return show_meetings_from_telegram(parameters, telegram_user)
            
        elif function_number == 8:  # update_task_request
            return update_task_from_telegram(parameters, telegram_user)
            
        elif function_number == 9:  # update_person
            return update_person_from_telegram(parameters, telegram_user)
            
        elif function_number == 10:  # delete_person
            return delete_person_from_telegram(parameters, telegram_user)
            
        else:
            telegram_logger.warning(f"🚧 Function {function_number} not implemented for user {telegram_user.first_name}")
            return f"🚧 Function {function_number} is not implemented yet."
    except Exception as e:
        telegram_logger.error(f"💥 Error executing function {function_number} for user {telegram_user.first_name}: {str(e)}")
        return f"Error executing function: {str(e)}"

def add_task_from_telegram(args: dict, telegram_user: TelegramUser) -> str:
    """Add a task from Telegram request"""
    try:
        print(f"DEBUG: add_task_from_telegram called with args: {args}")
        
        # Find the user associated with this telegram user
        user = User.query.get(telegram_user.user_id) if telegram_user.user_id else None
        if not user:
            return "❌ User not found. Please authenticate first."

        print(f"DEBUG: Found user: {user.email} (ID: {user.id})")

        # Generate a unique task_id - find the highest existing task_id for this user
        max_task = Task.query.filter(
            Task.owner_id == user.id,
            Task.task_id.isnot(None)
        ).order_by(Task.task_id.desc()).first()
        next_task_id = (max_task.task_id + 1) if max_task and max_task.task_id else 1
        
        print(f"DEBUG: Max task ID for user {user.id}: {max_task.task_id if max_task else 'None'}")
        print(f"DEBUG: Next task ID: {next_task_id}")
        
        # Handle due_date parsing
        due_date = None
        if args.get('due_date'):
            try:
                # Parse the due_date string (format: YYYY-MM-DD HH:MM)
                due_date_str = args.get('due_date')
                print(f"DEBUG: Parsing due_date: {due_date_str}")
                due_date = datetime.strptime(due_date_str, '%Y-%m-%d %H:%M')
                print(f"DEBUG: Parsed due_date: {due_date}")
            except ValueError as e:
                print(f"DEBUG: Error parsing due_date '{due_date_str}': {e}")
                # Try alternative format
                try:
                    due_date = datetime.fromisoformat(due_date_str.replace('Z', ''))
                    print(f"DEBUG: Parsed with isoformat: {due_date}")
                except:
                    print(f"DEBUG: Could not parse due_date: {due_date_str}")
        
        # Handle alert_time parsing
        alert_time = None
        if args.get('alert_time'):
            try:
                alert_time_str = args.get('alert_time')
                print(f"DEBUG: Parsing alert_time: {alert_time_str}")
                alert_time = datetime.strptime(alert_time_str, '%Y-%m-%d %H:%M')
                print(f"DEBUG: Parsed alert_time: {alert_time}")
            except ValueError as e:
                print(f"DEBUG: Error parsing alert_time '{alert_time_str}': {e}")
                try:
                    alert_time = datetime.fromisoformat(alert_time_str.replace('Z', ''))
                    print(f"DEBUG: Parsed alert_time with isoformat: {alert_time}")
                except:
                    print(f"DEBUG: Could not parse alert_time: {alert_time_str}")

        # Create the task
        task = Task(
            id=str(uuid.uuid4()),
            task_id=next_task_id,
            text=args.get('text'),
            assign_to=args.get('assign_to'),
            due_date=due_date,
            priority=args.get('priority', 'medium'),
            label=args.get('label'),
            status=args.get('status', 'todo'),
            notes=args.get('notes'),
            alert_time=alert_time,
            owner_id=user.id,
            created_by=user.id
        )
        
        print(f"DEBUG: Created task with ID: {task.id}, task_id: {task.task_id}, due_date: {task.due_date}")
        
        db.session.add(task)
        db.session.commit()
        
        print(f"DEBUG: After commit - task.task_id: {task.task_id}, due_date: {task.due_date}")
        
        # Refresh the task from database to make sure it's saved correctly
        db.session.refresh(task)
        print(f"DEBUG: After refresh - task.task_id: {task.task_id}, due_date: {task.due_date}")
        
        return f"✅ Added task #{task.task_id}: {task.text}"
        
    except Exception as e:
        return f"❌ Error adding task: {str(e)}"

def remove_task_from_telegram(args: any, telegram_user: TelegramUser) -> str:
    """Remove a task from Telegram request"""
    try:
        # Find the user associated with this telegram user
        user = User.query.get(telegram_user.user_id) if telegram_user.user_id else None
        if not user:
            return "❌ User not found. Please authenticate first."

        # Extract task_id from args - could be a number or string
        task_id = args
        if isinstance(task_id, str):
            # Try to convert to int if it's a numeric string
            try:
                task_id = int(task_id)
            except ValueError:
                # If it's not a number, search by text instead
                task = Task.query.filter(
                    Task.owner_id == user.id,
                    Task.text.ilike(f"%{task_id}%")
                ).first()
                if task:
                    task_id = task.task_id
                else:
                    return f"❌ Task not found: {task_id}"
        
        # Delete the task by task_id
        deleted_count = Task.query.filter(
            Task.owner_id == user.id,
            Task.task_id == task_id
        ).delete()
        
        if deleted_count == 0:
            return f"❌ Task #{task_id} not found."
        
        db.session.commit()
        return f"✅ Task #{task_id} removed successfully."
        
    except Exception as e:
        return f"❌ Error removing task: {str(e)}"

def add_alert_to_task_from_telegram(args: any, telegram_user: TelegramUser) -> str:
    """Add alert to task from Telegram request"""
    return "🚧 Task alerts feature coming soon!"

def show_tasks_from_telegram(args: dict, telegram_user: TelegramUser) -> str:
    """Show tasks from Telegram request"""
    try:
        # Find the user associated with this telegram user
        user = User.query.get(telegram_user.user_id) if telegram_user.user_id else None
        if not user:
            return "❌ User not found. Please authenticate first."

        # Get tasks for the user
        tasks = Task.query.filter_by(owner_id=user.id).limit(20).all()
        
        if not tasks:
            return "📝 No tasks found."
        
        response = f"📝 Found {len(tasks)} task(s):\n\n"
        for task in tasks:
            status_emoji = "✅" if task.status == "completed" else "🔄" if task.status == "in-progress" else "⏳"
            priority_emoji = "🔥" if task.priority == "high" else "🔹" if task.priority == "low" else "📌"
            
            response += f"{status_emoji} {priority_emoji} {task.text}\n"
            response += f"   ID: {task.task_id} | Status: {task.status} | Priority: {task.priority}\n"
            if task.assign_to:
                response += f"   👤 {task.assign_to}\n"
            if task.due_date:
                response += f"   📅 {task.due_date}\n"
            if task.label:
                response += f"   🏷️ {task.label}\n"
            if task.notes:
                response += f"   📝 Notes: {task.notes}\n"
            if task.alert_time:
                response += f"   ⏰ Alert: {task.alert_time}\n"
            response += "\n"
        
        return response
        
    except Exception as e:
        return f"❌ Error fetching tasks: {str(e)}"

def add_people_from_telegram(args: list, telegram_user: TelegramUser) -> str:
    """Add people from Telegram request"""
    try:
        # Find the user associated with this telegram user
        user = User.query.get(telegram_user.user_id) if telegram_user.user_id else None
        if not user:
            return "❌ User not found. Please authenticate first."

        results = []
        for person_data in args:
            # Extract information from various possible field names
            full_name = (person_data.get('Full Name') or person_data.get('full_name') or 
                        person_data.get('name') or person_data.get('Name'))
            email = (person_data.get('Email') or person_data.get('email') or 
                    person_data.get('mail') or person_data.get('Mail'))
            company = (person_data.get('Company') or person_data.get('company') or 
                      person_data.get('works in') or person_data.get('works_in'))
            status = (person_data.get('Status') or person_data.get('status') or 
                     person_data.get('job_title') or person_data.get('position') or
                     person_data.get('role') or person_data.get('engineer') or
                     person_data.get('system engineer'))
            categories = (person_data.get('Categories') or person_data.get('categories') or 
                         person_data.get('tags') or person_data.get('interests') or
                         person_data.get('love') or person_data.get('hobbies') or
                         person_data.get('skills') or person_data.get('skill'))
            
            person = Person(
                id=str(uuid.uuid4()),
                full_name=full_name,
                email=email,
                company=company,
                categories=categories,
                status=status,
                linkedin_profile=person_data.get('linkedin_profile'),
                newsletter=person_data.get('Newsletter') or person_data.get('newsletter', False),
                should_avishag_meet=person_data.get('should_avishag_meet', False),
                owner_id=user.id,
                created_by=user.id
            )
            
            if person.full_name:
                db.session.add(person)
                results.append(person.full_name)
        
        db.session.commit()
        
        if results:
            return f"✅ Added {len(results)} person(s): {', '.join(results)}"
        else:
            return "❌ Could not add any people. Please check the details and try again."
        
    except Exception as e:
        return f"❌ Error adding people: {str(e)}"

def show_meetings_from_telegram(args: str, telegram_user: TelegramUser) -> str:
    """Show meetings from Telegram request"""
    return "🚧 Meetings feature coming soon!"

def update_task_from_telegram(args: dict, telegram_user: TelegramUser) -> str:
    """Update task from Telegram request"""
    try:
        if 'task_id' in args:
            # Direct update with task ID
            task = Task.query.filter_by(task_id=args['task_id']).first()
            if not task:
                return f"❌ Task {args['task_id']} not found."
            
            # Update fields
            if 'field' in args and 'new_value' in args:
                field = args['field']
                new_value = args['new_value']
                if field == 'status':
                    new_value = 'completed' if new_value == 'done' else ('pending' if new_value == 'todo' else new_value)
                setattr(task, field, new_value)
                db.session.commit()
                return f"✅ Task {args['task_id']} updated: {field} = {new_value}"
        else:
            # Search by words
            words = args.get('words', [])
            search_term = ' '.join(words)
            tasks = Task.query.filter(Task.text.ilike(f'%{search_term}%')).limit(10).all()
            
            if not tasks:
                return f"❌ No tasks found matching: {search_term}"
            
            response = f"🔍 Found {len(tasks)} matching task(s). Reply with task number to update:\n\n"
            for i, task in enumerate(tasks):
                response += f"{i + 1}. ID: {task.task_id} - {task.text}\n"
            
            return response
        
    except Exception as e:
        return f"❌ Error updating task: {str(e)}"

def update_person_from_telegram(args: dict, telegram_user: TelegramUser) -> str:
    """Update person from Telegram request"""
    try:
        if 'person_id' in args:
            # Direct update with person ID
            person = Person.query.filter_by(id=args['person_id']).first()
            if not person:
                return f"❌ Person {args['person_id']} not found."
            
            updates = args.get('updates', {})
            for field, value in updates.items():
                setattr(person, field, value)
            db.session.commit()
            return f"✅ Person {person.full_name} updated successfully!"
        else:
            # Search by words
            words = args.get('words', [])
            search_term = ' '.join(words)
            people = Person.query.filter(Person.full_name.ilike(f'%{search_term}%')).limit(10).all()
            
            if not people:
                return f"❌ No person found with name containing: {search_term}"
            
            response = f"🔍 Found {len(people)} matching person(s). Reply with person number to update:\n\n"
            for i, person in enumerate(people):
                response += f"{i + 1}. {person.full_name}"
                if person.company:
                    response += f" ({person.company})"
                response += "\n"
            
            return response
        
    except Exception as e:
        return f"❌ Error updating person: {str(e)}"

def delete_person_from_telegram(args: any, telegram_user: TelegramUser) -> str:
    """Delete person from Telegram request"""
    try:
        if isinstance(args, dict) and 'person_id' in args:
            # Direct delete with person ID
            person = Person.query.filter_by(id=args['person_id']).first()
            if not person:
                return f"❌ Person {args['person_id']} not found."
            
            person_name = person.full_name
            db.session.delete(person)
            db.session.commit()
            return f"✅ {person_name} deleted successfully."
        elif isinstance(args, dict) and 'words' in args:
            # Search by words
            words = args['words']
            search_term = ' '.join(words)
            people = Person.query.filter(Person.full_name.ilike(f'%{search_term}%')).limit(10).all()
            
            if not people:
                return f"❌ No person found with name containing: {search_term}"
            
            response = f"🔍 Found {len(people)} matching person(s). Reply with person number to delete:\n\n"
            for i, person in enumerate(people):
                response += f"{i + 1}. {person.full_name}"
                if person.company:
                    response += f" ({person.company})"
                response += "\n"
            
            return response
        else:
            return "❌ Invalid delete request."
        
    except Exception as e:
        return f"❌ Error deleting person: {str(e)}"

def add_person_from_telegram(args: dict, telegram_user: TelegramUser) -> str:
    """Add a person from Telegram request"""
    try:
        # Find the user associated with this telegram user
        user = User.query.filter_by(email=telegram_user.telegram_username + "@telegram.local").first()
        if not user:
            # Create a user for this telegram user
            user = User(
                id=str(uuid.uuid4()),
                email=telegram_user.telegram_username + "@telegram.local",
                full_name=telegram_user.first_name,
                is_approved=True
            )
            db.session.add(user)
            db.session.commit()

        # Create the person
        person = Person(
            id=str(uuid.uuid4()),
            full_name=args.get('full_name'),
            email=args.get('email'),
            company=args.get('company'),
            linkedin_profile=args.get('linkedin_profile'),
            categories=args.get('categories', []),
            status=args.get('status', 'cold'),
            notes=args.get('notes'),
            owner_id=user.id
        )
        
        db.session.add(person)
        db.session.commit()
        
        return f"✅ Added {person.full_name} to your contacts!"
        
    except Exception as e:
        return f"❌ Error adding person: {str(e)}"

def add_company_from_telegram(args: dict, telegram_user: TelegramUser) -> str:
    """Add a company from Telegram request"""
    try:
        # Find the user associated with this telegram user
        user = User.query.get(telegram_user.user_id) if telegram_user.user_id else None
        if not user:
            return "❌ User not found. Please authenticate first."

        # Create the company
        company = Company(
            id=str(uuid.uuid4()),
            name=args.get('name'),
            description=args.get('description'),
            linkedin_profile=args.get('linkedin_profile'),
            categories=args.get('categories', []),
            domains=args.get('domains', []),
            owner_id=user.id
        )
        
        db.session.add(company)
        db.session.commit()
        
        return f"✅ Added {company.name} to your companies!"
        
    except Exception as e:
        return f"❌ Error adding company: {str(e)}"

def add_task_from_telegram(args: dict, telegram_user: TelegramUser) -> str:
    """Add a task from Telegram request"""
    try:
        # Find the user associated with this telegram user
        user = User.query.get(telegram_user.user_id) if telegram_user.user_id else None
        if not user:
            return "❌ User not found. Please authenticate first."

        # Create the task
        task = Task(
            id=str(uuid.uuid4()),
            text=args.get('text'),
            assign_to=args.get('assign_to'),
            priority=args.get('priority', 'medium'),
            label=args.get('label'),
            owner_id=user.id,
            created_by=user.id
        )
        
        db.session.add(task)
        db.session.commit()
        
        return f"✅ Added task: {task.text}"
        
    except Exception as e:
        return f"❌ Error adding task: {str(e)}"

def search_from_telegram(args: dict, telegram_user: TelegramUser) -> str:
    """Search for information from Telegram request"""
    try:
        query = args.get('query', '')
        search_type = args.get('type', 'people')
        
        # Find the user associated with this telegram user
        user = User.query.get(telegram_user.user_id) if telegram_user.user_id else None
        if not user:
            return "❌ User not found. Please authenticate first."

        results = []
        
        if search_type == 'people':
            # Handle special cases for "contacts" and "persons"
            if query.lower() in ['contacts', 'persons', 'people', 'all contacts', 'all persons', 'show all contacts', 'show all persons']:
                people = Person.query.filter(Person.owner_id == user.id).limit(10).all()
            else:
                people = Person.query.filter(
                    Person.owner_id == user.id,
                    Person.full_name.ilike(f'%{query}%')
                ).limit(5).all()
            
            results = []
            for p in people:
                result = f"👤 {p.full_name}"
                if p.email:
                    result += f" ({p.email})"
                if p.company:
                    result += f"\n   🏢 {p.company}"
                if p.status:
                    result += f"\n   💼 {p.status}"
                if p.categories:
                    result += f"\n   🏷️ {p.categories}"
                if p.linkedin_profile:
                    result += f"\n   🔗 LinkedIn: {p.linkedin_profile}"
                if p.newsletter:
                    result += f"\n   📧 Newsletter subscriber"
                if p.should_avishag_meet:
                    result += f"\n   🤝 Should meet with Avishag"
                if p.more_info:
                    result += f"\n   ℹ️ {p.more_info}"
                results.append(result)
        elif search_type == 'companies':
            companies = Company.query.filter(
                Company.owner_id == user.id,
                Company.name.ilike(f'%{query}%')
            ).limit(5).all()
            results = [f"🏢 {c.name}" for c in companies]
        elif search_type == 'tasks':
            tasks = Task.query.filter(
                Task.owner_id == user.id,
                Task.text.ilike(f'%{query}%')
            ).limit(5).all()
            results = [f"📝 {t.text}" for t in tasks]
        
        if results:
            return f"🔍 Found {len(results)} results:\n" + "\n".join(results)
        else:
            return f"🔍 No {search_type} found matching '{query}'"
            
    except Exception as e:
        return f"❌ Error searching: {str(e)}"

@telegram_bp.route('/telegram/auth', methods=['POST'])
def telegram_auth():
    """Authenticate telegram user"""
    try:
        data = request.get_json()
        telegram_id = data.get('telegram_id')
        password = data.get('password')
        telegram_username = data.get('telegram_username')
        first_name = data.get('first_name')
        
        # Simple password check (you might want to implement proper auth)
        if password != "121212":  # From the original code
            return jsonify({'error': 'Invalid password'}), 401
        
        # Find or create telegram user
        telegram_user = TelegramUser.query.filter_by(telegram_id=telegram_id).first()
        
        if not telegram_user:
            telegram_user = TelegramUser(
                id=str(uuid.uuid4()),
                telegram_id=telegram_id,
                telegram_username=telegram_username,
                first_name=first_name,
                is_authenticated=True,
                authenticated_at=datetime.utcnow()
            )
            db.session.add(telegram_user)
        else:
            telegram_user.is_authenticated = True
            telegram_user.authenticated_at = datetime.utcnow()
            telegram_user.telegram_username = telegram_username
            telegram_user.first_name = first_name
        
        db.session.commit()
        
        return jsonify({
            'message': 'Authentication successful',
            'user': telegram_user.to_dict()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@telegram_bp.route('/telegram/check', methods=['POST'])
def telegram_check():
    """Check telegram authentication status"""
    try:
        data = request.get_json()
        telegram_id = data.get('telegram_id')
        
        telegram_user = TelegramUser.query.filter_by(
            telegram_id=telegram_id,
            is_authenticated=True
        ).first()
        
        return jsonify({
            'authenticated': telegram_user is not None
        })
        
    except Exception as e:
        return jsonify({
            'authenticated': False,
            'error': str(e)
        }), 500

@telegram_bp.route('/telegram/webhook', methods=['POST'])
def telegram_webhook():
    """Handle telegram webhook"""
    try:
        data = request.get_json()
        
        # Log incoming request
        telegram_logger.info(f"📨 Incoming Telegram webhook: {json.dumps(data, indent=2)}")
        
        if not data or 'message' not in data:
            telegram_logger.info("❌ No message in webhook data")
            return jsonify({'status': 'ok'})
        
        message = data['message']
        chat_id = message['chat']['id']
        text = message['text']
        user_id = message['from']['id']
        username = message['from'].get('username', 'Unknown')
        first_name = message['from'].get('first_name', 'Unknown')
        
        # Log user and message details
        telegram_logger.info(f"👤 User: {first_name} (@{username}) ID: {user_id}")
        telegram_logger.info(f"💬 Message: '{text}' in chat {chat_id}")
        
        # Get or create telegram user
        telegram_user = TelegramUser.query.filter_by(telegram_id=user_id).first()
        
        if not telegram_user:
            telegram_logger.info(f"🆕 Creating new Telegram user: {first_name} (@{username}) ID: {user_id}")
            telegram_user = TelegramUser(
                id=str(uuid.uuid4()),
                telegram_id=user_id,
                telegram_username=message['from'].get('username'),
                first_name=message['from'].get('first_name'),
                current_state='idle'
            )
            db.session.add(telegram_user)
            db.session.commit()
            telegram_logger.info(f"✅ New Telegram user created with ID: {telegram_user.id}")
        else:
            telegram_logger.info(f"👤 Existing Telegram user found: {telegram_user.first_name} (ID: {telegram_user.id})")
        
        # Handle different commands
        telegram_logger.info(f"🔍 Processing command: '{text}' for user {telegram_user.first_name}")
        
        if text == '/start':
            telegram_logger.info(f"🚀 User {telegram_user.first_name} started the bot")
            telegram_user.current_state = 'idle'
            telegram_user.state_data = {}
            db.session.commit()
            
            response_text = "Welcome to Neo Networker Bot! Use /help to see available commands."
        elif text == '/help':
            telegram_logger.info(f"❓ User {telegram_user.first_name} requested help")
            response_text = """Available commands:
/start - Start the bot
/help - Show this help message
/auth - Authenticate with password
/status - Check your status"""
        elif text == '/auth':
            telegram_logger.info(f"🔐 User {telegram_user.first_name} initiated authentication")
            telegram_user.current_state = 'waiting_password'
            db.session.commit()
            response_text = "Please enter the authentication password:"
        elif text == '/status':
            auth_status = 'Authenticated' if telegram_user.is_authenticated else 'Not authenticated'
            telegram_logger.info(f"📊 User {telegram_user.first_name} checked status: {auth_status}")
            response_text = f"Status: {auth_status}"
        else:
            # Handle state-based responses
            if telegram_user.current_state == 'waiting_password':
                telegram_logger.info(f"🔑 User {telegram_user.first_name} attempting authentication with password")
                if text == "121212":
                    telegram_logger.info(f"✅ User {telegram_user.first_name} successfully authenticated")
                    telegram_user.is_authenticated = True
                    telegram_user.authenticated_at = datetime.utcnow()
                    telegram_user.current_state = 'idle'
                    response_text = "Authentication successful! You can now use the bot."
                else:
                    telegram_logger.warning(f"❌ User {telegram_user.first_name} failed authentication with password: '{text}'")
                    response_text = "Invalid password. Please try again or use /auth to restart."
            else:
                # Use OpenAI to process natural language requests
                if telegram_user.is_authenticated:
                    telegram_logger.info(f"🤖 Processing natural language request for user {telegram_user.first_name}: '{text}'")
                    response_text = process_natural_language_request(text, telegram_user)
                    telegram_logger.info(f"🤖 OpenAI response for user {telegram_user.first_name}: '{response_text[:100]}...'")
                else:
                    telegram_logger.info(f"🚫 Unauthenticated user {telegram_user.first_name} tried to use bot: '{text}'")
                    response_text = "Please authenticate first using /auth command."
        
        # Log response being sent
        telegram_logger.info(f"📤 Sending response to user {telegram_user.first_name}: '{response_text[:100]}...'")
        
        # Send response back to telegram
        try:
            bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
            if bot_token:
                url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
                data = {
                    'chat_id': chat_id,
                    'text': response_text,
                    'parse_mode': 'HTML'
                }
                
                response = requests.post(url, data=data, timeout=10)
                if response.status_code == 200:
                    telegram_logger.info(f"✅ Message sent successfully to user {telegram_user.first_name}")
                else:
                    telegram_logger.error(f"❌ Failed to send message to user {telegram_user.first_name}: {response.status_code} - {response.text}")
            else:
                telegram_logger.error("❌ Telegram bot token not configured")
        except Exception as e:
            telegram_logger.error(f"💥 Error sending message to user {telegram_user.first_name}: {str(e)}")
        
        return jsonify({'status': 'ok', 'response': response_text})
        
    except Exception as e:
        telegram_logger.error(f"💥 Error processing Telegram webhook for user {user_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@telegram_bp.route('/linkedin-profile-image', methods=['POST'])
def linkedin_profile_image():
    """Fetch LinkedIn profile image"""
    try:
        data = request.get_json()
        linkedin_url = data.get('linkedin_url')
        
        if not linkedin_url:
            return jsonify({'error': 'LinkedIn URL is required'}), 400
        
        # Validate LinkedIn URL format
        if 'linkedin.com/in/' not in linkedin_url:
            return jsonify({'error': 'Invalid LinkedIn profile URL'}), 400
        
        print(f'Fetching profile image for: {linkedin_url}')
        
        # Headers to mimic a real browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        # Fetch the LinkedIn profile page
        response = requests.get(linkedin_url, headers=headers, timeout=10)
        
        if not response.ok:
            print(f'Failed to fetch LinkedIn page: {response.status_code} {response.reason}')
            return jsonify({
                'error': 'Failed to load LinkedIn profile page',
                'profile_image_url': None
            }), 200
        
        html = response.text
        
        # Parse HTML to find profile image
        profile_image_url = extract_profile_image(html)
        
        if profile_image_url:
            print(f'Found profile image: {profile_image_url}')
            return jsonify({
                'success': True,
                'profile_image_url': profile_image_url,
                'linkedin_url': linkedin_url
            })
        else:
            print('No profile image found or profile is private')
            return jsonify({
                'success': False,
                'profile_image_url': None,
                'message': 'Profile image not found or profile is private',
                'linkedin_url': linkedin_url
            })
        
    except Exception as error:
        print(f'Error processing LinkedIn profile: {error}')
        return jsonify({
            'error': 'Internal server error',
            'profile_image_url': None,
            'details': str(error)
        }), 500

def extract_profile_image(html: str) -> str:
    """Extract profile image URL from LinkedIn HTML"""
    try:
        import re
        
        # Look for various patterns where LinkedIn profile images might be stored
        patterns = [
            # Main profile picture patterns
            r'"https://media\.licdn\.com/dms/image/[^"]*"',
            r'"https://media-exp\d*\.licdn\.com/dms/image/[^"]*"',
            # Backup patterns for profile images
            r'class="pv-top-card-profile-picture__image[^"]*"[^>]*src="([^"]*)"',
            r'class="profile-photo-edit__preview"[^>]*src="([^"]*)"',
            # Generic LinkedIn image patterns
            r'"https://media\.licdn\.com/[^"]*profile[^"]*"',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, html)
            if matches:
                # Extract the URL from the match (remove quotes and clean up)
                image_url = matches[0].replace('"', '')
                
                # If it's from a src attribute, extract just the URL
                if 'src=' in image_url:
                    src_match = re.search(r'src="([^"]*)"', image_url)
                    if src_match:
                        image_url = src_match.group(1)
                
                # Validate that it's a proper LinkedIn media URL
                if ('media.licdn.com' in image_url and 
                    ('image' in image_url or 'profile' in image_url)):
                    # Clean up any additional parameters and ensure it's a proper image URL
                    clean_url = image_url.split('&')[0].split('?')[0]
                    return clean_url
        
        # Fallback: look for any img tag with LinkedIn profile indicators
        img_tag_pattern = r'<img[^>]*src="([^"]*)"[^>]*(?:class="[^"]*profile[^"]*"|alt="[^"]*profile[^"]*")'
        img_matches = re.findall(img_tag_pattern, html, re.IGNORECASE)
        
        for img_url in img_matches:
            if 'licdn.com' in img_url:
                return img_url
        
        return None
        
    except Exception as error:
        print(f'Error extracting profile image: {error}')
        return None

@telegram_bp.route('/telegram/setup-webhook', methods=['POST'])
@jwt_required()
def setup_webhook():
    """Setup telegram webhook"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        webhook_url = data.get('webhook_url')
        
        if not webhook_url:
            return jsonify({'error': 'webhook_url is required'}), 400
        
        # Set webhook with Telegram API
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not bot_token:
            return jsonify({'error': 'Telegram bot token not configured'}), 500
        
        telegram_api_url = f"https://api.telegram.org/bot{bot_token}/setWebhook"
        response = requests.post(telegram_api_url, json={'url': webhook_url})
        
        if response.status_code == 200:
            return jsonify({'message': 'Webhook setup successful'})
        else:
            return jsonify({'error': 'Failed to setup webhook'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
