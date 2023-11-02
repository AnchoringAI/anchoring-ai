from langchain.document_loaders import YoutubeLoader
from youtube_transcript_api import NoTranscriptFound, TranscriptsDisabled
from urllib.error import HTTPError, URLError
from config import logger
import os

class YouTubeTranscript:
    """YouTube Transcript class."""

    def get_transcript(self, text_obj, input_variables=None):
        """Execute YouTube Transcript Extraction."""
        video_url = text_obj.text_convert(input_variables=input_variables)
        
        # Instantiate the YoutubeLoader with the given URL
        loader = YoutubeLoader.from_youtube_url(
            video_url,
            add_video_info=True,
            language=["en"],
            translation="en"
        )

        try:
            loader = YoutubeLoader.from_youtube_url(
                video_url,
                add_video_info=True,
                language=["en"],
                translation="en"
            )
            documents = loader.load()
            transcript = [doc.dict() for doc in documents]
        except ValueError as ve:
            logger.error(f"Value error: {ve}")
            transcript = []
        except (HTTPError, URLError) as net_err:
            logger.error(f"Network error: {net_err}")
            transcript = []
        except ImportError as imp_err:
            logger.error(f"Import error: {imp_err}")
            transcript = []
        except (TranscriptsDisabled, NoTranscriptFound) as api_err:
            logger.error(f"API error: {api_err}")
            transcript = []
        except Exception as e:
            logger.error(f"An unexpected error occurred: {e}")
            transcript = []

        logger.debug(f"Transcript: {transcript}")
        return transcript
