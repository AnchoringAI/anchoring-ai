"""User service."""
from model.user import DbUser


def get_user_by_id(user_id):
    """Get user by ID."""
    user = DbUser.query.filter_by(id=user_id).first()
    if not user:
        raise ValueError("invalid user id", False)
    return user
