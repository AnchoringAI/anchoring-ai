rm -rf celery_worker_log.txt
python src/celery_worker.py > celery_worker_log.txt 2>&1 &
python src/app.py
