$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue

if ($nodeCommand) {
  $nodeExecutable = $nodeCommand.Source
} else {
  $bundledNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  if (-not (Test-Path -LiteralPath $bundledNode)) {
    throw "未找到 Node.js。请安装 Node.js 18 或更高版本后重试。"
  }
  $nodeExecutable = $bundledNode
}

Set-Location -LiteralPath $projectRoot
Write-Host "澄读将在 http://127.0.0.1:4173 启动。按 Ctrl+C 停止。"
& $nodeExecutable (Join-Path $projectRoot "server.mjs")
