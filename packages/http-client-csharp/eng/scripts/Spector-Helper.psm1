$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')

function IsGenerated {
    param (
        [string]$dir
    )

    if (-not ($dir.EndsWith("Generated"))) {
        return $false
    }

    $csFiles = Get-ChildItem -Path $dir -Filter *.cs -File
    return $csFiles.Count -gt 0
}

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

function IsSpecDir {
  param (
    [string]$dir
  )
  $subdirs = Get-ChildItem -Path $dir -Directory
  return -not ($subdirs) -and (Test-Path "$dir/main.tsp")
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

  return $directories | Where-Object { IsSpecDir $_.FullName } | Sort-Object {
    # relative path after "\specs\"
    $s = ($_.FullName -replace '[\\\/]','/')
    $s.Substring($_.FullName.IndexOf($pattern) + $pattern.Length)
  }
}

function Get-SubPath {
    param (
        [string]$fullPath
    )
    $specsDirectory = Get-Specs-Directory
    $azureSpecsDirectory = Get-Azure-Specs-Directory

    Write-Host $fullPath -ForegroundColor Cyan
    $fromAzure = $fullPath.FullName.Contains("azure-http-specs")

    $specFile = Join-Path $fullPath.FullName "client.tsp"
    if (-not (Test-Path $specFile)) {
      $specFile = Join-Path $fullPath.FullName "main.tsp"
    }
    $subPath = if ($fromAzure) {$fullPath.FullName.Substring($azureSpecsDirectory.Length + 1)} else {$fullPath.FullName.Substring($specsDirectory.Length + 1)}
    Write-Host "SubPath: $subPath" -ForegroundColor Cyan
    return $subPath -replace '^specs', 'http' # Keep consistent with the previous folder name because 'http' makes more sense then current 'specs'
}

Export-ModuleMember -Function "IsGenerated"
Export-ModuleMember -Function "Get-Namespace"
Export-ModuleMember -Function "Get-Sorted-Specs"
Export-ModuleMember -Function "Get-SubPath"
Export-ModuleMember -Function "IsSpecDir"
