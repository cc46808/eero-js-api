# ChoreHero - Fire TV Control Quick Reference

## 🚀 Deploy to Heroku

```bash
# 1. Authenticate with Eero
node setup-heroku.js

# 2. Add Heroku remote (if not already added)
heroku git:remote -a chorehero

# 3. Deploy
git add .
git commit -m "Fire TV control"
git push heroku master

# 4. Open
heroku open
```

## 🌐 Your ChoreHero URLs

- **Web Interface**: https://chorehero.herokuapp.com
- **API Base**: https://chorehero.herokuapp.com/api

## 🎮 API Endpoints

### Get Status
```bash
GET https://chorehero.herokuapp.com/api/status
GET https://chorehero.herokuapp.com/api/status/rilyn
GET https://chorehero.herokuapp.com/api/status/cael
```

### Control TVs
```bash
POST https://chorehero.herokuapp.com/api/pause/rilyn
POST https://chorehero.herokuapp.com/api/pause/cael
POST https://chorehero.herokuapp.com/api/unpause/rilyn
POST https://chorehero.herokuapp.com/api/unpause/cael
```

## 💻 Example: Integrate with ChoreHero

```javascript
// In your ChoreHero app

const FIRETV_API = 'https://chorehero.herokuapp.com/api';

// Pause TV when chores aren't done
async function blockTVForKid(kidName) {
  const profile = kidName.toLowerCase(); // 'rilyn' or 'cael'
  const response = await fetch(`${FIRETV_API}/pause/${profile}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  const result = await response.json();
  console.log(result.message); // "Rilyn TV paused successfully"
  return result;
}

// Unpause TV when chores are complete
async function allowTVForKid(kidName) {
  const profile = kidName.toLowerCase();
  const response = await fetch(`${FIRETV_API}/unpause/${profile}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  const result = await response.json();
  console.log(result.message); // "Rilyn TV unpaused successfully"
  return result;
}

// Check if TV is currently paused
async function checkTVStatus(kidName) {
  const profile = kidName.toLowerCase();
  const response = await fetch(`${FIRETV_API}/status/${profile}`);
  const data = await response.json();
  
  return {
    isPaused: data.device.paused,
    isConnected: data.device.connected,
    ip: data.device.ip,
    name: data.device.nickname
  };
}

// Example usage in your chore completion handler
async function onChoreCompleted(choreData) {
  const kidName = choreData.assignedTo; // 'Rilyn' or 'Cael'
  
  // Check if all chores are done
  const allChoresDone = await checkAllChoresForKid(kidName);
  
  if (allChoresDone) {
    // Reward: unpause their TV
    await allowTVForKid(kidName);
    console.log(`${kidName}'s TV access restored!`);
  }
}

// Example: Scheduled daily reset (pause all TVs until chores are done)
async function dailyReset() {
  await blockTVForKid('Rilyn');
  await blockTVForKid('Cael');
  console.log('All TVs paused until chores are complete');
}
```

## 🔧 Troubleshooting

```bash
# View logs
heroku logs --tail

# Restart app
heroku restart

# Check dyno status
heroku ps

# Re-authenticate (if cookies expired)
node setup-heroku.js
git commit -am "Update auth"
git push heroku master
```

## 🔒 Security Note

The cookie file (`.tmp/eero_cookies.json`) contains your authentication.
- ✓ It's in `.gitignore` so it won't be pushed to GitHub
- ✓ It WILL be deployed to Heroku
- ⚠️ Heroku dynos restart daily, so cookies may need refresh

## 📱 Mobile Access

Access from your phone:
- Open https://chorehero.herokuapp.com in any browser
- Works on iOS, Android, desktop
- Bookmark for quick access
