"""Quota API."""
from flask import Blueprint, jsonify, g
from werkzeug.exceptions import BadRequest
from services.quota_service import QuotaService
from core.auth.authenticator import login_required, get_current_user

quota_api_v1 = Blueprint('quota_api_v1', __name__, url_prefix='/v1/quota')


@quota_api_v1.before_request
@login_required
def load_user_id():
    """Load user ID."""
    g.current_user_id = get_current_user().get_id()


@quota_api_v1.route('/check', methods=['GET'])
@login_required
def get_quota():
    """Get quota."""
    try:
        user_id = g.current_user_id
        result = QuotaService.check_user_quota(user_id)
        if "error" in result:
            raise BadRequest(result["error"])
        return jsonify(result)
    except BadRequest as e:
        return jsonify(error=str(e)), 400

# @quota_api_v1.route('/update', methods=['POST'])
# @login_required
# def update_quota():
#     try:
#         user_id = g.current_user_id
#         amount = request.json.get('amount')
#         if not amount:
#             raise BadRequest("Amount not provided")

#         result = QuotaService.update_user_quota(user_id, amount)
#         if "error" in result:
#             raise BadRequest(result["error"])
#         return response(result)
#     except BadRequest as e:
#         return response(str(e), 400)
