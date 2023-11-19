"""Open AI."""
from langchain.chat_models import ChatOpenAI
from langchain.schema import HumanMessage
from langchain.embeddings import OpenAIEmbeddings
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

from config import logger


class OpenAIProcessor:
    """Open AI processor."""

    # pylint: disable=too-many-arguments
    def __init__(
        self,
        model_name="gpt-3.5-turbo",
        temperature=0.7,
        max_tokens=256,
        n=1,
        request_timeout=120,
        openai_api_key="",
        cache_enable=True,
    ):
        self.model_name = model_name
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.n = n
        self.request_timeout = request_timeout
        self.openai_api_key = openai_api_key

        self.llm = ChatOpenAI(
            model_name=model_name,
            temperature=temperature,
            max_tokens=max_tokens,
            n=n,
            request_timeout=request_timeout,
            openai_api_key=openai_api_key,
            cache=cache_enable,
            streaming=True,
            callbacks=[StreamingStdOutCallbackHandler()],
        )

    def complete(self, text):
        """Complete."""
        chat = self.llm
        messages = [
            HumanMessage(content=text),
        ]
        response = chat(messages)
        print("response!!!!!!!!!!",response)

        return {
            "result": response.content,
        }

    @staticmethod
    def check_params_dict(params_dict):
        """Check params dict."""
        valid_key_set = set(OpenAIProcessor.__init__.__code__.co_varnames)
        keys = list(params_dict.keys())
        for key in keys:
            if key not in valid_key_set:
                del params_dict[key]
                logger.warning(f"{key} is not a valid parameter")

        if "model_name" not in params_dict:
            params_dict["model_name"] = "text-davinci-003"

        if "temperature" not in params_dict:
            params_dict["temperature"] = 0.7

        if "max_tokens" not in params_dict:
            params_dict["max_tokens"] = 256

        if "n" not in params_dict:
            params_dict["n"] = 1

        if "request_timeout" not in params_dict:
            params_dict["request_timeout"] = 600

        if "openai_api_key" not in params_dict:
            params_dict["openai_api_key"] = ""

        if "cache_enable" not in params_dict:
            params_dict["cache_enable"] = True

        return params_dict


class OpenAIEmbedding:
    """Open AI embedding."""

    # pylint: disable=too-many-arguments
    def __init__(
        self,
        model="text-embedding-ada-002",
        embedding_ctx_length=8191,
        chunk_size=1000,
        max_retries=6,
        request_timeout=60,
        openai_api_key="",
    ):
        self.embedding_model = OpenAIEmbeddings(
            model=model,
            embedding_ctx_length=embedding_ctx_length,
            chunk_size=chunk_size,
            max_retries=max_retries,
            request_timeout=request_timeout,
            openai_api_key=openai_api_key,
        )

    def embed_text(self, text):
        """Embed text."""
        return self.embedding_model.embed_query(text)

    @staticmethod
    def check_params_dict(params_dict):
        """Check params dict."""
        valid_key_set = set(OpenAIEmbedding.__init__.__code__.co_varnames)
        keys = list(params_dict.keys())
        for key in keys:
            if key not in valid_key_set:
                del params_dict[key]
                logger.warning(f"{key} is not a valid parameter")

        if "model" not in params_dict:
            params_dict["model"] = "text-embedding-ada-002"

        if "embedding_ctx_length" not in params_dict:
            params_dict["embedding_ctx_length"] = 8191

        if "chunk_size" not in params_dict:
            params_dict["chunk_size"] = 1000

        if "max_retries" not in params_dict:
            params_dict["max_retries"] = 6

        if "request_timeout" not in params_dict:
            params_dict["request_timeout"] = 60

        if "openai_api_key" not in params_dict:
            params_dict["openai_api_key"] = ""

        return params_dict
