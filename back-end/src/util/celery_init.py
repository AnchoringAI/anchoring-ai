"""Celery initilization."""
from celery import Celery, Task
from flask import Flask


def celery_init_app(app: Flask) -> Celery:
    """Celery init app."""
    # pylint: disable=too-few-public-methods
    # pylint: disable=abstract-method
    class FlaskTask(Task):
        """Flask task."""

        def __call__(self, *args: object, **kwargs: object) -> object:
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app = Celery(app.name)
    celery_app.config_from_object(app.config["CELERY"])
    celery_app.Task = FlaskTask
    celery_app.set_default()
    app.extensions["celery"] = celery_app
    return celery_app
