@echo off
cd front-end
start cmd /k "npm start"
cd ..
cd back-end
start cmd /k "python app.py"
start cmd /k "python celery_worker.py > logs/celery_worker_log.txt 2>&1"
exit
