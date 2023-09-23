import os

import langchain
from flask import Response
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from langchain.cache import InMemoryCache

from api.app_api_v1 import app_api_v1
from api.file_api_v1 import file_api_v1
from api.task_api_v1 import task_api_v1
from api.user_api_v1 import user_api_v1
from api.quota_api_v1 import quota_api_v1
from api.embedding_api_v1 import embedding_api_v1
from api.shared_link_api_v1 import shared_link_api_v1
from config import DevelopmentConfig, app
from connection import db
from util.celery_init import celery_init_app


CORS(app)
# todo: Distinguish between environment variables to obtain different configurations
app.config.from_object(DevelopmentConfig)

app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
jwt = JWTManager(app)

celery_app = celery_init_app(app)

db.init_app(app)
langchain.llm_cache = InMemoryCache()

# print(os.getenv("OPENAI_API_KEY"))
# openai.api_key = os.getenv("OPENAI_API_KEY")
# openai.Model.list()

app.register_blueprint(app_api_v1)
app.register_blueprint(task_api_v1)
app.register_blueprint(user_api_v1)
app.register_blueprint(quota_api_v1)
app.register_blueprint(file_api_v1)
app.register_blueprint(embedding_api_v1)
app.register_blueprint(shared_link_api_v1)


@app.route('/ping')
def ping_pong():  # put application's code here
    return Response('Pong!')


if __name__ == '__main__':
    app.run(port=5001, debug=True)
