from flask import current_app

from core.auth.authenticator import get_current_user
from model.user import DbUserApiKey


def get_current_user_api_keys(t=None):
    user = get_current_user()
    if not user:
        return []
    if t:
        api_keys = DbUserApiKey.query.filter_by(user_id=user.get_id(), api_type=t).order_by(
            DbUserApiKey.create_at.desc()).all()
    else:
        api_keys = DbUserApiKey.query.filter_by(user_id=user.get_id()).order_by(
            DbUserApiKey.create_at.desc()).all()
    return list(map(lambda x: x.as_dict(), api_keys))


def get_current_user_api_key_type_or_none(t):
    api_keys = get_current_user_api_keys(t)
    if len(api_keys) == 0:
        return None
    return api_keys[-1]


def get_current_user_api_key_type_or_public(t):
    api_key = get_current_user_api_key_type_or_none(t)
    if api_key:
        return api_key['api_key']
    return current_app.config.get("OPENAI_API_KEY")  # currently only openai is supported


def get_current_user_specified_api_key(t, key):
    user = get_current_user()
    return DbUserApiKey.query.filter_by(
        user_id=user.get_id(), api_type=t, api_key=key).first()

def get_selected_user_api_key_type_or_none(t, user_id):
    api_keys = DbUserApiKey.query.filter_by(user_id=user_id, api_type=t).all()
    api_keys = list(map(lambda x: x.as_dict(), api_keys))
    if len(api_keys) == 0:
        return None
    return api_keys[-1]