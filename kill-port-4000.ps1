$conn = Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    $pid4000 = $conn.OwningProcess
    Stop-Process -Id $pid4000 -Force
    Write-Host "Killed PID $pid4000 on port 4000"
} else {
    Write-Host "Port 4000 is free"
}
