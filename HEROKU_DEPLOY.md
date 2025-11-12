# Deploying to Heroku (ChoreHero)

## Prerequisites
- Heroku CLI installed
- Git installed
- Already authenticated with Eero (cookies stored locally)

## Deployment Steps

### 1. Login to Heroku
```bash
heroku login
```

### 2. Add Heroku remote (if not already added)
```bash
heroku git:remote -a chorehero
```

Or if you need to create the app:
```bash
heroku create chorehero
```

### 3. Copy your Eero cookies to the repo
Your Eero authentication cookies need to be deployed with the app. First, authenticate locally:

```bash
node sample.js
# Follow the login prompts
```

This creates a cookie file at `.tmp/eero_cookies.json` (or `/tmp/eero_cookies.json` on Linux/Mac).

**Important:** Make sure your cookies are fresh before deploying!

### 4. Deploy to Heroku
```bash
git add .
git commit -m "Add Fire TV control web interface"
git push heroku master
```

### 5. Open the app
```bash
heroku open
```

Or visit: https://chorehero.herokuapp.com

## Configuration

### Environment Variables
If you need to configure anything, you can set environment variables:

```bash
heroku config:set NETWORK_ID=13591687
```

### View logs
```bash
heroku logs --tail
```

## Important Notes

### Cookie Persistence
- Heroku's filesystem is **ephemeral** - it resets on each dyno restart
- Your cookies will be lost when:
  - The app restarts
  - Heroku does a dyno cycle (every 24 hours)
  - You deploy a new version

### Solutions for Cookie Persistence:

#### Option 1: Re-authenticate after restarts (Manual)
- You'll need to log in again after each restart
- Not ideal for production use

#### Option 2: Use Heroku Postgres to store cookies (Recommended)
We can modify the code to store cookies in Heroku Postgres instead of a file.

#### Option 3: Use environment variables
Store the cookie data in Heroku config vars (less secure but works):

```bash
# After logging in locally, extract the cookie
# Then set it as an environment variable
heroku config:set EERO_COOKIE="your_cookie_data"
```

Would you like me to implement Option 2 or 3?

## Testing Locally

Before deploying, test locally with Heroku's environment:

```bash
# Set the PORT environment variable
$env:PORT=3000  # PowerShell
# or
export PORT=3000  # Bash

# Run the server
npm start
```

## API Endpoints on Heroku

Once deployed, your API will be available at:

- `https://chorehero.herokuapp.com/` - Web interface
- `https://chorehero.herokuapp.com/api/status` - Get all device status
- `https://chorehero.herokuapp.com/api/status/rilyn` - Rilyn TV status
- `https://chorehero.herokuapp.com/api/status/cael` - Cael TV status
- `https://chorehero.herokuapp.com/api/pause/rilyn` - Pause Rilyn TV
- `https://chorehero.herokuapp.com/api/unpause/cael` - Unpause Cael TV

## Integration with ChoreHero

You can now call these endpoints from your ChoreHero app:

```javascript
// Example: Pause TV when chores aren't done
async function pauseTVForKid(kidName) {
  const profile = kidName.toLowerCase(); // 'rilyn' or 'cael'
  const response = await fetch(`https://chorehero.herokuapp.com/api/pause/${profile}`, {
    method: 'POST'
  });
  return response.json();
}

// Example: Unpause TV when chores are complete
async function unpauseTVForKid(kidName) {
  const profile = kidName.toLowerCase();
  const response = await fetch(`https://chorehero.herokuapp.com/api/unpause/${profile}`, {
    method: 'POST'
  });
  return response.json();
}
```

## Monitoring

Check if your app is working:

```bash
# Check dyno status
heroku ps

# View recent logs
heroku logs --tail

# Restart if needed
heroku restart
```
