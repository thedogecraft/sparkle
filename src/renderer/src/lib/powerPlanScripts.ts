// powercfg prints plan names based on the users language, so matching on English names breaks on non-English Windows installs.
const powerPlanHelpers = `
$guidPattern = '[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}'
$ultimateAlias = 'e9a42b02-d5df-448d-aa00-03f14749eb61'

function Get-SchemeResourceId([string] $schemeGuid) {
  foreach ($root in @(
    'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Power\\User\\PowerSchemes',
    'HKCU:\\Control Panel\\PowerSchemes'
  )) {
    $key = Join-Path $root $schemeGuid
    if (Test-Path -LiteralPath $key) {
      $friendlyName = (Get-ItemProperty -LiteralPath $key -Name FriendlyName -ErrorAction SilentlyContinue).FriendlyName
      if ($friendlyName) {
        if ($friendlyName -match '@[^,]+,(-?\\d+)') { return $Matches[1] }
        return $friendlyName
      }
    }
  }
  return $null
}

function Test-IsUltimateScheme([string] $schemeGuid) {
  if ($schemeGuid -ieq $ultimateAlias) { return $true }
  $ultimateName = Get-SchemeResourceId $ultimateAlias
  if (-not $ultimateName) { $ultimateName = '-19' }
  $schemeName = Get-SchemeResourceId $schemeGuid
  return ($null -ne $schemeName -and $schemeName -eq $ultimateName)
}

function Find-UltimateSchemeGuid {
  foreach ($line in (powercfg -list)) {
    $schemeGuid = [regex]::Match($line, $guidPattern).Value
    if ($schemeGuid -and (Test-IsUltimateScheme $schemeGuid)) { return $schemeGuid }
  }
  return $null
}
`

export const powerPlanCheckScript = `${powerPlanHelpers}
$activeGuid = [regex]::Match((powercfg /getactivescheme), $guidPattern).Value.ToLowerInvariant()
$balancedGuid = '381b4222-f694-41f0-9685-ff5bb260df2e'
$highGuid = '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c'
$saverGuid = 'a1841308-3541-4fab-bc81-f71556f20b4a'

if ($activeGuid -eq $balancedGuid) {
  Write-Output 'Balanced'
} elseif ($activeGuid -eq $highGuid) {
  Write-Output 'High Performance'
} elseif ($activeGuid -eq $saverGuid) {
  Write-Output 'Power Saver'
} elseif ($activeGuid -and (Test-IsUltimateScheme $activeGuid)) {
  Write-Output 'Ultimate Performance'
} else {
  Write-Output 'Balanced'
}
`

export const applyUltimatePerformanceScript = `${powerPlanHelpers}
$ultimateGuid = Find-UltimateSchemeGuid

if (-not $ultimateGuid) {
  $created = powercfg -duplicatescheme $ultimateAlias 2>&1
  $ultimateGuid = [regex]::Match(($created -join [Environment]::NewLine), $guidPattern).Value
}

if (-not $ultimateGuid) {
  Write-Error 'Could not find or create the Ultimate Performance power plan.'
  exit 1
}

powercfg /setactive $ultimateGuid
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'Ultimate Performance power plan is now active.'
`
