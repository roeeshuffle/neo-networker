"""
API Routes for Plan Management
Handles user plan operations
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bl.services.user_preferences_service import UserPreferencesService
from dal.models.user import User
import logging
import os

# Try to import stripe, but don't fail if it's not available
try:
    import stripe
    STRIPE_AVAILABLE = True
except ImportError:
    STRIPE_AVAILABLE = False
    stripe = None

logger = logging.getLogger(__name__)

plan_bp = Blueprint('plan', __name__)

@plan_bp.route('/plan', methods=['GET'])
@jwt_required()
def get_user_plan():
    """Get user's current plan"""
    try:
        current_user_id = get_jwt_identity()
        
        plan = UserPreferencesService.get_user_plan(current_user_id)
        
        return jsonify({
            'success': True,
            'plan': plan
        })
        
    except Exception as e:
        logger.error(f"Error getting user plan: {e}")
        return jsonify({'error': str(e)}), 500

@plan_bp.route('/plan', methods=['POST'])
@jwt_required()
def update_user_plan():
    """Update user's plan"""
    try:
        current_user_id = get_jwt_identity()
        
        data = request.get_json()
        if not data or 'plan' not in data:
            return jsonify({'error': 'Missing plan data'}), 400
        
        plan = data['plan']
        
        success = UserPreferencesService.update_user_plan(current_user_id, plan)
        
        if success:
            logger.info(f"Updated plan to {plan} for user {current_user_id}")
            return jsonify({
                'success': True,
                'message': f'Plan updated to {plan} successfully',
                'plan': plan
            })
        else:
            return jsonify({'error': f'Failed to update plan to {plan}'}), 500
        
    except Exception as e:
        logger.error(f"Error updating user plan: {e}")
        return jsonify({'error': str(e)}), 500

@plan_bp.route('/plan-details/<plan_name>', methods=['GET'])
@jwt_required()
def get_plan_details(plan_name):
    """Get details for a specific plan"""
    try:
        plan_details = UserPreferencesService.get_plan_details(plan_name)
        
        return jsonify({
            'success': True,
            'plan_details': plan_details
        })
        
    except Exception as e:
        logger.error(f"Error getting plan details for {plan_name}: {e}")
        return jsonify({'error': str(e)}), 500

@plan_bp.route('/all-plans', methods=['GET'])
@jwt_required()
def get_all_plans():
    """Get details for all available plans"""
    try:
        plans = ['Starter', 'Pro', 'Business']
        all_plans = {}
        
        for plan in plans:
            all_plans[plan] = UserPreferencesService.get_plan_details(plan)
        
        return jsonify({
            'success': True,
            'plans': all_plans
        })
        
    except Exception as e:
        logger.error(f"Error getting all plans: {e}")
        return jsonify({'error': str(e)}), 500

@plan_bp.route('/stripe-portal-session', methods=['POST'])
@jwt_required()
def create_stripe_portal_session():
    """Create a Stripe customer portal session"""
    try:
        logger.info(f"Stripe portal session request - STRIPE_AVAILABLE: {STRIPE_AVAILABLE}")
        logger.info(f"Stripe module: {stripe}")
        
        if not STRIPE_AVAILABLE:
            logger.error("Stripe integration not available")
            return jsonify({'error': 'Stripe integration not available'}), 500
        
        current_user_id = get_jwt_identity()
        logger.info(f"Creating portal session for user: {current_user_id}")
        
        # Get user from database
        user = User.query.get(current_user_id)
        if not user:
            logger.error(f"User not found: {current_user_id}")
            return jsonify({'error': 'User not found'}), 404
        
        logger.info(f"User found: {user.email}, stripe_customer_id: {user.stripe_customer_id}")
        
        # Check if user has a Stripe customer ID
        if not user.stripe_customer_id:
            logger.warning(f"No Stripe customer ID for user: {current_user_id}")
            return jsonify({'error': 'No Stripe customer found. Please contact support.'}), 400
        
        # Set Stripe API key
        stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
        if not stripe.api_key:
            logger.error('STRIPE_SECRET_KEY not found in environment variables')
            return jsonify({'error': 'Stripe configuration error'}), 500
        
        logger.info(f"Stripe API key set: {stripe.api_key[:10]}...")
        
        # Create portal session
        logger.info("Creating Stripe portal session...")
        
        # Check if billing portal Session is available (restricted keys may not have access)
        if not hasattr(stripe.billing_portal, 'Session'):
            logger.error("Stripe billing portal Session not available - likely using restricted key")
            return jsonify({'error': 'Billing portal not available with current API key. Please contact support.'}), 400
        
        portal_session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/subscription"
        )
        
        logger.info(f"Created Stripe portal session for user {current_user_id}")
        
        return jsonify({
            'success': True,
            'portal_url': portal_session.url
        })
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating portal session: {e}")
        return jsonify({'error': f'Stripe error: {str(e)}'}), 500
    except Exception as e:
        logger.error(f"Error creating Stripe portal session: {e}")
        return jsonify({'error': str(e)}), 500

