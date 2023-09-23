from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime
from werkzeug.security import generate_password_hash, check_password_hash

from connection import db
from model.base import DbBase
from util.uid_gen import gen_uuid


class DbUser(DbBase):
    __tablename__ = 't_user'

    id = db.Column(String(36), primary_key=True, nullable=False, unique=True, default=gen_uuid)
    username = db.Column(String(20), nullable=False, unique=False)
    email = db.Column(String(120), nullable=False, unique=True)
    password_hash = db.Column(String(128), nullable=False)
    active = db.Column(db.Boolean, default=True)
    authenticated = db.Column(db.Boolean, default=True)
    anonymous = db.Column(db.Boolean, default=False)
    create_at = db.Column(DateTime, nullable=False, default=datetime.utcnow)

    def __init__(self, username, email, password):
        self.username = username
        self.email = email
        self.set_password(password)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_id(self):
        return str(self.id)

    def is_active(self):
        return self.active

    def is_authenticated(self):
        return self.authenticated

    def is_anonymous(self):
        return self.anonymous


class DbUserApiKey(DbBase):
    __tablename__ = 't_user_api_key'

    id = db.Column(String(36), primary_key=True, nullable=False, default=gen_uuid())
    user_id = db.Column(String(200), nullable=False, )
    api_key = db.Column(String(200), nullable=False)
    api_type = db.Column(String(200), nullable=False)
    create_at = db.Column(DateTime, nullable=False, default=datetime.utcnow)
    valid = db.Column(db.Boolean, default=True)


class DbUserQuota(DbBase):
    __tablename__ = 't_user_quota'
    user_id = Column(String, primary_key=True, index=True)
    quota_available = Column(Integer, nullable=False, default=100)
    quota_used = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime, nullable=False)

    def update_quota(self, amount):
        self.quota_used += amount
        self.quota_available -= amount
        self.updated_at = datetime.utcnow()
        if self.quota_available < 0:
            raise ValueError("Quota limit exceeded. Please provide your API key.")