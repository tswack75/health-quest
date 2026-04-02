param(
  [string]$ProjectRoot = "C:\Open AI Codex\health-quest",
  [int]$TargetWidth = 420,
  [int]$TargetFps = 12,
  [int]$ClipSeconds = 4
)

$ErrorActionPreference = "Stop"

$assetRoot = Join-Path $ProjectRoot "assets\exercises"
$downloadRoot = Join-Path $assetRoot "downloads"
New-Item -ItemType Directory -Force $downloadRoot | Out-Null

$sources = @(
  @{ Name = "Goblet Squat"; Base = "goblet-squat"; Url = "https://fitnessprogramer.com/wp-content/uploads/2021/02/Goblet-Squat.gif" },
  @{ Name = "Dumbbell Bench Press"; Base = "dumbbell-bench-press"; Url = "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Bench-Press.gif" },
  @{ Name = "Incline Push-Up"; Base = "incline-push-up"; Url = "https://fitnessprogramer.com/wp-content/uploads/2021/05/Incline-Push-Up.gif" },
  @{ Name = "One-Arm Dumbbell Row"; Base = "one-arm-dumbbell-row"; Url = "https://fitnessprogramer.com/wp-content/uploads/2021/02/One-Arm-Dumbbell-Row.gif" },
  @{ Name = "Romanian Deadlift"; Base = "romanian-deadlift"; Url = "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Romanian-Deadlift.gif" },
  @{ Name = "Plank"; Base = "plank"; Url = "https://fitnessprogramer.com/wp-content/uploads/2021/02/Plank.gif" },
  @{ Name = "Dead Bug"; Base = "dead-bug"; Url = "https://fitnessprogramer.com/wp-content/uploads/2021/05/Dead-Bug.gif" }
)

$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue

foreach ($item in $sources) {
  $downloadPath = Join-Path $downloadRoot "$($item.Base).gif"
  $mp4Path = Join-Path $assetRoot "$($item.Base).mp4"
  $webmPath = Join-Path $assetRoot "$($item.Base).webm"

  Write-Host "Downloading $($item.Name)..."
  try {
    Invoke-WebRequest -Uri $item.Url -OutFile $downloadPath
  } catch {
    Write-Warning "Failed to download $($item.Url). Leaving fallback SVG in place."
    continue
  }

  if (-not $ffmpeg) {
    Write-Warning "ffmpeg not found. Skipping conversion for $($item.Name)."
    continue
  }

  Write-Host "Creating MP4 -> $([System.IO.Path]::GetFileName($mp4Path))"
  & $ffmpeg.Source -y -stream_loop -1 -t $ClipSeconds -i $downloadPath -vf "fps=$TargetFps,scale=$TargetWidth:-2:flags=lanczos,format=yuv420p" -movflags +faststart -an $mp4Path

  Write-Host "Creating WebM fallback -> $([System.IO.Path]::GetFileName($webmPath))"
  & $ffmpeg.Source -y -stream_loop -1 -t $ClipSeconds -i $downloadPath -vf "fps=$TargetFps,scale=$TargetWidth:-2:flags=lanczos" -c:v libvpx-vp9 -b:v 0 -crf 36 -an $webmPath
}

Write-Host "Done. The app now prefers local .mp4 files, then .webm, then the bundled SVG loop."
