# ⚡ Quick Deployment Guide - VidFlow

## 🎯 Fastest Way: Render.com (5 minutes)

### Step-by-Step:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready to deploy"
   git push origin main
   ```

2. **Go to Render.com**
   - Visit: https://render.com
   - Sign up with GitHub (free)

3. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your repository
   - Settings:
     - **Name**: `vidflow`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --threads 2 --timeout 300`
   - Click "Create Web Service"

4. **Wait 2-3 minutes** ⏱️
   - Render will build and deploy automatically

5. **Done!** ✅
   - Your app is live at: `https://vidflow.onrender.com`

---

## 🚂 Alternative: Railway.app (Even Faster!)

1. **Go to**: https://railway.app
2. **Sign up** with GitHub
3. **Click**: "New Project" → "Deploy from GitHub"
4. **Select** your VidFlow repo
5. **Done!** (Auto-detects everything)

---

## 🔑 Generate Secret Key

Before deploying, generate a secure secret key:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Add it as environment variable `SECRET_KEY` in your platform.

---

## ✅ Checklist

- [ ] Code pushed to GitHub/GitLab
- [ ] `requirements.txt` is complete
- [ ] `Procfile` exists (for Render)
- [ ] `SECRET_KEY` environment variable set
- [ ] Tested locally first

---

## 📝 Start Command (Copy-Paste)

```bash
gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --threads 2 --timeout 300
```

---

## 🆘 Need Help?

- Check platform logs
- Verify environment variables
- See `DEPLOY_STEPS.md` for detailed guide

**That's it! Your VidFlow is ready to go live! 🚀**

