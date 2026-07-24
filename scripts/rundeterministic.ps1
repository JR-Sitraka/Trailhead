$targetTest = "returns status=answered with resolved citations"
$results = @()

for ($run = 1; $run -le 10; $run++) {
  $output = npx vitest run tests/chat.test.ts -t $targetTest --reporter=verbose 2>&1 | Out-String
  $m = [regex]::Match($output, '"startLine"\s*:\s*(\d+)')
  $startLine = if ($m.Success) { [int]$m.Groups[1].Value } else { $null }
  Write-Output "Run $run : startLine = $startLine"
  $results += $startLine
}

$first = $results[0]
$allSame = $results | ForEach-Object { $_ -eq $first } | Where-Object { $_ -eq $false }

Write-Output ""
Write-Output "=== SUMMARY ==="
Write-Output "Runs : $($results -join ', ')"
Write-Output "All same? $($allSame.Count -eq 0) (first=$first)"
