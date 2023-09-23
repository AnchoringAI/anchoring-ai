from datetime import datetime
from enum import Enum

from sqlalchemy import String, DateTime, INTEGER, JSON
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey

from connection import db
from model.base import DbBase
from util.uid_gen import gen_uuid


class TaskStatus(Enum):
    queued = 1
    running = 2
    completed = 3
    failed = 4
    stopped = 5

    @staticmethod
    def get_key_from_value(value):
        for key, member in TaskStatus.__members__.items():
            if member.value == value:
                return key


class DbAppBuild(DbBase):
    __tablename__ = 't_app'

    id = db.Column(String(36), primary_key=True,
                   nullable=False, unique=True, default=gen_uuid())
    app_name = db.Column(String(200), nullable=False)
    created_by = db.Column(
        db.String(36), ForeignKey('t_user.id'), nullable=False)
    created_at = db.Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(DateTime, nullable=False, default=datetime.utcnow)
    tags = db.Column(JSON, nullable=True)
    published = db.Column(db.Boolean, nullable=False, default=False)
    chain = db.Column(JSON, nullable=True)
    deleted_at = db.Column(DateTime, nullable=True)

    user = relationship("DbUser", backref='apps')

    def __init__(self, id, app_name, created_by, tags, published, chain):
        self.id = id
        self.app_name = app_name
        self.created_by = created_by
        self.tags = tags
        self.published = published
        self.chain = chain


class DbAppTask(DbBase):
    __tablename__ = 't_task'

    id = db.Column(String(36), primary_key=True, nullable=False, unique=True)
    task_name = db.Column(String(200), nullable=False)
    created_by = db.Column(
        db.String(36), ForeignKey('t_user.id'), nullable=False)
    app_id = db.Column(String(36), ForeignKey('t_app.id'), nullable=False)
    file_id = db.Column(String(36), ForeignKey('t_file.id'), nullable=False)
    created_at = db.Column(DateTime, nullable=False, default=datetime.utcnow)
    status = db.Column(INTEGER, nullable=False,
                       default=TaskStatus.queued.value)
    completed_at = db.Column(DateTime, nullable=True, default=None)
    published = db.Column(db.Boolean, nullable=False, default=False)
    deleted_at = db.Column(DateTime, nullable=True, default=None)
    result = db.Column(JSON, default=None)
    message = db.Column(JSON, default=None)

    user = relationship("DbUser", backref='tasks')
    app = relationship("DbAppBuild")
    file = relationship("DbFile")

    def __init__(self, id, task_name, created_by, created_at, app_id, file_id, published):
        self.id = id
        self.task_name = task_name
        self.created_by = created_by
        self.created_at = created_at
        self.app_id = app_id
        self.file_id = file_id
        self.published = published
