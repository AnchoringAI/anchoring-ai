from model.user import DbUser


def get_user_by_id(user_id):
    user = DbUser.query.filter_by(id=user_id).first()
    if not user:
        raise ValueError("invalid user id", False)
    return user
