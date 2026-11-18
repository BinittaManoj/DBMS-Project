from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime

from .. import crud
from ..database import get_db
from ..models import Inventory
from ..schemas import InventoryCreate, InventoryOut, InventoryUpdate, RestockRequest

router = APIRouter()


@router.get('/', response_model=list[InventoryOut])
def list_inventory(db: Session = Depends(get_db)):
    return crud.fetch_inventory(db)


@router.get('/status', response_model=list[dict])
def inventory_status(db: Session = Depends(get_db)):
    return crud.fetch_inventory_status(db)


@router.post('/restock', status_code=status.HTTP_200_OK)
def restock(payload: RestockRequest, db: Session = Depends(get_db)):
    try:
        return crud.restock_inventory(db, payload.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post('/', response_model=InventoryOut, status_code=status.HTTP_201_CREATED)
def create_inventory(payload: InventoryCreate, db: Session = Depends(get_db)):
    # Check if this branch + product pair already exists
    existing = db.query(Inventory).filter(
        Inventory.branch_id == payload.branch_id,
        Inventory.product_id == payload.product_id,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f'Product #{payload.product_id} is already stocked in Branch #{payload.branch_id}. Use Restock or Update instead.',
        )
    item = Inventory(**payload.model_dump())
    item.last_restocked_at = datetime.utcnow()
    item.updated_at = datetime.utcnow()
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put('/{branch_id}/{product_id}', response_model=InventoryOut)
def update_inventory(branch_id: int, product_id: int, payload: InventoryUpdate, db: Session = Depends(get_db)):
    item = db.query(Inventory).filter(
        Inventory.branch_id == branch_id,
        Inventory.product_id == product_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail='Inventory record not found')

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            setattr(item, field, val)

    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    return item


@router.delete('/{branch_id}/{product_id}', status_code=status.HTTP_200_OK)
def delete_inventory(branch_id: int, product_id: int, db: Session = Depends(get_db)):
    item = db.query(Inventory).filter(
        Inventory.branch_id == branch_id,
        Inventory.product_id == product_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail='Inventory record not found')

    db.delete(item)
    try:
        db.commit()
        return {'success': True, 'message': f'Inventory record for Branch {branch_id}, Product {product_id} removed.'}
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail='Cannot delete inventory record: it is referenced by existing transactions or alerts.',
        ) from exc


@router.get('/alerts')
def list_alerts(
    branch_id: int = Query(None),
    is_resolved: bool = Query(None),
    db: Session = Depends(get_db),
):
    query = """
        SELECT a.alert_id, a.branch_id, b.branch_name,
               a.product_id, p.product_name, p.medicine_code,
               a.current_quantity AS current_qty, a.reorder_level,
               a.is_resolved, a.created_at, a.resolved_at
        FROM low_stock_alerts a
        JOIN branches b ON b.branch_id = a.branch_id
        JOIN products p ON p.product_id = a.product_id
        WHERE (:bid IS NULL OR a.branch_id = :bid)
          AND (:res IS NULL OR a.is_resolved = :res)
        ORDER BY a.created_at DESC
        LIMIT 100
    """
    res = db.execute(text(query), {'bid': branch_id, 'res': is_resolved}).fetchall()
    keys = ['alert_id', 'branch_id', 'branch_name', 'product_id', 'product_name', 'medicine_code', 'current_qty', 'reorder_level', 'is_resolved', 'created_at', 'resolved_at']
    out = []
    for r in res:
        d = dict(zip(keys, r))
        if d['created_at']: d['created_at'] = d['created_at'].isoformat()
        if d['resolved_at']: d['resolved_at'] = d['resolved_at'].isoformat()
        out.append(d)
    return out


@router.post('/alerts/{alert_id}/resolve')
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    db.execute(
        text("UPDATE low_stock_alerts SET is_resolved = TRUE, resolved_at = NOW() WHERE alert_id = :aid"),
        {'aid': alert_id}
    )
    db.commit()
    return {'success': True, 'message': f'Alert #{alert_id} marked as resolved.'}

