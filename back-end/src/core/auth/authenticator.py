"""Authenticator."""
from functools import wraps

from flask import request, g

from core.auth.extractor import JwtTokenExtractor
from core.auth.token import JwtToken
from services.user_service import get_user_by_id


class Authenticator:
    """Authenticator."""
    def __init__(self, token_extractor: JwtTokenExtractor):
        self._token_extractor = token_extractor

    def authenticate(self, req) -> JwtToken:
        """Authenticate."""
        token = self.extract_token_from_request(req)
        self.assert_login_uniqueness(token)
        self.assert_token_version_up_to_date(token)

        return token

    @staticmethod
    def assert_token_version_up_to_date(token: JwtToken):
        return True

    @staticmethod
    def assert_user_account_validity(token: JwtToken):
        return True

    @staticmethod
    def assert_login_uniqueness(token: JwtToken):
        # TO-DO: session id
        return True

    def extract_token_from_request(self, req):
        """Extract token from request."""
        return self._token_extractor.extract_from(req)


authenticator = Authenticator(JwtTokenExtractor())


def get_current_user():
    """Get current user."""
    return g.current_user


def set_current_user(user):
    """Set current user."""
    g.current_user = user


def login_required(f):
    """Login required."""
    @wraps(f)
    def wrapper(*args, **kw):
        # NOTES:
        # Obsoleted Chengdu third part login validation.
        # But keeping the code for the other third part login.\
        token = authenticator.authenticate(request)
        set_current_user(
            get_user_by_id(token.user_id)
        )
        return f(*args, **kw)

    return wrapper
