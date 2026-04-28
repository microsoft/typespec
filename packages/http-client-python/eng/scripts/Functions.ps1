<#
.SYNOPSIS
    Helper functions for finding package artifacts.

.DESCRIPTION
    These functions are used by the publishing pipeline to locate
    built package artifacts for API review and publishing.
#>

<#
.SYNOPSIS
    Gets package artifacts from a directory.

.PARAMETER location
    The directory containing the packages folder.

.PARAMETER filter
    Filter pattern for matching package files.
#>
function Get-Package-Artifacts {
    param(
        [string] $location,
        [string] $filter
    )

    # Convert typespec package filter to API json filter
    $filterToUse = if ($filter.StartsWith("typespec-")) {
        $filter.SubString(0, $filter.Length - 1) + ".api.json"
    } else {
        $filter
    }

    $packages = Get-ChildItem -Path "$location/packages" -Filter $filterToUse -Recurse
    if (!$packages) {
        Write-Host "$location/packages does not have any packages matching filter $filterToUse"
        return $null
    }

    return $packages[0]
}

<#
.SYNOPSIS
    Finds artifacts for API review.

.PARAMETER artifactDir
    Directory containing build artifacts.

.PARAMETER packageName
    Name of the package to find.
#>
function Find-Artifacts-For-Apireview {
    param(
        [string] $artifactDir,
        [string] $packageName
    )

    $package = Get-Package-Artifacts $artifactDir "$packageName*"
    if (!$package) {
        Write-Host "Package is not available in artifact path $artifactDir/packages"
        return $null
    }

    return @{ $package.Name = $package.FullName }
}
