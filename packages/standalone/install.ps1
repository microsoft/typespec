#!/usr/bin/env pwsh
# Forked from bun install.ps1 https://github.com/oven-sh/bun/blob/main/src/cli/install.ps1

# cspell:ignore HKCU lpdw
param(
  [String]$Version = "latest",
  # Skips adding the tsp.exe directory to the user's %PATH%
  [Switch]$NoPathUpdate = $false,
  # Skips adding the tsp.exe to the list of installed programs
  [Switch]$NoRegisterInstallation = $false,

  # Debugging: Always download with 'Invoke-RestMethod' instead of 'curl.exe'
  [Switch]$DownloadWithoutCurl = $false
);

# filter out 32 bit + ARM
if (-not ((Get-CimInstance Win32_ComputerSystem)).SystemType -match "x64-based") {
  Write-Output "Install Failed:"
  Write-Output "TypeSpec for Windows is currently only available for x86 64-bit Windows.`n"
  return 1
}

$ErrorActionPreference = "Stop"

# These three environment functions are roughly copied from https://github.com/prefix-dev/pixi/pull/692
# They are used instead of `SetEnvironmentVariable` because of unwanted variable expansions.
function Publish-Env {
  if (-not ("Win32.NativeMethods" -as [Type])) {
    Add-Type -Namespace Win32 -Name NativeMethods -MemberDefinition @"
[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
public static extern IntPtr SendMessageTimeout(
    IntPtr hWnd, uint Msg, UIntPtr wParam, string lParam,
    uint fuFlags, uint uTimeout, out UIntPtr lpdwResult);
"@
  }
  $HWND_BROADCAST = [IntPtr] 0xffff
  $WM_SETTINGCHANGE = 0x1a
  $result = [UIntPtr]::Zero
  [Win32.NativeMethods]::SendMessageTimeout($HWND_BROADCAST,
    $WM_SETTINGCHANGE,
    [UIntPtr]::Zero,
    "Environment",
    2,
    5000,
    [ref] $result
  ) | Out-Null
}

function Write-Env {
  param([String]$Key, [String]$Value)

  $RegisterKey = Get-Item -Path 'HKCU:'

  $EnvRegisterKey = $RegisterKey.OpenSubKey('Environment', $true)
  if ($null -eq $Value) {
    $EnvRegisterKey.DeleteValue($Key)
  } else {
    $RegistryValueKind = if ($Value.Contains('%')) {
      [Microsoft.Win32.RegistryValueKind]::ExpandString
    } elseif ($EnvRegisterKey.GetValue($Key)) {
      $EnvRegisterKey.GetValueKind($Key)
    } else {
      [Microsoft.Win32.RegistryValueKind]::String
    }
    $EnvRegisterKey.SetValue($Key, $Value, $RegistryValueKind)
  }

  Publish-Env
}

function Get-Env {
  param([String] $Key)

  $RegisterKey = Get-Item -Path 'HKCU:'
  $EnvRegisterKey = $RegisterKey.OpenSubKey('Environment')
  $EnvRegisterKey.GetValue($Key, $null, [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
}

function New-TemporaryDirectory {
    $tmp = [System.IO.Path]::GetTempPath() # Not $env:TEMP, see https://stackoverflow.com/a/946017
    $name = (New-Guid).ToString("N")
    New-Item -ItemType Directory -Path (Join-Path $tmp $name)
}

function Find-Latest-Version {
    return (Invoke-webrequest -UseBasicParsing -URI "https://typespec.blob.core.windows.net/dist/latest.txt").Content.Trim()
}

function Get-Download-Url {
    param(
      [String] $Version, 
      [String] $filename
    )
    
    if($Version -eq "latest") {
        $Version = (Find-Latest-Version)
    }

    return "https://typespec.blob.core.windows.net/dist/$Version/$($filename)"
}


function Get-Filename {
    param([String] $target)

    return "tsp-$target.zip"
}

function Install-tsp {
  param([string]$Version);

  # if a semver is given, we need to adjust it to this format: tsp-v0.0.0
  if ($Version -match "^\d+\.\d+\.\d+$") {
    $Version = "tsp-v$Version"
  }
  elseif ($Version -match "^v\d+\.\d+\.\d+$") {
    $Version = "tsp-$Version"
  }

  $Arch = "x64"

  $tspRoot = if ($env:tsp_INSTALL) { $env:tsp_INSTALL } else { "${Home}\.tsp" }
  $tspBin = mkdir -Force "${tspRoot}\bin"

  try {
    Remove-Item "${tspBin}\tsp.exe" -Force
  } catch [System.Management.Automation.ItemNotFoundException] {
    # ignore
  } catch [System.UnauthorizedAccessException] {
    $openProcesses = Get-Process -Name tsp | Where-Object { $_.Path -eq "${tspBin}\tsp.exe" }
    if ($openProcesses.Count -gt 0) {
      Write-Output "Install Failed - An older installation exists and is open. Please close open tsp processes and try again."
      return 1
    }
    Write-Output "Install Failed - An unknown error occurred while trying to remove the existing installation"
    Write-Output $_
    return 1
  } catch {
    Write-Output "Install Failed - An unknown error occurred while trying to remove the existing installation"
    Write-Output $_
    return 1
  }

  $target = "tsp-windows-$Arch"
  $filename = "$target.zip"
  $URL = GET-Download-Url -Version $Version -Filename $filename
  $temp = (New-TemporaryDirectory)
  $ZipPath = "$temp\$filename"

  $DisplayVersion = $(
    if ($Version -eq "latest") { "tsp" }
    elseif ($Version -eq "canary") { "tsp Canary" }
    elseif ($Version -match "^tsp-v\d+\.\d+\.\d+$") { "tsp $($Version.Substring(4))" }
    else { "tsp tag='${Version}'" }
  )

  $null = mkdir -Force $tspBin
  Remove-Item -Force $ZipPath -ErrorAction SilentlyContinue

  # curl.exe is faster than PowerShell 5's 'Invoke-WebRequest'
  # note: 'curl' is an alias to 'Invoke-WebRequest'. so the exe suffix is required
  if (-not $DownloadWithoutCurl) {
    curl.exe "-#SfLo" "$ZipPath" "$URL" 
  }
  if ($DownloadWithoutCurl -or ($LASTEXITCODE -ne 0)) {
    Write-Warning "The command 'curl.exe $URL -o $ZipPath' exited with code ${LASTEXITCODE}`nTrying an alternative download method..."
    try {
      # Use Invoke-RestMethod instead of Invoke-WebRequest because Invoke-WebRequest breaks on some platform(From bun script not sure why)
      Invoke-RestMethod -Uri $URL -OutFile $ZipPath
    } catch {
      Write-Output "Install Failed - could not download $URL"
      Write-Output "The command 'Invoke-RestMethod $URL -OutFile $ZipPath' exited with code ${LASTEXITCODE}`n"
      return 1
    }
  }

  if (!(Test-Path $ZipPath)) {
    Write-Output "Install Failed - could not download $URL"
    Write-Output "The file '$ZipPath' does not exist. Did an antivirus delete it?`n"
    return 1
  }

  try {
    $lastProgressPreference = $global:ProgressPreference
    $global:ProgressPreference = 'SilentlyContinue';
    Expand-Archive "$ZipPath" "$tspBin" -Force
    $global:ProgressPreference = $lastProgressPreference
    if (!(Test-Path "${tspBin}\tsp.exe")) {
      throw "The file '${tspBin}\tsp.exe' does not exist. Download is corrupt or intercepted Antivirus?`n"
    }
  } catch {
    Write-Output "Install Failed - could not unzip $ZipPath"
    Write-Error $_
    return 1
  }

  Remove-Item $temp -Recurse -Force

  $tspRevision = "$(& "${tspBin}\tsp.exe" --version)"
  if ($LASTEXITCODE -eq 1073741795) { # STATUS_ILLEGAL_INSTRUCTION
    Write-Output "Install Failed - tsp.exe is not compatible with your CPU. This should have been detected before downloading.`n"
    return 1
  }
  
  if ($LASTEXITCODE -ne 0) {
    Write-Output "Install Failed - could not verify tsp.exe"
    Write-Output "The command '${tspBin}\tsp.exe --revision' exited with code ${LASTEXITCODE}`n"
    return 1
  }

  $DisplayVersion = if ($tspRevision -like "*-canary.*") {
    "${tspRevision}"
  } else {
    "$(& "${tspBin}\tsp.exe" --version)"
  }

  $C_RESET = [char]27 + "[0m"
  $C_GREEN = [char]27 + "[1;32m"

  Write-Output "${C_GREEN}tsp ${DisplayVersion} was installed successfully!${C_RESET}"
  Write-Output "The binary is located at ${tspBin}\tsp.exe`n"

  $hasExistingOther = $false;
  try {
    $existing = Get-Command tsp -ErrorAction
    if ($existing.Source -ne "${tspBin}\tsp.exe") {
      Write-Warning "Note: Another tsp.exe is already in %PATH% at $($existing.Source)`nTyping 'tsp' in your terminal will not use what was just installed.`n"
      $hasExistingOther = $true;
    }
  } catch {}

  if (-not $NoRegisterInstallation) {
    $rootKey = $null
    try {
      $RegistryKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\tsp"  
      $rootKey = New-Item -Path $RegistryKey -Force
      New-ItemProperty -Path $RegistryKey -Name "DisplayName" -Value "tsp" -PropertyType String -Force | Out-Null
      New-ItemProperty -Path $RegistryKey -Name "InstallLocation" -Value "${tspRoot}" -PropertyType String -Force | Out-Null
      New-ItemProperty -Path $RegistryKey -Name "DisplayIcon" -Value $tspBin\tsp.exe -PropertyType String -Force | Out-Null
      New-ItemProperty -Path $RegistryKey -Name "UninstallString" -Value "powershell -c `"& `'$tspRoot\uninstall.ps1`' -PauseOnError`" -ExecutionPolicy Bypass" -PropertyType String -Force | Out-Null
    } catch {
      if ($rootKey -ne $null) {
        Remove-Item -Path $RegistryKey -Force
      }
    }
  }

  if(!$hasExistingOther) {
    # Only try adding to path if there isn't already a tsp.exe in the path
    $Path = (Get-Env -Key "Path") -split ';'
    if ($Path -notcontains $tspBin) {
      if (-not $NoPathUpdate) {
        $Path += $tspBin
        Write-Env -Key 'Path' -Value ($Path -join ';')
        $env:PATH = $Path;
      } else {
        Write-Output "Skipping adding '${tspBin}' to the user's %PATH%`n"
      }
    }

    Write-Output "To get started, restart your terminal/editor, then type `"tsp`"`n"
  }

  $LASTEXITCODE = 0;
}

Install-tsp -Version $Version
