# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Sync-Versions.ps1')

function Assert-Equal($Expected, $Actual)
{
    if ($Expected -cne $Actual)
    {
        throw "Expected '$Expected', got '$Actual'."
    }
}

$clientVersions = Read-Versions @'
# Released version precedes the development version.
com.azure:azure-core;1.2.3;1.3.0-beta.1
com.azure.v2:azure-client-sdk-parent;2.0.0-beta.2;2.0.0-beta.3
io.clientcore:core;1.0.0-beta.11;1.0.0-beta.12
'@
$externalVersions = Read-Versions @'
com.azure:azure-core;0.9.0
testdep_net.bytebuddy:byte-buddy;1.17.7
org.mockito:mockito-core;5.0.0
'@
$packages = Read-Versions @'
com.azure:azure-core
com.azure.v2:azure-client-sdk-parent
io.clientcore:core
net.bytebuddy:byte-buddy
org.mockito:mockito-core;4.11.0
'@
$versions = Resolve-Versions $packages @($clientVersions, $externalVersions)
Assert-Equal '1.2.3' $versions['com.azure:azure-core']
Assert-Equal '1.0.0-beta.11' $versions['io.clientcore:core']
Assert-Equal '1.17.7' $versions['net.bytebuddy:byte-buddy']
Assert-Equal '4.11.0' $versions['org.mockito:mockito-core']

$failed = $false
try
{
    Resolve-Versions (Read-Versions 'missing:dependency') @($clientVersions, $externalVersions)
}
catch
{
    if ($_.Exception.Message -notlike '*missing:dependency*') { throw }
    $failed = $true
}
Assert-Equal $true $failed

$root = Join-Path ([System.IO.Path]::GetTempPath()) "java-version-sync-$([guid]::NewGuid())"
try
{
    $generator = Join-Path $root 'generator'
    $module = Join-Path $generator 'http-client-generator-core'
    $resources = Join-Path $module 'src\main\resources'
    $javaDirectory = Join-Path $module 'src\main\java\com\microsoft\typespec\http\client\generator\core\model\projectmodel'
    $target = Join-Path $module 'target'
    $customization = Join-Path $generator 'http-client-generator-test\customization'
    foreach ($directory in @($resources, $javaDirectory, $target, $customization))
    {
        $null = New-Item -ItemType Directory -Path $directory -Force
    }
    $pom = @'
<project>
  <!-- <groupId>com.azure</groupId><artifactId>azure-core</artifactId><version>comment</version> -->
  <parent>
    <groupId>com.microsoft.typespec</groupId>
    <artifactId>typespec-java-generator</artifactId>
    <version>1.0.0-beta.1</version>
  </parent>
  <dependencies>
    <dependency>
      <groupId>com.azure</groupId>
      <!-- Keep this comment and the original formatting. -->
      <artifactId>azure-core</artifactId>
      <version>old</version>
      <exclusions>
        <exclusion><groupId>io.clientcore</groupId><artifactId>core</artifactId></exclusion>
      </exclusions>
    </dependency>
    <dependency>
      <groupId>unlisted</groupId><artifactId>library</artifactId><version>old</version>
    </dependency>
    <dependency>
      <groupId>org.mockito</groupId><artifactId>mockito-core</artifactId><version>old</version>
    </dependency>
  </dependencies>
</project>
'@
    $pom = $pom.Replace("`r`n", "`n").Replace("`n", "`r`n")
    $pomFiles = @(
        (Join-Path $generator 'pom.xml'),
        (Join-Path $module 'pom.xml'),
        (Join-Path $resources 'pom.xml'),
        (Join-Path $customization 'pom.xml')
    )
    foreach ($file in $pomFiles + (Join-Path $target 'pom.xml'))
    {
        [System.IO.File]::WriteAllText($file, $pom)
    }
    $javaFile = Join-Path $javaDirectory 'Project.java'
    $java = "        AZURE_CORE(`"com.azure`", `"azure-core`", `"old`"),`n" +
        "        AZURE_CLIENT_SDK_PARENT_V2(`"com.azure.v2`", `"azure-client-sdk-parent`", `"old-v2`"),`n" +
        "        CLIENTCORE(`"io.clientcore`", `"core`", `"old`");`n"
    [System.IO.File]::WriteAllText($javaFile, $java)

    Update-VersionFiles -Root $root -Versions $versions -WhatIf
    Assert-Equal $pom ([System.IO.File]::ReadAllText($pomFiles[0]))
    Assert-Equal $java ([System.IO.File]::ReadAllText($javaFile))

    Update-VersionFiles -Root $root -Versions $versions
    $expected = $pom.Replace("      <version>old</version>", "      <version>1.2.3</version>")
    $expected = $expected.Replace('<artifactId>mockito-core</artifactId><version>old</version>',
        '<artifactId>mockito-core</artifactId><version>4.11.0</version>')
    foreach ($file in $pomFiles)
    {
        Assert-Equal $expected ([System.IO.File]::ReadAllText($file))
    }
    Assert-Equal $pom ([System.IO.File]::ReadAllText((Join-Path $target 'pom.xml')))
    Assert-Equal ($java.Replace('"old"),', '"1.2.3"),').Replace('"old");', '"1.0.0-beta.11");').Replace('"old-v2"', '"2.0.0-beta.2"')) `
        ([System.IO.File]::ReadAllText($javaFile))

    $modified = (Get-Item $javaFile).LastWriteTimeUtc
    Update-VersionFiles -Root $root -Versions $versions
    Assert-Equal $modified (Get-Item $javaFile).LastWriteTimeUtc
    Write-Host 'Version sync tests passed.'
}
finally
{
    if (Test-Path -LiteralPath $root)
    {
        Remove-Item -LiteralPath $root -Recurse -Force
    }
}
