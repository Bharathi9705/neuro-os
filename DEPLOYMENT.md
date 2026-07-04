# NEURO-OS Deployment Guide

This guide will help you deploy **NEURO-OS** to production using **Vercel** (frontend) and **Render** (backend).

---

## 📋 Prerequisites

Before deploying, ensure you have:

- A GitHub account with your NEURO-OS repository pushed

- A Vercel account (free tier available at [vercel.com](https://vercel.com))

- A Render account (free tier available at [render.com](https://render.com))

- Your Groq API key

---

## 🚀 Part 1: Deploy Backend to Render

### Step 1: Create a Render Account

1. Go to [render.com](https://render.com) and sign up

1. Click **"New +"** and select **"Web Service"**

1. Connect your GitHub account and select the `NEURO-OS` repository

### Step 2: Configure the Web Service

1. **Name**: `neuro-os-backend`

1. **Environment**: `Python 3.11`

1. **Build Command**: `pip install -r backend/requirements.txt`

1. **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port 8000`

1. **Instance Type**: Free (or upgrade for better performance)

### Step 3: Add Environment Variables

In the Render dashboard, add:

```
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET=your_secret_key_here
```

### Step 4: Deploy

Click **"Create Web Service"** and wait for deployment to complete. Your backend URL will be something like:

```
https://neuro-os-backend.onrender.com
```

---

## 🎨 Part 2: Deploy Frontend to Vercel

### Step 1: Create a Vercel Project

1. Go to [vercel.com](https://vercel.com)

1. Click **"Add New..."** → **"Project"**

1. Select your GitHub repository

1. Choose **"Next.js"** as the framework

### Step 2: Configure Build Settings

1. **Root Directory**: `frontend`

1. **Build Command**: `npm run build`

1. **Output Directory**: `.next`

1. **Install Command**: `npm install`

### Step 3: Add Environment Variables

In the Vercel dashboard, add:

```
NEXT_PUBLIC_API_URL=https://neuro-os-backend.onrender.com
```

### Step 4: Deploy

Click **"Deploy"** and wait for the build to complete. Your frontend URL will be something like:

```
https://neuro-os.vercel.app
```

---

## 🔗 Update Frontend API Endpoint

After deployment, update your frontend to use the production backend URL:

**File**: `frontend/app/page.tsx`

Find this line:

```typescript
const response = await fetch('http://127.0.0.1:8001/chat', {
```

Replace with:

```typescript
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
```

Also update the image generation endpoint:

```typescript
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generate-image`, {
```

---

## ✅ Testing Your Deployment

1. Open your Vercel frontend URL

1. Log in with any email/password

1. Send a message to test the connection

1. Try the voice input and image generation features

---

## 🛠️ Troubleshooting

### "Could not connect to backend"

- Ensure your Render backend is running (check Render dashboard )

- Verify the `NEXT_PUBLIC_API_URL` environment variable is correct

- Check CORS settings in `backend/main.py`

### "Image generation not working"

- The placeholder API is being used. For production, integrate with:
  - [Replicate](https://replicate.com) - Free tier available
  - [Hugging Face](https://huggingface.co) - Free inference API
  - [DALL-E](https://openai.com/dall-e-3) - Paid API

### "Slow responses"

- Upgrade from Render free tier to paid

- Consider using a faster region closer to your users

---

## 📊 Production Checklist

- [ ] Backend deployed on Render

- [ ] Frontend deployed on Vercel

- [ ] Environment variables set correctly

- [ ] API endpoint updated in frontend

- [ ] CORS configured properly

- [ ] Tested login/signup

- [ ] Tested chat functionality

- [ ] Tested voice input

- [ ] Tested image generation

- [ ] Custom domain configured (optional)

---

## 🔐 Security Notes

1. **Never commit ****`.env`**** files** - Use environment variables in your hosting platform

1. **Change JWT_SECRET** - Generate a strong random string for production

1. **Use HTTPS** - Both Vercel and Render provide free HTTPS

1. **Rate limiting** - Consider adding rate limiting to prevent abuse

1. **API Key rotation** - Regularly rotate your Groq API key

---

## 📈 Scaling Tips

- **Database**: Add MongoDB or PostgreSQL for persistent chat history

- **Caching**: Use Redis for faster responses

- **CDN**: Vercel includes CDN by default

- **Load Balancing**: Render automatically handles load balancing

- **Monitoring**: Set up monitoring with Sentry or similar

---

## 🎉 You're Live!

Your NEURO-OS platform is now live on the internet! Share your deployment URL with friends and family.

For questions or issues, check the [GitHub Issues](https://github.com/Bharathi9705/neuro-os/issues) page.

