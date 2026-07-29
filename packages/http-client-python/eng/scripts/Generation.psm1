<#
.SYNOPSIS
    PowerShell module with helper functions for generation scripts.

.DESCRIPTION
    This module provides the Invoke function for running shell commands
    cross-platform (Windows, Linux, macOS).
#>

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')

<#
.SYNOPSIS
    Invokes a shell command cross-platform.

.PARAMETER command
    The command to execute.

.PARAMETER executePath
    The directory to execute the command in. Defaults to repo root.

.EXAMPLE
    Invoke "npm run build"
#>
function Invoke {
    param(
        [string] $command,
        [string] $executePath = $repoRoot
    )

    Write-Host "> $command" -ForegroundColor Cyan

    Push-Location $executePath
    try {
        if ($IsLinux -or $IsMacOs) {
            sh -c "$command 2>&1"
        }
        else {
            cmd /c "$command 2>&1"
        }

        if ($LastExitCode -ne 0) {
            throw "Command failed: $command"
        }
    }
    finally {
        Pop-Location
    }
}

Export-ModuleMember -Function "Invoke"
