import secrets
import os

from flask import Flask

from util.logger import Logger


app = Flask(__name__)


class BaseConfig(object):
    DIALECT = 'mysql'
    DRIVER = 'pymysql'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = True


class DevelopmentConfig(BaseConfig):
    USERNAME = 'llm_ops'
    PASSWORD = '123'
    HOST = 'localhost'
    PORT = '3306'
    DATABASE = 'llm'
    DB_URI = 'mysql+pymysql://{}:{}@{}:{}/{}?charset=utf8'.format(
        USERNAME, PASSWORD, HOST, PORT, DATABASE)
    SQLALCHEMY_DATABASE_URI = DB_URI
    SECRET_KEY = secrets.token_urlsafe(32)
    REDIS_HOST = "localhost"
    REDIS_PORT = 3306
    CELERY = dict(
        broker_url="redis://localhost:6379/0",
        result_backend="redis://localhost:6379/1"
    )
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    VECTOR_STORE = dict(
        db_path= os.path.join(os.path.dirname(os.path.abspath(__file__)), "vector_store/lancedb")
    )


logger = Logger("LLM_Ops_Logger", level="INFO")
