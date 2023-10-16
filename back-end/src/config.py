"""Config."""
import secrets
import os

from flask import Flask

from util.logger import Logger


app = Flask(__name__)


# pylint: disable=too-few-public-methods
class BaseConfig:
    """Base config."""
    DIALECT = 'mysql'
    DRIVER = 'pymysql'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = True


# pylint: disable=too-few-public-methods
class DevelopmentConfig(BaseConfig):
    """Development config."""
    USERNAME = 'llm_ops'
    PASSWORD = '123'
    HOST = 'localhost'
    PORT = '3306'
    DATABASE = 'llm'
    DB_URI = f'mysql+pymysql://{USERNAME}:{PASSWORD}@{HOST}:{PORT}/{DATABASE}?charset=utf8'
    SQLALCHEMY_DATABASE_URI = DB_URI
    SECRET_KEY = secrets.token_urlsafe(32)
    REDIS_HOST = "localhost"
    REDIS_PORT = 3306
    CELERY = {
        'broker_url': 'redis://localhost:6379/0',
        'result_backend': 'redis://localhost:6379/1'
    }
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    VECTOR_STORE = {
        'db_path': os.path.join(os.path.dirname(os.path.abspath(__file__)), "vector_store/lancedb")
    }


logger = Logger("LLM_Ops_Logger", level="INFO")
