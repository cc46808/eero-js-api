#!/usr/bin/env node
'use strict';

const express = require('express');
const Eero = require('./eero-api.js');
const e = new Eero();

const app = express();
const PORT = process.env.PORT || 3000;

const NETWORK_ID = '13591687';
const PROFILES = {
	rilyn: {
		profileUrl: '/2.2/networks/13591687/profiles/24696147',
		name: 'Rilyn TV'
	},
	cael: {
		profileUrl: '/2.2/networks/13591687/profiles/24696184',
		name: 'Cael TV'
	}
};

// CORS middleware - Allow requests from ChoreHero
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*'); // Allow all origins (or specify 'https://app.chorehero.cloud')
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	
	// Handle preflight requests
	if (req.method === 'OPTIONS') {
		return res.sendStatus(200);
	}
	
	next();
});

// Serve static files (HTML/CSS/JS)
app.use(express.static('public'));
app.use(express.json());

// Get status for a profile
app.get('/api/status/:profile', async (req, res) => {
	try {
		const profileKey = req.params.profile;
		const profile = PROFILES[profileKey];
		
		if (!profile) {
			return res.status(404).json({ error: `Unknown profile: ${profileKey}` });
		}

		// Find device in this profile
		const devices = await e._get(`/2.2/networks/${NETWORK_ID}/devices`);
		const profileDevices = devices.filter(d => d.profile && d.profile.url === profile.profileUrl);
		
		if (profileDevices.length === 0) {
			return res.status(404).json({ error: `No devices found in ${profile.name} profile` });
		}

		const device = profileDevices[0];
		res.json({
			profile: profileKey,
			name: profile.name,
			device: {
				nickname: device.nickname,
				mac: device.mac,
				ip: device.ip,
				connected: device.connected,
				paused: device.paused
			}
		});
	} catch (err) {
		console.error('Error getting status:', err);
		res.status(500).json({ error: err.message });
	}
});

// Pause a profile
app.post('/api/pause/:profile', async (req, res) => {
	try {
		const profileKey = req.params.profile;
		const profile = PROFILES[profileKey];
		
		if (!profile) {
			return res.status(404).json({ error: `Unknown profile: ${profileKey}` });
		}

		await e._put(profile.profileUrl, { paused: true });
		res.json({ 
			success: true, 
			message: `${profile.name} paused successfully`,
			profile: profileKey
		});
	} catch (err) {
		console.error('Error pausing:', err);
		res.status(500).json({ error: err.message });
	}
});

// Login - Step 1: Send verification code
app.post('/api/login', async (req, res) => {
	try {
		const { phoneNumber } = req.body;
		
		if (!phoneNumber) {
			return res.status(400).json({ error: 'Phone number is required' });
		}

		await e.login(phoneNumber);
		res.json({ 
			success: true, 
			message: 'Verification code sent to your phone',
			phoneNumber
		});
	} catch (err) {
		console.error('Error sending login code:', err);
		res.status(500).json({ error: err.message });
	}
});

// Login - Step 2: Verify code and authenticate
app.post('/api/login/verify', async (req, res) => {
	try {
		const { code } = req.body;
		
		if (!code) {
			return res.status(400).json({ error: 'Verification code is required' });
		}

		await e.loginVerify(code);
		res.json({ 
			success: true, 
			message: 'Successfully authenticated! Cookie saved.',
		});
	} catch (err) {
		console.error('Error verifying code:', err);
		res.status(500).json({ 
			error: err.message,
			hint: 'Make sure the code is correct and hasn\'t expired'
		});
	}
});

// Check authentication status
app.get('/api/auth/status', async (req, res) => {
	try {
		const isLoggedIn = e._loggedIn();
		res.json({ 
			authenticated: isLoggedIn,
			message: isLoggedIn ? 'Authenticated' : 'Not authenticated - please login'
		});
	} catch (err) {
		console.error('Error checking auth:', err);
		res.status(500).json({ error: err.message });
	}
});

// Unpause a profile
app.post('/api/unpause/:profile', async (req, res) => {
	try {
		const profileKey = req.params.profile;
		const profile = PROFILES[profileKey];
		
		if (!profile) {
			return res.status(404).json({ error: `Unknown profile: ${profileKey}` });
		}

		await e._put(profile.profileUrl, { paused: false });
		res.json({ 
			success: true, 
			message: `${profile.name} unpaused successfully`,
			profile: profileKey
		});
	} catch (err) {
		console.error('Error unpausing:', err);
		res.status(500).json({ error: err.message });
	}
});

