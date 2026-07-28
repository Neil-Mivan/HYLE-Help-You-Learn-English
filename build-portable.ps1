param(
  [ValidateSet("x64", "arm64")]
  [string]$Architecture = "x64",

  [ValidatePattern("^v\d+\.\d+\.\d+$")]
  [string]$NodeVersion = "",

  [string]$ReleaseVersion = "0.1.0"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$cacheRoot = Join-Path $projectRoot ".portable-cache"
$distRoot = Join-Path $projectRoot "dist"
$nodeChannel = if ($NodeVersion) { $NodeVersion } else { "latest-v22.x" }
$nodeBaseUrl = "https://nodejs.org/dist/$nodeChannel"
$checksumUrl = "$nodeBaseUrl/SHASUMS256.txt"

New-Item -ItemType Directory -Force -Path $cacheRoot | Out-Null
New-Item -ItemType Directory -Force -Path $distRoot | Out-Null

Write-Host "Reading the official Node.js checksums..."
$checksumFile = Join-Path $cacheRoot "SHASUMS256-$nodeChannel.txt"
Invoke-WebRequest -Uri $checksumUrl -OutFile $checksumFile -UseBasicParsing
$checksums = Get-Content -LiteralPath $checksumFile
$pattern = "^(?<hash>[0-9a-f]{64})\s+(?<file>node-(?<version>v\d+\.\d+\.\d+)-win-$Architecture\.zip)$"
$match = $null
foreach ($line in $checksums) {
  if ($line -match $pattern) {
    $match = $Matches
    break
  }
}

if (-not $match) {
  throw "Could not find a Windows $Architecture Node.js archive in $checksumUrl."
}

$expectedHash = $match.hash.ToLowerInvariant()
$nodeArchiveName = $match.file
$resolvedNodeVersion = $match.version
$nodeArchive = Join-Path $cacheRoot $nodeArchiveName

if (-not (Test-Path -LiteralPath $nodeArchive)) {
  Write-Host "Downloading Node.js $resolvedNodeVersion for Windows $Architecture..."
  Invoke-WebRequest -Uri "$nodeBaseUrl/$nodeArchiveName" -OutFile $nodeArchive -UseBasicParsing
}

$actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $nodeArchive).Hash.ToLowerInvariant()
if ($actualHash -ne $expectedHash) {
  Remove-Item -LiteralPath $nodeArchive -Force
  throw "Node.js archive checksum verification failed. The downloaded file was removed."
}
Write-Host "Node.js checksum verified."

$nodeExtractRoot = Join-Path $cacheRoot "node-$resolvedNodeVersion-win-$Architecture"
if (-not (Test-Path -LiteralPath (Join-Path $nodeExtractRoot "node.exe"))) {
  $temporaryExtractRoot = Join-Path $cacheRoot "extract-$resolvedNodeVersion-$Architecture"
  if (Test-Path -LiteralPath $temporaryExtractRoot) {
    Remove-Item -LiteralPath $temporaryExtractRoot -Recurse -Force
  }
  Expand-Archive -LiteralPath $nodeArchive -DestinationPath $temporaryExtractRoot -Force
  $expandedFolder = Join-Path $temporaryExtractRoot "node-$resolvedNodeVersion-win-$Architecture"
  if (-not (Test-Path -LiteralPath (Join-Path $expandedFolder "node.exe"))) {
    throw "The verified Node.js archive did not contain node.exe."
  }
  if (Test-Path -LiteralPath $nodeExtractRoot) {
    Remove-Item -LiteralPath $nodeExtractRoot -Recurse -Force
  }
  Move-Item -LiteralPath $expandedFolder -Destination $nodeExtractRoot
  Remove-Item -LiteralPath $temporaryExtractRoot -Recurse -Force
}

$packageName = "HYLE-Windows-Portable-v$ReleaseVersion-$Architecture"
$packageRoot = Join-Path $distRoot $packageName
$archivePath = Join-Path $distRoot "$packageName.zip"

