# 🚀 VidFlow Deployment Guide - Step by Step

## 📋 Prerequisites
- Git repository (GitHub, GitLab, or Bitbucket)
- Account on your chosen platform (Render, Railway, etc.)

---

## 🎯 Option 1: Render.com (Recommended - Easiest)

### Step 1: Prepare Your Code
1. Make sure all files are committed to Git:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

### Step 2: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub/GitLab/Bitbucket (free)
3. Connect your repository

### Step 3: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your repository (select VidFlow repo)
3. Fill in the settings:
   - **Name**: `vidflow` (or any name you like)
   - **Region**: Choose closest to you
   - **Branch**: `main` (or `master`)
   - **Root Directory**: Leave empty (or `./` if needed)
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --threads 2 --timeout 300`
   - **Plan**: Free (or paid for better performance)

### Step 4: Environment Variables (Optional)
Click **"Environment"** tab and add:
- `SECRET_KEY`: Generate a random string (e.g., use: `python -c "import secrets; print(secrets.token_hex(32))"`)
- `PORT`: Leave empty (Render sets this automatically)

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Wait 2-5 minutes for deployment
3. Your app will be live at: `https://vidflow.onrender.com` (or your custom name)

### Step 6: Test
1. Visit your URL
2. Try converting a short YouTube video
3. Check logs if there are any issues

---

## 🚂 Option 2: Railway.app (Fast & Easy)

### Step 1: Prepare Code
```bash
git add .
git commit -m "Ready for Railway"
git push origin main
```

### Step 2: Deploy
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your VidFlow repository

### Step 3: Configure
Railway auto-detects Python apps. If needed:
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 300`

### Step 4: Environment Variables
Go to **Variables** tab:
- `SECRET_KEY`: Generate random string
- `PORT`: Railway sets this automatically

### Step 5: Deploy
Railway auto-deploys! Your app will be live in 1-2 minutes.

---

## 🐳 Option 3: Docker (Any Platform)

### Step 1: Create Dockerfile
Create `Dockerfile` in project root:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create directories
RUN mkdir -p downloads cache

# Expose port
EXPOSE 8000

# Run with Gunicorn
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:8000", "--workers", "2", "--threads", "2", "--timeout", "300"]
```

### Step 2: Build & Run Locally
```bash
docker build -t vidflow .
docker run -p 8000:8000 vidflow
```

### Step 3: Deploy to Docker Hub
```bash
docker tag vidflow yourusername/vidflow
docker push yourusername/vidflow
```

### Step 4: Deploy Anywhere
- **DigitalOcean App Platform**: Connect Docker Hub
- **AWS ECS**: Use Docker image
- **Google Cloud Run**: Deploy container
- **Azure Container Instances**: Use Docker image

---

## ☁️ Option 4: VPS (DigitalOcean, AWS EC2, etc.)

### Step 1: Connect to Server
```bash
ssh user@your-server-ip
```

### Step 2: Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and pip
sudo apt install python3 python3-pip python3-venv -y

# Install Git
sudo apt install git -y
```

### Step 3: Clone Repository
```bash
cd /var/www
sudo git clone https://github.com/yourusername/vidflow.git
cd vidflow
```

### Step 4: Setup Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn
```

### Step 5: Create Systemd Service
```bash
sudo nano /etc/systemd/system/vidflow.service
```

Add this content:
```ini
[Unit]
Description=VidFlow Gunicorn Application
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/vidflow
Environment="PATH=/var/www/vidflow/venv/bin"
ExecStart=/var/www/vidflow/venv/bin/gunicorn app:app --bind 127.0.0.1:8000 --workers 2 --threads 2 --timeout 300

[Install]
WantedBy=multi-user.target
```

### Step 6: Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable vidflow
sudo systemctl start vidflow
sudo systemctl status vidflow
```

### Step 7: Setup Nginx (Reverse Proxy)
```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/vidflow
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/vidflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: Setup SSL (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## 🔧 Quick Deployment Checklist

- [ ] Code is committed to Git
- [ ] `requirements.txt` is up to date
- [ ] `Procfile` exists (for Render/Heroku)
- [ ] `SECRET_KEY` is set in environment variables
- [ ] Test locally before deploying
- [ ] Check logs after deployment
- [ ] Test video conversion after deployment

---

## 🐛 Troubleshooting

### Issue: Build Fails
**Solution**: Check `requirements.txt` - make sure all packages are listed

### Issue: App Crashes on Start
**Solution**: 
- Check logs: `render logs` or Railway logs
- Verify `gunicorn` is in requirements.txt
- Check PORT environment variable

### Issue: Timeout Errors
**Solution**: Increase timeout in start command:
```bash
gunicorn app:app --bind 0.0.0.0:$PORT --timeout 600
```

### Issue: Out of Memory
**Solution**: 
- Upgrade to paid plan
- Reduce workers: `--workers 1`
- Add more RAM to VPS

---

## 📊 Recommended Settings by Platform

### Render.com (Free Tier)
- **Workers**: 1
- **Timeout**: 300 seconds
- **Auto-deploy**: Enabled

### Railway.app
- **Workers**: 2
- **Timeout**: 300 seconds
- **Auto-deploy**: Enabled

### VPS (2GB RAM)
- **Workers**: 2
- **Threads**: 2
- **Timeout**: 300 seconds

---

## 🎉 After Deployment

1. **Test Your App**: Visit your URL and try converting a video
2. **Monitor Logs**: Check for any errors
3. **Set Up Domain**: Add custom domain (optional)
4. **Enable HTTPS**: Use Let's Encrypt (free SSL)

---

## 💡 Pro Tips

1. **Use Environment Variables**: Never commit secrets to Git
2. **Monitor Resources**: Watch CPU/RAM usage
3. **Set Up Alerts**: Get notified if app goes down
4. **Regular Backups**: Backup your code regularly
5. **Update Dependencies**: Keep packages updated for security

---

## 📞 Need Help?

- Check application logs on your platform
- Verify all environment variables are set
- Test locally first before deploying
- Check platform-specific documentation

**Happy Deploying! 🚀**

