import re
from langchain import PromptTemplate


def generate_valid_prompt(text, input_variables=None):
    if input_variables is None:
        input_variables = {}

    def replace_single_braces(text):
        return re.sub(r"(?<!\{)\{([^{}]*)\}(?!\})", r"{{\1}}", text)

    escaped_text = replace_single_braces(text)

    for variable in input_variables:
        escaped_text = re.sub(
            r"{{" + re.escape(variable) + r"}}", "{" + variable + "}", escaped_text)

    prompt = PromptTemplate.from_template(escaped_text)
    valid_input_variables = {}

    for variable in prompt.input_variables:
        if variable in input_variables:
            valid_input_variables[variable] = input_variables[variable]

    for variable in prompt.input_variables:
        if variable not in valid_input_variables:
            prompt.template = re.sub(
                r"{" + variable + r"}", "{{" + variable + "}}", prompt.template)

    prompt.input_variables = list(valid_input_variables.keys())

    return prompt, valid_input_variables
