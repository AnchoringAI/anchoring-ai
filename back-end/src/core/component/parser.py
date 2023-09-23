from langchain.output_parsers import RegexParser

from config import logger
from core.component.utils import generate_valid_prompt


class Parser:
    # Constructor (initialize object)
    def __init__(self):
        pass


class TagParser(Parser):
    # Constructor (initialize object)
    def __init__(self, tag):
        super().__init__()
        self.tag = tag

    def _construct_tag_parser(self, output_key):
        parser = RegexParser(
            regex=r"<{}>(.*?)</{}>".format(self.tag, self.tag), output_keys=[output_key])

        return parser

    def parse(self, text_obj, input_variables=None):
        text = text_obj.text_convert(input_variables=input_variables)

        parser = self._construct_tag_parser("parser_output")
        try:
            res = parser.parse(text).get("parser_output", "")
        except Exception as e:
            res = ""
            logger.error(e)

        logger.debug("Raw Text: {}".format(text))
        logger.debug("Target Tag: {}".format(self.tag))
        logger.debug("Parse Output: {}".format(res))

        return res
