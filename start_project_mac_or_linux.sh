#!/bin/bash
# Start front-end
cd front-end
npm start &

# Start back-end
cd ../back-end
python app.py &
python celery_worker.py >> logs/celery_worker_log.txt 2>&1 &