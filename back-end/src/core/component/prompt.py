from config import logger
from core.component.utils import generate_valid_prompt


class Prompt:
    # Constructor (initialize object)
    def __init__(self, llm_processor, prompt_template):
        self.llm_processor = llm_processor
        self.prompt_template = prompt_template

    def complete(self, input_variables=None):
        valid_prompt, valid_input_variables = generate_valid_prompt(
            self.prompt_template, input_variables)

        res = self.llm_processor.complete(valid_prompt, valid_input_variables)

        logger.debug("Prompt Template: {}\n".format(valid_prompt.template))
        logger.debug("Input Variables: {}\n".format(valid_input_variables))

        return res["result"]
