param(
  [Parameter(Mandatory=$true)][string]$PostgresBackup,
  [Parameter(Mandatory=$true)][string]$MongoBackup
)
$ErrorActionPreference = "Stop"
if (!(Test-Path -LiteralPath $PostgresBackup) -or !(Test-Path -LiteralPath $MongoBackup)) { throw "Backup file not found" }
$pg = (Resolve-Path -LiteralPath $PostgresBackup).Path
$mongo = (Resolve-Path -LiteralPath $MongoBackup).Path
docker compose cp $pg postgres:/tmp/gedpro-restore.dump
if ($LASTEXITCODE -ne 0) { throw "Could not stage PostgreSQL backup" }
docker compose cp $mongo mongodb:/tmp/gedpro-restore.archive
if ($LASTEXITCODE -ne 0) { throw "Could not stage MongoDB backup" }
docker compose exec -T postgres pg_restore -U gedpro_user -d gedpro_restore --clean --if-exists /tmp/gedpro-restore.dump
if ($LASTEXITCODE -ne 0) { throw "PostgreSQL restore failed" }
docker compose exec -T mongodb mongorestore --username gedpro_user --password gedpro_password --authenticationDatabase admin --archive=/tmp/gedpro-restore.archive --drop --nsFrom='gedpro.*' --nsTo='gedpro_restore.*'
if ($LASTEXITCODE -ne 0) { throw "MongoDB restore failed" }
docker compose exec -T postgres psql -U gedpro_user -d gedpro_restore -c "SELECT count(*) AS migrations FROM migrations;"
if ($LASTEXITCODE -ne 0) { throw "PostgreSQL restore validation failed" }
docker compose exec -T mongodb mongosh --username gedpro_user --password gedpro_password --authenticationDatabase admin gedpro_restore --quiet --eval "db.getCollectionNames().length"
if ($LASTEXITCODE -ne 0) { throw "MongoDB restore validation failed" }
docker compose exec -T postgres rm -f /tmp/gedpro-restore.dump
docker compose exec -T mongodb rm -f /tmp/gedpro-restore.archive
Write-Output "Restore drill completed; inspect the counts above, then remove the isolated restore databases."
