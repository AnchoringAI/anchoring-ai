"""File API."""
from datetime import datetime
from math import ceil

import requests
import pandas as pd
from flask import Blueprint, Response, request, jsonify, g
from werkzeug.utils import secure_filename

from connection import db
from core.auth.authenticator import login_required, get_current_user
from model.file import DbFile
from model.user import DbUser
from util.uid_gen import gen_uuid

file_api_v1 = Blueprint('file_api_v1', __name__, url_prefix='/v1/file')

ALLOWED_EXTENSIONS = {'txt', 'tsv', 'csv'}


def _allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@file_api_v1.before_request
@login_required
def load_user_id():
    """Load user ID."""
    g.current_user_id = get_current_user().get_id()


@file_api_v1.route('/upload', methods=['POST'])
@login_required
def upload_file():
    """Upload file."""
    if 'file' not in request.files or request.files['file'].filename == '':
        return jsonify(error='No file found'), 400
    file = request.files['file']

    uploaded_by = g.current_user_id
    if uploaded_by is None:
        return jsonify(error='No user is related to this file'), 400

    if file and _allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_id = gen_uuid()

        # Check file size
        file.seek(0)
        content = file.read()
        size = len(content)
        if size > 1024 * 1024 * 15:  # 15MB
            return jsonify(success=False, error='Only files smaller than 15MB are supported.'), 400

        file_type, df_content, row_count = determine_file_type_and_content(
            file)

        # Check row count for table types
        if file_type == "Table":
            if row_count > 3000:
                return jsonify(success=False,
                               error='Only tables with less than 3000 rows are supported.'), 400

        uploaded_files = DbFile(
            id=file_id,
            name=filename,
            type=file_type,
            uploaded_by=uploaded_by,
            uploaded_at=datetime.utcnow(),
            size=size,
            content=df_content,
            raw_content=content,
            published=False
        )

        db.session.add(uploaded_files)
        db.session.commit()

        return jsonify(success=True, file_id=file_id), 200

    return jsonify(success=False, error='Invalid file type'), 400


def determine_file_type_and_content(file):
    """Determine if the file is a TSV table or plain text."""
    file.seek(0)
    first_line = file.readline().decode('utf-8')
    file.seek(0)
    if '\t' in first_line or ',' in first_line:
        delimiter = '\t' if '\t' in first_line else ','
        df = pd.read_csv(file, sep=delimiter)
        row_count = df.shape[0]
        file.seek(0)
        return 'Table', df.to_dict(orient="records"), row_count

    text_content = file.read().decode('utf-8')
    return 'Plain Text', {"text": text_content}, 0


@file_api_v1.route('/list', methods=['GET'])
@login_required
def get_uploaded_files():
    """Get uploaded files."""
    params = request.args
    page = int(params.get('page', 1))
    size = int(params.get('size', 20))
    uploaded_by = params.get('uploaded_by', None)

    query = (DbFile.query.join(DbUser)
             .filter(DbFile.deleted_at.is_(None),
                     (DbFile.uploaded_by == g.current_user_id) |
                     (DbFile.published is True))
             .order_by(DbFile.uploaded_at.desc()))

    print("query: ", query)

    if uploaded_by is not None:
        query = query.filter(DbFile.uploaded_by == uploaded_by)

    total_files = query.count()

    total_pages = ceil(total_files / size)

    files = query.offset((page - 1) * size).limit(size).all()

    file_list = []
    for f in files:
        file_dict = f.as_dict(exclude=['content', 'raw_content'])
        file_dict['uploaded_by_username'] = f.user.username
        file_list.append(file_dict)

    return jsonify({"files": file_list, "total_pages": total_pages})


@file_api_v1.route('/load/<file_id>', methods=['GET'])
@login_required
def load_file(file_id):
    """Load file."""
    if file_id is None:
        return jsonify(error='No file id provided'), 400

    file_data = (DbFile.query.join(DbUser)
                             .filter(DbFile.id == file_id,
                                     DbFile.deleted_at.is_(None),
                                     (DbFile.uploaded_by == g.current_user_id) |
                                     (DbFile.published is True))
                 .first())
    if file_data is None:
        return jsonify(error='File not found'), 404

    file_data_dict = file_data.as_dict(exclude=['raw_content'])
    file_data_dict['uploaded_by_username'] = file_data.user.username

    if file_data_dict['type'] == "Table":
        content_list = file_data_dict['content']
        df_content = pd.json_normalize(content_list)
        file_data_dict['content'] = df_content.to_json(orient='columns')
    elif (file_data_dict['type'] == "Plain Text" or file_data_dict['type'] == "Embedded Text"):
        pass

    return jsonify(success=True, file=file_data_dict)


@file_api_v1.route('/download/<file_id>', methods=['GET'])
@login_required
def download_file(file_id):
    """Download file."""
    if file_id is None:
        return jsonify(error='No file id provided'), 400

    file_data = (DbFile.query.filter(DbFile.id == file_id,
                                     DbFile.deleted_at.is_(None),
                                     (DbFile.uploaded_by == g.current_user_id) |
                                     (DbFile.published is True))
                 .first())

    if file_data is None:
        return jsonify(error='File not found or not authorized'), 404

    file_name = file_data.name
    raw_content = file_data.raw_content

    response = Response(raw_content, mimetype='application/octet-stream')
    response.headers.set('Content-Disposition',
                         'attachment', filename=file_name)
    response.headers["X-File-Name"] = file_name
    return response


@file_api_v1.route('/delete/<file_id>', methods=['DELETE'])
@login_required
def delete_file(file_id):
    """Delete file."""
    if not file_id:
        return jsonify(error='No file id provided'), 400

    file_data = DbFile.query.get(file_id)
    if file_data is None or file_data.deleted_at is not None:
        return jsonify(error='File not found'), 400

    if file_data.uploaded_by != g.current_user_id:
        return jsonify(error='Not authorized to delete this file'), 403

    if file_data.type == "Embedded Text":
        try:
            host_url = request.host_url
            full_url = host_url.rstrip(
                "/") + f'/v1/resource/delete_chroma/{file_id}'
            chroma_resp = requests.delete(full_url, timeout=300)

            if not chroma_resp.ok:
                return jsonify(error='Failed to delete embeddings from Chroma DB'), 500
        except (requests.ConnectionError, requests.RequestException):
            return jsonify(error='Failed to delete embeddings from Chroma DB'), 500

    file_data.deleted_at = datetime.utcnow()
    db.session.commit()

    return jsonify(success=True, message='File deleted successfully')


@file_api_v1.route('/publish/<file_id>', methods=['POST'])
@login_required
def publish_file(file_id):
    """Publish file."""
    if not file_id:
        return {"message": "Missing file ID in the URL."}, 400

    file_data = DbFile.query.filter(
        DbFile.id == file_id,
        DbFile.deleted_at.is_(None),
        DbFile.uploaded_by == g.current_user_id).first()

    if not file_data:
        return {"message": "No file found with given ID."}, 400

    file_data.published = 1
    db.session.commit()

    return {"success": True, "message": "File published successfully"}, 200
