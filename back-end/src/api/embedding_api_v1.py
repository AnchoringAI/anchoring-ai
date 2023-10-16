"""Embedding API."""
import json
from datetime import datetime
from math import ceil

from celery.result import AsyncResult
from flask import Blueprint, request, jsonify, current_app, g

from connection import db
from core.auth.authenticator import login_required, get_current_user
from core.interface.ops_interface import start_embedding_task, doc_search
from model.file import DbFile, DbEmbedding, TaskStatus
from model.types import LlmApiType
from model.user import DbUser
from services.user_api_key_service import get_current_user_api_key_type_or_public

embedding_api_v1 = Blueprint(
    'embedding_api_v1', __name__, url_prefix='/v1/embedding')


@embedding_api_v1.before_request
@login_required
def load_user_id():
    """Load user ID."""
    g.current_user_id = get_current_user().get_id()


@embedding_api_v1.route('/create', methods=['POST'])
@login_required
def create_embedding_func():
    """Create embedding function."""
    data = json.loads(request.data)

    embedding_name = data.get("embedding_name", None)
    file_id = data.get("file_id", None)
    doc_transformer = data.get("doc_transformer", None)
    embedding_model = data.get("embedding_model", None)
    vector_store = data.get("vector_store", None)
    if (embedding_name is None or
        file_id is None or
        doc_transformer is None or
        embedding_model is None or
            vector_store is None):
        return {
            "message":
            "Must provide: embedding_name, file_id, doc_transformer, embedding_model, vector_store"
        }, 400

    created_by = g.current_user_id
    if created_by is None:
        return {"message": "No created_by id provided"}, 400

    vector_store_params_dict = vector_store["parameters"]
    vector_store_params_dict["db_path"] = current_app.config["VECTOR_STORE"]["db_path"]

    llm_api_key_dict = {
        "openai_api_key": get_current_user_api_key_type_or_public(LlmApiType.OPENAI.value)}

    embedding_config = {"doc_transformer": doc_transformer,
                        "embedding_model": embedding_model,
                        "vector_store": vector_store}

    file_data = DbFile.query.filter(
        DbFile.id == file_id, DbFile.deleted_at.is_(None),
        (DbFile.uploaded_by == g.current_user_id) |
        (DbFile.published is True)).first()
    if file_data is None:
        return {"message": "File not found"}, 400

    text = file_data.content.get("text", None)

    if text is None or len(text) == 0:
        return {"message": "File is empty"}, 400

    embedding_id = start_embedding_task(doc_transformer["type"],
                                        doc_transformer["parameters"],
                                        embedding_model["model_provider"],
                                        embedding_model["parameters"],
                                        vector_store["vector_store_provider"],
                                        vector_store_params_dict,
                                        text, embedding_name, created_by, file_id, llm_api_key_dict,
                                        embedding_config)

    if embedding_id is None:
        return jsonify({"embedding_id": None, "success": False})

    return jsonify({"embedding_id": embedding_id, "success": True})


@embedding_api_v1.route('/status/<embedding_id>', methods=['GET'])
@login_required
def embedding_task_status_func(embedding_id):
    """Embedding task status function."""
    embedding_build = DbEmbedding.query.filter(
        DbEmbedding.id == embedding_id,
        (DbEmbedding.created_by == g.current_user_id) |
        (DbEmbedding.publish is True)).first()

    if embedding_build is None:
        return {"message": "embedding id is invalid"}, 400

    embedding_build_status = embedding_build.status
    embedding_build_result = embedding_build.result
    embedding_build_message = embedding_build.message

    if embedding_build_status is None:
        status = None
    else:
        status = TaskStatus.get_key_from_value(embedding_build_status)

    if embedding_build_result is None:
        progress = None
    else:
        progress = embedding_build_result.get("progress", None)

    if embedding_build_message is None:
        message = None
    else:
        message = embedding_build_message.get("message", None)

    return {"status": status, "progress": progress, "message": message}


