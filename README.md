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

```bash
git clone https://github.com/AnchoringAI/anchoring-ai.git
```

## Step 6: Initialize and Configure Database

### Initialize Database

1. Open your terminal and navigate to the `scripts` directory within your project:

    ```bash
    cd path/to/your/project/scripts
    ```

2. Open the MySQL shell by entering the following command:

    ```bash
    mysql -u [your_username] -p
    ```

    You will be prompted to enter the password for `[your_username]`.

3. Once inside the MySQL shell, switch to the database you intend to use (if it already exists). Replace `[your_database]` with the name of your database:

    ```bash
    use [your_database];
    ```

4. Execute the `init_db.sql` script to initialize your MySQL database:

    ```bash
    source init_db.sql
    ```

### Configure Database Connection in Code

1. Navigate to the `config.py` file located in the `back-end/src` directory:

    ```bash
    cd path/to/your/project/back-end/src
    ```

2. Open `config.py` in your favorite text editor and locate the `DevelopmentConfig` class.

3. Update the database configuration class to match your MySQL settings:

    ```python
    class DevelopmentConfig(BaseConfig):
        USERNAME = '[your_username]'
        PASSWORD = '[your_password]'
        HOST = 'localhost'
        PORT = '3306'
        DATABASE = '[your_database]'
        DB_URI = f'mysql+pymysql://{USERNAME}:{PASSWORD}@{HOST}:{PORT}/{DATABASE}?charset=utf8'
        SQLALCHEMY_DATABASE_URI = DB_URI
    ```

Replace `[your_username]`, `[your_password]`, and `[your_database]` with the MySQL username, password, and database name you've chosen.

After completing these steps, your database should be initialized and your application configured to connect to it.

## Step 7: Set Up Front-end

1. Change your current directory to the `front-end` folder:

```bash
cd front-end
```

2. Install all necessary packages:

```bash
npm install
```

3. Start the front-end server:

```bash
npm start
```

## Step 8: Set Up Back-end

1. Change your current directory to the root directory and then navigate to `back-end`:

```bash
cd ..
cd back-end
```

2. Install all required Python packages:

```bash
pip install -r requirements.txt
```

## Step 9: Run the Application

1. Navigate to the `src` directory:

```bash
cd src
```

2. Start the Python application:

```bash
python3 app.py
```

3. Start the Celery worker in the background:

```bash
python3 celery_worker.py >> logs/celery_worker_log.txt 2>&1
```

## Database Configuration

Below is a Python configuration class for setting up your database connection:

```python
class DevelopmentConfig(BaseConfig):
    USERNAME = 'llm_ops'
    PASSWORD = '123'
    HOST = 'localhost'
    PORT = '3306'
    DATABASE = 'llm'
    DB_URI = f'mysql+pymysql://{USERNAME}:{PASSWORD}@{HOST}:{PORT}/{DATABASE}?charset=utf8'
    SQLALCHEMY_DATABASE_URI = DB_URI
```

Replace 'llm_ops', '123', 'localhost', '3306', and 'llm' with your own MySQL settings if needed.

