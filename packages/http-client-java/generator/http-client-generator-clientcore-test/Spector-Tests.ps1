#Requires -Version 7.0

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0

Write-Host "Running Spector tests"

Write-Host "Starting the Spector server"
npm run spector-start
Write-Host "Compile and run the tests"
mvn clean test --no-transfer-progress -T 1C
if ($LASTEXITCODE -ne 0) {
    throw "Spector tests failed in clientcore"
}
Write-Host "Stopping the Spector server"
npm run spector-stop

Write-Host "Finished running the Spector tests"
