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

  # output of "tsp compile" seems trigger powershell error or exit, hence the "2>&1"
  $timer = [Diagnostics.Stopwatch]::StartNew()
  $generateOutput = Invoke-Expression $tspCommand 2>&1
  $timer.Stop()

  $global:ExitCode = $global:ExitCode -bor $LASTEXITCODE

  if ($LASTEXITCODE -ne 0) {
    Write-Host "
    ========================
    $tspCommand
    ========================
    FAILED (Time elapsed: $($timer.ToString()))
    $([String]::Join("`n", $generateOutput))
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

function Generate-Compile ($folder) {
  npx --no-install tsp compile "smoke/$folder/main.tsp" --option "@typespec/http-client-java.emitter-output-dir={project-root}/$folder"

  Push-Location $folder
  mvn package
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to compile smoke test of $folder"
  }
  Pop-Location

  Remove-Item $folder -Recurse -Force
}

Push-Location $PSScriptRoot
try {
  ./Setup.ps1
  Write-Host "Setup Complete"

  if (Test-Path ./src/main) {
    Remove-Item ./src/main -Recurse -Force
  }
  if (Test-Path ./src/samples) {
    Remove-Item ./src/samples -Recurse -Force
  }
  if (Test-Path ./tsp-output) {
    Remove-Item ./tsp-output -Recurse -Force
  }

  Write-Host "Removed src/main, src/samples and tsp-output directories"

  # generate for http-specs/azure-http-specs test sources
  Copy-Item -Path node_modules/@typespec/http-specs/specs -Destination ./ -Recurse -Force

  Write-Host "Copied http-specs to current directory"

  $job = (Get-ChildItem ./specs -Include "main.tsp","old.tsp" -File -Recurse) | ForEach-Object -Parallel $generateScript -ThrottleLimit $Parallelization -AsJob

  $job | Wait-Job -Timeout 1200
  $job | Receive-Job

  Remove-Item ./specs -Recurse -Force

  Copy-Item -Path ./tsp-output/*/src -Destination ./ -Recurse -Force -Exclude @("module-info.java")

  Remove-Item ./tsp-output -Recurse -Force

  if (Test-Path ./src/main/resources/META-INF/client-structure-service_metadata.json) {
    # client structure is generated from multiple client.tsp files and the last one to execute overwrites
    # the api view properties file. Because the tests run in parallel, the order is not guaranteed. This
    # causes git diff check to fail as the checked in file is not the same as the generated one.
    Remove-Item ./src/main/resources/META-INF/client-structure-service_metadata.json -Force
  }

  # smoke test, generate Java project and verify compilation pass
  Copy-Item -Path node_modules/@typespec/http-specs/smoke -Destination ./smoke -Recurse -Force
  Generate-Compile todoapp
  Generate-Compile petstore
  Remove-Item ./smoke -Recurse -Force

  if ($ExitCode -ne 0) {
    throw "Failed to generate from tsp"
  }
} finally {
  Pop-Location
}
