BeforeAll {
  . $PSScriptRoot/Analyze-Changes.ps1
}

Describe 'Analyze-Changes' {
  It 'Should output stuff' {
      ProcessChanges @(
        "",
        ""
      )
  }
}
