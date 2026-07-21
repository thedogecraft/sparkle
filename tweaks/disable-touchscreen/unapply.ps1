# Mirrors apply.ps1's match exactly. Get-PnpDevice still lists disabled
# devices (with Status "Error"), so no status filter is used here.
$devices = Get-PnpDevice -ErrorAction SilentlyContinue | Where-Object {
    $_.FriendlyName -like "*touch screen*" -and $_.Class -eq "HIDClass"
}

if (-not $devices) {
    Write-Output "No touchscreen device found. Nothing to do."
    return
}

foreach ($device in $devices) {
    try {
        Enable-PnpDevice -InstanceId $device.InstanceId -Confirm:$false -ErrorAction Stop
        Write-Output "Enabled: $($device.FriendlyName) ($($device.InstanceId))"
    } catch {
        Write-Output "Failed to enable $($device.FriendlyName): $($_.Exception.Message)"
    }
}
