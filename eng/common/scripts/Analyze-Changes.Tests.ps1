BeforeAll {
  . $PSScriptRoot/Analyze-Changes.ps1 *>&1 | Out-Null
}

Describe 'Analyze-Changes' {
  It 'Should output stuff' {
      $variables = Get-ActiveVariables @(
        "packages/http-client-csharp/src/constants.ts"
      )

      $variables | Should -Be 'RunCSharp'
  }
}
