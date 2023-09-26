# Anchoring AI

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Discord](https://img.shields.io/discord/1154665991305965628)](https://discord.gg/rZ6ne9HRq4)

[**Why Anchoring AI?**](#why-anchoring-ai) |
[**Live Demo and Screenshots**](#live-demo-and-screenshots) |
[**Installation Guide**](#installation-guide)

## Why Anchoring AI?

Anchoring AI is the next-generation platform for teams to build, evaluate and host applications powered by language models.

We provide:

- **No-Code Interface**: Quickly build apps with language models.
- **Modular Design**: Easily add your own models, datasets and extensions.
- **Drag-and-Drop**: Chain components to create powerful apps.
- **Batch Processing**: Efficiently handle evaluations and repetitive tasks.
- **Easy Sharing**: Streamline collaboration and sharing.
- **Secure Access**: Customizable authentication for team management.
- **Langchain Integration**: Seamless compatibility with Langchain (Python).
- **Optimized Caching**: Reduce costs and boost performance.

Upcoming features:

- **Expanded Language Model Support**: Integration with more language models.
- **Extended Capabilities**: Additional extensions and a new chat mode.
- **Advanced Evaluation Metrics**: Custom modules for calculating evaluation metrics.
- **Robust Security**: Strengthened security measures.
- **Enhanced Modularity**: Improved standard components for increased flexibility.

## Live Demo and Screenshots

### Live Website
You can check out our Alpha Release [here](https://platform.anchoring.ai/).

### Screenshots
[Project Screenshot]

## Installation Guide

This guide is primarily designed for Linux and macOS. Windows users can still follow along with some adjustments specified below.

### Prerequisites

Before starting the installation, ensure you have administrator-level access to your system.

> ### Note for Windows Users
>
> 1. Install and start Redis which is not supported on Windows through Windows Subsystem for Linux (WSL).
> 2. Comment out `uwsgi==2.0.21` in `back-end/requirements.txt` as this package is not supported for Windows.
> 3. Add `--pool=solo` for the Celery worker args in `back-end/src/celery_worker.py` to support batch jobs.

### Step 1: Install MySQL 8.0

1. **Download MySQL 8.0**: Go to the [official MySQL downloads page](https://dev.mysql.com/downloads/mysql/) and download the MySQL 8.0 installer for your operating system.
2. **Install MySQL**: Run the installer and follow the on-screen instructions to install MySQL.
    - Choose a setup type (Developer Default, Server only, etc.)
    - Configure the server (if prompted)
    - Set the root password and optionally create other users
3. **Start MySQL**: 
    - For Linux and macOS, you can usually start MySQL with the following command:
        ```bash
        sudo systemctl start mysql
        ```
    - For Windows, it often starts automatically or you can start it through the Services application.

4. **Verify Installation**: Open a terminal and execute the following:
    ```bash
    mysql --version
    ```
    This should display the installed MySQL version.

### Step 2: Install Redis 5.0.7

1. **Download Redis 5.0.7**: Visit the [official Redis downloads page](https://redis.io/download) and download the Redis 5.0.7 tarball or installer for your operating system.
2. **Install Redis**: 
    - **For Linux and macOS**: Extract the tarball and run the following commands in the terminal:
        ```bash
        cd redis-5.0.7
        make
        make install
        ```
    - **For Windows**: You may need to use Windows Subsystem for Linux (WSL) or a Redis Windows port.
3. **Start Redis**: 
    - **For Linux and macOS**: You can usually start Redis by running:
        ```bash
        redis-server
        ```
    - **For Windows**: If you're using WSL, you can start it the same way as on Linux.
  
4. **Verify Installation**: Open a new terminal and run:
    ```bash
    redis-cli ping
    ```
    If Redis is running, this will return "PONG".

### Step 3: Install Node.js v18.16.0

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

### Step 6: Initialize and Configure Database

#### Initialize Database

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

#### Configure Database Connection in Code

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

### Step 7: Set Up Front-end

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

### Step 8: Set Up Back-end

1. Change your current directory to the root directory and then navigate to `back-end`:

```bash
cd ..
cd back-end
```

2. Install all required Python packages:

```bash
pip install -r requirements.txt
```

### Step 9: Run the Application

1. **Navigate to the `src` directory**:

    ```bash
    cd src
    ```

2. **Start the Python application**:

    - **For Linux and macOS**:
        ```bash
        python3 app.py
        ```
    - **For Windows**:
        ```bash
        python app.py
        ```

3. **Start the Celery worker in the background**:

    - **For Linux and macOS**:
        ```bash
        python3 celery_worker.py >> logs/celery_worker_log.txt 2>&1
        ```
    - **For Windows**:
        ```bash
        python celery_worker.py >> logs/celery_worker_log.txt 2>&1
        ```

After completing these steps, you should be able to see the app running on localhost:3000.
