# FFmpeg Installation Guide for VidFlow

## Why FFmpeg is Required

FFmpeg is required for MP3 audio conversion. MP4 video conversion works without FFmpeg, but MP3 conversion needs it to extract and convert audio.

## Installation Instructions

### Windows

1. **Download FFmpeg:**
   - Visit: https://www.gyan.dev/ffmpeg/builds/
   - Download the "ffmpeg-release-essentials.zip" file

2. **Extract the ZIP file:**
   - Extract to a location like `C:\ffmpeg`

3. **Add to PATH:**
   - Right-click "This PC" → Properties
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", find "Path" and click "Edit"
   - Click "New" and add: `C:\ffmpeg\bin` (or wherever you extracted it)
   - Click OK on all dialogs

4. **Verify Installation:**
   - Open a new Command Prompt or PowerShell
   - Run: `ffmpeg -version`
   - You should see FFmpeg version information

5. **Restart your Flask application** after installing FFmpeg

### Alternative: Using Chocolatey (Windows)

If you have Chocolatey installed:
```powershell
choco install ffmpeg
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install ffmpeg
```

### macOS

```bash
brew install ffmpeg
```

## Verify Installation

After installation, restart your Flask app and check the health endpoint:
- Visit: `http://localhost:5000/health`
- Check if `ffmpeg_installed` is `true`

## Troubleshooting

- **"FFmpeg not found"**: Make sure FFmpeg is in your system PATH
- **Restart required**: You may need to restart your terminal/IDE after installing
- **Check PATH**: Run `echo $PATH` (Linux/Mac) or `echo %PATH%` (Windows) to verify

## Note

- MP4 conversion works WITHOUT FFmpeg
- Only MP3 conversion requires FFmpeg
- If you only need MP4, you can use the app without installing FFmpeg

