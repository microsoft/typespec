# Return list of nupkg artifacts
function Get-Package-Artifacts ($Location)
{
  $pkgs = @(Get-ChildItem $Location -Recurse | Where-Object -FilterScript {$_.Name.EndsWith(".nupkg") -and -not $_.Name.EndsWith(".symbols.nupkg")})
  if (!$pkgs)
  {
    Write-Host "$($Location) does not have any package"
    return $null
  }
  # returning first for now
  return $pkgs[0]
}

function Find-Artifacts-For-Apireview($artifactDir, $packageName)
{
  # Find all nupkg files in given artifact directory
  $PackageArtifactPath = Join-Path $artifactDir $packageName
  $pkg = Get-Package-Artifacts $PackageArtifactPath
  if (!$pkg)
  {
    Write-Host "Package is not available in artifact path $($PackageArtifactPath)"
    return $null
  }
  $packages = @{ $pkg.Name = $pkg.FullName }
  return $packages
}
