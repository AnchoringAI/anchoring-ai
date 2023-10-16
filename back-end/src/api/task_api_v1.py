"""Task API."""
import json
from datetime import datetime
from math import ceil

from celery.result import AsyncResult
from flask import Blueprint, request, jsonify, g

from connection import db
from core.auth.authenticator import login_required, get_current_user
from core.interface.ops_interface import (
    text_convert,
    complete,
    tag_parse,
    run_chain,
    start_batch_task,
)
from model.application import DbAppBuild, DbAppTask, TaskStatus
from model.file import DbFile
from model.types import LlmApiType
from model.user import DbUser
from services.user_api_key_service import get_current_user_api_key_type_or_public
from services.quota_service import QuotaService

task_api_v1 = Blueprint('task_api_v1', __name__, url_prefix='/v1/task')


def _adjust_action_list(action_list):
    index = 1
    for action in action_list:
        action["name"] = action["title"]
        index += 1

        if action["type"] in LlmApiType.values():
            action["model_provider"] = action["type"]
            action["type"] = "prompt"

        if action["type"] == "batch-input":
            action["type"] = "table"

        if action["type"] in ("text-input", "output"):
            action["type"] = "text"

        if action["type"] == "tag-parser":
            action["type"] = "tag_parser"
            action["tag"] = action["parameters"]["extract_pattern"]

        if action["type"] == "doc-search":
            action["type"] = "doc_search"

    return action_list


@task_api_v1.before_request
@login_required
def load_user_id():
    """Load user ID."""
    g.current_user_id = get_current_user().get_id()


@task_api_v1.route('/text_convert', methods=['POST'])
@login_required
def text_convert_func():
    """Text convert function."""
    data = json.loads(request.data)
    text_template = data["input"]
    input_variables = data.get("input_variables", None)
    res = text_convert(text_template, input_variables=input_variables)

    return jsonify({"result": res})


@task_api_v1.route('/complete', methods=['POST'])
@login_required
def complete_func():
    """Complete function."""
    try:
        data = json.loads(request.data)
        user_id = g.current_user_id

        # Step 1: Calculate the quota needed
        quota_needed = QuotaService.calculate_model_quota(user_id, data)

        # Step 2: Check the current user's quota
        current_quota = QuotaService.check_user_quota(user_id)
        if current_quota.get('quota_available') < quota_needed:
            return jsonify({"error": "Quota limit exceeded. Please provide your API key."}), 403

        model_provider = data["model_provider"]
        prompt_template = data["input"]
        input_variables = data.get("input_variables", None)
        params_dict = data["parameters"]
        llm_api_key_dict = {
            "openai_api_key": get_current_user_api_key_type_or_public(LlmApiType.OPENAI.value)
        }

        # Step 3: Proceed with the API call
        res = complete(
            prompt_template,
            input_variables=input_variables,
            model_provider=model_provider,
            params_dict=params_dict,
            llm_api_key_dict=llm_api_key_dict
        )

        # Update the quota in the database
        QuotaService.update_user_quota(user_id, quota_needed)

        return jsonify({"result": res})

    except ValueError as e:
        # Step 4: Catch the exception and return the error message
        return jsonify({"error": str(e)}), 403


@task_api_v1.route('/tag_parse', methods=['POST'])
@login_required
def tag_parse_func():
    """Tag parse function."""
    data = json.loads(request.data)
    tag = data["tag"]
    text_template = data["input"]
    input_variables = data.get("input_variables", None)
    res = tag_parse(tag, text_template, input_variables=input_variables)

    return jsonify({"result": res})


@task_api_v1.route('/run_chain', methods=['POST'])
@login_required
def run_chain_func():
    """Run chain function."""
    try:
        data = json.loads(request.data)
        action_list = data["chain"]
        user_id = g.current_user_id

        input_variables = data.get("input_variables", None)
        llm_api_key_dict = {
            "openai_api_key": get_current_user_api_key_type_or_public(LlmApiType.OPENAI.value)}
        action_list = _adjust_action_list(action_list)

        quota_needed = QuotaService.calculate_app_quota(user_id, action_list)
        current_quota = QuotaService.check_user_quota(user_id)
        if current_quota.get('quota_available') < quota_needed:
            return jsonify({"error": "Quota limit exceeded. Please provide your API key."}), 403

        res = run_chain(
            action_list,
            input_variables=input_variables,
            llm_api_key_dict=llm_api_key_dict)

        QuotaService.update_user_quota(user_id, quota_needed)

        return jsonify({"result": res})

    except ValueError as e:
        return jsonify({"error": str(e)}), 403

    except KeyError as e:
        return jsonify({"error": f"Missing key in request data: {str(e)}"}), 400


