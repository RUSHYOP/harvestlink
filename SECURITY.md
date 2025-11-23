# 🔒 Security Guide for Harvest Link

## Critical Security Checklist Before Deployment

### ✅ Pre-Deployment Security Steps

#### 1. **Verify .gitignore**
Ensure these files are NEVER committed:
- ✅ `.env` - Contains all secrets
- ✅ `.env.local` - Local environment overrides
- ✅ `app.log` - May contain sensitive data
- ✅ `harvest/` - Virtual environment
- ✅ `__pycache__/` - Python cache

#### 2. **Check Git History**
```bash
# Check if .env was ever committed
git log --all --full-history -- .env

# If found, you need to:
# 1. Rotate all secrets (MongoDB password, SECRET_KEY)
# 2. Use git-filter-repo or BFG to clean history
```

#### 3. **Verify No Secrets in Code**
```bash
# Search for potential secrets
git grep -i "mongodb+srv"
git grep -i "password.*=" 
git grep -i "secret.*="
```

## Environment Variables Setup

### Development (.env file)
```env
FLASK_ENV=development
SECRET_KEY=dev-key-not-for-production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=yourapp
DATABASE_NAME=harvestlink
```

### Production (Vercel Dashboard)
Add these in: **Vercel Dashboard → Project → Settings → Environment Variables**

| Variable | Value | Notes |
|----------|-------|-------|
| `MONGODB_URI` | `mongodb+srv://...` | Get from MongoDB Atlas |
| `DATABASE_NAME` | `harvestlink` | Your database name |
| `SECRET_KEY` | Random 64-char hex | Generate with command below |
| `FLASK_ENV` | `production` | Disables debug mode |

#### Generate Strong SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

## MongoDB Security

### 1. **Network Access**
In MongoDB Atlas:
- Go to: **Security → Network Access**
- For Vercel: Add `0.0.0.0/0` (Vercel uses dynamic IPs)
- **Note**: This is safe because authentication is still required

### 2. **Database User Permissions**
- Create a dedicated user for your app (not admin)
- Grant only necessary permissions:
  ```
  Read/Write access to: harvestlink database only
  ```

### 3. **Rotate MongoDB Password**
If you accidentally exposed it:
1. MongoDB Atlas → Database Access
2. Edit user → Change password
3. Update `MONGODB_URI` in Vercel environment variables
4. Redeploy

### 4. **Connection String Security**
✅ **Good**: `mongodb+srv://username:password@cluster.mongodb.net/?appName=harvestlink`
❌ **Bad**: Hardcoded in code
❌ **Bad**: Committed to git
❌ **Bad**: In documentation files

## Application Security Features

### ✅ Already Implemented:

1. **Password Storage**
   - Currently: Plain text (⚠️ needs improvement)
   - TODO: Implement bcrypt/argon2 hashing

2. **Email Validation**
   - Regex validation on server-side
   - Unique email constraint in MongoDB

3. **Security Headers**
   ```python
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY
   X-XSS-Protection: 1; mode=block
   Strict-Transport-Security: max-age=31536000
   ```

4. **CORS Protection**
   - Configured for API routes only
   - Can be restricted in production

5. **Input Sanitization**
   - Trimming whitespace
   - Email normalization (lowercase)

6. **Error Handling**
   - No stack traces exposed in production
   - Generic error messages to users
   - Detailed logs server-side only

## Deployment Security Checklist

### Before Pushing to Git:
- [ ] `.env` is in `.gitignore`
- [ ] No secrets in any committed files
- [ ] Documentation doesn't contain real credentials
- [ ] `.vercelignore` is configured

### In Vercel Dashboard:
- [ ] All environment variables added
- [ ] `FLASK_ENV=production` is set
- [ ] Strong `SECRET_KEY` is generated
- [ ] MongoDB URI is correct

### In MongoDB Atlas:
- [ ] Network access allows Vercel (0.0.0.0/0)
- [ ] Database user has minimal permissions
- [ ] Password is strong and unique

### After Deployment:
- [ ] Test login/registration
- [ ] Verify HTTPS is working
- [ ] Check logs for errors
- [ ] Test all API endpoints

## Security Improvements (TODO)

### High Priority:
1. **Password Hashing**
   ```bash
   pip install bcrypt
   ```
   Implement bcrypt for password storage

2. **Rate Limiting**
   ```bash
   pip install flask-limiter
   ```
   Prevent brute force attacks

3. **JWT Tokens**
   Replace localStorage with secure JWT tokens

### Medium Priority:
4. **Input Validation Library**
   ```bash
   pip install marshmallow
   ```
   Better schema validation

5. **HTTPS Redirect**
   Force HTTPS in production

6. **Session Management**
   Implement secure sessions with expiry

## What If Secrets Were Exposed?

### If MongoDB credentials leaked:
1. **Immediately** change MongoDB password
2. Update Vercel environment variables
3. Redeploy application
4. Check MongoDB logs for suspicious activity

### If SECRET_KEY leaked:
1. Generate new SECRET_KEY
2. Update in Vercel
3. Redeploy (all users will need to re-login)

### If .env was committed:
1. Remove file from git history:
   ```bash
   git filter-repo --path .env --invert-paths
   ```
2. Rotate ALL secrets
3. Force push (if repo is private and you're the only user)

## Monitoring & Auditing

### Regular Security Checks:
- Review MongoDB Atlas access logs
- Check Vercel deployment logs
- Monitor for failed login attempts
- Review API usage patterns

### Logs to Monitor:
- Failed login attempts: `Failed login attempt for:`
- Duplicate email attempts: `Attempt to register existing email:`
- Database connection issues: `Failed to connect to MongoDB:`

## Support & Questions

For security concerns or questions:
1. Check this guide first
2. Review MongoDB Atlas security docs
3. Review Vercel security best practices
4. Never share credentials in support requests

## Quick Reference

### Safe to commit:
✅ Source code (`.py`, `.js`, `.html`, `.css`)
✅ `requirements.txt`
✅ `.env.example` (template only)
✅ Configuration files (`vercel.json`)
✅ Documentation (without credentials)

### NEVER commit:
❌ `.env`
❌ `app.log`
❌ Virtual environments
❌ `__pycache__/`
❌ Any file with passwords or tokens

---

**Remember**: Security is an ongoing process. Review this guide regularly and stay updated with security best practices.
