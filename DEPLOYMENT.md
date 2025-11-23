# 🚀 Vercel Deployment Checklist

## ✅ Pre-Deployment Security Checklist

### 1. Run Security Check
```bash
python security_check.py
```
**Expected Output:** ✅ All security checks passed!

### 2. Verify .env is NOT in Git
```bash
git status
```
**Expected:** `.env` should NOT appear in the list

```bash
git ls-files | Select-String ".env"
```
**Expected:** No output (file is not tracked)

### 3. Verify Git History is Clean
```bash
git log --all --full-history -- .env
```
**Expected:** No output (file was never committed)

### 4. Check for Hardcoded Secrets
```bash
# Search for MongoDB connection strings
git grep -i "mongodb+srv://"

# Search for potential passwords
git grep -i "Di5yQqQDFWlzetkr"
```
**Expected:** Only examples in `.env.example` or `SECURITY.md`

---

## 🗂️ Files to Commit

### ✅ Safe to Commit:
- `server.py`
- `requirements.txt`
- `vercel.json`
- `.vercelignore`
- `.gitignore`
- `.env.example` (template only)
- `SECURITY.md`
- `README.md`
- All files in `static/`
- All files in `templates/`
- `security_check.py`

### ❌ NEVER Commit:
- `.env` (contains real secrets)
- `app.log` (may contain sensitive data)
- `__pycache__/` (Python cache)
- `venv/`, `env/`, `harvest/` (virtual environments)
- `data/*.json` (old data files with user info)

---

## 🔐 Vercel Environment Variables Setup

### Step 1: Login to Vercel
1. Go to https://vercel.com
2. Login with your account
3. Select your project or import from GitHub

### Step 2: Navigate to Environment Variables
1. Click on your project
2. Go to **Settings**
3. Click **Environment Variables** in the sidebar

### Step 3: Add Required Variables

| Variable Name | Value | Where to Get It |
|--------------|-------|-----------------|
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB Atlas → Connect → Drivers |
| `DATABASE_NAME` | `harvestlink` | Your database name |
| `SECRET_KEY` | Random 64-char string | Generate with command below |
| `FLASK_ENV` | `production` | Type manually |

### Generate SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Step 4: Set Environment Scope
- ✅ **Production** - Required
- ✅ **Preview** - Optional (recommended)
- ⚪ **Development** - Not needed (use local .env)

---

## 🔄 Deployment Commands

### Option 1: Deploy via Vercel Dashboard
1. Connect GitHub repository
2. Vercel auto-deploys on push to master
3. Check deployment logs

### Option 2: Deploy via CLI
```bash
# Install Vercel CLI (first time only)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

---

## ✅ Post-Deployment Verification

### 1. Check Health Endpoint
```bash
curl https://your-app.vercel.app/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-23T...",
  "version": "2.0.0-mongodb"
}
```

### 2. Test User Registration
1. Go to https://your-app.vercel.app
2. Click "Register as Farmer"
3. Fill in details and submit
4. Should see success message

### 3. Test Login
1. Click "Login"
2. Enter registered credentials
3. Should redirect to farmer/buyer dashboard

### 4. Check MongoDB Atlas
1. Login to MongoDB Atlas
2. Go to **Database → Browse Collections**
3. Should see new user in `users` collection

### 5. Check Logs
```bash
# Via Vercel CLI
vercel logs

# Or via Vercel Dashboard
# Project → Deployments → [Latest] → Logs
```

---

## 🚨 Common Issues & Solutions

### Issue: "Database connection not available"
**Solution:**
1. Check MongoDB Atlas is running
2. Verify `MONGODB_URI` in Vercel environment variables
3. Ensure Network Access allows `0.0.0.0/0` in MongoDB Atlas

### Issue: "Module not found"
**Solution:**
1. Verify all dependencies are in `requirements.txt`
2. Check Python version matches `runtime.txt`
3. Redeploy to trigger fresh install

### Issue: "Internal Server Error"
**Solution:**
1. Check Vercel logs: `vercel logs`
2. Look for Python errors
3. Verify all environment variables are set

### Issue: "CORS errors in browser"
**Solution:**
1. Check CORS configuration in `server.py`
2. Verify Vercel domain is allowed
3. Check browser console for specific CORS error

---

## 📊 MongoDB Atlas Setup for Vercel

### 1. Network Access
```
Security → Network Access → Add IP Address
IP: 0.0.0.0/0
Comment: Vercel Deployment (All IPs - Authentication Required)
```

### 2. Database User
```
Security → Database Access
Username: harvestlink_app (or your choice)
Password: [Generate Strong Password]
Privileges: Read and write to specific database (harvestlink)
```

### 3. Connection String
```
Database → Connect → Connect your application
Driver: Python, Version: 3.11 or later
Copy connection string
Replace <password> with actual password
```

---

## 🎯 Final Checklist Before Push

- [ ] Ran `python security_check.py` - All passed
- [ ] `.env` is in `.gitignore` and not tracked
- [ ] No hardcoded secrets in code
- [ ] `requirements.txt` is up to date
- [ ] `.env.example` has template values only
- [ ] MongoDB Atlas network access configured
- [ ] MongoDB Atlas user created with correct permissions
- [ ] Vercel environment variables ready to add
- [ ] `SECURITY.md` reviewed
- [ ] Tested locally with production settings

---

## 🚀 Ready to Deploy!

```bash
# Stage all changes
git add .

# Commit changes
git commit -m "feat: complete MongoDB migration and security setup"

# Push to GitHub
git push origin master

# Deploy to Vercel (if CLI installed)
vercel --prod
```

---

## 📱 After Successful Deployment

### Share Your App:
1. Get your Vercel URL: `https://your-app.vercel.app`
2. Share with farmers and buyers
3. Monitor usage via Vercel Analytics
4. Check MongoDB Atlas metrics

### Monitor:
- Vercel Analytics Dashboard
- MongoDB Atlas Metrics
- Application logs via `vercel logs`

### Maintain:
- Rotate secrets every 90 days
- Keep dependencies updated
- Monitor for security advisories
- Back up MongoDB data regularly

---

**🎉 Congratulations! Your app is now live and secure on Vercel!**
