import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import engine
from .models import Base
from .routers import branches, customers, inventory, products, reports, sales, suppliers, analytics

Base.metadata.reflect(bind=engine)

app = FastAPI(title='MedMart Retail Analytics', version='1.0.0', docs_url='/docs')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(branches.router, prefix='/api/branches', tags=['branches'])
app.include_router(products.router, prefix='/api/products', tags=['products'])
app.include_router(suppliers.router, prefix='/api/suppliers', tags=['suppliers'])
app.include_router(customers.router, prefix='/api/customers', tags=['customers'])
app.include_router(inventory.router, prefix='/api/inventory', tags=['inventory'])
app.include_router(sales.router, prefix='/api/sales', tags=['sales'])
app.include_router(reports.router, prefix='/api/reports', tags=['reports'])
app.include_router(analytics.router, prefix='/api/analytics', tags=['analytics'])

frontend_dir = Path(__file__).resolve().parent.parent / 'frontend'
app.mount('/static', StaticFiles(directory=str(frontend_dir)), name='static')

@app.get('/')
async def root():
    return {'message': 'MedMart API is running', 'docs': '/docs'}


@app.get('/health')
async def health():
    return {'status': 'ok'}


@app.get('/index.html')
async def serve_index():
    return FileResponse(frontend_dir / 'index.html')


from fastapi.responses import FileResponse

for page in ['branches.html', 'products.html', 'suppliers.html', 'customers.html', 'inventory.html', 'sales.html', 'manager.html', 'cashier.html']:
    @app.get(f'/{page}')
    async def serve_page(page_name: str = page):
        return FileResponse(frontend_dir / page_name)
