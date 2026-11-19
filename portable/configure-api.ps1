$ErrorActionPreference = 'Stop'
$secret = Read-Host 'Paste your complete Alibaba Cloud Model Studio API Key' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
    $key = ([Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) -replace '[\u200B-\u200D\uFEFF]', '').Trim()
    if ($key.Length -lt 12 -or $key.Length -gt 512 -or $key -cnotmatch '^sk-[!-~]+$' -or $key.Contains('*')) {
        throw 'Invalid or masked API key. Nothing was saved.'
    }
    $path = Join-Path $PSScriptRoot '.env.local'
    $lines = if ([IO.File]::Exists($path)) { [IO.File]::ReadAllLines($path) }
    $lines = @($lines | Where-Object { $null -ne $_ -and $_ -notmatch '^\s*DASHSCOPE_API_KEY\s*=' }) + "DASHSCOPE_API_KEY=$key"
    [IO.File]::WriteAllLines($path, [string[]]$lines, [Text.UTF8Encoding]::new($false))
    Write-Host 'Saved locally. Close HYLE and run START-HYLE.cmd again.'
} finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr); $secret.Dispose() }
