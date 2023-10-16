"""Token."""
import json

import jwt
from cryptography.fernet import Fernet

from util.timestamp_util import get_future_timestamp, has_passed_timestamp


JWT_SIGNATURE_SALT = "ZofqhbIRrBQoyRmyFcOghyAeJV2vNetne7Dukvuvtxk="
PAYLOAD_ENC_SALT = b"BA7i2vIF567g_9rA6joA8PTF3P_wtHe4MqUP0Fkgq3Y="

EXPIRE_TIMESPAN_SEC = 7 * 24 * 3600  # 7 days
JWT_AUDIENCE = "LLMOPS"


class JwtToken:
    """JTW token."""
    # -------- Static Parameters --------
    encryptor = Fernet(PAYLOAD_ENC_SALT)
    jwt_sign_salt = JWT_SIGNATURE_SALT

    def __init__(
            self,
            user_id: int,
            expire_timestamp: float,
            version: int,
    ):
        self.user_id = user_id
        self.expire_timestamp = expire_timestamp
        self.version = version

    def to_json(self):
        """To JSON."""
        return self.__dict__

    @classmethod
    def generate(
            cls,
            user_id: int,
            expire_timespan_sec: float = EXPIRE_TIMESPAN_SEC,
            version: int = 0,
    ):
        token = cls(user_id=user_id,
                    expire_timestamp=get_future_timestamp(
                        secs=expire_timespan_sec),
                    version=version)

        return token

    def to_str(self) -> str:
        # use abbreviation for shorter payload
        # u -> user_id
        # exp -> expire_time
        # vs -> version
        payload = {
            "u": self.user_id,
            "exp": self.expire_timestamp,
            "vs": self.version,
        }

        # since jwt transport payload in plain text, encrypt the payload
        encrypt_payload = self.encryptor.encrypt(
            json.dumps(payload).encode("utf-8"))
        return "Bearer " + jwt.encode(
            {
                "enc": encrypt_payload.hex(),
                "exp": self.expire_timestamp,
                "aud": JWT_AUDIENCE,
            }, self.jwt_sign_salt, algorithm="HS256"
        )

    @classmethod
    def validate(cls, payload_dict) -> None:
        """Validate."""
        for necessary_field in ["u", "exp", "vs"]:
            if necessary_field not in payload_dict:
                raise jwt.InvalidTokenError(
                    "payload dict has no required field {}".format(
                        necessary_field)
                )
        if has_passed_timestamp(float(payload_dict["exp"])):
            raise jwt.ExpiredSignatureError("token has expired")

    @classmethod
    def digest(cls, token_str: str):
        """
        digest pure token_str

        Args:
          token_str: pure token string parsed from request header without the "Bearer" type field.
        """
        if token_str.startswith('Bearer '):
            token_str = token_str[len("Bearer "):]

        encrypt_payload = bytes.fromhex(
            jwt.decode(token_str,
                       cls.jwt_sign_salt,
                       algorithms=["HS256"],
                       audience=JWT_AUDIENCE).get("enc", None)
        )
        if encrypt_payload is None:
            raise jwt.InvalidTokenError("token has no payload")
        try:
            # If payload parsing fails, prompt the user to log in again
            payload = json.loads(cls.encryptor.decrypt(
                encrypt_payload).decode("utf-8"))
        except Exception as e:
            raise jwt.InvalidTokenError(
                f"token cannot digest, {e}")
        cls.validate(payload)
        return cls(
            user_id=payload["u"],
            expire_timestamp=payload["exp"],
            version=payload["vs"],
        )
