"""Base."""
from connection import db


# pylint: disable=too-few-public-methods
class DbBase(db.Model):
    """DB base."""
    __abstract__ = True

    def as_dict(self):
        """Dict format."""
        result = {}
        for c in self.__table__.columns:
            if getattr(self, c.name) is not None:
                if str(c.type) == 'JSON':
                    result[c.name] = getattr(self, c.name)
                else:
                    result[c.name] = str(getattr(self, c.name))

        return result
