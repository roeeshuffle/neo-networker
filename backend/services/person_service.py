from models import Person, User, SharedData, db
from datetime import datetime
import uuid

class PersonService:
    @staticmethod
    def get_people_for_user(user_id):
        """Get all people accessible to a user (owned or shared)"""
        return Person.query.filter(
            (Person.owner_id == user_id) |
            (Person.id.in_(
                db.session.query(SharedData.record_id).filter(
                    SharedData.shared_with_user_id == user_id,
                    SharedData.table_name == 'people'
                )
            ))
        ).order_by(Person.created_at.desc()).all()
    
    @staticmethod
    def create_person(user_id, person_data):
        """Create a new person"""
        person = Person(
            id=str(uuid.uuid4()),
            full_name=person_data['full_name'],
            company=person_data.get('company'),
            categories=person_data.get('categories'),
            email=person_data.get('email'),
            newsletter=person_data.get('newsletter', False),
            status=person_data.get('status'),
            linkedin_profile=person_data.get('linkedin_profile'),
            poc_in_apex=person_data.get('poc_in_apex'),
            who_warm_intro=person_data.get('who_warm_intro'),
            agenda=person_data.get('agenda'),
            meeting_notes=person_data.get('meeting_notes'),
            should_avishag_meet=person_data.get('should_avishag_meet', False),
            more_info=person_data.get('more_info'),
            owner_id=user_id,
            created_by=user_id
        )
        
        db.session.add(person)
        db.session.commit()
        
        return person
    
    @staticmethod
    def update_person(person_id, user_id, person_data):
        """Update a person"""
        person = Person.query.get(person_id)
        if not person:
            raise ValueError('Person not found')
        
        # Check if user owns this person
        if person.owner_id != user_id:
            raise ValueError('Unauthorized')
        
        person.full_name = person_data.get('full_name', person.full_name)
        person.company = person_data.get('company', person.company)
        person.categories = person_data.get('categories', person.categories)
        person.email = person_data.get('email', person.email)
        person.newsletter = person_data.get('newsletter', person.newsletter)
        person.status = person_data.get('status', person.status)
        person.linkedin_profile = person_data.get('linkedin_profile', person.linkedin_profile)
        person.poc_in_apex = person_data.get('poc_in_apex', person.poc_in_apex)
        person.who_warm_intro = person_data.get('who_warm_intro', person.who_warm_intro)
        person.agenda = person_data.get('agenda', person.agenda)
        person.meeting_notes = person_data.get('meeting_notes', person.meeting_notes)
        person.should_avishag_meet = person_data.get('should_avishag_meet', person.should_avishag_meet)
        person.more_info = person_data.get('more_info', person.more_info)
        person.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return person
    
    @staticmethod
    def delete_person(person_id, user_id):
        """Delete a person"""
        person = Person.query.get(person_id)
        if not person:
            raise ValueError('Person not found')
        
        # Check if user owns this person
        if person.owner_id != user_id:
            raise ValueError('Unauthorized')
        
        db.session.delete(person)
        db.session.commit()
        
        return True
    
    @staticmethod
    def share_person(person_id, owner_id, shared_with_user_id):
        """Share a person with another user"""
        person = Person.query.get(person_id)
        if not person:
            raise ValueError('Person not found')
        
        # Check if user owns this person
        if person.owner_id != owner_id:
            raise ValueError('Unauthorized')
        
        # Check if user exists
        shared_with_user = User.query.get(shared_with_user_id)
        if not shared_with_user:
            raise ValueError('User not found')
        
        # Check if already shared
        existing_share = SharedData.query.filter_by(
            owner_id=owner_id,
            shared_with_user_id=shared_with_user_id,
            table_name='people',
            record_id=person_id
        ).first()
        
        if existing_share:
            raise ValueError('Person already shared with this user')
        
        # Create shared data record
        shared_data = SharedData(
            id=str(uuid.uuid4()),
            owner_id=owner_id,
            shared_with_user_id=shared_with_user_id,
            table_name='people',
            record_id=person_id
        )
        
        db.session.add(shared_data)
        db.session.commit()
        
        return shared_data
