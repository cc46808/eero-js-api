#!/usr/bin/env node
'use strict';

const Eero = require('./eero-api.js');
const e = new Eero();

const NETWORK_ID = '13591687';

const PROFILES = {
	rilyn: {
		profileUrl: '/2.2/networks/13591687/profiles/24696147',
		deviceUrl: '/2.2/networks/13591687/devices/d43a2e250680',
		name: 'Rilyn TV'
	},
	cael: {
		profileUrl: '/2.2/networks/13591687/profiles/24696184',
		deviceUrl: null, // Will be looked up dynamically
		name: 'Cael TV'
	}
};

async function getStatus(profileKey) {
	try {
		const profile = PROFILES[profileKey];
		if (!profile) {
			throw new Error(`Unknown profile: ${profileKey}`);
		}

		// Get device URL if not set (for Cael TV, find it dynamically)
		let deviceUrl = profile.deviceUrl;
		if (!deviceUrl) {
			const devices = await e._get(`/2.2/networks/${NETWORK_ID}/devices`);
			const profileDevices = devices.filter(d => d.profile && d.profile.url === profile.profileUrl);
			if (profileDevices.length > 0) {
				deviceUrl = profileDevices[0].url;
			} else {
				throw new Error(`No devices found in ${profile.name} profile`);
			}
		}

		const device = await e._get(deviceUrl);
		console.log(`=== ${profile.name.toUpperCase()} STATUS ===`);
		console.log(`Device: ${device.nickname}`);
		console.log(`Profile: ${device.profile.name}`);
		console.log(`Status: ${device.paused ? 'PAUSED' : 'ACTIVE'}`);
		console.log(`Connected: ${device.connected}`);
		console.log(`IP: ${device.ip}`);
	} catch (err) {
		console.error('Error:', err.message);
		process.exit(1);
	}
}

async function pause(profileKey) {
	try {
		const profile = PROFILES[profileKey];
		if (!profile) {
			throw new Error(`Unknown profile: ${profileKey}`);
		}

		const res = await e._put(profile.profileUrl, {paused: true});
		console.log(`✓ ${profile.name} paused successfully`);
		await getStatus(profileKey);
	} catch (err) {
		console.error(`Error pausing ${PROFILES[profileKey]?.name || profileKey}:`, err.message);
		process.exit(1);
	}
}

async function unpause(profileKey) {
	try {
		const profile = PROFILES[profileKey];
		if (!profile) {
			throw new Error(`Unknown profile: ${profileKey}`);
		}

		const res = await e._put(profile.profileUrl, {paused: false});
		console.log(`✓ ${profile.name} unpaused successfully`);
		await getStatus(profileKey);
	} catch (err) {
		console.error(`Error unpausing ${PROFILES[profileKey]?.name || profileKey}:`, err.message);
		process.exit(1);
	}
}

// Parse command line arguments
const command = process.argv[2];
const profileKey = process.argv[3] || 'rilyn'; // Default to rilyn if not specified

// Validate profile key
if (profileKey && !PROFILES[profileKey]) {
	console.error(`Error: Unknown profile '${profileKey}'. Valid profiles: ${Object.keys(PROFILES).join(', ')}`);
	process.exit(1);
}

switch(command) {
	case 'pause':
		pause(profileKey);
		break;
	case 'unpause':
		unpause(profileKey);
		break;
	case 'status':
		getStatus(profileKey);
		break;
	default:
		console.log('Fire TV Control');
		console.log('Usage: node firetv-control.js <command> [profile]');
		console.log('');
		console.log('Commands:');
		console.log('  pause [profile]    - Pause the Fire TV (blocks internet access)');
		console.log('  unpause [profile]  - Unpause the Fire TV (restores internet access)');
		console.log('  status [profile]   - Check current Fire TV status');
		console.log('');
		console.log('Profiles:');
		console.log('  rilyn  - Rilyn TV (default)');
		console.log('  cael   - Cael TV');
		console.log('');
		console.log('Examples:');
		console.log('  node firetv-control.js pause rilyn');
		console.log('  node firetv-control.js unpause cael');
		console.log('  node firetv-control.js status');
		process.exit(1);
}
