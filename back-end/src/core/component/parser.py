"""Parser."""
from langchain.output_parsers import RegexParser

from config import logger


# pylint: disable=too-few-public-methods
class TagParser:
    """Tag parser."""

    def __init__(self, tag):
        super().__init__()
        self.tag = tag

    def _construct_tag_parser(self, output_key):
        # Make the tag case-insensitive
        tag_insensitive = make_case_insensitive(self.tag)
        
        # Create a RegexParser with the case-insensitive and multiline regex
        parser = RegexParser(
            regex=fr"<{self.tag}>(.*?)</{self.tag}>", output_keys=[output_key])

        return parser

    def parse(self, text_obj, input_variables=None):
        """Parse."""
        text = text_obj.text_convert(input_variables=input_variables)

        parser = self._construct_tag_parser("parser_output")
        try:
            res = parser.parse(text).get("parser_output", "")
        except ValueError as e:
            res = ""
            logger.error(e)

        logger.debug(f"Raw Text: {text}")
        logger.debug(f"Target Tag: {self.tag}")
        logger.debug(f"Parse Output: {res}")

        return res