"""Types."""
import enum


class LlmApiType(enum.Enum):
    """LLM API type."""
    OPENAI = "openai"

    @staticmethod
    def keys():
        """Keys."""
        return LlmApiType.__members__.keys()

    @staticmethod
    def values():
        """Values."""
        return [member.value for member in LlmApiType]


class TestType(enum.Enum):
    """Test type."""
    TEST = "test"
