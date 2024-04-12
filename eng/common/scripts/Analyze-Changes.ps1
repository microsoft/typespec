#Requires -Version 7.0

param(
    [string] $TargetBranch
)

# Represents an isolated package which has its own stages in typespec - ci pipeline
class IsolatedPackage {
    [string] $Path
    [string] $RunVariable
    [bool] $RunValue

    IsolatedPackage([string]$path, [string]$runVariable, [bool]$runValue) {
        $this.Path = $path
        $this.RunVariable = $runVariable
        $this.RunValue = $runValue
    }
}

# Emitter packages in the repo
$isolatedPackages = @{
    "http-client-csharp" = [IsolatedPackage]::new("packages/http-client-csharp", "RunCSharp", $false)
    "http-client-java" = [IsolatedPackage]::new("packages/http-client-java", "RunJava", $false)
    "http-client-typescript" = [IsolatedPackage]::new("packages/http-client-typescript", "RunTypeScript", $false)
    "http-client-python" = [IsolatedPackage]::new("packages/http-client-python", "RunPython", $false)
}

# A tree representation of a set of files
# Each node represents a directory and contains a list of child nodes.
class TreeNode {
    [string] $Name
    [System.Collections.Generic.List[TreeNode]] $Children
    
    TreeNode([string]$name) {
        $this.Name = $name
        $this.Children = @()
    }

    # Add a file to the tree
    [void] Add([string]$filePath) {
        $parts = $filePath -split '/'

        $currentNode = $this
        foreach ($part in $parts) {
            $childNode = $currentNode.Children | Where-Object { $_.Name -eq $part }
            if (-not $childNode) {
                $childNode = [TreeNode]::new($part)
                $currentNode.Children.Add($childNode)
            }
            $currentNode = $childNode
        }
    }

    # Check if a file exists in the tree
    [bool] PathExists([string]$filePath) {
        $parts = $filePath -split '/'

        $currentNode = $this
        foreach ($part in $parts) {
            $childNode = $currentNode.Children | Where-Object { $_.Name -eq $part }
            if (-not $childNode) {
                return $false
            }
            $currentNode = $childNode
        }
        return $true
    }

    # Check if anything outside of emitter packages exists
    [bool] AnythingOutsideIsolatedPackagesExists($isolatedPackages) {
        $currentNode = $this

        if ($currentNode.Children.Count -eq 0) {
            return $false
        }

        # if anything in first level is not 'packages', return true
        if ($currentNode.Children[0].Name -ne 'packages') {
            return $true
        }

        $currentNode = $currentNode.Children['packages']

        # if anything in second level is not an emitter package, return true
        if ($currentNode.Children.Count -eq 0) {
            return $false
        }
        foreach ($child in $currentNode.Children) {
            if ($child.Name -notin $isolatedPackages.Keys) {
                return $true
            }
        }
        
        return $false
    }

    [string] ToString() {
        return $this.Name
    }
}

# initialize tree
$root = [TreeNode]::new('Root')

# add all changed files to the tree
Write-Host "Checking for changes in current branch compared to $TargetBranch"
$result = git diff --name-only origin/$TargetBranch...
if ($LASTEXITCODE -ne 0) {
    Write-Host "##[error] 'git diff --name-only origin/$TargetBranch...' failed, exiting..."
    exit 1  # Exit with a non-zero exit code to indicate failure
}
Write-Host "##[group]Files changed in this pr"
$result | ForEach-Object {
    Write-Host "  - $_"
    $root.Add($_)
}
Write-Host "##[endgroup]"

# exit early if no changes detected
if ($root.Children.Count -eq 0) {
    Write-Host "##[error] No changes detected"
    exit 1
}

# set global flag to run all if common files are changed
$runAll = $root.PathExists('eng/common')

# no need to check individual packages if runAll is true
if (-not $runAll) {
    # set each isolated package flag
    foreach ($package in $isolatedPackages.Values) {
        $package.RunValue = $root.PathExists($package)
    }

    # set runCore to true if none of the 
    $runCore = $root.AnythingOutsideIsolatedPackagesExists($isolatedPackages)
}

# set log commands
if ($runAll -or $runCore) {
    Write-Host "Setting RunCore to true"
    Write-Host "##vso[task.setvariable variable=RunCore;isOutput=true]true"
}

# foreach isolated package, set log commands if the RunValue is true
foreach ($package in $isolatedPackages.Values) {
    if ($runAll -or $package.RunValue) {
        $variable = $package.RunVariable
        Write-Host "Setting $variable to true"
        Write-Host "##vso[task.setvariable variable=$variable;isOutput=true]true"
    }
}
