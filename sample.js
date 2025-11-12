'use strict';

const Eero = require('./eero-api.js')
const debug = require('debug')('eero-sample')
const readline = require('readline')
let urlIdPattern = new RegExp(/^\/(.+)\/(.+)\/(\d+)/)
const eeroDevice = new Eero();

var eprompt = 'eero> '
let rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: true,
	prompt: eprompt
})

var e = new Eero();
var netops = []
var options = []
var networkUrl = null
var curUrl = null

console.log('Starting eero manager...')
// get default account path
account()
rl.prompt()


function idFromUrl(url) {
	let res = urlIdPattern.exec(url)
	if (res.length >= 4) {
		return res[3]
	}
	return null
}

function setPrompt(p) {
	eprompt = p
	rl.setPrompt(eprompt)
}

function println(data) {
	console.log(data)
}

function quit() {
	println("exiting")
	rl.close()
	console.log()
	process.exit()
}

function logout() {
	e.logout()
}

function login() {
	rl.question('Enter your phone # for SMS verification: ', 
		phone => {
			if (phone) {
				e.login(phone)
				rl.question('Enter the code you received: ', 
					verify => {
						if (verify) {
							e.loginVerify(verify)
								.then(() => {
									println("Logged in")
									rl.prompt()
								})
								.catch(err => {
									println(`Verify failed: ${err.message}`)
									rl.prompt()
								})
						}
						else {
							console.log("No code entered")
						}
						rl.prompt()
					})
			}
			else {
				console.log("No phone # given")
			}
			rl.prompt()
		})
}

// After login and getting your network...
// eeroDevice.eeros(networkUrl).then(eeros => {
//     // List all eeros and their IDs
//     console.log(eeros);
    
//     // Pick the device ID you want to reboot
//     const deviceId = eeros[0].url.split('/').pop(); // or manually specify
    
//     // Reboot it
//     //return eero.reboot(deviceId);
// }).then(result => {
//     console.log('Reboot initiated:', result);
// });

function account() {
	e.account().then(account => {
		println("Logged into account")
		println(account)
		if (account.networks.data.length == 1) {
			// only one account, use it
			networkUrl = account.networks.data[0].url
		}
		else {
			networkUrl = null
			if (!networkUrl) {
				var ind = 1
				for (const net of account.networks.data) {
					println(`${ind++}) ${net.name}`);
				}
				rl.question(`Enter the network to use: (1-${ind-1})`,
					netInd => {
						if (netInd <= ind-1) {
							networkUrl = account.networks.data[netInd-1].url
							println(`Using network: ${account.networks.data[netInd-1].name} (${networkUrl})`)
						}
						else {
							println("Not a valid network")
						}
						rl.prompt()
					})

			}
		}
		rl.prompt()
	}).catch(err => {
		console.log(`Error ${err.message}`)
		// no account, need to log in
		login()
	})
}

function network() {
	e.network(networkUrl)
		.then(nets => {
			println(nets)
			println("===== Available commands for this network =====")
			netops = nets.resources
			for (const prop in netops) {
				println(prop)
			}
			rl.prompt()
		})
		.catch(err => {
			println(`Error: ${err.message}`)
			rl.prompt()
		})
}

function networks() {
	e.networks()
		.then(nets => {
			println(nets)
			rl.prompt()
		})
		.catch(err => {
			println(`Error: ${err.message}`)
			rl.prompt()
		})

}

function eeros(networkUrl) {
	e.eeros(networkUrl)
		.then(eeros => {
			println("===================== EEROS =====================")
			options = []
			var ind = 1
			for (const eero of eeros) {
				println(`\n${ind}) Location: ${eero.location}`)
				println(`   Model: ${eero.model}`)
				println(`   Status: ${eero.status}`)
				println(`   URL: ${eero.url}`)
				options.push({ url: eero.url, type: 'eero' })
				ind++
			}
			println("\nUse 'reboot_eero <#>', 'led_on <#>', 'led_off <#>', or 'connections <#>'")
			rl.prompt()
		})
		.catch(err => {
			println(`Error: ${err.message}`)
			rl.prompt()
		})
}

