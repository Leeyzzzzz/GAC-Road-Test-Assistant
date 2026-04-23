param(
    [int]$Port = 3000,
    [int]$Timeout = 10000,
    [string]$EnvFile = "",
    [string]$DevEnvFile = "",
    [switch]$PauseOnExit
)

$ErrorActionPreference = "Stop"

if (-not $EnvFile) {
    $EnvFile = Join-Path $PSScriptRoot "..\client\.env"
}

if (-not $DevEnvFile) {
    $DevEnvFile = Join-Path $PSScriptRoot "..\client\.env.development"
}

$resolvedEnvFile = [System.IO.Path]::GetFullPath($EnvFile)
$resolvedDevEnvFile = [System.IO.Path]::GetFullPath($DevEnvFile)
$logDirectory = Join-Path $PSScriptRoot "logs"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logFile = Join-Path $logDirectory "sync-client-api-env-$timestamp.log"
$exitCode = 0

New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )

    $line = "[{0}] [{1}] {2}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Level, $Message
    Write-Host $line
    $line | Out-File -FilePath $logFile -Append -Encoding utf8
}

function Get-PreferredIPv4Config {
    $ipConfigs = Get-NetIPConfiguration | Where-Object {
        $_.IPv4Address -and
        $_.NetAdapter -and
        $_.NetAdapter.Status -eq "Up" -and
        $_.IPv4DefaultGateway
    }

    Write-Log ("Detected active adapters: {0}" -f $ipConfigs.Count)

    foreach ($config in $ipConfigs) {
        $adapterLine = "Adapter={0}; IPv4={1}; Gateway={2}; HardwareInterface={3}" -f `
            $config.InterfaceAlias, `
            $config.IPv4Address.IPAddress, `
            $config.IPv4DefaultGateway.NextHop, `
            $config.NetAdapter.HardwareInterface
        Write-Log $adapterLine
    }

    $preferred = $ipConfigs | Where-Object {
        $_.InterfaceAlias -notmatch "WSL|Hyper-V|VMware|VirtualBox|vEthernet|Loopback|Bluetooth"
    } | Select-Object -First 1

    if (-not $preferred) {
        $preferred = $ipConfigs | Select-Object -First 1
        Write-Log "No preferred adapter matched filter. Fallback to first active adapter." "WARN"
    }

    if (-not $preferred) {
        throw "No active IPv4 adapter was found. Connect to hotspot or LAN first."
    }

    return $preferred
}

function Write-EnvFile {
    param(
        [string]$TargetPath,
        [string[]]$Content
    )

    $envDirectory = Split-Path -Parent $TargetPath
    if (-not (Test-Path $envDirectory)) {
        New-Item -ItemType Directory -Path $envDirectory -Force | Out-Null
        Write-Log ("Created env directory: {0}" -f $envDirectory)
    }

    Set-Content -Path $TargetPath -Value $Content -Encoding UTF8
    Write-Log ("Updated env file: {0}" -f $TargetPath)
}

try {
    Write-Log "Script started."
    Write-Log ("Env file target: {0}" -f $resolvedEnvFile)
    Write-Log ("Dev env file target: {0}" -f $resolvedDevEnvFile)
    Write-Log ("Port={0}; Timeout={1}" -f $Port, $Timeout)

    $preferredConfig = Get-PreferredIPv4Config
    $ip = $preferredConfig.IPv4Address.IPAddress
    $baseUrl = "http://${ip}:$Port"
    $content = @(
        "VITE_API_BASE_URL=$baseUrl",
        "VITE_API_TIMEOUT=$Timeout"
    )

    Write-EnvFile -TargetPath $resolvedEnvFile -Content $content
    Write-EnvFile -TargetPath $resolvedDevEnvFile -Content $content

    Write-Log ("Selected adapter: {0}" -f $preferredConfig.InterfaceAlias)
    Write-Log ("VITE_API_BASE_URL={0}" -f $baseUrl)
    Write-Log ("VITE_API_TIMEOUT={0}" -f $Timeout)
    Write-Log "client env files updated successfully."
} catch {
    $exitCode = 1
    Write-Log $_.Exception.Message "ERROR"
    Write-Log $_.ScriptStackTrace "ERROR"
} finally {
    Write-Host ""
    Write-Host ("Log file: {0}" -f $logFile)
    ("Log file: {0}" -f $logFile) | Out-File -FilePath $logFile -Append -Encoding utf8

    if ($PauseOnExit) {
        Write-Host ""
        Write-Host "Press Enter to close..."
        [void](Read-Host)
    }
}

exit $exitCode
