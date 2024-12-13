#Requires -Version 7.0

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0

Write-Host "Running Spector tests"

Write-Host "Starting the test server"
npm run tsp-spector-start
Write-Host "Compile and run the tests"
mvn clean test --no-transfer-progress -T 1C
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
Write-Host "Stopping the test server"
npm run tsp-spector-stop

Write-Host "Finished running the Spector tests"
