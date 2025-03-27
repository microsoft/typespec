# Use case:
#
# The purpose of this script is to compact the steps required to regenerate TypeSpec into a single script.
#
param (
  [int] $Parallelization = [Environment]::ProcessorCount
)


$ExitCode = 0

if ($Parallelization -lt 1) {
  $Parallelization = 1
}

Write-Host "Parallelization: $Parallelization"


$generateScript = {
  $tspFile = $_

  $tspClientFile = $tspFile -replace 'main.tsp', 'client.tsp'
  if (($tspClientFile -match 'client.tsp$') -and (Test-Path $tspClientFile)) {
    $tspFile = $tspClientFile
  }

  # With TypeSpec code generation being parallelized, we need to make sure that the output directory is unique
  # for each test run. We do this by appending a random number to the output directory.
  # Without this, we could have multiple runs trying to write to the same directory which introduces race conditions.
  $tspOptions = "--option ""@typespec/http-client-java.emitter-output-dir={project-root}/tsp-output/$(Get-Random)"""

  $tspTrace = "--trace import-resolution --trace projection --trace http-client-java"
  $tspCommand = "npx --no-install tsp compile $tspFile $tspOptions $tspTrace"

  # output of "tsp compile" seems trigger powershell error or exit, hence the ">$null 2>&1"
  $timer = [Diagnostics.Stopwatch]::StartNew()
  Invoke-Expression $tspCommand >$null 2>&1
  $timer.Stop()

  $global:ExitCode = $global:ExitCode -bor $LASTEXITCODE

  if ($LASTEXITCODE -ne 0) {
    Write-Host "
  ========================
  $tspCommand
  ========================
  FAILED (Time elapsed: $($timer.ToString()))
    "
  } else {
    Write-Host "
  ========================
  $tspCommand
  ========================
  SUCCEEDED (Time elapsed: $($timer.ToString()))
    "
  }

  if ($global:ExitCode -ne 0) {
    throw "Failed to generate from tsp $tspFile"
  }
}

./Setup.ps1

if (Test-Path ./src/main) {
  Remove-Item ./src/main -Recurse -Force
}
if (Test-Path ./src/samples) {
  Remove-Item ./src/samples -Recurse -Force
}
if (Test-Path ./tsp-output) {
  Remove-Item ./tsp-output -Recurse -Force
}

# generate for http-specs/azure-http-specs test sources
Copy-Item -Path node_modules/@typespec/http-specs/specs -Destination ./ -Recurse -Force
# remove xml tests, emitter has not supported xml model
Remove-Item ./specs/payload/xml -Recurse -Force

$job = (Get-ChildItem ./specs -Include "main.tsp","old.tsp" -File -Recurse) | ForEach-Object -Parallel $generateScript -ThrottleLimit $Parallelization -AsJob

$job | Wait-Job -Timeout 1200
$job | Receive-Job

Remove-Item ./specs -Recurse -Force

Copy-Item -Path ./tsp-output/*/src -Destination ./ -Recurse -Force -Exclude @("module-info.java")

Remove-Item ./tsp-output -Recurse -Force

if (Test-Path ./src/main/resources/META-INF/client-structure-service_apiview_properties.json) {
  # client structure is generated from multiple client.tsp files and the last one to execute overwrites
  # the api view properties file. Because the tests run in parallel, the order is not guaranteed. This
  # causes git diff check to fail as the checked in file is not the same as the generated one.
  Remove-Item ./src/main/resources/META-INF/client-structure-service_apiview_properties.json -Force
}

if ($ExitCode -ne 0) {
  throw "Failed to generate from tsp"
}
