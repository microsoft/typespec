# set RunCore to true if changes were made outside of /packages/http-client-csharp
if (git diff --name-only HEAD^ HEAD | Select-String -Pattern "^(?!packages/http-client-csharp)" -Quiet) {
    Write-Host "Changes were made outside of /packages/http-client-csharp"
    Write-Host "Setting RunCore to true"
    Write-Host "##vso[task.setvariable variable=RunCore;isOutput=true]true"
}

# set RunCSharp to true if changes were made inside of /packages/http-client-csharp
if (git diff --name-only HEAD^ HEAD | Select-String -Pattern "^packages/http-client-csharp" -Quiet) {
    Write-Host "Changes were made inside of /packages/http-client-csharp"
    Write-Host "Setting RunCSharp to true"
    Write-Host "##vso[task.setvariable variable=RunCSharp;isOutput=true]true"
}
