from typing import Callable
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import time

from api.router import router as v1_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router)

@app.middleware('http')
async def search_ip(request : Request, call_next : Callable):
    start = time.perf_counter()
    response = await call_next(request)
    end = time.perf_counter() - start
    print(f'Timer: {end}')
    ip_address = [request.client.host, request.client.port]
    print(f'{ip_address=}')
    return response


if __name__ == '__main__':
    uvicorn.run('main:app', reload=True)
