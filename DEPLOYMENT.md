# VidFlow Deployment Guide

## Quick Start

### Local Development

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **No FFmpeg Required!** 
   - VidFlow uses pure Python libraries (pytubefix)
   - No external dependencies needed

3. **Run the Application**
   ```bash
   python app.py
   ```
   Or use the startup scripts:
   - Windows: `start.bat`
   - Linux/Mac: `bash start.sh`

4. **Access the Application**
   Open your browser and navigate to `http://localhost:5000`

## Production Deployment

### Option 1: Render.com

1. **Connect Repository**
   - Sign up/login to Render.com
   - Connect your Git repository

2. **Create Web Service**
   - Select "Web Service"
   - Choose your repository
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT`

3. **Environment Variables** (Optional)
   - `SECRET_KEY`: Flask secret key
   - `PORT`: Server port (auto-set by Render)

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy your app

### Option 2: Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Configure Serverless Functions**
   - Vercel uses serverless functions
   - May need to adjust for long-running video conversions

### Option 3: AWS / Gunicorn + Nginx

1. **Install Gunicorn**
   ```bash
   pip install gunicorn
   ```

2. **Run with Gunicorn**
   ```bash
   gunicorn app:app --bind 0.0.0.0:8000 --workers 2 --threads 2 --timeout 120
   ```

3. **Configure Nginx**
   - Copy `nginx.conf.example` to `/etc/nginx/sites-available/vidflow`
   - Update server_name and paths
   - Enable site: `sudo ln -s /etc/nginx/sites-available/vidflow /etc/nginx/sites-enabled/`
   - Test: `sudo nginx -t`
   - Reload: `sudo systemctl reload nginx`

4. **Set up Systemd Service** (Optional)
   Create `/etc/systemd/system/vidflow.service`:
   ```ini
   [Unit]
   Description=VidFlow Gunicorn Application Server
   After=network.target

   [Service]
   User=www-data
   Group=www-data
   WorkingDirectory=/path/to/proj
   Environment="PATH=/path/to/venv/bin"
   ExecStart=/path/to/venv/bin/gunicorn app:app --bind 127.0.0.1:8000 --workers 2

   [Install]
   WantedBy=multi-user.target
   ```

   Enable and start:
   ```bash
   sudo systemctl enable vidflow
   sudo systemctl start vidflow
   ```

### Option 4: Docker

1. **Create Dockerfile**
   ```dockerfile
   FROM python:3.9-slim

   WORKDIR /app

   # Install FFmpeg
   RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

   # Install Python dependencies
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt

   # Copy application
   COPY . .

   # Create directories
   RUN mkdir -p downloads cache

   # Expose port
   EXPOSE 8000

   # Run with Gunicorn
   CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:8000", "--workers", "2"]
   ```

2. **Build and Run**
   ```bash
   docker build -t vidflow .
   docker run -p 8000:8000 vidflow
   ```

## Environment Variables

- `PORT`: Server port (default: 5000)
- `SECRET_KEY`: Flask secret key for sessions (change in production!)

## Important Notes

1. **No FFmpeg Required**: Uses pure Python libraries (pytubefix)
2. **Storage**: Ensure sufficient disk space for video downloads
3. **Timeouts**: Long videos may require increased timeout settings (300+ seconds)
4. **Security**: Change `SECRET_KEY` in production
5. **File Cleanup**: Old files are automatically cleaned after 1 hour

## Monitoring

- Health Check: `GET /health`
- Returns server status and cache size

## Troubleshooting

### Conversion Fails
- Verify disk space: `df -h`
- Check logs for specific error messages
- Ensure pytubefix is installed: `pip list | grep pytubefix`

### Port Already in Use
- Change port in `app.py` or set `PORT` environment variable
- For Gunicorn: `--bind 0.0.0.0:NEW_PORT`

### Permission Errors
- Ensure write permissions for `downloads/` and `cache/` directories
- Check file ownership: `chown -R user:group downloads cache`

## Performance Optimization

1. **Increase Workers** (Gunicorn)
   ```bash
   gunicorn app:app --workers 4 --threads 2
   ```

2. **Enable Caching** (Already implemented)
   - Recent conversions are cached for 1 hour

3. **CDN for Static Files** (Optional)
   - Serve static files through CDN for better performance

4. **Database Caching** (Future Enhancement)
   - Consider Redis for distributed caching

