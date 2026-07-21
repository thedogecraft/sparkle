# Matches on FriendlyName rather than a hardware ID: the touchscreen shows up
# as "HID-compliant touch screen" across vendors/chips, whereas the vendor ID
# (e.g. WACF2200 for the Wacom digitizer on this ThinkPad) varies by machine.
# On a Wacom-equipped device this specifically targets the touch collection,
# not the stylus/pen collection, which is a separate device -- disabling this
# does not affect pen input.
$devices = Get-PnpDevice -ErrorAction SilentlyContinue | Where-Object {
    $_.FriendlyName -like "*touch screen*" -and $_.Class -eq "HIDClass"
}

if (-not $devices) {
    Write-Output "No touchscreen device found. Nothing to do."
    return
}

foreach ($device in $devices) {
    try {
        Disable-PnpDevice -InstanceId $device.InstanceId -Confirm:$false -ErrorAction Stop
        Write-Output "Disabled: $($device.FriendlyName) ($($device.InstanceId))"
    } catch {
        Write-Output "Failed to disable $($device.FriendlyName): $($_.Exception.Message)"
    }
}
