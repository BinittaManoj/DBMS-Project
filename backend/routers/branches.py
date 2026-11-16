from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from .. import crud
from ..database import get_db
from ..models import Branch
from ..schemas import BranchCreate, BranchOut, BranchUpdate

router = APIRouter()


@router.get('/', response_model=list[BranchOut])
def list_branches(db: Session = Depends(get_db)):
    return crud.fetch_branches(db)


@router.get('/{branch_id}', response_model=BranchOut)
def get_branch(branch_id: int, db: Session = Depends(get_db)):
    branch = db.query(Branch).filter(Branch.branch_id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Branch not found')
    return branch


@router.post('/', response_model=BranchOut, status_code=status.HTTP_201_CREATED)
def create_branch(payload: BranchCreate, db: Session = Depends(get_db)):
    branch = Branch(**payload.model_dump())
    branch.created_at = datetime.utcnow()
    db.add(branch)
    db.commit(); db.refresh(branch)
    return branch


@router.put('/{branch_id}', response_model=BranchOut)
def update_branch(branch_id: int, payload: BranchUpdate, db: Session = Depends(get_db)):
    branch = db.query(Branch).filter(Branch.branch_id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail='Branch not found')
    for key, value in payload.model_dump().items():
        setattr(branch, key, value)
    db.commit(); db.refresh(branch)
    return branch


@router.delete('/{branch_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_branch(branch_id: int, db: Session = Depends(get_db)):
    branch = db.query(Branch).filter(Branch.branch_id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail='Branch not found')
    db.delete(branch); db.commit()
