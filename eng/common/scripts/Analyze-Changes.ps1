#Requires -Version 7.0

param(
    [string] $TargetBranch
)

# Represents an isolated package which has its own stages in typespec - ci pipeline
class IsolatedPackage {
    [string[]] $Paths
    [string] $RunVariable
    [bool] $RunValue

    IsolatedPackage([string[]]$paths, [string]$runVariable, [bool]$runValue) {
        $this.Paths = $paths
        $this.RunVariable = $runVariable
        $this.RunValue = $runValue
    }
}

# Emitter packages in the repo
$isolatedPackages = @{
    "http-client-csharp" = [IsolatedPackage]::new(@("packages/http-client-csharp", ".editorconfig"), "RunCSharp", $false)
    "http-client-java" = [IsolatedPackage]::new(@("packages/http-client-java"), "RunJava", $false)
    "http-client-typescript" = [IsolatedPackage]::new(@("packages/http-client-typescript"), "RunTypeScript", $false)
    "http-client-python" = [IsolatedPackage]::new(@("packages/http-client-python"), "RunPython", $false)
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
        if ($this.Children.Count -eq 0) {
            return $false
        }

        # if anything in first level is not 'packages', return true
        foreach ($child in $this.Children) {
            # skip .prettierignore, .prettierrc.json, cspell.yaml, esling.config.json since these are all covered by github actions globally
            if ($child.Name -in @('.prettierignore', '.prettierrc.json', 'cspell.yaml', 'esling.config.json')) {
                continue
            }

            if ($child.Name -ne 'packages') {
                return $true
            }
        }

        $packagesNode = $this.Children | Where-Object { $_.Name -eq "packages" }
        if (-not $packagesNode) {
            return $false
        }
        
        # if anything in second level is not an emitter package, return true
        foreach ($child in $packagesNode.Children) {
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

function Get-ActiveVariables($changes) {
    # initialize tree
    $root = [TreeNode]::new('Root')
    $variables = @()

    $changes | ForEach-Object {
        $root.Add($_)
    }
    
    # exit early if no changes detected
    if ($root.Children.Count -eq 0) {
        Write-Host "##[error] No changes detected"
        exit 1
    }

    # set global flag to run all if common files are changed
    $runAll = $root.PathExists('eng/common') -or $root.PathExists('vitest.config.ts')

    # set global isolated package flag to run if any eng/emiters files changed
    $runIsolated = $root.PathExists('eng/emitters')

    # no need to check individual packages if runAll is true
    if (-not $runAll) {
        if (-not $runIsolated) {
            # set each isolated package flag
            foreach ($package in $isolatedPackages.Values) {
                foreach ($path in $package.Paths) {
                    $package.RunValue = $package.RunValue -or $root.PathExists($path)
                    if ($package.RunValue) {
                        break
                    }
                }
            }
        }

        # set runCore to true if none of the 
        $runCore = $root.AnythingOutsideIsolatedPackagesExists($isolatedPackages)
    }

    # set log commands
    if ($runAll -or $runCore) {
        $variables += "RunCore"
    }

    # foreach isolated package, set log commands if the RunValue is true
    foreach ($package in $isolatedPackages.Values) {
        if ($runAll -or $runIsolated -or $package.RunValue) {
            $variables += $package.RunVariable
        }
    }

    return $variables
}


# add all changed files to the tree
Write-Host "Checking for changes in current branch compared to $TargetBranch"
$changes = git diff --name-only origin/$TargetBranch...

Write-Host "##[group]Files changed in this pr"
$changes | ForEach-Object {
    Write-Host "  - $_"
}
Write-Host "##[endgroup]"

if ($LASTEXITCODE -ne 0) {
    Write-Host "##[error] 'git diff --name-only origin/$TargetBranch...' failed, exiting..."
    exit 1  # Exit with a non-zero exit code to indicate failure
}

$variables = Get-ActiveVariables $changes
foreach ($variable in $variables) {
    Write-Host "Setting $variable to true"
    Write-Host "##vso[task.setvariable variable=$variable;isOutput=true]true"
}
