from .auth import auth_bp
from .people import people_bp
from .tasks import tasks_bp
from .csv import csv_bp
from .telegram import telegram_bp

__all__ = ['auth_bp', 'people_bp', 'tasks_bp', 'csv_bp', 'telegram_bp']
