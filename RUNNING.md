# Running MedMart locally

This repository contains a FastAPI backend and a React/Vite dashboard in
`frontend-react`. PostgreSQL stores the application data.

## Requirements

- Windows PowerShell
- Python 3.11 or newer
- Node.js 20.19+ (or 22.12+) and npm
- PostgreSQL 15 or newer, running locally

## First-time setup

Run these commands from the repository root in PowerShell:

```powershell
Copy-Item .env.example .env
notepad .env
```

Set `DATABASE_URL` in `.env` to match your local PostgreSQL username, password,
host, port, and database name. The example uses `retail_db`.

Initialize the Python environment, install backend dependencies, create the
database if needed, and load the SQL schema and sample data:

```powershell
.\setup.ps1
```

The setup script currently expects PostgreSQL's `psql.exe` at
`C:\Program Files\PostgreSQL\17\bin\psql.exe`. If PostgreSQL is installed
elsewhere, update `$pgBin` near the top of `setup.ps1` to its `bin` directory.
The SQL initialization scripts are intended for a fresh database; do not rerun
them against a database that already contains the schema and sample data.

Install the frontend dependencies:

```powershell
Set-Location .\frontend-react
npm ci
Set-Location ..
```

## Start the application

Start the backend and frontend in two separate PowerShell windows. Run both
commands from the repository root.

**Terminal 1 — backend API:**

```powershell
.\.venv\Scripts\Activate.ps1
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 — React dashboard:**

```powershell
Set-Location .\frontend-react
npm run dev -- --host 127.0.0.1 --port 3000 --strictPort
```

Open the dashboard at <http://127.0.0.1:3000>. The API documentation is at
<http://127.0.0.1:8000/docs>, and its health check is
<http://127.0.0.1:8000/health>.

Use the seeded demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| General Manager | `gm@medmart.in` | `manager123` |
| Branch Manager 1 | `branch1@medmart.in` | `branch123` |
| Branch Manager 2 | `branch2@medmart.in` | `branch456` |
| Branch Manager 3 | `branch3@medmart.in` | `branch789` |

## Stop and restart

Press `Ctrl+C` in each terminal to stop its server. To start again, repeat the
two commands in **Start the application**; setup and dependency installation do
not need to be repeated unless dependencies or the database have changed.

## Optional checks

From the repository root:

```powershell
.\.venv\Scripts\Activate.ps1
pytest tests -v
```

From `frontend-react`:

```powershell
npm run lint
npm run build
```

The repository also has a legacy static UI in `frontend/`, served by FastAPI.
The React/Vite dashboard described above is the current interactive management
UI.
