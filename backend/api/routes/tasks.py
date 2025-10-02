from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dal.models import Task, User
from dal.database import db
from datetime import datetime
import uuid

tasks_bp = Blueprint('tasks', __name__)

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
        
        # Build query
        query = Task.query.filter(Task.owner_id == current_user_id)
        
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
            text=data['title']  # Set text field to avoid NOT NULL constraint violation
        )
        
        db.session.add(task)
        db.session.commit()
        
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
        
        # Check if user owns this task
        if task.owner_id != current_user_id:
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

# Share functionality removed - SharedData model deleted
