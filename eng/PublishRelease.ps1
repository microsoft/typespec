param($NpmToken, $GitHubToken, [string]$BuildNumber, $Sha, $AutorestArtifactDirectory, $typespecEmitterDirectory, $CoverageUser, $CoveragePass, $CoverageDirectory)

$AutorestArtifactDirectory = Resolve-Path $AutorestArtifactDirectory
$RepoRoot = Resolve-Path "$PSScriptRoot/.."

Push-Location $AutorestArtifactDirectory
try {
    $currentVersion = node -p -e "require('./package.json').version";
    $devVersion = "$currentVersion-beta.$BuildNumber"

    Write-Host "Setting version to $devVersion"

    npm version --no-git-tag-version $devVersion | Out-Null;
   
    $file = npm pack -q;
    $name = "AutoRest C# v$devVersion"

    Write-Host "Publishing autorest $file on GitHub!"
    
    npx -q publish-release --token $GitHubToken --repo autorest.csharp --owner azure --name $name --tag v$devVersion --notes=prerelease-build --prerelease --editRelease false --assets $file --target_commitish $Sha 2>&1

    $env:NPM_TOKEN = $NpmToken
    "//registry.npmjs.org/:_authToken=$env:NPM_TOKEN" | Out-File -FilePath (Join-Path $AutorestArtifactDirectory '.npmrc')

    Write-Host "Publishing $file on Npm!"
    
    npm publish $file --access public
}
finally {
    Pop-Location
}

$typespecEmitterDirectory = Resolve-Path $typespecEmitterDirectory

Push-Location $typespecEmitterDirectory
try {
    $autorestVersion = $devVersion
    $currentVersion = node -p -e "require('./package.json').version";
    $devVersion = "$currentVersion-beta.$BuildNumber"

    npm install @autorest/csharp@$autorestVersion --save-exact

    Write-Host "Setting TypeSpec Emitter version to $devVersion"
    npm version --no-git-tag-version $devVersion | Out-Null;

    Write-Host "Packing TypeSpec emitter..."
    $file = npm pack -q;

    Write-Host "Publishing $file on Npm..."
    "//registry.npmjs.org/:_authToken=$env:NPM_TOKEN" | Out-File -FilePath (Join-Path $typespecEmitterDirectory '.npmrc')
    npm publish $file --access public
    
    Write-Host "##vso[task.setvariable variable=TypeSpecEmitterVersion;isoutput=true]$devVersion"
}
finally {
    Pop-Location
}

Push-Location $RepoRoot
try {
    # set the version in the root package.json so coverage can pick it up

    npm version --no-git-tag-version $devVersion | Out-Null;
   
    $CoverageDirectory = Resolve-Path $CoverageDirectory

    npm run coverage --prefix node_modules/@microsoft.azure/autorest.testserver -- publish --repo=Azure/autorest.csharp --ref=refs/heads/feature/v3 --githubToken=skip --azStorageAccount=$CoverageUser --azStorageAccessKey=$CoveragePass --coverageDirectory=$CoverageDirectory
}
finally {
    Pop-Location
}
