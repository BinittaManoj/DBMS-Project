from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Employee, Branch

router = APIRouter()


@router.get('/')
def list_employees(
    branch_id: int = Query(None, description='Filter by branch ID'),
    db: Session = Depends(get_db),
):
    """Retrieve active employees with optional branch filter."""
    query = (
        db.query(Employee, Branch.branch_name)
        .join(Branch, Branch.branch_id == Employee.branch_id)
        .filter(Employee.is_active == True)
    )
    if branch_id:
        query = query.filter(Employee.branch_id == branch_id)

    results = query.order_by(Employee.first_name, Employee.last_name).all()
    employees = []
    for emp, branch_name in results:
        employees.append({
            'employee_id': emp.employee_id,
            'branch_id': emp.branch_id,
            'branch_name': branch_name,
            'first_name': emp.first_name,
            'last_name': emp.last_name,
            'full_name': f"{emp.first_name} {emp.last_name}",
            'role': emp.role,
            'phone': emp.phone,
            'email': emp.email,
            'is_active': emp.is_active,
        })
    return employees
