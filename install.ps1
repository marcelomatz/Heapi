# Heapi Windows Installation Script
# This script downloads the latest portable executable and adds it to your PATH

$ErrorActionPreference = 'Stop'

Write-Host "Fetching latest release information..." -ForegroundColor Cyan

# Get the latest release from GitHub
$releaseUrl = "https://api.github.com/repos/marcelomatz/Heapi/releases/latest"
try {
    $releaseResponse = Invoke-RestMethod -Uri $releaseUrl -Method Get
    $latestVersion = $releaseResponse.tag_name
} catch {
    Write-Host "Failed to fetch release from GitHub API. Please check your internet connection." -ForegroundColor Red
    exit 1
}

$versionNumber = $latestVersion.TrimStart('v')
$downloadUrl = "https://github.com/marcelomatz/Heapi/releases/download/$latestVersion/heapi-windows-amd64.exe"

$installDir = Join-Path $env:USERPROFILE ".heapi\bin"
$exePath = Join-Path $installDir "heapi.exe"

# Create installation directory if it doesn't exist
if (-not (Test-Path -Path $installDir)) {
    Write-Host "Creating directory: $installDir" -ForegroundColor Cyan
    New-Item -ItemType Directory -Force -Path $installDir | Out-Null
}

Write-Host "Downloading Heapi $latestVersion..." -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $exePath -UseBasicParsing
} catch {
    Write-Host "Failed to download Heapi. Error: $_" -ForegroundColor Red
    exit 1
}

# Unblock the file to prevent SmartScreen/Defender warnings for terminal users
Write-Host "Unblocking executable..." -ForegroundColor Cyan
Unblock-File -Path $exePath

# Add to user PATH if not already present
$userPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
if (-not ($userPath -split ';' -contains $installDir)) {
    Write-Host "Adding $installDir to User PATH..." -ForegroundColor Cyan
    $newPath = "$userPath;$installDir"
    [Environment]::SetEnvironmentVariable("Path", $newPath, [EnvironmentVariableTarget]::User)
    $env:Path = "$env:Path;$installDir"
}

Write-Host "`nHeapi was installed successfully! 🚀" -ForegroundColor Green
Write-Host "You can now run 'heapi' from any terminal."
Write-Host "Note: You may need to restart your current terminal session for the PATH changes to take effect." -ForegroundColor Yellow
