# Composites the cute "Morukuri!" wordmark onto the concentric-circle icon
# base layers produced by gen-icons.js.
#
# Run order: node scripts/gen-icons.js  ->  run this script
#
# NOTE: Japanese characters inside comment lines in this .ps1 file were
# observed to break parsing of subsequent lines when the file is executed
# (dot-sourced or invoked) in this environment, even though the same code
# works fine typed inline. Comments are kept ASCII-only here to avoid that.
# The Japanese text itself is built from Unicode code points instead of a
# literal string, which works reliably either way.

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$iconsDir = Join-Path $root "icons"

$sizes = @(192, 512)
$fontFamily = "HGMaruGothicMPRO"
$textColor = [System.Drawing.Color]::FromArgb(236, 72, 153)

# Mo Ru Ku Ri !
$text = [string]([char]0x30E2) + [char]0x30EB + [char]0x30AF + [char]0x30EA + [char]0xFF01

foreach ($size in $sizes) {
    $basePath = Join-Path $iconsDir "icon-$size-base.png"
    $outPath = Join-Path $iconsDir "icon-$size.png"

    $bmp = [System.Drawing.Bitmap]::FromFile($basePath)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    $textAreaTop = $size * 0.68
    $textAreaHeight = $size - $textAreaTop
    $maxWidth = $size * 0.92

    $fontSize = [float]($size * 0.17)
    $font = New-Object System.Drawing.Font($fontFamily, $fontSize, [System.Drawing.FontStyle]::Bold)
    $textSize = $g.MeasureString($text, $font)
    while ($textSize.Width -gt $maxWidth -and $fontSize -gt 4) {
        $font.Dispose()
        $fontSize = $fontSize - 2
        $font = New-Object System.Drawing.Font($fontFamily, $fontSize, [System.Drawing.FontStyle]::Bold)
        $textSize = $g.MeasureString($text, $font)
    }

    $brush = New-Object System.Drawing.SolidBrush($textColor)
    $x = [single](($size - $textSize.Width) / 2)
    $y = [single]($textAreaTop + ($textAreaHeight - $textSize.Height) / 2)
    $g.DrawString($text, $font, $brush, $x, $y)

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $bmp.Dispose()
    $font.Dispose()
    $brush.Dispose()

    Write-Output ("wrote " + $outPath)
}
