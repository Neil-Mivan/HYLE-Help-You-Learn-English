$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot
$jar = if (Test-Path "hyle.jar") { "hyle.jar" } else { "target/hyle.jar" }
if (-not (Test-Path -LiteralPath $jar)) {
    throw "Build the Java backend first: use JDK 17+ and run mvn package in the project folder."
}
$javaCandidates = @(".\runtime\bin\java.exe")
if ($env:JAVA_HOME) { $javaCandidates += (Join-Path $env:JAVA_HOME "bin\java.exe") }
$systemJava = Get-Command java.exe -ErrorAction SilentlyContinue
if ($systemJava) { $javaCandidates += $systemJava.Source }
$jdks = Join-Path $env:USERPROFILE ".jdks"
if (Test-Path $jdks) {
    $javaCandidates += Get-ChildItem -Directory -LiteralPath $jdks | ForEach-Object { Join-Path $_.FullName "bin\java.exe" }
}
foreach ($candidate in $javaCandidates) {
    if (-not (Test-Path -LiteralPath $candidate)) { continue }
    # Java 9+ accepts --version and writes its version to stdout.
    try { $versionInfo = & $candidate --version 2>$null } catch { continue }
    if ($LASTEXITCODE -eq 0 -and "$versionInfo" -match '(?:java|openjdk)\s+(\d+)' -and [int]$Matches[1] -ge 17) {
        & $candidate -jar $jar
        exit $LASTEXITCODE
    }
}
throw "Set JAVA_HOME to a JDK 17+ installation and run again."
