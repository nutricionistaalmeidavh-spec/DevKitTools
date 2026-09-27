param([string]$Dist='dist',[switch]$Todos)
$ErrorActionPreference='Stop'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 22+ não encontrado.' }
npm ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$ArgsMontagem=@('scripts/montar-todos.mjs','--dist',$Dist)
if ($Todos) { $ArgsMontagem += '--todos' }
node @ArgsMontagem
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$ArgsPacotes=@('scripts/montar-pacotes.mjs')
if ($Todos) { $ArgsPacotes += '--todos' }
node @ArgsPacotes
exit $LASTEXITCODE
