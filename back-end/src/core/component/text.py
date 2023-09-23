from config import logger
from core.component.utils import generate_valid_prompt


class Text:
    # Constructor (initialize object)
    def __init__(self, text_template):
        self.text_template = text_template

    def text_convert(self, input_variables=None):
        valid_prompt, valid_input_variables = generate_valid_prompt(
            self.text_template, input_variables)
        res = valid_prompt.format(**valid_input_variables)

        logger.debug("Text: {}\n".format(valid_prompt.template))
        logger.debug("Input Variables: {}\n".format(valid_input_variables))
        logger.debug("Final Text: {}\n".format(res))

        return res
