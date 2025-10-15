from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dal.models import Task, User
from dal.database import db
from datetime import datetime
from bl.services.notification_service import notification_service
import uuid

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/tasks/assignable-users', methods=['GET'])
@jwt_required()
def get_assignable_users():
    """Get list of users that can be assigned tasks (group members)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get group members from user preferences
        user_preferences = current_user.user_preferences or {}
        group_members = user_preferences.get('group_members', [])
        
        # Extract user emails and names
        assignable_users = []
        for member in group_members:
            if member.get('status') == 'approved':
                assignable_users.append({
                    'email': member.get('email'),
                    'name': member.get('full_name', member.get('email')),
                    'id': member.get('id')
                })
        
        return jsonify({
            'success': True,
            'users': assignable_users
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/projects', methods=['GET', 'OPTIONS'])
@jwt_required(optional=True)
def get_projects():
    """Get distinct projects for the current user"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        print(f"🚀 APP VERSION: 12.8 - FIX PROJECTS CORS")
        print(f"📋 GET /projects - user_id: {current_user_id}")
        
        # First, let's check if there are any tasks for this user at all
        total_tasks = Task.query.filter(Task.owner_id == current_user_id).count()
        print(f"📊 Total tasks for user {current_user_id}: {total_tasks}")
        
        # Get all tasks for this user to debug
        all_tasks = Task.query.filter(Task.owner_id == current_user_id).all()
        print(f"📋 All tasks for user:")
        for task in all_tasks:
            print(f"  - Task {task.id}: project='{task.project}', status='{task.status}'")
        
        # Get distinct projects from tasks table for this user
        distinct_projects = db.session.query(Task.project).filter(
            Task.owner_id == current_user_id,
            Task.project.isnot(None),
            Task.project != ''
        ).distinct().all()
        
        # Extract project names and sort them
        projects = [project[0] for project in distinct_projects if project[0]]
        projects.sort()
        
        print(f"📊 Found {len(projects)} distinct projects: {projects}")
        
        return jsonify({
            'projects': projects,
            'count': len(projects),
            'total_tasks': total_tasks,
            'debug_info': {
                'user_id': current_user_id,
                'all_tasks_count': len(all_tasks)
            }
        })
        
    except Exception as e:
        print(f"❌ Error getting projects: {str(e)}")
        return jsonify({'error': 'Failed to get projects'}), 500

