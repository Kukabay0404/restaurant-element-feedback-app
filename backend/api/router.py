from fastapi import APIRouter

from api.v1.feedback import router as feedback_router
from api.v1.auth import router as auth_router

router = APIRouter(
    prefix='/api/v1'
)

router.include_router(feedback_router)
router.include_router(auth_router)
