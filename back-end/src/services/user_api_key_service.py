"""User API key service."""
from flask import current_app

from core.auth.authenticator import get_current_user
from model.user import DbUserApiKey


def get_current_user_api_keys(t=None):
    """Get current user API keys."""
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
    """Get current user API key type or None."""
    api_keys = get_current_user_api_keys(t)
    if len(api_keys) == 0:
        return None
    return api_keys[-1]


def get_current_user_api_key_type_or_public(t):
    """Get current user API key type or public."""
    api_key = get_current_user_api_key_type_or_none(t)
    if api_key:
        return api_key['api_key']
    elif t == "openai":
        return current_app.config.get("OPENAI_API_KEY")
    elif t == "anthropic":
        return current_app.config.get("ANTHROPIC_API_KEY")
    elif t == "google_search":
        return current_app.config.get("GOOGLE_SEARCH_API_KEY")
    else:
        return api_key


def get_current_user_specified_api_key(t, key):
    """Get current user specified API key."""
    user = get_current_user()
    return DbUserApiKey.query.filter_by(
        user_id=user.get_id(), api_type=t, api_key=key).first()


def get_selected_user_api_key_type_or_none(t, user_id):
    """Get selected user API key type or none."""
    api_keys = DbUserApiKey.query.filter_by(user_id=user_id, api_type=t).all()
    api_keys = list(map(lambda x: x.as_dict(), api_keys))
    if len(api_keys) == 0:
        return None
    return api_keys[-1]
