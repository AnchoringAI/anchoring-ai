from flask import Blueprint, request
from werkzeug.exceptions import BadRequest
from datetime import datetime

from connection import db
from core.auth.authenticator import login_required, get_current_user
from core.auth.token import JwtToken
from model.types import LlmApiType
from model.user import DbUser, DbUserApiKey, DbUserQuota
from services.user_api_key_service import get_current_user_api_keys, get_current_user_specified_api_key
from util.resp import response

user_api_v1 = Blueprint('user_api_v1', __name__, url_prefix='/v1/user')


@user_api_v1.route('/login_required_test', methods=['GET'])
@login_required
def login_required_test():
    user = get_current_user()
    if user:
        return response("The protected page is successfully accessed.")
    return response("Access the protected page failed.")


@user_api_v1.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        raise BadRequest('Please provide both email and password.')

    user = DbUser.query.filter_by(email=email).first()

    if user is not None and user.check_password(password):
        access_token = JwtToken.generate(user.id)
        return response("Login successful. Welcome back!", data={"token": access_token.to_str(),
                                                                 "username": user.username,
                                                                 "id": user.get_id()})
    return response("The provided email or password is incorrect. Please try again.", False, None), 401


@user_api_v1.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        raise BadRequest('Please provide a username, email, and password.')

    if len(username) < 3 or len(username) > 20:
        return response("Username must be between 3 and 20 characters long.", False), 400

    existing_user = DbUser.query.filter_by(email=email).first()
    if existing_user is not None:
        return response(f"The email address {email} is already registered.", False), 400

    user = DbUser(username=username, email=email, password=password)
    db.session.add(user)
    db.session.flush()

    initial_quota = DbUserQuota(
        user_id=user.id, quota_available=100, quota_used=0, updated_at=datetime.utcnow())
    db.session.add(initial_quota)

    db.session.commit()

    access_token = JwtToken.generate(user.id)
    return response("Registration successful.", data={"token": access_token.to_str(),
                                                      "username": user.username,
                                                      "id": user.get_id()})


@user_api_v1.route('/logout', methods=['POST'])
@login_required
def logout():
    # You would add logic here to blacklist the token, perhaps saving its ID
    # to a database of revoked tokens with a timestamp of when it was revoked.
    # You would then update your token validation logic to check this database
    # and reject tokens that have been revoked.

    # Here, we'll just return a success message
    return response("Logout successful."), 200


@user_api_v1.route('/apikey', methods=['POST'])
@login_required
def register_api_key_for_user():
    data = request.json
    api_type = data.get('api_type')
    api_key = data.get('api_key')
    if not api_key:
        return response("Must provide token.", False), 400
    if not api_type or api_type not in LlmApiType.values():
        return response(f"Api type {api_type} not supported.", False), 400
    user_key = get_current_user_specified_api_key(api_type, api_key)
    if not user_key:
        user_key = DbUserApiKey()
        db.session.add(user_key)
    user_key.user_id = get_current_user().get_id()
    user_key.api_type = api_type
    user_key.api_key = api_key
    db.session.commit()

    return response("User's api-key registered.")


@user_api_v1.route('/apikey', methods=['DELETE'])
@login_required
def delete_user_api_key():
    data = request.json
    api_type = data.get('api_type')
    api_key = data.get('api_key')
    if not api_key:
        return response("Must provide token.", False), 400
    if not api_type or api_type not in LlmApiType.values():
        return response(f"Api type {api_type} not supported.", False), 400
    user_key = get_current_user_specified_api_key(api_type, api_key)
    if not user_key:
        return response("Api key does not exist!", False), 400
    db.session.delete(user_key)
    db.session.commit()
    return response("User's api-key removed!")


@user_api_v1.route('/apikey', methods=['GET'])
@login_required
def get_user_api_keys():
    tokens = get_current_user_api_keys()
    return response(data=tokens)
