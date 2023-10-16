"""Shared link API."""
import json

from flask import Blueprint, Response, request, jsonify, g

from connection import db
from core.auth.authenticator import login_required, get_current_user
from model.shared_link import DbSharedLink
from model.application import DbAppBuild, DbAppTask
from util.uid_gen import gen_uuid

shared_link_api_v1 = Blueprint(
    'shared_link_api_v1', __name__, url_prefix='/v1/shared')


@shared_link_api_v1.before_request
@login_required
def load_user_id():
    """Load user ID."""
    g.current_user_id = get_current_user().get_id()


@shared_link_api_v1.route('/app/<link_id>', methods=['GET'])
@login_required
def load_share_link_app(link_id):
    """Load share link app."""
    return _load_share_link_generic(link_id, 'APP')


@shared_link_api_v1.route('/task/<link_id>', methods=['GET'])
@login_required
def load_share_link_task(link_id):
    """Load share link task."""
    return _load_share_link_generic(link_id, 'TASK')


def _load_share_link_generic(link_id, expected_type):
    share_link_record = DbSharedLink.query.filter_by(id=link_id).first()

    if not share_link_record or share_link_record.resource_type != expected_type:
        return {"message": "Shared link not found or incorrect type."}, 404

    resource_type = share_link_record.resource_type
    resource_id = share_link_record.resource_id

    if resource_type == 'APP':
        resource = DbAppBuild.query.filter_by(id=resource_id).filter(
            DbAppBuild.deleted_at.is_(None)).first()
    elif resource_type == 'TASK':
        resource = DbAppTask.query.filter_by(id=resource_id).filter(
            DbAppTask.deleted_at.is_(None)).first()
    else:
        return {"message": "Invalid resource type."}, 400

    if resource:
        return Response(json.dumps(resource.as_dict()))

    return {"message": "Resource not found or deleted."}, 404


@shared_link_api_v1.route('/generate', methods=['POST'])
@login_required
def generate_share_link():
    """Generate share link."""
    request_data = request.get_json()

    # Extract necessary data from the request
    resource_type = request_data.get('resource_type')
    resource_id = request_data.get('resource_id')
    expires_at = request_data.get('expires_at')

    # Get the current user's ID
    created_by = g.current_user_id

    # Verify if the resource can be shared (created by the user or is published)
    if resource_type == 'APP':
        resource = DbAppBuild.query.filter(
            DbAppBuild.id == resource_id,
            DbAppBuild.deleted_at.is_(None),
            (DbAppBuild.created_by == created_by) |
            (DbAppBuild.published is True)
        ).first()
    elif resource_type == 'TASK':
        resource = DbAppTask.query.filter(
            DbAppTask.id == resource_id,
            DbAppTask.deleted_at.is_(None),
            (DbAppTask.created_by == created_by) |
            (DbAppTask.published is True)
        ).first()
    else:
        return {"message": "Invalid resource type."}, 400

    if not resource:
        return {"message": "Resource not found, deleted, or access denied."}, 404

    # Generate a unique ID for the share link
    share_link_id = gen_uuid()

    # Create a new DbSharedLink object
    new_share_link = DbSharedLink(
        id=share_link_id,
        created_by=created_by,
        resource_id=resource_id,
        resource_type=resource_type,
        expires_at=expires_at
    )

    # Add the new object to the database
    db.session.add(new_share_link)
    db.session.commit()

    # Return the shareable URL as the response
    return jsonify({"message": "Share link generated successfully",
                    "share_link_id": share_link_id,
                    "resource_type": resource_type}), 201
