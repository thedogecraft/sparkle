param(
    [Parameter(Mandatory=$true)]
    [string]$DNSType,
    [string]$PrimaryDNS = "",
    [string]$SecondaryDNS = ""
)

Write-Host "Applying DNS changes..."

$adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }

if ($adapters.Count -eq 0) {
    Write-Host "No active network adapters found."
    exit 1
}

$dnsConfigs = @{
    "cloudflare" = @{
        Primary = "1.1.1.1"
        Secondary = "1.0.0.1"
        Name = "Cloudflare"
    }
    "google" = @{
        Primary = "8.8.8.8"
        Secondary = "8.8.4.4"
        Name = "Google"
    }
    "opendns" = @{
        Primary = "208.67.222.222"
        Secondary = "208.67.220.220"
        Name = "OpenDNS"
    }
    "quad9" = @{
        Primary = "9.9.9.9"
        Secondary = "149.112.112.112"
        Name = "Quad9"
    }
    "adguard" = @{
        Primary = "94.140.14.49"
        Secondary = "94.140.14.59"
        Name = "Adguard DN"
    }
    "automatic" = @{
        Primary = ""
        Secondary = ""
        Name = "Automatic (DHCP)"
    }
    "custom" = @{
        Primary = $PrimaryDNS
        Secondary = $SecondaryDNS
        Name = "Custom"
    }
}

if (-not $dnsConfigs.ContainsKey($DNSType.ToLower())) {
    Write-Host "Invalid DNS type. Available options: cloudflare, google, opendns, quad9, automatic, custom"
    exit 1
}

$config = $dnsConfigs[$DNSType.ToLower()]

foreach ($adapter in $adapters) {
    Write-Host "Configuring DNS for adapter: $($adapter.Name)"
    try {
        if ($DNSType.ToLower() -eq "automatic") {
    
            Set-DnsClientServerAddress -InterfaceIndex $adapter.ifIndex -ResetServerAddresses
            Write-Host "Set $($adapter.Name) to automatic DNS (DHCP)"
        } else {
      
            $dnsServers = @()
            if ($config.Primary) { $dnsServers += $config.Primary }
            if ($config.Secondary) { $dnsServers += $config.Secondary }
            
            Set-DnsClientServerAddress -InterfaceIndex $adapter.ifIndex -ServerAddresses $dnsServers
            Write-Host "Set $($adapter.Name) to $($config.Name) DNS: $($dnsServers -join ', ')"
        }
    }
    catch {
        Write-Host "Error configuring DNS for $($adapter.Name): $($_.Exception.Message)"
    }
}

Write-Host "Flushing DNS cache..."
ipconfig /flushdns | Out-Null

Write-Host "DNS configuration completed successfully!"
Write-Host "Current DNS settings:"
Get-DnsClientServerAddress | Where-Object { $_.ServerAddresses.Count -gt 0 } | ForEach-Object {
    $adapter = Get-NetAdapter -InterfaceIndex $_.InterfaceIndex -ErrorAction SilentlyContinue
    if ($adapter) {
        $dnsList = $_.ServerAddresses | Where-Object { $_ -notmatch '^fec0' }
        if ($dnsList) {
            Write-Host "  $($adapter.Name): $($dnsList -join ', ')"
        }
    }
}
