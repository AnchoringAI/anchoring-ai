"""Doc transformer."""
from langchain.text_splitter import TokenTextSplitter

from config import logger


class TextSplitter:
    """Text splitter."""
    def __init__(self, chunk_size=1000, chunk_overlap=0):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.text_splitter = TokenTextSplitter(
            chunk_size=chunk_size, chunk_overlap=chunk_overlap)

    def split_text(self, text):
        """Split text."""
        chunk_list = self.text_splitter.split_text(text)

        return chunk_list

    @staticmethod
    def check_params_dict(params_dict):
        """Check params dict."""
        valid_key_set = set(TextSplitter.__init__.__code__.co_varnames)
        keys = list(params_dict.keys())
        for key in keys:
            if key not in valid_key_set:
                del params_dict[key]
                logger.warning(f"{key} is not a valid parameter")

        if "chunk_size" not in params_dict:
            params_dict["chunk_size"] = 1000

        if "chunk_overlap" not in params_dict:
            params_dict["chunk_overlap"] = 0

        return params_dict
