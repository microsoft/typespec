# re-build http-client-java
# hack to allow additionalProperties in this test
try {
    Push-Location $PSScriptRoot
    try {
        (Get-Content -Path "../../emitter/src/options.ts") -replace "additionalProperties: false,", "additionalProperties: true," | Set-Content -Path "../../emitter/src/options.ts"
    } finally {
        Pop-Location
    }

    Push-Location (Resolve-Path (Join-Path $PSScriptRoot '..' '..'))
    try {
        ./Setup.ps1
    } finally {
        Pop-Location
    }

    Push-Location $PSScriptRoot
    try {
        npm run clean && npm install
    } finally {
        Pop-Location
    }
} finally {
    Push-Location $PSScriptRoot
    try {
        (Get-Content -Path "../../emitter/src/options.ts") -replace "additionalProperties: true,", "additionalProperties: false," | Set-Content -Path "../../emitter/src/options.ts"
    } finally {
        Pop-Location
    }
}
