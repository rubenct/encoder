import pytest
from app.services.encoder_service import EncoderService


class TestEncodeToBase64:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.service = EncoderService()

    def test_hello_world(self):
        assert self.service.encode_to_base64("Hello, World!") == "SGVsbG8sIFdvcmxkIQ=="

    def test_empty_string(self):
        assert self.service.encode_to_base64("") == ""

    def test_unicode(self):
        result = self.service.encode_to_base64("Héllo")
        assert isinstance(result, str)
        assert len(result) > 0

    def test_special_characters(self):
        result = self.service.encode_to_base64("!@#$%^&*()")
        assert isinstance(result, str)


class TestStreamChars:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.service = EncoderService()

    @pytest.mark.asyncio
    async def test_streams_all_characters(self, monkeypatch):
        async def mock_sleep(duration):
            pass

        monkeypatch.setattr("asyncio.sleep", mock_sleep)
        chars = []
        async for char in self.service.stream_chars("Hi"):
            chars.append(char)
        expected = list(self.service.encode_to_base64("Hi"))
        assert chars == expected

    @pytest.mark.asyncio
    async def test_stream_empty_string(self, monkeypatch):
        async def mock_sleep(duration):
            pass

        monkeypatch.setattr("asyncio.sleep", mock_sleep)
        chars = []
        async for char in self.service.stream_chars(""):
            chars.append(char)
        assert chars == []