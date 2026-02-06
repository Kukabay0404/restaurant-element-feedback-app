from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from crud.feedback import (
    create_feedback as create_feedback_crud,
    delete_feedback as delete_feedback_crud,
    get_feedback_by_id,
    get_feedback_list,
    set_feedback_approved,
)
from schemas.feedback import FeedbackCreate, FeedbackOut
from db.session import get_db
from core.deps import get_current_user

router = APIRouter(
    prefix='/feedback',
    tags=['Feedback']
)

@router.post(
    path='/create',
    response_model=FeedbackOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_feedback(payload : FeedbackCreate, db : AsyncSession = Depends(get_db)):
    return await create_feedback_crud(db=db, payload=payload)

@router.get(
    path='/',
    response_model=list[FeedbackOut],
)
async def list_feedback(db: AsyncSession = Depends(get_db)):
    return await get_feedback_list(db=db)

@router.delete(
    path='/delete/{f_id}', 
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
)
async def delete_feedback(
    f_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
) -> None:
    feedback = await get_feedback_by_id(f_id=f_id, db=db)
    if not feedback:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Feedback not found')
    await delete_feedback_crud(feedback=feedback, db=db)
    return None

@router.get(
    path='/admin',
    response_model=list[FeedbackOut],
)
async def list_feedback_admin(
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    return await get_feedback_list(db=db, approved_only=False)

@router.patch(
    path='/admin/{f_id}/approve',
    response_model=FeedbackOut,
)
async def approve_feedback(
    f_id: int,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    feedback = await get_feedback_by_id(f_id=f_id, db=db)
    if not feedback:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Feedback not found')
    return await set_feedback_approved(feedback=feedback, is_approved=True, db=db)
