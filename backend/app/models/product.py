from app import db
from datetime import datetime


class Product(db.Model):
    """Product/Clothing item in an outlet's inventory"""
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    outlet_id = db.Column(db.Integer, db.ForeignKey('outlets.id'), nullable=False, index=True)
    
    # Basic info
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # Outerwear, Dresses, Pants, T-Shirts, etc.
    price = db.Column(db.Numeric(10, 2), nullable=False)
    stock_status = db.Column(db.String(20), default='in_stock')  # in_stock, low_stock, out_of_stock
    
    # Clothing type for try-on
    clothing_type = db.Column(db.String(20), default='upper')  # upper, lower, full
    
    # Images
    image_url = db.Column(db.String(255))
    additional_images = db.Column(db.Text) # JSON list of strings
    
    # Segmentation data (for future use)
    segmentation_mask_path = db.Column(db.String(255))
    segmentation_ready = db.Column(db.Boolean, default=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        import json
        add_imgs = []
        if self.additional_images:
            try:
                add_imgs = json.loads(self.additional_images)
            except:
                add_imgs = []

        return {
            'id': self.id,
            'outlet_id': self.outlet_id,
            'name': self.name,
            'category': self.category,
            'price': float(self.price) if self.price else 0,
            'stock_status': self.stock_status,
            'clothing_type': self.clothing_type,
            'image_url': self.image_url,
            'additional_images': add_imgs,
            'segmentation_ready': self.segmentation_ready,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