function devices(networkUrl) {
	e.devices(networkUrl)
		.then(devices => {
			println("")
			var url = devices.url
			var types = []
			for (const dev of devices) {
				if (!dev.connected) {
					continue;
				}
				if (!types[dev.device_type]) {
					types[dev.device_type] = { 'count': 1, 'devices': [dev] }
				}
				else {
					types[dev.device_type].count += 1
					types[dev.device_type].devices.push(dev)
				}
			}

			options = []
			var ind = 1
			// Calculate column widths
			let maxNameLen = 4; // "NAME"
			let maxMfgLen = 12; // "MANUFACTURER"
			let maxConnLen = 10; // "CONNECTION"
			let maxHostLen = 8; // "HOSTNAME"
			let maxTypeLen = 4; // "TYPE"
			let maxPausedLen = 6; // "PAUSED"
			let maxIpLen = 10; // "IP ADDRESS"
			let maxUrlLen = 3; // "URL"
			
			for (const type in types) {
				maxTypeLen = Math.max(maxTypeLen, type.length);
				for (const typedev of types[type].devices) {
					maxNameLen = Math.max(maxNameLen, (typedev.nickname || '--').length);
					maxMfgLen = Math.max(maxMfgLen, (typedev.manufacturer || '--').length);
					maxConnLen = Math.max(maxConnLen, (typedev.connection_type || '--').length);
					maxHostLen = Math.max(maxHostLen, (typedev.hostname || '--').length);
					maxPausedLen = Math.max(maxPausedLen, (typedev.paused ? 'Yes' : 'No').length);
					maxIpLen = Math.max(maxIpLen, (typedev.ip || '--').length);
					maxUrlLen = Math.max(maxUrlLen, (typedev.url || '--').length);
				}
			}
			
			// Print header
			println(`${'#'.padEnd(4)} ${'NAME'.padEnd(maxNameLen)} ${'MANUFACTURER'.padEnd(maxMfgLen)} ${'CONNECTION'.padEnd(maxConnLen)} ${'HOSTNAME'.padEnd(maxHostLen)} ${'TYPE'.padEnd(maxTypeLen)} ${'PAUSED'.padEnd(maxPausedLen)} ${'IP ADDRESS'.padEnd(maxIpLen)} ${'URL'.padEnd(maxUrlLen)}`);
			println('-'.repeat(4 + maxNameLen + maxMfgLen + maxConnLen + maxHostLen + maxTypeLen + maxPausedLen + maxIpLen + maxUrlLen + 9));
			
			// Print devices
			for (const type in types) {
				for (const typedev of types[type].devices) {
					println(`${(ind++).toString().padEnd(4)} ${(typedev.nickname || '--').padEnd(maxNameLen)} ${(typedev.manufacturer || '--').padEnd(maxMfgLen)} ${(typedev.connection_type || '--').padEnd(maxConnLen)} ${(typedev.hostname || '--').padEnd(maxHostLen)} ${type.padEnd(maxTypeLen)} ${(typedev.paused ? 'Yes' : 'No').padEnd(maxPausedLen)} ${(typedev.ip || '--').padEnd(maxIpLen)} ${(typedev.url || '--').padEnd(maxUrlLen)}`);
					options.push({ url: typedev.url });
				}
			}
			rl.prompt()
		})
		.catch(err => {
			println(`Error: ${err.message}`)
			rl.prompt()
		})
}

function profiles(networkUrl) {
	e.profiles(networkUrl)
		.then(profiles => {
			println("########### PROFILES ###############")
			options = []
			var ind = 1
			for (const profile of profiles) {
				println(`\n${ind}) Profile: ${profile.name}`)
				println(`   Paused: ${profile.paused}`)
				println(`   Devices: ${profile.devices ? profile.devices.length : 0}`)
				println(`   Schedules: ${profile.schedule ? profile.schedule.length : 0}`)
				println(`   URL: ${profile.url}`)
				options.push({ url: profile.url, type: 'profile' })
				ind++
			}
			println("\nUse 'pause_profile <#>', 'unpause_profile <#>', or 'schedules <#>'")
			rl.prompt()
		})
		.catch(err => {
			println(`Error: ${err.message}`)
			rl.prompt()
		})
}

function rebootEero(eeroNum) {
	if (options[eeroNum-1] && options[eeroNum-1].type === 'eero') {
		let eeroUrl = options[eeroNum-1].url
		e.rebootEero(eeroUrl)
			.then(res => {
				println(`Eero rebooting...`)
				println(res)
				rl.prompt()
			})
			.catch(err => {
				println(`Error rebooting eero: ${err.message}`)
				rl.prompt()
			})
	} else {
		println(`Invalid eero number. Run 'eeros' first.`)
		rl.prompt()
	}
}

