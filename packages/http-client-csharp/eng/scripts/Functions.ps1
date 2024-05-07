# Return list of nupkg artifacts
function Get-Package-Artifacts ($location, $filter)
{
    $pkgs = Get-ChildItem -Path $location -Filter $filter -Recurse
    if (!$pkgs)
    {
        Write-Host "$($location) does not have any packages matching filter $($filter)"
        return $null
    }
    return $pkgs[0]
}

function Find-Artifacts-For-Apireview($artifactDir, $packageName)
{
    # Find all nupkg files in given artifact directory
    $packageArtifactPath = Join-Path $artifactDir "packages"
    $pkg = Get-Package-Artifacts $packageArtifactPath "$packageName*"
    if (!$pkg)
    {
        Write-Host "Package is not available in artifact path $($packageArtifactPath)"
        return $null
    }
    $packages = @{ $pkg.Name = $pkg.FullName }
    return $packages
}
