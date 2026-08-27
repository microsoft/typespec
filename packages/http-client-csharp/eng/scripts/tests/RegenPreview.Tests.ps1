#Requires -Version 7.0

BeforeAll {
    Import-Module (Join-Path $PSScriptRoot ".." "RegenPreview.psm1") -DisableNameChecking -Force
}

Describe "Update-EmitterPackageDependency" {
    It "replaces a local package reference with an exact semantic version" {
        $packageJsonPath = Join-Path $TestDrive "package.json"
        @{
            main = "dist/src/index.js"
            dependencies = @{
                "@azure-typespec/http-client-csharp" = "file:../../../csharp-debug/package.tgz"
            }
        } | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath

        Update-EmitterPackageDependency `
            -PackageJsonPath $packageJsonPath `
            -PackageName "@azure-typespec/http-client-csharp" `
            -PackageVersion "1.0.0-alpha.20260827.5"

        $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
        $packageJson.dependencies."@azure-typespec/http-client-csharp" |
            Should -Be "1.0.0-alpha.20260827.5"
        $packageJson.main | Should -Be "dist/src/index.js"
    }

    It "rejects a package manifest that does not declare the dependency" {
        $packageJsonPath = Join-Path $TestDrive "missing-dependency.json"
        @{ dependencies = @{} } | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath

        {
            Update-EmitterPackageDependency `
                -PackageJsonPath $packageJsonPath `
                -PackageName "@azure-typespec/http-client-csharp" `
                -PackageVersion "1.0.0-alpha.20260827.5"
        } | Should -Throw "*does not declare dependency*"
    }
}
