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
      $actual = Get-ActiveVariables @(
        "packages/http-client-csharp/src/constants.ts"
      )

      $expected = @('RunCSharp')

      $actual | ForEach-Object {
        $_ | Should -BeIn $expected
      }
  }

  It 'Should return RunCore if common files are changed' {
      $actual = Get-ActiveVariables @(
        "packages/compiler/package.json"
      )

      $expected = @('RunCore')

      $actual | ForEach-Object {
        $_ | Should -BeIn $expected
      }
  }

  It 'Should return RunEng if testable files in eng are changed' {
      $variables = Get-ActiveVariables @(
        "eng/common/scripts/some-file.ps1"
      )

      $variables | Should -Contain 'RunEng'
  }
  
  It 'Should return a combination of core and isolated packages' {
      $actual = Get-ActiveVariables @(
        "packages/http-client-csharp/src/constants.ts",
        "packages/compiler/package.json"
      )

      $expected = @('RunCore', 'RunCSharp')

      $actual | ForEach-Object {
        $_ | Should -BeIn $expected
      }
  }

  It 'Should return RunCSharp and RunCore if .editorconfig is changed' {
      $actual = Get-ActiveVariables @(
        ".editorconfig"
      )

      $expected = @('RunCore', 'RunCSharp')

      $actual | ForEach-Object {
        $_ | Should -BeIn $expected
      }
  }

  It 'Should not return runCore for .prettierignore, .prettierrc.json, cspell.yaml, esling.config.json' {
    $actual = Get-ActiveVariables @(
      ".prettierignore",
      ".prettierrc.json",
      "cspell.yaml",
      "esling.config.json"
    )

    $actual | Should -Not -Contain 'RunCore'
  }

  It 'Should return runCore for arbitrary files in the root directory' {
    $actual = Get-ActiveVariables @(
      "some.file",
      "file/in/deep/directory"
    )

    $actual | Should -Contain 'RunCore'
  }
}
