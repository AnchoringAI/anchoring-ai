"""Text."""
from config import logger
from core.component.utils import generate_valid_prompt


# pylint: disable=too-few-public-methods
class Text:
    """Text."""

    def __init__(self, text_template):
        self.text_template = text_template

    def text_convert(self, input_variables=None):
        """Text convert."""
        valid_prompt, valid_input_variables = generate_valid_prompt(
            self.text_template, input_variables)
        res = valid_prompt.format(**valid_input_variables)

        logger.debug(f"Text: {valid_prompt.template}\n")
        logger.debug(f"Input Variables: {valid_input_variables}\n")
        logger.debug(f"Final Text: {res}\n")

        return res
