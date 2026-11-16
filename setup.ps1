$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

Write-Host '== MedMart setup =='

$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    throw 'Python 3.11+ is required and was not found on PATH.'
}

$pgBin = 'C:\Program Files\PostgreSQL\17\bin'
if (-not (Test-Path (Join-Path $pgBin 'psql.exe'))) {
    throw 'PostgreSQL 15/16+ is required and psql was not found in the standard installation path.'
}

$venvPath = Join-Path $repoRoot '.venv'
if (-not (Test-Path $venvPath)) {
    Write-Host 'Creating virtual environment...'
    & python -m venv $venvPath
}

$activateScript = Join-Path $venvPath 'Scripts\Activate.ps1'
. $activateScript

Write-Host 'Installing Python requirements...'
python -m pip install --upgrade pip
python -m pip install -r (Join-Path $repoRoot 'backend\requirements.txt')

$envFile = Join-Path $repoRoot '.env'
if (-not (Test-Path $envFile)) {
    Copy-Item (Join-Path $repoRoot '.env.example') $envFile
    Write-Host 'Created .env from .env.example'
}

Write-Host 'Loading .env values...'
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^(.*?)=(.*)$' -and -not $_.StartsWith('#')) {
        $name = $matches[1]
        $value = $matches[2]
        Set-Item -Path "Env:$name" -Value $value
    }
}

$databaseUrl = $env:DATABASE_URL
if (-not $databaseUrl) {
    throw 'DATABASE_URL is missing from .env.'
}

$uri = [uri]$databaseUrl
$dbName = $uri.LocalPath.Trim('/')
if (-not $dbName) {
    throw 'DATABASE_URL does not contain a valid database name.'
}

$host = $uri.Host
$port = if ($uri.Port -gt 0) { $uri.Port } else { '5432' }
$username = $uri.UserInfo.Split(':')[0]
$password = $uri.UserInfo.Split(':', 2)[1]

$env:PGPASSWORD = $password

$createdDb = $false
& (Join-Path $pgBin 'psql.exe') -h $host -p $port -U $username -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$dbName'" 2>$null | Out-String -Stream | ForEach-Object { $_.Trim() } | Where-Object { $_ } | ForEach-Object {
    if ($_ -eq '1') { $createdDb = $true }
}

if (-not $createdDb) {
    Write-Host "Creating database $dbName ..."
    & (Join-Path $pgBin 'psql.exe') -h $host -p $port -U $username -d postgres -c "CREATE DATABASE \"$dbName\";"
}

$scriptOrder = @(
    'database/schema.sql',
    'database/triggers.sql',
    'database/procedures.sql',
    'database/views.sql',
    'database/sample_data.sql'
)

foreach ($script in $scriptOrder) {
    $path = Join-Path $repoRoot $script
    Write-Host "Running $script ..."
    & (Join-Path $pgBin 'psql.exe') -h $host -p $port -U $username -d $dbName -f $path
}

Write-Host ''
Write-Host 'Setup complete.'
Write-Host 'To start the backend:'
Write-Host '  .\.venv\Scripts\Activate.ps1'
Write-Host '  uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000'
Write-Host 'Open: http://127.0.0.1:8000/docs'
