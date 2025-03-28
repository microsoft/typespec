# re-build http-client-java
# hack to allow additionalProperties in this test
(Get-Content -Path "../../emitter/src/options.ts") -replace "additionalProperties: false,", "additionalProperties: true," | Set-Content -Path "../../emitter/src/options.ts"
try {
    Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..' '..'))
    ./Setup.ps1
    Set-Location $PSScriptRoot
    npm run clean && npm install
} finally {
    (Get-Content -Path "../../emitter/src/options.ts") -replace "additionalProperties: true,", "additionalProperties: false," | Set-Content -Path "../../emitter/src/options.ts"
}
