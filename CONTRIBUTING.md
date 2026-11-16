# Contributing

## Team workflow

This project is designed for a 4-student team. The recommended roles are:

1. Database lead — schema, triggers, procedures, views
2. Reporting and sample data lead — SQL queries, reports, sample_data.sql
3. Backend lead — FastAPI backend, CRUD, routers, validation
4. Frontend lead — HTML, CSS, JavaScript, UX

## Branching

- Always work from `main`.
- Create a feature branch before starting work:

```powershell
git checkout main
git pull origin main
git checkout -b feature/<name>
```

Example:

```powershell
git checkout -b feature/db-schema
```

## Rules

- Do not edit another teammate's area without checking first.
- Keep changes small and meaningful.
- Commit with clear messages.
- Open a pull request before merging into `main`.
- Never commit a real `.env` file.

## Pull request checklist

- Code runs locally
- Database schema still loads without errors
- Tests pass or are clearly marked as skipped if DB access is not configured
- No TODOs or placeholders remain

## Git commands

```powershell
git status
git add .
git commit -m "Add schema and constraints"
git push -u origin feature/<name>
```

## Setup

```powershell
git init
```

Then add a remote when ready:

```powershell
git remote add origin <url>
git push -u origin main
```
