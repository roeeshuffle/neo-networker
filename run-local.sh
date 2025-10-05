#!/bin/bash

# Local Development Script for Neo Networker
# This script helps you run the application locally with Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to create .env.local if it doesn't exist
setup_env() {
    if [ ! -f ".env.local" ]; then
        print_status "Creating .env.local file..."
        cp env.local .env.local
        print_success "Created .env.local file"
    else
        print_status ".env.local already exists"
    fi
}

# Function to start the application
start_app() {
    print_status "Starting Neo Networker local development environment..."
    
    # Stop any existing containers
    print_status "Stopping existing containers..."
    docker-compose -f docker-compose.local.yml down --remove-orphans
    
    # Build and start services
    print_status "Building and starting services..."
    docker-compose -f docker-compose.local.yml up --build -d
    
    print_success "Application started successfully!"
    print_status "Services available at:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:5002"
    echo "  - PostgreSQL: localhost:5432"
    echo ""
    print_status "To view logs: docker-compose -f docker-compose.local.yml logs -f"
    print_status "To stop: docker-compose -f docker-compose.local.yml down"
}

# Function to stop the application
stop_app() {
    print_status "Stopping Neo Networker local development environment..."
    docker-compose -f docker-compose.local.yml down
    print_success "Application stopped"
}

# Function to show logs
show_logs() {
    print_status "Showing application logs..."
    docker-compose -f docker-compose.local.yml logs -f
}

# Function to reset database
reset_db() {
    print_warning "This will delete all local data. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Resetting database..."
        docker-compose -f docker-compose.local.yml down -v
        docker-compose -f docker-compose.local.yml up -d postgres
        sleep 5
        docker-compose -f docker-compose.local.yml up -d
        print_success "Database reset complete"
    else
        print_status "Database reset cancelled"
    fi
}

# Function to show status
show_status() {
    print_status "Checking service status..."
    docker-compose -f docker-compose.local.yml ps
}

# Function to show help
show_help() {
    echo "Neo Networker Local Development Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start the local development environment"
    echo "  stop      Stop the local development environment"
    echo "  restart   Restart the local development environment"
    echo "  logs      Show application logs"
    echo "  status    Show service status"
    echo "  reset-db  Reset the database (WARNING: deletes all data)"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs"
    echo "  $0 stop"
}

# Main script logic
case "${1:-start}" in
    start)
        check_docker
        setup_env
        start_app
        ;;
    stop)
        stop_app
        ;;
    restart)
        stop_app
        sleep 2
        start_app
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    reset-db)
        reset_db
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
