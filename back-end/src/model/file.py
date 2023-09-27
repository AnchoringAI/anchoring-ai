from datetime import datetime
from enum import Enum

from sqlalchemy import String, DateTime, INTEGER
from sqlalchemy.dialects.mysql import JSON, LONGTEXT
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey, PickleType

from model.base import DbBase
from connection import db
from model.application import TaskStatus


class DbFile(DbBase):
    __tablename__ = 't_file'

    id = db.Column(db.String(36), primary_key=True,
                   nullable=False, unique=True)
    name = db.Column(db.String(120))
    type = db.Column(db.String(50))
    uploaded_by = db.Column(
        db.String(36), ForeignKey('t_user.id'), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    size = db.Column(db.Integer)
    content = db.Column(JSON)
    raw_content = db.Column(PickleType)
    published = db.Column(db.Boolean, nullable=False, default=False)
    deleted_at = db.Column(db.DateTime, nullable=True)

    user = relationship("DbUser", backref='files')

    def __init__(self, id, name, type, uploaded_by, uploaded_at, size, content, raw_content, published):
        self.id = id
        self.name = name
        self.type = type
        self.uploaded_by = uploaded_by
        self.uploaded_at = uploaded_at
        self.size = size
        self.content = content
        self.raw_content = raw_content
        self.published = published
        self.deleted_at = None

    def as_dict(self, exclude=None):
        if exclude is None:
            exclude = []
        return {c.name: getattr(self, c.name) for c in self.__table__.columns if c.name not in exclude}


class DbEmbedding(DbBase):
    __tablename__ = 't_embedding'

    id = db.Column(String(36), primary_key=True, nullable=False, unique=True)
    embedding_name = db.Column(String(200), nullable=False)
    created_by = db.Column(
        db.String(36), ForeignKey('t_user.id'), nullable=False)
    file_id = db.Column(String(36), ForeignKey('t_file.id'), nullable=False)
    config = db.Column(JSON, default=None)
    created_at = db.Column(DateTime, nullable=False, default=datetime.utcnow)
    status = db.Column(INTEGER, nullable=False,
                       default=TaskStatus.queued.value)
    completed_at = db.Column(DateTime, nullable=True, default=None)
    published = db.Column(db.Boolean, nullable=False, default=False)
    deleted_at = db.Column(DateTime, nullable=True, default=None)
    result = db.Column(JSON, default=None)
    message = db.Column(JSON, default=None)

    user = relationship("DbUser", backref='embeddings')
    file = relationship("DbFile", backref="embeddings")

    def __init__(self, id, embedding_name, created_by, file_id, published, config):
        self.id = id
        self.embedding_name = embedding_name
        self.created_by = created_by
        self.file_id = file_id
        self.published = published
        self.config = config
