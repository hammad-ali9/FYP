from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from app import db
from app.models.product import Product
import os
import uuid

products_bp = Blueprint('products', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@products_bp.route('', methods=['GET'])
def get_products():
    """Get all products, optionally filtered by outlet_id"""
    outlet_id = request.args.get('outlet_id', type=int)
    
    query = Product.query
    if outlet_id:
        query = query.filter_by(outlet_id=outlet_id)
    
    products = query.order_by(Product.created_at.desc()).all()
    return jsonify({
        'success': True,
        'data': [p.to_dict() for p in products],
        'count': len(products)
    })


@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get a single product by ID"""
    product = Product.query.get_or_404(product_id)
    return jsonify({
        'success': True,
        'data': product.to_dict()
    })


@products_bp.route('', methods=['POST'])
def create_product():
    """Create a new product"""
    # Handle JSON data
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict()
    
    # Validate required fields
    required = ['name', 'category', 'price', 'outlet_id']
    for field in required:
        if field not in data:
            return jsonify({
                'success': False,
                'error': f'Missing required field: {field}'
            }), 400
    
    outlet_id = int(data['outlet_id'])
    
    # Check product limit based on subscription
    from app.models.subscription import Subscription
    subscription = Subscription.query.filter_by(outlet_id=outlet_id).first()
    
    if subscription:
        limit = subscription.get_product_limit()
        if limit is not None:  # None means unlimited
            current_count = Product.query.filter_by(outlet_id=outlet_id).count()
            if current_count >= limit:
                return jsonify({
                    'success': False,
                    'error': f'Product limit reached ({limit} products). Please upgrade your plan to add more products.',
                    'limit_reached': True,
                    'current_count': current_count,
                    'limit': limit,
                    'plan': subscription.plan_name
                }), 403
    
    import json
    # Handle file upload if present
    image_url = None
    if 'image' in request.files:
        file = request.files['image']
        if file and file.filename and allowed_file(file.filename):
            filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            image_url = f"/uploads/{filename}"
            
    # Handle additional images (JSON list of URLs expected)
    additional_images = data.get('additional_images', [])
    if isinstance(additional_images, str):
        try:
             additional_images = json.loads(additional_images)
        except:
             additional_images = []
             
    # Create product
    product = Product(
        outlet_id=outlet_id,
        name=data['name'],
        category=data['category'],
        price=float(data['price']),
        stock_status=data.get('stock_status', 'in_stock'),
        clothing_type=data.get('clothing_type', 'upper'),
        image_url=image_url or data.get('image_url'),
        additional_images=json.dumps(additional_images)
    )
    
    db.session.add(product)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': product.to_dict(),
        'message': 'Product created successfully'
    }), 201


@products_bp.route('/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    """Update an existing product"""
    product = Product.query.get_or_404(product_id)
    
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict()
    
    # Update fields if provided
    if 'name' in data:
        product.name = data['name']
    if 'category' in data:
        product.category = data['category']
    if 'price' in data:
        product.price = float(data['price'])
    if 'stock_status' in data:
        product.stock_status = data['stock_status']
    if 'clothing_type' in data:
        product.clothing_type = data['clothing_type']
    if 'image_url' in data:
        product.image_url = data['image_url']
        
    if 'additional_images' in data:
        import json
        imgs = data['additional_images']
        if isinstance(imgs, str):
             try:
                 # Check if it's already a JSON string or just a raw string
                 json.loads(imgs) 
                 product.additional_images = imgs
             except:
                 # It was a raw string or invalid json
                 product.additional_images = json.dumps([])
        elif isinstance(imgs, list):
             product.additional_images = json.dumps(imgs)
    
    # Handle new image upload
    if 'image' in request.files:
        file = request.files['image']
        if file and file.filename and allowed_file(file.filename):
            filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            product.image_url = f"/uploads/{filename}"
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': product.to_dict(),
        'message': 'Product updated successfully'
    })


@products_bp.route('/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    """Delete a product"""
    product = Product.query.get_or_404(product_id)
    
    db.session.delete(product)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Product deleted successfully'
    })


@products_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all unique product categories"""
    categories = db.session.query(Product.category).distinct().all()
    return jsonify({
        'success': True,
        'data': [c[0] for c in categories]
    })
