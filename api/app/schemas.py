from pydantic import BaseModel, field_validator


class EncodeRequest(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def text_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field 'text' must not be empty.")
        if len(v) > 10_000:
            raise ValueError("Field 'text' must not exceed 10,000 characters.")
        return v