@task_api_v1.route('/run_chain_v2', methods=['POST'])
@login_required
def run_chain_v2_func():
    """Run chain V2 function."""
    try:
        data = json.loads(request.data)
        app_id = data["app_id"]
        user_id = g.current_user_id

        input_variables = data.get("input_variables", None)
        llm_api_key_dict = {
            "openai_api_key": get_current_user_api_key_type_or_public(LlmApiType.OPENAI.value)}

        app_build = DbAppBuild.query.filter(
            DbAppBuild.id == app_id,
            DbAppBuild.deleted_at.is_(None),
            (DbAppBuild.created_by == g.current_user_id) |
            (DbAppBuild.published is True)).first()

        if app_build is None:
            return {"message": "No application found with given ID."}, 400

        action_list = app_build.chain
        action_list = _adjust_action_list(action_list)

        quota_needed = QuotaService.calculate_app_quota(user_id, action_list)
        current_quota = QuotaService.check_user_quota(user_id)
        if current_quota.get('quota_available') < quota_needed:
            return jsonify({"error": "Quota limit exceeded. Please provide your API key."}), 403

        res = run_chain(action_list, input_variables=input_variables,
                        llm_api_key_dict=llm_api_key_dict)

        QuotaService.update_user_quota(user_id, quota_needed)

        return jsonify({"result": res})

    except ValueError as e:
        return jsonify({"error": str(e)}), 403

    except KeyError as e:
        return jsonify({"error": f"Missing key in request data: {str(e)}"}), 400


@task_api_v1.route('/start', methods=['POST'])
@login_required
def start_batch_task_func():
    """Start batch task function."""
    data = json.loads(request.data)
    task_name = data.get("task_name", None)
    app_id = data.get("app_id", None)
    file_id = data.get("file_id", None)
    created_by = g.current_user_id
    if task_name is None or app_id is None or file_id is None or created_by is None:
        return {"message": "Must provide: task_name, app_id, file_id, created_by"}, 400

    created_at = datetime.utcnow()

    input_variables = data.get("input_variables", None)
    llm_api_key_dict = {
        "openai_api_key": get_current_user_api_key_type_or_public(LlmApiType.OPENAI.value)}

    app_build = DbAppBuild.query.filter(
        DbAppBuild.id == app_id,
        DbAppBuild.deleted_at.is_(None),
        (DbAppBuild.created_by == g.current_user_id) |
        (DbAppBuild.published is True)).first()
    if app_build is None:
        return {"message": "No application found with given ID."}, 400

    file_data = DbFile.query.filter(
        DbFile.id == file_id,
        DbFile.deleted_at.is_(None),
        (DbFile.uploaded_by == g.current_user_id) |
        (DbFile.published is True)).first()
    if file_data is None:
        return {"message": "File not found"}, 400

    action_list = app_build.chain
    action_list = _adjust_action_list(action_list)

    table_list = file_data.content

    if table_list is None or len(table_list) == 0:
        return {"message": "File is empty"}, 400

    task_id = start_batch_task(action_list, input_variables, table_list, task_name,
                               created_by, created_at, app_id, file_id,
                               llm_api_key_dict=llm_api_key_dict)
    if task_id is None:
        return jsonify({"task_id": None, "success": False})

    return jsonify({"task_id": task_id, "success": True})


@task_api_v1.route('/status/<task_id>', methods=['GET'])
@login_required
def batch_task_status_func(task_id):
    """Batch task status function."""
    task_build = DbAppTask.query.filter(
        DbAppTask.id == task_id,
        DbAppTask.deleted_at.is_(None),
        (DbAppTask.created_by == g.current_user_id) |
        (DbAppTask.published is True)).first()

    if task_build is None:
        return {"message": "Task id is invalid"}, 400

    task_build_status = task_build.status
    task_build_result = task_build.result
    task_build_message = task_build.message

    if task_build_status is None:
        status = None
    else:
        status = TaskStatus.get_key_from_value(task_build_status)

    if task_build_result is None:
        progress = None
    else:
        progress = task_build_result.get("progress", None)

    if task_build_message is None:
        message = None
    else:
        message = task_build_message.get("message", None)

    return {"status": status, "progress": progress, "message": message}


