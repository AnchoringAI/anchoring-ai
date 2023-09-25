# anchoring-ai

## Prerequisites

Before starting the installation, ensure you have administrator-level access to your system.

## Step 1: Install MySQL 8.0

1. Download and install MySQL version 8.0 from the [official website](https://dev.mysql.com/downloads/mysql/).
2. After the installation is complete, start MySQL.

## Step 2: Install Redis 5.0.7

1. Download and install Redis version 5.0.7 from the [official website](https://redis.io/download).
2. After the installation is complete, start Redis.

## Step 3: Install Node.js v18.16.0

1. Download and install Node.js version 18.16.0 from the [official website](https://nodejs.org/en/download/).
2. Verify the installation by running `node -v` in the terminal.

## Step 4: Install Python 3.8.10

1. Download and install Python version 3.8.10 from the [official website](https://www.python.org/downloads/).
2. Verify the installation by running `python --version` or `python3 --version` in the terminal.

## Step 5: Clone the GitHub Repository

Run the following command in the terminal:

\`\`\`bash
git clone https://github.com/AnchoringAI/anchoring-ai.git
\`\`\`

## Step 6: Initialize Database

1. Navigate to the `scripts` directory.
2. Run the `init_db.sql` script to initialize your MySQL database.

## Step 7: Set Up Front-end

1. Change your current directory to the `front-end` folder:

\`\`\`bash
cd front-end
\`\`\`

2. Install all necessary packages:

\`\`\`bash
npm install
\`\`\`

3. Start the front-end server:

\`\`\`bash
npm start
\`\`\`

## Step 8: Set Up Back-end

1. Change your current directory to the root directory and then navigate to `back-end`:

\`\`\`bash
cd ..
cd back-end
\`\`\`

2. Install all required Python packages:

\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Step 9: Run the Application

1. Navigate to the `src` directory:

\`\`\`bash
cd src
\`\`\`

2. Start the Python application:

\`\`\`bash
python3 app.py
\`\`\`

3. (Optional) Start the Celery worker in the background:

\`\`\`bash
python3 celery_worker.py >> logs/celery_worker_log.txt 2>&1
\`\`\`

## Database Configuration

Below is a Python configuration class for setting up your database connection:

\`\`\`python
class DevelopmentConfig(BaseConfig):
    USERNAME = 'llm_ops'
    PASSWORD = '123'
    HOST = 'localhost'
    PORT = '3306'
    DATABASE = 'llm'
    DB_URI = f'mysql+pymysql://{USERNAME}:{PASSWORD}@{HOST}:{PORT}/{DATABASE}?charset=utf8'
    SQLALCHEMY_DATABASE_URI = DB_URI
\`\`\`

Replace 'llm_ops', '123', 'localhost', '3306', and 'llm' with your own MySQL settings if needed.

