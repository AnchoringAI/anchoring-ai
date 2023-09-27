import re

import jwt
from flask import request

from core.auth.token import JwtToken

HTTP_HEADER_AUTHORIZATION_FIELD = "XAuthorization"


class JwtTokenExtractor:
    def __init__(self, request_header_field: str = HTTP_HEADER_AUTHORIZATION_FIELD):
        self._header_field = request_header_field

    def extract_from(self, flask_request):
        if type(flask_request) is not type(request):
            raise TypeError("input item is not a flask request(LocalProxy)")

        raw_token_str = flask_request.headers.get(self._header_field, "")

        if raw_token_str == "":
            raw_token_str = flask_request.headers.environ.get(
                "HTTP_XAUTHORIZATION", "")
            if raw_token_str == "":
                raw_token_str = flask_request.headers.environ.get(
                    "XAuthorization", "")

        if not raw_token_str:
            raise jwt.InvalidTokenError(
                "missing {} field in request header".format(
                    HTTP_HEADER_AUTHORIZATION_FIELD)
            )

        parsed_token = re.findall(r" *Bearer +(\S*)$", raw_token_str)
        if not parsed_token:
            raise jwt.InvalidTokenError(
                "{} header is not in format of Bearer <token>,"
                " got {}".format(
                    HTTP_HEADER_AUTHORIZATION_FIELD, raw_token_str)
            )

        token_str = parsed_token[0]
        if token_str.startswith("Bearer "):
            token_str = token_str[len("Bearer "):]
        return JwtToken.digest(token_str)
