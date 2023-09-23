from connection import db


class DbBase(db.Model):
    __abstract__ = True

    def as_dict(self):
        result = {}
        for c in self.__table__.columns:
            if getattr(self, c.name) is not None:
                if str(c.type) == 'JSON':
                    result[c.name] = getattr(self, c.name)
                else:
                    result[c.name] = str(getattr(self, c.name))

        return result
