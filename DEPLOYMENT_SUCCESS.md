# 🎉 Fire TV API Successfully Deployed!

## Your Live API

**Base URL**: `https://chorehero-tv-api-dbaa97074fdf.herokuapp.com`

### ✅ Available Endpoints

```
GET  /api/status           - Get both TVs status
GET  /api/status/rilyn     - Get Rilyn's TV status
GET  /api/status/cael      - Get Cael's TV status
POST /api/pause/rilyn      - Pause Rilyn's TV
POST /api/pause/cael       - Pause Cael's TV
POST /api/unpause/rilyn    - Unpause Rilyn's TV
POST /api/unpause/cael     - Unpause Cael's TV
```

### 🎨 Web Interface

Visit: **https://chorehero-tv-api-dbaa97074fdf.herokuapp.com**

Beautiful UI with real-time status and one-click pause/unpause controls!

---

## 🔗 Integrate with ChoreHero React App

### Step 1: Create TV Control Utility

Create `src/utils/tvControl.js` in your ChoreHero app:

```javascript
const TV_API = 'https://chorehero-tv-api-dbaa97074fdf.herokuapp.com/api';

/**
 * Pause a kid's Fire TV
 * @param {string} kidName - 'Rilyn' or 'Cael'
 */
export async function pauseTV(kidName) {
  const profile = kidName.toLowerCase();
  try {
    const response = await fetch(`${TV_API}/pause/${profile}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error(`Failed to pause ${kidName}'s TV:`, error);
    return false;
  }
}

/**
 * Unpause a kid's Fire TV
 * @param {string} kidName - 'Rilyn' or 'Cael'
 */
