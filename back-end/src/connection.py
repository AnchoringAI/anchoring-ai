"""Connection."""
import redis
from flask_sqlalchemy import SQLAlchemy

from config import app

db = SQLAlchemy()

redis_host = app.config.get("REDIS_HOST")
redis_port = app.config.get("REDIS_PORT")
r = redis.Redis(host=redis_host, port=redis_port)
