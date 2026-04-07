import base64
import asyncio
import random
from typing import AsyncGenerator


class EncoderService:
    MIN_DELAY: float = 1.0
    MAX_DELAY: float = 5.0

    def encode_to_base64(self, text: str) -> str:
        """Encodes plain text to Base64."""
        return base64.b64encode(text.encode("utf-8")).decode("utf-8")

    async def stream_chars(self, text: str) -> AsyncGenerator[str, None]:
        """Yields one character at a time with a random pause between each."""
        encoded = self.encode_to_base64(text)
        for char in encoded:
            delay = random.uniform(self.MIN_DELAY, self.MAX_DELAY)
            await asyncio.sleep(delay)
            yield char