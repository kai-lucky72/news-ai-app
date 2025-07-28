from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from upload import router as upload_router
from news_ingest import router as news_ingest_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(news_ingest_router)
