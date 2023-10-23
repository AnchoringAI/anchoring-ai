"""Chain."""
from config import logger


class Chain:
    """Chain."""

    def __init__(self):
        self.action_list = []
        self.length = 0

    def add_text(self, text_obj, name, is_input=False, is_output=True):
        """Add text."""
        self.action_list.append(
            {"type": "text", "object": text_obj, "name": name,
             "is_input": is_input, "is_output": is_output})
        self.length += 1

    def add_prompt(self, prompt_obj, name, is_input=False, is_output=True):
        """Add prompt."""
        self.action_list.append(
            {"type": "prompt", "object": prompt_obj, "name": name,
             "is_input": is_input, "is_output": is_output})
        self.length += 1

    # pylint: disable=too-many-arguments
    def add_parser(self, parser_obj, text_obj, name, is_input=False, is_output=True):
        """Add parser."""
        self.action_list.append(
            {"type": "parser", "object": parser_obj, "text_obj": text_obj, "name": name,
             "is_input": is_input,
             "is_output": is_output})
        self.length += 1

    def add_google_search(self, google_search_obj, text_obj, name, is_input=False, is_output=True):
        """Add Google search."""
        self.action_list.append(
            {"type": "parser", "object": google_search_obj, "text_obj": text_obj, "name": name,
             "is_input": is_input,
             "is_output": is_output})
        self.length += 1

    def add_table(self, table_obj, name, is_input=False, is_output=True):
        """Add table."""
        self.action_list.append(
            {"type": "table", "object": table_obj, "name": name,
             "is_input": is_input, "is_output": is_output})
        self.length += 1

    def add_doc_search(self, doc_search_obj, name, is_input=False, is_output=True):
        """Add doc search."""
        self.action_list.append(
            {"type": "doc_search", "object": doc_search_obj, "name": name,
             "is_input": is_input,
             "is_output": is_output})
        self.length += 1

    def run(self, input_variables=None):
        """Run."""
        if input_variables is None:
            input_variables = {}

        chain_outputs = {}
        count = 1

        for action in self.action_list:
            logger.debug(f"Chain Action {count} Start")
            if action["type"] == "table":
                res = action["object"].load_variables(
                    input_variables=input_variables)
                input_variables.update(res)
                logger.debug(res)

                if action["is_output"]:
                    chain_outputs.update(res)
            elif action["type"] == "text":
                name = action["name"]
                res = action["object"].text_convert(
                    input_variables=input_variables)
                input_variables[name] = res
                logger.debug(res)

                if action["is_output"]:
                    chain_outputs[name] = res
            elif action["type"] == "prompt":
                name = action["name"]
                res = action["object"].complete(
                    input_variables=input_variables)
                input_variables[name] = res
                logger.debug(res)

                if action["is_output"]:
                    chain_outputs[name] = res
            elif action["type"] == "parser":
                text_obj = action["text_obj"]
                name = action["name"]
                res = action["object"].parse(
                    text_obj, input_variables=input_variables)
                input_variables[name] = res
                logger.debug(res)

                if action["is_output"]:
                    chain_outputs[name] = res
            elif action["type"] == "google_search":
                text_obj = action["text_obj"]
                name = action["name"]
                res = action["object"].search(
                    text_obj, input_variables=input_variables)
                input_variables[name] = res
                logger.debug(res)

                if action["is_output"]:
                    chain_outputs[name] = res
            elif action["type"] == "doc_search":
                name = action["name"]
                res = action["object"].search(
                    input_variables=input_variables)
                input_variables[name] = res
                logger.debug(res)

                if action["is_output"]:
                    chain_outputs[name] = res

            logger.debug(f"Chain action {count} completed")
            count += 1

        return chain_outputs