@task_api_v1.route('/load/<task_id>', methods=['GET'])
@login_required
def batch_task_load_func(task_id):
    """Batch task load function."""
    task_build = DbAppTask.query.join(DbUser).filter(
        DbAppTask.id == task_id,
        DbAppTask.deleted_at.is_(None),
        (DbAppTask.created_by == g.current_user_id) |
        (DbAppTask.published is True)).first()
    if task_build is None:
        return jsonify({"message": "Task id is invalid"}), 400

    # task_build_status = task_build.status
    # task_build_result = task_build.result
    #
    # if task_build_status is None:
    #     status = None
    # else:
    #     status = TaskStatus.get_key_from_value(task_build_status)
    #
    # if task_build_result is None:
    #     result = None
    # else:
    #     result = task_build_result.get("result", None)

    # return jsonify({"status": status, "result": result})

    task_build_dict = task_build.as_dict()
    task_build_dict['created_by_username'] = task_build.user.username

    if task_build.status is not None:
        task_build_dict["status"] = TaskStatus.get_key_from_value(
            task_build.status)

    if 'result' in task_build_dict and task_build_dict['result']:
        sample_result = {}
        if task_build_dict['result']['result']:
            sample_result = task_build_dict['result']['result'][0]
        task_build_dict['column_order'] = list(sample_result.keys())
    else:
        task_build_dict['column_order'] = []

    return jsonify(task_build_dict)


@task_api_v1.route('/stop/<task_id>', methods=['GET'])
@login_required
def stop_batch_task_func(task_id):
    """Stop batch task function."""
    task_build = DbAppTask.query.filter(
        DbAppTask.id == task_id,
        DbAppTask.deleted_at.is_(None),
        DbAppTask.created_by == g.current_user_id).first()

    if task_build is None:
        return jsonify({"message": "Task id is invalid"}), 400

    # Create AsyncResult object
    async_result = AsyncResult(task_id)

    # Check if the task is already completed
    if async_result.ready():
        # Task is already completed, no need to terminate
        return jsonify({"success": False, "message": "task completed"})

    # Terminate the task
    async_result.revoke(terminate=True, signal="SIGTERM", wait=True, timeout=5)

    # Task successfully terminated
    task_build.status = TaskStatus.stopped.value
    task_build.completed_at = datetime.utcnow()
    db.session.commit()

    return jsonify({"success": True, "message": "task stopped"})


@task_api_v1.route('/list', methods=['GET'])
@login_required
def list_batch_task_func():
    """List batch task function."""
    params = request.args
    page = int(params.get('page', 1))
    size = int(params.get('size', 20))
    created_by = params.get('created_by', None)
    app_id = params.get('app_id', None)
    file_id = params.get('file_id', None)

    query = DbAppTask.query.join(DbUser).filter(DbAppTask.deleted_at.is_(
        None), (DbAppTask.created_by == g.current_user_id) |
        (DbAppTask.published is True)).order_by(DbAppTask.created_at.desc())

    if created_by is not None:
        query = query.filter(DbAppTask.created_by == created_by)

    if app_id is not None:
        query = query.filter(DbAppTask.app_id == app_id)

    if file_id is not None:
        query = query.filter(DbAppTask.file_id == file_id)

    total_files = query.count()

    total_pages = ceil(total_files / size)

    tasks = query.offset((page - 1) * size).limit(size).all()

    task_list = list(map(lambda t: {
        "id": t.id,
        "task_name": t.task_name,
        "created_by": t.created_by,
        "created_by_username": t.user.username,
        "app_id": t.app_id,
        "file_id": t.file_id,
        "created_at": t.created_at,
        "published": t.published,
        "progress": t.result.get("progress", None) if t.result is not None else None,
        "message": t.message.get("message", None) if t.message is not None else None,
        "status": TaskStatus.get_key_from_value(t.status),
        "completed_at": t.completed_at
    }, tasks))
    return jsonify({"tasks": task_list, "total_pages": total_pages})


@task_api_v1.route('/delete/<task_id>', methods=['DELETE'])
@login_required
def delete_batch_task_func(task_id):
    """Delete batch task function."""
    task_build = DbAppTask.query.filter(
        DbAppTask.id == task_id, DbAppTask.deleted_at.is_(None),
        DbAppTask.created_by == g.current_user_id).first()

    if task_build is None:
        return jsonify({"message": "task id is invalid"}), 400

    task_build.deleted_at = datetime.utcnow()
    db.session.commit()

    return {"success": True, "message": "Task deleted successfully"}, 200


@task_api_v1.route('/publish/<task_id>', methods=['POST'])
@login_required
def publish_task(task_id):
    """Publish task"""
    if not task_id:
        return {"message": "Missing embedding id in the URL."}, 400

    task_build = DbAppTask.query.filter(
        DbAppTask.id == task_id,
        DbAppTask.deleted_at.is_(None),
        DbAppTask.created_by == g.current_user_id,
        DbAppTask.status == 3).first()

    if not task_build:
        return {"message": "No embedded file found with given ID."}, 400

    task_build.published = 1
    db.session.commit()

    return {"success": True, "message": "Embedded file published successfully"}, 200
