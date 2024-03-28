function New-Directory-If-Not-Exist([string]$folder){
  if (!(Test-Path -Path $folder)) {
    New-Item -ItemType Directory -Path $folder | Out-Null
  }
}

function Install-Test-Nuget-Packages (
  [Parameter(Mandatory=$true, HelpMessage="Packages to restore")]
  [hashtable]$packagesToRestore){

    $projFolder = Join-Path ([System.IO.Path]::GetTempPath()) ([string][System.Guid]::NewGuid())
    New-Directory-If-Not-Exist $projFolder
    $projFile = Join-Path $projFolder "dummy.csproj";
  
    '<Project Sdk="Microsoft.NET.Sdk">
      <!-- This is a dummy project created by script to trigger nuget package install -->
      <PropertyGroup>
        <TargetFramework>netstandard2.0</TargetFramework>
        <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
        <Nullable>annotations</Nullable>
      </PropertyGroup>
    </Project>' | Out-File $projFile

    $sourceFolder = Join-Path $PSScriptRoot '../NugetPackages'
    foreach($key in $packagesToRestore.Keys){
      $name = $key
      $version = $packagesToRestore[$key]
      dotnet add $projFile package $name -v $version -s $sourceFolder
    }
    Remove-Item -Recurse -Force $projFolder
}