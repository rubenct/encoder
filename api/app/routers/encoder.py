from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.schemas import EncodeRequest
from app.services.encoder_service import EncoderService

router = APIRouter(prefix="/api")
service = EncoderService()


@router.post("/encode")
async def encode(request: EncodeRequest):
    async def event_generator():
        async for char in service.stream_chars(request.text):
            yield f"data: {char}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/health")
async def health():
    return {"status": "ok"}