import enum


class LlmApiType(enum.Enum):
    OPENAI = "openai"

    @staticmethod
    def keys():
        return LlmApiType.__members__.keys()

    @staticmethod
    def values():
        return [member.value for member in LlmApiType]


class TestType(enum.Enum):
    TEST = "test"