@tasks_bp.route('/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    """Get all tasks for the current user, grouped by project"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get query parameters
        project = request.args.get('project')
        status = request.args.get('status')
        include_scheduled = request.args.get('include_scheduled', 'true').lower() == 'true'
        
        print(f"🚀 APP VERSION: 8.0 - BACKEND STATUS FILTER FIX")
        print(f"📋 GET /tasks - project: {project}, status: {status}, include_scheduled: {include_scheduled}")
        print(f"🔍 USER DEBUG: Current user ID: {current_user_id}, Email: {current_user.email}")
        
        # Build query - include tasks owned by user OR where user is a participant
        from sqlalchemy import or_, text
        query = Task.query.filter(
            or_(
                Task.owner_id == current_user_id,
                text("participants @> :email").params(email=f'["{current_user.email}"]')
            )
        )
        
        # Handle missing columns gracefully
        if project:
            # Check if project column exists, otherwise filter by text/notes
            try:
                query = query.filter(Task.project == project)
            except:
                # Fallback to text field if project column doesn't exist
                query = query.filter(Task.text.ilike(f'%{project}%'))
        
        if status:
            # Handle comma-separated status values
            if ',' in status:
                status_list = [s.strip() for s in status.split(',')]
                query = query.filter(Task.status.in_(status_list))
            else:
                query = query.filter(Task.status == status)
        
        if not include_scheduled:
            # Only show active tasks (not scheduled for future)
            try:
                query = query.filter(Task.is_active == True)
            except:
                # If is_active column doesn't exist, don't filter
                pass
        
        # Handle ordering gracefully
        try:
            tasks = query.order_by(Task.project.asc(), Task.priority.desc(), Task.created_at.desc()).all()
        except:
            # Fallback ordering if project column doesn't exist
            tasks = query.order_by(Task.priority.desc(), Task.created_at.desc()).all()
        
        print(f"📊 Found {len(tasks)} tasks")
        for task in tasks:
            print(f"  - Task: {getattr(task, 'title', 'No title')} | Status: {task.status} | Project: {getattr(task, 'project', 'No project')}")
        
        # Group tasks by project
        projects = {}
        for task in tasks:
            # Get project name safely
            project_name = getattr(task, 'project', None) or 'personal'
            if project_name not in projects:
                projects[project_name] = []
            projects[project_name].append(task.to_dict())
        
        print(f"📁 Grouped into {len(projects)} projects: {list(projects.keys())}")
        
        return jsonify({
            'projects': projects,
            'total_tasks': len(tasks)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/tasks', methods=['POST'])
@jwt_required()
def create_task():
    """Create a new task"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'project']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Handle date parsing
        scheduled_date = None
        if data.get('scheduled_date'):
            try:
                date_str = data['scheduled_date'].replace('Z', '') if data['scheduled_date'].endswith('Z') else data['scheduled_date']
                scheduled_date = datetime.fromisoformat(date_str)
            except ValueError as e:
                return jsonify({'error': f'Invalid scheduled_date format: {data["scheduled_date"]}'}), 400
        
        due_date = None
        if data.get('due_date'):
            try:
                date_str = data['due_date'].replace('Z', '') if data['due_date'].endswith('Z') else data['due_date']
                due_date = datetime.fromisoformat(date_str)
            except ValueError as e:
                return jsonify({'error': f'Invalid due_date format: {data["due_date"]}'}), 400
        
        # Determine if task is scheduled for future
        is_scheduled = scheduled_date is not None
        is_active = not is_scheduled or (scheduled_date and scheduled_date <= datetime.utcnow())

        # Get assign_to email
        assign_to_email = data.get('assign_to')
        
        print(f"🔍 TASK ASSIGNMENT DEBUG: assign_to_email = {assign_to_email}")
        
        # Validate assign_to is from user's group
        if assign_to_email:
            # Get user's group members
            user_preferences = current_user.user_preferences or {}
            group_members = user_preferences.get('group_members', [])
            group_emails = [member.get('email') for member in group_members if member.get('status') == 'approved']
            
            if assign_to_email not in group_emails:
                return jsonify({'error': f'User {assign_to_email} must be in your group to be assigned tasks.'}), 400
        
        # Create the main task (owned by creator)
        task = Task(
            id=str(uuid.uuid4()),
            title=data['title'],
            description=data.get('description', ''),
            project=data['project'],
            status=data.get('status', 'todo'),
            priority=data.get('priority', 'medium'),
            scheduled_date=scheduled_date,
            due_date=due_date,
            is_scheduled=is_scheduled,
            is_active=is_active,
            owner_id=current_user_id,
            created_by=current_user_id,
            assign_to=assign_to_email,
            participants=[],  # Empty participants - managed at project level
            text=data['title']  # Set text field to avoid NOT NULL constraint violation
        )
        
        db.session.add(task)
        db.session.commit()
        
        # Notify assigned user about the new task
        if assign_to_email and assign_to_email != current_user.email:
            print(f"🔔 Sending task assignment notification to {assign_to_email}")
            notification_service.send_task_assignment_notification(task, assign_to_email)
        else:
            print(f"🔔 No notification sent - assign_to_email: {assign_to_email}, current_user.email: {current_user.email}")
        
        print(f"✅ TASK CREATED: Task created with ID {task.id}, assign_to: {assign_to_email}")
        
        return jsonify({
            'message': 'Task created successfully',
            'task': task.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/tasks/<task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    """Update a task"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        task = Task.query.get(task_id)
        if not task:
            return jsonify({'error': 'Task not found'}), 404
        
        # Check if user owns this task OR is a participant in the project
        from sqlalchemy import or_, text
        user_can_edit = (
            task.owner_id == current_user_id or
            text("participants @> :email").params(email=f'["{current_user.email}"]').evaluate(task.participants)
        )
        
        if not user_can_edit:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        # Update fields that exist in the new model
        if 'title' in data:
            task.title = data['title']
        if 'description' in data:
            task.description = data['description']
        if 'project' in data:
            task.project = data['project']
        if 'status' in data:
            task.status = data['status']
        if 'priority' in data:
            task.priority = data['priority']
        if 'assign_to' in data:
            # Validate assign_to is from user's group
            assign_to_email = data['assign_to']
            if assign_to_email:
                user_preferences = current_user.user_preferences or {}
                group_members = user_preferences.get('group_members', [])
                group_emails = [member.get('email') for member in group_members if member.get('status') == 'approved']
                
                if assign_to_email not in group_emails:
                    return jsonify({'error': f'User {assign_to_email} must be in your group to be assigned tasks.'}), 400
            
            task.assign_to = assign_to_email
        if 'due_date' in data and data['due_date']:
            try:
                date_str = data['due_date'].replace('Z', '') if data['due_date'].endswith('Z') else data['due_date']
                task.due_date = datetime.fromisoformat(date_str)
            except ValueError:
                return jsonify({'error': f'Invalid due_date format: {data["due_date"]}'}), 400
        if 'scheduled_date' in data:
            if data['scheduled_date']:
                try:
                    date_str = data['scheduled_date'].replace('Z', '') if data['scheduled_date'].endswith('Z') else data['scheduled_date']
                    task.scheduled_date = datetime.fromisoformat(date_str)
                except ValueError:
                    return jsonify({'error': f'Invalid scheduled_date format: {data["scheduled_date"]}'}), 400
            else:
                task.scheduled_date = None
        
        # Update is_scheduled and is_active based on scheduled_date
        task.is_scheduled = task.scheduled_date is not None
        task.is_active = not task.is_scheduled or (task.scheduled_date and task.scheduled_date <= datetime.utcnow())
        
        task.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Notify assigned user about the task update
        if task.assign_to and task.assign_to != current_user.email:
            notification_service.send_task_assignment_notification(task, task.assign_to)
        
        return jsonify(task.to_dict())
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/tasks/<task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    """Delete a task"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        task = Task.query.get(task_id)
        if not task:
            return jsonify({'error': 'Task not found'}), 404
        
        # Check if user owns this task
        if task.owner_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        db.session.delete(task)
        db.session.commit()
        
        return jsonify({'message': 'Task deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tasks_bp.route('/projects/<project_name>/participants', methods=['GET'])
@jwt_required()
def get_project_participants(project_name):
    """Get participants for a specific project"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get all tasks for this project owned by current user
        project_tasks = Task.query.filter(
            Task.project == project_name,
            Task.owner_id == current_user_id
        ).all()
        
        # Get unique participants from all tasks in this project
        all_participants = set()
        for task in project_tasks:
            if task.participants:
                all_participants.update(task.participants)
        
        return jsonify({
            'success': True,
            'participants': list(all_participants)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/projects/<project_name>/participants', methods=['POST'])
@jwt_required()
def update_project_participants(project_name):
    """Update participants for all tasks in a project"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        participants = data.get('participants', [])
        
        # Validate participants are from user's group
        if participants:
            user_preferences = current_user.user_preferences or {}
            group_members = user_preferences.get('group_members', [])
            group_emails = [member.get('email') for member in group_members if member.get('status') == 'approved']
            
            invalid_participants = [p for p in participants if p not in group_emails]
            if invalid_participants:
                return jsonify({'error': f'Invalid participants: {invalid_participants}. Only group members can be added to projects.'}), 400
        
        # Update all tasks in this project owned by current user
        project_tasks = Task.query.filter(
            Task.project == project_name,
            Task.owner_id == current_user_id
        ).all()
        
        updated_count = 0
        for task in project_tasks:
            task.participants = participants
            updated_count += 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Updated participants for {updated_count} tasks in project "{project_name}"',
            'participants': participants
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Share functionality removed - SharedData model deleted
