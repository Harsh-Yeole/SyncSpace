$targetDir = "c:\Users\raj07\Downloads\projects\NEWp\Notiv-master\Notiv-master"

# Rename file public/notivlogo.svg to public/syncspacelogo.svg
$oldLogo = Join-Path $targetDir "public\notivlogo.svg"
if (Test-Path $oldLogo) {
    Rename-Item -Path $oldLogo -NewName "syncspacelogo.svg"
    Write-Host "Renamed notivlogo.svg to syncspacelogo.svg"
}

# Function to process files
function Replace-In-Files {
    param (
        [string]$Directory
    )
    
    Get-ChildItem -Path $Directory -Recurse -File | 
    Where-Object { 
        $_.FullName -notmatch "\\node_modules\\" -and 
        $_.FullName -notmatch "\\\.git\\" -and
        $_.FullName -notmatch "\\\.next\\" -and
        ($_.Extension -match "\.(ts|tsx|js|jsx|json|md|html|css|env|mjs|txt|svg)$" -or $_.Name -eq ".env")
    } | ForEach-Object {
        $content = Get-Content $_.FullName -Raw
        if ($null -ne $content) {
            
            if ($content -cnotmatch "NOTIV" -and $content -cnotmatch "Notiv" -and $content -cnotmatch "notiv" -and $content -cnotmatch "shiwangaryan") {
                return
            }
            
            $newContent = $content -creplace "NOTIV", "SYNCSPACE"
            $newContent = $newContent -creplace "Notiv", "SyncSpace"
            $newContent = $newContent -creplace "notiv", "syncspace"
            $newContent = $newContent -creplace "shiwangaryan", "saurav"
            
            if ($content -cne $newContent) {
                Set-Content -Path $_.FullName -Value $newContent -NoNewline -Encoding UTF8
                Write-Host "Updated: $($_.FullName)"
            }
        }
    }
}

Replace-In-Files -Directory $targetDir
Write-Host "Replacement Complete!"
