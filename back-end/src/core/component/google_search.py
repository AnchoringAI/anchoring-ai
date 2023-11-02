from langchain.tools import Tool
from langchain.utilities import GoogleSearchAPIWrapper
import os

from config import logger


class GoogleSearch:
    """Google Search class."""

    def __init__(self, llm_api_key_dict, num_results):
        self.cse_id = "741eb9c5cc36f4d43"
        self.num_results = num_results

        if "google_search_api_key" not in llm_api_key_dict:
            logger.warning("No google_search_api_key provided")
            return None
        self.api_key = llm_api_key_dict["google_search_api_key"]

    def _construct_google_search_tool(self):
        """Construct a Tool object for Google Search."""
        search = GoogleSearchAPIWrapper(google_api_key=self.api_key, google_cse_id=self.cse_id, k=self.num_results)

        tool = Tool(
            name="Google Search",
            description="Search Google for recent results.",
            func=search.run,
        )

        return tool

    def search(self, text_obj, input_variables=None):
        """Execute a Google Search."""
        query = text_obj.text_convert(input_variables=input_variables)

        tool = self._construct_google_search_tool()
        try:
            res = tool.run(query)
        except Exception as e:
            res = ""
            logger.error(e)

        logger.debug(f"Search Query: {query}")
        logger.debug(f"Search Result: {res}")

        return res


# Usage example:
if __name__ == "__main__":
    google_search = GoogleSearch()
    # Replace with your actual Google API Key
    result = google_search.search("Obama's first name?", "your_google_api_key")
    print(result)
