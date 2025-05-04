from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# In-memory storage
scanned_barcodes = []
data_file = 'scan_history.json'

@app.route('/api/scan', methods=['POST'])
def receive_scan():
    data = request.json
    
    # Validate incoming data
    if not data or 'barcode' not in data:
        return jsonify({'status': 'error', 'message': 'Missing barcode data'}), 400
    
    # Add timestamp if not provided
    if 'timestamp' not in data:
        data['timestamp'] = datetime.now().isoformat()
    
    # Store the scan
    scanned_barcodes.append(data)
    
    # Save to a file for persistence
    with open(data_file, 'w') as f:
        json.dump(scanned_barcodes, f, indent=2)
    
    # Return success response
    return jsonify({
        'status': 'success', 
        'message': f'Barcode {data["barcode"]} received from {data.get("location", "unknown")}',
        'scan_count': len(scanned_barcodes)
    })

@app.route('/api/scans', methods=['GET'])
def get_scans():
    # Return all scans
    return jsonify(scanned_barcodes)

if __name__ == '__main__':
    # Try to load existing data
    try:
        if os.path.exists(data_file):
            with open(data_file, 'r') as f:
                scanned_barcodes = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        scanned_barcodes = []
    
    # Run the Flask app
    app.run(debug=True, host='0.0.0.0', port=5000)