function ledOn(eeroNum) {
	if (options[eeroNum-1] && options[eeroNum-1].type === 'eero') {
		let eeroUrl = options[eeroNum-1].url
		e.eeroLed(eeroUrl, 'on')
			.then(res => {
				println(`Eero LED turned on`)
				println(res)
				rl.prompt()
			})
			.catch(err => {
				println(`Error controlling LED: ${err.message}`)
				rl.prompt()
			})
	} else {
		println(`Invalid eero number. Run 'eeros' first.`)
		rl.prompt()
	}
}

function ledOff(eeroNum) {
	if (options[eeroNum-1] && options[eeroNum-1].type === 'eero') {
		let eeroUrl = options[eeroNum-1].url
		e.eeroLed(eeroUrl, 'off')
			.then(res => {
				println(`Eero LED turned off`)
				println(res)
				rl.prompt()
			})
			.catch(err => {
				println(`Error controlling LED: ${err.message}`)
				rl.prompt()
			})
	} else {
		println(`Invalid eero number. Run 'eeros' first.`)
		rl.prompt()
	}
}

function connections(eeroNum) {
	if (options[eeroNum-1] && options[eeroNum-1].type === 'eero') {
		let eeroUrl = options[eeroNum-1].url
		e.eeroConnections(eeroUrl)
			.then(res => {
				println(`Devices connected to this eero:`)
				println(res)
				rl.prompt()
			})
			.catch(err => {
				println(`Error getting connections: ${err.message}`)
				rl.prompt()
			})
	} else {
		println(`Invalid eero number. Run 'eeros' first.`)
		rl.prompt()
	}
}

function schedules(profileNum) {
	if (options[profileNum-1] && options[profileNum-1].type === 'profile') {
		let profileUrl = options[profileNum-1].url
		e.profileSchedules(profileUrl)
			.then(schedules => {
				println(`\n========== SCHEDULES ==========`)
				for (const sched of schedules) {
					println(`\nName: ${sched.name}`)
					println(`Enabled: ${sched.enabled}`)
					println(`Days: ${sched.days.join(', ')}`)
					println(`Time: ${sched.start} - ${sched.end}`)
					println(`URL: ${sched.url}`)
				}
				rl.prompt()
			})
			.catch(err => {
				println(`Error getting schedules: ${err.message}`)
				rl.prompt()
			})
	} else {
		println(`Invalid profile number. Run 'profiles' first.`)
		rl.prompt()
	}
}

function pauseProfile(profileNum) {
	if (options[profileNum-1] && options[profileNum-1].type === 'profile') {
		let profileUrl = options[profileNum-1].url
		e.pause(profileUrl)
			.then(res => {
				println(`Profile paused successfully`)
				println(res)
				rl.prompt()
			})
			.catch(err => {
				println(`Error pausing profile: ${err.message}`)
				rl.prompt()
			})
	} else {
		println(`Invalid profile number. Run 'profiles' first.`)
		rl.prompt()
	}
}

function unpauseProfile(profileNum) {
	if (options[profileNum-1] && options[profileNum-1].type === 'profile') {
		let profileUrl = options[profileNum-1].url
		e.unpause(profileUrl)
			.then(res => {
				println(`Profile unpaused successfully`)
				println(res)
				rl.prompt()
			})
			.catch(err => {
				println(`Error unpausing profile: ${err.message}`)
				rl.prompt()
			})
	} else {
		println(`Invalid profile number. Run 'profiles' first.`)
		rl.prompt()
	}
}

function pause(deviceNum) {
	if (options[deviceNum-1]) {
		let deviceUrl = options[deviceNum-1].url
		e.pause(deviceUrl)
			.then(res => {
				println(`Device pause request sent`)
				println(`API Response:`)
				println(JSON.stringify(res, null, 2))
				rl.prompt()
			})
			.catch(err => {
				println(`Error pausing device: ${err.message}`)
				rl.prompt()
			})
	}
	else {
		println(`Invalid device number. Run 'devices' first to see available devices.`)
		rl.prompt()
	}
}

