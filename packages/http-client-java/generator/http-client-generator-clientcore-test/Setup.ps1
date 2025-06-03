# re-build http-client-java
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