@plan_bp.route('/stripe-checkout-session', methods=['POST'])
@jwt_required()
def create_stripe_checkout_session():
    """Create a Stripe Checkout session for subscription"""
    try:
        logger.info(f"Stripe checkout session request - STRIPE_AVAILABLE: {STRIPE_AVAILABLE}")
        
        if not STRIPE_AVAILABLE:
            logger.error("Stripe integration not available")
            return jsonify({'error': 'Stripe integration not available'}), 500
        
        current_user_id = get_jwt_identity()
        logger.info(f"Creating checkout session for user: {current_user_id}")
        
        # Get user from database
        user = User.query.get(current_user_id)
        if not user:
            logger.error(f"User not found: {current_user_id}")
            return jsonify({'error': 'User not found'}), 404
        
        # Get plan from request
        data = request.get_json()
        if not data or 'plan' not in data:
            return jsonify({'error': 'Missing plan data'}), 400
        
        plan_name = data['plan']
        logger.info(f"Creating checkout session for plan: {plan_name}")
        
        # Get plan details
        plan_details = UserPreferencesService.get_plan_details(plan_name)
        if not plan_details:
            return jsonify({'error': f'Invalid plan: {plan_name}'}), 400
        
        # Set Stripe API key
        stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
        if not stripe.api_key:
            logger.error('STRIPE_SECRET_KEY not found in environment variables')
            return jsonify({'error': 'Stripe configuration error'}), 500
        
        logger.info(f"Stripe API key set: {stripe.api_key[:10]}...")
        
        # Create checkout session using PaymentLink (newer Stripe API)
        logger.info("Creating Stripe checkout session...")
        
        # First, create a product
        product = stripe.Product.create(
            name=f'{plan_name} Plan',
            description=plan_details.get('description', ''),
        )
        
        # Then create a price
        price = stripe.Price.create(
            unit_amount=2000,  # $20.00 in cents - you'll need to set real prices
            currency='usd',
            recurring={'interval': 'month'},
            product=product.id,
        )
        
        # Finally create a payment link
        payment_link = stripe.PaymentLink.create(
            line_items=[{
                'price': price.id,
                'quantity': 1,
            }],
            after_completion={
                'type': 'redirect',
                'redirect': {
                    'url': f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/subscription?success=true",
                },
            },
            metadata={
                'user_id': current_user_id,
                'plan': plan_name,
            }
        )
        
        logger.info(f"Created Stripe checkout session for user {current_user_id}")
        
        return jsonify({
            'success': True,
            'checkout_url': payment_link.url
        })
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating checkout session: {e}")
        return jsonify({'error': f'Stripe error: {str(e)}'}), 500
    except Exception as e:
        logger.error(f"Error creating Stripe checkout session: {e}")
        return jsonify({'error': str(e)}), 500
