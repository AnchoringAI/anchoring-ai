from flask import jsonify


def response(msg=None, success=True, data=None):
    if data is None:
        data = {}
    resp = {'data': data, 'msg': msg, 'success': success}
    return jsonify(resp)
