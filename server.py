#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from flask import Flask, jsonify, request, render_template, redirect, url_for
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, DuplicateKeyError
import os
import logging
from datetime import datetime
from functools import wraps
import re

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JSON_SORT_KEYS'] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max request size

# Logging configuration
# Use StreamHandler only for Vercel compatibility (no file system writes)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# --- MongoDB Connection ---
def get_db():
    """Initialize and return MongoDB database connection"""
    try:
        mongodb_uri = os.environ.get('MONGODB_URI')
        if not mongodb_uri:
            raise ValueError("MONGODB_URI environment variable not set")
        
        client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
        # Test connection
        client.admin.command('ping')
        
        db_name = os.environ.get('DATABASE_NAME', 'harvestlink')
        db = client[db_name]
        
        logger.info(f"Successfully connected to MongoDB database: {db_name}")
        return db
    except ConnectionFailure as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise
    except Exception as e:
        logger.error(f"Error initializing MongoDB: {e}")
        raise

# Initialize database - Lazy initialization for serverless
db = None
users_collection = None
inventory_collection = None
orders_collection = None
crops_collection = None

def init_db():
    """Initialize database connection (called on first request)"""
    global db, users_collection, inventory_collection, orders_collection, crops_collection
    
    if db is not None:
        return db
    
    try:
        db = get_db()
        
        # Create collections
        users_collection = db['users']
        inventory_collection = db['inventory']
        orders_collection = db['orders']
        crops_collection = db['crops']
        
        # Create unique index on email for users
        try:
            users_collection.create_index('email', unique=True)
        except:
            pass  # Index might already exist
        
        logger.info("MongoDB collections initialized successfully")
        return db
    except Exception as e:
        logger.error(f"Failed to initialize MongoDB: {e}")
        return None

# --- Security & Validation ---
def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    """Validate phone number format"""
    pattern = r'^[0-9]{10,15}$'
    return re.match(pattern, phone.replace(' ', '').replace('-', '').replace('+', '')) is not None

def sanitize_input(data):
    """Basic input sanitization"""
    if isinstance(data, str):
        return data.strip()
    return data

# Error handler decorator
def handle_errors(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Initialize database on first request
            if db is None:
                init_db()
            if db is None:
                return jsonify({'error': 'Database connection not available'}), 503
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Error in {f.__name__}: {str(e)}", exc_info=True)
            return jsonify({'error': 'Internal server error', 'message': str(e)}), 500
    return decorated_function

# --- Helper functions ---
def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(d) for d in doc]
    if '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

# --- HTML Page Routes ---
@app.route('/')
def index():
    return render_template('index.html')

# ADDED: Redirect for the old index.html URL
@app.route('/index.html')
def index_redirect():
    return redirect(url_for('index'))

@app.route('/farmer')
def farmer_page():
    return render_template('farmer.html')

@app.route('/buyer')
def buyer_page():
    return render_template('buyer.html')


# --- API Routes ---
@app.route('/api/users', methods=['GET'])
@handle_errors
def get_users():
    """Get all users"""
    users = list(users_collection.find({}, {'password': 0}))  # Don't return passwords
    logger.info(f"Fetched {len(users)} users")
    return jsonify({'users': serialize_doc(users)})

@app.route('/api/users', methods=['POST'])
@handle_errors
def add_user():
    """Register a new user with validation"""
    if not request.json:
        return jsonify({'error': 'No data provided'}), 400
    
    new_user = request.json
    
    # Validate required fields
    required_fields = ['email', 'password', 'firstName', 'lastName', 'phone', 'userType']
    for field in required_fields:
        if field not in new_user:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Validate email and phone
    if not validate_email(new_user['email']):
        return jsonify({'error': 'Invalid email format'}), 400
    
    if not validate_phone(new_user['phone']):
        return jsonify({'error': 'Invalid phone number format'}), 400
    
    # Sanitize inputs
    new_user['email'] = sanitize_input(new_user['email']).lower()
    new_user['firstName'] = sanitize_input(new_user['firstName'])
    new_user['lastName'] = sanitize_input(new_user['lastName'])
    new_user['createdAt'] = datetime.utcnow()
    
    try:
        result = users_collection.insert_one(new_user)
        logger.info(f"New user registered: {new_user['email']} ({new_user['userType']})")
        
        # Return user without password
        response_user = {k: v for k, v in new_user.items() if k != 'password'}
        response_user['_id'] = str(result.inserted_id)
        
        return jsonify({'success': True, 'user': response_user}), 201
    except DuplicateKeyError:
        logger.warning(f"Attempt to register existing email: {new_user['email']}")
        return jsonify({'error': 'Email already registered'}), 400

