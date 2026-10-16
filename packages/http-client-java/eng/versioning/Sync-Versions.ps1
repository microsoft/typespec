# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

[CmdletBinding(SupportsShouldProcess)]
param()

$ErrorActionPreference = 'Stop'

function Read-Versions([string] $Content)
{
    $versions = @{}
    foreach ($line in $Content -split '\r?\n')
    {
        $line = $line.Trim()
        if (!$line -or $line.StartsWith('#')) { continue }
        $fields = $line -split ';'
        $package = $fields[0] -replace '^testdep_', ''
        if ($package -notmatch '^[\w.-]+:[\w.-]+$')
        {
            throw "Invalid package coordinate: $line"
        }
        $versions[$package] = if ($fields.Length -gt 1) { $fields[1].Trim() } else { '' }
    }
    return $versions
}

function Resolve-Versions([hashtable] $Packages, [hashtable[]] $Sources)
{
    $versions = @{}
    foreach ($package in $Packages.Keys)
    {
        $version = $Packages[$package]
        if (!$version)
        {
            foreach ($source in $Sources)
            {
                if ($source[$package])
                {
                    $version = $source[$package]
                    break
                }
            }
        }
        if (!$version) { throw "Version not found for package $package" }
        $versions[$package] = $version
    }
    return $versions
}

function Update-VersionFiles
{
    [CmdletBinding(SupportsShouldProcess)]
    param([string] $Root, [hashtable] $Versions)

    $generator = Join-Path $Root 'generator'
    $core = Join-Path $generator 'http-client-generator-core'
    $pomFiles = @((Get-Item (Join-Path $generator 'pom.xml')).FullName)
    $pomFiles += Get-ChildItem -Path $generator -Directory | ForEach-Object {
        $pom = Join-Path $_.FullName 'pom.xml'
        if (Test-Path -LiteralPath $pom) { $pom }
    }
    $pomFiles += Join-Path $core 'src\main\resources\pom.xml'
    $pomFiles += Join-Path $generator 'http-client-generator-test\customization\pom.xml'
    $javaFile = Join-Path $core 'src\main\java\com\microsoft\typespec\http\client\generator\core\model\projectmodel\Project.java'
    $updates = @{}
    foreach ($file in $pomFiles + $javaFile)
    {
        $content = [System.IO.File]::ReadAllText($file)
        if ($file -eq $javaFile)
        {
            $pattern = '(?m)(?<prefix>^\s*[A-Z][A-Z_]*\("(?<group>[^"]+)",\s*"(?<artifact>[^"]+)",\s*")(?<version>[^"]+)(?<suffix>"\)[,;])'
        }
        else
        {
            # Match comments separately so commented-out dependencies are never changed.
            $gap = '(?:\s|<!--.*?-->)*'
            $pattern = "<!--.*?-->|(?<prefix><groupId>(?<group>[^<]+)</groupId>$gap<artifactId>(?<artifact>[^<]+)</artifactId>$gap<version>)(?<version>[^<]+)(?<suffix></version>)"
            $null = [xml] $content
        }
        $updated = [regex]::Replace($content, $pattern, [System.Text.RegularExpressions.MatchEvaluator] {
            param($match)
            if (!$match.Groups['prefix'].Success) { return $match.Value }
            $package = "$($match.Groups['group'].Value.Trim()):$($match.Groups['artifact'].Value.Trim())"
            if (!$Versions.ContainsKey($package)) { return $match.Value }
            return $match.Groups['prefix'].Value + $Versions[$package] + $match.Groups['suffix'].Value
        }, [System.Text.RegularExpressions.RegexOptions]::Singleline)
        if ($updated -cne $content) { $updates[$file] = $updated }
    }

    # Read and validate all inputs before writing any changes.
    foreach ($file in $updates.Keys | Sort-Object)
    {
        if ($PSCmdlet.ShouldProcess($file, 'Sync dependency versions'))
        {
            [System.IO.File]::WriteAllText($file, $updates[$file])
            Write-Host "Updated $file"
        }
    }
}

if ($MyInvocation.InvocationName -ne '.')
{
    $root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
    $baseUri = 'https://raw.githubusercontent.com/Azure/azure-sdk-for-java/main/eng/versioning'
    $clientVersions = Read-Versions (Invoke-WebRequest "$baseUri/version_client.txt").Content
    $externalVersions = Read-Versions (Invoke-WebRequest "$baseUri/external_dependencies.txt").Content
    $packages = Read-Versions ([System.IO.File]::ReadAllText((Join-Path $PSScriptRoot 'external_dependencies.txt')))
    $versions = Resolve-Versions $packages @($clientVersions, $externalVersions)
    Update-VersionFiles -Root $root -Versions $versions -WhatIf:$WhatIfPreference
}
