#Requires -Version 7.0

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0

try {
    Write-Host "Running cadl ranch tests"

    Write-Host "Starting the test server"
    Invoke-Expression "node node_modules/\@azure-tools/cadl-ranch/dist/cli/cli.js serve node_modules/\@azure-tools/cadl-ranch-specs/http/ --coverageFile ./cadl-ranch-coverage-java.json &"

    mvn clean test

    Write-Host "Stopping the test server"
    Invoke-Expression "node node_modules/\@azure-tools/cadl-ranch/dist/cli/cli.js server stop"
}
finally {
    Write-Host "Finished running the cadl ranch tests"
}
