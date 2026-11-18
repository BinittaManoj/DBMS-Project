from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from datetime import datetime

from .. import crud
from ..database import get_db
from ..models import Inventory, Product, Branch
from ..schemas import InventoryCreate, InventoryOut, InventoryUpdate, RestockRequest, InventoryAddMedicinePayload

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
        # Instead of failing with 409, increment stock gracefully
        existing.quantity += payload.quantity
        if payload.reorder_level is not None:
            existing.reorder_level = payload.reorder_level
        if payload.batch_number:
            existing.batch_number = payload.batch_number
        if payload.expiry_date:
            existing.expiry_date = payload.expiry_date
        existing.last_restocked_at = datetime.utcnow()
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing

    item = Inventory(**payload.model_dump())
    item.last_restocked_at = datetime.utcnow()
    item.updated_at = datetime.utcnow()
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.post('/add-medicine', status_code=status.HTTP_201_CREATED)
def add_medicine_to_inventory_and_catalog(payload: InventoryAddMedicinePayload, db: Session = Depends(get_db)):
    """
    Adds medicine to branch inventory. If the medicine is new (not in catalog),
    it automatically creates the product in the catalog table first.
    """
    branch = db.query(Branch).filter(Branch.branch_id == payload.branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail=f'Branch #{payload.branch_id} not found')

    prod_id = payload.product_id
    new_product_created = False

    # If product_id is not given or user provided a custom product_name
    if not prod_id:
        if not payload.product_name or not payload.product_name.strip():
            raise HTTPException(status_code=400, detail='Please provide a medicine name or select from catalog.')

        # Check if already in catalog by name (case-insensitive)
        existing_prod = db.query(Product).filter(
            func.lower(Product.product_name) == payload.product_name.strip().lower()
        ).first()

        if existing_prod:
            prod_id = existing_prod.product_id
        else:
            # Generate next medicine code
            next_code = db.execute(text("SELECT nextval('medicine_code_seq')")).scalar_one()
            medicine_code = f'MED-{next_code:06d}'
            cat_id = payload.category_id or 1
            sup_id = payload.supplier_id or 1
            u_price = float(payload.unit_price or 100.0)
            c_price = float(payload.cost_price or (u_price * 0.7))

            new_prod = Product(
                medicine_code=medicine_code,
                product_name=payload.product_name.strip(),
                brand=payload.brand or 'Generic',
                category_id=cat_id,
                supplier_id=sup_id,
                unit_price=u_price,
                cost_price=c_price,
                unit_of_measure=payload.unit_of_measure or 'STRIP',
                requires_prescription=payload.requires_prescription,
                drug_schedule=payload.drug_schedule or 'OTC',
                is_active=True,
                created_at=datetime.utcnow(),
            )
            db.add(new_prod)
            db.commit()
            db.refresh(new_prod)
            prod_id = new_prod.product_id
            new_product_created = True

    # Now stock in inventory for this branch
    existing_inv = db.query(Inventory).filter(
        Inventory.branch_id == payload.branch_id,
        Inventory.product_id == prod_id,
    ).first()

    if existing_inv:
        existing_inv.quantity += payload.quantity
        if payload.reorder_level:
            existing_inv.reorder_level = payload.reorder_level
        if payload.batch_number:
            existing_inv.batch_number = payload.batch_number
        if payload.expiry_date:
            existing_inv.expiry_date = payload.expiry_date
        existing_inv.last_restocked_at = datetime.utcnow()
        existing_inv.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_inv)
        item = existing_inv
    else:
        item = Inventory(
            branch_id=payload.branch_id,
            product_id=prod_id,
            quantity=payload.quantity,
            reorder_level=payload.reorder_level,
            batch_number=payload.batch_number or 'BATCH-2026',
            expiry_date=payload.expiry_date,
            last_restocked_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(item)
        db.commit()
        db.refresh(item)

    prod = db.query(Product).filter(Product.product_id == prod_id).first()

    return {
        'success': True,
        'message': f"'{prod.product_name}' stocked successfully at {branch.branch_name}!" + (' (New medicine added to Catalog)' if new_product_created else ''),
        'new_product_created': new_product_created,
        'product_id': prod_id,
        'product_name': prod.product_name,
        'branch_id': payload.branch_id,
        'quantity': item.quantity,
    }


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

