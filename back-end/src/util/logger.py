"""Logger."""
import logging


class Logger:
    """Logger."""

    def __init__(self, name, level="DEBUG"):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(level)

        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s')

        # Create and configure a file handler
        # file_handler = logging.FileHandler('logfile.log')
        # file_handler.setFormatter(formatter)
        # self.logger.addHandler(file_handler)

        # Create and configure console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)

    def set_level(self, level):
        """Set level."""
        self.logger.setLevel(level)

    def info(self, message):
        """Info."""
        self.logger.info(message)

    def debug(self, message):
        """Debug."""
        self.logger.debug(message)

    def warning(self, message):
        """Warning."""
        self.logger.warning(message)

    def error(self, message):
        """Error."""
        self.logger.error(message)

    def critical(self, message):
        """Critical."""
        self.logger.critical(message)
