# 🔗 ChoreHero Integration Plan

## Current Situation

Your **ChoreHero** Heroku app is a **Vite/React frontend** application, not a Node.js backend. To add Fire TV control, we need to run **both** services together.

## ✅ Best Solution: Add Backend to ChoreHero

We'll add your Fire TV API as a backend service that runs alongside the React frontend.

### Architecture
```
ChoreHero App (Heroku)
├── Frontend (Vite/React) - Port 3000
└── Backend (Express API) - Port 3001
    └── Fire TV Control Endpoints
```

## 🚀 Integration Steps

### Step 1: Merge Fire TV Code into ChoreHero Repo

```powershell
# 1. Make sure you're on master branch
git checkout master

# 2. Fetch ChoreHero code
git fetch heroku

# 3. Create a new branch for integration
git checkout -b add-firetv-api heroku/main

# 4. Copy Fire TV files to backend folder
New-Item -ItemType Directory -Force -Path backend
Copy-Item eero-api.js backend/
Copy-Item web-server.js backend/firetv-server.js
Copy-Item -Recurse public backend/public
```

### Step 2: Update Package.json

Add to ChoreHero's `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "start:backend": "node backend/firetv-server.js",
    "start": "npm run start:backend"
  },
  "dependencies": {
    "express": "^4.18.2",
    "request": "^2.88.2",
    "tough-cookie-file-store": "^2.0.4"
  }
}
```

### Step 3: Update Procfile

Create/modify `Procfile` to run both frontend and backend:

```
web: node backend/firetv-server.js & npm run build && npx serve -s dist -p $PORT
```

OR simpler (backend only, serve React build from Express):

```
web: node backend/firetv-server.js
```

### Step 4: Update Backend Server

Modify `backend/firetv-server.js` to serve React build:

```javascript
const express = require('express');
const path = require('path');
const Eero = require('./eero-api');

const app = express();
const PORT = process.env.PORT || 3000;

// Fire TV API routes
app.get('/api/status', async (req, res) => { /* existing code */ });
app.get('/api/status/:profile', async (req, res) => { /* existing code */ });
app.post('/api/pause/:profile', async (req, res) => { /* existing code */ });
app.post('/api/unpause/:profile', async (req, res) => { /* existing code */ });

// Serve React build (ChoreHero frontend)
app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Server on port ${PORT}`));
```

### Step 5: Deploy

```powershell
git add .
git commit -m "Add Fire TV control API backend"
git push heroku add-firetv-api:main
```

## 🎯 Alternative: Separate API App

If you want to keep them separate, create a new Heroku app:

```powershell
# Create new app for Fire TV API
heroku create chorehero-tv-api

# Add remote
git remote add tv-api https://git.heroku.com/chorehero-tv-api.git

# Deploy just the API
git push tv-api master

# Use in ChoreHero frontend
# API URL: https://chorehero-tv-api.herokuapp.com/api/pause/rilyn
```

## 💡 Recommended Approach

**Option 1** (Single App): Best for simplicity
- Pros: One app, one dyno, easier management
- Cons: Frontend and backend coupled

**Option 2** (Separate Apps): Best for architecture
- Pros: Clean separation, independent scaling
- Cons: Two apps to manage, CORS setup needed

## 🔧 Quick Integration in ChoreHero React Code

Once deployed, use in your React components:

```javascript
// src/utils/tvControl.js
const TV_API = process.env.NODE_ENV === 'production' 
  ? '/api'  // Same domain (Option 1)
  : 'https://chorehero-tv-api.herokuapp.com/api';  // Separate app (Option 2)

export async function pauseTV(kidName) {
  const profile = kidName.toLowerCase(); // 'rilyn' or 'cael'
  await fetch(`${TV_API}/pause/${profile}`, { method: 'POST' });
}

export async function unpauseTV(kidName) {
  const profile = kidName.toLowerCase();
  await fetch(`${TV_API}/unpause/${profile}`, { method: 'POST' });
}

export async function getTVStatus(kidName) {
  const profile = kidName.toLowerCase();
  const res = await fetch(`${TV_API}/status/${profile}`);
  return res.json();
}

// In your chore completion handler
async function onChoreCompleted(chore) {
  if (chore.completed) {
    await unpauseTV(chore.childName);
  }
}
```

## 📋 Next Steps

**Choose your approach:**

1. **Merge into ChoreHero** (recommended) - Follow "Integration Steps" above
2. **Separate API app** - Follow "Alternative" section

Then I can help you:
- Update the code structure
- Configure the deployment
- Add TV controls to your React components
- Set up chore completion triggers

**Which approach do you prefer?**
