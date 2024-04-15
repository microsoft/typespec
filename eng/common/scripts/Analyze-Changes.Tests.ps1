BeforeAll {
  . $PSScriptRoot/Analyze-Changes.ps1 *>&1 | Out-Null
}

Describe 'Analyze-Changes' {
  AfterEach {
    foreach($package in $isolatedPackages.Values) {
      $package.RunValue = $false;
    }
  }

  It 'Should return package variables if package specific changes are detected' {
      $variables = Get-ActiveVariables @(
        "packages/http-client-csharp/src/constants.ts"
      )

      $variables | Should -Be 'RunCSharp'
  }

  It 'Should return RunCore if common files are changed' {
      $variables = Get-ActiveVariables @(
        "packages/compiler/package.json"
      )

      $variables | Should -Be 'RunCore'
  }
  
  It 'Should return a combination of core and isolated packages' {
      $variables = Get-ActiveVariables @(
        "packages/http-client-csharp/src/constants.ts",
        "packages/compiler/package.json"
      )

      $variables | Should -Be 'RunCore', 'RunCSharp'
  }
}
