# Return list of nupkg artifacts
function Get-Package-Artifacts ($location, $filter)
{
    $filterToUse = $flter.EndsWith(".tgz") ? $filter.Replace(".tgz", ".api.json") : $filter

    $packages = Get-ChildItem -Path "$location/packages" -Filter $filterToUse -Recurse
    if (!$packages)
    {
        Write-Host "$($location)/packages does not have any packages matching filter $($filterToUse)"
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
        Write-Host "Package is not available in artifact path $($artifactDir)/packages"
        return $null
    }
    $packages = @{ $package.Name = $package.FullName }
    return $packages
}
