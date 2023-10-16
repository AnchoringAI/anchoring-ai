"""Utils."""
from langchain.prompts import PromptTemplate


def generate_valid_prompt(text, input_variables=None):
    """Generate valid prompt."""
    if input_variables is None:
        input_variables = {}

    def replace_placeholders(template, variables):
        for key, value in variables.items():
            placeholder = f"{{{key}}}"
            template = template.replace(placeholder, str(value))
        return template

    def escape_f_string(text):
        return text.replace('{', '{{').replace('}', '}}')

    replaced_text = replace_placeholders(text, input_variables)
    escaped_text = escape_f_string(replaced_text)

    prompt = PromptTemplate.from_template("")
    prompt.template = escaped_text
    prompt.validate_template = False
    valid_input_variables = {}

    return prompt, valid_input_variables
