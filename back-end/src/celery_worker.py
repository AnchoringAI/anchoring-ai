"""Celery network."""
from app import celery_app

if __name__ == '__main__':
    celery_app.worker_main(
        # argv=['-A', 'app.celery_app', 'worker', '--loglevel=info', '--pool=solo']) for Windows
        argv=['-A', 'app.celery_app', 'worker', '--loglevel=info'])
