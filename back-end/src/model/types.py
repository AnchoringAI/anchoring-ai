"""Types."""
import enum


class ApiType(enum.Enum):
    """API type."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE_SEARCH = "google_search"

    @staticmethod
    def keys():
        """Keys."""
        return ApiType.__members__.keys()

    @staticmethod
    def values():
        """Values."""
        return [member.value for member in ApiType]


class TestType(enum.Enum):
    """Test type."""
    TEST = "test"