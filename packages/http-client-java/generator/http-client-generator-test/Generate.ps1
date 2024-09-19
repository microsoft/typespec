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
  if ($tspFile -match "type[\\/]enum[\\/]extensible[\\/]") {
    # override namespace for reserved keyword "enum"
    $tspOptions += " --option ""@typespec/http-client-java.namespace=com.type.enums.extensible"""
  } elseif ($tspFile -match "type[\\/]enum[\\/]fixed[\\/]") {
    # override namespace for reserved keyword "enum"
    $tspOptions += " --option ""@typespec/http-client-java.namespace=com.type.enums.fixed"""
  } elseif ($tspFile -match "azure[\\/]example[\\/]basic[\\/]") {
    # override examples-directory
    $tspOptions += " --option ""@typespec/http-client-java.examples-directory={project-root}/http/azure/example/basic/examples"""
  } elseif ($tspFile -match "resiliency[\\/]srv-driven[\\/]old\.tsp") {
    # override namespace for "resiliency/srv-driven/old.tsp" (make it different to that from "main.tsp")
    $tspOptions += " --option ""@typespec/http-client-java.namespace=com.resiliency.servicedriven.v1"""
    # enable advanced versioning for resiliency test
    $tspOptions += " --option ""@typespec/http-client-java.advanced-versioning=true"""
    $tspOptions += " --option ""@typespec/http-client-java.api-version=all"""
  } elseif ($tspFile -match "resiliency[\\/]srv-driven[\\/]main\.tsp") {
    # enable advanced versioning for resiliency test
    $tspOptions += " --option ""@typespec/http-client-java.advanced-versioning=true"""
    $tspOptions += " --option ""@typespec/http-client-java.api-version=all"""
  } elseif ($tspFile -match "azure[\\/]resource-manager[\\/].*[\\/]main\.tsp") {
    # for mgmt, do not generate tests due to random mock values
    $tspOptions += " --option ""@typespec/http-client-java.generate-tests=false"""
    # also generate with group-etag-headers=false since mgmt doesn't support etag grouping yet
    $tspOptions += " --option ""@typespec/http-client-java.group-etag-headers=false"""
  } elseif ($tspFile -match "tsp[\\/]versioning.tsp") {
    # test generating from specific api-version
    $tspOptions += " --option ""@typespec/http-client-java.api-version=2022-09-01"""
    # exclude preview from service versions
    $tspOptions += " --option ""@typespec/http-client-java.service-version-exclude-preview=true"""
  } elseif ($tspFile -match "arm.tsp") {
    # for mgmt, do not generate tests due to random mock values
    $tspOptions += " --option ""@typespec/http-client-java.generate-tests=false"""
    # also don't generate with stream-style-serialization as azure-core-management hasn't migrated to azure-json yet
    $tspOptions += " --option ""@typespec/http-client-java.stream-style-serialization=false"""
    # also generate with group-etag-headers=false since mgmt doesn't support etag grouping yet
    $tspOptions += " --option ""@typespec/http-client-java.group-etag-headers=false"""
    # also test generating from specific api-version
    $tspOptions += " --option ""@typespec/http-client-java.api-version=2023-11-01"""
    # exclude preview from service versions
    $tspOptions += " --option ""@typespec/http-client-java.service-version-exclude-preview=true"""
  } elseif ($tspFile -match "arm-stream-style-serialization.tsp") {
    $tspOptions += " --option ""@typespec/http-client-java.stream-style-serialization=true"""
    # for mgmt, do not generate tests due to random mock values
    $tspOptions += " --option ""@typespec/http-client-java.generate-tests=false"""
    # also generate with group-etag-headers=false since mgmt doesn't support etag grouping yet
    $tspOptions += " --option ""@typespec/http-client-java.group-etag-headers=false"""
  }

  # Test customization for one of the TypeSpec definitions - naming.tsp
  if ($tspFile -match "tsp[\\/]naming.tsp$") {
    # Add the customization-class option for Java emitter
    $tspOptions += " --option ""@typespec/http-client-java.customization-class=../../customization/src/main/java/CustomizationTest.java"""
  }

  $tspTrace = "--trace import-resolution --trace projection --trace http-client-java"
  $tspCommand = "npx tsp compile $tspFile $tspOptions $tspTrace"

  $timer = [Diagnostics.Stopwatch]::StartNew()
  $generateOutput = Invoke-Expression $tspCommand
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
    exit $global:ExitCode
  }
}

Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..' '..'))

npm install
npm run build
npm pack

Set-Location $PSScriptRoot


if (Test-Path node_modules) {
  Remove-Item node_modules -Recurse -Force
}

if (Test-Path package-lock.json) {
  Remove-Item package-lock.json
}

# delete output
if (Test-Path tsp-output) {
  Remove-Item tsp-output -Recurse -Force
}
npm install 

New-Item -Path ./existingcode/src/main/java/com/cadl/ -ItemType Directory -Force | Out-Null

if (Test-Path ./src/main/java/com/cadl/partialupdate) {
  Copy-Item -Path ./src/main/java/com/cadl/partialupdate -Destination ./existingcode/src/main/java/com/cadl/partialupdate -Recurse -Force
}

if (Test-Path ./src/main) {
  Remove-Item ./src/main -Recurse -Force
}
if (Test-Path ./src/samples) {
  Remove-Item ./src/samples -Recurse -Force
}
if (Test-Path ./tsp-output) {
  Remove-Item ./tsp-output -Recurse -Force
}

# run other local tests except partial update
$job = Get-Item ./tsp/* -Filter "*.tsp" -Exclude "*partialupdate*" | ForEach-Object -Parallel $generateScript -ThrottleLimit $Parallelization -AsJob

$job | Wait-Job -Timeout 600
$job | Receive-Job

# partial update test
npx tsp compile ./tsp/partialupdate.tsp --option="@typespec/http-client-java.emitter-output-dir={project-root}/existingcode"
Copy-Item -Path ./existingcode/src/main/java/com/cadl/partialupdate -Destination ./src/main/java/com/cadl/partialupdate -Recurse -Force
Remove-Item ./existingcode -Recurse -Force

# run cadl ranch tests sources
Copy-Item -Path node_modules/@azure-tools/cadl-ranch-specs/http -Destination ./ -Recurse -Force
# remove xml tests, emitter has not supported xml model
Remove-Item ./http/payload/xml -Recurse -Force

$job = (Get-ChildItem ./http -Include "main.tsp","old.tsp" -File -Recurse) | ForEach-Object -Parallel $generateScript -ThrottleLimit $Parallelization -AsJob

$job | Wait-Job -Timeout 1200
$job | Receive-Job

Remove-Item ./http -Recurse -Force

Copy-Item -Path ./tsp-output/*/src -Destination ./ -Recurse -Force -Exclude @("ReadmeSamples.java", "module-info.java")

Remove-Item ./tsp-output -Recurse -Force

if (Test-Path ./src/main/resources/META-INF/client-structure-service_apiview_properties.json) {
  # client structure is generated from multiple client.tsp files and the last one to execute overwrites
  # the api view properties file. Because the tests run in parallel, the order is not guaranteed. This
  # causes git diff check to fail as the checked in file is not the same as the generated one.
  Remove-Item ./src/main/resources/META-INF/client-structure-service_apiview_properties.json -Force
}
