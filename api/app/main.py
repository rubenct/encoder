import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.encoder import router

app = FastAPI(title="Base64 Streamer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://encoder-ten.vercel.app"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
async def root():
    return {"message": "Base64 Streamer API", "version": "1.0.0"}