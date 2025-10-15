import os
import time
import logging
from datetime import datetime, timedelta
from bl.services.notification_service import notification_service
from dal.database import db

logger = logging.getLogger('scheduler_service')

class SchedulerService:
    """Service for running scheduled tasks like event reminders"""
    
    def __init__(self):
        self.running = False
    
    def start_scheduler(self):
        """Start the scheduler in a separate thread"""
        import threading
        
        def run_scheduler():
            self.running = True
            logger.info("Event reminder scheduler started")
            
            while self.running:
                try:
                    # Check for event reminders every minute
                    notification_service.check_and_send_event_reminders()
                    
                    # Sleep for 60 seconds
                    time.sleep(60)
                    
                except Exception as e:
                    logger.error(f"Error in scheduler: {e}")
                    time.sleep(60)  # Sleep even if there's an error
        
        scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
        scheduler_thread.start()
        logger.info("Scheduler thread started")
    
    def stop_scheduler(self):
        """Stop the scheduler"""
        self.running = False
        logger.info("Event reminder scheduler stopped")

# Create global instance
scheduler_service = SchedulerService()
