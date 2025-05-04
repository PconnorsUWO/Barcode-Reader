# server/app/api/scan.py
from flask import Blueprint, request, jsonify
from ..core.models import ScanIn
from ..core.pipeline import ingest_scan

bp = Blueprint("scan", __name__, url_prefix="/api")

@bp.route("/scan", methods=["POST"])
def post_scan():
    try:
        payload = ScanIn(**request.json)          
        result  = ingest_scan(payload)           
        return jsonify(result), 201
    except ValueError as e:                  
        return jsonify({"status": "error", "msg": str(e)}), 400

@bp.route("/scans", methods=["GET"])
def list_scans():
    scans = ingest_scan.storage.fetch_all()       # simple indirection
    return jsonify(scans)
