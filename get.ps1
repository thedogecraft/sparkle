
Clear-Host

# GitHub config
$repo = "Parcoil/Sparkle"
$apiUrl = "https://api.github.com/repos/$repo/releases/latest"
$headers = @{
    "User-Agent" = "Sparkle-Fetcher"
    "Accept"     = "application/vnd.github.v3+json"
}

# Use current dir if script folder is not defined
$downloadFolder = if ($PSScriptRoot) { $PSScriptRoot } else { Get-Location }

# Fetch latest release info
try {
    $release = Invoke-RestMethod -Uri $apiUrl -Headers $headers
}
catch {
    Write-Host "[X] Failed to contact GitHub API." -ForegroundColor Red
    exit 1
}

# Extract tag/version
$tag = $release.tag_name
$versionLabel = $tag -replace "^v", ""  # Remove leading "v" if present

# ASCII art header
$asciiHeader = @"

███████╗██████╗  █████╗ ██████╗ ██╗  ██╗██╗     ███████╗
██╔════╝██╔══██╗██╔══██╗██╔══██╗██║ ██╔╝██║     ██╔════╝
███████╗██████╔╝███████║██████╔╝█████╔╝ ██║     █████╗  
╚════██║██╔═══╝ ██╔══██║██╔══██╗██╔═██╗ ██║     ██╔══╝  
███████║██║     ██║  ██║██║  ██║██║  ██╗███████╗███████╗
╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝                       
"@

Write-Host $asciiHeader -ForegroundColor Cyan
Write-Host "Version: v$versionLabel" -ForegroundColor Yellow
Write-Host ""

# Find installer asset
$asset = $release.assets | Where-Object { $_.name -match "^sparkle-.*-setup\.exe$" }

if (-not $asset) {
    Write-Host "[X] No installer (.exe) found in latest release." -ForegroundColor Red
    exit 1
}

$fileName = $asset.name
$downloadPath = Join-Path $downloadFolder $fileName

Write-Host "[✓] Latest version: $tag" -ForegroundColor Green
Write-Host "[✓] Found installer: $fileName" -ForegroundColor Green
Write-Host "[>] Downloading to: $downloadPath" -ForegroundColor Cyan

# Ensure BITS service is running
$bitsService = Get-Service BITS
if ($bitsService.Status -ne "Running") {
    Write-Host "[>] Starting BITS service..." -ForegroundColor Cyan
    Start-Service BITS -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Download the installer
try {
    Start-BitsTransfer -Source $asset.browser_download_url -Destination $downloadPath
    Write-Host "`n[✔] Download complete!" -ForegroundColor Green
}
catch {
    Write-Host "[>] BITS transfer failed, falling back to Invoke-WebRequest..." -ForegroundColor Yellow
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $downloadPath -UseBasicParsing
        Write-Host "`n[✔] Download complete!" -ForegroundColor Green
    }
    catch {
        Write-Host "[X] Failed to download installer." -ForegroundColor Red
        exit 1
    }
}

# Launch installer as admin and delete installer immediately after
Write-Host "[🚀] Launching installer..." -ForegroundColor Magenta
try {
    $process = Start-Process -FilePath $downloadPath -Verb RunAs -PassThru
    $process.WaitForExit()
    Remove-Item -Path $downloadPath -Force
    Write-Host "[🗑️] Deleted installer after installer exited." -ForegroundColor DarkYellow
    Write-Host "[>] Thanks For using Sparkle" -ForegroundColor Magenta
}
catch {
    Write-Host "[X] Failed to launch installer or delete file." -ForegroundColor Red
    exit 1
}