if (Test-Path -LiteralPath $packageRoot) {
  $resolvedPackageRoot = [System.IO.Path]::GetFullPath($packageRoot)
  $resolvedDistRoot = [System.IO.Path]::GetFullPath($distRoot)
  if (-not $resolvedPackageRoot.StartsWith($resolvedDistRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to replace a package directory outside dist."
  }
  Remove-Item -LiteralPath $packageRoot -Recurse -Force
}
if (Test-Path -LiteralPath $archivePath) {
  Remove-Item -LiteralPath $archivePath -Force
}

$runtimeRoot = Join-Path $packageRoot "runtime"
New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null

$applicationFiles = @(
  "index.html",
  "styles.css",
  "app.js",
  "server.mjs",
  "start.cmd",
  "launch.cmd",
  "launch-hidden.vbs",
  "configure-api.cmd",
  "configure-api.mjs",
  ".env.example"
)

foreach ($file in $applicationFiles) {
  $source = Join-Path $projectRoot $file
  if (-not (Test-Path -LiteralPath $source)) {
    throw "Required application file is missing: $file"
  }
  Copy-Item -LiteralPath $source -Destination (Join-Path $packageRoot $file)
}

Copy-Item -LiteralPath (Join-Path $nodeExtractRoot "node.exe") -Destination (Join-Path $runtimeRoot "node.exe")
Copy-Item -LiteralPath (Join-Path $nodeExtractRoot "LICENSE") -Destination (Join-Path $runtimeRoot "NODE-LICENSE.txt")

$startText = @'
@echo off
setlocal
cd /d "%~dp0"

if not exist "%~dp0launch.cmd" goto not_extracted
if not exist "%~dp0start.cmd" goto not_extracted
if not exist "%~dp0server.mjs" goto not_extracted
if not exist "%~dp0runtime\node.exe" goto not_extracted

call "%~dp0launch.cmd"
set "HYLE_EXIT_CODE=%errorlevel%"
if not "%HYLE_EXIT_CODE%"=="0" pause
exit /b %HYLE_EXIT_CODE%

:not_extracted
echo.
echo HYLE could not find all required files.
echo Right-click the ZIP file, choose "Extract All", then run START-HYLE.cmd from the extracted folder.
powershell -NoProfile -EncodedCommand VwByAGkAdABlAC0ASABvAHMAdAAgACIA94tIUfNTLpUgAFoASQBQACAAh2X2Tgz/CZDpYhwgaFHokOOJi1Mpfx0gDP+NUc5O44mLUw5UhHaHZfZOOVnQj0yIIABTAFQAQQBSAFQALQBIAFkATABFAC4AYwBtAGQAAjAiAA==
echo.
pause
exit /b 2
'@
Set-Content -LiteralPath (Join-Path $packageRoot "START-HYLE.cmd") -Value $startText -Encoding ASCII
Copy-Item -LiteralPath (Join-Path $projectRoot "PORTABLE-README-zh-CN.txt") -Destination (Join-Path $packageRoot "README-zh-CN.txt")

$manifest = [ordered]@{
  application = "HYLE Help You Learn English"
  releaseVersion = $ReleaseVersion
  architecture = $Architecture
  bundledNodeVersion = $resolvedNodeVersion
  builtAtUtc = [DateTime]::UtcNow.ToString("o")
}
$manifest | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $packageRoot "portable-manifest.json") -Encoding UTF8

$forbiddenFiles = @(".env", ".env.local", ".git")
foreach ($forbiddenFile in $forbiddenFiles) {
  if (Test-Path -LiteralPath (Join-Path $packageRoot $forbiddenFile)) {
    throw "Privacy check failed: $forbiddenFile was included in the package."
  }
}

Compress-Archive -LiteralPath $packageRoot -DestinationPath $archivePath -CompressionLevel Optimal
$archiveHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $archivePath).Hash.ToLowerInvariant()
Set-Content -LiteralPath "$archivePath.sha256" -Value "$archiveHash  $packageName.zip" -Encoding ASCII

Write-Host ""
Write-Host "Portable package created successfully:"
Write-Host $archivePath
Write-Host "SHA-256: $archiveHash"