export async function unpauseTV(kidName) {
  const profile = kidName.toLowerCase();
  try {
    const response = await fetch(`${TV_API}/unpause/${profile}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error(`Failed to unpause ${kidName}'s TV:`, error);
    return false;
  }
}

/**
 * Get TV status for a kid
 * @param {string} kidName - 'Rilyn' or 'Cael'
 */
export async function getTVStatus(kidName) {
  const profile = kidName.toLowerCase();
  try {
    const response = await fetch(`${TV_API}/status/${profile}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to get ${kidName}'s TV status:`, error);
    return null;
  }
}

/**
 * Get both TVs status
 */
export async function getAllTVStatus() {
  try {
    const response = await fetch(`${TV_API}/status`);
    return await response.json();
  } catch (error) {
    console.error('Failed to get all TV status:', error);
    return null;
  }
}
```

### Step 2: Use in Your Components

#### Example: Daily Reset (Pause Both TVs)

```javascript
import { pauseTV } from '../utils/tvControl';

// In your daily reset function or component
async function dailyReset() {
  console.log('Starting daily reset - pausing all TVs...');
  
  await pauseTV('Rilyn');
  await pauseTV('Cael');
  
  console.log('All TVs paused. Kids must complete chores to watch TV!');
}
```

#### Example: Chore Completion Handler

```javascript
import { unpauseTV, pauseTV } from '../utils/tvControl';

// When a kid completes all their chores
async function onAllChoresCompleted(kidName) {
  console.log(`${kidName} completed all chores!`);
  
  // Reward: Unpause their TV
  const success = await unpauseTV(kidName);
  
  if (success) {
    // Show success notification
    showNotification(`🎉 ${kidName}'s TV is now unlocked!`);
  }
}

// If a completed chore gets unchecked
async function onChoreUncompleted(kidName) {
  // Check if they still have all chores done
  const choresComplete = await checkIfAllChoresComplete(kidName);
  
  if (!choresComplete) {
    // Consequence: Pause their TV again
    await pauseTV(kidName);
    showNotification(`📺 ${kidName}'s TV is paused until chores are done`);
  }
}
```

#### Example: Parent Dashboard Component

```javascript
import React, { useState, useEffect } from 'react';
import { getAllTVStatus, pauseTV, unpauseTV } from '../utils/tvControl';

function ParentTVControls() {
  const [tvStatus, setTvStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load TV status
  useEffect(() => {
    loadStatus();
    // Refresh every 30 seconds
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadStatus() {
    const status = await getAllTVStatus();
    setTvStatus(status);
  }

  async function handleToggle(kidName, currentlyPaused) {
    setLoading(true);
    
    if (currentlyPaused) {
      await unpauseTV(kidName);
    } else {
      await pauseTV(kidName);
    }
    
    await loadStatus(); // Refresh
    setLoading(false);
  }

  if (!tvStatus) return <div>Loading TV status...</div>;

  return (
    <div className="tv-controls">
      <h2>Fire TV Controls</h2>
      
      {Object.entries(tvStatus).map(([profile, data]) => (
        <div key={profile} className="tv-card">
          <h3>{data.name}</h3>
          <p>Device: {data.device.nickname}</p>
          <p>Status: {data.device.paused ? '🔴 Paused' : '🟢 Active'}</p>
          
          <button
            onClick={() => handleToggle(
              profile.charAt(0).toUpperCase() + profile.slice(1),
              data.device.paused
            )}
            disabled={loading}
          >
            {data.device.paused ? 'Unpause TV' : 'Pause TV'}
          </button>
        </div>
      ))}
    </div>
  );
}

export default ParentTVControls;
```

### Step 3: Add TV Status to Kid Dashboard

```javascript
import React, { useState, useEffect } from 'react';
import { getTVStatus } from '../utils/tvControl';

function KidDashboard({ kidName }) {
  const [tvStatus, setTvStatus] = useState(null);

  useEffect(() => {
    async function checkTV() {
      const status = await getTVStatus(kidName);
      setTvStatus(status);
    }
    
    checkTV();
    const interval = setInterval(checkTV, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [kidName]);

  return (
    <div className="kid-dashboard">
      <h1>Hi {kidName}!</h1>
      
      {/* TV Status Badge */}
      {tvStatus && (
        <div className={`tv-status ${tvStatus.device.paused ? 'paused' : 'active'}`}>
          <h3>📺 TV Status</h3>
          {tvStatus.device.paused ? (
            <p>🔴 TV is locked. Complete your chores to watch!</p>
          ) : (
            <p>🟢 TV is unlocked. Great job on your chores!</p>
          )}
        </div>
      )}
      
      {/* Rest of dashboard... */}
    </div>
  );
}
```

---

## 🎯 Recommended Automation Rules

Add these to your ChoreHero app logic:

### 1. **Daily Reset** (Run at midnight or morning)
```javascript
async function dailyReset() {
  await pauseTV('Rilyn');
  await pauseTV('Cael');
  // Kids start each day with TV paused
}
```

### 2. **Chore Completion Check** (Real-time)
```javascript
async function onChoreStatusChange(kidName) {
  const allComplete = await checkAllChoresComplete(kidName);
  
  if (allComplete) {
    await unpauseTV(kidName);
  } else {
    await pauseTV(kidName);
  }
}
```

### 3. **Parent Override** (Manual control)
```javascript
// Parent can manually pause/unpause from dashboard
async function parentOverride(kidName, shouldPause) {
  if (shouldPause) {
    await pauseTV(kidName);
  } else {
    await unpauseTV(kidName);
  }
}
```

---

## 📱 Test It Now!

### In Browser
Visit: https://chorehero-tv-api-dbaa97074fdf.herokuapp.com

### With cURL
```bash
# Get status
curl https://chorehero-tv-api-dbaa97074fdf.herokuapp.com/api/status/rilyn

# Pause TV
curl -X POST https://chorehero-tv-api-dbaa97074fdf.herokuapp.com/api/pause/rilyn

# Unpause TV
curl -X POST https://chorehero-tv-api-dbaa97074fdf.herokuapp.com/api/unpause/rilyn
```

### With JavaScript Console (in browser)
```javascript
// Test from browser console
fetch('https://chorehero-tv-api-dbaa97074fdf.herokuapp.com/api/pause/rilyn', {
  method: 'POST'
})
.then(r => r.json())
.then(console.log);
```

---

## 🔧 Monitoring

```bash
# View live logs
heroku logs --tail --app chorehero-tv-api

# Check app status
heroku ps --app chorehero-tv-api

# Restart if needed
heroku restart --app chorehero-tv-api
```

---

## 🎊 You're All Set!

Your Fire TV control API is live and ready to integrate into ChoreHero. Kids' TVs can now be automatically controlled based on chore completion!

**Next steps:**
1. Add the `tvControl.js` utility to your ChoreHero React app
2. Import and use in your chore completion logic
3. Add TV status indicators to kid dashboards
4. Create parent controls for manual override

Happy coding! 🚀
