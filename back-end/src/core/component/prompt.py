"""Prompt."""
from config import logger
from core.component.utils import generate_valid_prompt


# pylint: disable=too-few-public-methods
class Prompt:
    """Prompt."""

    def __init__(self, llm_processor, prompt_template):
        self.llm_processor = llm_processor
        self.prompt_template = prompt_template

    def complete(self, input_variables=None):
        """Complete."""
        valid_prompt, valid_input_variables = generate_valid_prompt(
            self.prompt_template, input_variables)

        res = self.llm_processor.complete(valid_prompt, valid_input_variables)

        logger.debug(f"Prompt Template: {valid_prompt.template}\n")
        logger.debug(f"Input Variables: {valid_input_variables}\n")

        return res["result"]
