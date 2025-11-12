#!/usr/bin/env node
'use strict';

/**
 * Setup script for Heroku deployment
 * This ensures you're authenticated with Eero before deploying
 */

const Eero = require('./eero-api.js');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const e = new Eero();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function checkAuth() {
    try {
        const account = await e.account();
        console.log('✓ Already authenticated!');
        console.log(`  Account: ${account.name}`);
        console.log(`  Email: ${account.email.value}`);
        console.log(`  Phone: ${account.phone.value}`);
        return true;
    } catch (err) {
        console.log('✗ Not authenticated yet');
        return false;
    }
}

async function login() {
    console.log('\n--- Eero Authentication ---\n');
    
    const phone = await question('Enter your phone number for SMS verification: ');
    
    if (!phone) {
        console.log('Phone number required');
        process.exit(1);
    }
    
    try {
        await e.login(phone);
        console.log('SMS code sent to your phone');
        
        const code = await question('Enter the verification code you received: ');
        
        if (!code) {
            console.log('Verification code required');
            process.exit(1);
        }
        
        await e.loginVerify(code);
        console.log('✓ Login successful!');
        
        const account = await e.account();
        console.log(`  Account: ${account.name}`);
        console.log(`  Email: ${account.email.value}`);
        
        return true;
    } catch (err) {
        console.error('✗ Login failed:', err.message);
        return false;
    }
}

async function checkCookieFile() {
    const tmpDir = path.join(__dirname, '.tmp');
    const cookieFile = path.join(tmpDir, 'eero_cookies.json');
    
    if (fs.existsSync(cookieFile)) {
        const stats = fs.statSync(cookieFile);
        const size = stats.size;
        const modified = stats.mtime;
        
        console.log('\n--- Cookie File ---');
        console.log(`  Location: ${cookieFile}`);
        console.log(`  Size: ${size} bytes`);
        console.log(`  Last modified: ${modified}`);
        
        if (size > 0) {
            console.log('  Status: ✓ Ready for deployment');
            return true;
        } else {
            console.log('  Status: ✗ Empty file');
            return false;
        }
    } else {
        console.log('\n✗ Cookie file not found');
        return false;
    }
}

async function main() {
    console.log('=================================');
    console.log('   Eero ChoreHero Setup');
    console.log('=================================\n');
    
    console.log('Checking authentication status...\n');
    
    const isAuth = await checkAuth();
    
    if (!isAuth) {
        const shouldLogin = await question('\nWould you like to login now? (y/n): ');
        
        if (shouldLogin.toLowerCase() === 'y') {
            const success = await login();
            if (!success) {
                process.exit(1);
            }
        } else {
            console.log('\nPlease run "node sample.js" to authenticate first');
            process.exit(1);
        }
    }
    
    console.log('\n');
    await checkCookieFile();
    
    console.log('\n=================================');
    console.log('   Setup Complete!');
    console.log('=================================');
    console.log('\nNext steps:');
    console.log('  1. git add .');
    console.log('  2. git commit -m "Add Eero Fire TV control"');
    console.log('  3. git push heroku master');
    console.log('  4. heroku open');
    console.log('\nYour app will be available at:');
    console.log('  https://chorehero.herokuapp.com\n');
    
    rl.close();
}

main().catch(err => {
    console.error('Error:', err);
    rl.close();
    process.exit(1);
});