function unpause(deviceNum) {
	if (options[deviceNum-1]) {
		let deviceUrl = options[deviceNum-1].url
		e.unpause(deviceUrl)
			.then(res => {
				println(`Device unpause request sent`)
				println(`API Response:`)
				println(JSON.stringify(res, null, 2))
				rl.prompt()
			})
			.catch(err => {
				println(`Error unpausing device: ${err.message}`)
				rl.prompt()
			})
	}
	else {
		println(`Invalid device number. Run 'devices' first to see available devices.`)
		rl.prompt()
	}
}

function deleteDevice(deviceNum) {
	if (options[deviceNum-1]) {
		let deviceUrl = options[deviceNum-1].url
		e.deleteDevice(deviceUrl)
			.then(res => {
				println(`Device deleted successfully`)
				println(res)
				rl.prompt()
			})
			.catch(err => {
				println(`Error deleting device: ${err.message}`)
				rl.prompt()
			})
	}
	else {
		println(`Invalid device number. Run 'devices' first to see available devices.`)
		rl.prompt()
	}
}

function pauseFireTV() {
	const fireTVProfileUrl = '/2.2/networks/13591687/profiles/24696147'
	e._put(fireTVProfileUrl, {paused: true})
		.then(res => {
			println(`Fire TV paused successfully (via ${res.name} profile)`)
			rl.prompt()
		})
		.catch(err => {
			println(`Error pausing Fire TV: ${err.message}`)
			rl.prompt()
		})
}

function unpauseFireTV() {
	const fireTVProfileUrl = '/2.2/networks/13591687/profiles/24696147'
	e._put(fireTVProfileUrl, {paused: false})
		.then(res => {
			println(`Fire TV unpaused successfully (via ${res.name} profile)`)
			rl.prompt()
		})
		.catch(err => {
			println(`Error unpausing Fire TV: ${err.message}`)
			rl.prompt()
		})
}

function pauseCaelTV() {
	const caelTVProfileUrl = '/2.2/networks/13591687/profiles/24696184'
	e._put(caelTVProfileUrl, {paused: true})
		.then(res => {
			println(`Cael TV paused successfully (via ${res.name} profile)`)
			rl.prompt()
		})
		.catch(err => {
			println(`Error pausing Cael TV: ${err.message}`)
			rl.prompt()
		})
}

function unpauseCaelTV() {
	const caelTVProfileUrl = '/2.2/networks/13591687/profiles/24696184'
	e._put(caelTVProfileUrl, {paused: false})
		.then(res => {
			println(`Cael TV unpaused successfully (via ${res.name} profile)`)
			rl.prompt()
		})
		.catch(err => {
			println(`Error unpausing Cael TV: ${err.message}`)
			rl.prompt()
		})
}

function doOption(optNum) {
	if (options[optNum-1]) {
		let url = options[optNum -1].url
		e.get(url)
			.then(res => {
				debug("got option %s: %s", optNum, url)
				println(res)

				if (res.resources) {
					options = []
					var ind = 1
					for (const ropt in res.resources) {
						println(`${ind++}) ${ropt}`)
						options.push(ropt)
					}
				}
				rl.prompt()
			})
			.catch(err => {
				println(`Error: ${err.message}`)
				rl.prompt()
			})

	}
}

function callUrl(url) {
	e.get(url)
		.then(res => {
			debug("URL %s:", url, res)
			rl.prompt()
		})
		.catch(err => {
			println(`Error: ${err.message}`)
			rl.prompt()
		})
}

function callCmd(cmd) {
	let url = netops[cmd]
	if (url) {
		e.get(url).then(res => {
			debug("CMD %s:", cmd, res)
			rl.prompt()
		})
		.catch(err => {
			println(`Error: ${err.message}`)
			rl.prompt()
		})
	}
}

