from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dal.models import Person, User
from dal.database import db
import pandas as pd
import io
import json

csv_simple_bp = Blueprint('csv_simple', __name__)

@csv_simple_bp.route('/csv/columns', methods=['POST'])
@jwt_required()
def get_csv_columns():
    """Get CSV columns - simplified version based on working example"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Read CSV with pandas (much more robust)
        file.seek(0)
        content = file.read()
        
        # Try different encodings
        for encoding in ['utf-8', 'latin-1', 'cp1252']:
            try:
                df = pd.read_csv(io.StringIO(content.decode(encoding)), nrows=5)
                break
            except:
                continue
        else:
            return jsonify({'error': 'Could not decode CSV file'}), 400
        
        print(f"🔍 CSV SIMPLE DEBUG: Columns detected: {list(df.columns)}")
        print(f"🔍 CSV SIMPLE DEBUG: First row: {df.iloc[0].to_dict()}")
        
        return jsonify({
            'success': True,
            'columns': list(df.columns),
            'sample_data': df.to_dict(orient='records')
        })
        
    except Exception as e:
        print(f"❌ CSV SIMPLE DEBUG: Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@csv_simple_bp.route('/csv/preview-simple', methods=['POST'])
@jwt_required()
def preview_csv_simple():
    """Preview CSV data - simplified version"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Read CSV with pandas
        file.seek(0)
        content = file.read()
        
        # Try different encodings
        for encoding in ['utf-8', 'latin-1', 'cp1252']:
            try:
                df = pd.read_csv(io.StringIO(content.decode(encoding)))
                break
            except:
                continue
        else:
            return jsonify({'error': 'Could not decode CSV file'}), 400
        
        print(f"🔍 CSV SIMPLE PREVIEW: Total rows: {len(df)}")
        print(f"🔍 CSV SIMPLE PREVIEW: Columns: {list(df.columns)}")
        
        # Simple mapping based on column names
        mapping = {}
        for col in df.columns:
            col_lower = col.lower().strip()
            if 'name' in col_lower and 'first' in col_lower:
                mapping[col] = 'first_name'
            elif 'name' in col_lower and 'last' in col_lower:
                mapping[col] = 'last_name'
            elif 'email' in col_lower or 'e-mail' in col_lower:
                mapping[col] = 'email'
            elif 'phone' in col_lower or 'tel' in col_lower:
                mapping[col] = 'phone'
            elif 'company' in col_lower or 'org' in col_lower:
                mapping[col] = 'organization'
        
        print(f"🔍 CSV SIMPLE PREVIEW: Auto-mapping: {mapping}")
        
        # Preview first 5 rows
        preview_data = []
        for idx, row in df.head(5).iterrows():
            preview_data.append({
                'row_number': idx + 2,  # +2 because pandas is 0-indexed and we skip header
                'data': row.to_dict(),
                'mapped_data': {mapping.get(k, k): v for k, v in row.to_dict().items()}
            })
        
        return jsonify({
            'success': True,
            'total_rows': len(df),
            'columns': list(df.columns),
            'mapping': mapping,
            'preview_data': preview_data
        })
        
    except Exception as e:
        print(f"❌ CSV SIMPLE PREVIEW DEBUG: Error: {str(e)}")
        return jsonify({'error': str(e)}), 500
