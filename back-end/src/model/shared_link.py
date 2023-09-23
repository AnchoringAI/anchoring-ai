from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from model.base import DbBase
from connection import db
from util.uid_gen import gen_uuid

class DbSharedLink(DbBase):
    __tablename__ = 't_shared_link'

    id = db.Column(String(36), primary_key=True, nullable=False, unique=True, default=gen_uuid())
    created_by = db.Column(String(36), ForeignKey('t_user.id'), nullable=False)
    resource_id = db.Column(String(36), nullable=False)
    resource_type = db.Column(String(20), nullable=False)
    created_at = db.Column(DateTime, nullable=False, default=datetime.utcnow)
    expires_at = db.Column(TIMESTAMP, nullable=True)
    
    user = relationship("DbUser", backref='shared_links')

    def __init__(self, id, created_by, resource_id, resource_type, expires_at=None):
        self.id = id
        self.created_by = created_by
        self.resource_id = resource_id
        self.resource_type = resource_type
        self.expires_at = expires_at

    def as_dict(self, exclude=None):
        if exclude is None:
            exclude = []
        return {c.name: getattr(self, c.name) for c in self.__table__.columns if c.name not in exclude}
