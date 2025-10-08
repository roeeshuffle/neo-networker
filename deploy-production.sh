#!/bin/bash

# Production Deployment Script for Neo Networker
# This script deploys the test branch to production (main branch)
# IMPORTANT: Only run this when explicitly requested by the user

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

# Function to confirm production deployment
confirm_deployment() {
    print_warning "⚠️  PRODUCTION DEPLOYMENT WARNING ⚠️"
    echo ""
    echo "This will deploy the current test branch to PRODUCTION."
    echo "This action will affect live users and data."
    echo ""
    
    # Check if --yes flag is provided
    if [ "$1" = "--yes" ]; then
        print_success "Auto-confirming deployment with --yes flag"
        return 0
    fi
    
    read -p "Are you sure you want to deploy to production? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_error "Deployment cancelled by user"
        exit 1
    fi
}

# Function to check current branch
check_branch() {
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "test" ] && [ "$current_branch" != "main" ]; then
        print_error "You must be on the 'test' or 'main' branch to deploy to production."
        print_status "Current branch: $current_branch"
        print_status "Please switch to test or main branch first"
        exit 1
    fi
    if [ "$current_branch" = "main" ]; then
        print_success "On main branch (already merged from test)"
    else
        print_success "On test branch (correct for production deployment)"
    fi
}

# Function to deploy to production
deploy_to_production() {
    print_status "Starting production deployment..."
    
    current_branch=$(git branch --show-current)
    
    if [ "$current_branch" = "main" ]; then
        print_status "Already on main branch, pushing to production..."
        git push origin main
    else
        # Switch to main branch
        print_status "Switching to main branch..."
        git checkout main
        
        # Merge test branch
        print_status "Merging test branch into main..."
        git merge test
        
        # Push to production
        print_status "Pushing to production..."
        git push origin main
        
        print_success "Production deployment completed!"
        print_status "Switching back to test branch for continued development..."
        git checkout test
    fi
    
    print_success "✅ Production deployment successful!"
    print_status "You can now continue development on the test branch."
}

# Function to show help
show_help() {
    echo "Production Deployment Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  deploy    Deploy test branch to production"
    echo "  help      Show this help message"
    echo ""
    echo "⚠️  WARNING: This script deploys to PRODUCTION!"
    echo "   Only run when explicitly requested by the user."
}

# Main script logic
case "${1:-help}" in
    deploy)
        confirm_deployment --yes
        check_branch
        deploy_to_production
        ;;
    help|*)
        show_help
        ;;
esac