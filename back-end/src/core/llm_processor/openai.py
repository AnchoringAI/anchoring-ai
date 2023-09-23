from langchain.llms import OpenAI
from langchain.embeddings import OpenAIEmbeddings
from langchain.chains import LLMChain
from langchain.callbacks import get_openai_callback

from config import logger


class OpenAIProcessor:
    # Constructor (initialize object)
    def __init__(self, model_name="text-davinci-003",
                 temperature=0.7,
                 max_tokens=256,
                 top_p=1,
                 frequency_penalty=0,
                 presence_penalty=0,
                 n=1,
                 request_timeout=60,
                 logit_bias=None,
                 openai_api_key="",
                 cache_enable=True):

        if logit_bias is None:
            logit_bias = {}

        self.model_name = model_name
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.top_p = top_p
        self.frequency_penalty = frequency_penalty
        self.presence_penalty = presence_penalty
        self.n = n
        self.request_timeout = request_timeout
        self.logit_bias = logit_bias
        self.openai_api_key = openai_api_key

        self.llm = OpenAI(model_name=model_name,
                          temperature=temperature,
                          max_tokens=max_tokens,
                          top_p=top_p,
                          frequency_penalty=frequency_penalty,
                          presence_penalty=presence_penalty,
                          n=n,
                          request_timeout=request_timeout,
                          logit_bias=logit_bias,
                          openai_api_key=openai_api_key,
                          cache=cache_enable)

    def complete(self, prompt, input_variables=None):
        llm_chain = LLMChain(llm=self.llm, prompt=prompt)

        with get_openai_callback() as cb:
            res = llm_chain(inputs=input_variables)

            logger.debug("Total Tokens: {}".format(cb.total_tokens))
            logger.debug("Prompt Tokens: {}".format(cb.prompt_tokens))
            logger.debug("Completion Tokens: {}".format(cb.completion_tokens))
            logger.debug("Successful Requests: {}".format(
                cb.successful_requests))
            logger.debug("Total Cost (USD): ${}".format(cb.total_cost))

            return {
                "result": res.get("text", ""),
                "total_tokens": cb.total_tokens,
                "prompt_tokens": cb.prompt_tokens,
                "completion_tokens": cb.completion_tokens,
                "successful_requests": cb.successful_requests,
                "total_cost": cb.total_cost
            }

    @staticmethod
    def check_params_dict(params_dict):
        valid_key_set = set(OpenAIProcessor.__init__.__code__.co_varnames)
        keys = list(params_dict.keys())
        for key in keys:
            if key not in valid_key_set:
                del params_dict[key]
                logger.warning("{} is not a valid parameter".format(key))

        if "model_name" not in params_dict:
            params_dict["model_name"] = "text-davinci-003"

        if "temperature" not in params_dict:
            params_dict["temperature"] = 0.7

        if "max_tokens" not in params_dict:
            params_dict["max_tokens"] = 256

        if "top_p" in params_dict:
            params_dict["top_p"] = 1

        if "frequency_penalty" in params_dict:
            params_dict["frequency_penalty"] = 0

        if "presence_penalty" in params_dict:
            params_dict["presence_penalty"] = 0

        if "n" in params_dict:
            params_dict["n"] = 1

        if "request_timeout" in params_dict:
            params_dict["request_timeout"] = 600

        if "logit_bias" in params_dict:
            params_dict["logit_bias"] = None

        if "openai_api_key" not in params_dict:
            params_dict["openai_api_key"] = ""

        if "cache_enable" in params_dict:
            params_dict["cache_enable"] = True

        return params_dict


class OpenAIEmbedding:
    # Constructor (initialize object)
    def __init__(self, model="text-embedding-ada-002",
                 embedding_ctx_length=8191,
                 chunk_size=1000,
                 max_retries=6,
                 request_timeout=60,
                 openai_api_key=""):
        self.embedding_model = OpenAIEmbeddings(model=model,
                                                embedding_ctx_length=embedding_ctx_length,
                                                chunk_size=chunk_size,
                                                max_retries=max_retries,
                                                request_timeout=request_timeout,
                                                openai_api_key=openai_api_key)

    def embed_text(self, text):
        return self.embedding_model.embed_query(text)

    @staticmethod
    def check_params_dict(params_dict):
        valid_key_set = set(OpenAIEmbedding.__init__.__code__.co_varnames)
        keys = list(params_dict.keys())
        for key in keys:
            if key not in valid_key_set:
                del params_dict[key]
                logger.warning("{} is not a valid parameter".format(key))

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

