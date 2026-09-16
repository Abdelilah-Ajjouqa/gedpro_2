param([string]$Destination = "backups")
$ErrorActionPreference = "Stop"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory -Force -Path $Destination | Out-Null
docker compose exec -T postgres pg_dump -U gedpro_user -d gedpro_db -Fc -f /tmp/gedpro-backup.dump
if ($LASTEXITCODE -ne 0) { throw "PostgreSQL backup failed" }
docker compose exec -T mongodb mongodump --username gedpro_user --password gedpro_password --authenticationDatabase admin --db gedpro --archive=/tmp/gedpro-backup.archive
if ($LASTEXITCODE -ne 0) { throw "MongoDB backup failed" }
docker compose cp postgres:/tmp/gedpro-backup.dump "$Destination/postgres-$stamp.dump"
if ($LASTEXITCODE -ne 0) { throw "Could not copy PostgreSQL backup" }
docker compose cp mongodb:/tmp/gedpro-backup.archive "$Destination/mongodb-$stamp.archive"
if ($LASTEXITCODE -ne 0) { throw "Could not copy MongoDB backup" }
docker compose exec -T postgres rm -f /tmp/gedpro-backup.dump
docker compose exec -T mongodb rm -f /tmp/gedpro-backup.archive
Write-Output "Created PostgreSQL and MongoDB backups in $Destination ($stamp)"
