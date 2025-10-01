#!/usr/bin/env python3
"""
WhatsApp Token Refresh Scheduler

This script runs as a background task to periodically refresh WhatsApp access tokens
before they expire. It can be run as a separate process or integrated into the main app.
"""

import os
import time
import logging
import threading
from datetime import datetime, timedelta
from services.whatsapp_service import whatsapp_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('token_refresh_scheduler')

class TokenRefreshScheduler:
    def __init__(self, refresh_interval_minutes: int = 30):
        """
        Initialize the token refresh scheduler
        
        Args:
            refresh_interval_minutes: How often to check and refresh tokens (default: 30 minutes)
        """
        self.refresh_interval = refresh_interval_minutes * 60  # Convert to seconds
        self.running = False
        self.thread = None
        
    def start(self):
        """Start the token refresh scheduler in a background thread"""
        if self.running:
            logger.warning("Token refresh scheduler is already running")
            return
            
        self.running = True
        self.thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self.thread.start()
        logger.info(f"Token refresh scheduler started (checking every {self.refresh_interval // 60} minutes)")
    
    def stop(self):
        """Stop the token refresh scheduler"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        logger.info("Token refresh scheduler stopped")
    
    def _run_scheduler(self):
        """Main scheduler loop"""
        while self.running:
            try:
                # Check if token needs refresh
                if whatsapp_service.enabled:
                    current_time = datetime.now()
                    
                    # Check if token expires in the next 10 minutes
                    if (whatsapp_service.token_expires_at and 
                        current_time + timedelta(minutes=10) >= whatsapp_service.token_expires_at):
                        
                        logger.info("Token expires soon, refreshing...")
                        success = whatsapp_service.refresh_access_token()
                        
                        if success:
                            logger.info("Token refreshed successfully")
                        else:
                            logger.error("Failed to refresh token")
                    else:
                        logger.debug("Token is still valid, no refresh needed")
                
                # Wait for next check
                time.sleep(self.refresh_interval)
                
            except Exception as e:
                logger.error(f"Error in token refresh scheduler: {e}", exc_info=True)
                # Wait a bit before retrying
                time.sleep(60)

def run_standalone():
    """Run the scheduler as a standalone process"""
    logger.info("Starting WhatsApp token refresh scheduler (standalone mode)")
    
    scheduler = TokenRefreshScheduler(refresh_interval_minutes=30)
    
    try:
        scheduler.start()
        
        # Keep the main thread alive
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        logger.info("Received interrupt signal, shutting down...")
        scheduler.stop()
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        scheduler.stop()

if __name__ == "__main__":
    run_standalone()
