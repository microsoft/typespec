# cSpell:ignore PULLREQUEST
# cSpell:ignore TARGETBRANCH
[CmdletBinding()]
Param (
  [Parameter(Mandatory=$True)]
  [string] $ArtifactPath,
  [Parameter(Mandatory=$True)]
  [string] $PullRequestNumber,
  [Parameter(Mandatory=$True)]
  [string] $BuildId,
  [Parameter(Mandatory=$True)]
  [string] $CommitSha,
  [Parameter(Mandatory=$True)]
  [array] $ArtifactList,
  [string] $APIViewUri,
  [string] $RepoFullName = "",
  [string] $BuildArtifactName = "",
  [string] $TargetBranch = ("origin/${env:SYSTEM_PULLREQUEST_TARGETBRANCH}" -replace "refs/heads/"),
  [string] $DevopsProject = "internal",
  [string] $LanguageShortName = "Unknown"
)

. (Join-Path $PSScriptRoot "../../common/scripts/git-helpers.ps1")

if ($LanguageShortName -eq "Unknown")
{
    Write-Host "Language short name is not provided. Please provide the language short name."
    exit 1
}
else
{
    $functionScriptPath = Join-Path $PSScriptRoot "/../../../packages/http-client-$LanguageShortName/eng/scripts/Functions.ps1"
    if (!(Test-Path $functionScriptPath))
    {
        Write-Host "Functions script path $($functionScriptPath) is invalid."
        exit 1
    }
    . ($functionScriptPath)
}

# Submit API review request and return status whether current revision is approved or pending or failed to create review
function Submit-Request($filePath, $packageName)
{
    $repoName = $RepoFullName
    if (!$repoName) {
        $repoName = "microsoft/typespec"
    }
    $isJsPackage = $packageName.StartsWith("typespec-")
    $reviewFileName = $isJsPackage ? "$($packageName)_js.json" : "$($packageName)_$($LanguageShortName).json"
    $query = [System.Web.HttpUtility]::ParseQueryString('')
    $query.Add('artifactName', $BuildArtifactName)
    $query.Add('buildId', $BuildId)
    $query.Add('filePath', $filePath)
    $query.Add('commitSha', $CommitSha)
    $query.Add('repoName', $repoName)
    $query.Add('pullRequestNumber', $PullRequestNumber)
    $query.Add('packageName', $packageName)
    $query.Add('language', $isJsPackage ? "js" : $LanguageShortName)
    $query.Add('project', $DevopsProject)
    $reviewFileFullName = Join-Path -Path $ArtifactPath $reviewFileName
    if (Test-Path $reviewFileFullName)
    {
        $query.Add('codeFile', $reviewFileName)
    }
    $uri = [System.UriBuilder]$APIViewUri
    $uri.query = $query.toString()
    Write-Host "Request URI: $($uri.Uri.OriginalString)"
    try
    {
        $Response = Invoke-WebRequest -Method 'GET' -Uri $uri.Uri -MaximumRetryCount 3
        $StatusCode = $Response.StatusCode
    }
    catch
    {
        Write-Host "Error $StatusCode - Exception details: $($_.Exception.Response)"
        $StatusCode = $_.Exception.Response.StatusCode
    }

    return $StatusCode
}

function Should-Process-Package($packageName)
{
    $configFileDir = Join-Path -Path $ArtifactPath "PackageInfo"
    $pkgPropPath = Join-Path -Path $configFileDir "$packageName.json"
    if (!(Test-Path $pkgPropPath))
    {
        Write-Host " Package property file path $($pkgPropPath) is invalid."
        return $False
    }
    # Get package info from json file created before updating version to daily dev
    $pkgInfo = Get-Content $pkgPropPath | ConvertFrom-Json
    $packagePath = $pkgInfo.DirectoryPath
    $modifiedFiles  = @(Get-ChangedFiles -DiffPath "$packagePath/*" -DiffFilterType '')
    $filteredFileCount = $modifiedFiles.Count
    Write-Host "Number of modified files for package: $filteredFileCount"
    return ($filteredFileCount -gt 0 -and $pkgInfo.IsNewSdk)
}

function Log-Input-Params()
{
    Write-Host "Artifact Path: $($ArtifactPath)"
    Write-Host "Artifact Name: $($BuildArtifactName)"
    Write-Host "PullRequest Number: $($PullRequestNumber)"
    Write-Host "BuildId: $($BuildId)"
    Write-Host "Language: $($Language)"
    Write-Host "Commit SHA: $($CommitSha)"
    Write-Host "Repo Name: $($RepoFullName)"
    Write-Host "Project: $($DevopsProject)"
}

Log-Input-Params

$responses = @{}
foreach ($artifact in $ArtifactList)
{
    Write-Host "Processing $($artifact.name)"
    $packages = Find-Artifacts-For-Apireview $ArtifactPath $artifact.name
    if ($packages)
    {
        $pkgPath = $packages.Values[0]
        $isRequired = Should-Process-Package -packageName $artifact.name
        Write-Host "Is API change detect required for $($artifact.name):$($isRequired)"
        if ($isRequired -eq $True)
        {
            $filePath = $pkgPath.Replace($ArtifactPath , "").Replace("\", "/")
            $respCode = Submit-Request -filePath $filePath -packageName $artifact.name
            if ($respCode -ne '200')
            {
                $responses[$artifact.name] = $respCode
            }
        }
        else
        {
            Write-Host "Pull request does not have any change for $($artifact.name). Skipping API change detect."
        }
    }
    else
    {
        Write-Host "No package is found in artifact path to find API changes for $($artifact.name)"
    }
}

foreach($pkg in $responses.keys)
{
    Write-Host "API detection request status for $($pkg) : $($responses[$pkg])"
}
