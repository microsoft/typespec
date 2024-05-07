# Return list of nupkg artifacts
function Get-Package-Artifacts ($location, $filter)
{
    $packages = Get-ChildItem -Path $location -Filter $filter -Recurse
    if (!$packages)
    {
        Write-Host "$($location) does not have any packages matching filter $($filter)"
        return $null
    }
    return $packages[0]
}

function Find-Artifacts-For-Apireview($artifactDir, $packageName)
{
    # Find all nupkg files in given artifact directory
    $package = Get-Package-Artifacts $artifactDir "$packageName*"
    if (!$package)
    {
        Write-Host "Package is not available in artifact path $($artifactDir)"
        return $null
    }
    $packages = @{ $package.Name = $package.FullName }
    return $packages
}
