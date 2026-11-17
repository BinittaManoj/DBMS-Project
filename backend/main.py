import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .database import engine
from .models import Base
from .routers import branches, customers, inventory, products, reports, sales, suppliers, analytics

try:
    Base.metadata.reflect(bind=engine)
except Exception:
    pass

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
if (frontend_dir / 'css').exists():
    app.mount('/css', StaticFiles(directory=str(frontend_dir / 'css')), name='css')
if (frontend_dir / 'js').exists():
    app.mount('/js', StaticFiles(directory=str(frontend_dir / 'js')), name='js')

@app.get('/')
async def root():
    index_file = frontend_dir / 'index.html'
    if index_file.exists():
        return FileResponse(index_file)
    return {'message': 'MedMart API is running', 'docs': '/docs'}

@app.get('/health')
async def health():
    return {'status': 'ok'}

@app.get('/{page_name}.html')
async def serve_html(page_name: str):
    target = frontend_dir / f"{page_name}.html"
    if target.exists():
        return FileResponse(target)
    raise HTTPException(status_code=404, detail="Page not found")