@embedding_api_v1.route('/stop/<embedding_id>', methods=['GET'])
@login_required
def stop_embedding_task_func(embedding_id):
    """Stop embedding task function."""
    embedding_build = DbEmbedding.query.filter(
        DbEmbedding.id == embedding_id, DbEmbedding.created_by == g.current_user_id).first()

    if embedding_build is None:
        return jsonify({"message": "embedding id is invalid"}), 400

    # Create AsyncResult object
    async_result = AsyncResult(embedding_id)

    # Check if the task is already completed
    if async_result.ready():
        # Task is already completed, no need to terminate
        return jsonify({"success": False, "message": "embedding completed"})

    # Terminate the task
    async_result.revoke(terminate=True, signal="SIGTERM", wait=True, timeout=5)

    # Task successfully terminated
    embedding_build.status = TaskStatus.STOPPED.value
    embedding_build.completed_at = datetime.utcnow()
    db.session.commit()

    return jsonify({"success": True, "message": "embedding stopped"})


@embedding_api_v1.route('/list', methods=['GET'])
@login_required
def list_embedding_task_func():
    """List embedding task function."""
    params = request.args
    page = int(params.get('page', 1))
    size = int(params.get('size', 20))
    created_by = params.get('created_by', None)
    file_id = params.get('file_id', None)

    query = DbEmbedding.query.join(DbUser).filter(DbEmbedding.deleted_at.is_(
        None), (DbEmbedding.created_by == g.current_user_id) |
        (DbEmbedding.published is True)).order_by(DbEmbedding.created_at.desc())

    if created_by is not None:
        query = query.filter(DbEmbedding.created_by == created_by)

    if file_id is not None:
        query = query.filter(DbEmbedding.file_id == file_id)

    total_files = query.count()

    total_pages = ceil(total_files / size)

    embeddings = query.offset((page - 1) * size).limit(size).all()

    embedding_list = list(map(lambda t: {
        "id": t.id,
        "embedding_name": t.embedding_name,
        "created_by": t.created_by,
        "created_by_username": t.user.username,
        "file_id": t.file_id,
        "created_at": t.created_at,
        "published": t.published,
        "status": TaskStatus.get_key_from_value(t.status),
        "progress": t.result.get("progress", None) if t.result is not None else None,
        "message": t.message.get("message", None) if t.message is not None else None,
        "completed_at": t.completed_at
    }, embeddings))

    return jsonify({"embeddings": embedding_list, "total_pages": total_pages})


@embedding_api_v1.route('/delete/<embedding_id>', methods=['DELETE'])
@login_required
def delete_embedding_task_func(embedding_id):
    """Delete embedding task function."""
    embedding_build = DbEmbedding.query.filter(
        DbEmbedding.id == embedding_id,
        DbEmbedding.deleted_at.is_(None),
        DbEmbedding.created_by == g.current_user_id).first()

    if embedding_build is None:
        return jsonify({"message": "embedding id is invalid"}), 400

    embedding_build.deleted_at = datetime.utcnow()
    db.session.commit()

    return {"success": True, "message": "Embedding deleted successfully"}, 200


@embedding_api_v1.route('/publish/<embedding_id>', methods=['POST'])
@login_required
def publish_embedding(embedding_id):
    """Publish embedding."""
    if not embedding_id:
        return {"message": "Missing embedding id in the URL."}, 400

    embedding_build = DbEmbedding.query.filter(
        DbEmbedding.id == embedding_id,
        DbEmbedding.deleted_at.is_(None),
        DbEmbedding.created_by == g.current_user_id,
        DbEmbedding.status == 3).first()

    if not embedding_build:
        return {"message": "No embedded file found with given ID."}, 400

    embedding_build.published = 1
    db.session.commit()

    return {"success": True, "message": "Embedded file published successfully"}, 200


@embedding_api_v1.route('/search', methods=['POST'])
@login_required
def search_func():
    """Search function."""
    data = json.loads(request.data)
    embedding_id = data["embedding_id"]
    data_input = data["input"]
    params_dict = data["parameters"]
    input_variables = data.get("input_variables", None)

    llm_api_key_dict = {
        "openai_api_key": get_current_user_api_key_type_or_public(LlmApiType.OPENAI.value)}

    embedding_build = DbEmbedding.query.filter(
        DbEmbedding.id == embedding_id, DbEmbedding.deleted_at.is_(
            None), (DbEmbedding.created_by == g.current_user_id) |
        (DbEmbedding.published is True)).first()

    if embedding_build is None:
        return jsonify({"message": "embedding id is invalid"}), 400

    res = doc_search(embedding_id, data_input, params_dict,
                     llm_api_key_dict, input_variables)

    return jsonify({"result": res})
