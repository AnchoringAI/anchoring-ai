"""Prompt."""
from config import logger
from core.component.utils import generate_valid_prompt


# pylint: disable=too-few-public-methods
class Prompt:
    """Prompt."""

    def __init__(self, llm_processor):
        self.llm_processor = llm_processor

    def complete(self, text_obj, input_variables=None):
        """Complete."""
        text = text_obj.text_convert(input_variables=input_variables)

        res = self.llm_processor.complete(text)

        logger.debug(f"Text: {text}\n")

        return res["result"]
