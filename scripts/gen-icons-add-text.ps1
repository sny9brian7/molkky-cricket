# Composites the cute "Morukuri!" wordmark onto the concentric-circle icon
# base layers produced by gen-icons.js.
#
# Run order: node scripts/gen-icons.js  ->  run this script (dot-source it)
#
# NOTE: Japanese characters inside comment lines in this .ps1 file were
# observed to break parsing of subsequent lines when the file is executed
# (dot-sourced or invoked) in this environment, even though the same code
# works fine typed inline. Comments are kept ASCII-only here to avoid that.
# The Japanese text itself is built from Unicode code points instead of a
# literal string, which works reliably either way.
#
# The base layer from gen-icons.js is rendered at SS times the final
# resolution (supersampling). Text is drawn at that same supersampled
# scale, then the whole composited image is downscaled with high-quality
# bicubic interpolation before saving, which gives much cleaner
# (less jagged) edges than drawing directly at the final small size.

Add-Type -AssemblyName System.Drawing

$SS = 3
$root = Split-Path -Parent $PSScriptRoot
$iconsDir = Join-Path $root "icons"

$sizes = @(192, 512)
# Same family used by the app's UI (font-weight:900 in css/style.css)
$fontFamily = "Noto Sans JP Black"
$textColor = [System.Drawing.Color]::FromArgb(236, 72, 153)

# Mo Ru Ku Ri !
$text = [string]([char]0x30E2) + [char]0x30EB + [char]0x30AF + [char]0x30EA + [char]0xFF01

foreach ($size in $sizes) {
    $ssSize = $size * $SS
    $basePath = Join-Path $iconsDir "icon-$size-base-ss.png"
    $outPath = Join-Path $iconsDir "icon-$size.png"

    $bmp = [System.Drawing.Bitmap]::FromFile($basePath)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    $textAreaTop = $ssSize * 0.68
    $textAreaHeight = $ssSize - $textAreaTop
    $maxWidth = $ssSize * 0.92

    $fontSize = [float]($ssSize * 0.17)
    $font = New-Object System.Drawing.Font($fontFamily, $fontSize, [System.Drawing.FontStyle]::Regular)
    $textSize = $g.MeasureString($text, $font)
    while ($textSize.Width -gt $maxWidth -and $fontSize -gt 4) {
        $font.Dispose()
        $fontSize = $fontSize - 2
        $font = New-Object System.Drawing.Font($fontFamily, $fontSize, [System.Drawing.FontStyle]::Regular)
        $textSize = $g.MeasureString($text, $font)
    }

    $brush = New-Object System.Drawing.SolidBrush($textColor)
    $x = [single](($ssSize - $textSize.Width) / 2)
    $y = [single]($textAreaTop + ($textAreaHeight - $textSize.Height) / 2)
    $g.DrawString($text, $font, $brush, $x, $y)

    # Downscale the supersampled composite down to the final icon size
    $finalBmp = New-Object System.Drawing.Bitmap($size, $size)
    $finalG = [System.Drawing.Graphics]::FromImage($finalBmp)
    $finalG.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $finalG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $finalG.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $finalG.DrawImage($bmp, 0, 0, $size, $size)
    $finalBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $finalG.Dispose()
    $finalBmp.Dispose()
    $g.Dispose()
    $bmp.Dispose()
    $font.Dispose()
    $brush.Dispose()

    Write-Output ("wrote " + $outPath)
}
