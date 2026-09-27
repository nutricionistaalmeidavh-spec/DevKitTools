param([Parameter(Mandatory=$true)][string]$OrigemUtilidades,[string]$Dist='dist')
$ErrorActionPreference='Stop'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 22+ não encontrado.' }
npm ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node scripts/montar-todos.mjs --origem $OrigemUtilidades --dist $Dist
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node scripts/montar-pacotes.mjs
exit $LASTEXITCODE