@app.route('/api/login', methods=['POST'])
@handle_errors
def login():
    """Authenticate user login"""
    if not request.json:
        return jsonify({'error': 'No data provided'}), 400
    
    email = request.json.get('email', '').strip().lower()
    password = request.json.get('password', '')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Find user by email
    user = users_collection.find_one({'email': email})
    
    if not user:
        logger.warning(f"Login attempt with non-existent email: {email}")
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Verify password
    if user.get('password') != password:
        logger.warning(f"Failed login attempt for: {email}")
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Login successful - return user without password
    response_user = {k: v for k, v in user.items() if k != 'password'}
    response_user['_id'] = str(user['_id'])
    
    logger.info(f"Successful login: {email} ({user.get('userType')})")
    return jsonify({'success': True, 'user': response_user}), 200

@app.route('/api/inventory', methods=['GET'])
@handle_errors
def get_inventory():
    """Get all inventory items"""
    inventory = list(inventory_collection.find())
    logger.info(f"Fetched {len(inventory)} inventory items")
    return jsonify({'inventory': serialize_doc(inventory)})

@app.route('/api/inventory', methods=['POST'])
@handle_errors
def add_inventory():
    """Add new inventory item with validation"""
    if not request.json:
        return jsonify({'error': 'No data provided'}), 400
    
    new_item = request.json
    
    # Validate required fields
    required_fields = ['cropName', 'totalQuantity', 'pricePerKg', 'quality', 'farmerId']
    for field in required_fields:
        if field not in new_item:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Validate numeric fields
    try:
        if float(new_item['totalQuantity']) <= 0:
            return jsonify({'error': 'Quantity must be positive'}), 400
        if float(new_item['pricePerKg']) <= 0:
            return jsonify({'error': 'Price must be positive'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid numeric values'}), 400
    
    new_item['createdAt'] = datetime.utcnow()
    new_item['updatedAt'] = datetime.utcnow()
    
    result = inventory_collection.insert_one(new_item)
    new_item['_id'] = str(result.inserted_id)
    
    logger.info(f"New inventory item added: {new_item['cropName']} by farmer {new_item['farmerId']}")
    return jsonify({'success': True, 'item': serialize_doc(new_item)}), 201

@app.route('/api/inventory/<item_id>', methods=['PUT'])
@handle_errors
def update_inventory(item_id):
    """Update existing inventory item"""
    if not request.json:
        return jsonify({'error': 'No data provided'}), 400
    
    updated_item = request.json
    updated_item['updatedAt'] = datetime.utcnow()
    
    # Remove _id if present to avoid update issues
    if '_id' in updated_item:
        del updated_item['_id']
    
    result = inventory_collection.update_one(
        {'id': item_id},
        {'$set': updated_item}
    )
    
    if result.matched_count == 0:
        logger.warning(f"Attempt to update non-existent inventory item: {item_id}")
        return jsonify({'error': 'Item not found'}), 404
    
    logger.info(f"Inventory item updated: {item_id}")
    return jsonify({'success': True, 'item': updated_item})

@app.route('/api/inventory/<item_id>', methods=['DELETE'])
@handle_errors
def delete_inventory(item_id):
    """Delete inventory item"""
    result = inventory_collection.delete_one({'id': item_id})
    
    if result.deleted_count == 0:
        logger.warning(f"Attempt to delete non-existent inventory item: {item_id}")
        return jsonify({'error': 'Item not found'}), 404
    
    logger.info(f"Inventory item deleted: {item_id}")
    return jsonify({'success': True})

@app.route('/api/orders', methods=['GET'])
@handle_errors
def get_orders():
    """Get all orders"""
    orders = list(orders_collection.find())
    logger.info(f"Fetched {len(orders)} orders")
    return jsonify({'orders': serialize_doc(orders)})

@app.route('/api/orders', methods=['POST'])
@handle_errors
def add_order():
    """Create new order with validation"""
    if not request.json:
        return jsonify({'error': 'No data provided'}), 400
    
    new_order = request.json
    
    # Validate required fields
    required_fields = ['buyerId', 'farmerId', 'inventoryId', 'quantity', 'cropName']
    for field in required_fields:
        if field not in new_order:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Validate quantity
    try:
        if float(new_order['quantity']) <= 0:
            return jsonify({'error': 'Quantity must be positive'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid quantity value'}), 400
    
    new_order['createdAt'] = datetime.utcnow()
    new_order['updatedAt'] = datetime.utcnow()
    
    result = orders_collection.insert_one(new_order)
    new_order['_id'] = str(result.inserted_id)
    
    logger.info(f"New order placed: {new_order.get('id', 'N/A')} - {new_order['cropName']} ({new_order['quantity']} kg)")
    return jsonify({'success': True, 'order': serialize_doc(new_order)}), 201

@app.route('/api/orders/<order_id>', methods=['PUT'])
@handle_errors
def update_order(order_id):
    """Update existing order"""
    if not request.json:
        return jsonify({'error': 'No data provided'}), 400
    
    updated_order = request.json
    updated_order['updatedAt'] = datetime.utcnow()
    
    # Remove _id if present
    if '_id' in updated_order:
        del updated_order['_id']
    
    result = orders_collection.update_one(
        {'id': order_id},
        {'$set': updated_order}
    )
    
    if result.matched_count == 0:
        logger.warning(f"Attempt to update non-existent order: {order_id}")
        return jsonify({'error': 'Order not found'}), 404
    
    logger.info(f"Order updated: {order_id} - Status: {updated_order.get('status', 'N/A')}")
    return jsonify({'success': True, 'order': updated_order})

@app.route('/api/crops', methods=['GET'])
@handle_errors
def get_crops():
    """Get all available crop types"""
    # First check if crops exist in database
    crops_count = crops_collection.count_documents({})
    
    if crops_count == 0:
        # Initialize with default crops
        default_crops = {
            'crops': ['Wheat', 'Rice', 'Corn', 'Potato', 'Tomato', 'Onion', 'Carrot'],
            'dairy_products': ['Milk', 'Cheese', 'Butter', 'Yogurt', 'Cream'],
            'other': ['Honey', 'Eggs', 'Herbs']
        }
        crops_collection.insert_one(default_crops)
        return jsonify(default_crops)
    
    crops_data = crops_collection.find_one()
    return jsonify(serialize_doc(crops_data))

# --- Error Handlers ---
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {error}")
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large errors"""
    return jsonify({'error': 'Request entity too large'}), 413

# --- Security Headers ---
@app.after_request
def add_security_headers(response):
    """Add security headers to all responses"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# --- Health Check Endpoint ---
@app.route('/health')
def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Test database connection
        if db is not None:
            db.command('ping')
            db_status = 'connected'
        else:
            db_status = 'disconnected'
    except:
        db_status = 'error'
    
    return jsonify({
        'status': 'healthy' if db_status == 'connected' else 'degraded',
        'database': db_status,
        'timestamp': datetime.utcnow().isoformat(),
        'version': '2.0.0-mongodb'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    debug_mode = os.environ.get('FLASK_ENV', 'development') == 'development'
    
    # Initialize database for local development
    init_db()
    
    logger.info("=" * 60)
    logger.info("HARVEST LINK SERVER (MongoDB) STARTING...")
    logger.info(f"Server running at: http://localhost:{port}")
    logger.info(f"Environment: {'Development' if debug_mode else 'Production'}")
    logger.info(f"Database: MongoDB")
    logger.info("=" * 60)
    
    app.run(host='0.0.0.0', port=port, debug=debug_mode)

# Export app for Vercel
# This allows Vercel to use the app as a WSGI application
application = app