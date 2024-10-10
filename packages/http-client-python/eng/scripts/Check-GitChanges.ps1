#Requires -Version 7.0

param(
    [string] $Exceptions
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3.0
$packageRoot = (Resolve-Path "$PSScriptRoot/../..").Path.Replace('\', '/')
. "$packageRoot/../../eng/emitters/scripts/CommandInvocation-Helpers.ps1"
Set-ConsoleEncoding

$diffExcludes = @(
    "$packageRoot/package.json"
    "$packageRoot/package-lock.json"
) | ForEach-Object { "`":(exclude)$_`"" } | Join-String -Separator ' '

Invoke-LoggedCommand "git -c core.safecrlf=false diff --ignore-space-at-eol --exit-code -- $diffExcludes" -IgnoreExitCode

if($LastExitCode -ne 0) {
    throw "Changes detected"
}

# Get the current branch name
$currentBranch = git rev-parse --abbrev-ref HEAD

# Check if the branch name starts with publish/, dependabot/, or backmerge/
if ($currentBranch -notmatch '^(publish/|dependabot/|backmerge/)') {
    Invoke-LoggedCommand "pnpm change verify"
    if ($LastExitCode -ne 0) {
        throw "Changelog verification failed"
    }
}
