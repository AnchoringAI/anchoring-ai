import json

from flask import Blueprint, Response, request, jsonify, g
from datetime import datetime
import requests

from connection import db
from core.auth.authenticator import login_required, get_current_user
from core.task import completion
from model.application import DbAppBuild
from model.user import DbUser
from util.uid_gen import gen_uuid
from math import ceil
from sqlalchemy import desc, case

app_api_v1 = Blueprint('app_api_v1', __name__, url_prefix='/v1/app')


class LLMApp:
    pass


@app_api_v1.before_request
@login_required
def load_user_id():
    g.current_user_id = get_current_user().get_id()


@app_api_v1.route('/list', methods=['GET'])
@login_required
def get_app_list():
    params = request.args
    page = int(params.get('page', 1))
    size = int(params.get('size', 20))
    app_name = params.get('app_name', None)
    created_by = params.get('created_by', None)
    tags = params.get('tags', None)
    description = params.get('description', None)
    query = DbAppBuild.query.join(DbUser).filter(
        DbAppBuild.deleted_at.is_(None), (DbAppBuild.created_by == g.current_user_id) |
        (DbAppBuild.published == True))

    query = query.order_by(
        case(
            [(DbAppBuild.created_by == g.current_user_id, 1)],
            else_=2
        ),
        desc(DbAppBuild.updated_at)
    )

    if app_name is not None:
        query = query.filter(DbAppBuild.app_name.like('%' + app_name + '%'))
    if created_by is not None:
        query = query.filter(
            DbAppBuild.created_by.like('%' + created_by + '%'))
    if tags is not None:
        tag_list = tags.split(",")
        query = query.filter(DbAppBuild.tags.in_(tag_list))

    total_files = query.count()

    total_pages = ceil(total_files / size)

    apps = query.offset((page - 1) * size).limit(size).all()

    apps_list = list(map(lambda a: {
        "id": a.id,
        "app_name": a.app_name,
        "created_by": a.created_by,
        "created_by_username": a.user.username,
        "tags": a.tags,
        "description": a.description,
        "created_at": a.created_at,
        "updated_at": a.updated_at,
    }, apps))

    return jsonify({"applications": apps_list, "total_pages": total_pages})


@app_api_v1.route('/load/<app_id>', methods=['GET'])
@login_required
def get_application(app_id):
    app_build = DbAppBuild.query.filter(
        DbAppBuild.id == app_id, DbAppBuild.deleted_at.is_(None), (DbAppBuild.created_by == g.current_user_id) |
        (DbAppBuild.published == True)).first()
    if app_build:
        # app_dict = {
        #     "id": app_build.id,
        #     "app_name": app_build.app_name,
        #     "created_by": app_build.created_by,
        #     "created_at": app_build.created_at,
        #     "updated_at": app_build.updated_at,
        #     "chain": app_build.chain
        #     # include other properties as well if needed
        # }
        app_dict = app_build.as_dict()
        return Response(json.dumps(app_dict))
    else:
        return {"message": "No application found with given ID."}, 400


@app_api_v1.route('/modify', methods=['POST'])
@login_required
def modify_application():
    data = request.get_json()

    id = data.get('id', None)
    new = False
    if id is None or id == "":
        id = gen_uuid()
        new = True
    app_name = data.get('app_name', None)
    created_by = g.current_user_id
    tags = data.get('tags', None)
    description = data.get('description', None)
    published = data.get('published', False)
    chain = data.get('chain', None)

    if new:
        if app_name is None:
            return Response("Required fields missing!", status=400)
        app_build = DbAppBuild(id, app_name, created_by,
                               tags, description, published, chain)
        db.session.add(app_build)
    else:
        app_build = DbAppBuild.query.filter(
            DbAppBuild.id == id, DbAppBuild.deleted_at.is_(None), DbAppBuild.created_by == g.current_user_id).first()

        app_build.updated_at = datetime.utcnow()
        app_build.published = published

        if app_build is None:
            return Response(f"Application {id} not found", status=400)
        if app_name is not None:
            app_build.app_name = app_name
        if tags is not None:
            app_build.tags = tags
        if description is not None:
            app_build.description = description
        if chain is not None:
            app_build.chain = chain

    app_build_dict = app_build.as_dict()
    db.session.commit()

    return Response(json.dumps(app_build_dict))


@app_api_v1.route('/delete/<app_id>', methods=['DELETE'])
@login_required
def delete_application(app_id):
    if not app_id:
        return {"message": "Missing app_id in request body."}, 400

    app_build = DbAppBuild.query.filter(
        DbAppBuild.id == app_id, DbAppBuild.deleted_at.is_(None), DbAppBuild.created_by == g.current_user_id).first()

    if not app_build:
        return {"message": "No application found with given ID."}, 400

    app_build.deleted_at = datetime.utcnow()
    db.session.commit()

    return {"success": True, "message": "Application deleted successfully"}, 200


@app_api_v1.route('/publish/<app_id>', methods=['POST'])
@login_required
def publish_application(app_id):
    if not app_id:
        return {"message": "Missing app_id in the URL."}, 400

    app_build = DbAppBuild.query.filter(
        DbAppBuild.id == app_id, DbAppBuild.deleted_at.is_(None), DbAppBuild.created_by == g.current_user_id).first()

    if not app_build:
        return {"message": "No application found with given ID."}, 400

    app_build.published = 1
    app_build.updated_at = datetime.utcnow()
    print(f"app_build: {app_build}")
    db.session.commit()

    return {"success": True, "message": "Application published successfully"}, 200


@app_api_v1.route('/auto_generate', methods=['POST'])
# Let LLM automatically generate applications based on users' requirements.
@login_required
def generate_application():
    data = request.get_json()
    instruction = data.get('instruction', None)

    json_data = {
        "agent_inst": instruction
    }
    response = requests.post(
        'http://sls-510-1.csail.mit.edu:8000/anchoring',
        json = json_data
    )
    if response.status_code != 200:
        raise SystemError(
            f'Failed to get valid response from server: {response.status_code}')
    
    data = json.loads(response.content)['agent']
    id = gen_uuid()
    app_name = data.get('app_name', None)
    created_by = g.current_user_id
    tags = data.get('tags', None)
    description = data.get('description', None)
    published = data.get('published', False)
    chain = data.get('chain', None)

    if app_name is None:
        return Response("Required fields missing!", status=400)
    app_build = DbAppBuild(id, app_name, created_by,
                            tags, description, published, chain)
    db.session.add(app_build)
    
    app_build_dict = app_build.as_dict()
    db.session.commit()

    return Response(json.dumps(app_build_dict))