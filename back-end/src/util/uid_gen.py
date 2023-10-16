"""UID generation."""
import shortuuid

uid_gen = shortuuid.ShortUUID(alphabet="123456789abcdefg")


def gen_uuid(length=8):
    """Generate UUID."""
    return uid_gen.random(length=length)
