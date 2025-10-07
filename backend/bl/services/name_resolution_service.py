from dal.models.user import User
from dal.database import db
import re
from typing import List, Dict, Optional, Tuple

class NameResolutionService:
    """Service to resolve names to emails from user's group members"""
    
    @staticmethod
    def resolve_name_to_email(user: User, name: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Resolve a name to an email from the user's group members.
        
        Args:
            user: The user whose group to search in
            name: The name to resolve (can be partial)
            
        Returns:
            Tuple of (email, error_message)
            - If exact match: (email, None)
            - If multiple matches: (None, "Multiple matches found: ...")
            - If no match: (None, "No user found with name: ...")
        """
        if not name or not name.strip():
            return None, "Name cannot be empty"
        
        # Get user's group members
        user_preferences = user.user_preferences or {}
        group_members = user_preferences.get('group_members', [])
        
        if not group_members:
            return None, "No group members found. Add users to your group first."
        
        # Clean the input name
        search_name = name.strip().lower()
        
        # Find exact matches first
        exact_matches = []
        partial_matches = []
        
        for member in group_members:
            if member.get('status') != 'approved':
                continue
                
            member_email = member.get('email', '')
            member_name = member.get('full_name', '')
            
            if not member_email or not member_name:
                continue
            
            # Check for exact match (case insensitive)
            if member_name.lower() == search_name:
                exact_matches.append({
                    'email': member_email,
                    'name': member_name
                })
            # Check for partial match
            elif search_name in member_name.lower():
                partial_matches.append({
                    'email': member_email,
                    'name': member_name
                })
        
        # If we have exact matches, use the first one
        if exact_matches:
            return exact_matches[0]['email'], None
        
        # If we have partial matches, check if there's only one
        if len(partial_matches) == 1:
            return partial_matches[0]['email'], None
        
        # If multiple matches, return error with options
        if len(partial_matches) > 1:
            match_list = ", ".join([f"{m['name']} ({m['email']})" for m in partial_matches])
            return None, f"Multiple users found with name '{name}': {match_list}. Please be more specific."
        
        # No matches found
        return None, f"No user found with name '{name}' in your group."
    
    @staticmethod
    def resolve_participants(user: User, participants: List[Dict]) -> Tuple[List[Dict], Optional[str]]:
        """
        Resolve participant names to emails.
        
        Args:
            user: The user whose group to search in
            participants: List of participant objects with 'name' and optional 'email'
            
        Returns:
            Tuple of (resolved_participants, error_message)
        """
        if not participants:
            return [], None
        
        resolved_participants = []
        errors = []
        
        for participant in participants:
            name = participant.get('name', '')
            email = participant.get('email', '')
            
            # If email is already provided, use it
            if email:
                resolved_participants.append({
                    'email': email,
                    'name': name or email
                })
                continue
            
            # Try to resolve name to email
            if name:
                resolved_email, error = NameResolutionService.resolve_name_to_email(user, name)
                if resolved_email:
                    resolved_participants.append({
                        'email': resolved_email,
                        'name': name
                    })
                else:
                    errors.append(error)
            else:
                errors.append("Participant must have either name or email")
        
        if errors:
            return [], f"Errors resolving participants: {'; '.join(errors)}"
        
        return resolved_participants, None
    
    @staticmethod
    def get_group_members_list(user: User) -> str:
        """
        Get a formatted list of group members for error messages.
        
        Args:
            user: The user whose group to list
            
        Returns:
            Formatted string of group members
        """
        user_preferences = user.user_preferences or {}
        group_members = user_preferences.get('group_members', [])
        
        if not group_members:
            return "No group members found."
        
        approved_members = [m for m in group_members if m.get('status') == 'approved']
        
        if not approved_members:
            return "No approved group members found."
        
        member_list = []
        for member in approved_members:
            name = member.get('full_name', '')
            email = member.get('email', '')
            if name and email:
                member_list.append(f"{name} ({email})")
        
        return "Available group members: " + ", ".join(member_list)
