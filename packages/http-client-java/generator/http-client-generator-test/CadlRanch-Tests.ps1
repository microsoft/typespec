#Requires -Version 7.0

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0

try {
    Write-Host "Running cadl ranch tests"
    Write-Host "Starting the test server"
    npm run testserver-start
    mvn clean test --no-transfer-progress -T 1C
    Write-Host "Stopping the test server"
    npm run testserver-stop
    
}
finally {
    Write-Host "Finished running the cadl ranch tests"
}
