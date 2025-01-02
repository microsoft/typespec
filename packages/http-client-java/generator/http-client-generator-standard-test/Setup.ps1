# re-build http-client-java
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..' '..'))

./Setup.ps1

Set-Location $PSScriptRoot

npm run clean && npm install
