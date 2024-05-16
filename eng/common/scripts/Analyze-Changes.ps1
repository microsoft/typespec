#Requires -Version 7.0

param(
    [string] $TargetBranch
)

$runAll = @('^eng/common/')

# Map of rule name to paths to include/exclude as regex patterns
# exclude paths start with '!'
$pathBasedRules = @{
  'RunEng' = @('^eng/common/scripts/')
  'RunCSharp' = $runAll, '^packages/http-client-csharp', '^\.editorconfig$'
  'RunJava' = $runAll, '^packages/http-client-java/'
  'RunTypeScript' = $runAll, '^packages/http-client-typescript/'
  'RunPython' = $runAll, '^packages/http-client-python/'
  'RunCore' = @(
    #any file `
    '.',
     #except for these `
    '!^packages/http-client-(csharp|java|typescript|python)/',
    '!\.prettierignore',
    '!\.prettierrc\.json',
    '!cspell\.yaml',
    '!esling\.config\.json'
  )
}

function Get-ActiveVariables([string[]]$changes) {
  # exit early if no changes detected
  if ($changes.Length -eq 0) {
    Write-Host '##[error] No changes detected'
    exit 1
  }

  $variables = @()

  foreach ($rule in $pathBasedRules.Keys) {
    $paths = $pathBasedRules[$rule]
    $includes = $paths | Where-Object { -not $_.StartsWith('!') }
    $excludes = $paths | Where-Object { $_.StartsWith('!') } | ForEach-Object { $_.Substring(1) }

    foreach($change in $changes) {
      # if any changed file matches an include and no excludes, set the variable
      $matchesAnyInclude = $false
      foreach($path in $includes) {
        if($change -match $path) {
          $matchesAnyInclude = $true
          break
        }
      }

      if(!$matchesAnyInclude) {
        continue
      }

      $matchesAnyExclude = $false
      foreach($path in $excludes) {
        foreach($change in $changes) {
          if($change -match $path) {
            $matchesAnyExclude = $true
            break
          }
        }
      }

      if(!$matchesAnyExclude) {
        $variables += $rule
        break
      }
    }
  }

  return $variables
}

# add all changed files to the tree
Write-Host "Checking for changes in current branch compared to $TargetBranch"
$changes = git diff --name-only origin/$TargetBranch...

Write-Host "##[group]Files changed in this pr"
$changes | ForEach-Object {
    Write-Host "  - $_"
}
Write-Host "##[endgroup]"

if ($LASTEXITCODE -ne 0) {
    Write-Host "##[error] 'git diff --name-only origin/$TargetBranch...' failed, exiting..."
    exit 1  # Exit with a non-zero exit code to indicate failure
}

$variables = Get-ActiveVariables $changes
foreach ($variable in $variables) {
    Write-Host "Setting $variable to true"
    Write-Host "##vso[task.setvariable variable=$variable;isOutput=true]true"
}
