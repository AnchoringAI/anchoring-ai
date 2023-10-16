"""User."""
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime
from werkzeug.security import generate_password_hash, check_password_hash

from connection import db
from util.uid_gen import gen_uuid
from model.base import DbBase


class DbUser(DbBase):
    """DB user."""
    __tablename__ = 't_user'

    id = db.Column(String(36), primary_key=True, nullable=False,
                   unique=True, default=gen_uuid)
    username = db.Column(String(20), nullable=False, unique=False)
    email = db.Column(String(120), nullable=False, unique=True)
    password_hash = db.Column(String(128), nullable=False)
    active = db.Column(db.Boolean, default=True)
    authenticated = db.Column(db.Boolean, default=True)
    anonymous = db.Column(db.Boolean, default=False)
    create_at = db.Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # pylint: disable=super-init-not-called
    def __init__(self, username, email, password):
        self.username = username
        self.email = email
        self.set_password(password)

    def set_password(self, password):
        """Set password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check password."""
        return check_password_hash(self.password_hash, password)

    def get_id(self):
        """Get ID."""
        return str(self.id)

    def is_active(self):
        """Whether the user is active."""
        return self.active

    def is_authenticated(self):
        """Whether the user is authenticated."""
        return self.authenticated

    def is_anonymous(self):
        """Whether the user is anonymous."""
        return self.anonymous


# pylint: disable=too-few-public-methods
class DbUserApiKey(DbBase):
    """DB user API key."""
    __tablename__ = 't_user_api_key'

    id = db.Column(String(36), primary_key=True,
                   nullable=False, default=gen_uuid())
    user_id = db.Column(String(200), nullable=False, )
    api_key = db.Column(String(200), nullable=False)
    api_type = db.Column(String(200), nullable=False)
    create_at = db.Column(DateTime, nullable=False, default=datetime.utcnow)
    valid = db.Column(db.Boolean, default=True)


class DbUserQuota(DbBase):
    """DB user quota."""
    __tablename__ = 't_user_quota'
    user_id = Column(String, primary_key=True, index=True)
    quota_available = Column(Integer, nullable=False, default=100)
    quota_used = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime, nullable=False)

    def update_quota(self, amount):
        """Update quota."""
        self.quota_used += amount
        self.quota_available -= amount
        self.updated_at = datetime.utcnow()
        if self.quota_available < 0:
            raise ValueError(
                "Quota limit exceeded. Please provide your API key.")
