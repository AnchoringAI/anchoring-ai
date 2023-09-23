from config import logger
from core.component.utils import generate_valid_prompt


class Table:
    # Constructor (initialize object)
    def __init__(self, scheme):
        self.scheme = scheme

    def load_variables(self, input_variables=None):
        result = {}

        if input_variables is None:
            return None

        for variable in input_variables:
            if variable in self.scheme:
                result[variable] = input_variables[variable]

        return result