rl
	.on('line', line => {
		let cmd = line.trim()
		switch(cmd) {
			case 'help':
			case '?':
				console.log("Commands:")
				console.log("  account | networks | network | eeros | devices | profiles | insights")
				console.log("  pause <#> | unpause <#> | delete <#>")
				console.log("  reboot_eero <#> | led_on <#> | led_off <#> | connections <#>")
				console.log("  pause_profile <#> | unpause_profile <#> | schedules <#>")
				console.log("  pause_rilyn_tv | unpause_rilyn_tv | pause_cael_tv | unpause_cael_tv")
				console.log("  pause_firetv | unpause_firetv  (alias for pause_rilyn_tv)")
				console.log("  login | logout | help | quit")
				break;
			case 'exit':
			case 'quit': rl.close()
				break
			case 'login': login()
				break
			case 'logout': logout()
				break
			case 'account': account()
				break
			case 'networks': networks()
				break
			case 'network': network()
				break
			case 'eeros': eeros(networkUrl)
				break
			case 'devices': devices(networkUrl)
				break
			case 'profiles': profiles(networkUrl)
				break
			case 'insights': insights(networkUrl)
				break
			case 'ac_compat': ac_compat(networkUrl)
				break
			case 'burst_reporters': burst_reporters(networkUrl)
				break
			case 'blacklist': device_blacklist(networkUrl)
				break
			case 'diagnostics': diagnostics(networkUrl)
				break
			case 'forwards': forwards(networkUrl)
				break
			case 'ouicheck': ouicheck(networkUrl)
				break
			case 'guestnetwork': guestnetwork(networkUrl)
				break
			case 'password': password(networkUrl)
				break
			case 'profiles': profiles(networkUrl)
				break
			case 'reservations': reservations(networkUrl)
				break
			case 'settings': settings(networkUrl)
				break
			case 'speedtest': speedtest(networkUrl)
				break
			case 'transfer': transfer(networkUrl)
				break
			case 'updates': updates(networkUrl)
				break
			case 'reboot': reboot(networkUrl)
				break
			case 'support': support(networkUrl)
				break
			case 'insights': insights(networkUrl)
				break
			case 'routing': routing(networkUrl)
				break
			case 'thread': thread(networkUrl)
				break
			case 'pause_firetv':
				pauseFireTV()
				break
			case 'unpause_firetv':
				unpauseFireTV()
				break
			case 'pause_rilyn_tv':
				pauseFireTV()
				break
			case 'unpause_rilyn_tv':
				unpauseFireTV()
				break
			case 'pause_cael_tv':
				pauseCaelTV()
				break
			case 'unpause_cael_tv':
				unpauseCaelTV()
				break
			default:
				if (/^pause\s+(\d+)$/.test(cmd)) {
					let match = /^pause\s+(\d+)$/.exec(cmd)
					pause(parseInt(match[1]))
				}
				else if (/^unpause\s+(\d+)$/.test(cmd)) {
					let match = /^unpause\s+(\d+)$/.exec(cmd)
					unpause(parseInt(match[1]))
				}
				else if (/^delete\s+(\d+)$/.test(cmd)) {
					let match = /^delete\s+(\d+)$/.exec(cmd)
					deleteDevice(parseInt(match[1]))
				}
				else if (/^reboot_eero\s+(\d+)$/.test(cmd)) {
					let match = /^reboot_eero\s+(\d+)$/.exec(cmd)
					rebootEero(parseInt(match[1]))
				}
				else if (/^led_on\s+(\d+)$/.test(cmd)) {
					let match = /^led_on\s+(\d+)$/.exec(cmd)
					ledOn(parseInt(match[1]))
				}
				else if (/^led_off\s+(\d+)$/.test(cmd)) {
					let match = /^led_off\s+(\d+)$/.exec(cmd)
					ledOff(parseInt(match[1]))
				}
				else if (/^connections\s+(\d+)$/.test(cmd)) {
					let match = /^connections\s+(\d+)$/.exec(cmd)
					connections(parseInt(match[1]))
				}
				else if (/^pause_profile\s+(\d+)$/.test(cmd)) {
					let match = /^pause_profile\s+(\d+)$/.exec(cmd)
					pauseProfile(parseInt(match[1]))
				}
				else if (/^unpause_profile\s+(\d+)$/.test(cmd)) {
					let match = /^unpause_profile\s+(\d+)$/.exec(cmd)
					unpauseProfile(parseInt(match[1]))
				}
				else if (/^schedules\s+(\d+)$/.test(cmd)) {
					let match = /^schedules\s+(\d+)$/.exec(cmd)
					schedules(parseInt(match[1]))
				}
				else if (/^\d+$/.test(cmd)) {
					doOption(cmd)
				}
				else if (/^\//.test(cmd)) {
					// starts with slash, it's a url, call it
					callUrl(cmd)
				}
				else if (cmd.length > 0) {
					callCmd(cmd)
				}
		}
		rl.prompt()
	})
	.on('close', () => {
		quit()
		// println('exiting')
		// process.exit()
	})

