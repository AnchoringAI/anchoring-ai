from langchain.chat_models import ChatAnthropic
from langchain.schema import HumanMessage

class AnthropicProcessor:
    # Constructor (initialize object)
    def __init__(
        self,
        model_name="claude-2",
        temperature=0.7,
        max_tokens=256,
        top_p=1,
        api_key="",
        cache_enable=True,
    ):
        self.llm = ChatAnthropic(
            model=model_name,
            temperature=temperature,
            max_tokens_to_sample=max_tokens,
            top_p=top_p,
            anthropic_api_key=api_key,
            cache=cache_enable,
        )

    def complete(self, text):
        """Complete."""
        chat = self.llm
        messages = [
            HumanMessage(content=text),
        ]
        response = chat(messages)

        return {
            "result": response.content,
        }

    @staticmethod
    def check_params_dict(params_dict):
        valid_key_set = set(AnthropicProcessor.__init__.__code__.co_varnames)
        keys = list(params_dict.keys())
        for key in keys:
            if key not in valid_key_set:
                del params_dict[key]

        if "temperature" not in params_dict:
            params_dict["temperature"] = 0.7

        if "max_tokens" not in params_dict:
            params_dict["max_tokens"] = 1000

        if "top_p" in params_dict:
            params_dict["top_p"] = 1

        if "api_key" not in params_dict:
            params_dict["api_key"] = ""

        return params_dict
