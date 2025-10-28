$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')

$failingSpecs = @(
  Join-Path 'http' 'payload' 'xml'
  Join-Path 'http' 'type' 'model' 'flatten'
  Join-Path 'http' 'type' 'model' 'templated'
  Join-Path 'http' 'client' 'naming' # pending until https://github.com/microsoft/typespec/issues/5653 is resolved
  Join-Path 'http' 'streaming' 'jsonl'
)

$azureAllowSpecs = @(
  Join-Path 'http' 'client' 'structure' 'client-operation-group'
  Join-Path 'http' 'client' 'structure' 'default'
  Join-Path 'http' 'client' 'structure' 'multi-client'
  Join-Path 'http' 'client' 'structure' 'renamed-operation'
  Join-Path 'http' 'client' 'structure' 'two-operation-group'
  Join-Path 'http' 'resiliency' 'srv-driven'
)

function Capitalize-FirstLetter {
    param (
        [string]$inputString
    )

    if ([string]::IsNullOrEmpty($inputString)) {
        return $inputString
    }

    $firstChar = $inputString[0].ToString().ToUpper()
    $restOfString = $inputString.Substring(1)

    return $firstChar + $restOfString
}

function Get-Namespace {
    param (
        [string]$dir
    )

    $words = $dir.Split('-')
    $namespace = ""
    foreach ($word in $words) {
        $namespace += Capitalize-FirstLetter $word
    }
    return $namespace
}

function IsValidSpecDir {
  param (
    [string]$fullPath
  )
  if (-not(Test-Path "$fullPath/main.tsp")){
    return $false;
  }

  $fromAzure = $fullPath.Contains("azure-http-specs")
  $subPath = Get-SubPath $fullPath
  if ($fromAzure) {
    return $azureAllowSpecs.Contains($subPath)
  }
  
  if ($failingSpecs.Contains($subPath)) {
    Write-Host "Skipping $subPath" -ForegroundColor Yellow
    return $false
  }
  
  return $true
}

function Get-Specs-Directory {
  $packageRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')
  return Join-Path $packageRoot 'node_modules' '@typespec' 'http-specs'
}

function Get-Azure-Specs-Directory {
  $packageRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')
  return Join-Path $packageRoot 'node_modules' '@azure-tools' 'azure-http-specs'
}

function Get-Sorted-Specs {
  $specsDirectory = Get-Specs-Directory
  $azureSpecsDirectory = Get-Azure-Specs-Directory

  $directories = @(Get-ChildItem -Path "$specsDirectory/specs" -Directory -Recurse)
  $directories += @(Get-ChildItem -Path "$azureSpecsDirectory/specs" -Directory -Recurse)

  $sep = [System.IO.Path]::DirectorySeparatorChar
  $pattern = "${sep}specs${sep}"

  return $directories | Where-Object { IsValidSpecDir $_.FullName } | ForEach-Object {

    # Pick client.tsp if it exists, otherwise main.tsp
    $specFile = Join-Path $_.FullName "client.tsp"
    if (-not (Test-Path $specFile)) {
      $specFile = Join-Path $_.FullName "main.tsp"
    }

    # Extract the relative path after "specs/" and normalize slashes
    $relativePath = ($specFile -replace '[\\\/]', '/').Substring($_.FullName.IndexOf($pattern) + $pattern.Length)

    # Remove the filename to get just the directory path
    $dirPath = $relativePath -replace '/[^/]+\.tsp$', ''

    # Produce an object with the path for sorting
    [PSCustomObject]@{
      SpecFile = $specFile
      DirPath = $dirPath
    }
  } | Sort-Object -Property @{Expression = { $_.DirPath -replace '/', '!' }; Ascending = $true} | ForEach-Object { $_.SpecFile }
}

function Get-SubPath {
    param (
        [string]$fullPath
    )
    $specsDirectory = Get-Specs-Directory
    $azureSpecsDirectory = Get-Azure-Specs-Directory
    
    $fromAzure = $fullPath.Contains("azure-http-specs")
    $subPath = if ($fromAzure) {$fullPath.Substring($azureSpecsDirectory.Length + 1)} else {$fullPath.Substring($specsDirectory.Length + 1)}

    # Keep consistent with the previous folder name because 'http' makes more sense then current 'specs'
    $subPath = $subPath -replace '^specs', 'http' 
    
    # also strip off the spec file name if present
    $leaf = Split-Path -Leaf $subPath
    if ($leaf -like '*.tsp') {
      return (Split-Path $subPath)
    }
    
    return $subPath
}

Export-ModuleMember -Function "Get-Namespace"
Export-ModuleMember -Function "Get-Sorted-Specs"
Export-ModuleMember -Function "Get-SubPath"
