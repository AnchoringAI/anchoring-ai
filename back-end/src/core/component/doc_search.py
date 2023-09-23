from config import logger
from core.component.utils import generate_valid_prompt


class DocSearch:
    # Constructor (initialize object)
    def __init__(self, vector_store, text_template, top_n):
        self.vector_store = vector_store
        self.text_template = text_template
        self.top_n = top_n

    def search(self, input_variables=None):
        valid_prompt, valid_input_variables = generate_valid_prompt(
            self.text_template, input_variables)

        query = valid_prompt.format(**valid_input_variables)

        res = self.vector_store.similarity_search(query, k=self.top_n)

        logger.debug("Query: {}\n".format(query))
        logger.debug("Similar Docs: {}\n".format(res))

        return "\t".join(res)