// Unpause a profile when ready (waits for device to be paused first)
app.post('/api/unpause-when-ready/:profile', async (req, res) => {
	try {
		const profileKey = req.params.profile;
		const profile = PROFILES[profileKey];
		
		if (!profile) {
			return res.status(404).json({ error: `Unknown profile: ${profileKey}` });
		}

		console.log(`[${profile.name}] Starting unpause-when-ready process...`);
		
		// Helper function to check if device is paused
		const getDevicePausedStatus = async () => {
			const devices = await e._get(`/2.2/networks/${NETWORK_ID}/devices`);
			const profileDevices = devices.filter(d => d.profile && d.profile.url === profile.profileUrl);
			
			if (profileDevices.length === 0) {
				throw new Error(`No devices found in ${profile.name} profile`);
			}
			
			return profileDevices[0].paused;
		};
		
		// Poll until device is paused, then unpause it
		const maxAttempts = 30; // 30 minutes max (30 attempts * 60 seconds)
		let attempts = 0;
		
		const pollAndUnpause = async () => {
			attempts++;
			console.log(`[${profile.name}] Polling attempt ${attempts}/${maxAttempts}...`);
			
			try {
				const isPaused = await getDevicePausedStatus();
				
				if (!isPaused) {
					console.log(`[${profile.name}] Device not paused yet...`);
					
					if (attempts >= maxAttempts) {
						console.error(`[${profile.name}] Max attempts reached without device being paused`);
						return false;
					}
					
					// Wait 60 seconds and try again
					await new Promise(resolve => setTimeout(resolve, 60000));
					return pollAndUnpause();
				}
				
				// Device is paused, now unpause it
				console.log(`[${profile.name}] Device is paused, unpausing now...`);
				await e._put(profile.profileUrl, { paused: false });
				console.log(`[${profile.name}] Successfully unpaused!`);
				return true;
			} catch (err) {
				console.error(`[${profile.name}] Error during polling:`, err);
				
				if (attempts >= maxAttempts) {
					throw err;
				}
				
				// Wait 60 seconds and try again
				await new Promise(resolve => setTimeout(resolve, 60000));
				return pollAndUnpause();
			}
		};
		
		// Start the polling process (this will run in the background)
		const success = await pollAndUnpause();
		
		if (success) {
			res.json({ 
				success: true, 
				message: `${profile.name} unpaused successfully after waiting for pause`,
				profile: profileKey
			});
		} else {
			res.status(408).json({ 
				error: `Timeout waiting for ${profile.name} to be paused`,
				profile: profileKey
			});
		}
	} catch (err) {
		console.error('Error in unpause-when-ready:', err);
		res.status(500).json({ error: err.message });
	}
});

// Get all profiles status
app.get('/api/status', async (req, res) => {
	try {
		const result = {};
		
		for (const [key, profile] of Object.entries(PROFILES)) {
			const devices = await e._get(`/2.2/networks/${NETWORK_ID}/devices`);
			const profileDevices = devices.filter(d => d.profile && d.profile.url === profile.profileUrl);
			
			if (profileDevices.length > 0) {
				const device = profileDevices[0];
				result[key] = {
					name: profile.name,
					device: {
						nickname: device.nickname,
						mac: device.mac,
						ip: device.ip,
						connected: device.connected,
						paused: device.paused
					}
				};
			}
		}
		
		res.json(result);
	} catch (err) {
		console.error('Error getting all status:', err);
		res.status(500).json({ error: err.message });
	}
});

app.listen(PORT, () => {
	console.log(`Eero Fire TV Control Server running at http://localhost:${PORT}`);
	console.log(`API endpoints:`);
	console.log(`  GET  /api/status           - Get all profiles status`);
	console.log(`  GET  /api/status/:profile  - Get specific profile status`);
	console.log(`  POST /api/pause/:profile   - Pause a profile`);
	console.log(`  POST /api/unpause/:profile - Unpause a profile`);
	console.log(`\nWeb interface available at http://localhost:${PORT}`);
});
