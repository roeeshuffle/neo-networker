from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Task, User, SharedData
from database import db
from datetime import datetime
import uuid

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    """Get all tasks for the current user"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get tasks owned by user or shared with user
        tasks = Task.query.filter(
            (Task.owner_id == current_user_id) |
            (Task.id.in_(
                db.session.query(SharedData.record_id).filter(
                    SharedData.shared_with_user_id == current_user_id,
                    SharedData.table_name == 'tasks'
                )
            ))
        ).order_by(Task.created_at.desc()).all()
        
        return jsonify([task.to_dict() for task in tasks])
        
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
        print(f"🔍 Debug - Received task data: {data}")
        
        # Generate sequential task_id
        max_task_id = db.session.query(db.func.max(Task.task_id)).filter(
            Task.owner_id == current_user_id,
            Task.task_id.isnot(None)
        ).scalar() or 0
        next_task_id = max_task_id + 1
        
        print(f"DEBUG: max_task_id={max_task_id}, next_task_id={next_task_id}")
        
        # Handle date parsing with debug logging
        due_date = None
        if data.get('due_date'):
            try:
                # Remove 'Z' suffix if present (from JavaScript toISOString())
                date_str = data['due_date'].replace('Z', '') if data['due_date'].endswith('Z') else data['due_date']
                due_date = datetime.fromisoformat(date_str)
                print(f"🔍 Debug - Parsed due_date: {due_date}")
            except ValueError as e:
                print(f"🔍 Debug - Error parsing due_date '{data['due_date']}': {e}")
                return jsonify({'error': f'Invalid due_date format: {data["due_date"]}'}), 400
        
        alert_time = None
        if data.get('alert_time'):
            try:
                # Remove 'Z' suffix if present (from JavaScript toISOString())
                alert_str = data['alert_time'].replace('Z', '') if data['alert_time'].endswith('Z') else data['alert_time']
                alert_time = datetime.fromisoformat(alert_str)
                print(f"🔍 Debug - Parsed alert_time: {alert_time}")
            except ValueError as e:
                print(f"🔍 Debug - Error parsing alert_time '{data['alert_time']}': {e}")
                return jsonify({'error': f'Invalid alert_time format: {data["alert_time"]}'}), 400

        task = Task(
            id=str(uuid.uuid4()),
            task_id=next_task_id,
            text=data['text'],
            assign_to=data.get('assign_to'),
            due_date=due_date,
            status=data.get('status', 'todo'),
            label=data.get('label'),
            priority=data.get('priority', 'medium'),
            notes=data.get('notes'),
            alert_time=alert_time,
            owner_id=current_user_id,
            created_by=current_user_id
        )
        
        print(f"DEBUG: Created task with task_id={task.task_id}")
        
        db.session.add(task)
        db.session.commit()
        
        print(f"DEBUG: After commit, task_id={task.task_id}")
        
        return jsonify(task.to_dict()), 201
        
    except Exception as e:
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
        
        task.text = data.get('text', task.text)
        task.assign_to = data.get('assign_to', task.assign_to)
        task.due_date = datetime.fromisoformat(data['due_date']) if data.get('due_date') else task.due_date
        task.status = data.get('status', task.status)
        task.label = data.get('label', task.label)
        task.priority = data.get('priority', task.priority)
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

@tasks_bp.route('/tasks/<task_id>/share', methods=['POST'])
@jwt_required()
def share_task(task_id):
    """Share a task with another user"""
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
        shared_with_user_id = data.get('shared_with_user_id')
        
        if not shared_with_user_id:
            return jsonify({'error': 'shared_with_user_id is required'}), 400
        
        # Check if user exists
        shared_with_user = User.query.get(shared_with_user_id)
        if not shared_with_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Create shared data record
        shared_data = SharedData(
            id=str(uuid.uuid4()),
            owner_id=current_user_id,
            shared_with_user_id=shared_with_user_id,
            table_name='tasks',
            record_id=task_id
        )
        
        db.session.add(shared_data)
        db.session.commit()
        
        return jsonify(shared_data.to_dict()), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
