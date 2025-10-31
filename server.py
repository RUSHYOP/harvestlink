#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from flask import Flask, jsonify, request, render_template, redirect, url_for
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

# --- Helper functions ---
def read_json(filename):
    filepath = os.path.join('data', filename)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return None

def write_json(filename, data):
    filepath = os.path.join('data', filename)
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error writing {filepath}: {e}")
        return False

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


# --- API Routes --- (No changes below this line)
@app.route('/api/users', methods=['GET'])
def get_users():
    users = read_json('users.json')
    return jsonify(users)

@app.route('/api/users', methods=['POST'])
def add_user():
    users = read_json('users.json')
    new_user = request.json
    if any(u['email'] == new_user['email'] for u in users.get('users', [])):
        return jsonify({'error': 'Email already registered'}), 400
    users.get('users', []).append(new_user)
    if write_json('users.json', users):
        return jsonify({'success': True, 'user': new_user})
    return jsonify({'error': 'Failed to save user'}), 500

@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    inventory = read_json('inventory.json')
    return jsonify(inventory)

@app.route('/api/inventory', methods=['POST'])
def add_inventory():
    inventory = read_json('inventory.json')
    new_item = request.json
    inventory.get('inventory', []).append(new_item)
    if write_json('inventory.json', inventory):
        return jsonify({'success': True, 'item': new_item})
    return jsonify({'error': 'Failed to save inventory'}), 500

@app.route('/api/inventory/<item_id>', methods=['PUT'])
def update_inventory(item_id):
    inventory = read_json('inventory.json')
    updated_item = request.json
    for i, item in enumerate(inventory.get('inventory', [])):
        if item['id'] == item_id:
            inventory['inventory'][i] = updated_item
            if write_json('inventory.json', inventory):
                return jsonify({'success': True, 'item': updated_item})
            return jsonify({'error': 'Failed to update inventory'}), 500
    return jsonify({'error': 'Item not found'}), 404

@app.route('/api/inventory/<item_id>', methods=['DELETE'])
def delete_inventory(item_id):
    inventory = read_json('inventory.json')
    inventory['inventory'] = [item for item in inventory.get('inventory', []) if item['id'] != item_id]
    if write_json('inventory.json', inventory):
        return jsonify({'success': True})
    return jsonify({'error': 'Failed to delete inventory'}), 500

@app.route('/api/orders', methods=['GET'])
def get_orders():
    orders = read_json('orders.json')
    return jsonify(orders)

@app.route('/api/orders', methods=['POST'])
def add_order():
    orders = read_json('orders.json')
    new_order = request.json
    orders.get('orders', []).append(new_order)
    if write_json('orders.json', orders):
        return jsonify({'success': True, 'order': new_order})
    return jsonify({'error': 'Failed to save order'}), 500

@app.route('/api/orders/<order_id>', methods=['PUT'])
def update_order(order_id):
    orders = read_json('orders.json')
    updated_order = request.json
    for i, order in enumerate(orders.get('orders', [])):
        if order['id'] == order_id:
            orders['orders'][i] = updated_order
            if write_json('orders.json', orders):
                return jsonify({'success': True, 'order': updated_order})
            return jsonify({'error': 'Failed to update order'}), 500
    return jsonify({'error': 'Order not found'}), 404

@app.route('/api/crops', methods=['GET'])
def get_crops():
    crops = read_json('crops.json')
    return jsonify(crops)

if __name__ == '__main__':
    print("=" * 60)
    print("HARVEST LINK SERVER STARTING...")
    print(f"Server running at: http://localhost:3000")
    print("=" * 60)
    app.run(host='0.0.0.0', port=3000, debug=True)