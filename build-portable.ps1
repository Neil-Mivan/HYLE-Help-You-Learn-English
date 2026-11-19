param([ValidatePattern('^\d+\.\d+\.\d+$')][string]$ReleaseVersion = '0.2.0')

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root = $PSScriptRoot
$jar = Join-Path $root 'target/hyle.jar'
$cache = Join-Path $root '.portable-cache'
$dist = Join-Path $root 'dist'
$name = "HYLE-Windows-Portable-v$ReleaseVersion-x64"
$zip = Join-Path $dist "$name.zip"
$jreFile = 'OpenJDK17U-jre_x64_windows_hotspot_17.0.21_9.zip'
$jreUrl = "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.21%2B9/$jreFile"
$jreHash = 'fe4656bd78fb09812dc38c49da777f79cc33e7ee435a254be82f9e7f40d9d117'
$download = Join-Path $cache $jreFile
if ((Test-Path -LiteralPath $zip) -or (Test-Path -LiteralPath "$zip.sha256")) { throw "Refusing to overwrite release assets: $zip" }
if (!(Test-Path -LiteralPath $jar)) { throw 'Build the release JAR with mvn clean package first.' }
$archive = [IO.Compression.ZipFile]::OpenRead($jar)
try {
    if (!$archive.GetEntry('BOOT-INF/classes/static/index.html')) { throw 'The JAR does not contain the Vue application.' }
    $reader = [IO.StreamReader]::new($archive.GetEntry('META-INF/MANIFEST.MF').Open())
    try { $manifest = $reader.ReadToEnd() } finally { $reader.Dispose() }
    if ($manifest -notmatch "(?m)^Implementation-Version: $([regex]::Escape($ReleaseVersion))\r?$") { throw 'JAR and release versions differ.' }
} finally { $archive.Dispose() }

New-Item -ItemType Directory -Force -Path $cache,$dist | Out-Null
if (!(Test-Path -LiteralPath $download)) {
    Invoke-WebRequest -UseBasicParsing -Uri $jreUrl -OutFile $download
}
if ((Get-FileHash -LiteralPath $download -Algorithm SHA256).Hash -ne $jreHash) { throw "JRE checksum mismatch: $download" }
# Use a new, empty staging directory; never copy the working tree or local settings.
$stage = New-Item -ItemType Directory -Path (Join-Path $cache ('portable-' + [guid]::NewGuid()))
$pkg = New-Item -ItemType Directory -Path (Join-Path $stage.FullName $name)
$unpack = Join-Path $stage.FullName 'temurin'
[IO.Compression.ZipFile]::ExtractToDirectory($download, $unpack)
$jre = @(Get-ChildItem -LiteralPath $unpack -Directory)
if ($jre.Count -ne 1 -or !(Test-Path -LiteralPath (Join-Path $jre[0].FullName 'bin/java.exe')) -or !(Test-Path -LiteralPath (Join-Path $jre[0].FullName 'legal/java.base/LICENSE'))) { throw 'Incomplete Temurin runtime.' }
Copy-Item -LiteralPath $jre[0].FullName -Destination (Join-Path $pkg.FullName 'runtime') -Recurse
foreach ($file in @('hyle.jar','START-HYLE.cmd','configure-api.cmd','configure-api.ps1','README-zh-CN.txt','.env.example')) {
    $source = switch ($file) {
        'hyle.jar' { $jar }
        'README-zh-CN.txt' { Join-Path $root 'PORTABLE-README-zh-CN.txt' }
        '.env.example' { Join-Path $root $file }
        default { Join-Path $root "portable/$file" }
    }
    Copy-Item -LiteralPath $source -Destination (Join-Path $pkg.FullName $file)
}
[IO.Compression.ZipFile]::CreateFromDirectory($pkg.FullName, $zip, [IO.Compression.CompressionLevel]::Optimal, $true)
$hash = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant()
Set-Content -LiteralPath "$zip.sha256" -Value "$hash  $name.zip" -Encoding ASCII
Write-Output "$zip  SHA-256: $hash"
