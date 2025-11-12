# eero-js-api
JavaScript api for [eero](https://eero.com/) home mesh networks

This is an api for use with node or any other javascript platform to give access to the [eero](https://eero.com/) API. It is based on [eero-client from 343max](https://github.com/343max/eero-client) which does this in python. The *sample.js* cli lets you play with the api and see what the results look like. It also demonstrates how to use it.

## Web Interface (Easiest!)

Start the web server:
```bash
npm install
node web-server.js
```

Then open your browser to: **http://localhost:3000**

You'll see a beautiful web interface where you can:
- View status of all Fire TV devices
- Pause/unpause devices with a single click
- Auto-refresh every 30 seconds
- See device info (IP, connection status, etc.)

## Quick Start - Fire TV Control (Command Line)

Control your Fire TV devices with simple commands:

```bash
# Check status
node firetv-control.js status rilyn
node firetv-control.js status cael

# Pause (block internet access)
node firetv-control.js pause rilyn
node firetv-control.js pause cael

# Unpause (restore internet access)
node firetv-control.js unpause rilyn
node firetv-control.js unpause cael
```

Default profile is `rilyn`, so you can omit it:
```bash
node firetv-control.js pause        # pauses Rilyn TV
node firetv-control.js unpause      # unpauses Rilyn TV
```

## Cookies

Eero does not authenticate with simple user/password but rather through sending and receiving of tokens via text messages. That means, any application will need to negotiate with the api to receive a token. I've taken care of this behind the scenes by storing the results in a global cookie file. That may not be the most robust way of handling storage of the token but this was a quick first pass.

The cookie file is stored in /tmp an you can find the full name of the cookie file in the code. You will need to go through the login sequence to pass in your phone number and then enter the received code. The *sample.js* walks you through it but with a standalone app such as an IOT device, you'll need to get that code at setup time.

## REST API Endpoints

When running the web server (`node web-server.js`), you can also use the REST API from any HTTP client:

### Get All Devices Status
```bash
curl http://localhost:3000/api/status
```

### Get Specific Device Status
```bash
curl http://localhost:3000/api/status/rilyn
curl http://localhost:3000/api/status/cael
```

### Pause a Device
```bash
curl -X POST http://localhost:3000/api/pause/rilyn
curl -X POST http://localhost:3000/api/pause/cael
```

### Unpause a Device
```bash
curl -X POST http://localhost:3000/api/unpause/rilyn
curl -X POST http://localhost:3000/api/unpause/cael
```

You can integrate these APIs with:
- Home Assistant
- Node-RED
- IFTTT webhooks
- Custom automation scripts
- Any HTTP client

## Running the sample

You must have node installed along with npm.

1. clone this repo
2. npm install
3. node sample.js
    * if you want some debug messages: DEBUG=* node sample js

That should be enough to get you started. This was my first node app so I welcome feedback and contributions to make it better.
